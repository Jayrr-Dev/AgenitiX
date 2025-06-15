# 🎓 Design System Examples

Real-world examples showing how to use the modular design system effectively.

## 🚀 Basic Usage Examples

### Simple Component with Core Tokens

```typescript
import React from "react";
import { CORE_TOKENS, combineTokens } from "@/theming";

const SimpleCard = ({ title, children }) => {
  return (
    <div className={combineTokens(
      CORE_TOKENS.layout.flexCol,
      CORE_TOKENS.spacing.lg,
      CORE_TOKENS.effects.rounded.md,
      CORE_TOKENS.effects.shadow.sm,
      "bg-[hsl(var(--core-colors-background))] border border-[hsl(var(--core-colors-border))]"
    )}>
      <h3 className={combineTokens(
        CORE_TOKENS.typography.sizes.lg,
        CORE_TOKENS.typography.weights.semibold,
        "text-[hsl(var(--core-colors-foreground))]"
      )}>
        {title}
      </h3>
      <div className={CORE_TOKENS.spacing.md}>
        {children}
      </div>
    </div>
  );
};
```

### Component with Variants

```typescript
import React from "react";
import { CORE_TOKENS, combineTokens } from "@/theming";

interface ButtonProps {
  variant: "primary" | "secondary" | "danger";
  size: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant, size, children }) => {
  const baseStyles = combineTokens(
    CORE_TOKENS.layout.flex,
    CORE_TOKENS.layout.itemsCenter,
    CORE_TOKENS.layout.justifyCenter,
    CORE_TOKENS.effects.rounded.md,
    CORE_TOKENS.effects.transition,
    CORE_TOKENS.dimensions.button[size]
  );

  const variantStyles = {
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    danger: "bg-red-500 text-white hover:bg-red-600"
  };

  return (
    <button className={combineTokens(baseStyles, variantStyles[variant])}>
      {children}
    </button>
  );
};
```

## 🧩 Component-Specific Examples

### NodeInspector Usage

```typescript
import React from "react";
import {
  nodeInspectorStyles,
  NODE_INSPECTOR_TOKENS,
  CORE_TOKENS,
  combineTokens
} from "@/theming";

const CustomNodeInspector = ({ node, isLocked }) => {
  return (
    <div className={nodeInspectorStyles.getContainer()}>
      {/* Header */}
      <div className={nodeInspectorStyles.getHeader()}>
        <h2 className={CORE_TOKENS.typography.sizes.lg}>
          {NODE_INSPECTOR_TOKENS.content.labels.nodeData}
        </h2>

        <button
          className={combineTokens(
            CORE_TOKENS.dimensions.icon.md,
            CORE_TOKENS.effects.transition,
            isLocked ? "text-orange-500" : "text-gray-400"
          )}
          aria-label={NODE_INSPECTOR_TOKENS.content.aria.unlockInspector}
          title={NODE_INSPECTOR_TOKENS.content.tooltips.unlockInspector}
        >
          {isLocked ? "🔒" : "🔍"}
        </button>
      </div>

      {/* JSON Data */}
      <div className={nodeInspectorStyles.getJsonContainer(true)}>
        <div className={nodeInspectorStyles.getJsonData(true)}>
          <pre>{JSON.stringify(node.data, null, 2)}</pre>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={nodeInspectorStyles.getActionButtons()}>
        <button className={nodeInspectorStyles.getDuplicateButton()}>
          {NODE_INSPECTOR_TOKENS.content.tooltips.duplicateNode}
        </button>
        <button className={nodeInspectorStyles.getDeleteButton()}>
          {NODE_INSPECTOR_TOKENS.content.tooltips.deleteNode}
        </button>
      </div>
    </div>
  );
};
```

### Sidebar Usage

```typescript
import React from "react";
import {
  sidebarStyles,
  SIDEBAR_TOKENS,
  CORE_TOKENS,
  combineTokens
} from "@/theming";

const CustomSidebar = ({ isExpanded, items, activeItem }) => {
  return (
    <div className={sidebarStyles.getContainer(isExpanded)}>
      {/* Header */}
      <div className={sidebarStyles.getHeaderLayout()}>
        <h2 className={CORE_TOKENS.typography.sizes.lg}>
          {SIDEBAR_TOKENS.content.labels.nodes}
        </h2>
        <button
          className={CORE_TOKENS.dimensions.icon.sm}
          title={SIDEBAR_TOKENS.content.tooltips.toggleSidebar}
        >
          ☰
        </button>
      </div>

      {/* Content */}
      <div className={sidebarStyles.getContentLayout()}>
        {items.map((item) => (
          <div
            key={item.id}
            className={sidebarStyles.getCompleteItem(
              activeItem === item.id,
              "default"
            )}
          >
            <span className={CORE_TOKENS.dimensions.icon.sm}>
              {item.icon}
            </span>
            {isExpanded && (
              <span className={CORE_TOKENS.typography.sizes.sm}>
                {item.name}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 🎯 Node System Integration

### Node Component with States

```typescript
import React from "react";
import { CORE_TOKENS, combineTokens } from "@/theming";

interface NodeProps {
  node: {
    id: string;
    type: string;
    category: "create" | "count" | "delay" | "transform";
    data: any;
    isSelected: boolean;
    isActivated: boolean;
    isExpanded: boolean;
    hasError: boolean;
  };
}

const Node: React.FC<NodeProps> = ({ node }) => {
  // Base dimensions based on expanded state
  const baseDimensions = node.isExpanded
    ? "w-30 h-15" // 120x60px
    : "w-15 h-15"; // 60x60px

  // Category classes are now dynamic based on node.category
  const categoryClasses = `bg-node-${node.category.toLowerCase()} text-node-${node.category.toLowerCase()} border-node-${node.category.toLowerCase()}`;

  // State effects
  const stateEffects = combineTokens(
    node.isSelected && "ring-2 ring-white ring-opacity-50 shadow-lg shadow-white/20",
    node.isActivated && "ring-2 ring-green-400 ring-opacity-50 shadow-lg shadow-green-400/20",
    node.hasError && "ring-2 ring-red-400 ring-opacity-50 shadow-lg shadow-red-400/20"
  );

  return (
    <div
      className={combineTokens(
        baseDimensions,
        CORE_TOKENS.layout.flex,
        CORE_TOKENS.layout.flexCol,
        CORE_TOKENS.layout.itemsCenter,
        CORE_TOKENS.layout.justifyCenter,
        CORE_TOKENS.effects.rounded.md,
        CORE_TOKENS.effects.transition,
        categoryClasses,
        stateEffects,
        "border-2 cursor-pointer"
      )}
    >
      {/* Collapse/Expand Button */}
      <button
        className={combineTokens(
          "absolute top-1 left-1",
          CORE_TOKENS.dimensions.icon.xs,
          CORE_TOKENS.effects.rounded.sm,
          "bg-black bg-opacity-20 text-white hover:bg-opacity-40"
        )}
      >
        {node.isExpanded ? "−" : "+"}
      </button>

      {/* Node Content */}
      <div className={combineTokens(
        CORE_TOKENS.layout.flexCol,
        CORE_TOKENS.layout.itemsCenter,
        CORE_TOKENS.spacing.sm
      )}>
        <div className={CORE_TOKENS.typography.sizes.xl}>
          {getNodeIcon(node.type)}
        </div>

        {node.isExpanded && (
          <>
            <div className={combineTokens(
              CORE_TOKENS.typography.sizes.sm,
              CORE_TOKENS.typography.weights.semibold
            )}>
              {node.type}
            </div>
            <div className={CORE_TOKENS.typography.sizes.xs}>
              ID: {node.id.slice(0, 8)}
            </div>
          </>
        )}
      </div>

      {/* Status Indicators */}
      {node.isActivated && (
        <div className="absolute bottom-1 right-1 w-2 h-2 bg-green-400 rounded-full" />
      )}
      {node.hasError && (
        <div className="absolute bottom-1 right-1 w-2 h-2 bg-red-400 rounded-full" />
      )}
    </div>
  );
};

const getNodeIcon = (type: string) => {
  const icons = {
    create: "➕",
    count: "🔢",
    delay: "⏱️",
    transform: "🔄"
  };
  return icons[type] || "📦";
};
```

### Flow Canvas with Node Integration

```typescript
import React from "react";
import { CORE_TOKENS, combineTokens } from "@/theming";

const FlowCanvas = ({ nodes, edges, selectedNode }) => {
  return (
    <div className={combineTokens(
      "relative w-full h-full overflow-hidden",
      CORE_TOKENS.colors.background,
      "bg-gray-50"
    )}>
      {/* Grid Background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px"
        }}
      />

      {/* Nodes */}
      {nodes.map((node) => (
        <div
          key={node.id}
          className="absolute"
          style={{
            left: node.position.x,
            top: node.position.y,
            transform: "translate(-50%, -50%)"
          }}
        >
          <Node node={node} />
        </div>
      ))}

      {/* Edges */}
      <svg className="absolute inset-0 pointer-events-none">
        {edges.map((edge) => (
          <line
            key={edge.id}
            x1={edge.source.x}
            y1={edge.source.y}
            x2={edge.target.x}
            y2={edge.target.y}
            stroke="rgba(0,0,0,0.3)"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
          />
        ))}

        {/* Arrow marker */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="rgba(0,0,0,0.3)"
            />
          </marker>
        </defs>
      </svg>
    </div>
  );
};
```

## 🔧 Advanced Patterns

### Responsive Design with Tokens

```typescript
import React from "react";
import { CORE_TOKENS, combineTokens } from "@/theming";

const ResponsiveLayout = ({ children }) => {
  return (
    <div className={combineTokens(
      CORE_TOKENS.layout.grid,
      "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      CORE_TOKENS.spacing.lg,
      "gap-4 md:gap-6 lg:gap-8"
    )}>
      {children}
    </div>
  );
};
```

### Performance-Optimized Components

```typescript
import React, { useMemo } from "react";
import { CORE_TOKENS, combineTokens } from "@/theming";

const OptimizedComponent = ({ variant, size, isActive, children }) => {
  // Memoize complex style combinations
  const containerStyles = useMemo(() => combineTokens(
    CORE_TOKENS.layout.flex,
    CORE_TOKENS.layout.itemsCenter,
    CORE_TOKENS.effects.transition,
    CORE_TOKENS.dimensions.button[size],
    variant === "primary" && "bg-blue-500 text-white",
    variant === "secondary" && "bg-gray-200 text-gray-800",
    isActive && CORE_TOKENS.effects.shadow.lg
  ), [variant, size, isActive]);

  return (
    <div className={containerStyles}>
      {children}
    </div>
  );
};
```

## 🎨 Custom Component Creation

### Creating a New Component Design

```typescript
// 1. Create component-specific tokens
// theming/components/customComponent.ts

import { CORE_TOKENS, combineTokens } from "../core/tokens";

export const CUSTOM_COMPONENT_TOKENS = {
  content: {
    labels: {
      title: "Custom Component",
      subtitle: "Subtitle here",
    },
    tooltips: {
      action: "Perform action",
    },
  },

  variants: {
    container: {
      default: combineTokens(
        CORE_TOKENS.layout.flexCol,
        CORE_TOKENS.spacing.md
      ),
      compact: combineTokens(
        CORE_TOKENS.layout.flexCol,
        CORE_TOKENS.spacing.sm
      ),
      spacious: combineTokens(
        CORE_TOKENS.layout.flexCol,
        CORE_TOKENS.spacing.xl
      ),
    },
  },

  colors: {
    primary: "bg-indigo-500 text-white",
    secondary: "bg-gray-100 text-gray-800",
  },
};

export const customComponentStyles = {
  getContainer: (variant = "default") =>
    CUSTOM_COMPONENT_TOKENS.variants.container[variant],

  getPrimaryButton: () =>
    combineTokens(
      CORE_TOKENS.dimensions.button.md,
      CORE_TOKENS.effects.rounded.md,
      CUSTOM_COMPONENT_TOKENS.colors.primary
    ),
};
```

```typescript
// 2. Use in component
// components/CustomComponent.tsx

import React from "react";
import { customComponentStyles, CUSTOM_COMPONENT_TOKENS } from "@/theming";

const CustomComponent = ({ variant = "default" }) => {
  return (
    <div className={customComponentStyles.getContainer(variant)}>
      <h2>{CUSTOM_COMPONENT_TOKENS.content.labels.title}</h2>
      <p>{CUSTOM_COMPONENT_TOKENS.content.labels.subtitle}</p>
      <button className={customComponentStyles.getPrimaryButton()}>
        {CUSTOM_COMPONENT_TOKENS.content.tooltips.action}
      </button>
    </div>
  );
};
```

## 📊 Real-World Integration

### Complete Application Layout

```typescript
import React from "react";
import {
  CORE_TOKENS,
  combineTokens,
  nodeInspectorStyles,
  sidebarStyles
} from "@/theming";

const AppLayout = ({
  sidebarExpanded,
  selectedNode,
  inspectorLocked,
  children
}) => {
  return (
    <div className={combineTokens(
      CORE_TOKENS.layout.flex,
      "h-screen w-screen overflow-hidden"
    )}>
      {/* Sidebar */}
      <aside className={sidebarStyles.getContainer(sidebarExpanded)}>
        <CustomSidebar isExpanded={sidebarExpanded} />
      </aside>

      {/* Main Content */}
      <main className={combineTokens(
        CORE_TOKENS.layout.flex,
        CORE_TOKENS.layout.flexCol,
        "flex-1 overflow-hidden"
      )}>
        {/* Toolbar */}
        <header className={combineTokens(
          CORE_TOKENS.layout.flex,
          CORE_TOKENS.layout.itemsCenter,
          CORE_TOKENS.layout.justifyBetween,
          CORE_TOKENS.spacing.lg,
          "border-b bg-white"
        )}>
          <h1 className={CORE_TOKENS.typography.sizes.xl}>Flow Editor</h1>
          <div className={CORE_TOKENS.layout.flex}>
            {/* Toolbar buttons */}
          </div>
        </header>

        {/* Canvas Area */}
        <div className={combineTokens(
          CORE_TOKENS.layout.flex,
          "flex-1 overflow-hidden"
        )}>
          {/* Flow Canvas */}
          <div className="flex-1">
            {children}
          </div>

          {/* Node Inspector */}
          {selectedNode && (
            <aside className={combineTokens(
              nodeInspectorStyles.getContainer(),
              "w-80 border-l"
            )}>
              <CustomNodeInspector
                node={selectedNode}
                isLocked={inspectorLocked}
              />
            </aside>
          )}
        </div>
      </main>
    </div>
  );
};
```

This comprehensive example system shows how the modular design system scales from simple components to complex applications while maintaining consistency and performance! 🚀
