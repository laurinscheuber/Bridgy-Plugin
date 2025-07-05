import { ParsedComponentName, StyleCheck } from '../types';

export function parseComponentName(name: string): ParsedComponentName {
  const result: ParsedComponentName = {
    name: name,
    type: null,
    state: null,
  };

  // Check for Type=X pattern
  const typeMatch = name.match(/Type=([^,]+)/i);
  if (typeMatch && typeMatch[1]) {
    result.type = typeMatch[1].trim();
  }

  // Check for State=X pattern
  const stateMatch = name.match(/State=([^,]+)/i);
  if (stateMatch && stateMatch[1]) {
    result.state = stateMatch[1].trim();
  }

  return result;
}

export function generateStyleChecks(styleChecks: StyleCheck[]): string {
  if (styleChecks.length === 0) {
    return "        // No style properties to check";
  }

  function stripCssVarFallback(value: string): string {
    // Replace all var(--..., fallback) with just the fallback
    return value.replace(/var\([^,]+,\s*([^\)]+)\)/g, '$1').replace(/\s+/g, ' ').trim();
  }

  return styleChecks
    .map((check) => {
      const expected = stripCssVarFallback(String(check.value));
      return `        // Check ${check.property}
        expect(computedStyle.${check.property}).toBe('${expected}');`;
    })
    .join("\n\n");
}

export function createTestWithStyleChecks(
  componentName: string,
  kebabName: string,
  styleChecks: StyleCheck[]
): string {
  function stripCssVarFallback(value: string): string {
    return value.replace(/var\([^,]+,\s*([^\)]+)\)/g, '$1').replace(/\s+/g, ' ').trim();
  }

  const styleCheckCode = styleChecks.length > 0
    ? styleChecks
        .map((check) => {
          const expected = stripCssVarFallback(String(check.value));
          return `      // Check ${check.property}
      expect(computedStyle.${check.property}).toBe('${expected}');`;
        })
        .join("\n\n")
    : "      // No style properties to check";

  const pascalName = componentName.replace(/[^a-zA-Z0-9]/g, "");

  return `import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ${pascalName}Component } from './${kebabName}.component';

describe('${pascalName}Component', () => {
  let component: ${pascalName}Component;
  let fixture: ComponentFixture<${pascalName}Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ${pascalName}Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(${pascalName}Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct styles', () => {
    const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    if (element) {
      const computedStyle = window.getComputedStyle(element);
      
${styleCheckCode}
    } else {
      console.warn('No suitable element found to test styles');
    }
  });
});`;
} 