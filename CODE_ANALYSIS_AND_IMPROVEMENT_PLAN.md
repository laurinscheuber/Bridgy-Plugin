# Code Analysis & Improvement Plan

**Project:** Bridgy (Figma Plugin)
**Date:** 2025-02-26
**Analyst:** Jules

---

## 1. Executive Summary

The "Bridgy" codebase is a functional Figma plugin that handles complex tasks like token management, Git integration, and test generation. However, it suffers from significant technical debt due to a monolithic architecture in both the core plugin logic and the UI.

*   **Strengths:**
    *   Strong service layer for business logic (`src/services/`).
    *   Implemented caching mechanisms (`CacheService`) for performance.
    *   Comprehensive feature set (Variables, Styles, Git sync, Testing).
    *   Basic test infrastructure with Vitest.

*   **Weaknesses:**
    *   **"God Objects":** `src/core/plugin.ts` and `src/ui/main.js` are massive, unmaintainable files that handle too many responsibilities.
    *   **UI Architecture:** Reliance on vanilla JS with manual DOM manipulation (`innerHTML`) and global state makes the UI fragile and hard to extend.
    *   **Type Safety:** Widespread use of `any` and loose type definitions undermines TypeScript's benefits.
    *   **Performance:** Startup data collection is eager and blocking, which will cause freezing on large Figma documents.
    *   **Testing Gaps:** Critical core logic and UI interactions are virtually untested.

---

## 2. Code Quality Scorecard

| Category | Rating | Summary |
| :--- | :---: | :--- |
| **Architecture** | **D** | Monolithic "God Objects" in Core and UI; good Service layer separation. |
| **Code Cleanliness** | **C-** | High complexity, duplication, and hardcoded values. `main.js` is spaghetti code. |
| **Type Safety** | **C** | TypeScript is present but bypassed frequently with `any` and loose types. |
| **Performance** | **C+** | Caching is good, but data collection strategy is non-scalable (blocking). |
| **Security** | **B-** | Basic sanitization present, but manual DOM manipulation is risky. Token obfuscation is weak. |
| **Testing** | **C-** | Good coverage for utility services, but **zero** coverage for core plugin logic or UI. |

---

## 3. Detailed Findings

### A. Architecture & Structure
*   **The "God Object" Problem:**
    *   `src/core/plugin.ts` (600+ lines) acts as a router, controller, and data processor. It contains direct logic for variable collection (`collectDocumentData`), node manipulation, and message handling.
    *   **Impact:** Hard to test, hard to read, high risk of regression when changing one feature.
*   **UI Spaghetti:**
    *   `src/ui/main.js` (~2700 lines) mixes markup generation, event handling, business logic, and state management.
    *   It relies on `window.globalVar` patterns, making state tracking impossible.
    *   **Impact:** Extremely brittle. Adding a feature requires carefully splicing strings of HTML.

### B. Type Safety
*   **Loose Messaging:**
    *   `PluginMessage` is a giant union of all possible properties (`interface PluginMessage { type: string; componentId?: string; ... }`).
    *   **Fix:** Use Discriminated Unions (e.g., `type Message = { type: 'create'; name: string } | { type: 'delete'; id: string }`).
*   **`any` Usage:**
    *   `plugin.ts`: `(stylesData as any).gridStyles`, `node as any`.
    *   This defeats the purpose of TypeScript, leading to runtime errors that should be caught at compile time.

### C. Performance
*   **Blocking Data Collection:**
    *   `collectDocumentData` iterates over *every* variable and style in the document at startup.
    *   On a large design system (e.g., 2000+ variables), this will freeze the plugin for seconds.
    *   **Recommendation:** Switch to on-demand loading or pagination.
*   **UI Re-rendering:**
    *   The UI uses `container.innerHTML = ...` to render lists. This destroys and recreates DOM nodes, losing event listeners and scroll position, and is computationally expensive.

### D. Build System
*   **Custom Script:**
    *   `scripts/build-ui.js` manually reads files and uses regex for "minification".
    *   **Risk:** Regex-based minification is dangerous (can break code) and inefficient.
    *   **Recommendation:** Use `vite` or `esbuild` plugins (e.g., `vite-plugin-singlefile`) which are industry standard for Figma plugins.

---

## 4. Improvement Plan (Prioritized)

Given the 2-week timeline, we must focus on **Stability**, **Reliability**, and **Safe Refactoring**.

### Phase 1: High Impact, Low Risk (Days 1-3)
*   **Goal:** Stabilize the core and improve developer confidence.
*   **Tasks:**
    1.  **Strict Type Definitions:** Refactor `PluginMessage` into a Discriminated Union. This enables type narrowing in `onmessage` handlers and catches bugs immediately.
    2.  **Safety Net Tests:** Write unit tests for the *logic* inside `plugin.ts`. Extract the logic into testable functions first (see Phase 2).
    3.  **Error Boundaries:** Wrap the main message handler in a robust error catcher that reports back to the UI, preventing "silent failures".

### Phase 2: Modularization (Days 4-7)
*   **Goal:** Break down the "God Objects" without rewriting the world.
*   **Tasks:**
    1.  **Refactor `plugin.ts`:**
        *   Move `collectDocumentData` to `DocumentService`.
        *   Move `applyVariableToNode` to `NodeService`.
        *   Create a `MessageRouter` to handle `figma.ui.onmessage` and dispatch to specific controllers.
    2.  **Refactor `main.js` (The Big One):**
        *   Split into logical files: `ui/variables.js`, `ui/components.js`, `ui/settings.js`.
        *   Since we can't switch to React/Vue easily right now, use a simple **Namespace pattern** or ES modules to organize code.

### Phase 3: Performance & Polish (Days 8-10)
*   **Goal:** Make it feel faster.
*   **Tasks:**
    1.  **Optimized Startup:** Change `collectDocumentData` to only fetch *top-level* info initially. Fetch details (like code snippets or deep nested props) only when a user expands a section.
    2.  **Build Script:** Replace `scripts/build-ui.js` with a standard `vite` configuration using `vite-plugin-singlefile`. This handles bundling, minification, and CSS extraction correctly and automatically.

---

## 5. Specific Refactoring Examples

### A. Fixing `PluginMessage` Types

**Current (Bad):**
```typescript
interface PluginMessage {
  type: string;
  componentId?: string; // Optional everywhere
  cssData?: string;
}
```

**Proposed (Good):**
```typescript
type PluginMessage =
  | { type: 'select-component'; componentId: string }
  | { type: 'export-css'; format: 'css' | 'json' }
  | { type: 'save-settings'; settings: GitSettings };

// Usage
figma.ui.onmessage = (msg: PluginMessage) => {
  if (msg.type === 'select-component') {
    // msg.componentId is guaranteed to exist here
    selectComponent(msg.componentId);
  }
};
```

### B. Refactoring `plugin.ts` Router

**Current:** Giant switch statement inside `onmessage`.

**Proposed:**
```typescript
// src/controllers/ExportController.ts
export const handleExport = async (msg: ExportMessage) => { ... }

// src/core/plugin.ts
const routes = {
  'export-css': ExportController.handleExport,
  'select-component': SelectionController.handleSelection,
};

figma.ui.onmessage = async (msg) => {
  const handler = routes[msg.type];
  if (handler) await handler(msg);
};
```

### C. Modularizing `main.js` (Vanilla JS)

**Current:** Global functions everywhere.

**Proposed:**
```javascript
// src/ui/modules/VariablesView.js
export const VariablesView = {
  render(data) { ... },
  toggleGroup(id) { ... }
};

// src/ui/main.js
import { VariablesView } from './modules/VariablesView.js';

window.onmessage = (event) => {
  if (event.data.type === 'document-data') {
    VariablesView.render(event.data.variables);
  }
};
```
*(Note: Requires setting up a bundler like Vite/esbuild to handle imports, which is part of Phase 3).*
