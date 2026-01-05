// SettingsView.ts
import { MessageBus } from './MessageBus';

export class SettingsView {
  static init() {
    const saveBtn = document.querySelector('button[onclick="saveConfiguration()"]');
    if (saveBtn) {
      saveBtn.removeAttribute('onclick');
      saveBtn.addEventListener('click', () => this.saveSettings());
    }
  }

  static load(settings: any) {
    // Populate form fields
    const inputs = {
      'config-project-id': settings.projectId,
      'config-token': settings.token,
      'config-gitlab-url': settings.baseUrl,
      'config-file-path': settings.filePath,
      'config-test-file-path': settings.testFilePath,
      'config-branch': settings.branchName,
      'config-test-branch': settings.testBranchName
    };

    Object.entries(inputs).forEach(([id, value]) => {
      const el = document.getElementById(id) as HTMLInputElement;
      if (el) el.value = value || '';
    });

    // Select dropdowns
    if (settings.strategy) {
      const el = document.getElementById('config-strategy') as HTMLSelectElement;
      if (el) el.value = settings.strategy;
    }

    if (settings.exportFormat) {
      const el = document.getElementById('config-export-format') as HTMLSelectElement;
      if (el) el.value = settings.exportFormat;
    }
  }

  static saveSettings() {
    const projectId = (document.getElementById('config-project-id') as HTMLInputElement).value;
    const token = (document.getElementById('config-token') as HTMLInputElement).value;
    const baseUrl = (document.getElementById('config-gitlab-url') as HTMLInputElement).value;
    const filePath = (document.getElementById('config-file-path') as HTMLInputElement).value;
    const testFilePath = (document.getElementById('config-test-file-path') as HTMLInputElement).value;
    const branchName = (document.getElementById('config-branch') as HTMLInputElement).value;
    const testBranchName = (document.getElementById('config-test-branch') as HTMLInputElement).value;
    const strategy = (document.getElementById('config-strategy') as HTMLSelectElement).value;
    const exportFormat = (document.getElementById('config-export-format') as HTMLSelectElement).value;
    const shareWithTeam = (document.getElementById('config-share-team') as HTMLInputElement).checked;

    MessageBus.send('save-git-settings', {
      provider: 'gitlab',
      projectId,
      token,
      baseUrl,
      filePath,
      testFilePath,
      branchName,
      testBranchName,
      strategy,
      exportFormat,
      shareWithTeam
    });
  }
}
