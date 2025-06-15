/**
 * CREATETEXT NODE - Simple text creation node
 *
 * • Creates text content with direct inline editing
 * • Simple textarea interface for immediate text input
 * • Schema-driven controls available in Node Inspector
 * • Clean, minimal UI focused on content creation
 *
 * Keywords: text-creation, inline-editing, simple-interface
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
 * createText Node Component
 *
 * Simple UI with direct text editing:
 * - Clean textarea interface for immediate text input
 * - Schema-driven controls available in Node Inspector
 * - Maintains all enterprise validation and type safety
 * - Two visual states (collapsed/expanded)
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

  return (
    <div
      className={`relative bg-white dark:bg-neutral-900 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700 transition-all duration-200 ${
        isExpanded ? "" : "flex items-center justify-center"
      }`}
      style={{ width, height, minWidth: width, minHeight: height }}
      data-testid="create-text-node"
    >
      <ExpandCollapseButton showUI={isExpanded} onToggle={onToggle} size="sm" />

      {isExpanded ? (
        <div
          className="w-full h-full flex flex-col"
          style={{ padding: "32px 16px 16px 16px" }}
        >
          <div
            className="flex items-center justify-between"
            style={{ marginBottom: "12px" }}
          >
            <h3 className="text-sm font-semibold">createText</h3>
            {process.env.NODE_ENV === "development" && (
              <span className="text-xs text-gray-500">
                Health: {getHealthScore()}%
              </span>
            )}
          </div>

          {/* Simple, clean textarea for direct text editing */}
          <textarea
            value={validatedData.text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Enter your text here..."
            className="flex-1 w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     resize-none"
            style={{
              minHeight: "60px",
              padding: "8px",
            }}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-full">
          <span className="text-2xl" aria-label="Create Text Node">
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
