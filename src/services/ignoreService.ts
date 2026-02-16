export interface IgnoreList {
  variables: {
    ids: string[];           // individual variable IDs
    collectionIds: string[]; // entire collection IDs
  };
  components: {
    ids: string[];           // individual component/variant IDs
    setIds: string[];        // entire component set IDs
  };
}

export type IgnoreItemType = 'variable' | 'collection' | 'component' | 'component-set';

const STORAGE_KEY = 'quality_ignore_list';

const EMPTY_LIST: IgnoreList = {
  variables: { ids: [], collectionIds: [] },
  components: { ids: [], setIds: [] },
};

export class IgnoreService {
  /**
   * Load the ignore list from figma.clientStorage.
   * Returns a default empty shape if none exists.
   */
  static async load(): Promise<IgnoreList> {
    try {
      const stored = await figma.clientStorage.getAsync(STORAGE_KEY);
      if (stored && typeof stored === 'object') {
        // Ensure all expected arrays exist (defensive against partial data)
        return {
          variables: {
            ids: Array.isArray(stored.variables?.ids) ? stored.variables.ids : [],
            collectionIds: Array.isArray(stored.variables?.collectionIds) ? stored.variables.collectionIds : [],
          },
          components: {
            ids: Array.isArray(stored.components?.ids) ? stored.components.ids : [],
            setIds: Array.isArray(stored.components?.setIds) ? stored.components.setIds : [],
          },
        };
      }
    } catch (e) {
      console.warn('[IgnoreService] Failed to load ignore list:', e);
    }
    return { ...EMPTY_LIST, variables: { ...EMPTY_LIST.variables }, components: { ...EMPTY_LIST.components } };
  }

  /**
   * Persist the ignore list to figma.clientStorage.
   */
  static async save(list: IgnoreList): Promise<void> {
    await figma.clientStorage.setAsync(STORAGE_KEY, list);
  }

  /**
   * Add an item to the ignore list. Returns a new IgnoreList (immutable).
   */
  static addItem(list: IgnoreList, type: IgnoreItemType, id: string): IgnoreList {
    const next: IgnoreList = {
      variables: {
        ids: [...list.variables.ids],
        collectionIds: [...list.variables.collectionIds],
      },
      components: {
        ids: [...list.components.ids],
        setIds: [...list.components.setIds],
      },
    };

    switch (type) {
      case 'variable':
        if (next.variables.ids.indexOf(id) === -1) next.variables.ids.push(id);
        break;
      case 'collection':
        if (next.variables.collectionIds.indexOf(id) === -1) next.variables.collectionIds.push(id);
        break;
      case 'component':
        if (next.components.ids.indexOf(id) === -1) next.components.ids.push(id);
        break;
      case 'component-set':
        if (next.components.setIds.indexOf(id) === -1) next.components.setIds.push(id);
        break;
    }

    return next;
  }

  /**
   * Remove an item from the ignore list. Returns a new IgnoreList (immutable).
   */
  static removeItem(list: IgnoreList, type: IgnoreItemType, id: string): IgnoreList {
    const next: IgnoreList = {
      variables: {
        ids: [...list.variables.ids],
        collectionIds: [...list.variables.collectionIds],
      },
      components: {
        ids: [...list.components.ids],
        setIds: [...list.components.setIds],
      },
    };

    switch (type) {
      case 'variable':
        next.variables.ids = next.variables.ids.filter(i => i !== id);
        break;
      case 'collection':
        next.variables.collectionIds = next.variables.collectionIds.filter(i => i !== id);
        break;
      case 'component':
        next.components.ids = next.components.ids.filter(i => i !== id);
        break;
      case 'component-set':
        next.components.setIds = next.components.setIds.filter(i => i !== id);
        break;
    }

    return next;
  }

  /**
   * Check if a variable is ignored (by its own ID or its collection ID).
   */
  static isVariableIgnored(list: IgnoreList, varId: string, collectionId: string): boolean {
    return list.variables.ids.indexOf(varId) !== -1 || list.variables.collectionIds.indexOf(collectionId) !== -1;
  }

  /**
   * Check if a component is ignored (by its own ID or its set ID).
   */
  static isComponentIgnored(list: IgnoreList, compId: string, setId?: string): boolean {
    if (list.components.ids.indexOf(compId) !== -1) return true;
    if (setId && list.components.setIds.indexOf(setId) !== -1) return true;
    return false;
  }
}
