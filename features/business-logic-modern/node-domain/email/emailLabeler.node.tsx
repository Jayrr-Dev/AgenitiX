/**
 * EmailLabeler NODE – Professional email labeling with emailMessage design principles
 *
 * • Automatically label/tag emails based on content analysis
 * • Professional collapsed/expanded views with 10px text consistency
 * • AI-powered and rule-based labeling options
 * • Schema-driven with type-safe validation
 * • Follows emailMessage UI/UX patterns exactly
 *
 * Keywords: email-labeler, tagging, ai-labeling, professional-ui
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
import { EmailLabelerCollapsed } from "./components/EmailLabelerCollapsed";
import { EmailLabelerExpanded } from "./components/EmailLabelerExpanded";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const EmailLabelerDataSchema = z
  .object({
    // Labeling Configuration
    labelingMode: z.enum(["ai", "rules", "hybrid"]).default("hybrid"),
    
    // Predefined Labels
    availableLabels: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        color: z.string().default("#3b82f6"),
        keywords: z.array(z.string()).default([]),
        enabled: z.boolean().default(true),
      })
    ).default([
      { id: "important", name: "Important", color: "#ef4444", keywords: ["urgent", "asap", "important"], enabled: true },
      { id: "work", name: "Work", color: "#3b82f6", keywords: ["meeting", "project", "deadline"], enabled: true },
      { id: "personal", name: "Personal", color: "#10b981", keywords: ["family", "friend", "personal"], enabled: true },
      { id: "newsletter", name: "Newsletter", color: "#8b5cf6", keywords: ["newsletter", "unsubscribe", "weekly"], enabled: true },
    ]),
    
    // AI Configuration
    aiModel: z.string().default("gpt-3.5-turbo"),
    aiPrompt: z.string().default("Analyze this email and suggest appropriate labels based on content, sender, and context."),
    
    // Statistics
    totalLabeled: z.number().default(0),
    labelsApplied: z.record(z.string(), z.number()).default({}),
    lastLabeledAt: z.number().nullable().default(null),
    
    // Labeling Status
    labelingStatus: z.enum([
      "inactive",
      "active", 
      "processing",
      "error"
    ]).default("inactive"),
    
    // Error handling
    lastError: z.string().nullable().default(null),
    
    // Input/Output Data
    inputEmails: z.array(z.unknown()).default([]),
    labeledEmails: z.array(z.unknown()).default([]),
    
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

export type EmailLabelerData = z.infer<typeof EmailLabelerDataSchema>;

const validateNodeData = createNodeValidator(
  EmailLabelerDataSchema,
  "EmailLabeler"
);

// -----------------------------------------------------------------------------
// 2️⃣  Dynamic spec factory
// -----------------------------------------------------------------------------

function createDynamicSpec(data: EmailLabelerData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.VE3;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C2;

  return {
    kind: "emailLabeler",
    displayName: "Email Labeler",
    label: "Email Labeler",
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
        id: "labeled-output",
        code: "json",
        position: "right", 
        type: "source",
        dataType: "JSON",
      },
    ],
    inspector: { key: "EmailLabelerInspector" },
    version: 1,
    runtime: { execute: "emailLabeler_execute_v1" },
    initialData: createSafeInitialData(EmailLabelerDataSchema, {
      labelingMode: "hybrid",
      labelingStatus: "inactive",
    }),
    dataSchema: EmailLabelerDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "inputEmails",
        "labeledEmails",
        "labelingStatus",
        "totalLabeled",
        "labelsApplied",
        "lastLabeledAt",
        "lastError",
        "expandedSize",
        "collapsedSize",
        "store",
        "inputs",
        "output",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        { key: "labelingMode", type: "select", label: "Labeling Mode" },
        { key: "aiModel", type: "select", label: "AI Model" },
        { key: "aiPrompt", type: "textarea", label: "AI Prompt" },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuTags",
    author: "Agenitix Team",
    description: "Automatically label and categorize emails using AI and rule-based analysis",
    feature: "email",
    tags: ["email", "labeling", "ai", "categorization", "automation"],
    theming: {},
  };
}

/** Static spec for registry */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE3",
  collapsedSize: "C2",
} as EmailLabelerData);

// -----------------------------------------------------------------------------
// 3️⃣  React component (simplified for brevity)
// -----------------------------------------------------------------------------

const EmailLabelerNode = memo(
  ({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
    const { nodeData, updateNodeData } = useNodeData(id, data);
    const typedNodeData = nodeData as EmailLabelerData;
    
    const {
      isExpanded,
      isEnabled,
      labelingStatus,
    } = typedNodeData;

    const toggleExpand = useCallback(() => {
      updateNodeData({ isExpanded: !isExpanded });
    }, [isExpanded, updateNodeData]);

    // Validation
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("EmailLabeler", id, validation.errors, {
        originalData: validation.originalData,
        component: "EmailLabelerNode",
      });
    }

    useNodeDataValidation(
      EmailLabelerDataSchema,
      "EmailLabeler",
      validation.data,
      id
    );

    const categoryStyles = {
      primary: "text-[--node-email-text]",
      secondary: "text-[--node-email-text-secondary]",
    };

    return (
      <>
        {!isExpanded &&
        spec.size.collapsed.width === 60 &&
        spec.size.collapsed.height === 60 ? (
          <div className="absolute inset-0 flex justify-center text-lg p-0 text-foreground/80">
            <span>🏷️</span>
          </div>
        ) : (
          <LabelNode
            nodeId={id}
            label={typedNodeData.label || spec.displayName}
          />
        )}

        {!isExpanded ? (
          <EmailLabelerCollapsed
            nodeData={typedNodeData}
            categoryStyles={categoryStyles}
            onToggleExpand={toggleExpand}
          />
        ) : (
          <EmailLabelerExpanded
            nodeId={id}
            nodeData={typedNodeData}
            isEnabled={isEnabled}
            labelingStatus={labelingStatus}
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

EmailLabelerNode.displayName = "EmailLabelerNode";

// -----------------------------------------------------------------------------
// 4️⃣  Export with scaffold
// -----------------------------------------------------------------------------

const EmailLabelerNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as EmailLabelerData),
    [nodeData]
  );

  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <EmailLabelerNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
};

export default EmailLabelerNodeWithDynamicSpec;