/**
 * EmailMessage NODE – Content‑focused, schema‑driven, type‑safe
 *
 * • Shows only internal layout; the scaffold provides borders, sizing, theming, and interactivity.
 * • Zod schema auto‑generates type‑checked Inspector controls.
 * • Dynamic sizing (expandedSize / collapsedSize) drives the spec.
 * • Output propagation is gated by `isActive` *and* `isEnabled` to prevent runaway loops.
 * • Uses findEdgeByHandle utility for robust React Flow edge handling.
 * • Auto-enables when inputs connect; never auto-disables automatically.
 * • Code is fully commented and follows current React + TypeScript best practices.
 *
 * Keywords: email-message, schema-driven, type‑safe, clean‑architecture
 */

import type { NodeProps, Node as RFNode } from "@xyflow/react";
import {
  ChangeEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { z } from "zod";

import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
import {
  generateoutputField,
  normalizeHandleId,
} from "@/features/business-logic-modern/infrastructure/node-core/handleOutputUtils";
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

import { useAuth } from "@/components/auth/AuthProvider";
import { useFlowMetadataOptional } from "@/features/business-logic-modern/infrastructure/flow-engine/contexts/flow-metadata-context";
import { useNodeToast } from "@/hooks/useNodeToast";
import { EmailMessageCollapsed } from "./components/EmailMessageCollapsed";
import { EmailMessageExpanded } from "./components/EmailMessageExpanded";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const EmailMessageDataSchema = z
  .object({
    // Message Content
    messageContent: SafeSchemas.text(""),
    messageType: z.enum(["plain", "html", "markdown"]).default("plain"),

    // Recipient Configuration
    recipients: z
      .object({
        to: z.array(z.string()).default([]),
        cc: z.array(z.string()).default([]),
        bcc: z.array(z.string()).default([]),
      })
      .default({ to: [], cc: [], bcc: [] }),

    // Message Properties
    subject: z.string().default(""),
    priority: z.enum(["low", "normal", "high"]).default("normal"),

    // Attachments
    attachments: z
      .array(
        z.object({
          name: z.string(),
          path: z.string().optional(),
          content: z.string().optional(),
          type: z.string().optional(),
        })
      )
      .default([]),

    // Template Configuration
    useTemplate: z.boolean().default(false),
    templateId: z.string().default(""),
    templateVariables: z.record(z.string(), z.any()).default({}),

    // Scheduling
    scheduleType: z
      .enum(["immediate", "scheduled", "delayed"])
      .default("immediate"),
    scheduledTime: z.string().optional(),
    delayMinutes: z.number().min(0).max(1440).default(0),

    // Connection State
    isConnected: z.boolean().default(false),
    connectionStatus: z
      .enum([
        "idle",
        "connecting",
        "connected",
        "composing",
        "sending",
        "sent",
        "error",
      ])
      .default("idle"),
    lastSent: z.number().optional(),
    sentCount: z.number().default(0),

    // Error Handling
    lastError: z.string().default(""),
    retryCount: z.number().default(0),

    // UI State
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    expandedSize: SafeSchemas.text("VE2"),
    collapsedSize: SafeSchemas.text("C2"),

    // Input/Output
    emailInput: z.any().nullable().default(null), // Email data from EmailReader
    jsonOutput: z.string().default(""), // JSON output for downstream nodes
    output: z.string().default(""), // For compatibility with viewText node
    statusOutput: SafeSchemas.boolean(false),
    label: z.string().optional(), // User-editable node label
  })
  .passthrough();

export type EmailMessageData = z.infer<typeof EmailMessageDataSchema>;

const validateNodeData = createNodeValidator(
  EmailMessageDataSchema,
  "EmailMessage"
);

// -----------------------------------------------------------------------------
// 2️⃣  Constants
// -----------------------------------------------------------------------------

const CATEGORY_TEXT = {
  EMAIL: {
    primary: "text-[--node-email-text]",
  },
} as const;

/**
 * RESET_ON_LOGOUT_DATA – fields cleared on logout or user switch
 * [Explanation], basically return node to idle state when auth changes
 */
const RESET_ON_LOGOUT_DATA: Partial<EmailMessageData> = {
  isConnected: false,
  connectionStatus: "idle",
  emailInput: null,
  jsonOutput: "",
  output: "",
  statusOutput: false,
  isActive: false,
  lastError: "",
  retryCount: 0,
};

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

/**
 * Builds a NodeSpec whose size keys can change at runtime via node data.
 */
function createDynamicSpec(data: EmailMessageData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.VE2;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C2;

  /**
   * HANDLE_TOOLTIPS – ultra‑concise custom tooltip labels for handles
   * [Explanation], basically 1–3 word hints shown before dynamic value/type
   */
  const HANDLE_TOOLTIPS = {
    EMAIL_INPUT: "Email Data",
    TRIGGER_IN: "Trigger",
    JSON_OUT: "Message JSON",
    STATUS_OUT: "Send Status",
  } as const;

  return {
    kind: "emailMessage",
    displayName: "Email Message",
    label: "Email Message",
    category: CATEGORIES.EMAIL,
    size: { expanded, collapsed },
    handles: [
      {
        id: "email-input",
        code: "j",
        position: "left",
        type: "target",
        dataType: "JSON",
        tooltip: HANDLE_TOOLTIPS.EMAIL_INPUT,
      },
      {
        id: "trigger-input",
        code: "b",
        position: "top",
        type: "target",
        dataType: "Boolean",
        tooltip: HANDLE_TOOLTIPS.TRIGGER_IN,
      },
      {
        id: "json-output",
        code: "j",
        position: "right",
        type: "source",
        dataType: "JSON",
        tooltip: HANDLE_TOOLTIPS.JSON_OUT,
      },
      {
        id: "status-output",
        code: "b",
        position: "bottom",
        type: "source",
        dataType: "Boolean",
        tooltip: HANDLE_TOOLTIPS.STATUS_OUT,
      },
    ],
    inspector: { key: "EmailMessageInspector" },
    version: 1,
    runtime: { execute: "emailMessage_execute_v1" },
    initialData: createSafeInitialData(EmailMessageDataSchema, {
      messageContent: "",
      messageType: "plain",
      recipients: { to: [], cc: [], bcc: [] },
      subject: "",
      priority: "normal",
      attachments: [],
      useTemplate: false,
      templateId: "",
      templateVariables: {},
      scheduleType: "immediate",
      delayMinutes: 0,
      isConnected: false,
      connectionStatus: "idle",
      sentCount: 0,
      lastError: "",
      retryCount: 0,
      emailInput: null,
      jsonOutput: "",
      output: "",
      statusOutput: false,
    }),
    dataSchema: EmailMessageDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "emailInput",
        "jsonOutput",
        "output",
        "statusOutput",
        "expandedSize",
        "collapsedSize",
        "connectionStatus",
        "lastSent",
        "sentCount",
        "lastError",
        "retryCount",
        "isConnected",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        {
          key: "messageContent",
          type: "textarea",
          label: "Message Content",
          placeholder: "Enter your email message...",
          ui: { rows: 4 },
        },
        {
          key: "subject",
          type: "text",
          label: "Subject",
          placeholder: "Email subject...",
        },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuMail",
    author: "Agenitix Team",
    description:
      "Compose and send email messages with recipient management and scheduling",
    feature: "email",
    tags: ["email", "message", "compose", "send"],
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE2",
  collapsedSize: "C2",
} as EmailMessageData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const EmailMessageNode = memo(
  ({ id, spec, ...rest }: NodeProps & { spec: NodeSpec }) => {
    // -------------------------------------------------------------------------
    const { nodeData, updateNodeData } = useNodeData(id, {});

    // Category styling for consistent theming, basically email node styling
    const categoryStyles = CATEGORY_TEXT.EMAIL;

    // -------------------------------------------------------------------------
    // STATE MANAGEMENT (grouped for clarity)
    // -------------------------------------------------------------------------
    const {
      isExpanded,
      isEnabled,
      isActive,
      messageContent,
      messageType,
      subject,
      priority,
      recipients,
      useTemplate,
      templateId,
      scheduleType,
      scheduledTime,
      delayMinutes,
      connectionStatus,
      isConnected,
      lastSent,
      sentCount,
      lastError,
      retryCount,
    } = nodeData as EmailMessageData;

    // Targeted selectors: avoid broad dependency on nodes/edges arrays
    // Track only the edges connected to input handles
    const emailInputEdgesSignature = useStore(
      (s) => {
        const edges = s.edges.filter(
          (e) => e.target === id && e.targetHandle?.startsWith("email-input")
        );
        // Stable primitive signature to leverage strict equality
        return (
          edges
            .map((e) => `${e.id}:${e.source}:${e.sourceHandle ?? ""}`)
            .join("|") || "none"
        );
      },
      (a, b) => a === b
    );

    // Keep last emitted output to avoid redundant writes
    const _lastOutputRef = useRef<string | null>(null);
    const _prevIsConnectedRef = useRef<boolean>(
      (nodeData as EmailMessageData).isConnected
    );

    // -------------------------------------------------------------------------
    // 4.2  Trigger input (Boolean) – starts message composition on rising edge
    // -------------------------------------------------------------------------
    // Compute a stable string signature for trigger value to minimize renders
    const triggerSignal = useStore((s) => {
      const edge = s.edges.find(
        (e) => e.target === id && e.targetHandle?.startsWith("trigger-input")
      );
      if (!edge) return "none" as const;
      const src = (s.nodes as RFNode[]).find((n) => n.id === edge.source);
      if (!src) return "none" as const;

      const sourceData = src.data as Record<string, unknown> | undefined;
      let value: unknown = undefined;

      // 1) Unified handle-based output reading
      if (
        sourceData &&
        typeof sourceData.output === "object" &&
        sourceData.output !== null
      ) {
        const outputObj = sourceData.output as Record<string, unknown>;
        const cleanId = edge.sourceHandle
          ? normalizeHandleId(edge.sourceHandle)
          : "output";
        value =
          outputObj[cleanId] ?? outputObj.output ?? Object.values(outputObj)[0];
      }

      // 2) Legacy fallbacks for compatibility
      if (value === undefined || value === null) {
        value =
          (sourceData as any)?.output ??
          (sourceData as any)?.store ??
          (sourceData as any)?.isActive ??
          false;
      }

      const truthy =
        value === true || value === "true" || value === 1 || value === "1";
      return truthy ? "true" : "false";
    }, Object.is);

    // -------------------------------------------------------------------------
    // 4.3  Auth integration
    // -------------------------------------------------------------------------
    const { user, authToken: token } = useAuth();
    const flowMetadata = useFlowMetadataOptional();
    const flowId = String(flowMetadata?.flow?.id ?? "");
    const canEdit = flowMetadata?.flow?.canEdit ?? true;
    const userEmail = user?.email ?? "";
    const { showSuccess, showError } = useNodeToast(id);

    // -------------------------------------------------------------------------
    // 4.4  Get connected email data from EmailReader nodes
    // -------------------------------------------------------------------------
    const connectedEmailData = useStore(
      (s) => {
        const incomingEdges = s.edges.filter(
          (e) => e.target === id && e.targetHandle?.startsWith("email-input")
        );
        if (incomingEdges.length === 0) return null;

        for (const edge of incomingEdges) {
          const sourceNode = (s.nodes as RFNode[]).find(
            (n: RFNode) => n.id === edge.source
          );
          const output = (sourceNode?.data?.output ?? {}) as Record<
            string,
            unknown
          >;
          const explicit = output["messages-output"] as unknown[] | undefined;
          if (explicit && Array.isArray(explicit) && explicit.length > 0) {
            return explicit;
          }
        }
        return null;
      },
      (a, b) => JSON.stringify(a) === JSON.stringify(b)
    );

    // -------------------------------------------------------------------------
    // 4.6  Callbacks
    // -------------------------------------------------------------------------

    /** Toggle between collapsed / expanded */
    const toggleExpand = useCallback(() => {
      updateNodeData({ isExpanded: !isExpanded });
    }, [isExpanded, updateNodeData]);

    /** Handle message content change */
    const handleMessageContentChange = useCallback(
      (e: ChangeEvent<HTMLTextAreaElement>) => {
        updateNodeData({ messageContent: e.target.value });
      },
      [updateNodeData]
    );

    /** Handle message type change */
    const handleMessageTypeChange = useCallback(
      (e: ChangeEvent<HTMLSelectElement>) => {
        updateNodeData({
          messageType: e.target.value as EmailMessageData["messageType"],
        });
      },
      [updateNodeData]
    );

    /** Handle subject change */
    const handleSubjectChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        updateNodeData({ subject: e.target.value });
      },
      [updateNodeData]
    );

    /** Handle priority change */
    const handlePriorityChange = useCallback(
      (e: ChangeEvent<HTMLSelectElement>) => {
        updateNodeData({
          priority: e.target.value as EmailMessageData["priority"],
        });
      },
      [updateNodeData]
    );

    /** Handle recipients change */
    const handleRecipientsChange = useCallback(
      (type: "to" | "cc" | "bcc", recipients: string[]) => {
        const currentRecipients = (nodeData as EmailMessageData).recipients;
        updateNodeData({
          recipients: {
            ...currentRecipients,
            [type]: recipients,
          },
        });
      },
      [nodeData, updateNodeData]
    );

    /** Handle checkbox changes */
    const handleCheckboxChange = useCallback(
      (field: string) => (e: ChangeEvent<HTMLInputElement>) => {
        updateNodeData({ [field]: e.target.checked });
      },
      [updateNodeData]
    );

    /** Handle template ID change */
    const handleTemplateIdChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        updateNodeData({ templateId: e.target.value });
      },
      [updateNodeData]
    );

    /** Handle schedule type change */
    const handleScheduleTypeChange = useCallback(
      (e: ChangeEvent<HTMLSelectElement>) => {
        updateNodeData({
          scheduleType: e.target.value as EmailMessageData["scheduleType"],
        });
      },
      [updateNodeData]
    );

    /** Handle scheduled time change */
    const handleScheduledTimeChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        updateNodeData({ scheduledTime: e.target.value });
      },
      [updateNodeData]
    );

    /** Handle delay minutes change */
    const handleDelayMinutesChangeNumeric = useCallback(
      (numericText: string) => {
        const parsed = Number.parseInt(numericText || "0", 10);
        const clamped = Math.max(0, Math.min(1440, isNaN(parsed) ? 0 : parsed));
        updateNodeData({ delayMinutes: clamped });
      },
      [updateNodeData]
    );

    /** Handle compose message action */
    const handleComposeMessage = useCallback(async () => {
      if (!(token && userEmail)) {
        showError("Authentication required to send messages");
        return;
      }

      // Basic validation
      const hasRecipients = Object.values(recipients).some(
        (arr) => arr.length > 0 && arr.some((email) => email.trim().length > 0)
      );
      if (!hasRecipients) {
        showError("Please add at least one recipient");
        return;
      }

      if (!subject.trim() && !messageContent.trim()) {
        showError("Please add a subject or message content");
        return;
      }

      try {
        updateNodeData({
          connectionStatus: "composing",
          lastError: "",
          retryCount: 0,
        });

        // Create message object for JSON output
        const messageObject = {
          messageContent,
          messageType,
          subject,
          priority,
          recipients: {
            to: recipients.to.filter((email) => email.trim().length > 0),
            cc: recipients.cc.filter((email) => email.trim().length > 0),
            bcc: recipients.bcc.filter((email) => email.trim().length > 0),
          },
          useTemplate,
          templateId: useTemplate ? templateId : undefined,
          scheduleType,
          scheduledTime:
            scheduleType === "scheduled" ? scheduledTime : undefined,
          delayMinutes: scheduleType === "delayed" ? delayMinutes : undefined,
          timestamp: new Date().toISOString(),
          userEmail,
          connectedEmailData,
        };

        // Simulate composition process
        await new Promise((resolve) => setTimeout(resolve, 500));

        updateNodeData({
          connectionStatus: "sending",
        });

        // Simulate sending
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Update outputs for downstream consumption
        // [Explanation], basically emit structured JSON for downstream nodes
        updateNodeData({
          ["json-output"]: messageObject,
          output: { ["json-output"]: messageObject },
        });

        // Update success state
        updateNodeData({
          connectionStatus: "sent",
          isConnected: true,
          isActive: true,
          lastSent: Date.now(),
          sentCount: sentCount + 1,
          statusOutput: true,
          jsonOutput: JSON.stringify(messageObject, null, 2),
        });

        showSuccess("Message composed and ready for sending");
      } catch (error) {
        console.error("Message composition error:", error);
        updateNodeData({
          connectionStatus: "error",
          lastError:
            error instanceof Error
              ? error.message
              : "Failed to compose message",
          retryCount: retryCount + 1,
        });
        showError(
          "Failed to compose message",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }, [
      token,
      userEmail,
      recipients,
      subject,
      messageContent,
      messageType,
      priority,
      useTemplate,
      templateId,
      scheduleType,
      scheduledTime,
      delayMinutes,
      sentCount,
      retryCount,
      connectedEmailData,
      updateNodeData,
      showSuccess,
      showError,
    ]);

    /** Auto-run composition when trigger-input turns true */
    useEffect(() => {
      if (triggerSignal !== "true") return; // [Explanation], basically only act on rising edge
      const busy =
        connectionStatus === "composing" || connectionStatus === "sending";
      if (busy) return;
      void handleComposeMessage();
    }, [triggerSignal, connectionStatus, handleComposeMessage]);

    // -------------------------------------------------------------------------
    // 4.7  Effects
    // -------------------------------------------------------------------------

    /**
     * Reset node state on logout or when the authenticated user changes
     * [Explanation], basically clear message data and outputs when auth changes
     */
    const _prevUserEmailRef = useRef<string>(userEmail);
    const _prevTokenRef = useRef<string | null>(token ?? null);
    useEffect(() => {
      const prevEmail = _prevUserEmailRef.current;
      const prevToken = _prevTokenRef.current;
      const tokenChanged = prevToken !== (token ?? null);
      const emailChanged = prevEmail !== userEmail;
      if (tokenChanged || emailChanged) {
        // Only write if something actually differs
        const diffs: Partial<EmailMessageData> = {};
        const curr = nodeData as EmailMessageData;
        (
          Object.keys(RESET_ON_LOGOUT_DATA) as Array<keyof EmailMessageData>
        ).forEach((k) => {
          const nextVal = (RESET_ON_LOGOUT_DATA as any)[k];
          if ((curr as any)[k] !== nextVal) (diffs as any)[k] = nextVal;
        });
        if (Object.keys(diffs).length) updateNodeData(diffs);
        _prevUserEmailRef.current = userEmail;
        _prevTokenRef.current = token ?? null;
      }
    }, [userEmail, token, updateNodeData, nodeData]);

    /** Sync email input with connected data */
    useEffect(() => {
      const curr = nodeData as EmailMessageData;
      if (curr.emailInput !== connectedEmailData) {
        updateNodeData({ emailInput: connectedEmailData });
      }
    }, [connectedEmailData, nodeData, updateNodeData]);

    /** Monitor message content and update active state */
    useEffect(() => {
      const hasContent = Boolean(
        messageContent?.trim() ||
          subject?.trim() ||
          Object.values(recipients).some((arr) => arr.length > 0)
      );

      // If disabled, always set isActive to false
      if (!isEnabled) {
        if (isActive) updateNodeData({ isActive: false });
      } else {
        if (isActive !== hasContent) {
          updateNodeData({ isActive: hasContent });
        }
      }
    }, [
      messageContent,
      subject,
      recipients,
      isEnabled,
      isActive,
      updateNodeData,
    ]);

    /** Update output when connection state changes */
    useEffect(() => {
      const curr = nodeData as EmailMessageData;
      const nextActive = Boolean(isEnabled && isConnected);
      const nextStatus = nextActive;
      if (curr.statusOutput !== nextStatus || curr.isActive !== nextActive) {
        updateNodeData({ statusOutput: nextStatus, isActive: nextActive });
      }
    }, [isEnabled, isConnected, updateNodeData, nodeData]);

    /**
     * Clear outputs when connection is lost
     * [Explanation], basically wipe node outputs after disconnect to avoid stale data
     */
    useEffect(() => {
      const wasConnected = _prevIsConnectedRef.current;

      // Only clear when transitioning from connected -> disconnected
      if (wasConnected && !isConnected) {
        // Clear any local indicators
        const curr = nodeData as EmailMessageData;
        if (curr.jsonOutput !== "" || curr.output !== "") {
          updateNodeData({
            jsonOutput: "",
            output: "",
            ["json-output"]: null, // [Explanation], basically clear handle output
          });
        }
      }

      _prevIsConnectedRef.current = isConnected;
    }, [isConnected, nodeData, updateNodeData]);

    // -------------------------------------------------------------------------
    // 4.8a  Generate unified handle-based output map
    // -------------------------------------------------------------------------
    const _lastHandleMapRef = useRef<Map<string, unknown> | null>(null);
    useEffect(() => {
      try {
        const map = generateoutputField(spec, nodeData as any);
        if (!(map instanceof Map)) return;
        const prev = _lastHandleMapRef.current;
        let changed = true;
        if (prev && prev instanceof Map) {
          changed =
            prev.size !== map.size ||
            !Array.from(map.entries()).every(([k, v]) => prev.get(k) === v);
        }
        if (changed) {
          _lastHandleMapRef.current = map;
          updateNodeData({ output: Object.fromEntries(map.entries()) });
        }
      } catch {}
    }, [
      spec.handles,
      (nodeData as any)["json-output"],
      (nodeData as EmailMessageData).isActive,
      (nodeData as EmailMessageData).isEnabled,
      updateNodeData,
    ]);

    // -------------------------------------------------------------------------
    // 4.9  Validation
    // -------------------------------------------------------------------------
    const validation = useMemo(() => validateNodeData(nodeData), [nodeData]);
    if (!validation.success) {
      reportValidationError("EmailMessage", id, validation.errors, {
        originalData: validation.originalData,
        component: "EmailMessageNode",
      });
    }

    useNodeDataValidation(
      EmailMessageDataSchema,
      "EmailMessage",
      validation.data,
      id
    );

    // -------------------------------------------------------------------------
    // 4.10  Render
    // -------------------------------------------------------------------------
    return (
      <>
        <LabelNode
          nodeId={id}
          label={(nodeData as EmailMessageData).label || spec.displayName}
        />

        {isExpanded ? (
          <EmailMessageExpanded
            nodeData={nodeData as EmailMessageData}
            isEnabled={isEnabled as boolean}
            connectionStatus={
              connectionStatus as EmailMessageData["connectionStatus"]
            }
            canSend={
              // Recompute lightweight boolean here to avoid passing many deps
              (isEnabled as boolean) &&
              Boolean(token && userEmail) &&
              (Object.values(recipients).some((arr) => arr.length > 0) ||
                Boolean(subject?.trim() || messageContent?.trim()))
            }
            onMessageContentChange={handleMessageContentChange}
            onMessageTypeChange={handleMessageTypeChange}
            onSubjectChange={handleSubjectChange}
            onPriorityChange={handlePriorityChange}
            onRecipientsChange={handleRecipientsChange}
            onUseTemplateChange={handleCheckboxChange("useTemplate")}
            onTemplateIdChange={handleTemplateIdChange}
            onScheduleTypeChange={handleScheduleTypeChange}
            onScheduledTimeChange={handleScheduledTimeChange}
            onDelayMinutesChange={handleDelayMinutesChangeNumeric}
            onComposeMessage={handleComposeMessage}
          />
        ) : (
          <EmailMessageCollapsed
            nodeData={nodeData as EmailMessageData}
            categoryStyles={categoryStyles}
            onToggleExpand={toggleExpand}
            onComposeMessage={handleComposeMessage}
          />
        )}

        <ExpandCollapseButton
          showUI={isExpanded}
          onToggle={toggleExpand}
          size="sm"
        />
      </>
    );
  },
  (prevProps, nextProps) => {
    // Ignore frequent ReactFlow position/transform changes; re-render when core props change
    return (
      prevProps.id === nextProps.id &&
      prevProps.spec === nextProps.spec &&
      prevProps.data === nextProps.data &&
      prevProps.selected === nextProps.selected
    );
  }
);

// -----------------------------------------------------------------------------
// 5️⃣  High‑order wrapper – inject scaffold with dynamic spec
// -----------------------------------------------------------------------------

const EmailMessageNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec only when the size keys change
  const { expandedSize, collapsedSize } = nodeData as EmailMessageData;
  const dynamicSpec = useMemo(
    () =>
      createDynamicSpec({
        expandedSize,
        collapsedSize,
      } as EmailMessageData),
    [expandedSize, collapsedSize]
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <EmailMessageNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
};

export default EmailMessageNodeWithDynamicSpec;
