/**
 * EmailDraft NODE – Professional email draft management with emailMessage design principles
 *
 * • Create, edit, and manage email drafts before sending
 * • Professional collapsed/expanded views with 10px text consistency
 * • Real-time draft status and auto-save functionality
 * • Schema-driven with type-safe validation
 * • Follows emailMessage UI/UX patterns exactly
 *
 * Keywords: email-draft, draft-management, professional-ui, auto-save
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
import { toObjectValue } from "@/features/business-logic-modern/node-domain/convert/utils";

// Import components (we'll create these next)
import { EmailDraftCollapsed } from "./components/EmailDraftCollapsed";
import { EmailDraftExpanded } from "./components/EmailDraftExpanded";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const EmailDraftDataSchema = z
  .object({
    // Draft Content
    subject: z.string().default(""),
    messageContent: z.string().default(""),
    messageType: z.enum(["plain", "html", "markdown"]).default("plain"),
    
    // Recipients
    recipients: z
      .object({
        to: z.array(z.string()).default([]),
        cc: z.array(z.string()).default([]),
        bcc: z.array(z.string()).default([]),
      })
      .default({ to: [], cc: [], bcc: [] }),
    
    // Draft Properties
    priority: z.enum(["low", "normal", "high"]).default("normal"),
    draftId: z.string().default(""),
    
    // Auto-save Configuration
    autoSave: z.boolean().default(true),
    saveInterval: z.number().default(30), // seconds
    
    // Draft Status
    draftStatus: z.enum([
      "new",
      "editing", 
      "saving",
      "saved",
      "error"
    ]).default("new"),
    
    // Timestamps
    createdAt: z.number().nullable().default(null),
    lastSavedAt: z.number().nullable().default(null),
    lastModifiedAt: z.number().nullable().default(null),
    
    // Statistics
    wordCount: z.number().default(0),
    characterCount: z.number().default(0),
    
    // Error handling
    lastError: z.string().nullable().default(null),
    
    // Input Data
    inputData: z.unknown().nullable().default(null),
    
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

export type EmailDraftData = z.infer<typeof EmailDraftDataSchema>;

const validateNodeData = createNodeValidator(
  EmailDraftDataSchema,
  "EmailDraft"
);

// -----------------------------------------------------------------------------
// 2️⃣  Dynamic spec factory
// -----------------------------------------------------------------------------

function createDynamicSpec(data: EmailDraftData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.VE3;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C2;

  return {
    kind: "emailDraft",
    displayName: "Email Draft",
    label: "Email Draft",
    category: CATEGORIES.EMAIL,
    size: { expanded, collapsed },
    handles: [
      {
        id: "template-input",
        code: "json",
        position: "left",
        type: "target",
        dataType: "JSON",
      },
      {
        id: "draft-output",
        code: "json",
        position: "right", 
        type: "source",
        dataType: "JSON",
      },
    ],
    inspector: { key: "EmailDraftInspector" },
    version: 1,
    runtime: { execute: "emailDraft_execute_v1" },
    initialData: createSafeInitialData(EmailDraftDataSchema, {
      subject: "",
      messageContent: "",
      draftStatus: "new",
      autoSave: true,
      saveInterval: 30,
    }),
    dataSchema: EmailDraftDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "inputData",
        "draftStatus",
        "createdAt",
        "lastSavedAt",
        "lastModifiedAt",
        "wordCount",
        "characterCount",
        "lastError",
        "expandedSize",
        "collapsedSize",
        "store",
        "inputs",
        "output",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        { key: "subject", type: "text", label: "Subject", placeholder: "Email subject..." },
        { key: "messageContent", type: "textarea", label: "Message", placeholder: "Draft your email..." },
        { key: "messageType", type: "select", label: "Format" },
        { key: "priority", type: "select", label: "Priority" },
        { key: "autoSave", type: "boolean", label: "Auto Save" },
        { key: "saveInterval", type: "number", label: "Save Interval (s)" },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuFileEdit",
    author: "Agenitix Team",
    description: "Create and manage email drafts with auto-save functionality",
    feature: "email",
    tags: ["email", "draft", "compose", "auto-save", "editor"],
    theming: {},
  };
}

/** Static spec for registry */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE3",
  collapsedSize: "C2",
} as EmailDraftData);

// -----------------------------------------------------------------------------
// 3️⃣  React component
// -----------------------------------------------------------------------------

const EmailDraftNode = memo(
  ({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
    const { nodeData, updateNodeData } = useNodeData(id, data);
    const typedNodeData = nodeData as EmailDraftData;
    
    // Global React‑Flow store for edge detection
    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);
    
    const {
      isExpanded,
      isEnabled,
      isActive,
      subject,
      messageContent,
      messageType,
      recipients,
      priority,
      draftStatus,
      autoSave,
      saveInterval,
      wordCount,
      characterCount,
      createdAt,
      lastSavedAt,
      lastError,
      inputData,
    } = typedNodeData;

    // Keep last output to avoid redundant writes
    const lastOutputRef = useRef<unknown>(null);
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

    // -------------------------------------------------------------------------
    // Callbacks
    // -------------------------------------------------------------------------

    /** Toggle between collapsed / expanded */
    const toggleExpand = useCallback(() => {
      updateNodeData({ isExpanded: !isExpanded });
    }, [isExpanded, updateNodeData]);

    /** Update word and character counts */
    const updateCounts = useCallback((content: string) => {
      const words = content.trim() ? content.trim().split(/\s+/).length : 0;
      const characters = content.length;
      
      updateNodeData({
        wordCount: words,
        characterCount: characters,
        lastModifiedAt: Date.now(),
      });
    }, [updateNodeData]);

    /** Save draft */
    const saveDraft = useCallback(async () => {
      if (!subject && !messageContent) return;
      
      updateNodeData({ draftStatus: "saving" });
      
      try {
        // TODO: Implement actual draft saving to backend
        // For now, simulate save
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const now = Date.now();
        const draftData = {
          subject,
          messageContent,
          messageType,
          recipients,
          priority,
          wordCount,
          characterCount,
          lastSavedAt: now,
        };
        
        updateNodeData({
          draftStatus: "saved",
          lastSavedAt: now,
          lastError: null,
          draftId: draftData.subject ? `draft_${Date.now()}` : "",
        });
        
        // Propagate draft output
        const output = {
          ...draftData,
          draftId: draftData.subject ? `draft_${Date.now()}` : "",
          status: "saved",
        };
        
        if (JSON.stringify(output) !== JSON.stringify(lastOutputRef.current)) {
          lastOutputRef.current = output;
          updateNodeData({ output });
        }
      } catch (error) {
        updateNodeData({
          draftStatus: "error",
          lastError: error instanceof Error ? error.message : "Save failed",
        });
      }
    }, [subject, messageContent, messageType, recipients, priority, wordCount, characterCount, updateNodeData]);

    /** Handle content changes */
    const handleContentChange = useCallback((newContent: string) => {
      updateNodeData({ 
        messageContent: newContent,
        draftStatus: "editing",
      });
      updateCounts(newContent);
      
      // Auto-save logic
      if (autoSave) {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
        autoSaveTimeoutRef.current = setTimeout(() => {
          saveDraft();
        }, saveInterval * 1000);
      }
    }, [updateNodeData, updateCounts, autoSave, saveInterval, saveDraft]);

    /** Handle subject changes */
    const handleSubjectChange = useCallback((newSubject: string) => {
      updateNodeData({ 
        subject: newSubject,
        draftStatus: "editing",
        lastModifiedAt: Date.now(),
      });
      
      // Auto-save logic
      if (autoSave) {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
        autoSaveTimeoutRef.current = setTimeout(() => {
          saveDraft();
        }, saveInterval * 1000);
      }
    }, [updateNodeData, autoSave, saveInterval, saveDraft]);

    // -------------------------------------------------------------------------
    // Effects
    // -------------------------------------------------------------------------

    /** Compute input from connected edges */
    const computeInput = useCallback((): unknown => {
      const templateEdges = findEdgesByHandle(edges, id, "template-input");
      if (templateEdges.length === 0) return null;

      const items: Array<{ value: unknown; label?: string }> = [];
      for (const edge of templateEdges) {
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

        // Parse JSON strings
        if (typeof value === "string") {
          const trimmed = value.trim();
          if (trimmed.length > 0) {
            const looksJson =
              (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
              (trimmed.startsWith("[") && trimmed.endsWith("]"));
            if (looksJson) {
              try {
                value = JSON.parse(trimmed);
              } catch {
                // keep original string
              }
            }
          }
        }

        const customLabel =
          typeof (dataRec as any)?.label === "string"
            ? ((dataRec as any)?.label as string)
            : undefined;
        items.push({ value, label: customLabel });
      }

      if (items.length === 0) return null;
      return items[0].value; // Use first template
    }, [edges, nodes, id]);

    /* Update inputs when edges change */
    useEffect(() => {
      const inputVal = computeInput();
      if (inputVal !== inputData) {
        updateNodeData({ inputData: inputVal });
        
        // Apply template data if available
        if (inputVal && typeof inputVal === "object") {
          const template = inputVal as any;
          if (template.subject && !subject) {
            updateNodeData({ subject: template.subject });
          }
          if (template.content && !messageContent) {
            updateNodeData({ messageContent: template.content });
            updateCounts(template.content);
          }
        }
      }
    }, [computeInput, inputData, subject, messageContent, updateNodeData, updateCounts]);

    /* Auto-enable when inputs connect or content exists */
    useEffect(() => {
      const hasContent = subject.trim() || messageContent.trim();
      const nextActive = isEnabled && hasContent;
      if (isActive !== nextActive) {
        updateNodeData({ isActive: nextActive });
      }
    }, [subject, messageContent, isEnabled, isActive, updateNodeData]);

    /* Set created timestamp on first content */
    useEffect(() => {
      if ((subject || messageContent) && !createdAt) {
        updateNodeData({ createdAt: Date.now() });
      }
    }, [subject, messageContent, createdAt, updateNodeData]);

    /* Cleanup auto-save timeout */
    useEffect(() => {
      return () => {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
      };
    }, []);

    // -------------------------------------------------------------------------
    // Validation
    // -------------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("EmailDraft", id, validation.errors, {
        originalData: validation.originalData,
        component: "EmailDraftNode",
      });
    }

    useNodeDataValidation(
      EmailDraftDataSchema,
      "EmailDraft",
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
            {spec.icon && <span>📝</span>}
          </div>
        ) : (
          <LabelNode
            nodeId={id}
            label={typedNodeData.label || spec.displayName}
          />
        )}

        {!isExpanded ? (
          <EmailDraftCollapsed
            nodeData={typedNodeData}
            categoryStyles={categoryStyles}
            onToggleExpand={toggleExpand}
            onSaveDraft={saveDraft}
          />
        ) : (
          <EmailDraftExpanded
            nodeId={id}
            nodeData={typedNodeData}
            isEnabled={isEnabled}
            draftStatus={draftStatus}
            onSubjectChange={handleSubjectChange}
            onContentChange={handleContentChange}
            onSaveDraft={saveDraft}
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

EmailDraftNode.displayName = "EmailDraftNode";

// -----------------------------------------------------------------------------
// 4️⃣  Export with scaffold
// -----------------------------------------------------------------------------

const EmailDraftNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as EmailDraftData),
    [nodeData]
  );

  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <EmailDraftNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
};

export default EmailDraftNodeWithDynamicSpec;