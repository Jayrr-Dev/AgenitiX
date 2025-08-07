/**
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
import { Handle, Position, useReactFlow, useStore } from "@xyflow/react";
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
import { generateoutputField } from "@/features/business-logic-modern/infrastructure/node-core/handleOutputUtils";
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
import { useAction, useQuery } from "convex/react";
import { toast } from "sonner";
import { EmailAccountService } from "./services/emailAccountService";
import { useFlowMetadataOptional } from "@/features/business-logic-modern/infrastructure/flow-engine/contexts/flow-metadata-context";

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
    expandedSize: SafeSchemas.text("VE3"),
    collapsedSize: SafeSchemas.text("C2"),

    // output - unified handle-based output system
    output: z.record(z.string(), z.unknown()).optional(), // handle-based output object for Convex compatibility
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

const CONTENT = {
  expanded: "p-4 w-full h-full flex flex-col",
  collapsed: "flex items-center justify-center w-full h-full",
  header: "flex items-center justify-between mb-3 flex-shrink-0",
  body: "flex-1 flex flex-col gap-3 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent",
  disabled:
    "opacity-75 bg-zinc-100 dark:bg-zinc-500 rounded-md transition-all duration-300",
} as const;

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

function createDynamicSpec(data: EmailSenderData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.VE3;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C2;

  return {
    kind: "emailSender",
    displayName: "Email Sender",
    label: "Email Sender",
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
        id: "message-input",
        code: "m",
        position: "left",
        type: "target",
        dataType: "JSON",
      },
      {
        id: "success-output",
        code: "s",
        position: "right",
        type: "source",
        dataType: "Boolean",
      },
      {
        id: "message-id-output",
        code: "i",
        position: "right",
        type: "source",
        dataType: "String",
      },
      {
        id: "error-output",
        code: "e",
        position: "bottom",
        type: "source",
        dataType: "String",
      },
      {
        id: "output",
        code: "o",
        position: "right",
        type: "source",
        dataType: "String",
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
      expandedSize: "VE3",
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
  expandedSize: "VE3",
  collapsedSize: "C2",
} as EmailSenderData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const EmailSenderNode = memo(({ id, spec }: NodeProps & { spec: NodeSpec }) => {
  // -------------------------------------------------------------------------
  // 4.1  Sync with React‑Flow store and auth
  // -------------------------------------------------------------------------
  const { nodeData, updateNodeData } = useNodeData(id, {});
  const { user, authToken: token } = useAuth();

  // -------------------------------------------------------------------------
  // 4.2  Derived state
  // -------------------------------------------------------------------------
  const safeNodeData = nodeData || {};
  const {
    isExpanded,
    isEnabled,
    accountId,
    provider,
    recipients,
    subject,
    content,
    attachments,
    maxAttachmentSize,
    sendMode,
    batchSize,
    delayBetweenSends,
    trackDelivery,
    trackReads,
    trackClicks,
    retryAttempts,
    continueOnError,
    sendingStatus,
    isConnected,
    sentCount,
    failedCount,
    lastSent,
    lastError,
  } = safeNodeData as EmailSenderData;

  // Provide safe defaults for critical objects that might be undefined
  const safeRecipients = recipients || { to: [], cc: [], bcc: [] };
  const safeContent = content || { text: "", html: "", useHtml: false, useTemplate: false, templateId: "", variables: {} };
  const safeAttachments = attachments || [];

  const categoryStyles = CATEGORY_TEXT.EMAIL;

  // Global React‑Flow store (nodes & edges) – triggers re‑render on change
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);

  // Keep last emitted output to avoid redundant writes
  const lastOutputRef = useRef<string | null>(null);
  const lastGeneralOutputRef = useRef<Map<string, any> | null>(null);

  // -------------------------------------------------------------------------
  // 4.3  Convex integration
  // -------------------------------------------------------------------------
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

  // Email sending action
  const sendEmailAction = useAction(api.emailAccounts.sendEmail);

  // Global React‑Flow store (nodes & edges) – triggers re‑render on change
  const _nodes = useStore((s) => s.nodes);
  const _edges = useStore((s) => s.edges);

  // -------------------------------------------------------------------------
  // 4.4  Get connected email account nodes
  // -------------------------------------------------------------------------
  const { getNodes, getEdges } = useReactFlow();

  const connectedAccountIds = useMemo(() => {
    const edges = _edges.filter(
      (e) => e.target === id && e.targetHandle === "account-input__a"
    );

    const connectedAccountNodes = edges
      .map((e) => _nodes.find((n) => n.id === e.source))
      .filter(Boolean)
      .filter(
        (n) =>
          n?.type === "emailAccount" &&
          n?.data?.isConnected &&
          n?.data?.accountId
      );

    const accountIds = connectedAccountNodes
      .filter((node): node is NonNullable<typeof node> => node != null)
      .map((node) => node.data.accountId);

    return accountIds;
  }, [_nodes, _edges, id]);

  // -------------------------------------------------------------------------
  // 4.5  Available accounts (filtered by connected nodes)
  // -------------------------------------------------------------------------
  const availableAccounts = useMemo(() => {
    if (!(emailAccounts && Array.isArray(emailAccounts))) {
      return [];
    }

    // Only show accounts from connected nodes (no fallback to all accounts)
    if (connectedAccountIds.length === 0) {
      return []; // No connections = no available accounts
    }

    // Filter accounts to only show connected ones
    const filteredAccounts = emailAccounts.filter((account) =>
      connectedAccountIds.includes(account._id)
    );

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

  // Auto-select recommended account if none selected
  useEffect(() => {
    if (!accountId && availableAccounts.length > 0) {
      const recommended =
        EmailAccountService.getRecommendedAccount(availableAccounts);
      if (recommended) {
        updateNodeData({
          accountId: recommended.value,
          provider: recommended.provider,
          isConnected: recommended.isConnected,
          lastError: recommended.isConnected ? "" : "Account connection issue",
        });
        toast.info(`Auto-selected account: ${recommended.email}`);
      }
    }
  }, [accountId, availableAccounts, updateNodeData]);

  // Detect connection with emailReplier or emailCreator and auto-fill message data
  useEffect(() => {
    const connectedEdges = _edges.filter(
      (edge) => edge.target === id && edge.targetHandle === "message-input__m"
    );

    if (connectedEdges.length > 0) {
      const sourceEdge = connectedEdges[0];
      const sourceNode = _nodes.find((node) => node.id === sourceEdge.source);

      // Handle EmailCreator connection
      if (
        sourceNode &&
        sourceNode.type === "emailCreator" &&
        sourceNode.data?.emailOutput
      ) {
        const emailData = sourceNode.data.emailOutput as any;

        console.log("Auto-filling emailSender from emailCreator:", emailData);

        // Validate emailData structure before using
        if (emailData && typeof emailData === "object") {
          // Auto-fill email fields from emailCreator data
          updateNodeData({
            recipients: {
              to: Array.isArray(emailData.recipients?.to)
                ? emailData.recipients.to
                : [],
              cc: Array.isArray(emailData.recipients?.cc)
                ? emailData.recipients.cc
                : [],
              bcc: Array.isArray(emailData.recipients?.bcc)
                ? emailData.recipients.bcc
                : [],
            },
            subject:
              typeof emailData.subject === "string" ? emailData.subject : "",
            content: {
              text:
                typeof emailData.content?.text === "string"
                  ? emailData.content.text
                  : "",
              html:
                typeof emailData.content?.html === "string"
                  ? emailData.content.html
                  : "",
              useHtml: Boolean(emailData.content?.useHtml),
            },
            isActive: true,
          });
        }
      }
      // Handle EmailReplier connection
      else if (
        sourceNode &&
        sourceNode.type === "emailReplier" &&
        sourceNode.data?.generatedReply
      ) {
        // Auto-fill email fields from emailReplier data
        const replierData = sourceNode.data as any;

        // Extract recipient info from the original email data
        const originalEmail =
          (replierData.inputEmails &&
            Array.isArray(replierData.inputEmails) &&
            replierData.inputEmails[0]) ||
          {};

        // Try multiple fields for sender email
        let senderEmail =
          originalEmail.from ||
          originalEmail.sender ||
          originalEmail.fromEmail ||
          originalEmail.email ||
          "sender@example.com";

        // If senderEmail is an object, extract the email field
        if (typeof senderEmail === "object" && senderEmail !== null) {
          senderEmail =
            senderEmail.email ||
            senderEmail.address ||
            senderEmail.name ||
            "sender@example.com";
        }

        // Try multiple fields for subject
        const originalSubject =
          originalEmail.subject || originalEmail.title || "Your Email";

        // Handle CC emails safely
        let ccEmails = [];
        if (replierData.replyToAll) {
          const ccData = originalEmail.cc || originalEmail.ccEmails || [];
          if (Array.isArray(ccData)) {
            ccEmails = ccData.filter((email) => email && email.trim());
          } else if (typeof ccData === "string" && ccData.trim()) {
            ccEmails = ccData.split(",").filter((email) => email.trim());
          }
        }

        // Preserve existing accountId and other important settings
        updateNodeData({
          recipients: {
            to: [senderEmail],
            cc: ccEmails,
            bcc: [],
          },
          subject: `Re: ${originalSubject}`,
          content: {
            text: replierData.generatedReply,
            html: "",
            useHtml: false,
          },
          isActive: true,
          // Don't override accountId - keep the existing one
        });

        console.log("Auto-filled emailSender from emailReplier:", {
          originalEmail: originalEmail,
          to: senderEmail,
          subject: `Re: ${originalSubject}`,
          message: replierData.generatedReply,
          replierData: replierData,
        });
      }
    }
  }, [_nodes, _edges, id, updateNodeData]);

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
      const selectedAccount = EmailAccountService.getAccountById(
        availableAccounts,
        selectedAccountId
      );

      // Clear validation cache for new account
      if (selectedAccountId) {
        EmailAccountService.clearValidationCache(selectedAccountId);
      }

      updateNodeData({
        accountId: selectedAccountId,
        provider: selectedAccount?.provider || "gmail",
        isConnected: selectedAccount?.isConnected || false,
        lastError: selectedAccount?.isConnected
          ? ""
          : "Account connection issue",
        sendingStatus: "idle",
        sentCount: 0,
        failedCount: 0,
      });

      // Show toast for account selection
      if (selectedAccount) {
        if (selectedAccount.isConnected) {
          toast.success(`Connected to ${selectedAccount.email}`);
        } else {
          toast.warning(
            `Account ${selectedAccount.email} has connection issues`
          );
        }
      }
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

    if (!accountId) {
      toast.error("Please select an email account first");
      return;
    }

    if (!token) {
      toast.error(
        "Authentication token not available. Please refresh and try again."
      );
      return;
    }

    if (safeRecipients.to.length === 0) {
      toast.error("Please add at least one recipient");
      return;
    }

    // Validate email addresses
    const allEmails = [...safeRecipients.to, ...safeRecipients.cc, ...safeRecipients.bcc];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = allEmails.filter(
      (email) => email && !emailRegex.test(email)
    );

    if (invalidEmails.length > 0) {
      toast.error(`Invalid email addresses: ${invalidEmails.join(", ")}`);
      return;
    }

    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }

    if (!safeContent.text.trim() && !safeContent.html.trim()) {
      toast.error("Please enter message content");
      return;
    }

    try {
      updateNodeData({
        sendingStatus: "sending",
        lastError: "",
      });

      // Send email via Convex backend
      const emailPayload = {
        token_hash: token, // Pass authentication token
        accountId: accountId as any,
        to: safeRecipients.to,
        cc: safeRecipients.cc.length > 0 ? safeRecipients.cc : undefined,
        bcc: safeRecipients.bcc.length > 0 ? safeRecipients.bcc : undefined,
        subject: subject,
        textContent: safeContent.text,
        htmlContent: safeContent.html || undefined,
        attachments:
          safeAttachments.length > 0
            ? safeAttachments.map((att) => ({
                id: att.id,
                filename: att.filename,
                size: att.size,
                mimeType: att.mimeType,
                content: att.content, // Include base64 content
              }))
            : undefined,
      };

      const result = await sendEmailAction(emailPayload);

      if (result.success) {
        // Create formatted output similar to EmailReader
        const formattedOutput = {
          "Email Sent Successfully": {
            "Message ID": result.messageId || "N/A",
            Subject: subject,
            To: safeRecipients.to.join(", "),
            CC: safeRecipients.cc.length > 0 ? safeRecipients.cc.join(", ") : "None",
            BCC: safeRecipients.bcc.length > 0 ? safeRecipients.bcc.join(", ") : "None",
            "Sent At": new Date().toLocaleString(),
            "Content Type": safeContent.useHtml ? "HTML" : "Plain Text",
            "Content Preview":
              (safeContent.text || safeContent.html).substring(0, 100) +
              ((safeContent.text || safeContent.html).length > 100 ? "..." : ""),
            Attachments:
              safeAttachments.length > 0
                ? `${safeAttachments.length} file(s) (${Math.round(safeAttachments.reduce((sum, att) => sum + att.size, 0) / 1024)}KB)`
                : "None",
            "Account Used": selectedAccount?.email || "Unknown",
            Status: "✅ Delivered",
          },
        };

        updateNodeData({
          sendingStatus: "sent",
          sentCount: sentCount + safeRecipients.to.length,
          lastSent: Date.now(),
          successOutput: true,
          messageIdOutput: result.messageId,
          errorOutput: "",
          output: JSON.stringify(formattedOutput, null, 2), // Formatted for viewText
        });

        toast.success(
          `Email sent successfully to ${safeRecipients.to.length} recipient(s)`
        );
      } else {
        const errorMessage = "Failed to send email";

        // Create formatted error output
        const errorOutput = {
          "Email Send Failed": {
            Subject: subject,
            To: safeRecipients.to.join(", "),
            CC: safeRecipients.cc.length > 0 ? safeRecipients.cc.join(", ") : "None",
            BCC: safeRecipients.bcc.length > 0 ? safeRecipients.bcc.join(", ") : "None",
            "Failed At": new Date().toLocaleString(),
            "Account Used": selectedAccount?.email || "Unknown",
            Error: errorMessage,
            Status: "❌ Failed",
          },
        };

        updateNodeData({
          sendingStatus: "error",
          failedCount: failedCount + safeRecipients.to.length,
          lastError: errorMessage,
          successOutput: false,
          messageIdOutput: "",
          errorOutput: errorMessage,
          output: JSON.stringify(errorOutput, null, 2),
        });

        toast.error("Failed to send email", {
          description: errorMessage,
        });
      }
    } catch (error) {
      console.error("Email sending error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send email";

      // Create formatted error output for exceptions
      const exceptionOutput = {
        "Email Send Exception": {
          Subject: subject,
          To: safeRecipients.to.join(", "),
          CC: safeRecipients.cc.length > 0 ? safeRecipients.cc.join(", ") : "None",
          BCC: safeRecipients.bcc.length > 0 ? safeRecipients.bcc.join(", ") : "None",
          "Failed At": new Date().toLocaleString(),
          "Account Used": selectedAccount?.email || "Unknown",
          Exception: errorMessage,
          Status: "⚠️ Exception",
        },
      };

      updateNodeData({
        sendingStatus: "error",
        lastError: errorMessage,
        failedCount: failedCount + safeRecipients.to.length,
        successOutput: false,
        errorOutput: errorMessage,
        output: JSON.stringify(exceptionOutput, null, 2),
      });

      toast.error("Failed to send email", {
        description: errorMessage,
      });
    }
  }, [
    accountId,
    token,
    recipients,
    subject,
    content,
    sentCount,
    failedCount,
    updateNodeData,
    sendEmailAction,
  ]);

  // -------------------------------------------------------------------------
  // 4.6  Effects
  // -------------------------------------------------------------------------

  /** Update output when sending state changes */
  useEffect(() => {
    if (isEnabled && sendingStatus === "sent") {
      updateNodeData({
        isActive: true,
      });
    } else {
      updateNodeData({
        isActive: sendingStatus === "sending",
      });
    }
  }, [isEnabled, sendingStatus, updateNodeData]);

  /* 🔄 Handle-based output field generation for multi-handle compatibility */
  useEffect(() => {
    try {
      // Generate Map-based output with error handling
      const outputValue = generateoutputField(spec, nodeData as any);

      // Validate the result
      if (!(outputValue instanceof Map)) {
        console.error(
          `EmailSender ${id}: generateoutputField did not return a Map`,
          outputValue
        );
        return;
      }

      // Convert Map to plain object for Convex compatibility, basically serialize for storage
      const outputObject = Object.fromEntries(outputValue.entries());

      // Only update if changed
      const currentOutput = lastGeneralOutputRef.current;
      let hasChanged = true;

      if (currentOutput instanceof Map && outputValue instanceof Map) {
        // Compare Map contents
        hasChanged =
          currentOutput.size !== outputValue.size ||
          !Array.from(outputValue.entries()).every(
            ([key, value]) => currentOutput.get(key) === value
          );
      }

      if (hasChanged) {
        lastGeneralOutputRef.current = outputValue;
        updateNodeData({ output: outputObject });
      }
    } catch (error) {
      console.error(`EmailSender ${id}: Error generating output`, error, {
        spec: spec?.kind,
        nodeDataKeys: Object.keys(nodeData || {}),
      });

      // Fallback: set empty object to prevent crashes, basically empty state for storage
      if (lastGeneralOutputRef.current !== null) {
        lastGeneralOutputRef.current = new Map();
        updateNodeData({ output: {} });
      }
    }
  }, [
    spec.handles,
    (safeNodeData as any).isActive,
    (safeNodeData as any).sendingStatus,
    (safeNodeData as any).successOutput,
    (safeNodeData as any).messageIdOutput,
    (safeNodeData as any).errorOutput,
    updateNodeData,
    id,
  ]);

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
      <LabelNode nodeId={id} label={spec?.displayName || "Email Sender"} />

      {isExpanded ? (
        <div
          className={`${CONTENT.expanded} ${isEnabled ? "" : CONTENT.disabled}`}
        >
          <div className={CONTENT.header}>
            <span className="text-sm font-medium">Email Sender</span>
            <div
              className={`text-xs ${sendingStatus === "sent" ? "text-green-600" : sendingStatus === "error" ? "text-red-600" : "text-gray-600"}`}
            >
              {sendingStatus === "sending"
                ? "📤"
                : sendingStatus === "sent"
                  ? "✓"
                  : sendingStatus === "error"
                    ? "✗"
                    : "○"}{" "}
              {sendingStatus}
            </div>
          </div>

          <div className={CONTENT.body}>
            {/* Account Selection */}
            <div>
              <label className="text-xs text-gray-600 mb-1 block">
                Email Account:
              </label>
              <select
                value={accountId}
                onChange={handleAccountChange}
                className={`w-full text-xs p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  accountErrors.length > 0 ? "border-red-500" : ""
                }`}
                disabled={!isEnabled || sendingStatus === "sending"}
              >
                <option value="">Select email account...</option>
                {availableAccounts.map((account) => (
                  <option
                    key={account.value}
                    value={account.value}
                    disabled={!account.isActive}
                  >
                    {account.label}{" "}
                    {account.isActive
                      ? account.isConnected
                        ? ""
                        : "(connection error)"
                      : "(inactive)"}
                  </option>
                ))}
              </select>

              {/* Account Status Display */}
              {selectedAccount && (
                <div className="mt-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs ${EmailAccountService.getConnectionStatusColor(selectedAccount)}`}
                    >
                      ●{" "}
                      {EmailAccountService.getConnectionStatusText(
                        selectedAccount
                      )}
                    </span>
                    {selectedAccount.lastValidated && (
                      <span className="text-xs text-gray-500">
                        Last checked:{" "}
                        {new Date(
                          selectedAccount.lastValidated
                        ).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      EmailAccountService.clearValidationCache(
                        selectedAccount.value
                      );
                      toast.info("Connection status refreshed");
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                    disabled={sendingStatus === "sending"}
                  >
                    Refresh
                  </button>
                </div>
              )}

              {/* Account Errors */}
              {accountErrors.length > 0 && (
                <div className="mt-1">
                  {accountErrors.map((error, index) => (
                    <div key={index} className="text-xs text-red-600">
                      ⚠ {error}
                    </div>
                  ))}
                </div>
              )}

              {/* No Accounts Available */}
              {availableAccounts.length === 0 && (
                <div className="mt-1 text-xs text-yellow-600">
                  ⚠ No email accounts configured. Please add an email account
                  first.
                </div>
              )}
            </div>

            {/* Recipients */}
            <div>
              <label className="text-xs text-gray-600 mb-1 block">
                To (comma-separated):
              </label>
              <textarea
                value={safeRecipients.to.join(", ")}
                onChange={handleRecipientsChange("to")}
                placeholder="recipient1@example.com, recipient2@example.com"
                className="w-full text-xs p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-16 resize-none"
                disabled={!isEnabled || sendingStatus === "sending"}
              />
            </div>

            {/* CC Recipients */}
            <div>
              <label className="text-xs text-gray-600 mb-1 block">
                CC (optional):
              </label>
              <textarea
                value={safeRecipients.cc.join(", ")}
                onChange={handleRecipientsChange("cc")}
                placeholder="cc@example.com"
                className="w-full text-xs p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-12 resize-none"
                disabled={!isEnabled || sendingStatus === "sending"}
              />
            </div>

            {/* Subject */}
            <div>
              <label className="text-xs text-gray-600 mb-1 block">
                Subject:
              </label>
              <input
                type="text"
                value={subject}
                onChange={handleSubjectChange}
                placeholder="Email subject..."
                className="w-full text-xs p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={!isEnabled || sendingStatus === "sending"}
              />
            </div>

            {/* Message Content */}
            <div>
              <label className="text-xs text-gray-600 mb-1 block">
                Message:
              </label>
              <textarea
                value={safeContent.text}
                onChange={handleContentChange("text")}
                placeholder="Enter your message here..."
                className="w-full text-xs p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-24 resize-none"
                disabled={!isEnabled || sendingStatus === "sending"}
              />
            </div>

            {/* Attachments */}
            <div>
              <label className="text-xs text-gray-600 mb-1 block">
                Attachments:
              </label>

              {/* File Input */}
              <div className="mb-2">
                <input
                  type="file"
                  multiple={true}
                  onChange={handleFileAttachment}
                  className="hidden"
                  id={`file-input-${id}`}
                  disabled={!isEnabled || sendingStatus === "sending"}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
                />
                <label
                  htmlFor={`file-input-${id}`}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📎 Add Files
                </label>
                <span className="text-xs text-gray-500 ml-2">
                  Max: {Math.round(maxAttachmentSize / 1024 / 1024)}MB per file
                </span>
              </div>

              {/* Attachments List */}
              {safeAttachments.length > 0 && (
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {safeAttachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-blue-600">📄</span>
                        <span className="truncate font-medium">
                          {attachment.filename}
                        </span>
                        <span className="text-gray-500 flex-shrink-0">
                          ({Math.round(attachment.size / 1024)}KB)
                        </span>
                      </div>
                      <button
                        onClick={() => removeAttachment(attachment.id)}
                        className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                        disabled={!isEnabled || sendingStatus === "sending"}
                        title="Remove attachment"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Attachments Summary */}
              {safeAttachments.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {safeAttachments.length} file(s) • Total:{" "}
                  {Math.round(
                    safeAttachments.reduce((sum, att) => sum + att.size, 0) / 1024
                  )}
                  KB
                </div>
              )}
            </div>

            {/* Send Mode */}
            <div>
              <label className="text-xs text-gray-600 mb-1 block">
                Send Mode:
              </label>
              <select
                value={sendMode}
                onChange={handleSendModeChange}
                className="w-full text-xs p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={!isEnabled || sendingStatus === "sending"}
              >
                <option value="immediate">Immediate</option>
                <option value="batch">Batch</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>

            {/* Batch Options */}
            {sendMode === "batch" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">
                    Batch Size:
                  </label>
                  <input
                    type="number"
                    value={batchSize}
                    onChange={handleNumberChange("batchSize", 1, 100)}
                    min="1"
                    max="100"
                    className="w-full text-xs p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={!isEnabled || sendingStatus === "sending"}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">
                    Delay (ms):
                  </label>
                  <input
                    type="number"
                    value={delayBetweenSends}
                    onChange={handleNumberChange("delayBetweenSends", 0, 60000)}
                    min="0"
                    max="60000"
                    className="w-full text-xs p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={!isEnabled || sendingStatus === "sending"}
                  />
                </div>
              </div>
            )}

            {/* Tracking Options */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={trackDelivery}
                  onChange={handleCheckboxChange("trackDelivery")}
                  className="mr-2"
                  disabled={!isEnabled || sendingStatus === "sending"}
                />
                Track Delivery
              </label>
              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={trackReads}
                  onChange={handleCheckboxChange("trackReads")}
                  className="mr-2"
                  disabled={!isEnabled || sendingStatus === "sending"}
                />
                Track Reads
              </label>
              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={trackClicks}
                  onChange={handleCheckboxChange("trackClicks")}
                  className="mr-2"
                  disabled={!isEnabled || sendingStatus === "sending"}
                />
                Track Clicks
              </label>
              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={continueOnError}
                  onChange={handleCheckboxChange("continueOnError")}
                  className="mr-2"
                  disabled={!isEnabled || sendingStatus === "sending"}
                />
                Continue on Error
              </label>
            </div>

            {/* Retry Settings */}
            <div>
              <label className="text-xs text-gray-600 mb-1 block">
                Retry Attempts:
              </label>
              <input
                type="number"
                value={retryAttempts}
                onChange={handleNumberChange("retryAttempts", 0, 5)}
                min="0"
                max="5"
                className="w-full text-xs p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={!isEnabled || sendingStatus === "sending"}
              />
            </div>

            {/* Send Button */}
            <div className="flex gap-2">
              <button
                onClick={handleSendEmail}
                disabled={
                  !isEnabled ||
                  !accountId ||
                  sendingStatus === "sending" ||
                  safeRecipients.to.length === 0
                }
                className="flex-1 text-xs p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingStatus === "sending" ? "Sending..." : "Send Email"}
              </button>
            </div>

            {/* Status Information */}
            <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
              <div>
                Sent: {sentCount} | Failed: {failedCount}
              </div>
              <div>
                Recipients:{" "}
                {safeRecipients.to.length +
                  safeRecipients.cc.length +
                  safeRecipients.bcc.length}
              </div>
              <div>
                Attachments: {safeAttachments.length}
                {safeAttachments.length > 0 && (
                  <span className="ml-1">
                    (
                    {Math.round(
                      safeAttachments.reduce((sum, att) => sum + att.size, 0) / 1024
                    )}
                    KB)
                  </span>
                )}
              </div>
              {lastError && (
                <div className="text-red-600 mt-1">Error: {lastError}</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`${CONTENT.collapsed} ${isEnabled ? "" : CONTENT.disabled}`}
        >
          <div className="text-center p-2">
            <div className={`text-xs font-mono ${categoryStyles.primary}`}>
              {accountId ? `${sentCount} sent` : "No account"}
            </div>
            <div
              className={`text-xs ${sendingStatus === "sent" ? "text-green-600" : sendingStatus === "error" ? "text-red-600" : "text-gray-600"}`}
            >
              {sendingStatus === "sending"
                ? "📤"
                : sendingStatus === "sent"
                  ? "✓"
                  : sendingStatus === "error"
                    ? "✗"
                    : "○"}{" "}
              {sendingStatus}
            </div>
          </div>
        </div>
      )}

      <ExpandCollapseButton
        showUI={isExpanded}
        onToggle={toggleExpand}
        size="sm"
      />
    </>
  );
});

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
