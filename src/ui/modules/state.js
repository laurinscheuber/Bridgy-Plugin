// ===== STATE VARIABLES =====
window.loadingProgress = 0;
window.lastNavigationTime = 0;
window.lastNavigatedComponentId = null;

// Data Stores
window.variablesData = [];
window.stylesData = {};
window.variableReferences = {}; // Map of ID -> Name for aliases
window.componentsData = [];
window.componentUsageData = {}; // ID -> Count
window.currentCSSData = null;
window.componentSetsData = [];
window.selectionData = null;
window.tailwindV4Validation = null;
window.analysisScope = 'PAGE';
window.componentStatsData = []; // Store stats for filtering
window.statsSortState = { column: 'count', direction: 'desc' }; // Default sort state

window.cachedRepositories = [];
window.cachedBranches = [];
window.currentImportPreview = null;
window.pendingFixContext = null;
