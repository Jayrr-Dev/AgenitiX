/**
 * AiTools NODE – Tool configuration for Ai agents
 *
 * • Provides tool selection and configuration for Ai agents
 * • Schema-driven with checkboxes for tool selection
 * • output Tools data type for Ai agent consumption
 * • Dynamic sizing and validation
 * • Auto-disables when no tools are selected
 *
 * Keywords: ai-tools, tool-configuration, schema-driven, type-safe
 */

import type { NodeProps } from "@xyflow/react";
import {
  type ChangeEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { z } from "zod";

import { Loading } from "@/components/Loading";
import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
import { generateoutputField } from "@/features/business-logic-modern/infrastructure/node-core/handleOutputUtils";
import { renderLucideIcon } from "@/features/business-logic-modern/infrastructure/node-core/iconUtils";
import {
  SafeSchemas,
  createSafeInitialData,
} from "@/features/business-logic-modern/infrastructure/node-core/schema-helpers";
import { useNodeFeatureFlag } from "@/features/business-logic-modern/infrastructure/node-core/useNodeFeatureFlag";
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
import {
  TOOL_DEFINITIONS,
  generateToolsConfig,
  getEnabledTools,
  getGridLayout,
  getIconSize,
} from "./tools";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const AiToolsDataSchema = z
  .object({
    // Tool Selection
    calculator: SafeSchemas.boolean(false),
    webSearch: SafeSchemas.boolean(false),

    // UI State
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    expandedSize: SafeSchemas.text("VE2"),
    collapsedSize: SafeSchemas.text("C2"),

    // output
    output: z.record(z.string(), z.any()).optional(), // handle-based output object for Convex compatibility

    // Optional label
    label: z.string().optional(),
  })
  .passthrough();

export type AiToolsData = z.infer<typeof AiToolsDataSchema>;

const validateNodeData = createNodeValidator(AiToolsDataSchema, "AiTools");

// -----------------------------------------------------------------------------
// 2️⃣  Constants
// -----------------------------------------------------------------------------

const CATEGORY_TEXT = {
  AI: {
    primary: "text-[--node--a-i-text]",
  },
} as const;

const CONTENT = {
  expanded: "p-4 w-full h-full flex flex-col",
  collapsed: "flex items-center justify-center w-full h-full",
  header: "flex items-center justify-between mb-3",
  body: "flex-1 flex flex-col gap-2",
  disabled:
    "opacity-75 bg-zinc-100 dark:bg-zinc-500 rounded-md transition-all duration-300",
} as const;

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

function createDynamicSpec(data: AiToolsData): NodeSpec {
  // Calculate number of enabled tools
  const enabledToolsCount = [data.calculator, data.webSearch].filter(
    Boolean
  ).length;

  // Dynamic collapsed size based on tool count
  let dynamicCollapsedSize: keyof typeof COLLAPSED_SIZES;
  if (enabledToolsCount === 0) {
    dynamicCollapsedSize = "C1"; // Default size when no tools
  } else if (enabledToolsCount === 1) {
    dynamicCollapsedSize = "C1"; // Compact for single tool
  } else if (enabledToolsCount === 2) {
    dynamicCollapsedSize = "C1W"; // Wide for two tools
  } else if (enabledToolsCount >= 3) {
    dynamicCollapsedSize = "C2"; // Large for 3+ tools
  } else {
    dynamicCollapsedSize = "C1"; // Fallback
  }

  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.VE2;
  const collapsed = COLLAPSED_SIZES[dynamicCollapsedSize] ?? COLLAPSED_SIZES.C1;

  return {
    kind: "aiTools",
    displayName: "Ai Tools",
    label: "Ai Tools",
    category: CATEGORIES.AI,
    size: { expanded, collapsed },
    handles: [
      {
        id: "tools-output",
        code: "t",
        position: "top",
        type: "source",
        dataType: "Tools",
      },
    ],
    inspector: { key: "AiToolsInspector" },
    version: 1,
    runtime: { execute: "aiTools_execute_v1" },
    initialData: createSafeInitialData(AiToolsDataSchema, {
      calculator: false,
      webSearch: false,
      output: {}, // handle-based output object
    }),
    dataSchema: AiToolsDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: ["isActive", "output", "expandedSize", "collapsedSize"],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        { key: "calculator", type: "boolean", label: "Calculator" },
        { key: "webSearch", type: "boolean", label: "Web Search" },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
      fieldGroups: [
        {
          title: "Available Tools",
          fields: ["calculator", "webSearch"],
          collapsible: false,
        },
      ],
    },
    icon: "LuWrench",
    author: "Agenitix Team",
    description: "Configure available tools for Ai agents",
    feature: "ai",
    tags: ["ai", "tools", "configuration"],
    featureFlag: {
      flag: "ai_tools_enabled",
      fallback: true,
      disabledMessage: "AI Tools are currently disabled",
      hideWhenDisabled: false,
    },
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE2",
  collapsedSize: "C1W",
} as AiToolsData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const AiToolsNode = memo(
  ({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
    // -------------------------------------------------------------------------
    // 4.1  Sync with React‑Flow store
    // -------------------------------------------------------------------------
    const { nodeData, updateNodeData } = useNodeData(id, data);

    // -------------------------------------------------------------------------
    // 4.2  Derived state
    // -------------------------------------------------------------------------
    const {
      isExpanded,
      isEnabled,
      isActive,
      calculator,
      webSearch,
      collapsedSize,
    } = nodeData as AiToolsData;

    // keep last emitted output to avoid redundant writes
    const lastGeneralOutputRef = useRef<any>(null);

    const categoryStyles = CATEGORY_TEXT.AI;

    // -------------------------------------------------------------------------
    // 4.3  Feature flag evaluation (after all hooks)
    // -------------------------------------------------------------------------
    const flagState = useNodeFeatureFlag(spec.featureFlag);

    // -------------------------------------------------------------------------
    // 4.4  Callbacks
    // -------------------------------------------------------------------------

    /** Toggle between collapsed / expanded */
    const toggleExpand = useCallback(() => {
      updateNodeData({ isExpanded: !isExpanded });
    }, [isExpanded, updateNodeData]);

    /** Generate tools configuration JSON using imported function */
    const generateToolsConfigData = useCallback(() => {
      return generateToolsConfig({ calculator, webSearch });
    }, [calculator, webSearch]);

    /** Handle tool checkbox changes */
    const handleToolToggle = useCallback(
      (toolName: keyof Pick<AiToolsData, "calculator" | "webSearch">) =>
        (e: ChangeEvent<HTMLInputElement>) => {
          updateNodeData({ [toolName]: e.target.checked });
        },
      [updateNodeData]
    );

    /** Memoized enabled tools list to prevent infinite loops */
    const enabledToolsList = useMemo(() => {
      return getEnabledTools({ calculator, webSearch });
    }, [calculator, webSearch]);

    // -------------------------------------------------------------------------
    // 4.5  Effects
    // -------------------------------------------------------------------------

    // Monitor tool selections and update active state
    useEffect(() => {
      const hasAnyToolSelected = calculator || webSearch;

      // If disabled, always set isActive to false
      if (isEnabled) {
        if (isActive !== hasAnyToolSelected) {
          updateNodeData({ isActive: hasAnyToolSelected });
        }
      } else if (isActive) updateNodeData({ isActive: false });
    }, [calculator, webSearch, isEnabled, isActive, updateNodeData]);

    /* 🔄 Handle-based output field generation for multi-handle compatibility */
    useEffect(() => {
      try {
        // Create a data object with proper handle field mapping, basically map tools config to output handle
        const toolsConfig = generateToolsConfig({ calculator, webSearch });
        const mappedData = {
          ...nodeData,
          output: isActive && isEnabled ? toolsConfig : "", // Map tools config to output handle
        };

        // Generate Map-based output with error handling
        const outputValue = generateoutputField(spec, mappedData as any);

        // Validate the result
        if (!(outputValue instanceof Map)) {
          console.error(
            `AiTools ${id}: generateoutputField did not return a Map`,
            outputValue
          );
          return;
        }

        // Convert Map to plain object for Convex compatibility, basically serialize for storage
        const outputObject = Object.fromEntries(outputValue.entries());

        // Only update if changed
        const currentoutput = lastGeneralOutputRef.current;
        let hasChanged = true;

        if (currentoutput instanceof Map && outputValue instanceof Map) {
          // Compare Map contents
          hasChanged =
            currentoutput.size !== outputValue.size ||
            !Array.from(outputValue.entries()).every(
              ([key, value]) => currentoutput.get(key) === value
            );
        }

        if (hasChanged) {
          lastGeneralOutputRef.current = outputValue;
          const toolsConfig = generateToolsConfig({ calculator, webSearch });
          updateNodeData({ output: isActive && isEnabled ? toolsConfig : "" });
        }
      } catch (error) {
        console.error(`AiTools ${id}: Error generating output`, error, {
          spec: spec?.kind,
          nodeDataKeys: Object.keys(nodeData || {}),
        });

        // Fallback: set empty string to prevent crashes, basically empty state for storage
        if (lastGeneralOutputRef.current !== null) {
          lastGeneralOutputRef.current = new Map();
          updateNodeData({ output: "" });
        }
      }
    }, [
      spec.handles,
      nodeData,
      calculator,
      webSearch,
      isActive,
      isEnabled,
      updateNodeData,
      id,
    ]);

    // -------------------------------------------------------------------------
    // 4.6  Validation
    // -------------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("AiTools", id, validation.errors, {
        originalData: validation.originalData,
        component: "AiToolsNode",
      });
    }

    useNodeDataValidation(AiToolsDataSchema, "AiTools", validation.data, id);

    // -------------------------------------------------------------------------
    // 4.7  Feature flag conditional rendering
    // -------------------------------------------------------------------------

    // If flag is loading, show loading state
    if (flagState.isLoading) {
      // For small collapsed sizes (C1), hide text and center better
      const isSmallNode = !isExpanded && spec.size.collapsed.width === 60;

      return (
        <Loading
          className={
            isSmallNode
              ? "flex items-center justify-center w-full h-full"
              : "p-4"
          }
          size={isSmallNode ? "w-6 h-6" : "w-8 h-8"}
          text={isSmallNode ? undefined : "Loading..."}
          showText={!isSmallNode}
        />
      );
    }

    // If flag is disabled and should hide, return null
    if (!flagState.isEnabled && flagState.hideWhenDisabled) {
      return null;
    }

    // If flag is disabled, show disabled message
    if (!flagState.isEnabled) {
      return (
        <div className="flex items-center justify-center p-4 text-sm text-muted-foreground border border-dashed border-muted-foreground/20 rounded-lg">
          {flagState.disabledMessage}
        </div>
      );
    }

    // -------------------------------------------------------------------------
    // 4.8  Render
    // -------------------------------------------------------------------------
    return (
      <>
        {/* Editable label or icon - hide labels when collapsed */}
        {isExpanded ? (
          // Show full label when expanded
          <LabelNode
            nodeId={id}
            label={(nodeData as AiToolsData).label || spec.displayName}
          />
        ) : // No icon or label when collapsed - show only tool icons
        null}

        {isExpanded ? (
          <div
            className={`${CONTENT.expanded} ${isEnabled ? "" : CONTENT.disabled}`}
          >
            <div className="flex flex-col gap-1">
              {Object.entries(TOOL_DEFINITIONS).map(([key, tool]) => {
                const isChecked = validation.data[
                  key as keyof typeof TOOL_DEFINITIONS
                ] as boolean;
                return (
                  <label
                    key={`aitools-${key}-${id}`}
                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-center w-5 h-5">
                      {isChecked ? (
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <div className="text-white">
                            {renderLucideIcon("LuCheck", "", 14)}
                          </div>
                        </div>
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={handleToolToggle(
                        key as keyof Pick<
                          AiToolsData,
                          "calculator" | "webSearch"
                        >
                      )}
                      disabled={!isEnabled}
                      className="sr-only"
                    />
                    <div className="text-primary">
                      {renderLucideIcon(tool.icon, "", 14)}
                    </div>
                    <div className="text-xs font-medium">{tool.name}</div>
                  </label>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            className={`${CONTENT.collapsed} ${isEnabled ? "" : CONTENT.disabled}`}
          >
            {(() => {
              const gridLayout = getGridLayout(enabledToolsList.length);
              const iconSize = getIconSize(enabledToolsList.length);

              if (enabledToolsList.length > 0) {
                // Show enabled tools in dynamic grid with proportional icon sizes
                return (
                  <div className={gridLayout}>
                    {enabledToolsList.map(({ key, tool }) => (
                      <div
                        key={key}
                        className="flex items-center justify-center text-primary"
                      >
                        {renderLucideIcon(tool.icon, "", iconSize)}
                      </div>
                    ))}
                  </div>
                );
              } else {
                // Show default state when no tools enabled
                return (
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <div className="mb-1">
                      {renderLucideIcon("LuWrench", "", 20)}
                    </div>
                    <div className="text-xs text-center">No Tools</div>
                  </div>
                );
              }
            })()}
          </div>
        )}

        <ExpandCollapseButton
          showUI={isExpanded}
          onToggle={toggleExpand}
          size="sm"
        />
      </>
    );
  }
);

// -----------------------------------------------------------------------------
// 5️⃣  High‑order wrapper – inject scaffold with dynamic spec
// -----------------------------------------------------------------------------

const AiToolsNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec when tool selections change (for dynamic sizing)
  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as AiToolsData),
    [
      (nodeData as AiToolsData).expandedSize,
      (nodeData as AiToolsData).calculator,
      (nodeData as AiToolsData).webSearch,
    ]
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <AiToolsNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
};

export default AiToolsNodeWithDynamicSpec;
