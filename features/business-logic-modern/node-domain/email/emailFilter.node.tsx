/**
 * EmailFilter NODE – Professional email filtering with emailMessage design principles
 *
 * • Filter emails based on multiple criteria (sender, subject, content, etc.)
 * • Professional collapsed/expanded views with 10px text consistency
 * • Real-time filter statistics and match indicators
 * • Schema-driven with type-safe validation
 * • Follows emailMessage UI/UX patterns exactly
 *
 * Keywords: email-filter, filtering, professional-ui, criteria-matching
 */

import type { NodeProps } from "@xyflow/react";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { z } from "zod";

import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
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
import { useNodeData } from "@/hooks/useNodeData";
import { useStore } from "@xyflow/react";
import { findEdgesByHandle } from "@/features/business-logic-modern/infrastructure/flow-engine/utils/edgeUtils";
import { normalizeHandleId } from "@/features/business-logic-modern/infrastructure/node-core/handleOutputUtils";

// Import components
import { EmailFilterCollapsed } from "./components/EmailFilterCollapsed";
import { EmailFilterExpanded } from "./components/EmailFilterExpanded";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const EmailFilterDataSchema = z
  .object({
    // Filter Criteria
    filterRules: z.array(
      z.object({
        id: z.string(),
        field: z.enum(["sender", "subject", "content", "recipient", "date", "attachment"]),
        operator: z.enum(["contains", "equals", "startsWith", "endsWith", "regex", "not"]),
        value: z.string(),
        caseSensitive: z.boolean().default(false),
        enabled: z.boolean().default(true),
      })
    ).default([]),
    
    // Filter Logic
    matchMode: z.enum(["all", "any"]).default("any"), // AND vs OR logic
    
    // Filter Actions
    filterAction: z.enum(["pass", "block", "tag", "move"]).default("pass"),
    actionValue: z.string().default(""), // Tag name or folder for move action
    
    // Statistics
    totalProcessed: z.number().default(0),
    totalMatched: z.number().default(0),
    totalBlocked: z.number().default(0),
    lastProcessedAt: z.number().nullable().default(null),
    
    // Filter Status
    filterStatus: z.enum([
      "inactive",
      "active",
      "processing",
      "error"
    ]).default("inactive"),
    
    // Error handling
    lastError: z.string().nullable().default(null),
    
    // Input/Output Data
    inputEmails: z.array(z.unknown()).default([]),
    filteredEmails: z.array(z.unknown()).default([]),
    
    // Node State
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    expandedSize: SafeSchemas.text("VE3"),
    collapsedSize: SafeSchemas.text("C2"),
    label: z.string().optional(),
    
    // Legacy compatibility
    store: SafeSchemas.text(""),
    inputs: SafeSchemas.optionalText().nullable().default(null),
    output: SafeSchemas.optionalText(),
  })
  .passthrough();

export type EmailFilterData = z.infer<typeof EmailFilterDataSchema>;

const validateNodeData = createNodeValidator(
  EmailFilterDataSchema,
  "EmailFilter"
);

// -----------------------------------------------------------------------------
// 2️⃣  Dynamic spec factory
// -----------------------------------------------------------------------------

function createDynamicSpec(data: EmailFilterData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.VE3;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C2;

  return {
    kind: "emailFilter",
    displayName: "Email Filter",
    label: "Email Filter",
    category: CATEGORIES.EMAIL,
    size: { expanded, collapsed },
    handles: [
      {
        id: "email-input",
        code: "json",
        position: "left",
        type: "target",
        dataType: "JSON",
      },
      {
        id: "filtered-output",
        code: "json",
        position: "right", 
        type: "source",
        dataType: "JSON",
      },
      {
        id: "blocked-output",
        code: "json",
        position: "bottom", 
        type: "source",
        dataType: "JSON",
      },
    ],
    inspector: { key: "EmailFilterInspector" },
    version: 1,
    runtime: { execute: "emailFilter_execute_v1" },
    initialData: createSafeInitialData(EmailFilterDataSchema, {
      filterRules: [],
      matchMode: "any",
      filterAction: "pass",
      filterStatus: "inactive",
    }),
    dataSchema: EmailFilterDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "inputEmails",
        "filteredEmails",
        "filterStatus",
        "totalProcessed",
        "totalMatched",
        "totalBlocked",
        "lastProcessedAt",
        "lastError",
        "expandedSize",
        "collapsedSize",
        "store",
        "inputs",
        "output",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        { key: "matchMode", type: "select", label: "Match Mode" },
        { key: "filterAction", type: "select", label: "Filter Action" },
        { key: "actionValue", type: "text", label: "Action Value", placeholder: "Tag name or folder..." },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuFilter",
    author: "Agenitix Team",
    description: "Filter emails based on multiple criteria with advanced matching rules",
    feature: "email",
    tags: ["email", "filter", "criteria", "matching", "automation"],
    theming: {},
  };
}

/** Static spec for registry */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE3",
  collapsedSize: "C2",
} as EmailFilterData);

// -----------------------------------------------------------------------------
// 3️⃣  React component
// -----------------------------------------------------------------------------

const EmailFilterNode = memo(
  ({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
    const { nodeData, updateNodeData } = useNodeData(id, data);
    const typedNodeData = nodeData as EmailFilterData;
    
    // Global React‑Flow store for edge detection
    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);
    
    const {
      isExpanded,
      isEnabled,
      isActive,
      filterRules,
      matchMode,
      filterAction,
      actionValue,
      filterStatus,
      totalProcessed,
      totalMatched,
      totalBlocked,
      lastProcessedAt,
      lastError,
      inputEmails,
      filteredEmails,
    } = typedNodeData;

    // Keep last output to avoid redundant writes
    const lastOutputRef = useRef<unknown>(null);

    // -------------------------------------------------------------------------
    // Callbacks
    // -------------------------------------------------------------------------

    /** Toggle between collapsed / expanded */
    const toggleExpand = useCallback(() => {
      updateNodeData({ isExpanded: !isExpanded });
    }, [isExpanded, updateNodeData]);

    /** Add new filter rule */
    const addFilterRule = useCallback(() => {
      const newRule = {
        id: `rule_${Date.now()}`,
        field: "subject" as const,
        operator: "contains" as const,
        value: "",
        caseSensitive: false,
        enabled: true,
      };
      
      updateNodeData({
        filterRules: [...filterRules, newRule],
      });
    }, [filterRules, updateNodeData]);

    /** Update filter rule */
    const updateFilterRule = useCallback((ruleId: string, updates: Partial<typeof filterRules[0]>) => {
      const updatedRules = filterRules.map(rule => 
        rule.id === ruleId ? { ...rule, ...updates } : rule
      );
      
      updateNodeData({ filterRules: updatedRules });
    }, [filterRules, updateNodeData]);

    /** Remove filter rule */
    const removeFilterRule = useCallback((ruleId: string) => {
      const updatedRules = filterRules.filter(rule => rule.id !== ruleId);
      updateNodeData({ filterRules: updatedRules });
    }, [filterRules, updateNodeData]);

    /** Apply filters to emails */
    const applyFilters = useCallback(async (emails: any[]) => {
      if (!emails.length || !filterRules.length) return emails;
      
      updateNodeData({ filterStatus: "processing" });
      
      try {
        const filtered: any[] = [];
        const blocked: any[] = [];
        
        for (const email of emails) {
          const matches = filterRules
            .filter(rule => rule.enabled)
            .map(rule => {
              const fieldValue = email[rule.field] || "";
              const searchValue = rule.caseSensitive ? rule.value : rule.value.toLowerCase();
              const targetValue = rule.caseSensitive ? fieldValue : fieldValue.toLowerCase();
              
              switch (rule.operator) {
                case "contains":
                  return targetValue.includes(searchValue);
                case "equals":
                  return targetValue === searchValue;
                case "startsWith":
                  return targetValue.startsWith(searchValue);
                case "endsWith":
                  return targetValue.endsWith(searchValue);
                case "regex":
                  try {
                    return new RegExp(rule.value, rule.caseSensitive ? "g" : "gi").test(fieldValue);
                  } catch {
                    return false;
                  }
                case "not":
                  return !targetValue.includes(searchValue);
                default:
                  return false;
              }
            });
          
          const isMatch = matchMode === "all" 
            ? matches.every(Boolean) 
            : matches.some(Boolean);
          
          if (filterAction === "pass" && isMatch) {
            filtered.push(email);
          } else if (filterAction === "block" && isMatch) {
            blocked.push(email);
          } else if (filterAction === "tag" && isMatch) {
            filtered.push({ ...email, tags: [...(email.tags || []), actionValue] });
          } else if (!isMatch) {
            filtered.push(email);
          }
        }
        
        const now = Date.now();
        updateNodeData({
          filterStatus: "active",
          filteredEmails: filtered,
          totalProcessed: totalProcessed + emails.length,
          totalMatched: totalMatched + (emails.length - filtered.length),
          totalBlocked: totalBlocked + blocked.length,
          lastProcessedAt: now,
          lastError: null,
        });
        
        // Propagate filtered output
        const output = {
          filtered: filtered,
          blocked: blocked,
          stats: {
            processed: emails.length,
            matched: emails.length - filtered.length,
            blocked: blocked.length,
          },
        };
        
        if (JSON.stringify(output) !== JSON.stringify(lastOutputRef.current)) {
          lastOutputRef.current = output;
          updateNodeData({ output });
        }
        
        return filtered;
      } catch (error) {
        updateNodeData({
          filterStatus: "error",
          lastError: error instanceof Error ? error.message : "Filter failed",
        });
        return emails;
      }
    }, [filterRules, matchMode, filterAction, actionValue, totalProcessed, totalMatched, totalBlocked, updateNodeData]);

    // -------------------------------------------------------------------------
    // Effects
    // -------------------------------------------------------------------------

    /** Compute input from connected edges */
    const computeInput = useCallback((): unknown => {
      const emailEdges = findEdgesByHandle(edges, id, "email-input");
      if (emailEdges.length === 0) return [];

      const allEmails: any[] = [];
      for (const edge of emailEdges) {
        const src = nodes.find((n) => n.id === edge.source);
        if (!src) continue;

        const dataRec = src.data as Record<string, unknown> | undefined;
        let value: unknown = undefined;

        // Handle-specific value from source output map
        if (dataRec && typeof dataRec.output === "object" && dataRec.output) {
          const outMap = dataRec.output as Record<string, unknown>;
          const cleanId = edge.sourceHandle
            ? normalizeHandleId(edge.sourceHandle)
            : "output";
          if (outMap[cleanId] !== undefined) {
            value = outMap[cleanId];
          } else if (outMap.output !== undefined) {
            value = outMap.output;
          } else {
            const first = Object.values(outMap)[0];
            if (first !== undefined) value = first;
          }
        }

        // Legacy fallback
        if (value === undefined) {
          value =
            (src.data as any)?.output ??
            (src.data as any)?.inputData ??
            (src.data as any)?.store ??
            src.data;
        }

        // Ensure we have an array of emails
        if (Array.isArray(value)) {
          allEmails.push(...value);
        } else if (value && typeof value === "object") {
          allEmails.push(value);
        }
      }

      return allEmails;
    }, [edges, nodes, id]);

    /* Update inputs when edges change */
    useEffect(() => {
      const inputVal = computeInput() as any[];
      if (JSON.stringify(inputVal) !== JSON.stringify(inputEmails)) {
        updateNodeData({ inputEmails: inputVal });
      }
    }, [computeInput, inputEmails, updateNodeData]);

    /* Auto-enable when inputs connect or rules exist */
    useEffect(() => {
      const hasEmails = inputEmails.length > 0;
      const hasRules = filterRules.length > 0;
      const nextActive = isEnabled && hasEmails && hasRules;
      if (isActive !== nextActive) {
        updateNodeData({ isActive: nextActive });
      }
    }, [inputEmails, filterRules, isEnabled, isActive, updateNodeData]);

    /* Apply filters when emails or rules change */
    useEffect(() => {
      if (inputEmails.length > 0 && filterRules.length > 0 && isActive) {
        applyFilters(inputEmails);
      }
    }, [inputEmails, filterRules, isActive, applyFilters]);

    // -------------------------------------------------------------------------
    // Validation
    // -------------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("EmailFilter", id, validation.errors, {
        originalData: validation.originalData,
        component: "EmailFilterNode",
      });
    }

    useNodeDataValidation(
      EmailFilterDataSchema,
      "EmailFilter",
      validation.data,
      id
    );

    // -------------------------------------------------------------------------
    // Category styles for consistent theming
    // -------------------------------------------------------------------------
    const categoryStyles = {
      primary: "text-[--node-email-text]",
      secondary: "text-[--node-email-text-secondary]",
    };

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------
    return (
      <>
        {/* Editable label or icon */}
        {!isExpanded &&
        spec.size.collapsed.width === 60 &&
        spec.size.collapsed.height === 60 ? (
          <div className="absolute inset-0 flex justify-center text-lg p-0 text-foreground/80">
            {spec.icon && <span>🔍</span>}
          </div>
        ) : (
          <LabelNode
            nodeId={id}
            label={typedNodeData.label || spec.displayName}
          />
        )}

        {!isExpanded ? (
          <EmailFilterCollapsed
            nodeData={typedNodeData}
            categoryStyles={categoryStyles}
            onToggleExpand={toggleExpand}
          />
        ) : (
          <EmailFilterExpanded
            nodeId={id}
            nodeData={typedNodeData}
            isEnabled={isEnabled}
            filterStatus={filterStatus}
            onAddRule={addFilterRule}
            onUpdateRule={updateFilterRule}
            onRemoveRule={removeFilterRule}
          />
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

EmailFilterNode.displayName = "EmailFilterNode";

// -----------------------------------------------------------------------------
// 4️⃣  Export with scaffold
// -----------------------------------------------------------------------------

const EmailFilterNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as EmailFilterData),
    [nodeData]
  );

  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <EmailFilterNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
};

export default EmailFilterNodeWithDynamicSpec;