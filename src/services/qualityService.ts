import { TokenCoverageService } from './tokenCoverageService';
import { ComponentService } from './componentService';
import { VariableService } from './variableService';
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
  /**
   * Generates a comprehensive quality report by aggregating results from all services.
   * This eliminates race conditions by ensuring all data is ready before returning.
   */
  static async generateReport(
    scope: 'SELECTION' | 'PAGE' | 'ALL' | 'SMART_SCAN',
    pageIds?: string[],
    exportFormat: string = 'css'
  ): Promise<QualityReport> {
    return await ErrorHandler.withErrorHandling(
      async () => {
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
        
        // 2. Run analyses in parallel
        const [tokenResult, componentResult, variableResult] = await Promise.all([
           tokenPromise,
           ComponentService.analyzeHygiene(pageIds),
           VariableService.analyzeHygiene(pageIds)
        ]);

        // 2. Aggregate Results
        const duration = Date.now() - startTime;
        console.log(`[QualityService] Analysis complete in ${duration}ms`);

        // 3. Extract scores
        const tokenScore = tokenResult.subScores?.tokenCoverage || 0;
        const tailwindScore = tokenResult.subScores?.tailwindReadiness || 0;
        const componentScore = componentResult.subScores?.componentHygiene || 0;
        const variableScore = variableResult.subScores?.variableHygiene || 0;

        // 4. Calculate Weighted Total (Backend truth)
        // Default weights matching frontend legacy
        const weights = {
            tokenCoverage: 40,
            tailwindReadiness: 20,
            componentHygiene: 20,
            variableHygiene: 20
        };
        
        const totalScore = Math.round(
            (tokenScore * 0.4) + 
            (tailwindScore * 0.2) + 
            (componentScore * 0.2) + 
            (variableScore * 0.2)
        );

        return {
          meta: {
            totalNodes: tokenResult.totalNodes || 0,
            scanDuration: duration,
            scope: scope,
            timestamp: Date.now()
          },
          metrics: {
            tokenCoverage: tokenResult,
            // Tailwind data is embedded in tokenResult currently, keep it there or split?
            // For now keep structure similar to legacy for easier frontend transition
            componentHygiene: componentResult,
            variableHygiene: variableResult,
            tailwindReadiness: {
                 score: tailwindScore,
                 validation: tokenResult.tailwindValidation // Pass this through
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
      },
      {
        operation: 'generate_quality_report',
        component: 'QualityService',
        severity: 'high',
      }
    );
  }
}
