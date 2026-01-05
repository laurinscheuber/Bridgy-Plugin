import { MessageBus } from './modules/MessageBus';
import { NotificationSystem } from './modules/NotificationSystem';
import { VariablesView } from './modules/VariablesView';
import { ComponentsView } from './modules/ComponentsView';
import { SettingsView } from './modules/SettingsView';
import { ImportView } from './modules/ImportView';
import { Navigation } from './modules/Navigation';

// Initialize core systems
Navigation.init();
SettingsView.init();
ImportView.init();

// Global Globals for Legacy Compatibility (Required for HTML onclick handlers)
const globals = window as any;

globals.refreshData = () => MessageBus.send('refresh-data');

globals.selectComponent = (id: string) => {
  MessageBus.send('select-component', { componentId: id });
};

globals.generateTest = (id: string) => {
  MessageBus.send('generate-test', { componentId: id });
};

globals.toggleCollection = (id: string) => {
  const el = document.getElementById(id);
  if(el) {
     const content = el.querySelector('.collection-content');
     const header = el.querySelector('.collection-header');
     content?.classList.toggle('collapsed');
     header?.classList.toggle('collapsed');
  }
};

// Modal handlers
globals.openSettingsModal = () => document.getElementById('settings-modal')!.style.display = 'block';
globals.closeSettingsModal = () => document.getElementById('settings-modal')!.style.display = 'none';

globals.openImportModal = () => ImportView.open();
globals.closeImportModal = () => ImportView.close();

globals.openUnitsModal = () => document.getElementById('units-modal')!.style.display = 'block';
globals.closeUnitsModal = () => document.getElementById('units-modal')!.style.display = 'none';

globals.openUserGuide = () => document.getElementById('user-guide-modal')!.style.display = 'block';
globals.closeUserGuide = () => document.getElementById('user-guide-modal')!.style.display = 'none';

globals.openGitLabModal = () => document.getElementById('gitlab-modal')!.style.display = 'block';
globals.closeGitLabModal = () => document.getElementById('gitlab-modal')!.style.display = 'none';

// Search handlers
globals.toggleSearchBar = (wrapperId: string) => {
  const wrapper = document.getElementById(wrapperId);
  if (wrapper) {
    wrapper.classList.toggle('expanded');
    if (wrapper.classList.contains('expanded')) {
      wrapper.querySelector('input')?.focus();
    }
  }
};

globals.clearSearch = (inputId: string) => {
  const input = document.getElementById(inputId) as HTMLInputElement;
  if (input) {
    input.value = '';
    input.dispatchEvent(new Event('input')); // Trigger input event to update filters if any
  }
};

globals.commitToGitLab = () => {
  const msg = (document.getElementById('commit-message') as HTMLTextAreaElement).value;
  // This requires state from GitController or UI cache which we need to wire up
  // For now, let's assume direct MessageBus send if we had the context
  // But typically this requires knowing current project ID/token etc.
  // Ideally SettingsView or GitView handles this.
  // We'll dispatch a 'request-commit' which the backend or a UI controller handles by gathering state.
  // Since we don't have a UI state store yet, we might need to read from settings inputs if they are populated.

  // Quick fix: Trigger a save first or read from inputs if visible?
  // Let's assume the backend has the settings loaded.
  // Actually, commit requires sending the payload.
  // We need to implement the Commit logic in a view.
  console.warn("Commit logic needs to be fully wired in GitView");
};

// Expand/Collapse handlers
globals.expandAllVariables = () => {
  document.querySelectorAll('.variable-collection').forEach(el => {
    el.querySelector('.collection-content')?.classList.remove('collapsed');
    el.querySelector('.collection-header')?.classList.remove('collapsed');
  });
};

globals.collapseAllVariables = () => {
  document.querySelectorAll('.variable-collection').forEach(el => {
    el.querySelector('.collection-content')?.classList.add('collapsed');
    el.querySelector('.collection-header')?.classList.add('collapsed');
  });
};

// Token Coverage Analysis
globals.analyzeTokenCoverage = () => {
  const scope = (document.getElementById('analysis-scope-select') as HTMLSelectElement)?.value || 'PAGE';
  MessageBus.send('analyze-token-coverage', { scope });
};

// Feedback
globals.toggleFeedback = () => {
  const el = document.getElementById('feedback-section');
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
};

globals.dismissFeedback = () => {
  const el = document.getElementById('feedback-section');
  if (el) el.style.display = 'none';
  MessageBus.send('set-client-storage', { key: 'feedback_dismissed', value: true });
};

// Message Handling
MessageBus.onAny((msg) => {
  console.log('UI Received:', msg.type);

  switch(msg.type) {
    case 'document-data':
      VariablesView.render(msg.variablesData, msg.stylesData);
      ComponentsView.render(msg.componentsData);
      document.getElementById('plugin-loading-overlay')!.style.display = 'none';
      break;

    case 'git-settings-loaded':
      SettingsView.load(msg.settings);
      break;

    case 'git-settings-saved':
      NotificationSystem.success('Settings Saved', 'Configuration updated successfully.');
      globals.closeSettingsModal();
      break;

    case 'error':
      NotificationSystem.error('Error', msg.message);
      break;

    case 'test-generated':
        // Handle test generation download/display
        // Simple download trigger for now
        const blob = new Blob([msg.testContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${msg.componentName}.spec.ts`;
        a.click();
        URL.revokeObjectURL(url);
        NotificationSystem.success('Test Generated', `Downloaded ${msg.componentName}.spec.ts`);
        break;
  }
});

// Initial Load
console.log('UI Initialized');
