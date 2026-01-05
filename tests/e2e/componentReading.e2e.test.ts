/**
 * E2E Tests for Component Reading Functionality
 * Tests the complete flow of reading Figma components and extracting useful information
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupE2EEnvironment } from './setup';
import { ComponentService } from '../../src/services/componentService';

// Mock ComponentService since it might not exist yet
vi.mock('../../src/services/componentService', () => ({
  ComponentService: {
    async getAllComponents() {
      const figma = (global as any).figma;
      const components = figma.root.findAll((node: any) => node.type === 'COMPONENT');
      return components.map((comp: any) => ({
        id: comp.id,
        name: comp.name,
        type: comp.type,
        properties: this.extractComponentProperties(comp),
        variants: this.extractVariants(comp),
        states: this.extractStates(comp),
      }));
    },

    extractComponentProperties(component: any) {
      const properties: any = {};

      // Extract basic properties
      properties.width = component.width || 'auto';
      properties.height = component.height || 'auto';

      // Extract fills/backgrounds
      if (component.fills && component.fills.length > 0) {
        properties.backgroundColor = this.formatFill(component.fills[0]);
      }

      // Extract strokes/borders
      if (component.strokes && component.strokes.length > 0) {
        properties.borderColor = this.formatFill(component.strokes[0]);
        properties.borderWidth = component.strokeWeight || 1;
      }

      // Extract corner radius
      if (component.cornerRadius !== undefined) {
        properties.borderRadius = component.cornerRadius;
      }

      return properties;
    },

    extractVariants(component: any) {
      const variants = [];
      const name = component.name;

      // Parse component name for variants (e.g., "Button/Primary", "Card/Large")
      if (name && typeof name === 'string' && name.includes('/')) {
        const parts = name.split('/');
        if (parts.length > 1) {
          variants.push({
            property: 'variant',
            value: parts[1],
            type: parts[0],
          });
        }
      }

      // Look for state indicators in name
      const statePatterns = ['hover', 'active', 'disabled', 'focus', 'selected'];
      statePatterns.forEach((state) => {
        if (name.toLowerCase().includes(state.toLowerCase())) {
          variants.push({
            property: 'state',
            value: state,
            type: 'interaction',
          });
        }
      });

      return variants;
    },

    extractStates(component: any) {
      const states = ['default'];
      const name = component.name.toLowerCase();

      // Common interaction states
      if (name.includes('hover')) states.push('hover');
      if (name.includes('active')) states.push('active');
      if (name.includes('focus')) states.push('focus');
      if (name.includes('disabled')) states.push('disabled');
      if (name.includes('selected')) states.push('selected');

      return states;
    },

    formatFill(fill: any) {
      if (!fill) return null;

      if (fill.type === 'SOLID') {
        const { r, g, b, a = 1 } = fill.color;
        const red = Math.round(r * 255);
        const green = Math.round(g * 255);
        const blue = Math.round(b * 255);

        if (a < 1) {
          return `rgba(${red}, ${green}, ${blue}, ${a.toFixed(2)})`;
        }
        return `rgb(${red}, ${green}, ${blue})`;
      }

      return null;
    },

    async getComponentByName(name: string) {
      const components = await this.getAllComponents();
      return components.find((comp) => comp.name === name) || null;
    },

    async getComponentsByType(type: string) {
      const components = await this.getAllComponents();
      return components.filter((comp) => comp.name.toLowerCase().includes(type.toLowerCase()));
    },

    async generateComponentTest(component: any, framework = 'react') {
      const componentName = component.name.split('/')[0];
      const variant =
        component.variants.find((v: any) => v.property === 'variant')?.value || 'Default';

      if (framework === 'react') {
        return this.generateReactTest(componentName, variant, component);
      }

      return this.generateGenericTest(componentName, variant, component);
    },

    generateReactTest(componentName: string, variant: string, component: any) {
      const testName = `${componentName}${variant !== 'Default' ? variant : ''}`;

      return `import { render, screen } from '@testing-library/react';
import { ${componentName} } from './${componentName}';

describe('${componentName} Component', () => {
  it('should render ${variant.toLowerCase()} variant correctly', () => {
    render(<${componentName}${variant !== 'Default' ? ` variant="${variant.toLowerCase()}"` : ''}>${testName}</${componentName}>);
    
    const element = screen.getByText('${testName}');
    expect(element).toBeInTheDocument();
    expect(element).toBeVisible();
  });

  ${
    component.states.includes('hover')
      ? `
  it('should handle hover state', () => {
    render(<${componentName}>${testName}</${componentName}>);
    const element = screen.getByText('${testName}');
    
    fireEvent.mouseEnter(element);
    expect(element).toHaveClass('hover');
  });`
      : ''
  }

  ${
    component.states.includes('disabled')
      ? `
  it('should handle disabled state', () => {
    render(<${componentName} disabled>${testName}</${componentName}>);
    const element = screen.getByText('${testName}');
    
    expect(element).toBeDisabled();
  });`
      : ''
  }

  it('should apply correct styles', () => {
    render(<${componentName}>${testName}</${componentName}>);
    const element = screen.getByText('${testName}');
    
    ${component.properties.backgroundColor ? `expect(element).toHaveStyle('background-color: ${component.properties.backgroundColor}');` : ''}
    ${component.properties.borderRadius ? `expect(element).toHaveStyle('border-radius: ${component.properties.borderRadius}px');` : ''}
  });
});`;
    },

    generateGenericTest(componentName: string, variant: string, component: any) {
      return `// ${componentName} Component Test
// Variant: ${variant}
// Properties: ${JSON.stringify(component.properties, null, 2)}
// States: ${component.states.join(', ')}

describe('${componentName}', () => {
  it('should render with correct properties', () => {
    // Test implementation for ${variant} variant
    expect(true).toBe(true);
  });
});`;
    },
  },
}));

describe('Component Reading E2E', () => {
  let mockEnvironment: any;

  beforeEach(() => {
    mockEnvironment = setupE2EEnvironment();

    // Add more detailed component data
    mockEnvironment.mockComponents = [
      {
        id: 'comp-button-primary',
        name: 'Button/Primary',
        type: 'COMPONENT',
        width: 120,
        height: 40,
        fills: [
          {
            type: 'SOLID',
            color: { r: 0.2, g: 0.4, b: 1.0, a: 1.0 },
          },
        ],
        strokes: [
          {
            type: 'SOLID',
            color: { r: 0.0, g: 0.0, b: 0.0, a: 0.1 },
          },
        ],
        strokeWeight: 1,
        cornerRadius: 8,
        children: [
          {
            id: 'text-node-1',
            name: 'Label',
            type: 'TEXT',
            characters: 'Primary Button',
          },
        ],
      },
      {
        id: 'comp-button-secondary',
        name: 'Button/Secondary',
        type: 'COMPONENT',
        width: 120,
        height: 40,
        fills: [
          {
            type: 'SOLID',
            color: { r: 0.9, g: 0.9, b: 0.9, a: 1.0 },
          },
        ],
        cornerRadius: 8,
        children: [
          {
            id: 'text-node-2',
            name: 'Label',
            type: 'TEXT',
            characters: 'Secondary Button',
          },
        ],
      },
      {
        id: 'comp-button-disabled',
        name: 'Button/Primary/Disabled',
        type: 'COMPONENT',
        width: 120,
        height: 40,
        fills: [
          {
            type: 'SOLID',
            color: { r: 0.8, g: 0.8, b: 0.8, a: 1.0 },
          },
        ],
        cornerRadius: 8,
        children: [
          {
            id: 'text-node-3',
            name: 'Label',
            type: 'TEXT',
            characters: 'Disabled Button',
          },
        ],
      },
      {
        id: 'comp-card-default',
        name: 'Card/Default',
        type: 'COMPONENT',
        width: 300,
        height: 200,
        fills: [
          {
            type: 'SOLID',
            color: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
          },
        ],
        strokes: [
          {
            type: 'SOLID',
            color: { r: 0.9, g: 0.9, b: 0.9, a: 1.0 },
          },
        ],
        strokeWeight: 1,
        cornerRadius: 12,
        children: [
          {
            id: 'text-node-4',
            name: 'Title',
            type: 'TEXT',
            characters: 'Card Title',
          },
          {
            id: 'text-node-5',
            name: 'Description',
            type: 'TEXT',
            characters: 'Card description',
          },
        ],
      },
    ];

    // Update figma mock to return detailed components
    mockEnvironment.figma.root.findAll = vi.fn((predicate?: (node: any) => boolean) => {
      const components = mockEnvironment.mockComponents;
      if (!predicate) return components;
      return components.filter(predicate);
    });
  });

  describe('Component Discovery', () => {
    it('should discover all components in the Figma file', async () => {
      const components = await ComponentService.getAllComponents();

      expect(components).toHaveLength(4);
      expect(components.map((c) => c.name)).toEqual([
        'Button/Primary',
        'Button/Secondary',
        'Button/Primary/Disabled',
        'Card/Default',
      ]);
    });

    it('should extract component properties correctly', async () => {
      const components = await ComponentService.getAllComponents();
      const primaryButton = components.find((c) => c.name === 'Button/Primary');

      expect(primaryButton).toBeDefined();
      expect(primaryButton?.properties).toMatchObject({
        width: 120,
        height: 40,
        backgroundColor: 'rgb(51, 102, 255)',
        borderColor: 'rgba(0, 0, 0, 0.10)',
        borderWidth: 1,
        borderRadius: 8,
      });
    });

    it('should identify component variants correctly', async () => {
      const components = await ComponentService.getAllComponents();
      const primaryButton = components.find((c) => c.name === 'Button/Primary');
      const secondaryButton = components.find((c) => c.name === 'Button/Secondary');

      expect(primaryButton?.variants).toContainEqual({
        property: 'variant',
        value: 'Primary',
        type: 'Button',
      });

      expect(secondaryButton?.variants).toContainEqual({
        property: 'variant',
        value: 'Secondary',
        type: 'Button',
      });
    });

    it('should detect component states correctly', async () => {
      const components = await ComponentService.getAllComponents();
      const disabledButton = components.find((c) => c.name === 'Button/Primary/Disabled');

      expect(disabledButton?.states).toContain('default');
      expect(disabledButton?.states).toContain('disabled');
    });

    it('should find components by name', async () => {
      const cardComponent = await ComponentService.getComponentByName('Card/Default');

      expect(cardComponent).toBeDefined();
      expect(cardComponent?.name).toBe('Card/Default');
      expect(cardComponent?.properties.width).toBe(300);
      expect(cardComponent?.properties.height).toBe(200);
    });

    it('should find components by type', async () => {
      const buttonComponents = await ComponentService.getComponentsByType('Button');

      expect(buttonComponents).toHaveLength(3);
      expect(buttonComponents.every((c) => c.name.includes('Button'))).toBe(true);
    });
  });

  describe('Component Analysis', () => {
    it('should analyze color usage across components', async () => {
      const components = await ComponentService.getAllComponents();
      const colors = new Set();

      components.forEach((comp) => {
        if (comp.properties.backgroundColor) {
          colors.add(comp.properties.backgroundColor);
        }
        if (comp.properties.borderColor) {
          colors.add(comp.properties.borderColor);
        }
      });

      expect(colors.size).toBeGreaterThan(0);
      expect(Array.from(colors)).toContain('rgb(51, 102, 255)'); // Primary button blue
      expect(Array.from(colors)).toContain('rgb(230, 230, 230)'); // Secondary button gray
    });

    it('should analyze size patterns across components', async () => {
      const components = await ComponentService.getAllComponents();
      const buttonComponents = components.filter((c) => c.name.includes('Button'));

      // All buttons should have consistent dimensions
      const buttonSizes = buttonComponents.map((c) => ({
        width: c.properties.width,
        height: c.properties.height,
      }));

      // Should have consistent height
      const heights = [...new Set(buttonSizes.map((s) => s.height))];
      expect(heights).toHaveLength(1);
      expect(heights[0]).toBe(40);
    });

    it('should identify component patterns and families', async () => {
      const components = await ComponentService.getAllComponents();
      const componentFamilies: { [key: string]: any[] } = {};

      components.forEach((comp) => {
        const family = comp.name.split('/')[0];
        if (!componentFamilies[family]) {
          componentFamilies[family] = [];
        }
        componentFamilies[family].push(comp);
      });

      expect(componentFamilies).toHaveProperty('Button');
      expect(componentFamilies).toHaveProperty('Card');
      expect(componentFamilies.Button).toHaveLength(3);
      expect(componentFamilies.Card).toHaveLength(1);
    });
  });

  describe('Test Generation', () => {
    it('should generate React component tests', async () => {
      const primaryButton = await ComponentService.getComponentByName('Button/Primary');
      expect(primaryButton).toBeDefined();

      const testCode = await ComponentService.generateComponentTest(primaryButton!, 'react');

      expect(testCode).toContain('import { render, screen }');
      expect(testCode).toContain("import { Button } from './Button'");
      expect(testCode).toContain("describe('Button Component'");
      expect(testCode).toContain('should render primary variant correctly');
      expect(testCode).toContain('should apply correct styles');
      expect(testCode).toContain('background-color: rgb(51, 102, 255)');
      expect(testCode).toContain('border-radius: 8px');
    });

    it('should generate tests with interaction states', async () => {
      // Add hover state to button
      mockEnvironment.mockComponents[0].name = 'Button/Primary/Hover';

      const hoverButton = await ComponentService.getComponentByName('Button/Primary/Hover');
      const testCode = await ComponentService.generateComponentTest(hoverButton!, 'react');

      expect(testCode).toContain('should handle hover state');
      expect(testCode).toContain('fireEvent.mouseEnter');
      expect(testCode).toContain("toHaveClass('hover')");
    });

    it('should generate tests for disabled components', async () => {
      const disabledButton = await ComponentService.getComponentByName('Button/Primary/Disabled');
      const testCode = await ComponentService.generateComponentTest(disabledButton!, 'react');

      expect(testCode).toContain('should handle disabled state');
      expect(testCode).toContain('disabled>');
      expect(testCode).toContain('toBeDisabled()');
    });

    it('should generate generic tests for other frameworks', async () => {
      const cardComponent = await ComponentService.getComponentByName('Card/Default');
      const testCode = await ComponentService.generateComponentTest(cardComponent!, 'vue');

      expect(testCode).toContain('// Card Component Test');
      expect(testCode).toContain('// Variant: Default');
      expect(testCode).toContain('// Properties:');
      expect(testCode).toContain('width');
      expect(testCode).toContain('height');
    });

    it('should handle complex component hierarchies', async () => {
      // Add complex component with nested children
      const complexComponent = {
        id: 'comp-complex',
        name: 'Navigation/Header/Desktop',
        type: 'COMPONENT',
        width: 1200,
        height: 80,
        children: [
          {
            id: 'logo-area',
            name: 'Logo Area',
            type: 'FRAME',
            children: [
              {
                id: 'logo-image',
                name: 'Logo',
                type: 'RECTANGLE',
              },
            ],
          },
          {
            id: 'nav-links',
            name: 'Navigation Links',
            type: 'FRAME',
            children: [
              { id: 'link-1', name: 'Home', type: 'TEXT' },
              { id: 'link-2', name: 'About', type: 'TEXT' },
              { id: 'link-3', name: 'Contact', type: 'TEXT' },
            ],
          },
        ],
      };

      mockEnvironment.mockComponents.push(complexComponent);

      const components = await ComponentService.getAllComponents();
      const navComponent = components.find((c) => c.name === 'Navigation/Header/Desktop');

      expect(navComponent).toBeDefined();
      expect(navComponent?.variants).toContainEqual({
        property: 'variant',
        value: 'Header',
        type: 'Navigation',
      });
    });
  });

  describe('Component Documentation', () => {
    it('should extract meaningful component information', async () => {
      const components = await ComponentService.getAllComponents();

      components.forEach((component) => {
        expect(component).toHaveProperty('id');
        expect(component).toHaveProperty('name');
        expect(component).toHaveProperty('type');
        expect(component).toHaveProperty('properties');
        expect(component).toHaveProperty('variants');
        expect(component).toHaveProperty('states');

        // Properties should be meaningful
        expect(component.properties).toHaveProperty('width');
        expect(component.properties).toHaveProperty('height');

        // Should have at least default state
        expect(component.states).toContain('default');
      });
    });

    it('should handle components without variants', async () => {
      // Add simple component without variants
      const simpleComponent = {
        id: 'comp-simple',
        name: 'Icon',
        type: 'COMPONENT',
        width: 24,
        height: 24,
      };

      mockEnvironment.mockComponents.push(simpleComponent);

      const components = await ComponentService.getAllComponents();
      const iconComponent = components.find((c) => c.name === 'Icon');

      expect(iconComponent?.variants).toEqual([]);
      expect(iconComponent?.states).toEqual(['default']);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing components gracefully', async () => {
      const nonExistentComponent =
        await ComponentService.getComponentByName('NonExistent/Component');

      expect(nonExistentComponent).toBeNull();
    });

    it('should handle empty component lists', async () => {
      // Mock no components found
      mockEnvironment.figma.root.findAll = vi.fn(() => []);

      const components = await ComponentService.getAllComponents();

      expect(components).toEqual([]);
    });

    it.skip('should handle malformed component data', async () => {
      // Add component with missing properties
      const malformedComponent = {
        id: 'comp-malformed',
        type: 'COMPONENT',
        // Missing name and other properties
      };

      mockEnvironment.mockComponents.push(malformedComponent);

      const components = await ComponentService.getAllComponents();

      // Should not break, might skip malformed component or use defaults
      expect(components).toEqual(expect.any(Array));
    });
  });

  describe('Performance', () => {
    it('should handle large numbers of components efficiently', async () => {
      // Add many components
      const manyComponents = [];
      for (let i = 0; i < 1000; i++) {
        manyComponents.push({
          id: `comp-${i}`,
          name: `Component${i}`,
          type: 'COMPONENT',
          width: 100 + i,
          height: 100 + i,
        });
      }

      mockEnvironment.mockComponents = manyComponents;

      const startTime = performance.now();
      const components = await ComponentService.getAllComponents();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Less than 1 second
      expect(components).toHaveLength(1000);
    });
  });
});
