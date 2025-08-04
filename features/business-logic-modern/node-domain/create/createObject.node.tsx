/**
 * CreateObject Node - JSON object creation with schema validation
 *
 * Creates and validates JSON objects with real-time editing and type safety.
 * Supports dynamic sizing, input connections, and automatic validation.
 *
 * @example
 * <CreateObjectNode
 *   id="node-123"
 *   data={{ store: '{"key": "value"}' }}
 * />
 */

import Editor from "@monaco-editor/react";
import type { NodeProps } from "@xyflow/react";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { z } from "zod";

import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
import { findEdgeByHandle } from "@/features/business-logic-modern/infrastructure/flow-engine/utils/edgeUtils";
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
import { renderLucideIcon } from "@/features/business-logic-modern/infrastructure/node-core/iconUtils";
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
import { useNodeData } from "@/hooks/useNodeData";
import { useNodeToast } from "@/hooks/useNodeToast";
import { useStore } from "@xyflow/react";

// Schema & Types
export const CreateObjectDataSchema = z
  .object({
    store: z.string().default("{}"),
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    inputs: SafeSchemas.optionalText().nullable().default(null),
    output: SafeSchemas.optionalText(),
    expandedSize: SafeSchemas.text("VE2"),
    collapsedSize: SafeSchemas.text("C1W"),
    label: z.string().optional(),
  })
  .passthrough();

export type CreateObjectData = z.infer<typeof CreateObjectDataSchema>;

const validateNodeData = createNodeValidator(
  CreateObjectDataSchema,
  "CreateObject"
);

// Constants
const CATEGORY_TEXT = {
  CREATE: {
    primary: "text-[--node-create-text]",
  },
} as const;

const CONTENT = {
  expanded: "p-4 w-full h-full flex flex-col",
  collapsed: "flex items-center justify-center w-full h-full",
  disabled:
    "opacity-75 bg-zinc-100 dark:bg-zinc-500 rounded-md transition-all duration-300",
} as const;

// Performance constants
const JSON_PARSE_TIMEOUT = 100; // ms
const DEBOUNCE_DELAY = 150; // ms

// Dynamic spec factory (memoized for performance)
const createDynamicSpec = (() => {
  const specCache = new Map<string, NodeSpec>();

  return (data: CreateObjectData): NodeSpec => {
    const cacheKey = `${data.expandedSize}-${data.collapsedSize}`;

    if (specCache.has(cacheKey)) {
      const cachedSpec = specCache.get(cacheKey);
      if (cachedSpec) {
        return cachedSpec;
      }
    }

    const expanded =
      EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
      EXPANDED_SIZES.VE2;
    const collapsed =
      COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
      COLLAPSED_SIZES.C1W;

    const spec: NodeSpec = {
      kind: "createObject",
      displayName: "Create Object",
      label: "Create Object",
      category: CATEGORIES.CREATE,
      size: { expanded, collapsed },
      handles: [
        {
          id: "output",
          code: "j",
          position: "right",
          type: "source",
          dataType: "JSON",
        },
        {
          id: "input",
          code: "b",
          position: "left",
          type: "target",
          dataType: "Boolean",
        },
      ],
      inspector: { key: "CreateObjectInspector" },
      version: 1,
      runtime: { execute: "createObject_execute_v1" },
      initialData: createSafeInitialData(CreateObjectDataSchema, {
        store: "{}",
        inputs: null,
        output: "",
        isEnabled: true, // Enable node by default
        isActive: false, // Will become active when enabled
        isExpanded: false, // Default to collapsed
      }),
      dataSchema: CreateObjectDataSchema,
      controls: {
        autoGenerate: true,
        excludeFields: [
          "isActive",
          "inputs",
          "output",
          "expandedSize",
          "collapsedSize",
        ],
        customFields: [
          { key: "isEnabled", type: "boolean", label: "Enable" },
          {
            key: "store",
            type: "textarea",
            label: "Store",
            placeholder: "Enter JSON Object",
            ui: { rows: 4 },
          },
          { key: "isExpanded", type: "boolean", label: "Expand" },
        ],
      },
      icon: "LuBraces",
      author: "Agenitix Team",
      description:
        "Creates JSON objects with customizable structure and validation",
      feature: "base",
      tags: ["content", "json", "object"],
      theming: {},
    };

    specCache.set(cacheKey, spec);
    return spec;
  };
})();

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE2",
  collapsedSize: "C1W",
} as CreateObjectData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const CreateObjectNode = memo(
  ({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
    // State management
    const { nodeData, updateNodeData } = useNodeData(id, data);
    const { showSuccess, showError, showWarning, showInfo } = useNodeToast(id);

    // Optimized state extraction - only re-compute when nodeData changes
    const { isExpanded, isEnabled, isActive, store } = useMemo(() => {
      const typedData = nodeData as CreateObjectData;
      return {
        isExpanded: typedData.isExpanded,
        isEnabled: typedData.isEnabled,
        isActive: typedData.isActive,
        store: typedData.store,
      };
    }, [nodeData]);

    // Optimized store selectors - only subscribe to what we need
    const nodes = useStore(useCallback((s) => s.nodes, []));
    const edges = useStore(useCallback((s) => s.edges, []));

    // Refs for performance
    const lastOutputRef = useRef<string | null>(null);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const editorRef = useRef<any>(null);

    // JSON validity check
    const isJsonValid = useMemo(() => {
      if (!store || store.trim() === "") return true; // Empty is considered valid
      try {
        JSON.parse(store);
        return true;
      } catch {
        return false;
      }
    }, [store]);

    // Optimized callbacks
    const toggleExpand = useCallback(() => {
      updateNodeData({ isExpanded: !isExpanded });
    }, [isExpanded, updateNodeData]);

    // Debounced JSON parsing for better performance
    const parseJsonSafely = useCallback(
      (value: string, showToast = false) => {
        try {
          const parsed = JSON.parse(value);
          if (showToast) {
            showSuccess("Valid JSON", "Object parsed successfully");
          }
          return parsed;
        } catch (error) {
          if (showToast) {
            showError(
              "Invalid JSON",
              error instanceof Error ? error.message : "Failed to parse JSON"
            );
          }
          return value;
        }
      },
      [showSuccess, showError]
    );

    const propagate = useCallback(
      (value: string) => {
        if (!(isActive && isEnabled)) return;

        const parsed = parseJsonSafely(value, false); // Don't show toast immediately, basically silent parsing
        const serialized = JSON.stringify(parsed);

        if (serialized !== JSON.stringify(lastOutputRef.current)) {
          lastOutputRef.current = parsed;
          updateNodeData({ output: parsed });
        }
      },
      [isActive, isEnabled, updateNodeData, parseJsonSafely]
    );

    const blockJsonWhenInactive = useCallback(() => {
      if (!(isActive && isEnabled)) {
        updateNodeData({
          json: null,
          data: null,
          payload: null,
          result: null,
          response: null,
        });
      }
    }, [isActive, isEnabled, updateNodeData]);

    // Optimized input computation with memoization
    const computeInput = useCallback((): string | null => {
      const jsonInputEdge = findEdgeByHandle(edges, id, "json-input");
      const inputEdge = findEdgeByHandle(edges, id, "input");
      const incoming = jsonInputEdge || inputEdge;

      if (!incoming) return null;

      const src = nodes.find((n) => n.id === incoming.source);
      if (!src) return null;

      const inputValue = src.data?.output ?? src.data?.store ?? src.data;
      return typeof inputValue === "string"
        ? inputValue
        : JSON.stringify(inputValue || {});
    }, [edges, nodes, id]);

    // Monaco Editor change handler
    const handleEditorChange = useCallback(
      (value: string | undefined) => {
        const newValue = value || "";

        // Clear existing timeout
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }

        // Immediate UI update
        updateNodeData({ store: newValue });

        // Debounced validation and propagation
        debounceTimeoutRef.current = setTimeout(() => {
          propagate(newValue === "{}" ? "{}" : newValue);
        }, DEBOUNCE_DELAY);
      },
      [updateNodeData, propagate]
    );

    // Monaco Editor blur handler
    const handleEditorBlur = useCallback(() => {
      // Get the current value directly from the editor to avoid stale state
      const currentValue = editorRef.current?.getValue() || store;
      // Show validation toast when editor loses focus, basically feedback on blur
      parseJsonSafely(currentValue, true);
    }, [parseJsonSafely, store]);

    // Monaco Editor mount handler
    const handleEditorDidMount = useCallback(
      (editor: any, monaco: any) => {
        editorRef.current = editor;

        // Configure JSON validation and formatting
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
          validate: true,
          allowComments: false,
          schemas: [],
          enableSchemaRequest: false,
        });

        // Add blur event listener for toast validation
        editor.onDidBlurEditorText(() => {
          handleEditorBlur();
        });

        // Fix tooltip positioning and styling
        setTimeout(() => {
          const editorElement = editor.getDomNode();
          if (editorElement) {
            // Ensure the editor container has proper positioning context
            editorElement.style.position = "relative";
            editorElement.style.zIndex = "9999";

            // Add custom CSS for tooltip styling
            const style = document.createElement("style");
            style.textContent = `
          .monaco-hover {
            position: fixed !important;
            font-size: 10px !important;
            line-height: 1.3 !important;
          }
          .monaco-hover .hover-contents {
            font-size: 10px !important;
            padding: 4px 6px !important;
          }
          .monaco-hover .monaco-editor-hover {
            font-size: 10px !important;
            max-width: 300px !important;
          }
          .monaco-hover .hover-row {
            font-size: 10px !important;
          }
        `;
            document.head.appendChild(style);

            // Find and adjust existing tooltip containers
            const tooltipContainers =
              document.querySelectorAll(".monaco-hover");
            tooltipContainers.forEach((container) => {
              const htmlContainer = container as HTMLElement;
              htmlContainer.style.position = "fixed";
              htmlContainer.style.fontSize = "10px";
            });
          }
        }, 100);
      },
      [handleEditorBlur]
    );

    // Optimized effects with proper dependencies
    useEffect(() => {
      const inputVal = computeInput();
      const currentInputs = (nodeData as CreateObjectData).inputs;

      if (inputVal !== currentInputs) {
        updateNodeData({ inputs: inputVal });
      }
    }, [computeInput, nodeData, updateNodeData]);

    useEffect(() => {
      const currentInputs = (nodeData as CreateObjectData).inputs;

      if (currentInputs !== null) {
        const nextEnabled = Boolean(currentInputs?.trim());
        if (nextEnabled !== isEnabled) {
          updateNodeData({ isEnabled: nextEnabled });
          if (nextEnabled) {
            showInfo("Node enabled", "Input connection detected");
          } else {
            showWarning("Node disabled", "No input connection");
          }
        }
      }
    }, [nodeData, isEnabled, updateNodeData, showInfo, showWarning]);

    useEffect(() => {
      const currentStore = store ?? "";
      const hasValidStore =
        currentStore.trim().length > 0 && currentStore !== "{}";
      const shouldBeActive = isEnabled && hasValidStore;

      if (isActive !== shouldBeActive) {
        updateNodeData({ isActive: shouldBeActive });
      }
    }, [store, isEnabled, isActive, updateNodeData]);

    useEffect(() => {
      const currentStore = store ?? "";
      const actualContent = currentStore === "{}" ? "{}" : currentStore;

      if (isActive && isEnabled) {
        propagate(actualContent);
      } else {
        blockJsonWhenInactive();
      }
    }, [isActive, isEnabled, store, propagate, blockJsonWhenInactive]);

    // Cleanup debounce timeout on unmount
    useEffect(() => {
      return () => {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
      };
    }, []);

    // Validation (memoized for performance)
    const validation = useMemo(() => validateNodeData(nodeData), [nodeData]);

    if (!validation.success) {
      reportValidationError("CreateObject", id, validation.errors, {
        originalData: validation.originalData,
        component: "CreateObjectNode",
      });
    }

    useNodeDataValidation(
      CreateObjectDataSchema,
      "CreateObject",
      validation.data,
      id
    );

    // Cleanup timeout on unmount to prevent memory leaks
    useEffect(() => {
      return () => {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
      };
    }, []);

    // Memoized styles and values
    const categoryStyles = useMemo(() => CATEGORY_TEXT.CREATE, []);
    const displayValue = useMemo(
      () => (store === "{}" ? "" : (store ?? "")),
      [store]
    );

    // Count keys in the JSON object for collapsed mode display
    const objectKeyCount = useMemo(() => {
      try {
        if (!store || store === "{}") return 0;
        const parsed = JSON.parse(store);
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          !Array.isArray(parsed)
        ) {
          return Object.keys(parsed).length;
        }
        return 0;
      } catch {
        return 0;
      }
    }, [store]);

    // Validation status and parameter count display for collapsed view
    const CollapsedEditor = useMemo(
      () => (
        <div className="flex flex-col items-center justify-center w-full h-full text-center">
          {/* Parameter Count */}
          <div className="text-[10px] text-gray-700 dark:text-gray-300 pt-2">
            Params : {objectKeyCount}
          </div>
          {/* Validation Status */}
          <div
            className={`text-[10px] font-medium ${isJsonValid ? "text-green-600" : "text-red-600"}`}
          >
            {isJsonValid ? "Valid" : "Invalid"}
          </div>
        </div>
      ),
      [isJsonValid, objectKeyCount]
    );

    // Optimized Monaco Editor for expanded view
    const ExpandedEditor = useMemo(
      () => (
        <div
          className={`nowheel h-32 min-h-48 mt-2 text-xs ${categoryStyles.primary}`}
          style={{
            verticalAlign: "top",
            ...(!isJsonValid && {
              border: "1px solid #ef4444",
              boxShadow: "0 0 0 2px rgba(239, 68, 68, 0.2)",
            }),
          }}
        >
          <Editor
            className="nodrag"
            height="190px"
            language="json"
            value={displayValue}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: "on",
              lineNumbers: "off",
              glyphMargin: false,
              folding: false,
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 0,
              scrollbar: {
                vertical: "auto",
                horizontal: "auto",
                verticalScrollbarSize: 0,
                horizontalScrollbarSize: 8,
                verticalSliderSize: 8,
                horizontalSliderSize: 8,
              },
              fontSize: 10,
              fontFamily: "monospace",
              readOnly: !isEnabled,
              placeholder: "Enter your JSON object here…",
              formatOnPaste: true,
              formatOnType: true,
              automaticLayout: true,
              hover: {
                enabled: true,
                delay: 300,
                sticky: true,
                above: false,
              },
              quickSuggestions: false,
              parameterHints: { enabled: false },
            }}
            theme="vs-dark"
          />
        </div>
      ),
      [
        displayValue,
        handleEditorChange,
        handleEditorDidMount,
        isEnabled,
        isJsonValid,
        categoryStyles.primary,
      ]
    );

    // Memoized render components
    const IconOrLabel = useMemo(() => {
      const shouldShowIcon =
        !isExpanded &&
        spec.size.collapsed.width === 60 &&
        spec.size.collapsed.height === 60;

      return shouldShowIcon ? (
        <div className="absolute inset-0 flex justify-center p-1 text-foreground/80 text-lg">
          {spec.icon && renderLucideIcon(spec.icon, "", 16)}
        </div>
      ) : (
        <LabelNode
          nodeId={id}
          label={(nodeData as CreateObjectData).label || spec.displayName}
        />
      );
    }, [
      isExpanded,
      spec.size.collapsed.width,
      spec.size.collapsed.height,
      spec.icon,
      spec.displayName,
      id,
      nodeData,
    ]);

    const contentClassName = useMemo(() => {
      const baseClass = isExpanded ? CONTENT.expanded : CONTENT.collapsed;
      return `${baseClass} ${isEnabled ? "" : CONTENT.disabled}`;
    }, [isExpanded, isEnabled]);

    return (
      <>
        {IconOrLabel}

        <div className={contentClassName}>
          {isExpanded ? ExpandedEditor : CollapsedEditor}
        </div>

        <ExpandCollapseButton
          showUI={isExpanded}
          onToggle={toggleExpand}
          size="sm"
        />
      </>
    );
  }
);

// Optimized wrapper with performance improvements
const CreateObjectNodeWithDynamicSpec = memo((props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);
  const typedData = nodeData as CreateObjectData;

  // Highly optimized size key extraction
  const sizeKeys = useMemo(
    () => ({
      expandedSize: typedData.expandedSize,
      collapsedSize: typedData.collapsedSize,
    }),
    [typedData.expandedSize, typedData.collapsedSize]
  );

  // Cached spec generation
  const dynamicSpec = useMemo(
    () => createDynamicSpec({ ...sizeKeys, store: "{}" } as CreateObjectData),
    [sizeKeys]
  );

  // Stable scaffolded component reference
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <CreateObjectNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
});

CreateObjectNode.displayName = "CreateObjectNode";
CreateObjectNodeWithDynamicSpec.displayName = "CreateObjectNodeWithDynamicSpec";

export default CreateObjectNodeWithDynamicSpec;
