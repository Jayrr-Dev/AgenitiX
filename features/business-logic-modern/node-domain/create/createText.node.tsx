/**
 * CREATETEXT NODE - CREATE category themed text creation node
 *
 * • Creates text content with direct inline editing
 * • Green theming for CREATE category consistency
 * • Simple textarea interface for immediate text input
 * • Schema-driven controls available in Node Inspector
 * • Clean, minimal UI focused on content creation
 *
 * Keywords: text-creation, inline-editing, create-category, green-theme
 */

import { useNodeData } from "@/hooks/useNodeData";
import type { NodeProps } from "@xyflow/react";
import { useState } from "react";
import { z } from "zod";

import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
import {
  SafeSchemas,
  createSafeInitialData,
} from "@/features/business-logic-modern/infrastructure/node-core/schema-helpers";
import {
  createNodeValidator,
  reportValidationError,
  useNodeDataValidation,
} from "@/features/business-logic-modern/infrastructure/node-core/validation";
import { withNodeScaffold } from "@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold";
import { CATEGORIES } from "@/features/business-logic-modern/infrastructure/theming/categories";
import {
  COLLAPSED_SIZES,
  EXPANDED_SIZES,
} from "@/features/business-logic-modern/infrastructure/theming/sizing";

// -- PLOP-INJECTED-IMPORTS --

/**
 * Simple data schema for createText node
 */
const CreateTextDataSchema = z
  .object({
    text: SafeSchemas.text("Default text"),
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
  })
  .strict();

type CreateTextData = z.infer<typeof CreateTextDataSchema>;

// Create enterprise validator
const validateNodeData = createNodeValidator(
  CreateTextDataSchema,
  "CreateText"
);

/**
 * Simple Node specification with schema-driven controls
 */
const spec: NodeSpec = {
  kind: "createText",
  displayName: "createText",
  category: CATEGORIES.CREATE,
  size: {
    expanded: EXPANDED_SIZES.FE1H,
    collapsed: COLLAPSED_SIZES.C1,
  },
  handles: [
    { id: "json-input", code: "j", position: "top", type: "target" },
    { id: "output", code: "s", position: "right", type: "source" },
    { id: "activate", code: "b", position: "left", type: "target" },
  ],
  inspector: {
    key: "CreateTextInspector",
  },
  initialData: createSafeInitialData(CreateTextDataSchema),
  dataSchema: CreateTextDataSchema,
};

/**
 * Category-specific background mapping
 */
const CATEGORY_BACKGROUNDS = {
  CREATE: "bg-[hsl(var(--node-create-bg))]",
  VIEW: "bg-[hsl(var(--node-view-bg))]",
  TRIGGER: "bg-[hsl(var(--node-trigger-bg))]",
  TEST: "bg-[hsl(var(--node-test-bg))]",
  CYCLE: "bg-[hsl(var(--node-cycle-bg))]",
} as const;

/**
 * Category-specific text color mapping
 */
const CATEGORY_TEXT_COLORS = {
  CREATE: {
    primary: "text-[hsl(var(--node-create-text))]",
    secondary: "text-[hsl(var(--node-create-text-secondary))]",
  },
  VIEW: {
    primary: "text-[hsl(var(--node-view-text))]",
    secondary: "text-[hsl(var(--node-view-text-secondary))]",
  },
  TRIGGER: {
    primary: "text-[hsl(var(--node-trigger-text))]",
    secondary: "text-[hsl(var(--node-trigger-text-secondary))]",
  },
  TEST: {
    primary: "text-[hsl(var(--node-test-text))]",
    secondary: "text-[hsl(var(--node-test-text-secondary))]",
  },
  CYCLE: {
    primary: "text-[hsl(var(--node-cycle-text))]",
    secondary: "text-[hsl(var(--node-cycle-text-secondary))]",
  },
} as const;

/**
 * Category-specific border color mapping
 */
const CATEGORY_BORDER_COLORS = {
  CREATE: {
    default: "border-[hsl(var(--node-create-border))]",
    hover: "hover:border-[hsl(var(--node-create-border-hover))]",
  },
  VIEW: {
    default: "border-[hsl(var(--node-view-border))]",
    hover: "hover:border-[hsl(var(--node-view-border-hover))]",
  },
  TRIGGER: {
    default: "border-[hsl(var(--node-trigger-border))]",
    hover: "hover:border-[hsl(var(--node-trigger-border-hover))]",
  },
  TEST: {
    default: "border-[hsl(var(--node-test-border))]",
    hover: "hover:border-[hsl(var(--node-test-border-hover))]",
  },
  CYCLE: {
    default: "border-[hsl(var(--node-cycle-border))]",
    hover: "hover:border-[hsl(var(--node-cycle-border-hover))]",
  },
} as const;

/**
 * Unified theming constants using semantic tokens
 * - Category-specific backgrounds for visual distinction
 * - Neutral borders for clean, consistent appearance
 * - Category-appropriate text colors for readability
 */
const UNIFIED_NODE_STYLES = {
  // Container styles with semantic tokens
  container: {
    base: "relative rounded-lg shadow-md border transition-all duration-200",
    // Background and border determined dynamically by category
    expanded: "",
    collapsed: "flex items-center justify-center",
  },

  // Content area styles
  content: {
    expanded: "p-4 pt-8 w-full h-full flex flex-col",
    collapsed: "flex items-center justify-center w-full h-full",
  },

  // Header styles
  header: {
    container: "flex items-center justify-between mb-3",
    // Title and health colors determined dynamically by category
  },

  // Main content styles
  main: {
    container: "flex-1 flex items-center justify-center",
    content: "text-center",
    icon: "text-2xl mb-2",
    // Text color determined dynamically by category
  },

  // Collapsed state styles
  collapsed: {
    icon: "text-2xl",
  },
} as const;

/**
 * createText Node Component
 *
 * Unified theming with category-specific backgrounds:
 * - CREATE category green background for visual distinction
 * - Neutral borders for clean, consistent appearance
 * - Category-appropriate text colors for readability
 * - Schema-driven controls available in Node Inspector
 * - Maintains enterprise validation and type safety
 */
const CreateTextNodeComponent = ({ data, id }: NodeProps) => {
  const [isExpanded, setExpanded] = useState(false);

  // Use proper React Flow data management
  const { nodeData, updateNodeData } = useNodeData(id, data);

  // Enterprise validation with comprehensive error handling
  const validationResult = validateNodeData(nodeData);
  const validatedData = validationResult.data;

  // Report validation errors for monitoring
  if (!validationResult.success) {
    reportValidationError("CreateText", id, validationResult.errors, {
      originalData: validationResult.originalData,
      component: "CreateTextNodeComponent",
    });
  }

  // Enterprise data validation hook for real-time updates
  const { getHealthScore } = useNodeDataValidation(
    CreateTextDataSchema,
    "CreateText",
    validatedData,
    id
  );

  const onToggle = () => setExpanded((prev) => !prev);

  // Handle text updates directly
  const handleTextChange = (newText: string) => {
    try {
      updateNodeData({ text: newText });
    } catch (error) {
      console.error("Failed to update CreateText node data:", error);
    }
  };

  // Use the spec.size for strict sizing
  const { expanded, collapsed } = spec.size;
  const nodeSize = isExpanded ? expanded : collapsed;
  const dims = nodeSize as { width: number | string; height: number | string };
  const width = typeof dims.width === "number" ? `${dims.width}px` : dims.width;
  const height =
    typeof dims.height === "number" ? `${dims.height}px` : dims.height;

  // Get category-specific styling
  const categoryKey = spec.category as keyof typeof CATEGORY_BACKGROUNDS;
  const categoryBackground =
    CATEGORY_BACKGROUNDS[categoryKey] || CATEGORY_BACKGROUNDS.CREATE;
  const categoryTextColors =
    CATEGORY_TEXT_COLORS[categoryKey] || CATEGORY_TEXT_COLORS.CREATE;
  const categoryBorderColors =
    CATEGORY_BORDER_COLORS[categoryKey] || CATEGORY_BORDER_COLORS.CREATE;

  // Combine unified styles with category-specific background and borders
  const containerClasses = [
    UNIFIED_NODE_STYLES.container.base,
    categoryBackground,
    categoryBorderColors.default,
    categoryBorderColors.hover,
    isExpanded
      ? UNIFIED_NODE_STYLES.container.expanded
      : UNIFIED_NODE_STYLES.container.collapsed,
  ].join(" ");

  return (
    <div
      className={containerClasses}
      style={{ width, height, minWidth: width, minHeight: height }}
      data-testid="create-text-node"
    >
      <ExpandCollapseButton showUI={isExpanded} onToggle={onToggle} size="sm" />

      {isExpanded ? (
        <div className={UNIFIED_NODE_STYLES.content.expanded}>
          <div className={UNIFIED_NODE_STYLES.header.container}>
            <h3
              className={`text-sm font-semibold ${categoryTextColors.primary}`}
            >
              createText
            </h3>
            {process.env.NODE_ENV === "development" && (
              <span className={`text-xs ${categoryTextColors.secondary}`}>
                Health: {getHealthScore()}%
              </span>
            )}
          </div>

          {/* Simple, clean textarea for direct text editing */}
          <textarea
            value={validatedData.text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Enter your text here..."
            className={`flex-1 w-full p-2 text-sm rounded-md resize-none transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${categoryTextColors.primary} bg-[hsl(var(--node-create-bg-hover))] ${categoryBorderColors.default.replace("border-", "border-")} ${categoryBorderColors.hover.replace("hover:border-", "hover:border-")}`}
            style={{
              minHeight: "60px",
              borderWidth: "1px",
              borderStyle: "solid",
            }}
          />
        </div>
      ) : (
        <div className={UNIFIED_NODE_STYLES.content.collapsed}>
          <span
            className={UNIFIED_NODE_STYLES.collapsed.icon}
            aria-label="Create Text Node"
          >
            📝
          </span>
        </div>
      )}
    </div>
  );
};

export default withNodeScaffold(spec, CreateTextNodeComponent);

// Export spec for registry access
export { spec };
