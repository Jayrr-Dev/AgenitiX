# 🪄 Styles & Design-System – Executive Summary

> Single page reference for **how our styling layer works**, where to change things, and helpful dev-only tools.

---

## 1. Source-of-Truth

• `features/business-logic-modern/infrastructure/theming/tokens.json` ← edit me only.
• Contains: Core primitives, node-category colours, infra palette, spacing, typography …

## 2. Code-Generation Commands

| Command                | What it does                                                                   |
| ---------------------- | ------------------------------------------------------------------------------ |
| `pnpm generate:tokens` | Converts `tokens.json` → `app/styles/_generated_tokens.css` (CSS custom props) |
| `pnpm generate:docs`   | Writes `documentation/core-tokens.md` (token table used by Storybook docs)     |
| `pnpm ci:tokens`       | WCAG-AA contrast validator (fails CI on ⚠ critical issues)                    |

A **prebuild** hook runs `generate:tokens`, and CI additionally checks for token drift + contrast.

## 3. Consuming Tokens in Code

```ts
import { CORE_TOKENS } from "@/features/…/theming";
import { NODE_INSPECTOR_TOKENS } from "@/features/…/theming/components/nodeInspector";

<div className={CORE_TOKENS.effects.rounded.full} />
```

Helpers:

- `combineTokens(...classes)` – safe Tailwind merge
- `getNodeInspectorVariant(category, variant)` – variant lookup with fallback

## 4. Runtime Themes

`_globals.css` imports `_generated_tokens.css` and defines the base `@theme` block.
`next-themes` toggles `.dark` / `.light` classes; Storybook's theme addon mirrors this.

## 5. Dev-only Tooling

### 🎨 Color Debugger _(development only)_

- Press **Ctrl + Shift + C** or choose "Color Debugger" in the theme switcher.
- Shows every CSS variable with actual colours for both themes.
- Console helpers: `showColorDebugger()`, `debugColors('actionToolbar')`.

### ✨ Glow Effects

- Config lives in `theming/stores/nodeStyleStore.ts` → `GLOW_EFFECTS`.
- Change blur/spread/colour via store or `glowUtils.setStrong() / setBlue()` in console.

## 6. Storybook Workspace

| Script                 | Result                                |
| ---------------------- | ------------------------------------- |
| `pnpm storybook`       | Dev server on <http://localhost:6006> |
| `pnpm build-storybook` | Static export in `storybook-static/`  |

Add-ons enabled: Essentials, Themes (dark/light), Viewport (mobile/tablet/desktop), A11y (automatic checks).

Existing stories:

- **Design Tokens/Core** – live table (auto-updates)
- **NodeInspector** – token table + preview (empty / locked)
- **Sidebar** – token table + preview

Create new stories by placing `*.stories.tsx` next to components – Storybook autodocs will pick up TS props.

## 7. Folder Pointers

```
app/styles/               entry.css + _globals.css + _generated_tokens.css
features/.../theming/     TS helpers, component tokens
scripts/                  gen-tokens, validate-tokens, gen-docs-tokens
.github/workflows/ci.yml  full CI pipeline
```

---

**TL;DR** – Change **`tokens.json`**, run **`pnpm generate:tokens`**, see updates in Storybook, commit the regenerated CSS. CI guarantees colour contrast and prevents drift.
