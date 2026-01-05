// ImportView.ts
import { MessageBus } from './MessageBus';
import { NotificationSystem } from './NotificationSystem';

// Type definitions for Import Token
interface ImportToken {
  name: string;
  value: string;
  type: string;
  references?: string[];
  isAlias?: boolean;
}

export class ImportView {
  private static parsedTokens: ImportToken[] = [];
  private static currentPreview: any = null;

  static init() {
    // Setup listeners for import modal
    const importInput = document.getElementById('import-input') as HTMLTextAreaElement;
    const previewBtn = document.getElementById('preview-import-btn') as HTMLButtonElement;
    const cancelBtn = document.getElementById('cancel-import-btn');
    const confirmBtn = document.getElementById('confirm-import-btn');

    if (importInput) {
      importInput.addEventListener('input', (e) => {
        const target = e.target as HTMLTextAreaElement;
        if (previewBtn) previewBtn.disabled = !target.value.trim();
      });
    }

    if (previewBtn) {
      previewBtn.addEventListener('click', () => this.handlePreview());
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        const previewSection = document.getElementById('import-preview-section');
        if (previewSection) previewSection.classList.add('hidden');
        if (previewBtn) previewBtn.disabled = false;
        if (importInput) importInput.disabled = false;
      });
    }

    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => this.handleConfirm());
    }

    // Message handlers
    MessageBus.on('import-preview-ready', (msg) => this.onPreviewReady(msg));
    MessageBus.on('import-complete', (msg) => this.onImportComplete(msg));
    MessageBus.on('import-error', (msg) => this.onImportError(msg));
    MessageBus.on('existing-collections', (msg) => this.updateCollectionsDropdown(msg.collections));
  }

  static open() {
    const modal = document.getElementById('import-modal');
    if (modal) {
      modal.style.display = 'block';
      // Load collections when opening
      MessageBus.send('get-existing-collections');
    }
  }

  static close() {
    const modal = document.getElementById('import-modal');
    if (modal) modal.style.display = 'none';
  }

  private static handlePreview() {
    const content = (document.getElementById('import-input') as HTMLTextAreaElement).value;
    const collectionId = (document.getElementById('import-collection-select') as HTMLSelectElement).value;

    if (!content) return;

    const btn = document.getElementById('preview-import-btn') as HTMLButtonElement;
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Analyzing...';
    }

    MessageBus.send('preview-import', {
      content: content,
      options: { collectionId: collectionId }
    });
  }

  private static onPreviewReady(msg: any) {
    const btn = document.getElementById('preview-import-btn') as HTMLButtonElement;
    if (btn) {
      btn.textContent = 'Preview Import';
      btn.disabled = false;
    }

    if (!msg.diff) {
      NotificationSystem.error('Import Error', 'Failed to generate preview');
      return;
    }

    this.currentPreview = msg.diff;
    const { added, modified, unchanged, conflicts } = msg.diff;

    // Update Stats
    this.updateStat('preview-stat-total', added.length + modified.length + unchanged.length + conflicts.length);
    this.updateStat('preview-stat-new', added.length);
    this.updateStat('preview-stat-update', modified.length);
    this.updateStat('preview-stat-conflict', conflicts.length);

    // Render Table
    const tbody = document.getElementById('preview-table-body');
    if (tbody) {
      tbody.innerHTML = '';
      added.forEach((t: any) => this.appendRow(tbody, t, 'new'));
      modified.forEach((m: any) => this.appendRow(tbody, m.token, 'update', m.oldValue));
      conflicts.forEach((c: any) => this.appendRow(tbody, c.token, 'conflict', c.existingValue));
      unchanged.forEach((t: any) => this.appendRow(tbody, t, 'ignore'));
    }

    const previewSection = document.getElementById('import-preview-section');
    if (previewSection) {
      previewSection.classList.remove('hidden');
      previewSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  private static handleConfirm() {
    if (!this.currentPreview) return;

    const overwriteCheckbox = document.getElementById('overwrite-existing') as HTMLInputElement;
    const organizeCheckbox = document.getElementById('organize-by-categories') as HTMLInputElement;
    const collectionSelect = document.getElementById('import-collection-select') as HTMLSelectElement;

    const strategy = (overwriteCheckbox && overwriteCheckbox.checked) ? 'overwrite' : 'merge';
    const organizeByCategories = (organizeCheckbox && organizeCheckbox.checked) || false;
    const collectionId = collectionSelect.value;
    const collectionName = collectionId ?
        collectionSelect.options[collectionSelect.selectedIndex].text :
        'Imported Variables';

    const btn = document.getElementById('confirm-import-btn') as HTMLButtonElement;
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Importing...';
    }

    const tokensToImport = [
      ...this.currentPreview.added,
      ...this.currentPreview.modified.map((m: any) => m.token),
      ...this.currentPreview.unchanged,
      ...this.currentPreview.conflicts.map((c: any) => c.token)
    ];

    MessageBus.send('import-tokens', {
      tokens: tokensToImport,
      options: {
        collectionId: collectionId,
        collectionName: collectionName,
        strategy: strategy,
        organizeByCategories: organizeByCategories
      }
    });
  }

  private static onImportComplete(msg: any) {
    const btn = document.getElementById('confirm-import-btn') as HTMLButtonElement;
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Import Variables';
    }

    if (msg.result && (msg.result.importedCount > 0 || msg.result.groupsCreated > 0)) {
      NotificationSystem.success('Import Successful', `Imported ${msg.result.importedCount} variables.`);
      const previewSection = document.getElementById('import-preview-section');
      if (previewSection) previewSection.classList.add('hidden');
      const importInput = document.getElementById('import-input') as HTMLTextAreaElement;
      if (importInput) importInput.value = '';

      // Refresh main data
      MessageBus.send('refresh-data');
      this.close();
    } else {
      NotificationSystem.error('Import Failed', msg.error || 'Unknown error');
    }
  }

  private static onImportError(msg: any) {
    const btn = document.getElementById('confirm-import-btn') as HTMLButtonElement;
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Import Variables';
    }
    NotificationSystem.error('Import Failed', msg.error || 'Unknown error');
  }

  private static updateCollectionsDropdown(collections: any[]) {
    const select = document.getElementById('import-collection-select') as HTMLSelectElement;
    if (!select) return;

    select.innerHTML = '<option value="">New Collection...</option>';
    collections.forEach(col => {
      const option = document.createElement('option');
      option.value = col.id;
      option.textContent = col.name;
      select.appendChild(option);
    });
  }

  private static updateStat(id: string, value: number) {
    const el = document.getElementById(id);
    if (el) {
      const span = el.querySelector('span:last-child');
      if (span) span.textContent = value.toString();
    }
  }

  private static appendRow(tbody: HTMLElement, token: any, status: string, oldValue: any = null) {
    const tr = document.createElement('tr');

    // Simplistic value display
    let valueDisplay = token.value;
    if (status === 'update' || status === 'conflict') {
      valueDisplay = `${oldValue} → ${token.value}`;
    }

    tr.innerHTML = `
      <td>${token.name}</td>
      <td>${token.type}</td>
      <td>${valueDisplay}</td>
      <td class="status-${status}">${status.toUpperCase()}</td>
    `;
    tbody.appendChild(tr);
  }
}
