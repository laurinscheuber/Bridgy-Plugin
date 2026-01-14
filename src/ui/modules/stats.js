// ===== STATS MODULE =====

window.filterStats = function(query) {
  if (!window.componentStatsData) return;
  
  const term = query.toLowerCase().trim();
  if (!term) {
    renderStats(window.componentStatsData);
    return;
  }
  
  // Filter parent components or those with matching children
  const filtered = window.componentStatsData.filter(item => {
    const parentMatch = item.name.toLowerCase().includes(term);
    // Ensure instances exists
    const childrenMatch = item.instances && item.instances.some(inst => 
      inst.name.toLowerCase().includes(term) || 
      inst.parentName.toLowerCase().includes(term)
    );
    return parentMatch || childrenMatch;
  });
  
  renderStats(window.componentStatsData, filtered);
};

window.toggleStatsSort = function(column) {
  if (window.statsSortState.column === column) {
    window.statsSortState.direction = window.statsSortState.direction === 'asc' ? 'desc' : 'asc';
  } else {
    window.statsSortState.column = column;
    window.statsSortState.direction = column === 'name' ? 'asc' : 'desc';
  }
  
  // Re-apply filter which triggers render with new sort
  const searchInput = document.getElementById('stats-search');
  const query = searchInput ? searchInput.value : '';
  if (window.filterStats) {
      window.filterStats(query);
  } else {
      renderStats(window.componentStatsData);
  }
};

window.renderStats = function(statsData, filteredData = null) {
  const container = document.getElementById('stats-container');
  if (!container) return;

  if (!statsData || statsData.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📊</div>
        <div class="empty-text">No local components found in this file</div>
        <div class="empty-subtext">Components defined in this file will appear here</div>
      </div>
    `;
    return;
  }

  // Calculate totals from the FULL dataset (statsData)
  const totalComponents = statsData.length;
  const totalInstances = statsData.reduce((sum, item) => sum + item.count, 0);

  // Metrics: Unused
  const unusedComponents = statsData.filter((item) => item.count === 0).length;

  // Calculate filtered stats if provided
  let filteredComponents = 0;
  let filteredInstances = 0;
  let filteredUnused = 0;
  
  if (filteredData) {
      filteredComponents = filteredData.length;
      filteredInstances = filteredData.reduce((sum, item) => sum + item.count, 0);
      filteredUnused = filteredData.filter((item) => item.count === 0).length;
  }

  let html = `
    <!-- Top Summary Cards -->
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px;">
      <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
        <div style="font-size: 24px; font-weight: 600; color: white; margin-bottom: 4px;">
            ${filteredData ? `${filteredComponents} <span style="font-size: 14px; color: #a855f7; margin-left: 2px;">/ ${totalComponents}</span>` : totalComponents}
        </div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.5px;">Components</div>
      </div>
      <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
        <div style="font-size: 24px; font-weight: 600; color: white; margin-bottom: 4px;">
            ${filteredData ? `${filteredInstances} <span style="font-size: 14px; color: #a855f7; margin-left: 2px;">/ ${totalInstances}</span>` : totalInstances}
        </div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.5px;">Local Instances</div>
      </div>
      <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
        <div style="font-size: 24px; font-weight: 600; color: white; margin-bottom: 4px;">
             ${filteredData ? `${filteredUnused} <span style="font-size: 14px; color: #a855f7; margin-left: 2px;">/ ${unusedComponents}</span>` : unusedComponents}
        </div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.5px;">Unused Components</div>
      </div>
    </div>

    <!-- Stats Table -->
    <div class="stats-table">
        <!-- Table Header -->
        <div style="display: grid; grid-template-columns: 1fr 60px 100px 40px; gap: 12px; padding: 0 12px 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 8px; align-items: center;">
            <div style="font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.5); text-transform: uppercase; cursor: pointer; display: flex; align-items: center; gap: 4px; white-space: nowrap;" onclick="toggleStatsSort('name')">
              Component Name ${window.statsSortState.column === 'name' ? (window.statsSortState.direction === 'asc' ? '<span style="display:inline-block">↑</span>' : '<span style="display:inline-block">↓</span>') : ''}
            </div>
            <div style="font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.5); text-transform: uppercase; text-align: right; cursor: pointer; display: flex; align-items: center; justify-content: flex-end; gap: 4px; white-space: nowrap;" onclick="toggleStatsSort('variantCount')">
              Variants ${window.statsSortState.column === 'variantCount' ? (window.statsSortState.direction === 'asc' ? '<span style="display:inline-block">↑</span>' : '<span style="display:inline-block">↓</span>') : ''}
            </div>
            <div style="font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.5); text-transform: uppercase; text-align: right; cursor: pointer; display: flex; align-items: center; justify-content: flex-end; gap: 4px; white-space: nowrap;" onclick="toggleStatsSort('count')">
              Instances ${window.statsSortState.column === 'count' ? (window.statsSortState.direction === 'asc' ? '<span style="display:inline-block">↑</span>' : '<span style="display:inline-block">↓</span>') : ''}
            </div>
            <div></div> <!-- Actions spacer -->
        </div>

        <div class="component-list" style="display: flex; flex-direction: column; gap: 4px;">
  `;

  // Use filteredData for the list if present, otherwise statsData
  // Clone to avoid mutation of source if reused
  let listData = filteredData ? [...filteredData] : [...statsData];

  // Apply Sorting
  listData.sort((a, b) => {
    let valA = a[window.statsSortState.column];
    let valB = b[window.statsSortState.column];
    
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    
    if (valA < valB) return window.statsSortState.direction === 'asc' ? -1 : 1;
    if (valA > valB) return window.statsSortState.direction === 'asc' ? 1 : -1;
    return 0;
  });

  listData.forEach((item) => {
    // Determine icon based on type

    const variantLabel = item.variantCount > 1 ? item.variantCount : '-';

    // Render Component Row
    html += `
      <div class="unified-list-item variable-row component-item" data-id="${item.id}" style="display: grid; grid-template-columns: 1fr 60px 100px 40px; gap: 12px; align-items: center; padding: 0 12px; height: 28px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 4px; margin-bottom: 4px;">
        
        <!-- Name Column -->
        <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
            <div class="component-icon-wrapper" style="display: flex; align-items: center; justify-content: center; color:  #a855f7; flex-shrink: 0;">
                     <svg width="12" height="12" viewBox="0 0 12 12" fill="none"  style="rotate: 45deg"><path d="M1 1h4v4H1zM7 1h4v4H7zM1 7h4v4H1zM7 7h4v4H7z" stroke="currentColor" stroke-width="1"/></svg>

            </div>
            <span class="component-name text-truncate" title="${item.name}" style="font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.9);">
                ${item.name}
            </span>
        </div>

        <!-- Variants Column -->
        <div style="text-align: right; font-size: 12px; color: rgba(255,255,255,0.6);">
            ${variantLabel}
        </div>

        <!-- Instances Column -->
        <div style="text-align: right; font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.9);">
            ${item.count.toLocaleString()}
        </div>
      </div>
    `;  });

  html += `</div></div>`;
  container.innerHTML = html;
};
