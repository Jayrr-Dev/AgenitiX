/**
 * CREATE TEXT NODE - Clean content-focused implementation
 *
 * • Focuses ONLY on content and layout - no structural styling
 * • withNodeScaffold handles all borders, sizing, theming, interactive states
 * • Schema-driven controls in Node Inspector
 * • Type-safe data validation with Zod schema
 * • Clean separation of concerns for maximum maintainability
 *
 * Keywords: create-text, content-focused, schema-driven, type-safe, clean-architecture
 */

import type { NodeProps } from "@xyflow/react";
import { z } from "zod";

import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
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
import { useNodeData } from "@/hooks/useNodeData";

/**
 * Data schema for CreateText node
 */
const CreateTextDataSchema = z
  .object({
    text: z.string().default(""),
    isActive: z.boolean().default(false),
    isExpanded: z.boolean().default(false),
    /**
     * Optional user-editable label shown above the node.
     * Not required by business logic, so keep it optional.
     */
    label: z.string().optional(),
    description: z.string().optional(),
  })
  .passthrough();

type CreateTextData = z.infer<typeof CreateTextDataSchema>;

// Create enterprise validator
const validateNodeData = createNodeValidator(
  CreateTextDataSchema,
  "CreateText"
);

/**
 * Node specification
 */
const spec: NodeSpec = {
  kind: "createText",
  displayName: "createText",
  category: CATEGORIES.CREATE,
  size: {
    expanded: EXPANDED_SIZES.VE2, // 120x'auto' for variable height content
    collapsed: COLLAPSED_SIZES.C1W, // 60x60 standard collapsed
  },
  handles: [
    { id: "json-input", code: "j", position: "top", type: "target" },
    { id: "output", code: "s", position: "right", type: "source" },
    { id: "activate", code: "b", position: "left", type: "target" },
  ],
  inspector: {
    key: "CreateTextInspector",
  },
  version: 1,
  runtime: {
    execute: "createText_execute_v1",
  },
  initialData: { text: "", isActive: false, isExpanded: false },
  dataSchema: CreateTextDataSchema,
};

/**
 * Content-focused styling constants
 * Only handles internal layout and content - no structural styling
 */
const CONTENT_STYLES = {
  // Content area layouts
  content: {
    expanded: "p-4 w-full h-full flex flex-col",
    collapsed: "flex items-center justify-center w-full h-full",
  },

  // Header layouts
  header: {
    container: "flex items-center justify-between mb-3",
  },

  // Main content layouts
  main: {
    container: "flex-1 flex items-center justify-center",
    content: "text-center",
    icon: "text-2xl mb-2",
  },

  // Collapsed state layouts
  collapsed: {
    icon: "text-2xl",
  },
} as const;

/**
 * Category-specific text colors from design system
 */
const CATEGORY_TEXT_COLORS = {
  CREATE: {
    primary: "text-[var(--node-create-text)]",
    secondary: "text-[var(--node-create-text-secondary)]",
  },
} as const;

/**
 * createText Node Component
 *
 * Clean content-focused component:
 * • withNodeScaffold handles ALL structural styling
 * • Component focuses ONLY on content and layout
 * • Uses design system tokens for text colors
 * • Schema-driven controls available in Node Inspector
 * • Maintains enterprise validation and type safety
 */
const CreateTextNodeComponent = ({ data, id }: NodeProps) => {
  // Use proper React Flow data management
  const { nodeData, updateNodeData } = useNodeData(id, data);

  // Get isExpanded directly from node data
  const isExpanded = (nodeData as CreateTextData).isExpanded || false;

  // Update expanded state via node data
  const handleToggleExpanded = () => {
    updateNodeData({ ...nodeData, isExpanded: !isExpanded });
  };

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

  // Handle text updates directly
  const handleTextChange = (newText: string) => {
    try {
      updateNodeData({ text: newText });
    } catch (error) {
      console.error("Failed to update CreateText node data:", error);
    }
  };

  // Get category-specific text colors
  const categoryTextColors = CATEGORY_TEXT_COLORS.CREATE;

  return (
    <>
      <ExpandCollapseButton
        showUI={isExpanded}
        onToggle={handleToggleExpanded}
        size="sm"
      />

      {isExpanded ? (
        <div className={CONTENT_STYLES.content.expanded}>
          <div className={CONTENT_STYLES.header.container}>
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
            className={`flex-1 w-full p-2 text-sm rounded-md resize-none transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${categoryTextColors.primary} bg-[var(--node-create-bg-hover)]`}
            style={{
              minHeight: "60px",
              border: "none", // Remove border - scaffold handles all borders
            }}
          />
        </div>
      ) : (
        <div className={CONTENT_STYLES.content.collapsed}>
          <span
            className={CONTENT_STYLES.collapsed.icon}
            aria-label="Create Text Node"
          >
            📝
          </span>
        </div>
      )}
    </>
  );
};

export default withNodeScaffold(spec, CreateTextNodeComponent);

// Export spec for registry access
export { spec };
