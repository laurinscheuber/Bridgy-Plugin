// ComponentsView.ts

export class ComponentsView {
  static render(components: any[]) {
    const container = document.getElementById('components-container');
    if (!container) return;

    if (!components || components.length === 0) {
      container.innerHTML = '<div class="no-items">No components found.</div>';
      return;
    }

    container.innerHTML = components.map(comp => this.renderComponentItem(comp)).join('');

    // Update summary count
    const countEl = document.getElementById('components-count');
    if (countEl) countEl.textContent = `${components.length} comps`;
  }

  private static renderComponentItem(comp: any): string {
    return `
      <div class="component-item">
        <div class="component-header">
          <div class="component-meta">
            <span class="component-name">${comp.name}</span>
            ${comp.type === 'COMPONENT_SET' ? '<span class="badge badge-component-set">Set</span>' : ''}
          </div>
          <div class="component-actions">
            <button class="nav-icon" onclick="window.selectComponent('${comp.id}')" title="Locate in Figma">
              <span class="material-symbols-outlined">filter_center_focus</span>
            </button>
            <button class="primary-action-btn" onclick="window.generateTest('${comp.id}')" title="Generate Test">
              <span class="material-symbols-outlined">science</span>
              Generate
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
