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
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
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
 * Original styling with CREATE category green theming:
 * - Clean interface focused on node-specific functionality
 * - Green accent colors for CREATE category consistency
 * - Schema-driven controls available in Node Inspector
 * - Maintains enterprise validation and type safety
 */
const CreateTextNodeComponent = ({ data, id }: NodeProps) => {
  const [isExpanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, resolvedTheme } = useTheme();

  // Debug theme switching
  useEffect(() => {
    setMounted(true);
    console.log(`🎨 [CreateText-${id}] Theme Debug:`, {
      theme,
      resolvedTheme,
      mounted,
      timestamp: new Date().toISOString(),
    });
  }, [theme, resolvedTheme, id, mounted]);

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

  // Prevent hydration mismatch by not rendering theme-dependent styles until mounted
  if (!mounted) {
    return (
      <div
        className="relative bg-gray-100 rounded-lg shadow-md border border-gray-300 transition-all duration-200 flex items-center justify-center"
        style={{ width, height, minWidth: width, minHeight: height }}
        data-testid="create-text-node"
      >
        <span className="text-2xl" aria-label="Create Text Node">
          📝
        </span>
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div
      className={`relative rounded-lg shadow-md transition-all duration-200 ${
        isDark
          ? "bg-neutral-900 border-green-700/50 hover:border-green-600/70"
          : "bg-white border-green-200/70 hover:border-green-300/80"
      } ${isExpanded ? "" : "flex items-center justify-center"}`}
      style={{
        width,
        height,
        minWidth: width,
        minHeight: height,
        borderWidth: "1px",
        borderStyle: "solid",
      }}
      data-testid="create-text-node"
    >
      <ExpandCollapseButton showUI={isExpanded} onToggle={onToggle} size="sm" />

      {isExpanded ? (
        <div className="p-4 pt-8 w-full h-full flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3
              className={`text-sm font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
            >
              createText
            </h3>
            {process.env.NODE_ENV === "development" && (
              <span
                className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
              >
                Health: {getHealthScore()}% | Theme: {resolvedTheme}
              </span>
            )}
          </div>

          {/* Simple, clean textarea for direct text editing with thin green accent */}
          <textarea
            value={validatedData.text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Enter your text here..."
            className={`flex-1 w-full p-2 text-sm rounded-md resize-none transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              isDark
                ? "bg-gray-800 text-gray-100 placeholder:text-gray-400 border-green-600/50 hover:border-green-500/70"
                : "bg-white text-gray-900 placeholder:text-gray-500 border-green-300/60 hover:border-green-400/80"
            }`}
            style={{
              minHeight: "60px",
              borderWidth: "1px",
              borderStyle: "solid",
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
