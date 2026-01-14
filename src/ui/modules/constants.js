// ===== CONSTANTS MODULE =====

// Unit Definitions
window.AVAILABLE_UNITS = [
  'px',
  'rem',
  'em',
  '%',
  'vw',
  'vh',
  's',
  'ms',
  'deg',
  'fr',
];

// GitHub OAuth Configuration
window.GITHUB_CONFIG = {
  CLIENT_ID: 'Ov23liKXGtyeKaklFf0Q',
  REDIRECT_URI: 'https://bridgy-oauth.netlify.app/github/callback',
  SCOPES: ['repo', 'read:user', 'user:email']
};

// Steps for the loading animation
window.loadingSteps = [
  'Scanning local components...',
  'Analyzing usage patterns...',
  'Connecting to repository...',
  'Fetching remote changes...',
  'Synchronizing design tokens...'
];
