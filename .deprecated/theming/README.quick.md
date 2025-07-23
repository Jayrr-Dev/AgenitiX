# 🪄 AgenitiX Theming – Quick-Start Guide

> This file is **2 minutes** long. For the full architecture spec see
> `documentation/1.3.0/infa/theming-system-architecture.md` or open Storybook.

---

## 1 Install / Generate

```bash
pnpm i              # install deps
pnpm generate:tokens # ⇢ ts-node scripts/gen-tokens.ts (syncs CSS ⟺ tokens.json)
```

## 2 Import tokens

```ts
import { CORE_TOKENS, combineTokens } from "@/theming";
```

## 3 Import component styles

```ts
import { nodeInspectorStyles } from "@/theming";
<div className={nodeInspectorStyles.getJsonContainer(true)} />
```

## 4 Add a new token

1. Edit `theming/tokens.json`
2. Run `pnpm generate:tokens`
3. Use it: `className="bg-[hsl(var(--core-colors-success))]"`

## 5 Add new component theme

1. Create a new file: `theming/components/newComponent.ts`
2. Define `NEW_COMPONENT_TOKENS` and `newComponentStyles`.
3. Export them from `theming/index.ts`.

## Script summary

| script            | purpose                           |
| ----------------- | --------------------------------- |
| `generate:tokens` | Sync JSON → CSS custom properties |
| `lint`            | ESLint + Prettier                 |
| `typecheck`       | `tsc --noEmit`                    |

---

© AgenitiX Design System – lightweight, tree-shakeable, type-safe.
For deep-dive docs run `pnpm storybook`.

Need deeper guidance? See [`DESIGN_WORKFLOW.md`](../documentation/1.3.0/styles/DESIGN_WORKFLOW.md) or the full architecture spec at
`documentation/1.3.0/infa/theming-system-architecture.md`.
Open Storybook for live examples.
