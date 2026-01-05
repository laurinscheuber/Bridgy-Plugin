// VariablesView.ts - Handling variable rendering
import { MessageBus } from './MessageBus';

export class VariablesView {
  static render(variablesData: any[], stylesData: any) {
    const container = document.getElementById('variables-container');
    if (!container) return;

    if ((!variablesData || variablesData.length === 0) && !this.hasStyles(stylesData)) {
      container.innerHTML = '<div class="no-items">No variables or styles found.</div>';
      return;
    }

    let html = '';

    // Render Variables
    variablesData.forEach(collection => {
      if (collection.variables.length > 0) {
        html += this.renderCollection(collection);
      }
    });

    // Render Styles
    if (this.hasStyles(stylesData)) {
      html += this.renderStyles(stylesData);
    }

    container.innerHTML = html;

    // Update Summary
    this.updateSummary(variablesData, stylesData);
  }

  private static hasStyles(stylesData: any): boolean {
    return stylesData && (
      (stylesData.textStyles && stylesData.textStyles.length > 0) ||
      (stylesData.paintStyles && stylesData.paintStyles.length > 0) ||
      (stylesData.effectStyles && stylesData.effectStyles.length > 0) ||
      (stylesData.gridStyles && stylesData.gridStyles.length > 0)
    );
  }

  private static renderCollection(collection: any): string {
    const collectionId = `collection-${collection.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
    return `
      <div class="variable-collection" id="${collectionId}" data-collection-id="${collectionId}">
        <div class="collection-header" onclick="window.toggleCollection('${collectionId}')">
          <div class="collection-info">
            <span class="material-symbols-outlined" style="font-size: 18px; color: var(--purple-light);">folder</span>
            <h3 class="collection-name-title">${collection.name}</h3>
            <span class="subgroup-stats">${collection.variables.length}</span>
          </div>
          <span class="material-symbols-outlined collection-toggle-icon">expand_more</span>
        </div>
        <div class="collection-content collapsed" id="${collectionId}-content">
          ${this.renderVariablesList(collection.variables)}
        </div>
      </div>
    `;
  }

  private static renderVariablesList(variables: any[]): string {
    return variables.map(v => `
      <div class="variable-item">
        <span class="variable-name">${v.name}</span>
        <span class="variable-value">${v.resolvedType}</span>
      </div>
    `).join('');
  }

  private static renderStyles(stylesData: any): string {
    let html = `
      <div class="tab-header" style="margin-top: 32px; margin-bottom: 16px;">
        <div style="display: flex; align-items: baseline; gap: 12px; margin-bottom: 8px;">
          <h2 style="color: rgba(255, 255, 255, 0.9); display: flex; align-items: center; gap: 10px; font-size: 1.2rem; margin: 0;">
            <span class="material-symbols-outlined" style="font-size: 22px; color: #c4b5fd;">style</span>
            Styles
          </h2>
        </div>
      </div>
    `;

    if (stylesData.paintStyles && stylesData.paintStyles.length > 0) {
      html += this.renderStyleGroup('Color', stylesData.paintStyles, 'paint');
    }
    if (stylesData.textStyles && stylesData.textStyles.length > 0) {
      html += this.renderStyleGroup('Text', stylesData.textStyles, 'text');
    }
    if (stylesData.effectStyles && stylesData.effectStyles.length > 0) {
      html += this.renderStyleGroup('Effect', stylesData.effectStyles, 'effect');
    }
    if (stylesData.gridStyles && stylesData.gridStyles.length > 0) {
      html += this.renderStyleGroup('Layout guide', stylesData.gridStyles, 'grid');
    }

    return html;
  }

  private static renderStyleGroup(name: string, styles: any[], type: string): string {
    const collectionId = `collection-figma-styles-${type}`;
    const icon = type === 'text' ? 'text_fields' : type === 'paint' ? 'colorize' : type === 'effect' ? 'bolt' : 'grid_on';

    return `
      <div class="variable-collection" id="${collectionId}">
        <div class="collection-header" onclick="window.toggleCollection('${collectionId}')">
          <div class="collection-info">
            <span class="material-symbols-outlined" style="font-size: 18px; color: var(--purple-light);">${icon}</span>
            <h3 class="collection-name-title">${name}</h3>
            <span class="subgroup-stats">${styles.length}</span>
          </div>
          <span class="material-symbols-outlined collection-toggle-icon">expand_more</span>
        </div>
        <div class="collection-content collapsed" id="${collectionId}-content">
          ${this.renderStyleList(styles, type)}
        </div>
      </div>
    `;
  }

  private static renderStyleList(styles: any[], type: string): string {
    return styles.map(style => `
      <div class="variable-item">
        <span class="variable-name">${style.name}</span>
        <span class="variable-value">${type}</span>
      </div>
    `).join('');
  }

  private static updateSummary(variablesData: any[], stylesData: any) {
    const summaryVars = document.getElementById('variables-count');
    const summaryCols = document.getElementById('collections-count');

    if (summaryVars && summaryCols) {
      let totalVars = 0;
      variablesData.forEach(c => totalVars += c.variables.length);
      summaryVars.textContent = `${totalVars} vars`;
      summaryCols.textContent = `${variablesData.length} cols`;
    }
  }
}
