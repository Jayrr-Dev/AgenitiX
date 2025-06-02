# 🎯 NODE SIZING STANDARDS - SYSTEM-WIDE VALIDATION

## 🚨 CRITICAL SIZING REQUIREMENTS

**ALL node size configurations MUST use Tailwind CSS classes, NOT plain CSS values.**

### ✅ CORRECT FORMAT

```typescript
size: {
  collapsed: {
    width: "w-[60px]",    // ✅ Tailwind class
    height: "h-[60px]",   // ✅ Tailwind class
  },
  expanded: {
    width: "w-[120px]",   // ✅ Tailwind class
  },
}
```

### ❌ INCORRECT FORMAT (WILL CAUSE BUGS)

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

The system now includes TypeScript validation to prevent sizing errors:

```typescript
type TailwindWidth = `w-[${string}]` | `w-${string}`;
type TailwindHeight = `h-[${string}]` | `h-${string}`;

export interface NodeSize {
  collapsed: {
    width: TailwindWidth; // Only accepts Tailwind classes
    height: TailwindHeight; // Only accepts Tailwind classes
  };
  expanded: {
    width: TailwindWidth; // Only accepts Tailwind classes
    height?: TailwindHeight;
  };
}
```

### Runtime Validation

All factory functions now include runtime validation:

```typescript
if (config.size && !validateNodeSize(config.size)) {
  console.error(
    `❌ [NodeFactory] Invalid size configuration for ${config.nodeType}`
  );
  console.error('   Expected: Tailwind classes like "w-[60px]", "h-[60px]"');
  console.error("   Received:", config.size);
  console.error("   Using default size instead.");

  // Remove invalid size to fall back to defaults
  config.size = undefined;
}
```

## 📐 STANDARD SIZE CONSTANTS

Use these pre-defined constants for consistency:

```typescript
import { COMMON_NODE_SIZES } from './types';

// Trigger nodes
size: COMMON_NODE_SIZES.STANDARD_TRIGGER,

// Text nodes
size: COMMON_NODE_SIZES.TEXT_NODE,

// Large trigger nodes
size: COMMON_NODE_SIZES.LARGE_TRIGGER,
```

## 🎨 SIZE PATTERNS

### Pattern 1: Square Triggers (Most Common)

```typescript
size: {
  collapsed: { width: "w-[60px]", height: "h-[60px]" },
  expanded: { width: "w-[120px]" }
}
```

### Pattern 2: Rectangular Text Nodes

```typescript
size: {
  collapsed: { width: "w-[120px]", height: "h-[60px]" },
  expanded: { width: "w-[240px]" }
}
```

### Pattern 3: Large Interactive Nodes

```typescript
size: {
  collapsed: { width: "w-[80px]", height: "h-[80px]" },
  expanded: { width: "w-[160px]", height: "h-[140px]" }
}
```

## 🔧 TROUBLESHOOTING

### If Your Toggle Appears Too Small:

1. Check that size uses `"w-[60px]"` not `"60px"`
2. Verify your factory function imports `validateNodeSize`
3. Check browser console for validation errors
4. Ensure you're using the latest factory types

### Validation Errors:

If you see validation errors in console:

```
❌ NodeSize validation failed: Collapsed size must use Tailwind classes (w-[*] and h-[*])
```

**Solution:** Update your size configuration to use Tailwind classes.

## 📁 FILES UPDATED FOR VALIDATION

### Core Type Files:

- `features/business-logic-modern/infrastructure/node-creation/factory/types/index.ts`
- `features/business-logic/nodes/factory/types/index.ts`
- `features/business-logic-legacy/infrastructure/nodes/factory/types/index.ts`

### Factory Files:

- `features/business-logic-modern/infrastructure/node-creation/factory/NodeFactory.tsx`

### Fixed Node Files:

- `features/business-logic-modern/node-domain/trigger/TriggerOnToggle.tsx`
- `features/business-logic-modern/node-domain/test/TestError.tsx`

## 🚀 PREVENTION MEASURES

1. **TypeScript Validation**: Compile-time checking prevents incorrect format
2. **Runtime Validation**: Factory functions validate size configurations
3. **Standard Constants**: Pre-defined size constants reduce errors
4. **Documentation**: Clear examples and troubleshooting guides
5. **Console Warnings**: Clear error messages when validation fails

## 💡 BEST PRACTICES

1. **Use Constants**: Prefer `COMMON_NODE_SIZES` over custom sizes
2. **Consistent Ratios**: Keep expanded sizes proportional to collapsed
3. **Test Validation**: Check console for validation warnings during development
4. **Document Custom Sizes**: If using custom sizes, document the reasoning

---

**Remember: Using plain CSS values like `"60px"` will break your node rendering!**
**Always use Tailwind classes like `"w-[60px]"` for proper functionality.**
