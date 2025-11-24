/**
 * ES2015-compatible helper functions for features not available in all environments
 */

/**
 * ES2015-compatible Object.entries replacement
 */
export function objectEntries<T>(obj: Record<string, T>): Array<[string, T]> {
  const keys = Object.keys(obj);
  const result: Array<[string, T]> = [];
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    result.push([key, obj[key]]);
  }
  
  return result;
}

/**
 * ES2015-compatible Object.values replacement
 */
export function objectValues<T>(obj: Record<string, T>): T[] {
  const keys = Object.keys(obj);
  const result: T[] = [];
  
  for (let i = 0; i < keys.length; i++) {
    result.push(obj[keys[i]]);
  }
  
  return result;
}

/**
 * ES2015-compatible Object.fromEntries replacement
 */
export function objectFromEntries<T>(entries: Array<[string, T]>): Record<string, T> {
  const result: Record<string, T> = {};
  
  for (let i = 0; i < entries.length; i++) {
    const [key, value] = entries[i];
    result[key] = value;
  }
  
  return result;
}

/**
 * ES2015-compatible Array.prototype.includes replacement
 */
export function arrayIncludes<T>(array: readonly T[], searchElement: T): boolean {
  for (let i = 0; i < array.length; i++) {
    if (array[i] === searchElement) {
      return true;
    }
  }
  return false;
}

/**
 * ES2015-compatible String.prototype.includes replacement (though startsWith should work in ES2015)
 */
export function stringIncludes(str: string, searchString: string): boolean {
  return str.indexOf(searchString) !== -1;
}

/**
 * ES2015-compatible Array.prototype.flatMap replacement
 */
export function arrayFlatMap<T, U>(array: T[], callback: (value: T, index: number, array: T[]) => U[]): U[] {
  const result: U[] = [];
  
  for (let i = 0; i < array.length; i++) {
    const mapped = callback(array[i], i, array);
    for (let j = 0; j < mapped.length; j++) {
      result.push(mapped[j]);
    }
  }
  
  return result;
}

/**
 * ES2015-compatible Object.assign replacement (should be available in ES2015 but just in case)
 */
export function objectAssign<T extends {}>(target: T, ...sources: any[]): T {
  if (target == null) {
    throw new TypeError('Cannot convert undefined or null to object');
  }

  const to = Object(target);

  for (let index = 0; index < sources.length; index++) {
    const nextSource = sources[index];

    if (nextSource != null) {
      for (const nextKey in nextSource) {
        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
          to[nextKey] = nextSource[nextKey];
        }
      }
    }
  }

  return to;
}