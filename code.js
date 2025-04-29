"use strict";
// aWall Synch plugin
// This file holds the main code for the plugin. It has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html"
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Show the UI (required for inspect panel plugins)
figma.showUI(__html__, { width: 850, height: 800 });
// Collect all variables and components from the document
function collectDocumentData() {
    return __awaiter(this, void 0, void 0, function* () {
        // Collection variables
        const variableCollections = yield figma.variables.getLocalVariableCollectionsAsync();
        const variablesData = [];
        for (const collection of variableCollections) {
            const variablesPromises = collection.variableIds.map((id) => __awaiter(this, void 0, void 0, function* () {
                const variable = yield figma.variables.getVariableByIdAsync(id);
                if (!variable)
                    return null;
                const valuesByModeEntries = [];
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
                    resolvedType: variable.resolvedType,
                    valuesByMode: valuesByModeEntries,
                };
            }));
            const variablesResult = yield Promise.all(variablesPromises);
            const variables = variablesResult.filter((item) => item !== null);
            variablesData.push({
                name: collection.name,
                variables: variables,
            });
        }
        // Collecting components with hierarchy
        const componentsData = [];
        const componentSets = [];
        const componentMap = new Map();
        // First pass to collect all components and component sets
        function collectNodes(node) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                if ("type" in node) {
                    if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
                        const componentStyles = yield node.getCSSAsync();
                        const componentData = {
                            id: node.id,
                            name: node.name,
                            type: node.type,
                            styles: componentStyles,
                            pageName: node.parent && "name" in node.parent ? node.parent.name : "Unknown",
                            parentId: (_a = node.parent) === null || _a === void 0 ? void 0 : _a.id,
                            children: [],
                        };
                        componentMap.set(node.id, componentData);
                        if (node.type === "COMPONENT_SET") {
                            componentSets.push(componentData);
                        }
                        else {
                            componentsData.push(componentData);
                        }
                    }
                    if ("children" in node) {
                        for (const child of node.children) {
                            yield collectNodes(child);
                        }
                    }
                }
            });
        }
        // Traverse all pages to find components
        for (const page of figma.root.children) {
            yield collectNodes(page);
        }
        // Second pass to establish parent-child relationships for component sets
        for (const component of componentsData) {
            if (component.parentId) {
                const parent = componentMap.get(component.parentId);
                if (parent && parent.type === "COMPONENT_SET") {
                    parent.children.push(component);
                    component.isChild = true; // Mark as child for UI rendering
                }
            }
        }
        // Create final hierarchical data with only top-level components and component sets
        const hierarchicalComponents = [
            ...componentSets,
            ...componentsData.filter((comp) => !comp.isChild),
        ];
        // Send the data to the UI
        figma.ui.postMessage({
            type: "document-data",
            variablesData,
            componentsData: hierarchicalComponents,
        });
    });
}
// Run the collection when the plugin starts
collectDocumentData();
// Keep the codegen functionality for generating code in the Code tab
figma.codegen.on("generate", (_event) => {
    try {
        return [
            {
                language: "PLAINTEXT",
                code: "aWall Synch - Use the plugin interface to view variables and components",
                title: "aWall Synch",
            },
        ];
    }
    catch (error) {
        console.error("Plugin error:", error);
        return [
            {
                language: "PLAINTEXT",
                code: "Error occurred during code generation",
                title: "Error",
            },
        ];
    }
});
// Handle messages from the UI
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.type === "export-css") {
        // Existing CSS export functionality
    }
    else if (msg.type === "export-angular") {
        // Existing Angular export functionality
    }
});
