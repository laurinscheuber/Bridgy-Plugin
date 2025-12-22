/**
 * Updates manifest.json with environment-specific domains
 * Run this script before building for different environments
 */

const fs = require('fs');
const path = require('path');

// Import the environment manager (we'll need to compile TypeScript first)
const manifestPath = path.join(__dirname, '..', 'manifest.json');
const environmentsPath = path.join(__dirname, '..', 'src', 'config', 'environments.ts');

// Default environments for manifest generation
const DEFAULT_ENVIRONMENTS = {
  'gitlab.com': {
    gitlabBaseUrl: 'https://gitlab.com',
    allowedDomains: ['gitlab.com', '*.gitlab.com', '*.gitlab.io'],
    name: 'GitLab.com',
    description: 'Official GitLab SaaS platform'
  },
  'github.com': {
    gitlabBaseUrl: 'https://api.github.com',
    allowedDomains: ['github.com', 'api.github.com', '*.github.com', '*.githubusercontent.com'],
    name: 'GitHub.com',
    description: 'Official GitHub SaaS platform'
  },
  // Support for common GitLab hosting patterns (Figma only allows wildcards at beginning of domain)
  'gitlab-enterprise': {
    allowedDomains: [
      // GitLab.com patterns
      '*.gitlab.com',
      '*.gitlab.io',
      // Common GitLab TLD patterns - wildcards AND base domains
      'gitlab.de', '*.gitlab.de',
      'gitlab.ch', '*.gitlab.ch',
      'gitlab.fhnw.ch', '*.gitlab.fhnw.ch',
      'gitlab.fr', '*.gitlab.fr',
      'gitlab.org', '*.gitlab.org',
      'gitlab.net', '*.gitlab.net',
      'gitlab.edu', '*.gitlab.edu',
      'gitlab.gov', '*.gitlab.gov',
      'gitlab.uk', '*.gitlab.uk',
      'gitlab.eu', '*.gitlab.eu',
      'gitlab.co.uk', '*.gitlab.co.uk',
      'gitlab.it', '*.gitlab.it',
      'gitlab.es', '*.gitlab.es',
      'gitlab.nl', '*.gitlab.nl',
      'gitlab.be', '*.gitlab.be',
      'gitlab.at', '*.gitlab.at',
      'gitlab.se', '*.gitlab.se',
      'gitlab.no', '*.gitlab.no',
      'gitlab.dk', '*.gitlab.dk',
      'gitlab.fi', '*.gitlab.fi',
      // Additional common TLDs for self-hosted instances
      'gitlab.pl', '*.gitlab.pl',
      'gitlab.cz', '*.gitlab.cz',
      'gitlab.hu', '*.gitlab.hu',
      'gitlab.ro', '*.gitlab.ro',
      'gitlab.gr', '*.gitlab.gr',
      'gitlab.pt', '*.gitlab.pt',
      'gitlab.ie', '*.gitlab.ie',
      'gitlab.co', '*.gitlab.co',
      'gitlab.ca', '*.gitlab.ca',
      'gitlab.au', '*.gitlab.au',
      'gitlab.jp', '*.gitlab.jp',
      'gitlab.cn', '*.gitlab.cn',
      'gitlab.in', '*.gitlab.in',
      'gitlab.br', '*.gitlab.br',
      'gitlab.mx', '*.gitlab.mx',
      'gitlab.ae', '*.gitlab.ae',
      'gitlab.sg', '*.gitlab.sg',
      'gitlab.hk', '*.gitlab.hk',
      'gitlab.nz', '*.gitlab.nz',
      'gitlab.za', '*.gitlab.za',
      // Alternative common git hosting patterns
      '*.git.com',
      '*.git.org', 
      '*.git.net',
      '*.git.de',
      '*.git.ch',
      '*.git.fr',
      '*.git.eu',
      '*.code.com',
      '*.code.org',
      '*.code.de',
      '*.code.ch',
      '*.scm.com',
      '*.scm.org',
      '*.repo.com',
      '*.repo.org',
      '*.vcs.com',
    ],
    name: 'Enterprise GitLab Instances', 
    description: 'Support for enterprise and self-hosted GitLab instances with common hosting patterns'
  }
};

function generateManifestDomains(environments = DEFAULT_ENVIRONMENTS) {
  const domains = new Set();

  // Add CDN for JSZip
  domains.add('https://cdnjs.cloudflare.com');
  
  // Add Figma static domain for fonts
  domains.add('https://static.figma.com');
  
  // Add Google Fonts domains
  domains.add('https://fonts.googleapis.com');
  domains.add('https://fonts.gstatic.com');

  // Add all environment domains
  for (const config of Object.values(environments)) {
    if (config.gitlabBaseUrl) {
      try {
        const url = new URL(config.gitlabBaseUrl);
        domains.add(`https://${url.hostname}`);
      } catch (e) {
        // Skip invalid URLs
      }
    }
    
    // Add allowed domains
    config.allowedDomains.forEach(domain => {
      if (!domain.startsWith('*.')) {
        domains.add(`https://${domain}`);
      } else {
        // Convert *.domain.com to https://*.domain.com
        domains.add(`https://${domain}`);
      }
    });
  }

  return Array.from(domains).sort();
}

function updateManifest(customEnvironments = {}) {
  try {
    // Read current manifest
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Merge with custom environments
    const allEnvironments = { ...DEFAULT_ENVIRONMENTS, ...customEnvironments };
    
    // Generate new domains
    const domains = generateManifestDomains(allEnvironments);
    
    // Update manifest
    if (!manifest.networkAccess) {
      manifest.networkAccess = {};
    }
    
    manifest.networkAccess.allowedDomains = domains;
    
    // Update reasoning
    const environmentNames = Object.values(allEnvironments).map(env => env.name).join(', ');
    manifest.networkAccess.reasoning = `This plugin connects to Git providers (${environmentNames}) for committing design tokens and component tests. JSZip is loaded from CDN for file export functionality.`;
    
    // Write updated manifest
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log(`✅ Updated manifest.json with ${domains.length} allowed domains:`);
    domains.forEach(domain => console.log(`   - ${domain}`));
    
    return domains;
  } catch (error) {
    console.error('❌ Failed to update manifest:', error);
    process.exit(1);
  }
}

// Export for programmatic usage
module.exports = { updateManifest, generateManifestDomains };

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const environment = args[0] || 'default';
  
  console.log(`🔧 Updating manifest for environment: ${environment}`);
  
  // You can extend this to load different environment configs
  // For now, just use the defaults
  updateManifest();
}