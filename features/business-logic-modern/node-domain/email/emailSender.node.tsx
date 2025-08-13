"use client";
/**
 * Route: features/business-logic-modern/node-domain/email/emailSender.node.tsx
 * EmailSender NODE – Email composition and sending with advanced features
 *
 * • Multi-account support with connection validation
 * • Rich text and HTML email composition
 * • File attachment handling with size validation
 * • Batch sending and scheduling capabilities
 * • Delivery tracking and retry mechanisms
 * • Auto-fill from emailCreator and emailReplier nodes
 * • Handle-based output system for workflow integration
 * • Dynamic sizing with expand/collapse functionality
 *
 * Keywords: email-sending, composition, attachments, batch-sending, tracking, handle-system
 */

import type { NodeProps } from "@xyflow/react";
import { useStore } from "@xyflow/react";
import {
  type ChangeEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { z } from "zod";

import { useAuth } from "@/components/auth/AuthProvider";
import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
import { api } from "@/convex/_generated/api";
import { useFlowMetadataOptional } from "@/features/business-logic-modern/infrastructure/flow-engine/contexts/flow-metadata-context";
import {
  generateoutputField,
  normalizeHandleId,
} from "@/features/business-logic-modern/infrastructure/node-core/handleOutputUtils";
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
import { useNodeToast } from "@/hooks/useNodeToast";
import { useAction, useQuery } from "convex/react";
import { toast } from "sonner";
import { EmailSenderCollapsed } from "./components/EmailSenderCollapsed";
import { EmailSenderExpanded } from "./components/EmailSenderExpanded";
import { EmailAccountService } from "./services/emailAccountService";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const EmailSenderDataSchema = z
  .object({
    // Account Configuration
    accountId: z.string().default(""),
    provider: z.enum(["gmail", "outlook", "imap", "smtp"]).default("gmail"),

    // Recipients
    recipients: z
      .object({
        to: z.array(z.string()).default([]),
        cc: z.array(z.string()).default([]),
        bcc: z.array(z.string()).default([]),
      })
      .default({ to: [], cc: [], bcc: [] }),

    // Message Content
    subject: z.string().default(""),
    content: z
      .object({
        text: z.string().default(""),
        html: z.string().default(""),
        useHtml: z.boolean().default(false),
        useTemplate: z.boolean().default(false),
        templateId: z.string().default(""),
        variables: z.record(z.any()).default({}),
      })
      .default({
        text: "",
        html: "",
        useHtml: false,
        useTemplate: false,
        templateId: "",
        variables: {},
      }),

    // Attachments
    attachments: z
      .array(
        z.object({
          id: z.string(),
          filename: z.string(),
          size: z.number(),
          mimeType: z.string(),
          content: z.string().optional(), // Base64 content
          file: z.any().optional(), // File object for UI
        })
      )
      .default([]),
    maxAttachmentSize: z.number().default(25 * 1024 * 1024), // 25MB

    // Sending Options
    sendMode: z.enum(["immediate", "batch", "scheduled"]).default("immediate"),
    batchSize: z.number().min(1).max(100).default(10),
    delayBetweenSends: z.number().min(0).max(60000).default(1000), // milliseconds
    scheduledTime: z.string().optional(),

    // Delivery Tracking
    trackDelivery: z.boolean().default(true),
    trackReads: z.boolean().default(false),
    trackClicks: z.boolean().default(false),

    // Error Handling
    retryAttempts: z.number().min(0).max(5).default(3),
    retryDelay: z.number().min(1000).max(60000).default(5000), // milliseconds
    continueOnError: z.boolean().default(true),

    // Connection State
    isConnected: z.boolean().default(false),
    sendingStatus: z
      .enum(["idle", "composing", "sending", "sent", "error"])
      .default("idle"),

    // Results
    sentCount: z.number().default(0),
    failedCount: z.number().default(0),
    lastSent: z.number().optional(),
    lastError: z.string().default(""),

    // UI State
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    expandedSize: SafeSchemas.text("FE3W"),
    collapsedSize: SafeSchemas.text("C2"),

    // output - unified handle-based output system
    output: z.record(z.string(), z.unknown()).optional(), // handle-based output object for Convex compatibility
    label: z.string().optional(), // User-editable node label
  })
  .passthrough();

export type EmailSenderData = z.infer<typeof EmailSenderDataSchema>;

const validateNodeData = createNodeValidator(
  EmailSenderDataSchema,
  "EmailSender"
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
const RESET_ON_LOGOUT_DATA: Partial<EmailSenderData> = {
  accountId: "",
  isConnected: false,
  sendingStatus: "idle",
  sentCount: 0,
  failedCount: 0,
  lastError: "",
  isActive: false,
};

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

/**
 * EmailMessagePayload – minimal shape accepted on `message-input`
 * [Explanation], basically a JSON object with recipients, subject, content, attachments
 */
type EmailMessagePayload = {
  recipients?: {
    to?: string[];
    cc?: string[];
    bcc?: string[];
  };
  subject?: string;
  content?: {
    text?: string;
    html?: string;
    useHtml?: boolean;
  };
  attachments?: Array<{
    id?: string;
    filename?: string;
    size?: number;
    mimeType?: string;
    content?: string; // base64
  }>;
};

function createDynamicSpec(data: EmailSenderData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.FE3;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C2;

  /**
   * HANDLE_TOOLTIPS – ultra‑concise labels for handles
   * [Explanation], basically 1–3 word hints shown before dynamic value/type
   */
  const HANDLE_TOOLTIPS = {
    TRIGGER_IN: "Trigger",
    ACCOUNT_IN: "Account",
    MESSAGE_IN: "Message",
    SUCCESS_OUT: "Success",
    MESSAGE_ID_OUT: "Message ID",
    ERROR_OUT: "Error",
    OUTPUT_OUT: "Output",
  } as const;

  return {
    kind: "emailSender",
    displayName: "Email Sender",
    label: "Email Sender",
    category: CATEGORIES.EMAIL,
    size: { expanded, collapsed },
    handles: [
      {
        id: "trigger-input",
        code: "boolean",
        position: "top",
        type: "target",
        dataType: "boolean",
        tooltip: HANDLE_TOOLTIPS.TRIGGER_IN,
      },
      {
        id: "account-input",
        code: "json",
        position: "left",
        type: "target",
        dataType: "JSON",
        tooltip: HANDLE_TOOLTIPS.ACCOUNT_IN,
            // Enforce minimal email account JSON shape
            jsonShape: {
              type: "object",
              properties: {
                accountId: { type: "string" },
                provider: { type: "string", optional: true },
                email: { type: "string", optional: true },
              },
            },
      },
      {
        id: "message-input",
        code: "json",
        position: "left",
        type: "target",
        dataType: "JSON",
        tooltip: HANDLE_TOOLTIPS.MESSAGE_IN,
        // Minimal email message JSON shape the sender can consume
        // [Explanation], basically recipients + subject + content + attachments
        jsonShape: {
          type: "object",
          properties: {
            recipients: {
              type: "object",
              optional: true,
              properties: {
                to: { type: "array", items: { type: "string" }, optional: true },
                cc: { type: "array", items: { type: "string" }, optional: true },
                bcc: { type: "array", items: { type: "string" }, optional: true },
              },
            },
            subject: { type: "string", optional: true },
            content: {
              type: "object",
              optional: true,
              properties: {
                text: { type: "string", optional: true },
                html: { type: "string", optional: true },
                useHtml: { type: "boolean", optional: true },
              },
            },
            attachments: {
              type: "array",
              optional: true,
              items: {
                type: "object",
                properties: {
                  id: { type: "string", optional: true },
                  filename: { type: "string" },
                  size: { type: "number", optional: true },
                  mimeType: { type: "string", optional: true },
                  content: { type: "string", optional: true },
                },
              },
            },
          },
        },
      },
      
      {
        id: "success-output",
        code: "boolean",
        position: "right",
        type: "source",
        dataType: "boolean",
        tooltip: HANDLE_TOOLTIPS.SUCCESS_OUT,
      },
      {
        id: "message-id-output",
        code: "string",
        position: "right",
        type: "source",
        dataType: "string",
        tooltip: HANDLE_TOOLTIPS.MESSAGE_ID_OUT,
      },
      {
        id: "error-output",
        code: "string",
        position: "bottom",
        type: "source",
        dataType: "string",
        tooltip: HANDLE_TOOLTIPS.ERROR_OUT,
      },
      {
        id: "output",
        code: "string",
        position: "right",
        type: "source",
        dataType: "string",
        tooltip: HANDLE_TOOLTIPS.OUTPUT_OUT,
      },
    ],
    inspector: { key: "EmailSenderInspector" },
    version: 1,
    runtime: { execute: "emailSender_execute_v1" },
    initialData: createSafeInitialData(EmailSenderDataSchema, {
      accountId: "",
      provider: "gmail",
      recipients: { to: [], cc: [], bcc: [] },
      subject: "",
      content: {
        text: "",
        html: "",
        useHtml: false,
        useTemplate: false,
        templateId: "",
        variables: {},
      },
      attachments: [],
      maxAttachmentSize: 25 * 1024 * 1024,
      sendMode: "immediate",
      batchSize: 10,
      delayBetweenSends: 1000,
      scheduledTime: undefined,
      trackDelivery: true,
      trackReads: false,
      trackClicks: false,
      retryAttempts: 3,
      retryDelay: 5000,
      continueOnError: true,
      isConnected: false,
      sendingStatus: "idle",
      sentCount: 0,
      failedCount: 0,
      lastSent: undefined,
      lastError: "",
      isEnabled: true,
      isActive: false,
      isExpanded: false,
      expandedSize: "FE3",
      collapsedSize: "C2",
      output: {}, // handle-based output object for Convex compatibility
    }),
    dataSchema: EmailSenderDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "successOutput",
        "messageIdOutput",
        "errorOutput",
        "expandedSize",
        "collapsedSize",
        "sendingStatus",
        "sentCount",
        "failedCount",
        "lastSent",
        "lastError",
        "isConnected",
        "attachments",
        "recipients",
        "content",
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
          key: "subject",
          type: "text",
          label: "Subject",
          placeholder: "Email subject...",
        },
        {
          key: "sendMode",
          type: "select",
          label: "Send Mode",
        },
        {
          key: "batchSize",
          type: "number",
          label: "Batch Size",
          placeholder: "10",
        },
        { key: "trackDelivery", type: "boolean", label: "Track Delivery" },
        { key: "trackReads", type: "boolean", label: "Track Reads" },
        { key: "trackClicks", type: "boolean", label: "Track Clicks" },
        {
          key: "retryAttempts",
          type: "number",
          label: "Retry Attempts",
          placeholder: "3",
        },
        { key: "continueOnError", type: "boolean", label: "Continue on Error" },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuSend",
    author: "Agenitix Team",
    description:
      "Compose and send emails through configured accounts with templates, attachments, and delivery tracking",
    feature: "email",
    tags: ["email", "send", "compose", "templates", "attachments"],
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "FE3",
  collapsedSize: "C2",
} as EmailSenderData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const EmailSenderNode = memo(
  ({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
    // -------------------------------------------------------------------------
    // 4.1  Sync with React‑Flow store and auth
    // -------------------------------------------------------------------------
    // Use initial data provided by scaffold to ensure defaults are present
    const { nodeData, updateNodeData } = useNodeData(id, data);
    const { user, authToken: token } = useAuth();

    // Category styling for consistent theming, basically email node styling
    const categoryStyles = CATEGORY_TEXT.EMAIL;

    // Keep last emitted output to avoid redundant writes
    const lastGeneralOutputRef = useRef<Map<string, any> | null>(null);
    const _prevIsConnectedRef = useRef<boolean>(
      (nodeData as EmailSenderData).isConnected
    );

    const { showSuccess, showError } = useNodeToast(id);

    // -------------------------------------------------------------------------
    // 4.2  Derived state
    // -------------------------------------------------------------------------
    const safeNodeData = nodeData || {};
    const {
      isExpanded,
      isEnabled,
      accountId,
      recipients,
      subject,
      content,
      attachments,
      maxAttachmentSize,
      sendingStatus,
      sentCount,
      failedCount,
    } = safeNodeData as EmailSenderData;

    // Provide safe defaults for critical objects that might be undefined
    const safeRecipients = recipients || { to: [], cc: [], bcc: [] };
    const safeContent = content || {
      text: "",
      html: "",
      useHtml: false,
      useTemplate: false,
      templateId: "",
      variables: {},
    };
    const safeAttachments = attachments || [];

    // -------------------------------------------------------------------------
    // 4.3  Convex integration
    // -------------------------------------------------------------------------
    const flowMetadata = useFlowMetadataOptional();

    // Fetch email accounts for both owners and viewers - viewers can use their own accounts
    const emailAccounts = useQuery(
      api.emailAccounts.getEmailAccountsByUserEmail,
      user?.email ? { userEmail: user.email } : "skip"
    );

    // Email sending action
    const sendEmailAction = useAction(api.emailAccounts.sendEmail);

    // -------------------------------------------------------------------------
    // 4.4  Get connected email account nodes
    // -------------------------------------------------------------------------

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

    // -------------------------------------------------------------------------
    // 4.4b  Get connected email message payload
    // -------------------------------------------------------------------------
    // Read JSON from upstream nodes wired to 'message-input'
    // [Explanation], basically prefer structured message JSON when available
    const messageInputPayload = useStore<EmailMessagePayload | null>(
      (s) => {
        const incomingEdges = s.edges.filter(
          (e) => e.target === id && e.targetHandle?.startsWith("message-input")
        );
        if (incomingEdges.length === 0) return null;
        for (const edge of incomingEdges) {
          const sourceNode = (s.nodes as any[]).find((n: any) => n.id === edge.source);
          const output = (sourceNode?.data?.output ?? {}) as Record<string, unknown>;
          const explicit = output["message-output"] as EmailMessagePayload | undefined;
          if (explicit && typeof explicit === "object") return explicit;
          if (edge.sourceHandle) {
            const handleId = normalizeHandleId(edge.sourceHandle);
            const val = output[handleId] as EmailMessagePayload | undefined;
            if (val && typeof val === "object") return val;
          }
          const first = Object.values(output)[0];
          if (first && typeof first === "object") return first as EmailMessagePayload;
        }
        return null;
      },
      (a, b) => JSON.stringify(a) === JSON.stringify(b)
    );

    const connectedAccountIds = useStore(
      (s) => {
        const incomingEdges = s.edges.filter(
          (e) => e.target === id && e.targetHandle?.startsWith("account-input")
        );
        if (incomingEdges.length === 0) return [] as string[];
        const ids = new Set<string>();
        for (const edge of incomingEdges) {
          const sourceNode = (s.nodes as any[]).find(
            (n: any) => n.id === edge.source
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

    // Get current selected account
    const selectedAccount = useMemo(() => {
      return EmailAccountService.getAccountById(availableAccounts, accountId);
    }, [availableAccounts, accountId]);

    // Account validation errors
    const accountErrors = useMemo(() => {
      return EmailAccountService.validateAccountSelection(
        accountId,
        availableAccounts
      );
    }, [accountId, availableAccounts]);

    // -------------------------------------------------------------------------
    // 4.6  Effects
    // -------------------------------------------------------------------------

    /**
     * Reset node state on logout or when the authenticated user changes
     * [Explanation], basically clear selected account and outputs when auth changes
     */
    const userEmail = user?.email ?? "";
    const _prevUserEmailRef = useRef<string>(userEmail);
    const _prevTokenRef = useRef<string | null>(token ?? null);
    useEffect(() => {
      const prevEmail = _prevUserEmailRef.current;
      const prevToken = _prevTokenRef.current;
      const tokenChanged = prevToken !== (token ?? null);
      const emailChanged = prevEmail !== userEmail;
      if (tokenChanged || emailChanged) {
        // Only write if something actually differs
        const diffs: Partial<EmailSenderData> = {};
        const curr = nodeData as EmailSenderData;
        (
          Object.keys(RESET_ON_LOGOUT_DATA) as Array<keyof EmailSenderData>
        ).forEach((k) => {
          const nextVal = (RESET_ON_LOGOUT_DATA as any)[k];
          if ((curr as any)[k] !== nextVal) (diffs as any)[k] = nextVal;
        });
        if (Object.keys(diffs).length) updateNodeData(diffs);
        _prevUserEmailRef.current = userEmail;
        _prevTokenRef.current = token ?? null;
      }
    }, [userEmail, token, updateNodeData, nodeData]);

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
            "gmail") as EmailSenderData["provider"],
          sendingStatus: "idle" as const,
          isConnected: false,
          lastError: "",
        } satisfies Partial<EmailSenderData>;
        const curr = nodeData as EmailSenderData;
        const hasDiff =
          curr.accountId !== next.accountId ||
          curr.provider !== next.provider ||
          curr.sendingStatus !== next.sendingStatus ||
          curr.isConnected !== next.isConnected ||
          curr.lastError !== next.lastError;
        if (hasDiff) updateNodeData(next);
      }
    }, [availableAccounts, accountId, updateNodeData, nodeData]);

    // Message auto-fill removed per request

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

        const rawProvider = selectedAccount?.provider ?? "gmail";
        const safeProvider: EmailSenderData["provider"] =
          rawProvider === "gmail" ||
          rawProvider === "outlook" ||
          rawProvider === "imap" ||
          rawProvider === "smtp"
            ? (rawProvider as EmailSenderData["provider"])
            : "gmail";

        updateNodeData({
          accountId: selectedAccountId,
          provider: safeProvider,
          sendingStatus: selectedAccountId ? "idle" : "idle",
          isConnected: false,
          lastError: "",
        });
      },
      [availableAccounts, updateNodeData]
    );

    /** Handle subject change */
    const handleSubjectChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        updateNodeData({ subject: e.target.value });
      },
      [updateNodeData]
    );

    /** Handle recipients change */
    const handleRecipientsChange = useCallback(
      (field: "to" | "cc" | "bcc") => (e: ChangeEvent<HTMLTextAreaElement>) => {
        const recipientString = e.target.value;

        // Just update the raw text, validate only on send
        const emails = recipientString
          .split(",")
          .map((email) => email.trim())
          .filter((email) => email.length > 0);

        updateNodeData({
          recipients: {
            ...safeRecipients,
            [field]: emails,
          },
        });
      },
      [safeRecipients, updateNodeData]
    );

    /** Handle message content change */
    const handleContentChange = useCallback(
      (field: "text" | "html") => (e: ChangeEvent<HTMLTextAreaElement>) => {
        updateNodeData({
          content: {
            ...safeContent,
            [field]: e.target.value,
          },
        });
      },
      [safeContent, updateNodeData]
    );

    /** Handle checkbox changes */
    const handleCheckboxChange = useCallback(
      (field: string) => (e: ChangeEvent<HTMLInputElement>) => {
        updateNodeData({ [field]: e.target.checked });
      },
      [updateNodeData]
    );

    /** Convert file to base64 */
    const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data URL prefix (e.g., "data:image/png;base64,")
          const base64 = result.split(",")[1];
          resolve(base64);
        };
        reader.onerror = (error) => reject(error);
      });
    };

    /** Handle file attachment */
    const handleFileAttachment = useCallback(
      async (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const validFiles = Array.from(files).filter((file) => {
          if (file.size > maxAttachmentSize) {
            toast.error(
              `File ${file.name} is too large. Max size: ${Math.round(maxAttachmentSize / 1024 / 1024)}MB`
            );
            return false;
          }
          return true;
        });

        if (validFiles.length === 0) {
          e.target.value = "";
          return;
        }

        toast.info(`Processing ${validFiles.length} file(s)...`);

        try {
          const newAttachments = await Promise.all(
            validFiles.map(async (file) => {
              const base64Content = await fileToBase64(file);
              return {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                filename: file.name,
                size: file.size,
                mimeType: file.type || "application/octet-stream",
                content: base64Content, // Store base64 content for sending
                file: file, // Keep file reference for UI
              };
            })
          );

          updateNodeData({
            attachments: [...safeAttachments, ...newAttachments],
          });
          toast.success(`Added ${newAttachments.length} attachment(s)`);
        } catch (error) {
          toast.error("Failed to process files");
          console.error("File processing error:", error);
        }

        // Clear the input
        e.target.value = "";
      },
      [attachments, maxAttachmentSize, updateNodeData]
    );

    /** Remove attachment */
    const removeAttachment = useCallback(
      (attachmentId: string) => {
        updateNodeData({
          attachments: safeAttachments.filter((att) => att.id !== attachmentId),
        });
        toast.info("Attachment removed");
      },
      [safeAttachments, updateNodeData]
    );

    /** Handle number input changes */
    const handleNumberChange = useCallback(
      (field: string, min: number, max: number) =>
        (e: ChangeEvent<HTMLInputElement>) => {
          const value = Number.parseInt(e.target.value) || min;
          updateNodeData({ [field]: Math.max(min, Math.min(max, value)) });
        },
      [updateNodeData]
    );

    /** Handle send mode change */
    const handleSendModeChange = useCallback(
      (e: ChangeEvent<HTMLSelectElement>) => {
        updateNodeData({
          sendMode: e.target.value as "immediate" | "batch" | "scheduled",
        });
      },
      [updateNodeData]
    );

    /** Handle send email action */
    const handleSendEmail = useCallback(async () => {
      if (!(accountId && token)) {
        showError("Please select an email account first");
        return;
      }

      // Prefer recipients from message-input if provided
      const resolvedRecipients = ((): {
        to: string[];
        cc: string[];
        bcc: string[];
      } => {
        const fromMsg = messageInputPayload?.recipients;
        const to = Array.isArray(fromMsg?.to) ? fromMsg!.to : safeRecipients.to;
        const cc = Array.isArray(fromMsg?.cc) ? fromMsg!.cc : safeRecipients.cc;
        const bcc = Array.isArray(fromMsg?.bcc) ? fromMsg!.bcc : safeRecipients.bcc;
        return {
          to: to.filter((e) => typeof e === "string" && e.trim().length > 0),
          cc: cc.filter((e) => typeof e === "string" && e.trim().length > 0),
          bcc: bcc.filter((e) => typeof e === "string" && e.trim().length > 0),
        };
      })();

      if (resolvedRecipients.to.length === 0) {
        showError("Please add at least one recipient");
        return;
      }

      // Validate email addresses
      const allEmails = [
        ...resolvedRecipients.to,
        ...resolvedRecipients.cc,
        ...resolvedRecipients.bcc,
      ];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = allEmails.filter(
        (email) => email && !emailRegex.test(email)
      );

      if (invalidEmails.length > 0) {
        showError(`Invalid email addresses: ${invalidEmails.join(", ")}`);
        return;
      }

      const resolvedSubject = String(
        (messageInputPayload?.subject ?? subject) || ""
      );
      if (!resolvedSubject.trim()) {
        showError("Please enter a subject");
        return;
      }

      const resolvedText = String(
        (messageInputPayload?.content?.text ?? safeContent.text) || ""
      );
      const resolvedHtml = String(
        (messageInputPayload?.content?.html ?? safeContent.html) || ""
      );
      if (!resolvedText.trim() && !resolvedHtml.trim()) {
        showError("Please enter message content");
        return;
      }

      try {
        updateNodeData({
          sendingStatus: "sending",
          lastError: "",
          isActive: true,
        });

        // Send email via Convex backend
        const validUserEmailHint =
          typeof user?.email === "string" && user.email.includes("@")
            ? user.email
            : undefined;
        const validSelectedAccountEmailHint =
          typeof selectedAccount?.email === "string" &&
          selectedAccount.email.includes("@")
            ? selectedAccount.email
            : undefined;

        const resolvedAttachments =
          (Array.isArray(messageInputPayload?.attachments)
            ? messageInputPayload!.attachments
            : safeAttachments
          ) || [];

        const emailPayload = {
          accountId: accountId as any,
          to: resolvedRecipients.to,
          cc: resolvedRecipients.cc.length > 0 ? resolvedRecipients.cc : undefined,
          bcc: resolvedRecipients.bcc.length > 0 ? resolvedRecipients.bcc : undefined,
          subject: resolvedSubject,
          textContent: resolvedText,
          htmlContent: resolvedHtml || undefined,
          attachments:
            resolvedAttachments.length > 0
              ? resolvedAttachments.map((att: any) => ({
                  id: String(att.id ?? ""),
                  filename: String(att.filename ?? ""),
                  size: typeof att.size === "number" ? att.size : 0,
                  mimeType: String(att.mimeType ?? "application/octet-stream"),
                  content: typeof att.content === "string" ? att.content : undefined,
                }))
              : undefined,
          // Fallback hint for action auth recovery
          userEmailHint: validUserEmailHint ?? validSelectedAccountEmailHint,
        };

        const result = await sendEmailAction(emailPayload);

        if (result.success) {
          // Create formatted output similar to EmailReader
          const formattedOutput = {
            "Email Sent Successfully": {
              "Message ID": result.messageId || "N/A",
              Subject: resolvedSubject,
              To: resolvedRecipients.to.join(", "),
              CC:
                resolvedRecipients.cc.length > 0
                  ? resolvedRecipients.cc.join(", ")
                  : "None",
              BCC:
                resolvedRecipients.bcc.length > 0
                  ? resolvedRecipients.bcc.join(", ")
                  : "None",
              "Sent At": new Date().toLocaleString(),
              "Content Type": (messageInputPayload?.content?.useHtml ?? safeContent.useHtml) ? "HTML" : "Plain Text",
              "Content Preview":
                (resolvedText || resolvedHtml).substring(0, 100) +
                ((resolvedText || resolvedHtml).length > 100
                  ? "..."
                  : ""),
              Attachments:
                resolvedAttachments.length > 0
                  ? `${resolvedAttachments.length} file(s) (${Math.round(resolvedAttachments.reduce((sum, att: any) => sum + (typeof att.size === "number" ? att.size : 0), 0) / 1024)}KB)`
                  : "None",
              "Account Used": selectedAccount?.email || "Unknown",
              Status: "✅ Delivered",
            },
          };

          updateNodeData({
            sendingStatus: "sent",
            sentCount: sentCount + safeRecipients.to.length,
            lastSent: Date.now(),
            isConnected: true,
          });

          showSuccess(
            `Sent email to ${resolvedRecipients.to.length} recipients successfully`
          );
        } else {
          const errorMessage = "Failed to send email";

          updateNodeData({
            sendingStatus: "error",
            failedCount: failedCount + resolvedRecipients.to.length,
            lastError: errorMessage,
          });

          showError("Failed to send email", errorMessage);
        }
      } catch (error) {
        console.error("Email sending error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to send email";

        updateNodeData({
          sendingStatus: "error",
          lastError: errorMessage,
          failedCount: failedCount + resolvedRecipients.to.length,
        });

        showError("Failed to send email", errorMessage);
      }
    }, [
      accountId,
      token,
      messageInputPayload,
      safeRecipients,
      subject,
      safeContent,
      safeAttachments,
      sentCount,
      failedCount,
      selectedAccount,
      updateNodeData,
      sendEmailAction,
      showSuccess,
      showError,
    ]);

    /** Update output when sending state changes */
    useEffect(() => {
      const curr = nodeData as EmailSenderData;
      const nextActive = Boolean(
        isEnabled && (sendingStatus === "sent" || sendingStatus === "sending")
      );
      if (curr.isActive !== nextActive) {
        updateNodeData({ isActive: nextActive });
      }
      // Intentionally do NOT depend on nodeData to avoid effect loops
    }, [isEnabled, sendingStatus, updateNodeData]);

    /**
     * 🔄 Generate unified handle-based output map
     * [Explanation], basically create output map for downstream nodes just like EmailReader
     */
    const _lastHandleMapRef = useRef<Map<string, unknown> | null>(null);
    useEffect(() => {
      try {
        const map = generateoutputField(spec, nodeData as any);
        if (!(map instanceof Map)) return;
        // Avoid self-referential recursion: never include the 'output' handle in the map we persist
        if (map.has("output")) {
          map.delete("output");
        }
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
    }, [spec.handles, isEnabled, sendingStatus, updateNodeData]);

    // -------------------------------------------------------------------------
    // 4.7  Validation
    // -------------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("EmailSender", id, validation.errors, {
        originalData: validation.originalData,
        component: "EmailSenderNode",
      });
    }

    useNodeDataValidation(
      EmailSenderDataSchema,
      "EmailSender",
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
          label={(nodeData as EmailSenderData).label || spec.displayName}
        />

        {isExpanded ? (
          <div >
          <EmailSenderExpanded
            nodeId={id}
            nodeData={nodeData as EmailSenderData}
            isEnabled={typeof isEnabled === "boolean" ? isEnabled : true}
            sendingStatus={sendingStatus as EmailSenderData["sendingStatus"]}
            availableAccounts={availableAccounts}
            selectedAccount={selectedAccount || undefined}
            accountErrors={accountErrors}
            onAccountChange={handleAccountChange}
            onSubjectChange={handleSubjectChange}
            onRecipientsChange={handleRecipientsChange}
            onContentChange={handleContentChange}
            onCheckboxChange={handleCheckboxChange}
            onFileAttachment={handleFileAttachment}
            onRemoveAttachment={removeAttachment}
            onNumberChange={handleNumberChange}
            onSendModeChange={handleSendModeChange}
            onSendEmail={handleSendEmail}
            onRefreshAccount={() => {
              if (selectedAccount) {
                EmailAccountService.clearValidationCache(selectedAccount.value);
                showSuccess("Connection status refreshed");
                }
              }}
            />
          </div>
        ) : (
          <EmailSenderCollapsed
            nodeData={nodeData as EmailSenderData}
            categoryStyles={categoryStyles}
            onToggleExpand={toggleExpand}
            onSendEmail={handleSendEmail}
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

// -----------------------------------------------------------------------------
// 5️⃣  High‑order wrapper – inject scaffold with dynamic spec
// -----------------------------------------------------------------------------

const EmailSenderNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec only when the size keys change
  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as EmailSenderData),
    [
      (nodeData as EmailSenderData).expandedSize,
      (nodeData as EmailSenderData).collapsedSize,
    ]
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <EmailSenderNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
};

export default EmailSenderNodeWithDynamicSpec;
