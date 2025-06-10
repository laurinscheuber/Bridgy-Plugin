export function parseComponentName(name) {
  const result = {
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

export function generateStyleChecks(styleChecks) {
  if (styleChecks.length === 0) {
    return "        // No style properties to check";
  }

  return styleChecks
    .map((check) => {
      return `        // Check ${check.property}
        expect(computedStyle.${check.property}).toBe('${check.value}');`;
    })
    .join("\n\n");
}

export function createTestWithStyleChecks(
  componentName,
  kebabName,
  styleChecks
) {
  const styleCheckCode = styleChecks.length > 0
    ? styleChecks
        .map((check) => {
          return `      // Check ${check.property}
      expect(computedStyle.${check.property}).toBe('${check.value}');`;
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
      declarations: [ ${pascalName}Component ]
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