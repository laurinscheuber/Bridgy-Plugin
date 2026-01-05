import { ComponentService } from "../../services/componentService";
import { objectEntries } from "../../utils/es2015-helpers";

export class DocumentController {
  static async collectDocumentData() {
    try {
      // Collection variables
      const variableCollections = await figma.variables.getLocalVariableCollectionsAsync();
      const variablesData = [];

      // Sort collections alphabetically by name
      const sortedCollections = variableCollections.sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      for (const collection of sortedCollections) {
        const variablesPromises = collection.variableIds.map(async (id) => {
          const variable = await figma.variables.getVariableByIdAsync(id);
          if (!variable) return null;

          const valuesByModeEntries = [];

          // Handle valuesByMode in a TypeScript-friendly way
          Object.keys(variable.valuesByMode).forEach(modeId => {
            const value = variable.valuesByMode[modeId];
            const mode = collection.modes.find((m) => m.modeId === modeId);
            valuesByModeEntries.push({
              modeName: mode ? mode.name : "Unknown",
              value: value,
            });
          });

          return {
            id: variable.id,
            name: variable.name,
            resolvedType: variable.resolvedType,
            valuesByMode: valuesByModeEntries,
          };
        });

        const variablesResult = await Promise.all(variablesPromises);
        const variables = variablesResult.filter((item) => item !== null);

        variablesData.push({
          name: collection.name,
          variables: variables,
        });
      }

      // Collect styles (text, paint/fill, effect)
      const stylesData = {
        textStyles: [],
        paintStyles: [],
        effectStyles: [],
        gridStyles: []
      };

      // Collect text styles
      const textStyles = await figma.getLocalTextStylesAsync();
      for (const textStyle of textStyles) {
        stylesData.textStyles.push({
          id: textStyle.id,
          name: textStyle.name,
          description: textStyle.description,
          fontSize: textStyle.fontSize,
          fontName: textStyle.fontName,
          lineHeight: textStyle.lineHeight,
          letterSpacing: textStyle.letterSpacing,
          textCase: textStyle.textCase,
          textDecoration: textStyle.textDecoration,
          boundVariables: textStyle.boundVariables,
        });
      }

      // Collect paint/fill styles
      const paintStyles = await figma.getLocalPaintStylesAsync();
      for (const paintStyle of paintStyles) {
        stylesData.paintStyles.push({
          id: paintStyle.id,
          name: paintStyle.name,
          description: paintStyle.description,
          paints: paintStyle.paints,
          boundVariables: paintStyle.boundVariables,
        });
      }

      // Collect effect styles
      const effectStyles = await figma.getLocalEffectStylesAsync();
      for (const effectStyle of effectStyles) {
        stylesData.effectStyles.push({
          id: effectStyle.id,
          name: effectStyle.name,
          description: effectStyle.description,
          effects: effectStyle.effects,
          boundVariables: effectStyle.boundVariables,
        });
      }

      // Collect grid/layout styles
      const gridStyles = await figma.getLocalGridStylesAsync();
      for (const gridStyle of gridStyles) {
        stylesData.gridStyles.push({
          id: gridStyle.id,
          name: gridStyle.name,
          description: gridStyle.description,
          layoutGrids: gridStyle.layoutGrids,
          boundVariables: gridStyle.boundVariables,
        });
      }

      // Collect components
      const componentsData = await ComponentService.collectComponents();

      if (!componentsData || componentsData.length === 0) {
        console.warn('No components found in document');
      }

      // Collect referenced variables (for aliases)
      const referencedIds = new Set<string>();

      // Helper to extract alias IDs from values
      const collectAliasIds = (val: any) => {
        if (val && typeof val === 'object' && val.type === 'VARIABLE_ALIAS' && val.id) {
          referencedIds.add(val.id);
        }
      };

      // Scan all collected variables for aliases
      variablesData.forEach(collection => {
        collection.variables.forEach(variable => {
          variable.valuesByMode.forEach((item: any) => {
            collectAliasIds(item.value);
          });
        });
      });

      // Resolve names for all referenced variables
      const variableReferences: Record<string, string> = {};
      const referencePromises = Array.from(referencedIds).map(async (id) => {
          try {
              // Check if we already have it in local variables to save an API call/lookup
              let foundLocal = false;
              for(const col of variablesData) {
                  const local = col.variables.find(v => v.id === id);
                  if(local) {
                      variableReferences[id] = local.name;
                      foundLocal = true;
                      break;
                  }
              }

              if (!foundLocal) {
                  const v = await figma.variables.getVariableByIdAsync(id);
                  if (v) {
                      variableReferences[id] = v.name;
                  }
              }
          } catch (e) {
              console.warn(`Could not resolve referenced variable: ${id}`);
          }
      });

      await Promise.all(referencePromises);

      // Check for feedback dismissal status
      const feedbackDismissed = await figma.clientStorage.getAsync('feedback_dismissed');

      // Send the data to the UI
      figma.ui.postMessage({
        type: "document-data",
        variablesData,
        variableReferences, // Send the lookup map
        stylesData,
        componentsData: componentsData || [],
        feedbackDismissed: !!feedbackDismissed
      });

      // Return the data for internal use
      return {
        variables: variablesData,
        components: componentsData || []
      };
    } catch (error) {
      console.error('Error collecting document data:', error);

      // Send error to UI so user knows something went wrong
      figma.ui.postMessage({
        type: "document-data-error",
        error: error instanceof Error ? error.message : 'Unknown error during data collection',
        variablesData: [], // Send empty arrays as fallback
        componentsData: [],
      });

      // Return empty data on error
      return {
        variables: [],
        components: []
      };
    }
  }
}
