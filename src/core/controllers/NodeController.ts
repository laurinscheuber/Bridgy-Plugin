export class NodeController {
  /**
   * Helper function to apply a variable to a node property
   */
  static async applyVariableToNode(
    node: SceneNode,
    variable: Variable,
    property: string,
    category: 'Layout' | 'Fill' | 'Stroke' | 'Appearance'
  ): Promise<boolean> {
    try {
      // Map property names to Figma bindable properties
      const propertyMap: Record<string, string> = {
        'Width': 'width',
        'Height': 'height',
        'Min Width': 'minWidth',
        'Max Width': 'maxWidth',
        'Min Height': 'minHeight',
        'Max Height': 'maxHeight',
        'Gap': 'itemSpacing',
        'Padding': 'paddingLeft', // Will also set other padding properties
        'Padding Left': 'paddingLeft',
        'Padding Top': 'paddingTop',
        'Padding Right': 'paddingRight',
        'Padding Bottom': 'paddingBottom',
        'Fill Color': 'fills',
        'Stroke Color': 'strokes',
        'Stroke Weight': 'strokeWeight',
        'Opacity': 'opacity',
        'Corner Radius': 'topLeftRadius', // Will also set other corner radii
        'Corner Radius (Top Left)': 'topLeftRadius',
        'Corner Radius (Top Right)': 'topRightRadius',
        'Corner Radius (Bottom Left)': 'bottomLeftRadius',
        'Corner Radius (Bottom Right)': 'bottomRightRadius'
      };

      const figmaProperty = propertyMap[property];
      if (!figmaProperty) {
        console.warn(`Unknown property: ${property}`);
        return false;
      }

      // Check if node supports this property
      if (!(figmaProperty in node)) {
        console.warn(`Node does not support property: ${figmaProperty}`);
        return false;
      }

      // Special handling for consolidated properties (Padding, Corner Radius)
      if (property === 'Padding') {
        // Apply to all padding properties
        // Using 'as any' here is safe because we check for property existence first
        const paddingNode = node as any;
        if ('paddingLeft' in paddingNode && typeof paddingNode.setBoundVariable === 'function') {
          paddingNode.setBoundVariable('paddingLeft', variable);
          paddingNode.setBoundVariable('paddingTop', variable);
          paddingNode.setBoundVariable('paddingRight', variable);
          paddingNode.setBoundVariable('paddingBottom', variable);
        }
      } else if (property === 'Corner Radius') {
        // Apply to all corner radius properties
        // Using 'as any' here is safe because we check for property existence first
        const radiusNode = node as any;
        if ('topLeftRadius' in radiusNode && typeof radiusNode.setBoundVariable === 'function') {
          radiusNode.setBoundVariable('topLeftRadius', variable);
          radiusNode.setBoundVariable('topRightRadius', variable);
          radiusNode.setBoundVariable('bottomLeftRadius', variable);
          radiusNode.setBoundVariable('bottomRightRadius', variable);
        }
      } else if (property === 'Fill Color') {
        // Special handling for fills - must bind to paint object, not fills array
        const fillNode = node as any;
        if ('fills' in fillNode && Array.isArray(fillNode.fills) && fillNode.fills.length > 0) {
          const fills = [...fillNode.fills];
          const solidFillIndex = fills.findIndex((fill: any) => fill && fill.type === 'SOLID' && fill.visible !== false);
          if (solidFillIndex !== -1) {
            const targetPaint: any = fills[solidFillIndex];
            // @ts-ignore - setBoundVariableForPaint is available in Figma types but TS might complain without full typings
            const newPaint = figma.variables.setBoundVariableForPaint(targetPaint, 'color', variable);
            fills[solidFillIndex] = newPaint;
            try {
              fillNode.fills = fills;
            } catch (err) {
              console.warn(`Failed to set fills on node ${fillNode.id}:`, err);
            }
          }
        }
      } else if (property === 'Stroke Color') {
        // Special handling for strokes - must bind to paint object, not strokes array
        const strokeNode = node as any;
        if ('strokes' in strokeNode && Array.isArray(strokeNode.strokes) && strokeNode.strokes.length > 0) {
          const strokes = [...strokeNode.strokes];
          const solidStrokeIndex = strokes.findIndex((stroke: any) => stroke && stroke.type === 'SOLID' && stroke.visible !== false);
          if (solidStrokeIndex !== -1) {
            const targetPaint: any = strokes[solidStrokeIndex];
            // @ts-ignore
            const newPaint = figma.variables.setBoundVariableForPaint(targetPaint, 'color', variable);
            strokes[solidStrokeIndex] = newPaint;
            try {
              strokeNode.strokes = strokes;
            } catch (err) {
              console.warn(`Failed to set strokes on node ${strokeNode.id}:`, err);
            }
          }
        }
      } else {
        // Apply to single property
        // Using 'as any' here is safe because we checked property existence above
        const bindableNode = node as any;
        if (typeof bindableNode.setBoundVariable === 'function') {
          bindableNode.setBoundVariable(figmaProperty, variable);
        }
      }

      return true;
    } catch (error) {
      console.error('Error applying variable to node:', error);
      return false;
    }
  }
}
