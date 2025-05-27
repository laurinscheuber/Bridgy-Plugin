/**
 * Handles filtering logic for variables and components
 */
class FilterService {
  constructor() {
    this.activeFilters = {
      search: '',
      type: 'all',
      collection: 'all'
    };
    this.originalData = [];
    this.onFilterChangeCallback = null;
  }

  /**
   * Sets the original data to filter
   */
  setData(data) {
    this.originalData = data;
  }

  /**
   * Sets a callback to be called when filters change
   */
  onFilterChange(callback) {
    this.onFilterChangeCallback = callback;
  }

  /**
   * Updates a filter and applies all filters
   */
  updateFilter(filterType, value) {
    this.activeFilters[filterType] = value;
    this.applyFilters();
  }

  /**
   * Clears a specific filter
   */
  clearFilter(filterType) {
    if (filterType === 'search') {
      this.activeFilters.search = '';
    } else if (filterType === 'type') {
      this.activeFilters.type = 'all';
    } else if (filterType === 'collection') {
      this.activeFilters.collection = 'all';
    }
    this.applyFilters();
  }

  /**
   * Applies all active filters to the data
   */
  applyFilters() {
    const searchTerm = this.activeFilters.search.toLowerCase();
    const typeFilter = this.activeFilters.type;
    const collectionFilter = this.activeFilters.collection;

    // Create a filtered copy of the variables data
    let filteredData = [...this.originalData];

    // Apply collection filter first if specified
    if (collectionFilter !== 'all') {
      filteredData = filteredData.filter(collection =>
        collection.name === collectionFilter
      );
    }

    // Then apply type and search filters to variables within collections
    filteredData = filteredData.map(collection => {
      return {
        ...collection,
        variables: collection.variables.filter(variable => {
          // Filter by type
          const typeMatch = typeFilter === 'all' || variable.resolvedType === typeFilter;

          // Filter by search term (match name or values)
          let searchMatch = true;
          if (searchTerm) {
            // Check if name matches
            const nameMatch = variable.name.toLowerCase().includes(searchTerm);

            // Check if any value matches (for strings, numerics, etc.)
            let valueMatch = false;

            // Look through all modes and their values
            for (const mode of variable.valuesByMode) {
              const value = mode.value;

              if (typeof value === 'string' && value.toLowerCase().includes(searchTerm)) {
                valueMatch = true;
                break;
              } else if (typeof value === 'number' && value.toString().includes(searchTerm)) {
                valueMatch = true;
                break;
              } else if (
                typeof value === 'object' &&
                value !== null &&
                'r' in value &&
                'g' in value &&
                'b' in value
              ) {
                // For colors, convert to hex and check if it matches
                const r = Math.round(value.r * 255);
                const g = Math.round(value.g * 255);
                const b = Math.round(value.b * 255);
                const a = value.a !== undefined ? value.a : 1;

                const hexColor = this.rgbaToHex(r, g, b, a);
                if (hexColor.toLowerCase().includes(searchTerm)) {
                  valueMatch = true;
                  break;
                }
              }
            }

            // Match if either name or value matches
            searchMatch = nameMatch || valueMatch;
          }

          return typeMatch && searchMatch;
        })
      };
    }).filter(collection => collection.variables.length > 0);

    // Call the callback with filtered data
    if (this.onFilterChangeCallback) {
      this.onFilterChangeCallback(filteredData, this.getActiveFilterTags());
    }
  }

  /**
   * Gets active filter tags for display
   */
  getActiveFilterTags() {
    const tags = [];

    if (this.activeFilters.search) {
      tags.push({
        type: 'search',
        label: `Search: "${this.activeFilters.search}"`
      });
    }

    if (this.activeFilters.type !== 'all') {
      tags.push({
        type: 'type',
        label: `Type: ${this.activeFilters.type}`
      });
    }

    if (this.activeFilters.collection !== 'all') {
      tags.push({
        type: 'collection',
        label: `Collection: ${this.activeFilters.collection}`
      });
    }

    return tags;
  }

  /**
   * Filters components by search term
   */
  filterComponents(componentsData, searchTerm) {
    if (!searchTerm) {
      return componentsData;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();

    return componentsData.filter(component =>
      component.name.toLowerCase().includes(lowerSearchTerm) ||
      (component.children &&
        component.children.some(child =>
          child.name.toLowerCase().includes(lowerSearchTerm)
        ))
    );
  }

  /**
   * Convert RGBA to HEX color (helper method)
   */
  rgbaToHex(r, g, b, a = 1) {
    const toHex = (value) => {
      const hex = value.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    if (a === 1) {
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    const alphaHex = Math.round(a * 255);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(alphaHex)}`;
  }
}

// Create global instance
window.filterService = new FilterService();