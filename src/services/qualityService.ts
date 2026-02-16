import { TokenCoverageService } from './tokenCoverageService';
import { ComponentService } from './componentService';
import { VariableService } from './variableService';
import { TailwindV4Service } from './tailwindV4Service';
import { QualityReportCache } from './cacheService';
import { ErrorHandler } from '../utils/errorHandler';

export interface QualityReport {
  meta: {
    totalNodes: number;
    scanDuration: number;
    scope: string;
    timestamp: number;
  };
  metrics: {
    tokenCoverage: any;
    componentHygiene: any;
    variableHygiene: any;
    tailwindReadiness?: any;
  };
  score: {
    total: number;
    breakdown: { [key: string]: number };
  };
}

export class QualityService {
  private static docVersion = 0;

  /**
   * Bump the document version and clear the quality report cache.
   * Call this whenever variables or tokens change in Figma.
   */
  static invalidateCache(): void {
    QualityService.docVersion++;
    QualityReportCache.getInstance().clear();
    console.log(`[QualityService] Cache invalidated. docVersion=${QualityService.docVersion}`);
  }

  /**
   * Generates a comprehensive quality report by aggregating results from all services.
   * This eliminates race conditions by ensuring all data is ready before returning.
   */
  static async generateReport(
    scope: 'SELECTION' | 'PAGE' | 'ALL' | 'SMART_SCAN',
    pageIds?: string[],
    exportFormat: string = 'css',
    forceRefresh: boolean = false
  ): Promise<QualityReport> {
    return await ErrorHandler.withErrorHandling(
      async () => {
        // Check cache first (skip if forceRefresh or SELECTION scope — selection
        // contents aren't captured in the cache key so different selections collide)
        const cache = QualityReportCache.getInstance();
        const cacheKey = QualityReportCache.generateKey(scope, pageIds, exportFormat, QualityService.docVersion);
        const cacheable = scope !== 'SELECTION';

        if (!forceRefresh && cacheable) {
          const cached = cache.get(cacheKey);
          if (cached) {
            console.log(`[QualityService] Cache HIT for key=${cacheKey}`);
            return cached;
          }
        }
        console.log(`[QualityService] Cache ${forceRefresh ? 'BYPASS (forceRefresh)' : !cacheable ? 'SKIP (SELECTION scope)' : 'MISS'}. Running full analysis.`);

        const startTime = Date.now();
        console.log(`[QualityService] Starting analysis. Scope: ${scope}`);

        // 1. Determine Token Coverage Strategy
        let tokenPromise;
        if (scope === 'ALL') {
            tokenPromise = TokenCoverageService.analyzeDocument(exportFormat, pageIds);
        } else if (scope === 'SELECTION') {
            tokenPromise = TokenCoverageService.analyzeSelection(exportFormat);
        } else if (scope === 'SMART_SCAN') {
            tokenPromise = TokenCoverageService.analyzeSmart(exportFormat, pageIds);
        } else {
            tokenPromise = TokenCoverageService.analyzeCurrentPage(exportFormat);
        }

        // 2. Run analyses in parallel (include TailwindV4Service when relevant)
        const isTailwind = exportFormat === 'tailwind-v4';
        const promises: [Promise<any>, Promise<any>, Promise<any>, Promise<any> | Promise<null>] = [
           tokenPromise,
           ComponentService.analyzeHygiene(pageIds),
           VariableService.analyzeHygiene(pageIds),
           isTailwind ? TailwindV4Service.validateVariableGroups() : Promise.resolve(null)
        ];

        const [tokenResult, componentResult, variableResult, tailwindGroupResult] = await Promise.all(promises);

        // 3. Aggregate Results
        const duration = Date.now() - startTime;
        console.log(`[QualityService] Analysis complete in ${duration}ms`);

        // 4. Extract scores
        const tokenScore = tokenResult.subScores?.tokenCoverage || 0;
        const tailwindScore = tokenResult.subScores?.tailwindReadiness || 0;
        const componentScore = componentResult.subScores?.componentHygiene || 0;
        const variableScore = variableResult.subScores?.variableHygiene || 0;

        // 5. Calculate Weighted Total (Backend truth)
        const totalScore = Math.round(
            (tokenScore * 0.4) +
            (tailwindScore * 0.2) +
            (componentScore * 0.2) +
            (variableScore * 0.2)
        );

        // 6. Build tailwind validation from grouped result when available,
        //    falling back to flat tokenResult.tailwindValidation otherwise
        const tailwindValidation = tailwindGroupResult
          ? {
              ...tailwindGroupResult,
              totalInvalid: tokenResult.tailwindValidation?.totalInvalid ?? tailwindGroupResult.invalidGroups?.length ?? 0,
              totalVariables: tokenResult.tailwindValidation?.totalVariables ?? 0,
              readinessScore: tailwindScore,
            }
          : tokenResult.tailwindValidation;

        const report: QualityReport = {
          meta: {
            totalNodes: tokenResult.totalNodes || 0,
            scanDuration: duration,
            scope: scope,
            timestamp: Date.now()
          },
          metrics: {
            tokenCoverage: tokenResult,
            componentHygiene: componentResult,
            variableHygiene: variableResult,
            tailwindReadiness: {
                 score: tailwindScore,
                 validation: tailwindValidation
            }
          },
          score: {
            total: totalScore,
            breakdown: {
                tokenCoverage: tokenScore,
                tailwindReadiness: tailwindScore,
                componentHygiene: componentScore,
                variableHygiene: variableScore
            }
          }
        };

        // Store in cache (skip SELECTION scope — key can't capture selection contents)
        if (cacheable) {
          cache.set(cacheKey, report);
          console.log(`[QualityService] Report cached with key=${cacheKey}`);
        }

        return report;
      },
      {
        operation: 'generate_quality_report',
        component: 'QualityService',
        severity: 'high',
      }
    );
  }
}
