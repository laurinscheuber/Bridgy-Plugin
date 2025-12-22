/*
TODO: Add these @Input() properties to your component:

  @Input() variant: 'auto-fix' | 'sugggestion' = 'auto-fix';
  @Input() type: 'missing-token' | 'unused-token' = 'missing-token';

Don't forget to add this import:
import { CommonModule } from '@angular/common';

IMPORTANT: Ensure your variables file is imported in your stylesheets to make CSS variables available for testing.
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorentryComponent } from './errorentry.component';

describe('ErrorentryComponent - All Variants', () => {
  let component: ErrorentryComponent;
  let fixture: ComponentFixture<ErrorentryComponent>;

  const resolveCssVariable = (variableName: string, stylesheetHrefPart = 'styles.css'): string | undefined => {
    const targetSheet = Array.from(document.styleSheets)
      .find(sheet => sheet.href?.includes(stylesheetHrefPart));

    const rootRule = Array.from(targetSheet?.cssRules || [])
      .filter(rule => rule instanceof CSSStyleRule)
      .find(rule => rule.selectorText === ':root');

    const value = rootRule?.style?.getPropertyValue(variableName)?.trim();
    if (value?.startsWith('var(')) {
      const nestedVar = value.match(/var\((--[^)]+)\)/)?.[1];
      return nestedVar ? resolveCssVariable(nestedVar, stylesheetHrefPart) : undefined;
    }

    return value;
  };

  const resolveCssValueWithVariables = (cssValue: string, stylesheetHrefPart = 'styles.css'): string => {
    if (!cssValue || typeof cssValue !== 'string') {
      return cssValue;
    }

    // Replace all var() functions in the CSS value
    return cssValue.replace(/var\((--[^,)]+)(?:,\s*([^)]+))?\)/g, (match, varName, fallback) => {
      const resolvedValue = resolveCssVariable(varName, stylesheetHrefPart);
      return resolvedValue || fallback || match;
    });
  };

  const getCssPropertyForRule = (cssSelector: string, pseudoClass: string, prop: any) => {
    // Regex necessairy because angular attaches identifier after the selector
    const regex = new RegExp(`${cssSelector}([\\s\\S]*?)${pseudoClass}`);
    const style = Array.from(document.styleSheets)
      .flatMap(sheet => Array.from(sheet.cssRules || []))
      .filter(r => r instanceof CSSStyleRule)
      .find(r => regex.test(r.selectorText))
      ?.style;

    return style!.getPropertyValue(prop);
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorentryComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ErrorentryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should have correct styles for variant="auto-fix" type="missing-token"', () => {
    component.variant = 'auto-fix';
    component.type = 'missing-token';
    fixture.detectChanges();

    const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    if (element) {
      const computedStyle = window.getComputedStyle(element);



    } else {
      console.warn('No suitable element found to test styles');
    }
  });
  it('should have correct styles for variant="auto-fix" type="unused-token"', () => {
    component.variant = 'auto-fix';
    component.type = 'unused-token';
    fixture.detectChanges();

    const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    if (element) {
      const computedStyle = window.getComputedStyle(element);



    } else {
      console.warn('No suitable element found to test styles');
    }
  });
  it('should have correct styles for variant="sugggestion" type="missing-token"', () => {
    component.variant = 'sugggestion';
    component.type = 'missing-token';
    fixture.detectChanges();

    const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    if (element) {
      const computedStyle = window.getComputedStyle(element);



    } else {
      console.warn('No suitable element found to test styles');
    }
  });
});