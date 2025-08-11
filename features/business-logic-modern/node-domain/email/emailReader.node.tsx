"use client";
/**
 * emailReader NODE – Email inbox parsing and message retrieval
 *
 * • Reads emails from configured email accounts (Gmail, Outlook, IMAP)
 * • Provides message filtering and search capabilities
 * • Supports real-time monitoring and batch processing
 * • Extracts message content, attachments, and metadata
 * • Type-safe with comprehensive error handling and caching
 *
 * Keywords: email-reader, inbox, messages, filtering, real-time
 */

import type { NodeProps, Node as RFNode } from "@xyflow/react";
import {
  type ChangeEvent,
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
import { api } from "@/convex/_generated/api";
import { useFlowMetadataOptional } from "@/features/business-logic-modern/infrastructure/flow-engine/contexts/flow-metadata-context";
// Convex integration
import { useNodeToast } from "@/hooks/useNodeToast";
import { useQuery } from "convex/react";
import { EmailReaderCollapsed } from "./components/EmailReaderCollapsed";
import { EmailReaderExpanded } from "./components/EmailReaderExpanded";
import {
  clearEmailReaderMessagesForNode,
  setEmailReaderMessagesForNode,
} from "./stores/use-email-reader-outputs";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const EmailReaderDataSchema = z
  .object({
    // Account Configuration
    accountId: z.string().default(""),
    provider: z.enum(["gmail", "outlook", "imap", "smtp"]).default("gmail"),

    // Filtering Options
    filters: z
      .object({
        sender: z.array(z.string()).default([]),
        subject: z.string().default(""),
        dateRange: z
          .object({
            from: z.string().optional(),
            to: z.string().optional(),
            relative: z
              .enum(["last24h", "lastWeek", "lastMonth", "all"])
              .default("all"),
          })
          .default({ relative: "all" }),
        readStatus: z.enum(["all", "unread", "read"]).default("all"),
        hasAttachments: z.boolean().default(false),
        contentSearch: z.string().default(""),
      })
      .default({}),

    // Processing Options
    batchSize: z.number().min(1).max(100).default(10),
    maxMessages: z.number().min(1).max(1000).default(50),
    includeAttachments: z.boolean().default(false),
    markAsRead: z.boolean().default(false),

    // Real-time Monitoring
    enableRealTime: z.boolean().default(false),
    checkInterval: z.number().min(1).max(60).default(5), // minutes

    // Output Configuration
    outputFormat: z.enum(["full", "summary", "custom"]).default("summary"),
    customFields: z.array(z.string()).default([]),

    // Connection State
    isConnected: z.boolean().default(false),
    connectionStatus: z
      .enum([
        "idle",
        "connecting",
        "connected",
        "reading",
        "processing",
        "error",
      ])
      .default("idle"),
    lastSync: z.number().optional(),
    processedCount: z.number().default(0),

    // Error Handling
    lastError: z.string().default(""),
    retryCount: z.number().default(0),

    // UI State
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    expandedSize: SafeSchemas.text("VE2"),
    collapsedSize: SafeSchemas.text("C2"),

    // output
    messages: z.array(z.any()).default([]), // EmailMessage[]
    messageCount: z.number().default(0),
    emailsOutput: z.string().default(""), // JSON string of emails for output
    output: z.string().default(""), // For compatibility with viewText node
    statusOutput: SafeSchemas.boolean(false),
    label: z.string().optional(), // User-editable node label
  })
  .passthrough();

export type EmailReaderData = z.infer<typeof EmailReaderDataSchema>;

const validateNodeData = createNodeValidator(
  EmailReaderDataSchema,
  "EmailReader"
);

// -----------------------------------------------------------------------------
// 2️⃣  Constants
// -----------------------------------------------------------------------------

const CATEGORY_TEXT = {
  EMAIL: {
    primary: "text-[--node-email-text]",
  },
} as const;

// [Explanation], basically view layout tokens kept within subcomponents for consistency

/**
 * RESET_ON_LOGOUT_DATA – fields cleared on logout or user switch
 * [Explanation], basically return node to idle state when auth changes
 */
const RESET_ON_LOGOUT_DATA: Partial<EmailReaderData> = {
  accountId: "",
  isConnected: false,
  connectionStatus: "idle",
  messages: [],
  messageCount: 0,
  emailsOutput: "",
  output: "",
  statusOutput: false,
  isActive: false,
  lastError: "",
  retryCount: 0,
};

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

function createDynamicSpec(data: EmailReaderData): NodeSpec {
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
    TRIGGER_IN: "Trigger",
    ACCOUNT_IN: "Account",
    MESSAGES_OUT: "Messages",
    COUNT_OUT: "Count",
    STATUS_OUT: "Status",
  } as const;

  return {
    kind: "emailReader",
    displayName: "Email Reader",
    label: "Email Reader",
    category: CATEGORIES.EMAIL,
    size: { expanded, collapsed },
    handles: [
      {
        id: "trigger-input",
        code: "b",
        position: "top",
        type: "target",
        dataType: "Boolean",
        tooltip: HANDLE_TOOLTIPS.TRIGGER_IN,
      },
      {
        id: "account-input",
        code: "j",
        position: "left",
        type: "target",
        dataType: "JSON",
        tooltip: HANDLE_TOOLTIPS.ACCOUNT_IN,
      },
      {
        id: "messages-output",
        code: "a",
        position: "right",
        type: "source",
        dataType: "Array",
        tooltip: HANDLE_TOOLTIPS.MESSAGES_OUT,
      },
      {
        id: "count-output",
        code: "n",
        position: "bottom",
        type: "source",
        dataType: "Number",
        tooltip: HANDLE_TOOLTIPS.COUNT_OUT,
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
    inspector: { key: "EmailReaderInspector" },
    version: 1,
    runtime: { execute: "emailReader_execute_v1" },
    initialData: createSafeInitialData(EmailReaderDataSchema, {
      accountId: "",
      provider: "gmail",
      filters: {
        sender: [],
        subject: "",
        dateRange: { relative: "all" },
        readStatus: "all",
        hasAttachments: false,
        contentSearch: "",
      },
      batchSize: 5,
      maxMessages: 5,
      includeAttachments: false,
      markAsRead: false,
      enableRealTime: false,
      checkInterval: 5,
      outputFormat: "summary",
      customFields: [],
      isConnected: false,
      connectionStatus: "idle",
      processedCount: 0,
      lastError: "",
      retryCount: 0,
      messages: [],
      messageCount: 0,
      emailsOutput: "",
      output: "",
      statusOutput: false,
    }),
    dataSchema: EmailReaderDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "batchSize",
        "messages",
        "messageCount",
        "emailsOutput",
        "output",
        "statusOutput",
        "expandedSize",
        "collapsedSize",
        "connectionStatus",
        "lastSync",
        "processedCount",
        "lastError",
        "retryCount",
        "isConnected",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        {
          key: "accountId",
          type: "text",
          label: "Email Account",
          placeholder: "Select email account...",
        },
        // Hide granular knobs and expose a single user-friendly control
        // [Explanation], basically we’ll drive both values from one field in the node UI
        {
          key: "maxMessages",
          type: "number",
          label: "# of Emails",
          placeholder: "10",
        },
        {
          key: "includeAttachments",
          type: "boolean",
          label: "Include Attachments",
        },
        { key: "markAsRead", type: "boolean", label: "Mark as Read" },
        {
          key: "enableRealTime",
          type: "boolean",
          label: "Real-time Monitoring",
        },
        {
          key: "checkInterval",
          type: "number",
          label: "Check Interval (min)",
          placeholder: "5",
        },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuMail",
    author: "Agenitix Team",
    description:
      "Read and process emails from configured email accounts with filtering and real-time monitoring",
    feature: "email",
    tags: ["email", "inbox", "messages", "filtering", "real-time"],
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE2",
  collapsedSize: "C2",
} as EmailReaderData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const EmailReaderNode = memo(
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
      accountId,
      // provider, // unused but kept for potential future use
      // filters, // unused but kept for potential future use
      batchSize,
      maxMessages,
      includeAttachments,
      markAsRead,
      enableRealTime,
      checkInterval,
      // outputFormat, // unused
      connectionStatus,
      isConnected,
      lastSync,
      processedCount,
      messageCount,
      lastError,
      retryCount,
    } = nodeData as EmailReaderData;

    // Targeted selectors: avoid broad dependency on nodes/edges arrays
    // Track only the edges connected to 'account-input' handle
    const accountInputEdgesSignature = useStore(
      (s) => {
        const edges = s.edges.filter(
          (e) => e.target === id && e.targetHandle?.startsWith("account-input")
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
    const { showSuccess, showError } = useNodeToast(id);

    // Keep last emitted output to avoid redundant writes
    const _lastOutputRef = useRef<string | null>(null);
    const _prevIsConnectedRef = useRef<boolean>(
      (nodeData as EmailReaderData).isConnected
    );

    // -------------------------------------------------------------------------
    // 4.3  Convex integration
    // -------------------------------------------------------------------------
    const { user, authToken: token } = useAuth();
    const flowMetadata = useFlowMetadataOptional();
    const flowId = String(flowMetadata?.flow?.id ?? "");
    const canEdit = flowMetadata?.flow?.canEdit ?? true;
    const userEmail = user?.email ?? "";

    // Fetch email accounts for both owners and viewers - viewers can use their own accounts
    const emailQueryArgs = useMemo(
      () => (userEmail ? { userEmail } : "skip"),
      [userEmail]
    );
    const emailAccounts = useQuery(
      api.emailAccounts.getEmailAccountsByUserEmail,
      emailQueryArgs
    );

    // -------------------------------------------------------------------------
    // 4.4  Get connected email account nodes
    // -------------------------------------------------------------------------
    const connectedAccountIds = useStore(
      (s) => {
        const incomingEdges = s.edges.filter(
          (e) => e.target === id && e.targetHandle?.startsWith("account-input")
        );
        if (incomingEdges.length === 0) return [] as string[];
        const ids = new Set<string>();
        for (const edge of incomingEdges) {
          const sourceNode = (s.nodes as RFNode[]).find(
            (n: RFNode) => n.id === edge.source
          );
          const output = (sourceNode?.data?.output ?? {}) as Record<
            string,
            unknown
          >;
          const explicit = output["account-output"] as
            | Record<string, unknown>
            | undefined;
          if (explicit && typeof explicit === "object") {
            const maybeId = (explicit as any).accountId;
            if (typeof maybeId === "string" && maybeId.length > 0)
              ids.add(maybeId);
          } else if (edge.sourceHandle) {
            const handleId = normalizeHandleId(edge.sourceHandle);
            const val = output[handleId] as Record<string, unknown> | undefined;
            const maybeId = (val as any)?.accountId;
            if (typeof maybeId === "string" && maybeId.length > 0)
              ids.add(maybeId);
          }
        }
        return Array.from(ids).sort();
      },
      (a, b) => a.length === b.length && a.every((v, i) => v === b[i])
    );

    // Whether this node has any incoming edges to the account-input handle
    // [Explanation], basically detect if an Email Account node is wired even if it hasn't emitted outputs yet
    const hasAccountInputEdges = useStore(
      (s) =>
        s.edges.some(
          (e) => e.target === id && e.targetHandle?.startsWith("account-input")
        ),
      Object.is
    );

    // -------------------------------------------------------------------------
    // 4.5  Available accounts (filtered by connected nodes)
    // -------------------------------------------------------------------------
    const availableAccounts = useMemo(() => {
      if (!(emailAccounts && Array.isArray(emailAccounts))) {
        return [];
      }

      // Primary path: restrict to accounts emitted by connected Email Account nodes
      if (connectedAccountIds.length > 0) {
        const filtered = emailAccounts.filter((account) =>
          connectedAccountIds.includes(account._id)
        );
        return filtered.map((account) => ({
          value: account._id,
          label: `${account.display_name} (${account.email})`,
          provider: account.provider,
          email: account.email,
          isActive: account.is_active,
          isConnected:
            account.is_active && account.connection_status === "connected",
          lastValidated: account.last_validated,
        }));
      }

      // Fallback: if wires exist but upstream hasn't emitted yet, surface user's connected accounts
      // [Explanation], basically use DB state to populate options immediately after login
      if (hasAccountInputEdges) {
        const connectedOnly = emailAccounts.filter(
          (account) =>
            account.is_active && account.connection_status === "connected"
        );
        const source = connectedOnly.length > 0 ? connectedOnly : emailAccounts;
        return source.map((account) => ({
          value: account._id,
          label: `${account.display_name} (${account.email})`,
          provider: account.provider,
          email: account.email,
          isActive: account.is_active,
          isConnected:
            account.is_active && account.connection_status === "connected",
          lastValidated: account.last_validated,
        }));
      }

      // No wires, no outputs
      return [];
    }, [emailAccounts, connectedAccountIds, hasAccountInputEdges]);

    // -------------------------------------------------------------------------
    // 4.5  Callbacks
    // -------------------------------------------------------------------------

    /** Toggle between collapsed / expanded */
    const toggleExpand = useCallback(() => {
      updateNodeData({ isExpanded: !isExpanded });
    }, [isExpanded, updateNodeData]);

    /** Handle account selection */
    const handleAccountChange = useCallback(
      (e: ChangeEvent<HTMLSelectElement>) => {
        const selectedAccountId = e.target.value;
        const selectedAccount = availableAccounts.find(
          (acc) => acc.value === selectedAccountId
        );

        updateNodeData({
          accountId: selectedAccountId,
          provider: selectedAccount?.provider || "gmail",
          connectionStatus: selectedAccountId ? "idle" : "idle",
          isConnected: false,
          lastError: "",
        });
      },
      [availableAccounts, updateNodeData]
    );

    /** Handle total emails change (drives both batchSize and maxMessages) */
    const handleBatchSizeChangeNumeric = useCallback(
      (numericText: string) => {
        const parsed = Number.parseInt(numericText || "1", 10);
        const clamped = Math.max(1, Math.min(100, isNaN(parsed) ? 1 : parsed));
        updateNodeData({ batchSize: clamped });
      },
      [updateNodeData]
    );
    const handleMaxMessagesChangeNumeric = useCallback(
      (numericText: string) => {
        const parsed = Number.parseInt(numericText || "1", 10);
        // Clamp total to larger bound but keep batch within its own max (100)
        const clampedTotal = Math.max(
          1,
          Math.min(1000, isNaN(parsed) ? 1 : parsed)
        );
        const clampedBatch = Math.max(1, Math.min(100, clampedTotal));
        updateNodeData({ maxMessages: clampedTotal, batchSize: clampedBatch });
      },
      [updateNodeData]
    );

    /** Handle checkbox changes */
    const handleCheckboxChange = useCallback(
      (field: string) => (e: ChangeEvent<HTMLInputElement>) => {
        updateNodeData({ [field]: e.target.checked });
      },
      [updateNodeData]
    );

    /** Handle check interval change */
    const handleCheckIntervalChangeNumeric = useCallback(
      (numericText: string) => {
        const parsed = Number.parseInt(numericText || "1", 10);
        const clamped = Math.max(1, Math.min(60, isNaN(parsed) ? 1 : parsed));
        updateNodeData({ checkInterval: clamped });
      },
      [updateNodeData]
    );

    /** Handle read messages action */
    const handleReadMessages = useCallback(async () => {
      if (!(accountId && token)) {
        showError("Please select an email account first");
        return;
      }

      try {
        updateNodeData({
          connectionStatus: "reading",
          lastError: "",
          retryCount: 0,
        });

        // Get the selected account details
        const account = emailAccounts?.find((acc) => acc._id === accountId);
        if (!account) {
          throw new Error("Account not found");
        }

        // Parse credentials
        let credentials;
        try {
          credentials = JSON.parse(account.encrypted_credentials || "{}");
        } catch {
          throw new Error("Invalid account credentials");
        }

        // Import the appropriate provider
        let provider;
        switch (account.provider) {
          case "gmail":
            const { gmailProvider } = await import("./providers/gmail");
            provider = gmailProvider;
            break;
          default:
            throw new Error(`Provider ${account.provider} not supported yet`);
        }

        // Read emails using the provider
        const emails = await provider.readEmails({
          accessToken: credentials.accessToken,
          folder: "INBOX", // Default folder
          limit: batchSize,
        });

        // Format emails for better readability
        const formattedEmails = emails.map((email, index) => ({
          [`Email ${index + 1}`]: {
            From: `${email.from.name || email.from.email} <${email.from.email}>`,
            Subject: email.subject,
            Date: new Date(email.date).toLocaleString(),
            Preview:
              email.snippet.substring(0, 100) +
              (email.snippet.length > 100 ? "..." : ""),
            IsRead: email.isRead ? "Yes" : "No",
            HasAttachments: email.hasAttachments
              ? `Yes (${email.attachments.length})`
              : "No",
            Content:
              email.textContent.substring(0, 200) +
              (email.textContent.length > 200 ? "..." : ""),
          },
        }));

        // Store heavy payload outside node.data to avoid React Flow lag
        setEmailReaderMessagesForNode(
          flowId,
          id,
          emails as unknown as Array<Record<string, unknown>>
        );

        // Emit handle-specific output for downstream nodes (e.g. ViewArray)
        // [Explanation], basically write to the source handle key so unified input readers can find it
        updateNodeData({
          ["messages-output"]: emails,
          // Also publish unified output map immediately for consumers that read synchronously
          output: { ["messages-output"]: emails },
        });

        // Persist only lightweight metadata in node.data
        updateNodeData({
          connectionStatus: "connected",
          isConnected: true,
          isActive: true, // propagate status only
          lastSync: Date.now(),
          processedCount: processedCount + emails.length,
          messageCount: emails.length,
          statusOutput: true,
          // Intentionally omit: messages, emailsOutput, heavy output strings
        });

        showSuccess(`Read ${emails.length} messages successfully`);
      } catch (error) {
        console.error("Message reading error:", error);
        updateNodeData({
          connectionStatus: "error",
          lastError:
            error instanceof Error ? error.message : "Failed to read messages",
          retryCount: retryCount + 1,
        });
        showError(
          "Failed to read messages",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }, [
      accountId,
      token,
      batchSize,
      processedCount,
      retryCount,
      updateNodeData,
      emailAccounts,
    ]);

    // -------------------------------------------------------------------------
    // 4.6  Effects
    // -------------------------------------------------------------------------

    /**
     * Reset node state on logout or when the authenticated user changes
     * [Explanation], basically clear selected account and outputs when auth changes
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
        const diffs: Partial<EmailReaderData> = {};
        const curr = nodeData as EmailReaderData;
        (
          Object.keys(RESET_ON_LOGOUT_DATA) as Array<keyof EmailReaderData>
        ).forEach((k) => {
          const nextVal = (RESET_ON_LOGOUT_DATA as any)[k];
          if ((curr as any)[k] !== nextVal) (diffs as any)[k] = nextVal;
        });
        if (Object.keys(diffs).length) updateNodeData(diffs);
        // Clear ephemeral outputs cache for this node on auth change
        try {
          clearEmailReaderMessagesForNode(flowId, id);
        } catch {}
        _prevUserEmailRef.current = userEmail;
        _prevTokenRef.current = token ?? null;
      }
    }, [userEmail, token, updateNodeData, nodeData, flowId, id]);

    /**
     * Auto-select a connected account when available
     * [Explanation], basically choose the first connected account (or first available) if none is selected or current is invalid
     */
    useEffect(() => {
      if (!Array.isArray(availableAccounts) || availableAccounts.length === 0) {
        return;
      }

      const hasValidCurrent = availableAccounts.some(
        (acc) => acc.value === accountId
      );
      if (hasValidCurrent && accountId) {
        return;
      }

      const preferred =
        availableAccounts.find((acc) => acc.isConnected) ??
        availableAccounts[0];
      if (preferred) {
        const next = {
          accountId: preferred.value,
          provider: (preferred.provider ||
            "gmail") as EmailReaderData["provider"],
          connectionStatus: "idle" as const,
          isConnected: false,
          lastError: "",
        } satisfies Partial<EmailReaderData>;
        const curr = nodeData as EmailReaderData;
        const hasDiff =
          curr.accountId !== next.accountId ||
          curr.provider !== next.provider ||
          curr.connectionStatus !== next.connectionStatus ||
          curr.isConnected !== next.isConnected ||
          curr.lastError !== next.lastError;
        if (hasDiff) updateNodeData(next);
      }
    }, [availableAccounts, accountId, updateNodeData, nodeData]);

    /** Update output when message state changes */
    useEffect(() => {
      const curr = nodeData as EmailReaderData;
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
        const curr = nodeData as EmailReaderData;
        if (
          curr.messageCount !== 0 ||
          curr.emailsOutput !== "" ||
          curr.output !== ""
        ) {
          updateNodeData({
            messageCount: 0,
            emailsOutput: "",
            output: "",
            ["messages-output"]: [], // [Explanation], basically clear handle output array
          });
        }
        // Clear heavy payload from the ephemeral store
        try {
          clearEmailReaderMessagesForNode(flowId, id);
        } catch {}
      }

      _prevIsConnectedRef.current = isConnected;
    }, [isConnected, nodeData, updateNodeData, flowId, id]);

    // -------------------------------------------------------------------------
    // 4.7a  Generate unified handle-based output map
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
      (nodeData as any)["messages-output"],
      (nodeData as EmailReaderData).isActive,
      (nodeData as EmailReaderData).isEnabled,
      updateNodeData,
    ]);

    // -------------------------------------------------------------------------
    // 4.7  Validation
    // -------------------------------------------------------------------------
    const validation = useMemo(() => validateNodeData(nodeData), [nodeData]);
    if (!validation.success) {
      reportValidationError("EmailReader", id, validation.errors, {
        originalData: validation.originalData,
        component: "EmailReaderNode",
      });
    }

    useNodeDataValidation(
      EmailReaderDataSchema,
      "EmailReader",
      validation.data,
      id
    );

    // -------------------------------------------------------------------------
    // 4.8  Render
    // -------------------------------------------------------------------------
    return (
      <>
        <LabelNode
          nodeId={id}
          label={(nodeData as EmailReaderData).label || spec.displayName}
        />

        {isExpanded ? (
          <EmailReaderExpanded
            nodeData={nodeData as EmailReaderData}
            isEnabled={isEnabled as boolean}
            connectionStatus={
              connectionStatus as EmailReaderData["connectionStatus"]
            }
            availableAccounts={availableAccounts}
            onAccountChange={handleAccountChange}
            onBatchSizeChange={handleBatchSizeChangeNumeric}
            onMaxMessagesChange={handleMaxMessagesChangeNumeric}
            onIncludeAttachmentsChange={handleCheckboxChange(
              "includeAttachments"
            )}
            onMarkAsReadChange={handleCheckboxChange("markAsRead")}
            onEnableRealTimeChange={handleCheckboxChange("enableRealTime")}
            onCheckIntervalChange={handleCheckIntervalChangeNumeric}
            onReadMessages={handleReadMessages}
          />
        ) : (
          <EmailReaderCollapsed
            nodeData={nodeData as EmailReaderData}
            categoryStyles={categoryStyles}
            onToggleExpand={toggleExpand}
            onReadMessages={handleReadMessages}
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

const EmailReaderNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec only when the size keys change
  const { expandedSize, collapsedSize } = nodeData as EmailReaderData;
  const dynamicSpec = useMemo(
    () =>
      createDynamicSpec({
        expandedSize,
        collapsedSize,
      } as EmailReaderData),
    [expandedSize, collapsedSize]
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <EmailReaderNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
};

export default EmailReaderNodeWithDynamicSpec;
