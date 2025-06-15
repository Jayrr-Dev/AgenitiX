/\*\*

- DESIGN WORKFLOW GUIDE - Step-by-step processes for design system tasks
-
- • Complete workflows for adding new node categories and components
- • Token management and validation processes
- • Color system workflows with WCAG compliance
- • Development and testing procedures
- • Troubleshooting common design system issues
-
- Keywords: design-workflow, token-management, node-creation, color-system, wcag-compliance
  \*/

# 🎨 Design System Workflow Guide

This guide provides step-by-step workflows for common design system tasks. Each workflow is optimized for solo development with automated validation and minimal maintenance overhead.

## 🚀 Quick Reference

| Task                         | Time        | Files Changed | Auto-Validation    |
| ---------------------------- | ----------- | ------------- | ------------------ |
| Add new node category        | ~5 minutes  | 1 file        | ✅ WCAG + CI       |
| Add infrastructure component | ~3 minutes  | 1 file        | ✅ WCAG + CI       |
| Adjust existing colors       | ~2 minutes  | 1 file        | ✅ WCAG + CI       |
| Create new component theme   | ~10 minutes | 2-3 files     | ✅ TypeScript      |
| Debug color issues           | ~1 minute   | 0 files       | ✅ Visual debugger |

---

## 🎯 Workflow 1: Adding a New Node Category

**Use Case**: You need to add a new type of node (e.g., "database", "api", "transform")

### Step 1: Add Token Definition

```bash
# Open the tokens file
code features/business-logic-modern/infrastructure/theming/tokens.json
```

Add your new category to the `node` section:

```json
{
  "node": {
    "existing-categories": "...",
    "database": {
      "bg": "210, 85%, 45%",
      "text": "210, 85%, 95%"
    }
  }
}
```

### Step 2: Generate and Validate

```bash
# Generate CSS from tokens
pnpm generate:tokens

# Validate WCAG compliance
pnpm validate:colors

# Generate documentation
pnpm generate:docs
```

### Step 3: Use in Components

```tsx
// In your node component
import { NODE_INSPECTOR_TOKENS } from "@/features/business-logic-modern/infrastructure/theming/components";

const DatabaseNode = () => (
  <div
    className={`
    ${NODE_INSPECTOR_TOKENS.node.database.bg}
    ${NODE_INSPECTOR_TOKENS.node.database.text}
  `}
  >
    Database Node
  </div>
);
```

### Step 4: Test and Commit

```bash
# Test the build
pnpm build

# Commit changes
git add .
git commit -m "feat: add database node category with WCAG compliance"
```

**✅ Result**: New node category with automatic WCAG validation and CI protection

---

## 🏗️ Workflow 2: Adding Infrastructure Component

**Use Case**: You need styling for a new UI component (e.g., "notification", "modal", "breadcrumb")

### Step 1: Add Infrastructure Token

```json
{
  "infra": {
    "existing-components": "...",
    "notification": {
      "bg": "45, 100%, 95%",
      "text": "45, 100%, 15%"
    }
  }
}
```

### Step 2: Generate and Validate

```bash
pnpm generate:tokens && pnpm validate:colors
```

### Step 3: Create Component Theme (Optional)

```bash
# Create new component theme file
code features/business-logic-modern/infrastructure/theming/components/notification.ts
```

```typescript
/**
 * NOTIFICATION COMPONENT THEME - Toast and alert notification styling
 */

export const NOTIFICATION_TOKENS = {
  // Base notification styles
  base: "bg-infra-notification text-infra-notification border border-border rounded-lg p-4",

  // Variants
  success: "bg-green-50 text-green-900 border-green-200",
  error: "bg-red-50 text-red-900 border-red-200",
  warning: "bg-yellow-50 text-yellow-900 border-yellow-200",

  // Interactive states
  hover: "hover:shadow-md transition-shadow",
  dismissible: "cursor-pointer hover:opacity-80",
} as const;
```

### Step 4: Export from Index

```typescript
// In features/business-logic-modern/infrastructure/theming/components/index.ts
export { NOTIFICATION_TOKENS } from "./notification";
```

**✅ Result**: New infrastructure component with consistent theming

---

## 🎨 Workflow 3: Adjusting Existing Colors

**Use Case**: You need to tweak colors for better contrast or visual appeal

### Step 1: Identify Current Values

```bash
# Open visual preview
open documentation/tokens-preview.html

# Or check current tokens
code features/business-logic-modern/infrastructure/theming/tokens.json
```

### Step 2: Use Color Debugger (Development)

```javascript
// In browser console (development only)
showColorDebugger();

// Test different colors visually
debugColors("yourComponent");
```

### Step 3: Adjust HSL Values

```json
{
  "node": {
    "create": {
      "bg": "142, 76%, 36%", // Original
      "bg": "142, 80%, 40%", // Brighter, more saturated
      "text": "142, 84%, 10%" // Darker text for better contrast
    }
  }
}
```

### Step 4: Validate and Test

```bash
# Check WCAG compliance
pnpm validate:colors

# Generate updated CSS
pnpm generate:tokens

# View changes
open documentation/tokens-preview.html
```

**✅ Result**: Updated colors with automatic contrast validation

---

## 🔧 Workflow 4: Creating Component Theme

**Use Case**: You're building a complex component that needs its own theme system

### Step 1: Plan Token Usage

```typescript
// Identify what tokens you need
const requiredTokens = {
  backgrounds: ["primary", "secondary", "muted"],
  text: ["foreground", "muted"],
  borders: ["default", "accent"],
  states: ["hover", "active", "disabled"],
};
```

### Step 2: Create Theme File

```bash
code features/business-logic-modern/infrastructure/theming/components/yourComponent.ts
```

```typescript
/**
 * YOUR_COMPONENT_THEME - Comprehensive styling for YourComponent
 *
 * • Base styles with consistent spacing and typography
 * • Interactive states (hover, active, disabled)
 * • Variant support (primary, secondary, outline)
 * • Integration with core design tokens
 *
 * Keywords: your-component, theming, variants, interactive-states
 */

import { CORE_TOKENS } from "./core";

// Top-level constants for maintainability
const BASE_STYLES = "rounded-lg transition-all duration-200";
const INTERACTIVE_STATES =
  "hover:shadow-md active:scale-95 disabled:opacity-50";
const SPACING = `${CORE_TOKENS.spacing.md} ${CORE_TOKENS.spacing.lg}`;

export const YOUR_COMPONENT_TOKENS = {
  // Base component styles
  base: `${BASE_STYLES} ${SPACING}`,

  // Variants
  variants: {
    primary: `bg-primary text-primary-foreground ${INTERACTIVE_STATES}`,
    secondary: `bg-secondary text-secondary-foreground ${INTERACTIVE_STATES}`,
    outline: `border border-border bg-background text-foreground ${INTERACTIVE_STATES}`,
  },

  // Sizes
  sizes: {
    sm: `text-sm ${CORE_TOKENS.spacing.sm} ${CORE_TOKENS.spacing.md}`,
    md: `text-base ${CORE_TOKENS.spacing.md} ${CORE_TOKENS.spacing.lg}`,
    lg: `text-lg ${CORE_TOKENS.spacing.lg} ${CORE_TOKENS.spacing.xl}`,
  },

  // States
  states: {
    loading: "animate-pulse cursor-not-allowed",
    disabled: "opacity-50 cursor-not-allowed pointer-events-none",
    active: "ring-2 ring-primary ring-offset-2",
  },
} as const;

// Type-safe variant combinations
export type ComponentVariant = keyof typeof YOUR_COMPONENT_TOKENS.variants;
export type ComponentSize = keyof typeof YOUR_COMPONENT_TOKENS.sizes;
```

### Step 3: Add to Exports

```typescript
// In components/index.ts
export { YOUR_COMPONENT_TOKENS } from "./yourComponent";
export type { ComponentVariant, ComponentSize } from "./yourComponent";
```

### Step 4: Create Usage Example

```tsx
import { YOUR_COMPONENT_TOKENS } from "@/features/business-logic-modern/infrastructure/theming/components";

const YourComponent = ({
  variant = "primary",
  size = "md",
  disabled = false,
}) => (
  <button
    className={`
      ${YOUR_COMPONENT_TOKENS.base}
      ${YOUR_COMPONENT_TOKENS.variants[variant]}
      ${YOUR_COMPONENT_TOKENS.sizes[size]}
      ${disabled ? YOUR_COMPONENT_TOKENS.states.disabled : ""}
    `}
    disabled={disabled}
  >
    Your Component
  </button>
);
```

**✅ Result**: Comprehensive component theme with type safety and consistent styling

---

## 🐛 Workflow 5: Debugging Color Issues

**Use Case**: Colors don't look right or contrast validation is failing

### Step 1: Visual Inspection

```bash
# Generate fresh documentation
pnpm generate:docs

# Open visual preview
open documentation/tokens-preview.html
```

### Step 2: Use Development Tools

```javascript
// In browser console (development only)
showColorDebugger();

// Check specific component
debugColors("problematicComponent");

// Test all color combinations
glowUtils.testAll();
```

### Step 3: Check Validation Logs

```bash
# Run color validation with detailed output
pnpm validate:colors

# Check for specific failures
pnpm validate:colors | grep "FAIL"
```

### Step 4: Fix Common Issues

**Low Contrast:**

```json
{
  "node": {
    "problematic": {
      "bg": "200, 50%, 50%", // Too similar to text
      "text": "200, 50%, 60%" // Increase contrast
    }
  }
}
```

**Fixed:**

```json
{
  "node": {
    "problematic": {
      "bg": "200, 50%, 30%", // Darker background
      "text": "200, 50%, 90%" // Much lighter text
    }
  }
}
```

### Step 5: Validate Fix

```bash
pnpm validate:colors && pnpm generate:tokens
```

**✅ Result**: Fixed color issues with WCAG compliance

---

## 🔄 Workflow 6: Complete Development Cycle

**Use Case**: You're adding a new feature that needs both node categories and infrastructure components

### Step 1: Plan Your Changes

```typescript
// Document what you need
const designPlan = {
  nodeCategories: ["webhook", "scheduler"],
  infraComponents: ["timeline", "status-badge"],
  existingAdjustments: ["sidebar contrast", "button hover states"],
};
```

### Step 2: Batch Token Changes

```json
{
  "node": {
    "webhook": { "bg": "280, 70%, 45%", "text": "280, 70%, 95%" },
    "scheduler": { "bg": "320, 65%, 40%", "text": "320, 65%, 90%" }
  },
  "infra": {
    "timeline": { "bg": "0, 0%, 98%", "text": "0, 0%, 15%" },
    "status-badge": { "bg": "120, 100%, 95%", "text": "120, 100%, 20%" }
  }
}
```

### Step 3: Generate and Validate All

```bash
# Full validation pipeline
pnpm generate:tokens && pnpm validate:colors && pnpm generate:docs
```

### Step 4: Create Component Themes

```bash
# Create theme files for new components
code features/business-logic-modern/infrastructure/theming/components/timeline.ts
code features/business-logic-modern/infrastructure/theming/components/statusBadge.ts
```

### Step 5: Test Integration

```bash
# Run full build to catch any issues
pnpm build

# Check visual documentation
open documentation/tokens-preview.html
```

### Step 6: Commit Atomically

```bash
git add features/business-logic-modern/infrastructure/theming/tokens.json
git commit -m "feat: add webhook and scheduler node categories"

git add features/business-logic-modern/infrastructure/theming/components/
git commit -m "feat: add timeline and status-badge component themes"
```

**✅ Result**: Complete feature addition with systematic validation

---

## 🎯 Best Practices Summary

### **Token Management**

- Always edit `tokens.json` as the single source of truth
- Use HSL values for better color manipulation
- Run `pnpm validate:colors` before committing
- Keep token names semantic, not descriptive

### **Component Themes**

- Create top-level constants for maintainability
- Use TypeScript for type safety
- Follow the established naming patterns
- Document with JSDoc comments

### **Development Workflow**

- Use the visual debugger in development
- Generate documentation after changes
- Test both light and dark themes
- Validate WCAG compliance automatically

### **Performance Considerations**

- Tree-shakeable imports keep bundles small
- CSS generation is build-time, not runtime
- Component themes are statically analyzable
- No runtime color calculations

---

## 🚨 Troubleshooting Common Issues

### **"Colors don't match the design"**

1. Check `tokens.json` values
2. Run `pnpm generate:tokens`
3. Clear browser cache
4. Use color debugger to verify actual values

### **"WCAG validation failing"**

1. Check contrast ratios in `tokens-preview.html`
2. Adjust HSL lightness values
3. Use darker backgrounds with lighter text
4. Test with actual content, not just swatches

### **"Build failing after token changes"**

1. Run `pnpm generate:tokens` manually
2. Check for TypeScript errors in component themes
3. Verify all exports in `components/index.ts`
4. Clear Next.js cache: `rm -rf .next`

### **"Changes not visible in development"**

1. Restart development server
2. Check if CSS file was generated
3. Verify import paths in components
4. Use browser dev tools to inspect actual CSS

---

**🎨 Happy designing!** This workflow system scales from quick color tweaks to comprehensive design system overhauls while maintaining quality and consistency.
