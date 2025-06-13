/**
 * MIGRATE THEME SYSTEM – 5-Step Action Plan
 *
 * • Purpose: Migrate business-logic components from dual theme stores to unified Tailwind v4 token system
 * • Scope  : features/business-logic-modern/** only (16 components + node stores)
 * • Timeline: 7-9 business days
 * • Approach: Extend existing @theme block, eliminate componentThemeStore, preserve glow utilities
 *
 * Keywords: theme-migration, tailwind-v4, css-tokens, node-styling, glow-effects
 */

# 0. Strategic Rationale: Why This Approach?

This migration adopts a **DIY Design Token Pipeline** built on our existing Tailwind v4 infrastructure. This approach was chosen after a comprehensive analysis of multiple design system architectures and provides the optimal balance of control, flexibility, and long-term maintainability for a large, complex application.

## Analysis Against Core Requirements

### 1. Full Control of Design
*   **How the Proposal Delivers:** We define the token structure and naming (`node-create-bg`, `infra-inspector-border`). We are not inheriting a pre-canned naming scheme from a third-party library. This gives us 100% semantic control, making the system perfectly reflect our application's domain.
*   **Why It's Better Than Alternatives:**
    *   **Third-Party Libraries (shadcn/MUI):** Force adoption of their token names (`--primary`), requiring awkward aliasing to fit our domain.
    *   **Pure Zustand Store:** Control is an illusion. Storing raw values (`bg-blue-50`) creates implementation details, not a true design system, leading to inconsistency.

### 2. Flexibility
*   **How the Proposal Delivers:**
    *   **Theming (Dark/Light/Brand):** A new theme is just a set of overrides in the `@theme` block. Components do not change.
    *   **Runtime Changes (Per-Instance):** We do not lose runtime flexibility. For one-off overrides, we can still use inline styles to set a CSS variable: `<div style={{ "--node-create-bg": dynamicColorFromApi }} />`. This provides a stable, build-time base with a clear escape hatch for dynamic data.
*   **Why It's Better Than Alternatives:**
    *   **Pure Zustand Store:** Encourages putting *all* styles into the JS runtime, increasing bundle size and performance costs.
    *   **Pure Tailwind Plugin:** Offers almost zero runtime flexibility.

### 3. Minimized Maintenance
*   **How the Proposal Delivers:** This is the strongest selling point. It creates a "funnel" for all design changes, preventing developers from making isolated, one-off style changes in component code.
    *   **The Workflow:** Designer wants to change a color -> They update a token value in `globals.css` -> They open a PR -> Done. No engineer has to hunt through JSX files.
*   **Why It's Better Than Alternatives:**
    *   **Pure Zustand Store:** High maintenance. Every color change requires a developer to find and edit a large store file.
    *   **CSS-in-JS:** High maintenance due to the potential for runtime styling bugs and library upgrade churn.

### 4. Future-Proof Scalability (Avoiding the "Mess")
*   **How the Proposal Delivers:** By forcing all stylistic decisions through the token pipeline, the system enforces consistency by design. It prevents the slow drift where five different shades of "blue" creep into the app. The list of tokens becomes our explicit, reviewable, and lint-able design surface.
*   **Why It's Better Than Alternatives:** Most other systems provide escape hatches that are too easy to abuse, leading directly to the complexity this plan is designed to prevent. The DIY pipeline's "rigidity" is its greatest strength for long-term health.

---

# Executive Summary
Leverage existing Tailwind v4 `@theme` infrastructure to eliminate dual theme stores. Extend CSS tokens for business-logic components, refactor stores to use utilities, migrate 16 infrastructure components, and establish lint enforcement.

---

# 1. Token System Extension

## 1.1 Extend @theme Block in globals.css
Add business-logic semantic tokens to existing `@theme` block:
```css
@theme {
  /* Existing tokens preserved */
  --background: 0 0% 6%;
  --foreground: 0 0% 98%;
  
  /* NEW: Node category tokens */
  --node-create-bg: 210 100% 97%;
  --node-create-border: 210 100% 85%;
  --node-view-bg: 0 0% 97%;
  --node-view-border: 0 0% 85%;
  --node-trigger-bg: 120 100% 97%;
  --node-trigger-border: 120 100% 85%;
  --node-test-bg: 45 100% 97%;
  --node-test-border: 45 100% 85%;
  
  /* NEW: Infrastructure component tokens with states */
  --infra-inspector-bg: var(--card);
  --infra-inspector-bg-hover: var(--accent);
  --infra-inspector-border: var(--border);
  --infra-sidebar-bg: var(--muted);
  --infra-sidebar-bg-hover: var(--accent);
  --infra-sidebar-border: var(--border);
  --infra-minimap-bg: var(--background);
  --infra-history-bg: var(--card);
  
  /* NEW: Effect tokens */
  --effect-glow-selection: 0 0 8px 2px rgba(255,255,255,0.8);
  --effect-glow-error: 0 0 8px 2px rgba(239,68,68,0.8);
  --effect-glow-hover: 0 0 4px 1px rgba(255,255,255,0.4);
  --effect-glow-subtle: 0 0 4px 1px rgba(255,255,255,0.2);
  --effect-glow-strong: 0 0 12px 4px rgba(255,255,255,1.0);
  
  /* NEW: Action status tokens */
  --status-node-add-bg: 120 100% 95%;
  --status-node-delete-bg: 0 100% 95%;
  --status-edge-add-bg: 120 80% 95%;
  --status-bulk-update-bg: 45 100% 95%;
  
  /* NEW: Sizing tokens (CRITICAL - moved from future enhancement) */
  --node-size-fe1h-width: 240px;
  --node-size-fe1h-height: 120px;
  --node-size-compact-width: 180px;
  --node-size-compact-height: 80px;
  --node-size-expanded-width: 320px;
  --node-size-expanded-height: 160px;
}
```

## 1.2 Verify Token Auto-Generation with States
Confirm Tailwind v4 generates utilities automatically including stateful variants:
- `bg-node-create` → `background-color: hsl(var(--node-create-bg))`
- `hover:bg-infra-inspector-hover` → `background-color: hsl(var(--infra-inspector-bg-hover))`
- `shadow-effect-glow-selection` → `box-shadow: var(--effect-glow-selection)`
- `w-node-size-fe1h` → `width: var(--node-size-fe1h-width)`

## 1.3 Create Theme Initialization Migration Strategy
**CRITICAL MISSING COMPONENT:** Migrate the 168-line `themeInitializer.ts` system:
```typescript
// NEW: tokenAwareInitializer.ts
import { validateTokenSystem } from './validateTokens';

export const initializeTokenSystem = () => {
  // Ensure CSS tokens are loaded before initialization
  if (!document.querySelector('[data-theme-tokens]')) {
    console.warn('Token CSS not loaded - theme initialization delayed');
    return false;
  }
  
  // Preserve existing diagnostic capabilities
  const diagnostics = diagnoseTokenSystem();
  if (!diagnostics.isValid) {
    console.error('Token system validation failed:', diagnostics.errors);
    return fixTokenSystem();
  }
  
  // Initialize debug mode if enabled
  if (process.env.NODE_ENV === 'development') {
    window.tokenUtils = createTokenDebugUtils();
  }
  
  return true;
};
```

## 1.4 Add Contrast Validation
Create `scripts/validate-tokens.ts` to verify WCAG AA compliance:
```typescript
const CONTRAST_REQUIREMENTS = {
  'node-create-bg': { against: 'foreground', ratio: 4.5 },
  'infra-inspector-bg': { against: 'foreground', ratio: 4.5 },
  'status-node-add-bg': { against: 'foreground', ratio: 4.5 }
};

export const validateContrast = async () => {
  // Implementation validates all token combinations
  // Fails CI if any combination doesn't meet WCAG AA
};
```

## 1.5 Configure ESLint Rule + Codemod Tool
Add `eslint-plugin-tailwindcss` with custom rule AND create migration codemod:
```javascript
// .eslintrc.js
rules: {
  'tailwindcss/no-custom-classname': 'error',
  'no-primitive-colors': 'error' // Custom rule: ban bg-blue-500, text-red-600 etc
}

// scripts/codemods/migrate-component-theme.js (CRITICAL MISSING)
module.exports = function transformer(fileInfo, api) {
  const j = api.jscodeshift;
  
  return j(fileInfo.source)
    .find(j.TemplateLiteral)
    .forEach(path => {
      // Detect ${theme.background.hover} patterns
      // Replace with hover:bg-infra-${component}-hover
      // Flag unknown patterns for manual review
    })
    .toSource();
};
```

---

# 2. Node Store Refactoring

## 2.1 Update nodeStyleStore.ts
Replace hardcoded color objects with utility references:
```typescript
// Before
const CATEGORY_THEMES = {
  create: {
    background: { light: '#f0f9ff', dark: '#0c4a6e' },
    border: { light: '#0ea5e9', dark: '#0284c7' }
  }
};

// After  
const CATEGORY_THEMES = {
  create: {
    background: 'bg-node-create',
    backgroundHover: 'hover:bg-node-create-hover',
    border: 'border-node-create',
    text: 'text-foreground',
    // CRITICAL: Include sizing utilities
    width: 'w-node-size-fe1h',
    height: 'h-node-size-fe1h'
  }
};
```

## 2.2 Migrate GLOW_EFFECTS Constant (ENHANCED)
Convert shadow strings to utility references with ALL glow variants:
```typescript
// Before
const GLOW_EFFECTS = {
  selection: '0px 0px 8px 2px rgba(255, 255, 255, 0.8)',
  error: '0px 0px 8px 2px rgba(239, 68, 68, 0.8)'
};

// After (COMPLETE glow system)
const GLOW_EFFECTS = {
  selection: 'shadow-effect-glow-selection',
  error: 'shadow-effect-glow-error',
  hover: 'shadow-effect-glow-hover',
  subtle: 'shadow-effect-glow-subtle',
  strong: 'shadow-effect-glow-strong'
};
```

## 2.3 Update glowEffects.ts Utilities (PRESERVE ALL FUNCTIONALITY)
**CRITICAL:** Preserve the sophisticated 207-line utility system:
```typescript
// Preserve browser console helpers
window.glowUtils = {
  testAllGlowPresets: async () => {
    // Updated to use new utility classes
    for (const [preset, className] of Object.entries(GLOW_EFFECTS)) {
      await testGlowPreset(preset, className);
    }
  },
  
  applyGlowTheme: (element: HTMLElement, glowType: string) => {
    // Updated implementation using utility classes
    element.className = element.className.replace(/shadow-effect-glow-\w+/g, '');
    element.className += ` ${GLOW_EFFECTS[glowType]}`;
  },
  
  // Preserve ALL existing functions with updated implementations
  createCustomGlow: (shadowValue: string) => { /* ... */ },
  diagnoseGlowSystem: () => { /* ... */ }
};
```

## 2.4 Preserve Browser Console Helpers
Ensure ALL `window.glowUtils` functions continue working with new utility approach.

---

# 3. Infrastructure Component Migration

## 3.1 Audit useComponentTheme Usage
Identify all 16 components using `useComponentTheme`:
- FlowCanvas, NodeInspector, HistoryPanel, ThemedMiniMap
- SidebarTabs, SortableStencil, StencilInfoPanel, SearchBar, SidebarVariantSelector
- Additional infrastructure components

## 3.2 Run Codemod Migration Tool
**CRITICAL STEP:** Use the jscodeshift codemod to automate initial migration:
```bash
npx jscodeshift -t scripts/codemods/migrate-component-theme.js features/business-logic-modern/
```

## 3.3 Replace Theme Object Usage (ENHANCED)
Convert interpolated theme usage to direct utilities with states:
```tsx
// Before
const theme = useComponentTheme('nodeInspector');
<div className={`${theme.background.primary} ${theme.border.default} ${theme.background.hover}`}>

// After (with proper state handling)
<div className="bg-infra-inspector border-infra-inspector hover:bg-infra-inspector-hover">
```

## 3.4 Handle Stateful Styling (COMPREHENSIVE)
Convert ALL hover/active/focus states:
```tsx
// Before
<button className={`${theme.button.default} ${theme.button.hover} ${theme.button.active}`}>

// After  
<button className="bg-infra-inspector hover:bg-infra-inspector-hover active:bg-infra-inspector-active focus:ring-2 focus:ring-primary">
```

## 3.5 Remove useComponentTheme Imports
Delete hook imports and theme store dependencies from migrated components.

## 3.6 Update Unit Tests (COMPREHENSIVE)
Replace theme mock objects with utility class assertions:
```typescript
// Before
expect(mockTheme.background.primary).toBe('#ffffff');

// After
expect(component).toHaveClass('bg-infra-inspector');
expect(component).toHaveClass('hover:bg-infra-inspector-hover');
```

---

# 4. Hardcoded Color Cleanup

## 4.1 Audit Primitive Color Usage (COMPREHENSIVE SEARCH)
Search business-logic tree for ALL hardcoded Tailwind colors:
```bash
# Enhanced search patterns
grep -r "bg-\(blue\|red\|green\|yellow\|purple\|indigo\|pink\|gray\|zinc\|slate\|stone\)-[0-9]" features/business-logic-modern/
grep -r "text-\(blue\|red\|green\|yellow\|purple\|indigo\|pink\|gray\|zinc\|slate\|stone\)-[0-9]" features/business-logic-modern/
grep -r "border-\(blue\|red\|green\|yellow\|purple\|indigo\|pink\|gray\|zinc\|slate\|stone\)-[0-9]" features/business-logic-modern/
```

## 4.2 Replace Action Status Colors (COMPLETE SYSTEM)
Convert HistoryPanel action indicators with FULL action type coverage:
```tsx
// Before (30+ hardcoded instances)
<div className="w-2 h-2 bg-green-500 rounded-full" /> // node_add
<div className="w-2 h-2 bg-red-500 rounded-full" />  // node_delete
<div className="w-2 h-2 bg-blue-500 rounded-full" /> // node_update
<div className="w-2 h-2 bg-yellow-500 rounded-full" /> // edge_add
<div className="w-2 h-2 bg-purple-500 rounded-full" /> // bulk_update

// After (semantic system)
<div className="w-2 h-2 bg-status-node-add rounded-full" />
<div className="w-2 h-2 bg-status-node-delete rounded-full" />
<div className="w-2 h-2 bg-status-node-update rounded-full" />
<div className="w-2 h-2 bg-status-edge-add rounded-full" />
<div className="w-2 h-2 bg-status-bulk-update rounded-full" />
```

## 4.3 Handle Mixed Theme Approaches (THREE PATTERNS)
**CRITICAL:** Handle all three component patterns found:
1. **Full theme integration**: Components using `useComponentTheme`
2. **No theme integration**: Components with pure hardcoded colors
3. **Mixed approach**: Components using BOTH theme + hardcoded

Strategy for each:
- Pattern 1: Use codemod + manual cleanup
- Pattern 2: Direct hardcoded → token replacement
- Pattern 3: Remove theme hook, replace ALL color instances

## 4.4 Add Missing Semantic Tokens
Create tokens for any discovered color patterns not covered in step 1.1.

---

# 5. Validation & Rollout

## 5.1 Visual Regression Testing (COMPREHENSIVE)
Run comprehensive visual comparison:
- Storybook component matrix (all states × themes × sizes)
- Percy screenshots of 20 key business-logic pages
- Manual dark/light mode verification
- **NEW:** Test all glow effect presets visually

## 5.2 Accessibility Validation (ENHANCED)
- High contrast mode testing
- Color blindness simulation (protanopia, deuteranopia, tritanopia)
- WCAG AA compliance verification for ALL new tokens
- Screen reader testing with new semantic class names

## 5.3 Performance Validation (DETAILED)
- Bundle size comparison (expect 3-5KB reduction from JS → CSS)
- Runtime performance benchmarks (glow application speed)
- Cold start time measurement
- **NEW:** Token CSS load time impact

## 5.4 Lint Enforcement (COMPREHENSIVE)
- Verify `no-primitive-colors` rule catches ALL violations
- Confirm CI fails on primitive color usage
- Test rule exceptions for globals.css
- **NEW:** Validate codemod didn't introduce violations

## 5.5 Feature Flag Rollout (ENHANCED SAFETY)
- Deploy behind `themeMigration` feature flag
- Gradual rollout: 5% → 25% → 50% → 100% over 8 hours
- Monitor Sentry for theme-related errors
- Monitor performance metrics during rollout
- Keep rollback plan: revert flag + revert globals.css + revert themeInitializer

## 5.6 Documentation Updates (COMPREHENSIVE)
- Update README-GLOW-EFFECTS.md with new utility approach
- Create Migration Cookbook for future component updates
- Document token naming conventions
- Update Storybook with new token examples
- **NEW:** Document themeInitializer migration
- **NEW:** Document codemod usage for future migrations

---

# Success Criteria (ENHANCED)
- Zero primitive color classes in business-logic components (enforced by lint)
- All 16 infrastructure components migrated from useComponentTheme
- Visual parity maintained across light/dark themes AND all glow states
- Bundle size reduced by 3-5KB
- CI enforces token-only approach
- Feature flag rollout completed without errors
- **NEW:** All glow utility functions preserved and working
- **NEW:** Theme initialization system successfully migrated
- **NEW:** Sizing tokens integrated and functional
- **NEW:** Codemod tool available for future migrations 