import { VariableCollectionData, VariableData } from '../../shared/types';

/**
 * Collects variables from Figma document
 */
export class VariableCollector {
  /**
   * Collects all variables from the Figma document
   */
  static async collectAll(): Promise<VariableCollectionData[]> {
    const variableCollections = await figma.variables.getLocalVariableCollectionsAsync();
    const variablesData: VariableCollectionData[] = [];

    for (const collection of variableCollections) {
      const variablesPromises = collection.variableIds.map(async (id) => {
        const variable = await figma.variables.getVariableByIdAsync(id);
        if (!variable) return null;

        const valuesByModeEntries: Array<{ modeName: string; value: any }> = [];

        // Handle valuesByMode in a TypeScript-friendly way
        for (const modeId in variable.valuesByMode) {
          const value = variable.valuesByMode[modeId];
          const mode = collection.modes.find((m) => m.modeId === modeId);
          valuesByModeEntries.push({
            modeName: mode ? mode.name : "Unknown",
            value: value,
          });
        }

        return {
          id: variable.id,
          name: variable.name,
          variableType: variable.resolvedType,
          valuesByMode: valuesByModeEntries,
        } as VariableData;
      });

      const variablesResult = await Promise.all(variablesPromises);
      const variables = variablesResult.filter((item) => item !== null) as VariableData[];

      variablesData.push({
        name: collection.name,
        variables: variables,
      });
    }

    return variablesData;
  }
}