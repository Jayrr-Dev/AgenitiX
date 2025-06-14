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
 * Enterprise-grade data schema for createText node
 * Define your node's data structure with validation rules
 */
const CreateTextDataSchema = z
  .object({
    // Default schema with common fields - customize as needed:
    text: SafeSchemas.text("Default text"),
    isEnabled: SafeSchemas.boolean(true),
    // Indicates whether the node is active in the flow engine (used by scaffolding/theme)
    isActive: SafeSchemas.boolean(false),

    // Add your specific fields here using SafeSchemas:
    // number: SafeSchemas.number(0, 0, 100),
    // url: SafeSchemas.url(),
    // email: SafeSchemas.email(),
  })
  .strict(); // Prevents unexpected properties

type CreateTextData = z.infer<typeof CreateTextDataSchema>;

// Create enterprise validator
const validateNodeData = createNodeValidator(
  CreateTextDataSchema,
  "CreateText"
);

/**
 * Node specification with enterprise configuration
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
    // Standard JSON input for programmatic control
    { id: "json-input", code: "j", position: "top", type: "target" },

    // Primary output handle using TS symbol
    { id: "output", code: "s", position: "right", type: "source" },

    // Boolean control for activation (if needed)
    { id: "activate", code: "b", position: "left", type: "target" },
  ],
  inspector: {
    key: "CreateTextInspector",
  },
  initialData: createSafeInitialData(CreateTextDataSchema), // Auto-generated safe defaults
};

/**
 * createText Node Component
 *
 * Follows enterprise standards:
 * - Two visual states (collapsed/expanded)
 * - JSON input for programmatic control
 * - Type-safe data validation
 * - Error handling and reporting
 * - Metrics collection
 */
const CreateTextNodeComponent = ({ data, id }: NodeProps) => {
  const [isExpanded, setExpanded] = useState(false);

  // Enterprise validation with comprehensive error handling
  const validationResult = validateNodeData(data);
  const nodeData = validationResult.data;

  // Report validation errors for monitoring
  if (!validationResult.success) {
    reportValidationError("CreateText", id, validationResult.errors, {
      originalData: validationResult.originalData,
      component: "CreateTextNodeComponent",
    });
  }

  // Enterprise data validation hook for real-time updates
  const { updateData, getHealthScore } = useNodeDataValidation(
    CreateTextDataSchema,
    "CreateText",
    nodeData,
    id
  );

  const onToggle = () => setExpanded((prev) => !prev);

  // Handle data updates with validation
  const handleDataUpdate = (updates: Partial<CreateTextData>) => {
    try {
      const updatedData = updateData(updates);
      console.log(`CreateText node ${id} updated:`, updatedData);
      // TODO: Implement actual data persistence via React Flow store
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
      {/* Expand/Collapse Button - always top left */}

      <ExpandCollapseButton showUI={isExpanded} onToggle={onToggle} size="sm" />

      {isExpanded ? (
        <div className="p-4 pt-8 w-full h-full">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">createText</h3>
              {process.env.NODE_ENV === "development" && (
                <span className="text-xs text-gray-500 absolute top-2">
                  Health: {getHealthScore()}%
                </span>
              )}
            </div>

            {/* Default UI controls - customize as needed */}
            <div>
              <label className="text-xs font-semibold">Text</label>
              <input
                type="text"
                value={nodeData.text || ""}
                onChange={(e) => handleDataUpdate({ text: e.target.value })}
                className="w-full p-1 border rounded text-sm bg-white dark:bg-neutral-800 text-black dark:text-white border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter text..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={nodeData.isEnabled || false}
                onChange={(e) =>
                  handleDataUpdate({ isEnabled: e.target.checked })
                }
                className="rounded"
              />
              <label className="text-xs">Enabled</label>
            </div>

            {/* Example number input:
            <div>
              <label className="text-xs font-semibold">Number</label>
              <input
                type="number"
                value={nodeData.number || 0}
                onChange={(e) => handleDataUpdate({ number: Number(e.target.value) })}
                className="w-full p-1 border rounded text-sm"
              />
            </div>
            */}

            {/* Example checkbox:
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={nodeData.isEnabled || false}
                onChange={(e) => handleDataUpdate({ isEnabled: e.target.checked })}
                className="rounded"
              />
              <label className="text-xs">Enable feature</label>
            </div>
            */}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-full">
          {/* Collapsed state icon or minimal content */}
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
