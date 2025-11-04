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
  'gitlab.fhnw.ch': {
    gitlabBaseUrl: 'https://gitlab.fhnw.ch', 
    allowedDomains: ['gitlab.fhnw.ch', '*.gitlab.fhnw.ch'],
    name: 'FHNW GitLab',
    description: 'University of Applied Sciences Northwestern Switzerland'
  }
};

function generateManifestDomains(environments = DEFAULT_ENVIRONMENTS) {
  const domains = new Set();

  // Add CDN for JSZip
  domains.add('https://cdnjs.cloudflare.com');

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
    manifest.networkAccess.reasoning = `This plugin connects to GitLab instances (${environmentNames}) for committing design tokens and component tests. JSZip is loaded from CDN for file export functionality.`;
    
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