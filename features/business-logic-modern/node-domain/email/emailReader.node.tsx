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
import { Handle, Position, useReactFlow, useStore } from "@xyflow/react";

import { useAuthContext } from "@/components/auth/AuthProvider";
import { api } from "@/convex/_generated/api";
// Convex integration
import { useQuery } from "convex/react";
import { toast } from "sonner";
import { useFlowMetadataOptional } from "@/features/business-logic-modern/infrastructure/flow-engine/contexts/flow-metadata-context";

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

const CONTENT = {
  expanded: "p-4 w-full h-full flex flex-col",
  collapsed: "flex items-center justify-center w-full h-full",
  header: "flex items-center justify-between mb-3",
  body: "flex-1 flex flex-col gap-3",
  disabled:
    "opacity-75 bg-zinc-100 dark:bg-zinc-500 rounded-md transition-all duration-300",
} as const;

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

  return {
    kind: "emailReader",
    displayName: "Email Reader",
    label: "Email Reader",
    category: CATEGORIES.EMAIL,
    size: { expanded, collapsed },
    handles: [
      {
        id: "trigger-input",
        code: "t",
        position: "top",
        type: "target",
        dataType: "Boolean",
      },
      {
        id: "account-input",
        code: "a",
        position: "left",
        type: "target",
        dataType: "JSON",
      },
      {
        id: "messages-output",
        code: "m",
        position: "right",
        type: "source",
        dataType: "Array",
      },
      {
        id: "count-output",
        code: "c",
        position: "bottom",
        type: "source",
        dataType: "Number",
      },
      {
        id: "status-output",
        code: "s",
        position: "bottom",
        type: "source",
        dataType: "Boolean",
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
      batchSize: 10,
      maxMessages: 50,
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
        {
          key: "batchSize",
          type: "number",
          label: "Batch Size",
          placeholder: "10",
        },
        {
          key: "maxMessages",
          type: "number",
          label: "Max Messages",
          placeholder: "50",
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

const EmailReaderNode = memo(({ id, spec }: NodeProps & { spec: NodeSpec }) => {
  // -------------------------------------------------------------------------
  const { nodeData, updateNodeData } = useNodeData(id, {});

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

  console.log("🚀 EmailReader render:", { id, accountId, isConnected });

  const categoryStyles = CATEGORY_TEXT.EMAIL;

  // Global React‑Flow store (nodes & edges) – triggers re‑render on change
  const _nodes = useStore((s) => s.nodes);
  const _edges = useStore((s) => s.edges);

  // Keep last emitted output to avoid redundant writes
  const _lastOutputRef = useRef<string | null>(null);

  // -------------------------------------------------------------------------
  // 4.3  Convex integration
  // -------------------------------------------------------------------------
  const { user, authToken: token } = useAuthContext();
  const flowMetadata = useFlowMetadataOptional();
  const canEdit = flowMetadata?.flow?.canEdit ?? true;

  // Fetch email accounts for both owners and viewers - viewers can use their own accounts
  const emailAccounts = useQuery(
    api.emailAccounts.getEmailAccountsByUserEmail,
    // Use hybrid auth: prefer token_hash, fallback to userEmail
    token
      ? { token_hash: token }
      : user?.email
        ? { userEmail: user.email }
        : "skip"
  );

  // -------------------------------------------------------------------------
  // 4.4  Get connected email account nodes
  // -------------------------------------------------------------------------
  const { getNodes, getEdges } = useReactFlow();

  console.log("🔍 About to check connections for node:", id);

  const connectedAccountIds = useMemo(() => {
    const edges = _edges.filter(
      (e) => e.target === id && e.targetHandle === "account-input__a"
    );

    console.log("🔍 EmailReader Debug - ALL EDGES:");
    _edges.forEach((edge, i) => {
      console.log(`Edge ${i}:`, {
        source: edge.source,
        target: edge.target,
        targetHandle: edge.targetHandle,
        sourceHandle: edge.sourceHandle,
        matchesThisNode: edge.target === id,
      });
    });
    console.log('🔍 Looking for targetHandle: "account-input"');
    console.log("🔍 This node ID:", id);

    const connectedAccountNodes = edges
      .map((e) => {
        const sourceNode = _nodes.find((n) => n.id === e.source);
        console.log(
          "🔍 Source node found:",
          sourceNode?.id,
          sourceNode?.type,
          sourceNode?.data
        );
        return sourceNode;
      })
      .filter(Boolean)
      .filter((n) => {
        const isValid =
          n?.type === "emailAccount" &&
          n?.data?.isConnected &&
          n?.data?.accountId;
        console.log("🔍 Node validation:", {
          nodeId: n?.id,
          type: n?.type,
          isConnected: n?.data?.isConnected,
          accountId: n?.data?.accountId,
          isValid,
        });
        return isValid;
      });

    const accountIds = connectedAccountNodes
      .map((node) => node?.data?.accountId)
      .filter(Boolean);
    console.log("🔍 Connected account IDs:", accountIds);
    return accountIds;
  }, [_nodes, _edges, id]);

  // -------------------------------------------------------------------------
  // 4.5  Available accounts (filtered by connected nodes)
  // -------------------------------------------------------------------------
  const availableAccounts = useMemo(() => {
    console.log("📊 EmailReader availableAccounts debug:", {
      emailAccountsCount: emailAccounts?.length || 0,
      connectedAccountIds,
      canEdit,
      isPublicWorkflow: !canEdit,
      emailAccounts: emailAccounts?.map((acc) => ({
        id: acc._id,
        email: acc.email,
        displayName: acc.display_name,
      })),
    });

    if (!(emailAccounts && Array.isArray(emailAccounts))) {
      console.log("📊 No email accounts available");
      return [];
    }

    // Only show accounts from connected nodes (no fallback to all accounts)
    if (connectedAccountIds.length === 0) {
      console.log("📊 No connected account IDs");
      return []; // No connections = no available accounts
    }

    // Filter to show only accounts from connected nodes
    const filteredAccounts = emailAccounts.filter((account) => {
      const isIncluded = connectedAccountIds.includes(account._id);
      console.log("📊 Account filter:", {
        accountId: account._id,
        email: account.email,
        isIncluded,
        connectedIds: connectedAccountIds,
      });
      return isIncluded;
    });

    console.log("📊 Filtered accounts:", filteredAccounts.length);

    return filteredAccounts.map((account) => ({
      value: account._id,
      label: `${account.display_name} (${account.email})`,
      provider: account.provider,
      email: account.email,
      isActive: account.is_active,
      isConnected:
        account.is_active && account.connection_status === "connected",
      lastValidated: account.last_validated,
    }));
  }, [emailAccounts, connectedAccountIds]);

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

  /** Handle batch size change */
  const handleBatchSizeChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = Number.parseInt(e.target.value) || 10;
      updateNodeData({ batchSize: Math.max(1, Math.min(100, value)) });
    },
    [updateNodeData]
  );

  /** Handle max messages change */
  const handleMaxMessagesChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = Number.parseInt(e.target.value) || 50;
      updateNodeData({ maxMessages: Math.max(1, Math.min(1000, value)) });
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
  const handleCheckIntervalChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = Number.parseInt(e.target.value) || 5;
      updateNodeData({ checkInterval: Math.max(1, Math.min(60, value)) });
    },
    [updateNodeData]
  );

  /** Handle read messages action */
  const handleReadMessages = useCallback(async () => {
    if (!(accountId && token)) {
      toast.error("Please select an email account first");
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

      console.log("📧 Emails fetched:", emails);

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

      updateNodeData({
        connectionStatus: "connected",
        isConnected: true,
        isActive: true, // Activar el nodo para que propague datos
        lastSync: Date.now(),
        processedCount: processedCount + emails.length,
        messageCount: emails.length,
        messages: emails,
        emailsOutput: JSON.stringify(emails), // Raw data
        output: JSON.stringify(formattedEmails, null, 2), // Formatted for viewText
        statusOutput: true,
      });

      toast.success(`Read ${emails.length} messages successfully`);
    } catch (error) {
      console.error("Message reading error:", error);
      updateNodeData({
        connectionStatus: "error",
        lastError:
          error instanceof Error ? error.message : "Failed to read messages",
        retryCount: retryCount + 1,
      });
      toast.error("Failed to read messages", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
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

  /** Update output when message state changes */
  useEffect(() => {
    if (isEnabled && isConnected) {
      updateNodeData({
        statusOutput: true,
        isActive: true,
      });
    } else {
      updateNodeData({
        statusOutput: false,
        isActive: false,
      });
    }
  }, [isEnabled, isConnected, messageCount, updateNodeData]);

  // -------------------------------------------------------------------------
  // 4.7  Validation
  // -------------------------------------------------------------------------
  const validation = validateNodeData(nodeData);
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
      {/* Input handle for email account connection */}
      <Handle
        type="target"
        position={Position.Left}
        id="account-input"
        style={{
          background: "#555",
          width: 8,
          height: 8,
          top: 20,
        }}
      />

      {/* Editable label */}
      <LabelNode
        nodeId={id}
        label={(nodeData as EmailReaderData).label || spec.displayName}
      />

      {isExpanded ? (
        <div
          className={`${CONTENT.expanded} ${isEnabled ? "" : CONTENT.disabled}`}
        >
          <div className={CONTENT.header}>
            <span className="font-medium text-sm">Email Reader</span>
            <div
              className={`text-xs ${connectionStatus === "connected" ? "text-green-600" : connectionStatus === "error" ? "text-red-600" : "text-gray-600"}`}
            >
              {connectionStatus === "reading"
                ? "📖"
                : connectionStatus === "connected"
                  ? "✓"
                  : connectionStatus === "error"
                    ? "✗"
                    : "○"}{" "}
              {connectionStatus}
            </div>
          </div>

          <div className={`${CONTENT.body} max-h-[400px] overflow-y-auto`}>
            {/* Account Selection */}
            <div>
              <label
                htmlFor="email-account-select"
                className="mb-1 block text-gray-600 text-xs"
              >
                Email Account:
              </label>
              <select
                id="email-account-select"
                value={accountId}
                onChange={handleAccountChange}
                className="w-full rounded border border-gray-300 p-2 text-xs"
                disabled={!isEnabled || connectionStatus === "reading"}
              >
                <option value="">Select email account...</option>
                {availableAccounts.map((account) => (
                  <option
                    key={account.value}
                    value={account.value}
                    disabled={!account.isActive}
                  >
                    {account.label} {account.isActive ? "" : "(inactive)"}
                  </option>
                ))}
              </select>
            </div>

            {/* Processing Options */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label
                  htmlFor="batch-size-input"
                  className="mb-1 block text-gray-600 text-xs"
                >
                  Batch Size:
                </label>
                <input
                  id="batch-size-input"
                  type="number"
                  value={batchSize}
                  onChange={handleBatchSizeChange}
                  min="1"
                  max="100"
                  className="w-full rounded border border-gray-300 p-2 text-xs"
                  disabled={!isEnabled || connectionStatus === "reading"}
                />
              </div>
              <div>
                <label
                  htmlFor="max-messages-input"
                  className="mb-1 block text-gray-600 text-xs"
                >
                  Max Messages:
                </label>
                <input
                  id="max-messages-input"
                  type="number"
                  value={maxMessages}
                  onChange={handleMaxMessagesChange}
                  min="1"
                  max="1000"
                  className="w-full rounded border border-gray-300 p-2 text-xs"
                  disabled={!isEnabled || connectionStatus === "reading"}
                />
              </div>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={includeAttachments}
                  onChange={handleCheckboxChange("includeAttachments")}
                  className="mr-2"
                  disabled={!isEnabled}
                />
                Include Attachments
              </label>
              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={markAsRead}
                  onChange={handleCheckboxChange("markAsRead")}
                  className="mr-2"
                  disabled={!isEnabled}
                />
                Mark as Read
              </label>
              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={enableRealTime}
                  onChange={handleCheckboxChange("enableRealTime")}
                  className="mr-2"
                  disabled={!isEnabled}
                />
                Real-time Monitoring
              </label>
            </div>

            {/* Real-time Interval */}
            {enableRealTime && (
              <div>
                <label
                  htmlFor="check-interval-input"
                  className="mb-1 block text-gray-600 text-xs"
                >
                  Check Interval (minutes):
                </label>
                <input
                  id="check-interval-input"
                  type="number"
                  value={checkInterval}
                  onChange={handleCheckIntervalChange}
                  min="1"
                  max="60"
                  className="w-full rounded border border-gray-300 p-2 text-xs"
                  disabled={!isEnabled}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleReadMessages}
                disabled={
                  !(isEnabled && accountId) || connectionStatus === "reading"
                }
                className="flex-1 rounded bg-blue-500 p-2 text-white text-xs hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
              >
                {connectionStatus === "reading"
                  ? "Reading..."
                  : "Read Messages"}
              </button>
            </div>

            {/* Status Information */}
            <div className="rounded bg-gray-50 p-2 text-gray-500 text-xs">
              <div>
                Messages: {messageCount} | Processed: {processedCount}
              </div>
              {lastSync && (
                <div>Last sync: {new Date(lastSync).toLocaleString()}</div>
              )}
              {lastError && (
                <div className="mt-1 text-red-600">Error: {lastError}</div>
              )}
              {retryCount > 0 && (
                <div className="text-yellow-600">Retries: {retryCount}</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`${CONTENT.collapsed} ${isEnabled ? "" : CONTENT.disabled}`}
        >
          <div className="p-2 text-center">
            <div className={`font-mono text-xs ${categoryStyles.primary}`}>
              {accountId ? `${messageCount} messages` : "No account"}
            </div>
            <div
              className={`text-xs ${connectionStatus === "connected" ? "text-green-600" : connectionStatus === "error" ? "text-red-600" : "text-gray-600"}`}
            >
              {connectionStatus === "reading"
                ? "📖"
                : connectionStatus === "connected"
                  ? "✓"
                  : connectionStatus === "error"
                    ? "✗"
                    : "○"}{" "}
              {connectionStatus}
            </div>
          </div>
        </div>
      )}

      <ExpandCollapseButton showUI={isExpanded} onToggle={toggleExpand} />
    </>
  );
});

// -----------------------------------------------------------------------------
// 5️⃣  High‑order wrapper – inject scaffold with dynamic spec
// -----------------------------------------------------------------------------

const EmailReaderNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec only when the size keys change
  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as EmailReaderData),
    [
      (nodeData as EmailReaderData).expandedSize,
      (nodeData as EmailReaderData).collapsedSize,
    ]
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
