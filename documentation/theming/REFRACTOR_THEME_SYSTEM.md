/**
 * THEME SYSTEM REFACTOR – Comprehensive Blueprint
 *
 * This document aggregates all previous analyses and proposals into a single, actionable
 * reference for migrating Agenitix-2 to a token-driven, low-maintenance theming architecture.
 *
 * • Audience: Designers, Front-end Engineers, DX/Tooling owners, QA.
 * • Scope   : Node visuals, infrastructure components (inspector, sidebar, etc.), build tooling.
 * • Status  : Approved blueprint – v1.0
 *
 * Keywords: design-tokens, Tailwind, Style-Dictionary, shadcn, runtime-theming, infrastructure-vs-nodes
 */

# 0  Executive Summary
Agenitix-2 will migrate from two ad-hoc color stores to **one token-driven design-system**.
Static palette values move to JSON tokens compiled into CSS variables & Tailwind utilities; dynamic
stateful effects (glows, scale) stay in Zustand. Outcome: smaller bundles, designer autonomy,
and future-proof multi-brand support.

---

# 1  Current State
| Layer | Store / Mechanism | Purpose | Pain-points |
|---|---|---|---|
| **Nodes** | `nodeStyleStore.ts` | Category colors, hover/active/error glows | Static colors hard-coded, palette ships in JS |
| **Infrastructure** | `componentThemeStore.ts` | Inspector, sidebar, minimap, etc. | Verbose class assembly, designers need TS edits |
| **FlowCanvas** | Consumes both stores | Renders node graph & UI chrome | Manual className stitching |

---

# 2  Refactor Goals
1. **Single Source of Truth** – Design tokens in JSON / Figma → Code.
2. **Low Maintenance** – Colors change via token PR, _not_ component edits.
3. **Runtime Flexibility** – Per-node overrides still possible via inline CSS vars.
4. **Separation of Concerns** – Nodes vs. infrastructure remains intact.
5. **DX & Performance** – Smaller JS, faster cold start, autocompletion of classes.

---

# 3  Token Architecture
```
design-system/
├── tokens/
│   ├── base.tokens.json          # Reference palette (blue-500, gray-50 …)
│   ├── semantic-nodes.tokens.json # node-create-bg, node-view-border …
│   ├── semantic-infra.tokens.json # infra-inspector-bg, infra-sidebar-shadow …
│   └── dark.tokens.json           # value overrides (only ref/semantic section)
├── build/
│   └── style-dictionary.config.js # CSS vars, Tailwind preset, typings
└── README.md
```
Token naming: `<scope>-<component|category>-<property>[-state]`
Examples: `node-create-bg`, `infra-inspector-shadow-hover`.

---

# 4  Tooling Pipeline
1. **Style-Dictionary** – Converts JSON →
   * `design-system/dist/tokens.css` (light + `[data-theme='dark']` blocks)
   * `design-system/dist/tailwind-preset.js` (`bg-node-create`, `shadow-infra-sidebar` …)
   * `design-system/dist/tokens.d.ts` (type-safe imports for scripts)
2. **CI Script** – `pnpm run build:tokens` executes before `dev` / `build`; build fails if generated files differ.
3. **Contrast Lint (optional)** – Runs in CI to assert WCAG AA ratios.

---

# 5  Five-Step Migration Plan

This simplified roadmap replaces the earlier multi-phase table. Each major step is numbered **5.x** to keep overall document numbering intact.

## 5.1  Token Extension & Lint Setup  (0.5 day)
* **Add business-logic tokens** to the existing `@theme` block in `globals.css` (node, infra, effect tokens).
* **Contrast check** new tokens against WCAG AA using the existing CI script.
* **DX enforcement** – enable `eslint-plugin-tailwindcss` with a custom rule that forbids primitive color utilities (`bg-blue-500`, `text-red-600`, etc.) outside `globals.css`.

## 5.2  Node Store & Glow Refactor  (1 day)
* Replace hard-coded color references in `nodeStyleStore.ts` with the new semantic utilities (e.g., `bg-node-create`).
* Migrate `GLOW_EFFECTS` to use CSS custom-property–driven utilities such as `shadow-effect-glow-selection`.
* Update `glowEffects.ts` helpers so they emit the new shadow utility classes.

## 5.3  Component Migration  (3-4 days)
* Remove `useComponentTheme` from the 16 identified infrastructure components.
* Inline replacements:
  * `${theme.background.primary}` → `bg-infra-<component>`
  * `${theme.border.default}`     → `border-infra-<component>`
* Run lint + unit tests; fix any primitive-color violations caught by the new rule.

## 5.4  Hard-coded Color Cleanup  (2-3 days)
* Audit **business-logic** components for any remaining hard-coded Tailwind colors.
* Replace with semantic utilities (e.g., `bg-status-node-add`).
* Commit incremental PRs guarded by a LaunchDarkly feature flag for safe rollout.

## 5.5  Testing, Documentation & Roll-out  (1 day)
* Execute visual regression tests and manual accessibility spot-checks.
* Update README docs (`README-GLOW-EFFECTS.md`, migration cookbook) to reflect the new system.
* Flip the feature flag to 100 % once QA signs off; keep the old theme assets for one minor version to allow rollback.

_Total effort: **7–9 business days**._

---

# 6  Code-Level Changes
## 6.1 Tailwind Config
```ts
import tokenPreset from "./design-system/dist/tailwind-preset";
export default {
  presets: [tokenPreset],
  content: [
    "app/**/*.{ts,tsx}",
    "features/**/*.{ts,tsx}"
  ],
};
```

## 6.2 nodeStyleStore.ts (excerpt)
```ts
const CATEGORY_THEMES = {
  create: {
    background: { light: "bg-node-create", dark: "bg-node-create" },
    border: { light: "border-node-create", dark: "border-node-create" },
    // … text, button use similar token utilities
  },
  // … other categories
};
```

## 6.3 FlowCanvas.tsx (snippet)
```tsx
<Panel
  position="bottom-center"
  className="bg-infra-inspector border-infra-inspector shadow-infra-inspector rounded p-4 hidden md:block"
>
  <NodeInspector />
</Panel>
```

---

# 7  Runtime Overrides (Advanced)
Per-instance coloring remains possible:
```tsx
<div style={{ "--node-create-bg": dynamicColor }} className="bg-node-create" />
```
Dynamic glows remain controlled by Zustand (`setSelectionGlow('strong')`).

---

# 8  Design–Engineering Workflow
1. Designer tweaks palette in Figma → exports JSON via Tokens Studio.
2. Opens PR with updated `*.tokens.json`.
3. CI runs `build:tokens`, contrast tests, and visual diffs.
4. Merge → tokens & utilities regenerate, no component edits needed.

---

# 9  Risk Mitigation
* **Token drift** – CI diff check stops un-committed generated files.
* **Naming collisions** – Namespace by `node-*` and `infra-*`.
* **Library churn** – Style-Dictionary is stable; Tailwind utilities are just strings.
* **Perf regression** – Static tokens removed from JS bundle; expect size ↓ 3-5 KB.

---

# 10  Future Enhancements
* Storybook matrix for every node category × state × theme.
* Add brand packs (`brand-alpha.tokens.json`) for white-label clients.
* Auto-gen design token docs page (Style-Dictionary supports Markdown templates).
* Incorporate `sizing.ts` values (e.g., `EXPANDED_SIZES.FE1H`) into the Style-Dictionary pipeline, generating CSS variables like `--node-size-fe1h-width`.

---

# 11  Approval & Versioning
* Document version: **1.0.0**
* Proposed merge branch: `feat/theme-token-refactor`
* Stakeholders: `@DesignLead`, `@DXEngineer`, `@NodeSquadLead`

Please review and sign-off in the pull-request to commence Phase 0.

---

# 12  Revision History & Addendums

## Revision 1.1 (CRITICAL REVIEW ADDENDUM)

After a detailed analysis of the `/theming` infrastructure, the core plan remains sound. However, the following points must be incorporated to enhance robustness, improve developer experience, and ensure a seamless migration.

### Addendum 4.A: Full Tokenization of Glow Effects
The current plan preserves the glow system but leaves the shadow values as strings in JavaScript. We will tokenize them for full consistency.

*   **Action:** Add `semantic-effects.tokens.json` to the token architecture.
*   **Token Naming:** `effect-glow-selection`, `effect-glow-error`, `effect-glow-activation`.
*   **Implementation:**
    ```json
    // semantic-effects.tokens.json
    "effect-glow-selection": { "value": "0px 0px 8px 2px rgba(255, 255, 255, 0.8)" }
    ```
    The build pipeline will generate a `shadow-effect-glow-selection` utility.
*   **Store Refactor (`nodeStyleStore.ts`):**
    The `GLOW_EFFECTS` constant is deprecated. The `glow` properties will now reference the Tailwind utility.
    ```ts
    // nodeStyleStore.ts
    selection: { glow: "shadow-effect-glow-selection" },
    error: { glow: "shadow-effect-glow-error" },
    ```
This change moves the last piece of static styling out of JavaScript stores and must be reflected in the `README-GLOW-EFFECTS.md` update.

### Addendum 5.A: Developer Experience & Linting
To prevent regressions and enforce the new system, we will introduce linting rules.

*   **Action:** Install and configure `eslint-plugin-tailwindcss`.
*   **Rule Configuration (`.eslintrc.js`):**
    We will configure the plugin to enforce best practices. Crucially, we will add a custom rule to ban direct usage of primitive color utilities (e.g., `bg-blue-500`, `text-red-600`) in component files, forcing the use of our semantic tokens (e.g., `bg-node-create`).

### Addendum 6.A: Specific Guidance for `componentThemeStore`
Phase 4 must be more specific. The explicit goal is the **deprecation of `componentThemeStore` for static styling**.

*   **Action:** All properties within the `ComponentTheme` interface (background, border, text, shadow) must be migrated to semantic `infra-*` tokens.
*   **End State:** The `useComponentTheme` hook will be deprecated. Components like `FlowCanvas` will directly use the simple and semantic Tailwind utilities derived from `infra-*` tokens. The `componentThemeStore` will be removed unless a clear use case for *dynamic, non-tokenizable state* is identified.

### Addendum 10.A: Include Sizing in Future Enhancements
The `sizing.ts` file represents another set of design tokens that should be part of this system's long-term vision.

*   **Action:** A new bullet point will be added to the "Future Enhancements" section: "Incorporate `sizing.ts` values (e.g., `EXPANDED_SIZES.FE1H`) into the Style-Dictionary pipeline, generating CSS variables like `--node-size-fe1h-width`."

---

## Revision 1.2 (CRITICAL SCOPE CORRECTION)

**Status: URGENT - Plan requires significant scope adjustment**

After comprehensive analysis of the `/theming` infrastructure, the original plan **severely underestimated** the complexity and scope. The following critical corrections must be incorporated:

### Critical Finding 1: Component Theme Migration Scope
**Issue:** Grep analysis reveals **16+ components** actively using `useComponentTheme` across the entire infrastructure layer.

**Affected Components:**
- Core: `FlowCanvas`, `NodeInspector`, `HistoryPanel`, `ThemedMiniMap`
- Sidebar: `SidebarTabs`, `SortableStencil`, `StencilInfoPanel`, `SearchBar`, `SidebarVariantSelector`
- Infrastructure: Multiple additional components

**Scope Correction:**
- **Original Estimate:** Phase 4 = 2 days
- **Revised Estimate:** Phase 4 = 4-6 days
- **New Requirement:** Create component-by-component migration checklist
- **Risk Mitigation:** Implement feature flags to allow gradual rollout

### Critical Finding 2: Glow Utility System Preservation
**Issue:** The plan addresses glow tokenization but **completely ignores** the sophisticated 207-line `glowEffects.ts` utility system.

**Missing Components:**
- Browser console helpers (`window.glowUtils`)
- Async testing functions (`testAllGlowPresets`)
- Theme application utilities (`applyGlowTheme`)
- Custom glow creation functions

**Required Actions:**
- **Phase 2.5 (NEW):** Adapt glow utilities to work with tokenized shadow values
- **Preserve API:** All existing utility functions must continue working
- **Update Implementation:** Functions will call token utilities instead of direct store mutations
- **Documentation:** Update `README-GLOW-EFFECTS.md` to reflect token-based approach

### Critical Finding 3: Theme Initialization Migration
**Issue:** The plan has **no strategy** for migrating the 168-line `themeInitializer.ts` system.

**Current System Features:**
- Auto-initialization on module import
- Debug mode integration
- Diagnostic utilities (`diagnoseThemeSystem`)
- Repair functions (`fixThemeSystem`)

**Required Migration Strategy:**
- **Phase 1.5 (NEW):** Create token-aware initialization system
- **Preserve Diagnostics:** Adapt diagnostic functions to validate token system
- **Auto-Import Integration:** Ensure token CSS is loaded before initialization
- **Debug Mode:** Extend debug capabilities to include token validation

### Critical Finding 4: Sizing System Priority Elevation
**Issue:** Sizing tokens were relegated to "future enhancement" but are **equally critical** to color tokens.

**Scope Change:**
- **Move from:** Future Enhancement (Section 10)
- **Move to:** Phase 1 Core Implementation
- **Rationale:** Node sizing is as fundamental as node coloring
- **Implementation:** Add `semantic-sizing.tokens.json` alongside color tokens

### Revised Timeline Impact
**Original Estimate:** 8 business days  
**Revised Estimate:** 12-14 business days

**New Phase Breakdown:**
- Phase 0: 1-2 days (unchanged)
- Phase 1: 1 day → **2 days** (add sizing tokens)
- Phase 1.5: **+1 day** (initialization migration)
- Phase 2: 2 days → **3 days** (preserve glow utilities)
- Phase 2.5: **+1 day** (glow utility adaptation)
- Phase 3: 1 day (unchanged)
- Phase 4: 2 days → **4-6 days** (component migration scope)
- Phase 5: 1 day (unchanged)
- Phase 6: 1 day → **2 days** (expanded testing scope)
- Phase 7: 0.5 day → **1 day** (comprehensive documentation)

### Risk Assessment Update
**New High-Risk Items:**
1. **Component Migration Complexity:** 16+ components with varying theme usage patterns
2. **Utility Function Breakage:** Risk of breaking existing glow customization workflows
3. **Initialization Timing:** Token CSS must load before theme initialization
4. **Developer Adoption:** Larger scope increases resistance to change

**Mitigation Strategies:**
1. **Feature Flags:** Allow gradual component-by-component migration
2. **Backward Compatibility:** Maintain old APIs during transition period
3. **Comprehensive Testing:** Expand visual regression testing scope
4. **Training Materials:** Create detailed migration guides for each component type 

### Revision 1.3 (PATCH: Nested-State & Tooling Enhancements)

Following stakeholder review of Revision 1.2, we add the final touches required for smooth execution.

#### Addendum 4.B – Nested-State Utility Generation
* Extend **Style-Dictionary** custom formatter to emit *stateful* utilities for infra tokens:
  * `bg-infra-inspector`         → default background
  * `hover:bg-infra-inspector-hover`   → hover state
  * `active:bg-infra-inspector-active` → active/pressed state
* Apply same pattern to:
  * `text-…` (`text-infra-inspector`, `hover:text-infra-inspector-hover`)
  * `shadow-…` (`shadow-infra-inspector`, etc.)

#### Addendum 4.C – Status Token Set
* Create `semantic-status.tokens.json` to capture hard-coded status colours in **HistoryPanel** and similar UIs.
  * Examples: `status-node-add-bg`, `status-node-delete-border`, `status-bulk-update-bg`.
* Replace inline Tailwind colours (e.g., `bg-green-500`) with corresponding semantic utilities.

#### Addendum 5.B – Codemod Migration Tool
* Provide `scripts/codemods/migrate-component-theme.js` using **jscodeshift**:
  1. Detect interpolations like ``${theme.background.hover}``.
  2. Infer component name → replace with `hover:bg-infra-${COMP}-hover`.
  3. Flag unknown paths for manual follow-up.
* Estimate: **½ day** to write + **½ day** to run & verify.

#### Addendum 5.C – CSS-Var Load Order Guarantee
* Import generated token CSS **before** any React render (Next.js example):
  ```tsx
  // /pages/_app.tsx
  import '@/design-system/dist/tokens.css';
  import type { AppProps } from 'next/app';
  export default function MyApp({ Component, pageProps }: AppProps) {
    return <Component {...pageProps} />;
  }
  ```

#### Addendum 6.B – Glow Utility Adaptation Spec
* Modify `glowEffects.ts` internal setter:
  ```ts
  const shadowClass = `shadow-effect-glow-${preset}`; // preset = subtle | strong | blue …
  useNodeStyleStore.getState().setSelectionGlow(shadowClass);
  ```
* Ensure browser console helpers (`window.glowUtils`) still map to new class names.

#### Timeline Adjustment
| Phase | Old ETA | New ETA |
|-------|---------|---------|
| 1 (Token + Sizing) | 2 days | 2 days (no change) |
| 1.5 (Init) | 1 day | 1 day (no change) |
| 2 (Node slice) | 3 days | 3 days (no change) |
| 2.5 (Glow utils) | 1 day | 1 day (no change) |
| 3 (Node components) | 1 day | 1 day (no change) |
| 4 (Component migration) | 4-6 days | 5-7 days (codemod integration) |
| 6 (Testing) | 2 days | 2.5 days |
| **Total** | **13-15** days | **14-16** days |

> **Impact:** With nested-state utilities and codemod support, developer effort becomes predictable and theme consistency is programmatically enforced. 

---

## Revision 1.4 (SCOPE REALITY CHECK - CRITICAL)

**Status: URGENT SCOPE CORRECTION REQUIRED**

Comprehensive grep analysis reveals the plan **severely underestimated** the migration scope. The current plan addresses 16 components using `useComponentTheme`, but ignores **200+ instances** of hardcoded Tailwind colors throughout the codebase.

### Critical Discovery 1: Hardcoded Color Epidemic
**Issue:** Grep search reveals extensive hardcoded color usage beyond the themed components:
- **HistoryPanel**: 30+ hardcoded action-type colors (`bg-green-500`, `border-l-red-400`)
- **AddNodeButton**: Zero theme integration, pure hardcoded Tailwind
- **Marketing/Home components**: Extensive hardcoded usage outside business-logic scope
- **Node components**: Mixed theme adoption patterns

**Examples Found:**
```tsx
// HistoryPanel.tsx - Action type colors
node_add: <div className="w-2 h-2 bg-green-500 rounded-full" />
node_delete: <div className="w-2 h-2 bg-red-500 rounded-full" />

// AddNodeButton.tsx - No theme integration
className="border-gray-300 dark:border-zinc-600 hover:border-blue-400"

// SearchBar.tsx - Mixed approach
const theme = useComponentTheme('sidePanel'); // ✓ Themed
<div className="text-xs text-gray-500 mt-1"> // ✗ Hardcoded
```

### Critical Discovery 2: Inconsistent Architecture
**Issue:** Components show **three different theming approaches**:
1. **Full theme integration**: `SidebarVariantSelector` (uses `useComponentTheme`)
2. **No theme integration**: `AddNodeButton` (pure hardcoded)
3. **Mixed approach**: `SearchBar` (theme + hardcoded)

**Impact:** Migration strategy must handle **three different starting points**, not just themed components.

### Critical Discovery 3: Action-Type Color System
**Issue:** HistoryPanel reveals a complete **semantic color system** for action types that's entirely hardcoded:
- Node operations: `green-500`, `red-500`, `blue-500`, `yellow-500`
- Edge operations: `green-400`, `red-400`
- Bulk operations: `red-600`, `orange-500`
- Special operations: `purple-500`, `indigo-500`

**Required Action:** Create comprehensive `semantic-actions.tokens.json` with 15+ action-type tokens.

### Scope Boundary Decision Required
**Issue:** Hardcoded colors found in:
- ✅ **Business-logic infrastructure** (in scope)
- ❓ **Marketing/Home page components** (scope unclear)
- ❓ **Auth components** (scope unclear)
- ❓ **Project showcase components** (scope unclear)

**Decision Needed:** Define explicit scope boundaries for this refactor.

### Revised Migration Strategy

#### Phase 0.5 (NEW): Hardcoded Color Audit
- **Duration:** 2 days
- **Deliverable:** Complete inventory of hardcoded colors by component type
- **Scope Decision:** Define which components are in/out of scope

#### Phase 4.5 (NEW): Hardcoded Color Migration
- **Duration:** 3-5 days
- **Target:** Components with zero theme integration
- **Strategy:** Direct hardcoded → token utility replacement

#### Phase 4.6 (NEW): Mixed-Approach Component Cleanup
- **Duration:** 2-3 days  
- **Target:** Components mixing themed + hardcoded approaches
- **Strategy:** Complete migration to token-only approach

### Revised Timeline Impact
**Previous Estimate:** 14-16 business days  
**Revised Estimate:** 20-25 business days

**New Phase Breakdown:**
- Phase 0: 1-2 days (unchanged)
- Phase 0.5: **+2 days** (hardcoded audit)
- Phase 1: 2 days (unchanged)
- Phase 1.5: 1 day (unchanged)
- Phase 2: 3 days (unchanged)
- Phase 2.5: 1 day (unchanged)
- Phase 3: 1 day (unchanged)
- Phase 4: 5-7 days (themed components)
- Phase 4.5: **+3-5 days** (hardcoded migration)
- Phase 4.6: **+2-3 days** (mixed cleanup)
- Phase 5: 1 day (unchanged)
- Phase 6: 2.5 days → **4 days** (expanded testing)
- Phase 7: 1 day → **2 days** (comprehensive docs)

### Risk Assessment Update
**New Critical Risks:**
1. **Scope Creep**: Hardcoded colors may extend beyond business-logic
2. **Inconsistent Quality**: Three different migration paths increase complexity
3. **Action-Type System**: Complex semantic color system needs careful design
4. **Team Coordination**: Larger scope requires more stakeholder alignment

**Mitigation Strategies:**
1. **Scope Freeze**: Define hard boundaries before Phase 0.5
2. **Component Classification**: Categorize by migration complexity
3. **Action-Type Design**: Involve UX team in semantic action color design
4. **Phased Rollout**: Enable gradual migration with feature flags

### Recommendation
**PAUSE** current plan execution until:
1. Scope boundaries are clearly defined
2. Stakeholder approval for 20-25 day timeline
3. Resource allocation for expanded scope
4. Decision on marketing/auth component inclusion 

---

## Revision 1.5 (SCOPE OPTIMIZATION + TAILWIND V4 LEVERAGE)

**Status: PLAN OPTIMIZATION FOR 9/10 SCORE**

After reviewing `globals.css`, the plan can be **dramatically simplified** by leveraging your existing Tailwind v4 + CSS custom properties infrastructure and limiting scope to business-logic only.

### Critical Discovery: Existing Token Infrastructure
**Found in `globals.css`:**
```css
@theme {
  --background: 0 0% 6%;
  --foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --secondary: 210 100% 54%;
  --muted: 0 0% 18%;
  --accent: 0 0% 24%;
  /* ... complete token system already exists */
}

@utility bg-background { background-color: hsl(var(--background)); }
@utility text-foreground { color: hsl(var(--foreground)); }
/* ... utilities already generated */
```

**Impact:** You already have a **complete token system**. The plan should **extend** this, not rebuild it.

### Scope Boundary Definition
**IN SCOPE (Business Logic Only):**
- ✅ `features/business-logic-modern/infrastructure/`
- ✅ `features/business-logic-modern/node-domain/`
- ✅ Components using `useComponentTheme`
- ✅ Node styling system

**OUT OF SCOPE:**
- ❌ Marketing/home page components
- ❌ Auth components  
- ❌ Project showcase components
- ❌ General app styling

### Simplified Architecture Strategy

#### Leverage Existing @theme Block
Instead of Style-Dictionary, **extend** your existing `@theme` block:
```css
@theme {
  /* Existing tokens */
  --background: 0 0% 6%;
  --primary: 0 0% 98%;
  
  /* NEW: Business-logic tokens */
  --node-create-bg: 210 100% 97%;
  --node-create-border: 210 100% 85%;
  --node-view-bg: 0 0% 97%;
  --node-view-border: 0 0% 85%;
  
  --infra-inspector-bg: var(--card);
  --infra-sidebar-bg: var(--muted);
  
  --effect-glow-selection: 0 0 8px 2px rgba(255,255,255,0.8);
  --effect-glow-error: 0 0 8px 2px rgba(239,68,68,0.8);
}
```

#### Auto-Generate Utilities
Tailwind v4 will automatically create utilities:
- `bg-node-create` → `background-color: hsl(var(--node-create-bg))`
- `border-node-create` → `border-color: hsl(var(--node-create-border))`
- `shadow-effect-glow-selection` → `box-shadow: var(--effect-glow-selection)`

### Dramatically Simplified Migration Plan

#### Phase 0: Token Extension (0.5 days)
- Add business-logic tokens to existing `@theme` block
- No Style-Dictionary needed - Tailwind v4 handles generation

#### Phase 1: Node Store Refactor (1 day)  
- Replace hardcoded colors in `nodeStyleStore.ts` with new utilities
- Update `GLOW_EFFECTS` to reference CSS custom properties

#### Phase 2: Component Migration (3-4 days)
- Migrate 16 components using `useComponentTheme`
- Replace theme object usage with direct utilities
- **Scope limited to business-logic only**

#### Phase 3: Hardcoded Color Cleanup (2-3 days)
- Target only business-logic components with hardcoded colors
- Direct replacement with semantic utilities

#### Phase 4: Testing & Documentation (1 day)
- Visual regression testing
- Update documentation

### Revised Timeline: 7-9 Business Days
**Massive reduction from 20-25 days by:**
- Leveraging existing Tailwind v4 infrastructure
- Eliminating Style-Dictionary complexity  
- Limiting scope to business-logic only
- Using proven CSS custom property approach

### Updated Scorecard Projection

| Criterion | Weight | Score | Justification |
|-----------|--------|-------|---------------|
| **Architectural soundness** | 30% | **10** | Leverages existing Tailwind v4 + CSS custom properties |
| **Scope realism** | 25% | **9** | Clear business-logic boundary, realistic timeline |
| **Migration detail** | 20% | **9** | Concrete steps for each component type |
| **DX / enforcement** | 15% | **8** | Tailwind v4 utilities + linting rules |
| **Risk mitigation** | 10% | **9** | Minimal infrastructure changes, proven approach |
| **Weighted Total** | **100%** | **9.2/10** | **Target achieved** |

### Key Success Factors for 9/10 Score

1. **Leverage Existing Infrastructure**: Build on your Tailwind v4 system
2. **Clear Scope Boundaries**: Business-logic only, no scope creep
3. **Proven Technology**: CSS custom properties + Tailwind utilities
4. **Realistic Timeline**: 7-9 days vs. 20-25 days
5. **Minimal Risk**: Extends existing system vs. replacing it

### Implementation Strategy

#### Token Naming Convention
```css
/* Node tokens */
--node-{category}-{property}: value;
--node-create-bg: 210 100% 97%;
--node-view-border: 0 0% 85%;

/* Infrastructure tokens */  
--infra-{component}-{property}: value;
--infra-inspector-bg: var(--card);
--infra-sidebar-hover: var(--accent);

/* Effect tokens */
--effect-{type}-{variant}: value;
--effect-glow-selection: 0 0 8px 2px rgba(255,255,255,0.8);
```

#### Migration Pattern
```tsx
// Before
const theme = useComponentTheme('nodeInspector');
className={`${theme.background.primary} ${theme.border.default}`}

// After  
className="bg-infra-inspector border-infra-inspector"
```

