
// ===== VARIABLES MODULE =====

// Global Variables State is in state.js (window.variablesData, window.stylesData)

window.findVariableNameById = function(variableId) {
  if (window.variableReferences && window.variableReferences[variableId]) {
    return window.variableReferences[variableId];
  }
  
  // Fallback: check local variables
  if (window.variablesData) {
      for (const collection of window.variablesData) {
        for (const variable of collection.variables) {
          if (variable.id === variableId) {
            return variable.name;
          }
        }
      }
  }
  return null;
};

window.findVariableById = function(id) {
  if (window.variablesData) {
      for (const collection of window.variablesData) {
        for (const variable of collection.variables) {
          if (variable.id === id) {
            return variable;
          }
        }
      }
  }
  return null;
};

window.scrollToVariable = function(variableName) {
  const element = document.getElementById(`var-${variableName}`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.style.backgroundColor = 'rgba(139, 92, 246, 0.2)';
    element.style.border = '2px solid #8b5cf6';
    setTimeout(() => {
      element.style.backgroundColor = '';
      element.style.border = '';
    }, 2000);
  }
};

window.scrollToGroup = function(collection, group) {
  const element = document.getElementById(`group-${collection}-${group}`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.style.backgroundColor = 'rgba(139, 92, 246, 0.2)';
    element.style.border = '2px solid #8b5cf6';
    setTimeout(() => {
      element.style.backgroundColor = '';
      element.style.border = '';
    }, 2000);
  }
};

window.scrollToGroupById = function(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.style.backgroundColor = 'rgba(139, 92, 246, 0.2)';
    element.style.border = '2px solid #8b5cf6';
    setTimeout(() => {
      element.style.backgroundColor = '';
      element.style.border = '';
    }, 2000);
  }
};


// Render variables
window.renderVariables = function(data, stylesData = null) {
    console.log('DEBUG: renderVariables called', { 
        dataLength: data ? data.length : 0, 
        hasStylesData: !!stylesData,
        stylesKeys: stylesData ? Object.keys(stylesData) : [] 
    });

    if (stylesData) {
            console.log('DEBUG: stylesData counts:', {
                paint: stylesData.paintStyles ? stylesData.paintStyles.length : 0,
                text: stylesData.textStyles ? stylesData.textStyles.length : 0,
                effect: stylesData.effectStyles ? stylesData.effectStyles.length : 0,
                grid: stylesData.gridStyles ? stylesData.gridStyles.length : 0
            });
    }
    
    // Calculate totals for summary
    let totalVariables = 0;
    const collectionsCount = data.length;
    data.forEach(collection => {
        totalVariables += collection.variables ? collection.variables.length : 0;
    });
    
    // Update summary
    if (window.updateVariablesSummary) {
        window.updateVariablesSummary(totalVariables, collectionsCount);
    }

    const container = document.getElementById("variables-container");
    if (!container) return;
    
    // Check if both variables and styles are empty
    const hasStyles = stylesData && (
            (stylesData.textStyles && stylesData.textStyles.length > 0) || 
            (stylesData.paintStyles && stylesData.paintStyles.length > 0) || 
            (stylesData.effectStyles && stylesData.effectStyles.length > 0) || 
            (stylesData.gridStyles && stylesData.gridStyles.length > 0)
    );

    if (data.length === 0 && !hasStyles) {
        container.innerHTML = '';
        const noItemsDiv = document.createElement('div');
        noItemsDiv.className = 'no-items';
        noItemsDiv.textContent = 'No variables or styles found.';
        container.appendChild(noItemsDiv);
        return;
    }

    let html = "";

    // Analyze data for validation issues
    const validationIssues = [];
    let tailwindIssues = [];

    // Render each collection as it comes from Figma
    data.forEach((collection) => {
        if (collection.variables.length > 0) {
        const groupedVars = new Map();
        const standaloneVars = [];

        collection.variables.forEach((variable) => {
            const pathMatch = variable.name.match(/^([^\/]+)\//);
            if (pathMatch) {
            const prefix = pathMatch[1];
            if (!groupedVars.has(prefix)) {
                groupedVars.set(prefix, []);
            }
            groupedVars.get(prefix).push(variable);
            } else {
            standaloneVars.push(variable);
            }
        });

        groupedVars.forEach((variables, prefix) => {
            let hasDirectValues = false;
            let hasLinks = false;

            variables.forEach((variable) => {
            variable.valuesByMode.forEach((mode) => {
                if (
                typeof mode.value === "object" &&
                mode.value.type === "VARIABLE_ALIAS"
                ) {
                hasLinks = true;
                } else {
                hasDirectValues = true;
                }
            });
            });

            if (hasDirectValues && hasLinks) {
            const sanitizedId = `group-${collection.name.replace(
                /[^a-zA-Z0-9]/g,
                "-"
            )}-${prefix.replace(/[^a-zA-Z0-9]/g, "-")}`;
            validationIssues.push({
                collection: collection.name,
                group: prefix,
                displayName: prefix
                .replace(/-/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase()),
                issue: "mixed-values-and-links",
                sanitizedId: sanitizedId,
            });
            }
        });
        }
    });

    // Add Tailwind v4 validation issues if present
    if (window.tailwindV4Validation && !window.tailwindV4Validation.isValid && window.tailwindV4Validation.invalidGroups.length > 0) {
            tailwindIssues = [];
            
            // Build list of invalid groups with their sanitized IDs
            data.forEach(collection => {
                const groupedVars = new Map();
                
                collection.variables.forEach(variable => {
                    const pathMatch = variable.name.match(/^([^\/]+)\//);
                    if (pathMatch) {
                            const prefix = pathMatch[1];
                            if(!groupedVars.has(prefix)) {
                                groupedVars.set(prefix, []);
                            }
                            groupedVars.get(prefix).push(variable);
                    }
                });
                
                groupedVars.forEach((variables, prefix) => {
                    // Check if this group is invalid for Tailwind v4
                    if (window.tailwindV4Validation.invalidGroups.indexOf(prefix) !== -1) {
                            const sanitizedId = `group-${collection.name.replace(/[^a-zA-Z0-9]/g, "-")}-${prefix.replace(/[^a-zA-Z0-9]/g, "-")}`;
                            tailwindIssues.push({
                                collection: collection.name,
                                group: prefix,
                                displayName: prefix.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
                                sanitizedId: sanitizedId
                            });
                    }
                });
            });
    }
    
    // Render warnings to separate container
    const warningContainer = document.getElementById('variables-warning-container');
    if (warningContainer) {
            warningContainer.innerHTML = '';
            let warningHtml = '';
            
            // Show a single combined warning if there are any issues
            const hasAnyIssues = tailwindIssues.length > 0 || validationIssues.length > 0;
            if (hasAnyIssues) {
                warningHtml += `
                <div class="validation-alert validation-alert-warning">
                    <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 24px;">⚠️</span>
                    <div>
                        <strong style="color: #ff9800; display: block; margin-bottom: 4px;">Warnings detected</strong>
                        <small style="color: rgba(255, 255, 255, 0.8);">Some issues were found with your variables</small>
                    </div>
                    </div>
                    <button type="button" onclick="switchToQualityTab()" class="validation-alert-button validation-alert-button-warning">
                    Go to warnings
                    </button>
                </div>
                `;
            }
            
            warningContainer.innerHTML = warningHtml;
    }

    // Render each collection as it comes from Figma
    data.forEach((collection) => {
        if (collection.variables.length > 0) {
        const groupedVars = new Map();
        const standaloneVars = [];

        collection.variables.forEach((variable) => {
            const pathMatch = variable.name.match(/^([^\/]+)\//);
            if (pathMatch) {
            const prefix = pathMatch[1];
            if (!groupedVars.has(prefix)) {
                groupedVars.set(prefix, []);
            }
            groupedVars.get(prefix).push(variable);
            } else {
            standaloneVars.push(variable);
            }
        });

        // Build collection HTML
        const collectionId = `collection-${collection.name.replace(
            /[^a-zA-Z0-9]/g,
            "-"
        )}`;
        html += `
            <div class="variable-collection" id="${collectionId}" data-collection-id="${collectionId}">
            <div class="collection-header" onclick="toggleCollection('${collectionId}')">
                <div class="collection-info">
                <span class="material-symbols-outlined" style="font-size: 18px; color: var(--purple-light);">folder</span>
                <h3 class="collection-name-title">${collection.name}</h3>
                <span class="subgroup-stats">${collection.variables.length}</span>
                </div>
                <span class="material-symbols-outlined collection-toggle-icon">expand_more</span>
            </div>
            <div class="collection-content" id="${collectionId}-content">
        `;

        // Render standalone variables as "Ungrouped" group
        if (standaloneVars.length > 0) {
            const ungroupedName = "Ungrouped";
            const groupId = `group-${collectionId}-ungrouped`;
            
            html += `
            <div class="variable-subgroup">
                <div class="subgroup-header collapsed" onclick="toggleVariableSubgroup('${groupId}')">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="material-symbols-outlined" style="font-size: 18px; color: var(--purple-light);">dataset</span>
                    <span class="subgroup-title">${ungroupedName}</span>
                    <span class="subgroup-stats">${standaloneVars.length}</span>
                </div>
                <span class="material-symbols-outlined subgroup-toggle-icon">expand_more</span>
                </div>
                <div class="subgroup-content collapsed" id="${groupId}-content">
            `;
            
            const varsWithCollection = standaloneVars.map((v) => ({
            ...v,
            collection: collection.name,
            }));
            html += renderVariableTable(varsWithCollection);
            html += `
                </div>
            </div>
            `;
        }

        // Render grouped variables
        groupedVars.forEach((variables, prefix) => {
            const displayName = prefix
            .replace(/-/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());

            // Check if this group has mixed values and links
            let hasDirectValues = false;
            let hasLinks = false;

            variables.forEach((variable) => {
            variable.valuesByMode.forEach((mode) => {
                if (
                typeof mode.value === "object" &&
                mode.value.type === "VARIABLE_ALIAS"
                ) {
                hasLinks = true;
                } else {
                hasDirectValues = true;
                }
            });
            });

            const hasMixedValues = hasDirectValues && hasLinks;
            
            const isTailwindEnabled = (window.gitSettings?.exportFormat === 'tailwind-v4' || window.gitlabSettings?.exportFormat === 'tailwind-v4');
            const isTailwindInvalid = isTailwindEnabled && window.tailwindV4Validation && !window.tailwindV4Validation.isValid && window.tailwindV4Validation.invalidGroups.indexOf(prefix) !== -1;
            const isTailwindValid = isTailwindEnabled && window.tailwindV4Validation && window.tailwindV4Validation.groups.some(g => g.name === prefix && g.isValid);
            
            const groupId = `${collectionId}-group-${prefix.replace(/[^a-zA-Z0-9]/g, "-")}`;

            html += `
            <div class="variable-subgroup ${
                hasMixedValues || isTailwindInvalid ? "has-validation-issues" : ""
            }" id="${groupId}">
                <div class="subgroup-header" onclick="toggleVariableSubgroup('${groupId}')">
                <div class="subgroup-title">
                    ${displayName}
                    <span class="subgroup-stats">${variables.length}</span>
                    ${isTailwindValid ? `<span class="tailwind-icon" title="Valid Tailwind v4 namespace">
                            <svg viewBox="0 0 54 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M27 0C19.8 0 15.3 3.6 13.5 10.8C16.2 7.2 19.35 5.85 22.95 6.75C25.004 7.263 26.472 8.754 28.097 10.403C30.744 13.09 33.808 16.2 40.5 16.2C47.7 16.2 52.2 12.6 54 5.4C51.3 9 48.15 10.35 44.55 9.45C42.496 8.937 41.028 7.446 39.403 5.797C36.756 3.11 33.692 0 27 0ZM13.5 16.2C6.3 16.2 1.8 19.8 0 27C2.7 23.4 5.85 22.05 9.45 22.95C11.504 23.464 12.972 24.954 14.597 26.603C17.244 29.29 20.308 32.4 27 32.4C34.2 32.4 38.7 28.8 40.5 21.6C37.8 25.2 34.65 26.55 31.05 25.65C28.996 25.137 27.528 23.646 25.903 21.997C23.256 19.31 20.192 16.2 13.5 16.2Z" fill="#38bdf8"/>
                            </svg>
                            </span>` : ""}
                    ${hasMixedValues ? '<span class="material-symbols-outlined mixed-value-icon" title="Mixed values and links">alt_route</span>' : ""}
                    ${isTailwindInvalid ? `<span class="tailwind-icon" title="Invalid Tailwind namespace">
                            <svg viewBox="0 0 54 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M27 0C19.8 0 15.3 3.6 13.5 10.8C16.2 7.2 19.35 5.85 22.95 6.75C25.004 7.263 26.472 8.754 28.097 10.403C30.744 13.09 33.808 16.2 40.5 16.2C47.7 16.2 52.2 12.6 54 5.4C51.3 9 48.15 10.35 44.55 9.45C42.496 8.937 41.028 7.446 39.403 5.797C36.756 3.11 33.692 0 27 0ZM13.5 16.2C6.3 16.2 1.8 19.8 0 27C2.7 23.4 5.85 22.05 9.45 22.95C11.504 23.464 12.972 24.954 14.597 26.603C17.244 29.29 20.308 32.4 27 32.4C34.2 32.4 38.7 28.8 40.5 21.6C37.8 25.2 34.65 26.55 31.05 25.65C28.996 25.137 27.528 23.646 25.903 21.997C23.256 19.31 20.192 16.2 13.5 16.2Z" fill="#f87171"/>
                            </svg>
                            </span>` : ""}                    </div>
                <span class="material-symbols-outlined subgroup-toggle-icon">expand_more</span>
                </div>
                <div class="subgroup-content collapsed" id="${groupId}-content">
            `;
            const varsWithCollection = variables.map((v) => ({
                ...v,
                collection: collection.name,
            }));
            html += renderVariableTable(varsWithCollection);
            html += `
                </div>
            </div>
            `;
        });

        html += `
            </div>
            </div>
        `;
        }
    });
    
    // Render Styles as a Virtual Collection
    if (stylesData) {
        // Check if we have any styles
            const hasStyles = (stylesData.textStyles?.length > 0) || 
                            (stylesData.paintStyles?.length > 0) || 
                            (stylesData.effectStyles?.length > 0) || 
                            (stylesData.gridStyles?.length > 0);
        
        if (hasStyles) {
            // Calculate detailed stats
            const totalStyles = (stylesData.textStyles?.length || 0) + 
                                (stylesData.paintStyles?.length || 0) + 
                                (stylesData.effectStyles?.length || 0) + 
                                (stylesData.gridStyles?.length || 0);
            
            let categories = 0;
            if (stylesData.paintStyles?.length) categories++;
            if (stylesData.textStyles?.length) categories++;
            if (stylesData.effectStyles?.length) categories++;
            if (stylesData.gridStyles?.length) categories++;

            html += `
                <div class="tab-header" style="margin-top: 32px; margin-bottom: 16px;">
                    <div style="display: flex; align-items: baseline; gap: 12px; margin-bottom: 8px;">
                        <h2 style="color: rgba(255, 255, 255, 0.9); display: flex; align-items: center; gap: 10px; font-size: 1.2rem; margin: 0;">
                            <span class="material-symbols-outlined" style="font-size: 22px; color: #c4b5fd;">style</span>
                            Styles
                        </h2>
                        <div class="header-summary">
                            <div class="summary-badge" data-tooltip="Total Styles">
                                <span class="material-symbols-outlined">style</span>
                                <span>${totalStyles} Styles</span>
                            </div>
                            <div class="summary-badge" data-tooltip="Categories">
                                <span class="material-symbols-outlined">category</span>
                                <span>${categories} Categories</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            html += renderStylesAsCollection(stylesData);
        }
    }

    container.innerHTML = SecurityUtils.sanitizeHTML(html);
    
    // Collapse all by default
    if (window.collapseAllVariables) {
        window.collapseAllVariables();
    }
};

function renderStylesAsCollection(data) {
  if (
    !data ||
    (data.textStyles.length === 0 &&
      data.paintStyles.length === 0 &&
      data.effectStyles.length === 0 &&
      (!data.gridStyles || data.gridStyles.length === 0))
  ) {
    return '';
  }

  let html = '';

  // Render groups directly as "collections" (visually)
  if (data.paintStyles && data.paintStyles.length > 0) {
    html += renderStyleGroup('Color', data.paintStyles, 'paint', 'collection-figma-styles-paint');
  }
  if (data.textStyles && data.textStyles.length > 0) {
    html += renderStyleGroup('Text', data.textStyles, 'text', 'collection-figma-styles-text');
  }
  if (data.effectStyles && data.effectStyles.length > 0) {
    html += renderStyleGroup(
      'Effect',
      data.effectStyles,
      'effect',
      'collection-figma-styles-effect',
    );
  }
  if (data.gridStyles && data.gridStyles.length > 0) {
    html += renderStyleGroup(
      'Layout guide',
      data.gridStyles,
      'grid',
      'collection-figma-styles-grid',
    );
  }

  return html;
}

function formatDecimal(num) {
  if (typeof num !== 'number') return num;
  // Round to max 2 decimal places and remove trailing zeros
  return parseFloat(num.toFixed(2));
}

function renderStyleGroup(name, styles, type, collectionId) {
  const count = styles.length;
  const icon =
    type === 'text'
      ? 'text_fields'
      : type === 'paint'
        ? 'colorize'
        : type === 'effect'
          ? 'bolt'
          : 'grid_on';

  // Group styles by prefix
  const groups = {};
  const ungrouped = [];

  styles.forEach((style) => {
    const parts = style.name.split('/');
    if (parts.length > 1) {
      const groupName = parts[0].trim();
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(style);
    } else {
      ungrouped.push(style);
    }
  });

  const sortedGroupNames = Object.keys(groups).sort();

  // Render as a Variable Collection (top level look)
  let html = `
            <div class="variable-collection" id="${collectionId}" data-collection-id="${collectionId}">
                <div class="collection-header" onclick="toggleCollection('${collectionId}')">
                    <div class="collection-info">
                        <span class="material-symbols-outlined" style="font-size: 18px; color: var(--purple-light);">${icon}</span>
                        <h3 class="collection-name-title">${name}</h3>
                        <span class="subgroup-stats">${count}</span>
                    </div>
                    <span class="material-symbols-outlined collection-toggle-icon">expand_more</span>
                </div>
                <div class="collection-content" id="${collectionId}-content">
        `;

  // Render Subgroups
  sortedGroupNames.forEach((groupName) => {
    const groupStyles = groups[groupName];
    const groupId = `${collectionId}-group-${groupName.replace(/[^a-zA-Z0-9]/g, '-')}`;

    // Render as variable-subgroup
    html += `
                <div class="variable-subgroup">
                    <div class="subgroup-header collapsed" onclick="toggleVariableSubgroup('${groupId}')">
                        <div style="display: flex; align-items: center; gap: 8px;">
                             <span class="material-symbols-outlined" style="font-size: 18px; color: var(--purple-light);">folder</span>
                            <span class="subgroup-title">${groupName}</span>
                            <span class="subgroup-stats">${groupStyles.length}</span>
                        </div>
                        <span class="material-symbols-outlined subgroup-toggle-icon">expand_more</span>
                    </div>
                    <div class="subgroup-content collapsed" id="${groupId}-content">
                        ${renderStyleTable(groupStyles, type, true)} 
                    </div>
                </div>
            `;
  });

  // Render Ungrouped
  if (ungrouped.length > 0) {
    if (sortedGroupNames.length > 0) {
      const groupId = `${collectionId}-ungrouped`;
      html += `
                    <div class="variable-subgroup">
                        <div class="subgroup-header collapsed" onclick="toggleVariableSubgroup('${groupId}')">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span class="material-symbols-outlined" style="font-size: 18px; color: var(--purple-light);">dataset</span>
                                <span class="subgroup-title">Ungrouped</span>
                                <span class="subgroup-stats">${ungrouped.length}</span>
                            </div>
                            <span class="material-symbols-outlined subgroup-toggle-icon">expand_more</span>
                        </div>
                        <div class="subgroup-content collapsed" id="${groupId}-content">
                            ${renderStyleTable(ungrouped, type, true)}
                        </div>
                    </div>
                `;
    } else {
      html += renderStyleTable(ungrouped, type, false);
    }
  }

  html += `
                </div>
            </div>
        `;
  return html;
}

function renderStyleTable(styles, type, isGrouped = false) {
  let html = `
                <div class="variable-list">
                <div class="unified-list-header variable-header">
                    <div class="variable-cell">Name</div>
                    <div class="variable-cell">Type</div>
                    <div class="variable-cell">Values</div>
                    <div class="variable-cell" style="text-align: center;">Usage</div>
                    <div class="variable-cell"></div>
                </div>
        `;

  styles.forEach((style) => {
    const sanitizedId = style.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

    // Calculate display name (strip group prefix if grouped)
    let displayName = style.name;
    if (isGrouped) {
      const slashIndex = displayName.indexOf('/');
      if (slashIndex !== -1) {
        displayName = displayName.substring(slashIndex + 1);
      }
    }

    let valuePreview = '';

    if (type === 'paint') {
      const paint = style.paints[0];
      if (paint) {
        if (paint.type === 'SOLID') {
          const { r, g, b } = paint.color;
          const a = paint.opacity !== undefined ? paint.opacity : 1;

          let validationWarning = '';
          // Check if bound
          const isBound =
            style.boundVariables &&
            style.boundVariables['paints'] &&
            style.boundVariables['paints'][0];
          if (!isBound) {
            const matchingVar = findVariableMatchingValue(paint.color, 'paint');
            if (matchingVar) {
              validationWarning = `
                                 <span class="material-symbols-outlined" 
                                       style="font-size: 14px; color: #fbbf24; cursor: help; margin-left: 6px;" 
                                       title="Value matches variable '${matchingVar.name}'">link_off</span>`;
            }
          }

          valuePreview = `
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span class="color-preview" style="background-color: rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${a})"></span>
                                <span style="font-family: monospace; font-size: 10px;">rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${formatDecimal(a)})</span>
                                ${validationWarning}
                            </div>`;
        } else if (
          ['GRADIENT_LINEAR', 'GRADIENT_RADIAL', 'GRADIENT_ANGULAR', 'GRADIENT_DIAMOND'].includes(
            paint.type,
          )
        ) {
          // Generate CSS Gradient
          let gradientCss = '';
          if (paint.gradientStops && paint.gradientStops.length > 0) {
            const stops = paint.gradientStops
              .map((stop) => {
                const { r, g, b, a } = stop.color;
                return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a}) ${Math.round(stop.position * 100)}%`;
              })
              .join(', ');

            // Approximate direction for linear (default to to bottom right if not calc-able easily without transform math)
            // Ideally we parse gradientTransform, but for preview '135deg' is usually sufficient to show it's a gradient
            gradientCss = `linear-gradient(135deg, ${stops})`;
            // TODO: radial/angular look different but linear-gradient is a decent fallback for a tiny preview
            if (paint.type === 'GRADIENT_RADIAL') gradientCss = `radial-gradient(circle, ${stops})`;
          }

          valuePreview = `
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span class="color-preview" style="background: ${gradientCss}"></span>
                                <span style="font-size: 11px; opacity: 0.8;">${paint.type.replace('GRADIENT_', '')}</span>
                            </div>`;
        } else if (paint.type === 'IMAGE') {
          valuePreview = `
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span class="color-preview" style="background: #555; display: flex; align-items: center; justify-content: center;">
                                    <span class="material-symbols-outlined" style="font-size: 12px; color: #fff;">image</span>
                                </span>
                                <span style="font-size: 11px; opacity: 0.8;">Image</span>
                            </div>`;
        } else {
          valuePreview = `<div>${paint.type}</div>`;
        }
      } else {
        valuePreview = `<div style="opacity: 0.5;">No Paint</div>`;
      }
    } else if (type === 'text') {
      // Check binding for Font Size
      let fsWarning = '';
      const bound = style.boundVariables || {};
      if (!bound['fontSize']) {
        const matchingVar = findVariableMatchingValue(style.fontSize, 'number');
        if (matchingVar) fsWarning = '⚠️'; // Simplified for text row
      }
      valuePreview = `<div>${style.fontName.family} ${style.fontName.style} / ${formatDecimal(style.fontSize)}px ${fsWarning ? `<span title="Font Size matches a variable" style="cursor:help; font-size: 12px;">${fsWarning}</span>` : ''}</div>`;
    } else if (type === 'effect') {
      if (style.effects && style.effects.length > 0) {
        const firstEffect = style.effects[0];
        if (['DROP_SHADOW', 'INNER_SHADOW'].includes(firstEffect.type)) {
          const { r, g, b, a } = firstEffect.color;
          const colorCss = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
          const offset = firstEffect.offset;
          const blur = firstEffect.radius;
          const spread = firstEffect.spread || 0;

          // Check binding for Effect Color
          let validationWarning = '';
          const boundEffect =
            style.boundVariables &&
            style.boundVariables['effects'] &&
            style.boundVariables['effects'][0];
          const boundColor = boundEffect && boundEffect['color'];

          if (!boundColor) {
            // Try to find a matching variable for the color
            const matchingVar = findVariableMatchingValue(firstEffect.color, 'paint');
            if (matchingVar) {
              validationWarning = `
                               <span class="material-symbols-outlined" 
                                     style="font-size: 14px; color: #fbbf24; cursor: help; margin-left: 6px;" 
                                     title="Value matches variable '${matchingVar.name}'">link_off</span>`;
            }
          }

          // Create a box-shadow preview
          const shadowType = firstEffect.type === 'INNER_SHADOW' ? 'inset ' : '';
          // We can't easily show the exact shadow, but we can show a small box with it
          const shadowCss = `${shadowType}${offset.x}px ${offset.y}px ${blur}px ${spread}px ${colorCss}`;

          valuePreview = `
                            <div style="display:flex; align-items:center; gap:8px;">
                                <div style="width: 16px; height: 16px; background: #fff; border-radius: 4px; box-shadow: ${shadowCss}; border: 1px solid rgba(255,255,255,0.1);"></div>
                                <span style="font-size: 11px; opacity: 0.8;">${firstEffect.type.replace('_', ' ')}</span>
                                ${validationWarning}
                            </div>
                       `;
        } else if (firstEffect.type === 'LAYER_BLUR' || firstEffect.type === 'BACKGROUND_BLUR') {
          valuePreview = `
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span class="material-symbols-outlined" style="font-size: 16px; opacity: 0.7;">blur_on</span>
                                <span style="font-size: 11px; opacity: 0.8;">${firstEffect.type.replace('_', ' ')}: ${firstEffect.radius}px</span>
                            </div>`;
        } else {
          valuePreview = `<div>${style.effects.length} effect(s)</div>`;
        }
      } else {
        valuePreview = `<div style="opacity: 0.5;">No Effects</div>`;
      }
    } else if (type === 'grid') {
      valuePreview = `<div>${style.layoutGrids.length} grid(s)</div>`;
    }

    html += `
                <div class="unified-list-item variable-row" id="style-${sanitizedId}">
                    <div class="variable-cell" style="font-weight: 500; color: #fff;">${displayName}</div>
                    <div class="variable-cell" style="color: rgba(255, 255, 255, 0.4); font-size: 11px; letter-spacing: 0.5px;">${
                      type === 'paint'
                        ? 'Color'
                        : type === 'text'
                          ? 'Text'
                          : type === 'effect'
                            ? 'Effect'
                            : type === 'grid'
                              ? 'Layout guide'
                              : type
                    }</div>
                    <div class="variable-cell">${valuePreview}</div>
                    <div class="variable-cell" style="display: flex; justify-content: center;">
                        <span class="subgroup-stats" title="Used in ${style.usageCount || 0} layers">${style.usageCount || 0}</span>
                    </div>
                    <div class="variable-cell" style="display: flex; justify-content: flex-end;">
                      <button class="icon-button delete-btn" onclick="deleteStyle('${style.id}', '${style.name.replace(/'/g, "\\'")}', '${type}')" title="Delete style">
                        <span class="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                </div>
            `;
  });

  html += `</div>`;
  return html;
}

function findVariableMatchingValue(valueToMatch, type) {
  if (!window.variablesData || !valueToMatch) return null;

  // Helper to check equality
  const isMatch = (v1, v2, type) => {
    if (type === 'paint' || type === 'color') {
      if (typeof v1 !== 'object' || typeof v2 !== 'object') return false;
      // Handle RGB/RGBA objects
      // Check if v1 looks like {r, g, b, a?}
      if (v1.r !== undefined && v2.r !== undefined) {
        // Compare r, g, b with slight tolerance
        const sameR = Math.abs(v1.r - v2.r) < 0.001;
        const sameG = Math.abs(v1.g - v2.g) < 0.001;
        const sameB = Math.abs(v1.b - v2.b) < 0.001;
        const a1 = v1.a !== undefined ? v1.a : 1;
        const a2 = v2.a !== undefined ? v2.a : 1;
        const sameA = Math.abs(a1 - a2) < 0.001;
        return sameR && sameG && sameB && sameA;
      }
      return false;
    } else if (type === 'number' || typeof valueToMatch === 'number') {
      // Number comparison with tolerance
      if (typeof v1 === 'number' && typeof v2 === 'number') {
        return Math.abs(v1 - v2) < 0.01;
      }
      return v1 === v2;
    } else {
      // String comparison
      return v1 === v2;
    }
  };

  for (const collection of window.variablesData) {
    for (const variable of collection.variables) {
      // Check if resolvedType matches expected type
      let typeMatch = false;
      if (type === 'paint' && variable.resolvedType === 'COLOR') typeMatch = true;
      if (type === 'number' && variable.resolvedType === 'FLOAT') typeMatch = true;
      if (type === 'string' && variable.resolvedType === 'STRING') typeMatch = true;

      if (!typeMatch) continue;

      // Check values in all modes
      for (const modeVal of variable.valuesByMode) {
        if (
          (modeVal.value && typeof modeVal.value !== 'object') ||
          (modeVal.value && modeVal.value.type !== 'VARIABLE_ALIAS')
        ) {
          if (isMatch(valueToMatch, modeVal.value, type)) {
            return variable;
          }
        }
      }
    }
  }
  return null;
}

// Render a group of variables with a title
function renderVariableTable(variables) {
        let html = `
            <div class="variable-list">
                <div class="unified-list-header variable-header">
                    <div class="variable-cell">Name</div>
                    <div class="variable-cell">Type</div>
                    <div class="variable-cell">Values</div>
                    <div class="variable-cell" style="text-align: center;">Usage</div>
                    <div class="variable-cell"></div>
                </div>
        `;

        variables.forEach((variable) => {
            const sanitizedId = variable.name
            .replace(/[^a-zA-Z0-9]/g, "-")
            .toLowerCase();
            const safeVariableName = variable.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            
            html += `
            <div class="unified-list-item variable-row" id="var-${sanitizedId}">
                <div class="variable-cell" style="font-weight: 500; color: #fff; display: flex; align-items: center;">${variable.name}</div>
                <div class="variable-cell" style="color: rgba(255, 255, 255, 0.4); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">${variable.resolvedType === 'FLOAT' ? 'NUMBER' : variable.resolvedType}</div>
                <div class="variable-cell">
            `;

            variable.valuesByMode.forEach((mode) => {
            const value = mode.value;
            const showModeName = variable.valuesByMode.length > 1;

            // Check if this is a variable alias
            if (typeof value === "object" && value.type === "VARIABLE_ALIAS") {
                const referencedVariableName = window.findVariableNameById(value.id);
                const sanitizedName = referencedVariableName
                ? referencedVariableName
                    .replace(/[^a-zA-Z0-9]/g, "-")
                    .toLowerCase()
                : null;
                html += `
                <div>
                    ${showModeName ? `<span style="opacity:0.5; font-size:11px;">${mode.modeName}:</span> ` : ""}<span 
                    style="color: rgba(255,255,255,0.9); cursor: pointer; border-bottom: 1px dashed rgba(255,255,255,0.4);" 
                    onclick="scrollToVariable('${sanitizedName}')"
                    title="Click to jump to ${referencedVariableName}"
                    >${referencedVariableName || value.id}</span>
                </div>
                `;
            }
            // Display color values with a preview
            else if (
                variable.resolvedType === "COLOR" &&
                typeof value === "object" &&
                value.r !== undefined
            ) {
                const r = Math.round(value.r * 255);
                const g = Math.round(value.g * 255);
                const b = Math.round(value.b * 255);
                const a = value.a ?? 1;

                html += `
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span class="color-preview" style="background-color: rgba(${r},${g},${b},${a}); width: 14px; height: 14px; border-radius: 4px; display: inline-block;"></span>
                    <span>${
                    showModeName ? mode.modeName + ": " : ""
                    }rgba(${r},${g},${b},${formatDecimal(a)})</span>
                </div>
                `;
            } else {
                // Fix for string formatting: don't stringify strings
                const displayValue = typeof value === 'string' ? value : (typeof value === 'number' ? formatDecimal(value) : JSON.stringify(value));
                html += `<div>${
                showModeName ? mode.modeName + ": " : ""
                }${displayValue}</div>`;
            }
            });

            html += `</div>
                
                <!-- Usage badge -->
                <div class="variable-cell" style="display: flex; justify-content: center;">
                    <span class="subgroup-stats" title="Used in ${variable.usageCount || 0} layers">${variable.usageCount || 0}</span>
                </div>
                
                <div class="variable-cell" style="display: flex; justify-content: flex-end;">
                <button class="icon-button delete-btn" onclick="deleteVariable('${variable.id}', '${safeVariableName}')" title="Delete variable">
                    <span class="material-symbols-outlined">delete</span>
                </button>
                </div>
            </div>
            `;
        });

        html += `
            </div>
        `;

        return html;
}

window.toggleCollection = function (collectionId) {
  try {
    const content = document.getElementById(collectionId + '-content');
    const header = document.querySelector(`#${collectionId} .collection-header`);

    if (!content || !header) return;

    const isCollapsed = content.classList.contains('collapsed');

    if (isCollapsed) {
      content.classList.remove('collapsed');
      header.classList.remove('collapsed');
    } else {
      content.classList.add('collapsed');
      header.classList.add('collapsed');
    }
  } catch (error) {
    console.error('Error toggling collection:', error);
  }
};

window.toggleVariableSubgroup = function (groupId) {
    try {
        const content = document.getElementById(groupId + '-content');

        if (!content) {
        console.log('Content element not found for groupId:', groupId);
        return;
        }

        // Find the header by looking at the parent's subgroup-header child
        const parent = content.parentElement;
        const header = parent ? parent.querySelector('.subgroup-header') : null;

        if (!header) {
        console.log('Header element not found for groupId:', groupId);
        return;
        }

        const isCollapsed = content.classList.contains('collapsed');

        if (isCollapsed) {
        content.classList.remove('collapsed');
        content.classList.add('expanded');
        header.classList.remove('collapsed');
        } else {
        content.classList.remove('expanded');
        content.classList.add('collapsed');
        header.classList.add('collapsed');
        }
    } catch (error) {
        console.error('Error toggling subgroup:', error);
    }
};

window.expandAllVariables = function() {
  console.log('Expanding all variable collections');
  const collections = document.querySelectorAll('.variable-collection');
  collections.forEach((coll) => {
    const content = coll.querySelector('.collection-content');
    const header = coll.querySelector('.collection-header');
    if (content) content.classList.remove('collapsed');
    if (header) header.classList.remove('collapsed');

    const collectionId = coll.getAttribute('data-collection-id');
    if (collectionId) {
       // Expand subgroups manually since we renamed logic
       const subgroups = coll.querySelectorAll('.variable-subgroup');
       subgroups.forEach(sub => {
           const subContent = sub.querySelector('.subgroup-content');
           const subHeader = sub.querySelector('.subgroup-header');
           if (subContent) {
               subContent.classList.remove('collapsed');
               subContent.classList.add('expanded');
           }
           if (subHeader) subHeader.classList.remove('collapsed');
       });
    }
  });
};

window.collapseAllVariables = function() {
  console.log('Collapsing all variable collections');
  const collections = document.querySelectorAll('.variable-collection');
  collections.forEach((coll) => {
    const content = coll.querySelector('.collection-content');
    const header = coll.querySelector('.collection-header');
    if (content) content.classList.add('collapsed');
    if (header) header.classList.add('collapsed');
    
    // Collapse subgroups
    const subgroups = coll.querySelectorAll('.variable-subgroup');
    subgroups.forEach(sub => {
        const subContent = sub.querySelector('.subgroup-content');
        const subHeader = sub.querySelector('.subgroup-header');
        if (subContent) {
            subContent.classList.add('collapsed');
            subContent.classList.remove('expanded');
        }
        if (subHeader) subHeader.classList.add('collapsed');
    });
  });
};

window.updateVariablesSummary = function(variablesCount, collectionsCount) {
  const countElement = document.getElementById('variables-total-count');
  if (countElement) {
    countElement.textContent = `${variablesCount} variables in ${collectionsCount} collections`;
  }
  
  // Also update header badge if using new layout
  const headerBadge = document.querySelector('.tab-header .summary-badge span:nth-child(2)');
  if (headerBadge) {
      headerBadge.textContent = `${variablesCount} Variables`;
  }
};

window.deleteVariable = function(variableId, variableName) {
  if (confirm(`Are you sure you want to delete variable "${variableName}"? This cannot be undone.`)) {
    parent.postMessage({
      pluginMessage: {
        type: 'delete-variable',
        variableId: variableId
      }
    }, '*');
  }
};

window.deleteStyle = function(styleId, styleName, styleType) {
  if (confirm(`Are you sure you want to delete style "${styleName}"? This cannot be undone.`)) {
    parent.postMessage({
      pluginMessage: {
        type: 'delete-style',
        styleId: styleId,
        styleType: styleType // Pass the type so we know which collection to look in
      }
    }, '*');
  }
};

// Filter Variables logic
window.filterVariables = function(searchTerm) {
    if (!window.variablesData) return;
    
    const filteredData = window.variablesData
      .map((collection) => {
        return {
          ...collection,
          variables: collection.variables.filter((variable) => {
            // Search in variable name
            if (variable.name.toLowerCase().includes(searchTerm)) {
              return true;
            }

            // Search in variable type
            if (variable.resolvedType && variable.resolvedType.toLowerCase().includes(searchTerm)) {
              return true;
            }

            // Search in variable values
            if (variable.valuesByMode && Array.isArray(variable.valuesByMode)) {
              return variable.valuesByMode.some((mode) => {
                const value = mode.value;

                // Search in mode name
                if (mode.modeName && mode.modeName.toLowerCase().includes(searchTerm)) {
                  return true;
                }

                // Handle VARIABLE_ALIAS references
                if (typeof value === 'object' && value && value.type === 'VARIABLE_ALIAS') {
                  // Search by the referenced variable name if we can find it
                  const referencedVar = window.findVariableById(value.id);
                  if (referencedVar && referencedVar.name.toLowerCase().includes(searchTerm)) {
                    return true;
                  }
                }

                // Search in color values
                if (
                  variable.resolvedType === 'COLOR' &&
                  typeof value === 'object' &&
                  value &&
                  value.r !== undefined
                ) {
                  const r = Math.round(value.r * 255);
                  const g = Math.round(value.g * 255);
                  const b = Math.round(value.b * 255);
                  const a = value.a !== undefined ? value.a : 1;

                  // Search in rgba format
                  const rgbaString = `rgba(${r},${g},${b},${a})`;
                  if (rgbaString.includes(searchTerm)) {
                    return true;
                  }

                  // Search in rgb format
                  const rgbString = `rgb(${r},${g},${b})`;
                  if (rgbString.includes(searchTerm)) {
                    return true;
                  }

                  // Search in hex format
                  const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
                  if (hex.toLowerCase().includes(searchTerm)) {
                    return true;
                  }

                  // Search individual color components
                  if (
                    searchTerm === r.toString() ||
                    searchTerm === g.toString() ||
                    searchTerm === b.toString()
                  ) {
                    return true;
                  }
                }

                // Search in numeric values (including with px suffix)
                if (typeof value === 'number') {
                  // Check exact number
                  if (value.toString().includes(searchTerm)) {
                    return true;
                  }
                  // Check with px suffix
                  if (`${value}px`.includes(searchTerm)) {
                    return true;
                  }
                  // Check just the number part if search includes 'px'
                  if (
                    searchTerm.includes('px') &&
                    searchTerm.replace('px', '') === value.toString()
                  ) {
                    return true;
                  }
                }

                // Search in string values
                if (typeof value === 'string') {
                  if (value.toLowerCase().includes(searchTerm)) {
                    return true;
                  }
                }

                return false;
              });
            }

            return false;
          }),
        };
      })
      .filter((collection) => collection.variables.length > 0);

    // Filter Styles
    let filteredStyles = null;
    if (window.stylesData) {
        filteredStyles = {
        paintStyles: window.stylesData.paintStyles
            ? window.stylesData.paintStyles.filter((s) => s.name.toLowerCase().includes(searchTerm))
            : [],
        textStyles: window.stylesData.textStyles
            ? window.stylesData.textStyles.filter((s) => s.name.toLowerCase().includes(searchTerm))
            : [],
        effectStyles: window.stylesData.effectStyles
            ? window.stylesData.effectStyles.filter((s) => s.name.toLowerCase().includes(searchTerm))
            : [],
        gridStyles: window.stylesData.gridStyles
            ? window.stylesData.gridStyles.filter((s) => s.name.toLowerCase().includes(searchTerm))
            : [],
        };
    }

    renderVariables(filteredData, filteredStyles);

    // Auto-expand if searching
    if (searchTerm && window.expandAllVariables) {
        window.expandAllVariables();
    }
};

window.openCreateVariableModal = function (value, issueId) {
  const modal = document.getElementById('create-variable-modal');
  if (!modal) return;

  const valueDisplay = document.getElementById('create-var-value-display');
  if (valueDisplay) valueDisplay.textContent = value;
  
  const issueIdInput = document.getElementById('create-var-issue-id');
  if (issueIdInput) issueIdInput.value = issueId;
  
  const nameInput = document.getElementById('create-var-name');
  if (nameInput) nameInput.value = '';

  // Reset new inputs
  const newColInput = document.getElementById('create-var-new-collection');
  if (newColInput) newColInput.style.display = 'none';
  const newGroupInput = document.getElementById('create-var-new-group');
  if (newGroupInput) newGroupInput.style.display = 'none';

  // Populate Collections
  const collectionSelect = document.getElementById('create-var-collection');
  if (collectionSelect) {
    collectionSelect.innerHTML = '';

    // Use global variables data if available, or empty array
    const collections = window.variablesData || [];

    collections.forEach((col) => {
      const opt = document.createElement('option');
      opt.value = col.name;
      opt.text = col.name;
      collectionSelect.appendChild(opt);
    });

    // Add "Create New" option
    const createNewOpt = document.createElement('option');
    createNewOpt.value = 'create-new';
    createNewOpt.text = 'Create New Collection...';
    collectionSelect.appendChild(createNewOpt);

    // Select first one by default if exists
    if (collections.length > 0) {
      collectionSelect.selectedIndex = 0;
    }

    // Trigger group update
    if (window.handleCollectionChange) window.handleCollectionChange();
  }

  modal.style.display = 'block';
  document.body.classList.add('modal-open');

  setTimeout(() => {
    if (collectionSelect && collectionSelect.value === 'create-new') {
      const newCol = document.getElementById('create-var-new-collection');
      if (newCol) newCol.focus();
    } else {
      const nameIn = document.getElementById('create-var-name');
      if (nameIn) nameIn.focus();
    }
  }, 100);
};

window.handleCollectionChange = function () {
  const colSelect = document.getElementById('create-var-collection');
  const groupSelect = document.getElementById('create-var-group');
  const newColInput = document.getElementById('create-var-new-collection');

  if (!colSelect || !groupSelect) return;

  const selectedColName = colSelect.value;

  // Toggle new collection input
  if (selectedColName === 'create-new') {
    if (newColInput) {
        newColInput.style.display = 'block';
        newColInput.focus();
    }
    // Reset groups
    groupSelect.innerHTML =
      '<option value="">(No Group)</option><option value="create-new">Create New Group...</option>';
    return; // No existing groups to show
  } else {
    if (newColInput) newColInput.style.display = 'none';
  }

  // Populate Groups for selected collection
  groupSelect.innerHTML = '';
  groupSelect.appendChild(new Option('(No Group)', ''));

  const collections = window.variablesData || [];
  const selectedCol = collections.find((c) => c.name === selectedColName);

  if (selectedCol && selectedCol.variables) {
    const groups = new Set();
    selectedCol.variables.forEach((v) => {
      if (v.name.includes('/')) {
        // Extract group path (everything before last slash)
        const parts = v.name.split('/');
        parts.pop(); // Remove variable name
        const groupName = parts.join('/');
        groups.add(groupName);
      }
    });

    // Add existing groups
    Array.from(groups)
      .sort()
      .forEach((g) => {
        groupSelect.appendChild(new Option(g, g));
      });
  }

  // Always add create new group option
  groupSelect.appendChild(new Option('Create New Group...', 'create-new'));

  // Trigger group change to set input visibility
  if (window.handleGroupChange) window.handleGroupChange();
};

window.handleGroupChange = function () {
  const groupSelect = document.getElementById('create-var-group');
  const newGroupInput = document.getElementById('create-var-new-group');

  if (groupSelect && groupSelect.value === 'create-new') {
    if (newGroupInput) {
        newGroupInput.style.display = 'block';
        newGroupInput.focus();
    }
  } else {
    if (newGroupInput) newGroupInput.style.display = 'none';
  }
};

window.closeCreateVariableModal = function () {
  const modal = document.getElementById('create-variable-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
  }

  const issueIdInput = document.getElementById('create-var-issue-id');
  const issueId = issueIdInput ? issueIdInput.value : null;
  
  if (issueId) {
    const select = document.getElementById(`${issueId}-var-select`);
    if (select && select.value === 'create-new') {
      select.value = '';
    }
  }
};

window.submitCreateVariable = function () {
  const nameInput = document.getElementById('create-var-name').value.trim();
  const valueDisplay = document.getElementById('create-var-value-display');
  const value = valueDisplay ? valueDisplay.textContent.trim() : '';
  const issueIdInput = document.getElementById('create-var-issue-id');
  const issueId = issueIdInput ? issueIdInput.value : '';

  // Collection Logic
  const colSelect = document.getElementById('create-var-collection');
  let collectionName = colSelect.value;
  if (collectionName === 'create-new') {
    collectionName = document.getElementById('create-var-new-collection').value.trim();
    if (!collectionName) {
      alert('Please enter a name for the new collection.');
      return;
    }
  }

  // Group Logic
  const groupSelect = document.getElementById('create-var-group');
  let groupName = groupSelect.value;
  if (groupName === 'create-new') {
    groupName = document.getElementById('create-var-new-group').value.trim();
    if (!groupName) {
      alert('Please enter a name for the new group.');
      return;
    }
  }

  if (!nameInput) {
    alert('Please enter a variable name.');
    return;
  }

  // VALIDATION: Check for invalid characters (dots)
  if (nameInput.includes('.')) {
    alert('Variable names cannot contain dots (.). Please use hyphens (-) or slashes (/) instead.');
    // Optional: Auto-fix focus
    const input = document.getElementById('create-var-name');
    if (input) {
        input.value = nameInput.replace(/\./g, '-');
        input.focus();
    }
    return;
  }

  // Construct full variable name
  let fullVariableName = nameInput;
  if (groupName) {
    // Ensure clean slash handling
    fullVariableName = `${groupName}/${nameInput}`;
  }

  console.log('Creating variable:', { fullVariableName, value, collectionName });

  // Set pending state to persist expansion after reload (using global from state.js if exists, or defining here)
  window.pendingFixIssueId = issueId;
  
  // Extract category from issueId (format: issue-{Category}-{Index})
  const parts = issueId.split('-');
  let category = '';
  if (parts.length >= 3) {
      category = parts.slice(1, parts.length - 1).join('-');
  }
  
  window.pendingFixContext = {
      category: category,
      value: value,
      originalId: issueId,
      fullVariableName: fullVariableName // Store for auto-selection
  };

  // Send to backend
  parent.postMessage(
    {
      pluginMessage: {
        type: 'create-variable',
        name: fullVariableName,
        value: value,
        collectionName: collectionName,
        context: { issueId: issueId },
      },
    },
    '*',
  );

  // Update UI
  const select = document.getElementById(`${issueId}-var-select`);
  if (select) {
    const opt = document.createElement('option');
    opt.text = `Creating ${fullVariableName}...`;
    opt.value = 'creating';
    select.add(opt);
    select.value = 'creating';
    select.disabled = true;
  }

  window.closeCreateVariableModal();
};

window.initVariablesTab = function() {
  const variableSearchElement = document.getElementById('variable-search');
  if (variableSearchElement) {
    // Check if listener is already attached (optional, but good practice)
    // For now, we assume this init is called once.
    variableSearchElement.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        // Update transparency of clear button is handled by search.js initSearchFeatures
        // But we need to call filter
        window.filterVariables(searchTerm);
    });
  }
};
