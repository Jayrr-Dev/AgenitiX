# 🔧 Design System API Reference

Complete API documentation for the modular design system.

## 📦 Core System API

### CORE_TOKENS

The foundation design tokens that never bloat.

```typescript
interface CoreTokens {
  spacing: {
    xs: string; // "0.25rem" (4px)
    sm: string; // "0.5rem" (8px)
    md: string; // "0.75rem" (12px)
    lg: string; // "1rem" (16px)
    xl: string; // "1.5rem" (24px)
    "2xl": string; // "2rem" (32px)
    "3xl": string; // "3rem" (48px)
  };

  typography: {
    sizes: {
      xs: string; // "0.75rem" (12px)
      sm: string; // "0.875rem" (14px)
      base: string; // "1rem" (16px)
      lg: string; // "1.125rem" (18px)
      xl: string; // "1.25rem" (20px)
      "2xl": string; // "1.5rem" (24px)
    };
    weights: {
      normal: string; // "400"
      medium: string; // "500"
      semibold: string; // "600"
      bold: string; // "700"
    };
    families: {
      sans: string; // "ui-sans-serif, system-ui, sans-serif"
      mono: string; // "ui-monospace, 'Cascadia Code', 'Fira Code', monospace"
    };
  };

  colors: {
    background: string; // "hsl(var(--background))"
    foreground: string; // "hsl(var(--foreground))"
    muted: string; // "hsl(var(--muted))"
    mutedForeground: string; // "hsl(var(--muted-foreground))"
    border: string; // "hsl(var(--border))"
    success: string; // "hsl(120 100% 40%)"
    warning: string; // "hsl(45 100% 50%)"
    error: string; // "hsl(0 100% 50%)"
    info: string; // "hsl(210 100% 50%)"
  };

  layout: {
    flex: string; // "flex"
    flexCol: string; // "flex flex-col"
    flexRow: string; // "flex flex-row"
    grid: string; // "grid"
    itemsCenter: string; // "items-center"
    justifyCenter: string; // "justify-center"
    justifyBetween: string; // "justify-between"
  };

  effects: {
    rounded: {
      none: string; // "rounded-none"
      sm: string; // "rounded-sm"
      md: string; // "rounded-md"
      lg: string; // "rounded-lg"
      full: string; // "rounded-full"
    };
    shadow: {
      sm: string; // "shadow-sm"
      md: string; // "shadow-md"
      lg: string; // "shadow-lg"
    };
    transition: string; // "transition-colors duration-200"
  };

  dimensions: {
    icon: {
      xs: string; // "w-3 h-3"
      sm: string; // "w-4 h-4"
      md: string; // "w-5 h-5"
      lg: string; // "w-6 h-6"
      xl: string; // "w-8 h-8"
    };
    button: {
      sm: string; // "px-2 py-1"
      md: string; // "px-3 py-2"
      lg: string; // "px-4 py-3"
    };
  };

  palette: {
    primary: { [key: string]: string };
    neutral: { [key: string]: string };
    semantic: {
      success: { light: string; dark: string };
      warning: { light: string; dark: string };
      error: { light: string; dark: string };
    };
  };

  elevation: {
    surface: { [key: string]: string };
    glow: { [key: string]: string };
  };
}
```

### getCoreToken()

Get a core token value with optional fallback.

```typescript
function getCoreToken(
  category: keyof typeof CORE_TOKENS,
  key: string,
  fallback?: string
): string;

// Examples
getCoreToken("spacing", "lg"); // "1rem"
getCoreToken("spacing", "invalid", "0"); // "0" (fallback)
getCoreToken("colors", "primary"); // "" (no fallback)
```

### combineTokens()

Combine multiple token values into a single string.

```typescript
function combineTokens(...tokens: (string | undefined)[]): string;

// Examples
combineTokens(
  CORE_TOKENS.layout.flexCol,
  CORE_TOKENS.spacing.lg,
  CORE_TOKENS.effects.rounded.md
); // "flex flex-col 1rem rounded-md"

combineTokens("p-4", undefined, "bg-white"); // "p-4 bg-white"
```

## 🧩 Component System API

### NodeInspector API

#### NODE_INSPECTOR_TOKENS

```typescript
interface NodeInspectorTokens {
  content: {
    labels: {
      nodeData: string; // "Node Data:"
      output: string; // "Output:"
      controls: string; // "Controls:"
      type: string; // "Type:"
      id: string; // "ID:"
    };
    tooltips: {
      unlockInspector: string; // "Unlock Inspector (Alt+A)"
      lockInspector: string; // "Lock Inspector (Alt+A)"
      lockInspectorDescription: string; // "Lock Inspector - Keep current view..."
      duplicateNode: string; // "Duplicate Node (Alt+W)"
      deleteNode: string; // "Delete Node (Alt+Q)"
    };
    aria: {
      unlockInspector: string; // "Unlock Inspector"
      lockInspector: string; // "Lock Inspector"
    };
    ids: {
      nodeInfoContainer: string; // "node-info-container"
      edgeInfoContainer: string; // "edge-info-container"
    };
  };

  behavior: {
    jsonAdaptiveHeight: boolean; // true
  };

  variants: {
    jsonContainer: {
      adaptive: string; // "flex flex-col w-full"
      fixed: string; // "flex-1 flex flex-col min-w-0 w-full"
      compact: string; // "flex flex-col w-full max-h-48"
    };
    jsonData: {
      adaptive: string; // Full styling for adaptive JSON display
      fixed: string; // Full styling for fixed height JSON display
      compact: string; // Full styling for compact JSON display
    };
  };

  // ... colors, layout, etc.
}
```

#### getNodeInspectorVariant()

```typescript
function getNodeInspectorVariant(
  category: keyof typeof NODE_INSPECTOR_TOKENS.variants,
  variant: string,
  fallback?: string
): string;

// Examples
getNodeInspectorVariant("jsonContainer", "adaptive");
// "flex flex-col w-full"

getNodeInspectorVariant("jsonData", "fixed");
// "bg-infra-inspector-data rounded-md border border-infra-inspector-data p-3 overflow-y-auto overflow-x-auto flex-1 min-w-0 w-full"
```

#### getConditionalNodeInspectorVariant()

```typescript
function getConditionalNodeInspectorVariant(
  category: keyof typeof NODE_INSPECTOR_TOKENS.variants,
  condition: boolean,
  trueVariant: string,
  falseVariant: string
): string;

// Examples
getConditionalNodeInspectorVariant(
  "jsonContainer",
  isAdaptive,
  "adaptive",
  "fixed"
);
// Returns "adaptive" variant if isAdaptive is true, "fixed" if false
```

#### nodeInspectorStyles

Pre-built styling utilities for common NodeInspector patterns.

```typescript
interface NodeInspectorStyles {
  // JSON container styling
  getJsonContainer(adaptive?: boolean): string;
  getJsonData(adaptive?: boolean): string;

  // Layout utilities
  getContainer(): string;
  getHeader(): string;
  getStateContainer(): string;
  getActionButtons(): string;

  // Color utilities
  getInspectorBackground(): string;
  getHeaderText(): string;
  getDataBackground(): string;

  // Action button styling
  getDuplicateButton(): string;
  getDeleteButton(): string;
}

// Examples
nodeInspectorStyles.getJsonContainer(true);
// "flex flex-col w-full"

nodeInspectorStyles.getDuplicateButton();
// "bg-infra-inspector-duplicate hover:bg-infra-inspector-duplicate-hover text-infra-inspector-duplicate border-infra-inspector-duplicate px-3 py-2 rounded-md transition-colors duration-200"
```

### Sidebar API

#### SIDEBAR_TOKENS

```typescript
interface SidebarTokens {
  content: {
    labels: {
      nodes: string; // "Nodes"
      tools: string; // "Tools"
      settings: string; // "Settings"
      help: string; // "Help"
    };
    tooltips: {
      addNode: string; // "Add Node (Ctrl+N)"
      toggleSidebar: string; // "Toggle Sidebar (Ctrl+B)"
      nodeLibrary: string; // "Node Library"
    };
    aria: {
      sidebar: string; // "Main Sidebar"
      nodeList: string; // "Available Nodes"
      toolList: string; // "Available Tools"
    };
  };

  behavior: {
    collapsible: boolean; // true
    autoHide: boolean; // false
    defaultWidth: string; // "280px"
    minWidth: string; // "240px"
    maxWidth: string; // "400px"
  };

  variants: {
    container: {
      expanded: string; // Full expanded sidebar styling
      collapsed: string; // Collapsed sidebar styling
      floating: string; // Floating sidebar styling
    };
    section: {
      default: string; // Default section styling
      compact: string; // Compact section styling
      spacious: string; // Spacious section styling
    };
    item: {
      default: string; // Default item styling
      compact: string; // Compact item styling
      large: string; // Large item styling
    };
  };

  // ... layout, colors, etc.
}
```

#### sidebarStyles

```typescript
interface SidebarStyles {
  // Container styling
  getContainer(isExpanded?: boolean): string;
  getSection(variant?: keyof SidebarTokens.variants.section): string;
  getItem(variant?: keyof SidebarTokens.variants.item): string;

  // Layout utilities
  getContainerLayout(): string;
  getHeaderLayout(): string;
  getContentLayout(): string;
  getFooterLayout(): string;

  // Color utilities
  getContainerColors(): string;
  getItemColors(isActive?: boolean): string;

  // Complete styling
  getCompleteItem(isActive?: boolean, variant?: string): string;
}
```

## 🎯 Node Integration API

### Node State Styling

```typescript
interface NodeStates {
  collapsed: {
    dimensions: string; // "w-15 h-15" (60x60px)
    content: string; // "minimal"
  };

  expanded: {
    dimensions: string; // "w-30 h-15" (120x60px) or "w-30 h-30" (120x120px)
    content: string; // "full"
  };

  selected: {
    glow: string; // "ring-2 ring-white ring-opacity-50"
    shadow: string; // "shadow-lg shadow-white/20"
  };

  activated: {
    glow: string; // "ring-2 ring-green-400 ring-opacity-50"
    shadow: string; // "shadow-lg shadow-green-400/20"
    background: string; // "bg-green-50 dark:bg-green-900/20"
  };

  error: {
    glow: string; // "ring-2 ring-red-400 ring-opacity-50"
    shadow: string; // "shadow-lg shadow-red-400/20"
    background: string; // "bg-red-50 dark:bg-red-900/20"
  };
}
```

### Node Categories

```typescript
interface NodeCategories {
  create: {
    background: string; // "bg-blue-500"
    text: string; // "text-white"
    border: string; // "border-blue-600"
  };

  count: {
    background: string; // "bg-purple-500"
    text: string; // "text-white"
    border: string; // "border-purple-600"
  };

  delay: {
    background: string; // "bg-orange-500"
    text: string; // "text-white"
    border: string; // "border-orange-600"
  };

  transform: {
    background: string; // "bg-green-500"
    text: string; // "text-white"
    border: string; // "border-green-600"
  };
}
```

## 📦 Import Patterns

### Tree-Shakeable Imports

```typescript
// ✅ Import only core tokens
import { CORE_TOKENS, combineTokens } from "@/theming";

// ✅ Import specific component
import { nodeInspectorStyles, NODE_INSPECTOR_TOKENS } from "@/theming";

// ✅ Import multiple components
import {
  nodeInspectorStyles,
  sidebarStyles,
  NODE_INSPECTOR_TOKENS,
  SIDEBAR_TOKENS,
} from "@/theming";

// ✅ Import convenience objects
import { componentStyles, componentTokens } from "@/theming";
```

## 🔍 TypeScript Support

### Type Definitions

```typescript
// Core types
type CoreSpacing = keyof typeof CORE_TOKENS.spacing;
type CoreTypographySize = keyof typeof CORE_TOKENS.typography.sizes;
type CoreColor = keyof typeof CORE_TOKENS.colors;
type CoreIconSize = keyof typeof CORE_TOKENS.dimensions.icon;

// Component types
type NodeInspectorVariant<
  T extends keyof typeof NODE_INSPECTOR_TOKENS.variants,
> = keyof (typeof NODE_INSPECTOR_TOKENS.variants)[T];

type SidebarVariant<T extends keyof typeof SIDEBAR_TOKENS.variants> =
  keyof (typeof SIDEBAR_TOKENS.variants)[T];

// Usage
const spacing: CoreSpacing = "lg";
const variant: NodeInspectorVariant<"jsonContainer"> = "adaptive";
```

### Type-Safe Usage

```typescript
// ✅ Type-safe token access
const spacing: CoreSpacing = "lg";
const iconSize: CoreIconSize = "md";

// ✅ Type-safe variant selection
const containerVariant: NodeInspectorVariant<"jsonContainer"> = "adaptive";

// ✅ Type-safe function calls
getCoreToken("spacing", spacing);
getNodeInspectorVariant("jsonContainer", containerVariant);
```

## 🚀 Performance Considerations

### Bundle Size Impact

```typescript
// Import analysis
import { CORE_TOKENS } from "@/theming"; // +2KB
import { nodeInspectorStyles } from "@/theming"; // +2KB
import { sidebarStyles } from "@/theming"; // +1.8KB
import { componentStyles } from "@/theming"; // +4KB (all components)

// vs Legacy
import { DESIGN_CONFIG } from "@/theming/designSystem"; // +50KB (everything)
```

### Runtime Performance

```typescript
// ✅ Memoize complex combinations
const complexStyle = useMemo(
  () =>
    combineTokens(
      CORE_TOKENS.layout.flexCol,
      CORE_TOKENS.spacing.lg,
      condition && CORE_TOKENS.effects.shadow.lg
    ),
  [condition]
);

// ✅ Conditional loading
const styles = useMemo(
  () => (isVisible ? nodeInspectorStyles : null),
  [isVisible]
);
```

---

## 📋 Quick Reference

### Most Common Patterns

```typescript
// Basic layout
combineTokens(CORE_TOKENS.layout.flexCol, CORE_TOKENS.spacing.md);

// Button styling
combineTokens(
  CORE_TOKENS.dimensions.button.md,
  CORE_TOKENS.effects.rounded.md,
  CORE_TOKENS.effects.transition
);

// JSON container
nodeInspectorStyles.getJsonContainer(true);

// Sidebar item
sidebarStyles.getCompleteItem(isActive, "default");

// Node state
combineTokens(NODE_STATES.selected.glow, NODE_CATEGORIES.create.background);
```
