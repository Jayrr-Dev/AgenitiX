# 🎯 NODE SIZING STANDARDS - SYSTEM-WIDE VALIDATION v1.1.0

## 🚨 CRITICAL SIZING REQUIREMENTS

**ALL node size configurations MUST use Tailwind CSS classes, NOT plain CSS values.**

## 📐 NEW STANDARDIZED SIZE SYSTEM

The new sizing system provides predefined constants for consistent node sizing across the application.

### 🔧 COLLAPSED SIZES (Icon State)

```typescript
// COLLAPSED SIZE CONSTANTS
export const COLLAPSED_SIZES = {
  C1: { width: "w-[60px]", height: "h-[60px]" }, // size-c1: 60x60
  C1W: { width: "w-[120px]", height: "h-[60px]" }, // size-c1w: 120x60
  C2: { width: "w-[120px]", height: "h-[120px]" }, // size-c2: 120x120
  C3: { width: "w-[180px]", height: "h-[180px]" }, // size-c3: 180x180
} as const;
```

### 🔧 EXPANDED FIXED SIZES (UI State)

```typescript
// EXPANDED FIXED SIZE CONSTANTS
export const EXPANDED_SIZES = {
  FE0: { width: "w-[60px]", height: "h-[60px]" }, // size-fe0: 60x60
  FE0H: { width: "w-[60px]", height: "h-[120px]" }, // size-fe0h: 60x120
  FE1: { width: "w-[120px]", height: "h-[120px]" }, // size-fe1: 120x120
  FE1H: { width: "w-[120px]", height: "h-[180px]" }, // size-fe1h: 120x180
  FE2: { width: "w-[180px]", height: "h-[180px]" }, // size-fe2: 180x180
  FE3: { width: "w-[240px]", height: "h-[240px]" }, // size-fe3: 240x240
} as const;
```

### 🔧 EXPANDED VARIABLE SIZES (Width Only)

```typescript
// EXPANDED VARIABLE SIZE CONSTANTS (width only, height auto)
export const EXPANDED_VARIABLE_SIZES = {
  VE0: { width: "w-[60px]" }, // size-ve0: 60w
  VE1: { width: "w-[120px]" }, // size-ve1: 120w
  VE2: { width: "w-[180px]" }, // size-ve2: 180w
  VE3: { width: "w-[240px]" }, // size-ve3: 240w
} as const;
```

## 🎯 STANDARDIZED SIZE COMBINATIONS

### Pattern 1: Small Trigger Nodes

```typescript
size: {
  collapsed: COLLAPSED_SIZES.C1,     // 60x60
  expanded: EXPANDED_SIZES.FE1  // 120x120
}
```

### Pattern 2: Wide Text Nodes

```typescript
size: {
  collapsed: COLLAPSED_SIZES.C1W,    // 120x60
  expanded: EXPANDED_VARIABLE_SIZES.VE2  // 180w (auto height)
}
```

### Pattern 3: Large Interactive Nodes

```typescript
size: {
  collapsed: COLLAPSED_SIZES.C2,     // 120x120
  expanded: EXPANDED_SIZES.FE3  // 240x240
}
```

### Pattern 4: Extra Large Nodes

```typescript
size: {
  collapsed: COLLAPSED_SIZES.C3,     // 180x180
  expanded: EXPANDED_SIZES.FE3  // 240x240
}
```

## ✅ CORRECT USAGE EXAMPLES

### Using Size Constants:

```typescript
import { COLLAPSED_SIZES, EXPANDED_SIZES, EXPANDED_VARIABLE_SIZES } from './constants/sizes';

// Small trigger node
size: {
  collapsed: COLLAPSED_SIZES.C1,
  expanded: EXPANDED_SIZES.FE1
}

// Text node with variable width
size: {
  collapsed: COLLAPSED_SIZES.C1W,
  expanded: EXPANDED_VARIABLE_SIZES.VE2
}
```

### Manual Configuration (if needed):

```typescript
size: {
  collapsed: {
    width: "w-[60px]",    // ✅ Tailwind class
    height: "h-[60px]",   // ✅ Tailwind class
  },
  expanded: {
    width: "w-[120px]",   // ✅ Tailwind class
    height: "h-[120px]",  // ✅ Tailwind class (optional)
  },
}
```

## ❌ INCORRECT FORMAT (WILL CAUSE BUGS)

```typescript
size: {
  collapsed: {
    width: "60px",        // ❌ Plain CSS - BREAKS RENDERING
    height: "60px",       // ❌ Plain CSS - BREAKS RENDERING
  },
  expanded: {
    width: "120px",       // ❌ Plain CSS - BREAKS RENDERING
  },
}
```

## 🛡️ VALIDATION SYSTEM

### TypeScript Protection

```typescript
type TailwindWidth = `w-[${string}]` | `w-${string}`;
type TailwindHeight = `h-[${string}]` | `h-${string}`;

export interface NodeSize {
  collapsed: {
    width: TailwindWidth;
    height: TailwindHeight;
  };
  expanded: {
    width: TailwindWidth;
    height?: TailwindHeight; // Optional for variable sizes
  };
}
```

### Runtime Validation

```typescript
if (config.size && !validateNodeSize(config.size)) {
  console.error(
    `❌ [NodeFactory] Invalid size configuration for ${config.nodeType}`
  );
  console.error('   Expected: Tailwind classes like "w-[60px]", "h-[60px]"');
  console.error("   Received:", config.size);
  console.error("   Using default size instead.");
  config.size = undefined;
}
```

## 📋 SIZE REFERENCE CHART

| Size Name                   | Code                          | Dimensions | Usage                      |
| --------------------------- | ----------------------------- | ---------- | -------------------------- |
| **COLLAPSED SIZES**         |
| size-c1                     | `COLLAPSED_SIZES.C1`          | 60x60      | Small triggers, icons      |
| size-c1w                    | `COLLAPSED_SIZES.C1W`         | 120x60     | Text nodes, wide triggers  |
| size-c2                     | `COLLAPSED_SIZES.C2`          | 120x120    | Medium interactive nodes   |
| size-c3                     | `COLLAPSED_SIZES.C3`          | 180x180    | Large complex nodes        |
| **EXPANDED FIXED SIZES**    |
| size-fe0                    | `EXPANDED_SIZES.FE0`    | 60x60      | Minimal expanded           |
| size-fe0h                   | `EXPANDED_SIZES.FE0H`   | 60x120     | Narrow tall expanded       |
| size-fe1                    | `EXPANDED_SIZES.FE1`    | 120x120    | Standard expanded          |
| size-fe1h                   | `EXPANDED_SIZES.FE1H`   | 120x180    | Standard tall expanded     |
| size-fe2                    | `EXPANDED_SIZES.FE2`    | 180x180    | Large expanded             |
| size-fe3                    | `EXPANDED_SIZES.FE3`    | 240x240    | Extra large expanded       |
| **EXPANDED VARIABLE SIZES** |
| size-ve0                    | `EXPANDED_VARIABLE_SIZES.VE0` | 60w        | Narrow variable height     |
| size-ve1                    | `EXPANDED_VARIABLE_SIZES.VE1` | 120w       | Standard variable height   |
| size-ve2                    | `EXPANDED_VARIABLE_SIZES.VE2` | 180w       | Wide variable height       |
| size-ve3                    | `EXPANDED_VARIABLE_SIZES.VE3` | 240w       | Extra wide variable height |

## 🔧 TROUBLESHOOTING

### Common Issues:

1. **Toggle appears too small**: Use `COLLAPSED_SIZES.C1` + `EXPANDED_SIZES.FE1`
2. **Text gets cut off**: Use `COLLAPSED_SIZES.C1W` + `EXPANDED_VARIABLE_SIZES.VE2`
3. **Complex UI cramped**: Use `COLLAPSED_SIZES.C2` + `EXPANDED_SIZES.FE3`

### Validation Errors:

```
❌ NodeSize validation failed: Must use standardized size constants or Tailwind classes
```

**Solution:** Import and use the standardized size constants.

## 📁 FILES UPDATED FOR NEW STANDARDS

### Core Type Files:

- `features/business-logic-modern/infrastructure/node-creation/factory/types/index.ts`
- `features/business-logic-modern/infrastructure/node-creation/factory/constants/sizes.ts` (NEW)

### Component Files:

- All node components updated to use new size constants

## 🚀 MIGRATION GUIDE

### Step 1: Import New Size Constants

```typescript
import {
  COLLAPSED_SIZES,
  EXPANDED_SIZES,
  EXPANDED_VARIABLE_SIZES,
} from "../../infrastructure/node-creation/factory/constants/sizes";
```

### Step 2: Replace Old Size Configurations

```typescript
// OLD
size: {
  collapsed: { width: "w-[60px]", height: "h-[60px]" },
  expanded: { width: "w-[120px]" }
}

// NEW
size: {
  collapsed: COLLAPSED_SIZES.C1,
  expanded: EXPANDED_VARIABLE_SIZES.VE1
}
```

## 💡 BEST PRACTICES

1. **Use Constants**: Always prefer size constants over manual configuration
2. **Consistent Patterns**: Use the same size patterns for similar node types
3. **Variable Heights**: Use variable sizes for text-heavy nodes
4. **Fixed Heights**: Use fixed sizes for interactive nodes with specific UI layouts
5. **Test Responsiveness**: Verify node sizing works in both collapsed and expanded states

---

**Updated:** June 2025 v1.1.0
**Summary:** Complete redesign of node sizing system with standardized constants and clear naming conventions.

**Remember: Using plain CSS values like `"60px"` will break your node rendering!**
**Always use the new size constants or Tailwind classes like `"w-[60px]"` for proper functionality.**
