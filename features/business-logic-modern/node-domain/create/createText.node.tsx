/**
 * CREATETEXT NODE - Enhanced with Schema-Driven Controls
 *
 * • Demonstrates the new schema-driven control system
 * • Uses enhanced NodeSpec with dataSchema and controls configuration
 * • Automatically generates controls from Zod schema introspection
 * • Supports custom field configurations and validation
 * • Serves as reference implementation for 400+ node scalability
 *
 * Keywords: schema-driven, automatic-controls, reference-implementation, scalable-architecture
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
 * Enterprise-grade data schema for createText node
 * Define your node's data structure with validation rules
 */
const CreateTextDataSchema = z
  .object({
    // Enhanced schema with better field definitions for automatic control generation
    text: SafeSchemas.text("Default text"),
    isEnabled: SafeSchemas.boolean(true),
    // Indicates whether the node is active in the flow engine (used by scaffolding/theme)
    isActive: SafeSchemas.boolean(false),

    // Example of additional fields that would generate different control types
    // priority: SafeSchemas.enum(['low', 'medium', 'high'], 'medium'),
    // maxLength: SafeSchemas.number(100, 1, 1000),
    // description: SafeSchemas.optionalText(),
    // outputFormat: SafeSchemas.enum(['plain', 'markdown', 'html'], 'plain'),
  })
  .strict(); // Prevents unexpected properties

type CreateTextData = z.infer<typeof CreateTextDataSchema>;

// Create enterprise validator
const validateNodeData = createNodeValidator(
  CreateTextDataSchema,
  "CreateText"
);

/**
 * Enhanced Node specification with schema-driven controls
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

  // NEW: Schema reference for automatic control generation
  dataSchema: CreateTextDataSchema,

  // NEW: Control configuration for enhanced UX
  controls: {
    autoGenerate: true, // Enable schema-driven control generation
    excludeFields: ["isActive"], // System fields excluded from controls
    customFields: [
      // Custom configuration for the text field
      {
        key: "text",
        type: "textarea",
        label: "Text Output",
        placeholder: "Enter the text this node will output...",
        description:
          "This text will be passed to connected nodes when activated.",
        required: true,
        ui: {
          rows: 3,
        },
      },
      // Custom configuration for the enabled field
      {
        key: "isEnabled",
        type: "boolean",
        label: "Node Enabled",
        description:
          "When disabled, this node will not process or output data.",
      },
    ],
    fieldGroups: [
      {
        title: "Output Configuration",
        fields: ["text"],
        collapsible: false,
      },
      {
        title: "Node Settings",
        fields: ["isEnabled"],
        collapsible: true,
      },
    ],
  },
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
 * - Schema-driven controls (automatic generation)
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

  // Handle data updates with proper React Flow integration
  const handleDataUpdate = (updates: Partial<CreateTextData>) => {
    try {
      updateNodeData(updates);
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

            {/* Simplified UI - controls are now handled by Node Inspector */}
            <div className="text-xs text-gray-500 italic">
              Configure this node using the Node Inspector panel →
            </div>

            {/* Show current values for reference */}
            <div className="space-y-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-xs font-medium">Current Configuration:</div>
              <div className="text-xs">
                <div>Text: "{validatedData.text}"</div>
                <div>Enabled: {validatedData.isEnabled ? "Yes" : "No"}</div>
              </div>
            </div>
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
