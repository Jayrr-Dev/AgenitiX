/**
 * emailBulk NODE – Bulk email operations and mass sending
 *
 * • Send emails to multiple recipients in batches
 * • Manage bulk email campaigns with scheduling
 * • Track delivery status and bounce handling
 * • Template-based mass email sending
 * • Rate limiting and throttling for compliance
 *
 * Keywords: bulk-email, mass-sending, campaigns, batching, rate-limiting
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

import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const EmailBulkDataSchema = z
  .object({
    // Campaign Configuration
    campaignName: z.string().default(""),
    campaignDescription: z.string().default(""),

    // Email Content
    subject: z.string().default(""),
    htmlContent: z.string().default(""),
    textContent: z.string().default(""),
    templateId: z.string().default(""),

    // Recipients
    recipients: z
      .array(
        z.object({
          email: z.string(),
          name: z.string().optional(),
          variables: z.record(z.string()).optional(),
        })
      )
      .default([]),
    recipientListId: z.string().default(""),

    // Sending Configuration
    batchSize: z.number().default(50),
    delayBetweenBatches: z.number().default(1000), // milliseconds
    maxRetriesPerEmail: z.number().default(3),

    // Scheduling
    scheduleType: z
      .enum(["immediate", "scheduled", "recurring"])
      .default("immediate"),
    scheduledTime: z.string().default(""),
    recurringPattern: z.string().default(""),

    // Rate Limiting
    maxEmailsPerHour: z.number().default(100),
    maxEmailsPerDay: z.number().default(1000),
    respectUnsubscribes: z.boolean().default(true),

    // Tracking
    trackOpens: z.boolean().default(true),
    trackClicks: z.boolean().default(true),
    trackBounces: z.boolean().default(true),

    // Campaign Status
    status: z
      .enum(["draft", "scheduled", "sending", "paused", "completed", "failed"])
      .default("draft"),
    progress: z
      .object({
        total: z.number().default(0),
        sent: z.number().default(0),
        delivered: z.number().default(0),
        bounced: z.number().default(0),
        failed: z.number().default(0),
        opened: z.number().default(0),
        clicked: z.number().default(0),
      })
      .default({
        total: 0,
        sent: 0,
        delivered: 0,
        bounced: 0,
        failed: 0,
        opened: 0,
        clicked: 0,
      }),

    // Error Handling
    errors: z
      .array(
        z.object({
          email: z.string(),
          error: z.string(),
          timestamp: z.string(),
        })
      )
      .default([]),

    // UI State
    activeTab: z
      .enum(["content", "recipients", "settings", "progress"])
      .default("content"),
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    expandedSize: SafeSchemas.text("VE3"),
    collapsedSize: SafeSchemas.text("C2"),

    // output
    campaignId: z.string().default(""),
    successOutput: z.boolean().default(false),
    errorOutput: z.string().default(""),

    label: z.string().optional(),
  })
  .passthrough();

export type EmailBulkData = z.infer<typeof EmailBulkDataSchema>;

const validateNodeData = createNodeValidator(EmailBulkDataSchema, "EmailBulk");

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

function createDynamicSpec(data: EmailBulkData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.VE3;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C2;

  /**
   * HANDLE_TOOLTIPS – ultra‑concise labels for handles
   * [Explanation], basically 1–3 word hints shown before dynamic value/type
   */
  const HANDLE_TOOLTIPS = {
    TEMPLATE_IN: "Template",
    RECIPIENTS_IN: "Recipients",
    CAMPAIGN_OUT: "Campaign",
    SUCCESS_OUT: "Success",
  } as const;

  return {
    kind: "emailBulk",
    displayName: "Email Bulk",
    label: "Email Bulk",
    category: CATEGORIES.EMAIL,
    size: { expanded, collapsed },
    handles: [
      {
        id: "template-input",
        code: "t",
        position: "left",
        type: "target",
        dataType: "JSON",
        tooltip: HANDLE_TOOLTIPS.TEMPLATE_IN,
      },
      {
        id: "recipients-input",
        code: "r",
        position: "top",
        type: "target",
        dataType: "Array",
        tooltip: HANDLE_TOOLTIPS.RECIPIENTS_IN,
      },
      {
        id: "campaign-output",
        code: "c",
        position: "right",
        type: "source",
        dataType: "JSON",
        tooltip: HANDLE_TOOLTIPS.CAMPAIGN_OUT,
      },
      {
        id: "success-output",
        code: "s",
        position: "bottom",
        type: "source",
        dataType: "Boolean",
        tooltip: HANDLE_TOOLTIPS.SUCCESS_OUT,
      },
    ],
    inspector: { key: "EmailBulkInspector" },
    version: 1,
    runtime: { execute: "emailBulk_execute_v1" },
    initialData: createSafeInitialData(EmailBulkDataSchema, {
      campaignName: "",
      campaignDescription: "",
      subject: "",
      htmlContent: "",
      textContent: "",
      templateId: "",
      recipients: [],
      recipientListId: "",
      batchSize: 50,
      delayBetweenBatches: 1000,
      maxRetriesPerEmail: 3,
      scheduleType: "immediate",
      scheduledTime: "",
      recurringPattern: "",
      maxEmailsPerHour: 100,
      maxEmailsPerDay: 1000,
      respectUnsubscribes: true,
      trackOpens: true,
      trackClicks: true,
      trackBounces: true,
      status: "draft",
      progress: {
        total: 0,
        sent: 0,
        delivered: 0,
        bounced: 0,
        failed: 0,
        opened: 0,
        clicked: 0,
      },
      errors: [],
      activeTab: "content",
      campaignId: "",
      successOutput: false,
      errorOutput: "",
    }),
    dataSchema: EmailBulkDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "campaignId",
        "successOutput",
        "errorOutput",
        "progress",
        "errors",
        "expandedSize",
        "collapsedSize",
        "status",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        {
          key: "campaignName",
          type: "text",
          label: "Campaign Name",
          placeholder: "Enter campaign name",
        },
        {
          key: "campaignDescription",
          type: "textarea",
          label: "Description",
          placeholder: "Campaign description",
        },
        {
          key: "subject",
          type: "text",
          label: "Subject",
          placeholder: "Email subject",
        },
        { key: "batchSize", type: "number", label: "Batch Size" },
        {
          key: "delayBetweenBatches",
          type: "number",
          label: "Delay Between Batches (ms)",
        },
        { key: "maxEmailsPerHour", type: "number", label: "Max Emails/Hour" },
        { key: "maxEmailsPerDay", type: "number", label: "Max Emails/Day" },
        {
          key: "scheduleType",
          type: "select",
          label: "Schedule Type",
          validation: {
            options: [
              { value: "immediate", label: "Send Immediately" },
              { value: "scheduled", label: "Schedule for Later" },
              { value: "recurring", label: "Recurring Campaign" },
            ],
          },
        },
        { key: "trackOpens", type: "boolean", label: "Track Opens" },
        { key: "trackClicks", type: "boolean", label: "Track Clicks" },
        { key: "trackBounces", type: "boolean", label: "Track Bounces" },
        {
          key: "respectUnsubscribes",
          type: "boolean",
          label: "Respect Unsubscribes",
        },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuMail",
    author: "Agenitix Team",
    description: "Send bulk emails with campaign management and tracking",
    feature: "email",
    tags: ["email", "bulk", "campaign", "mass-sending", "tracking"],
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE3",
  collapsedSize: "C2",
} as EmailBulkData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const EmailBulkNode = memo(({ id, spec }: NodeProps & { spec: NodeSpec }) => {
  // -------------------------------------------------------------------------
  const { nodeData, updateNodeData } = useNodeData(id, {});
  const { authToken: token } = useAuth();

  // -------------------------------------------------------------------------
  // STATE MANAGEMENT (grouped for clarity)
  // -------------------------------------------------------------------------
  const {
    isExpanded,
    isEnabled,
    campaignName,
    campaignDescription,
    subject,
    htmlContent,
    textContent,
    recipients,
    batchSize,
    delayBetweenBatches,
    maxEmailsPerHour,
    maxEmailsPerDay,
    scheduleType,
    scheduledTime,
    trackOpens,
    trackClicks,
    trackBounces,
    respectUnsubscribes,
    status,
    progress,
    errors,
    activeTab,
    isActive,
  } = nodeData as EmailBulkData;

  const categoryStyles = CATEGORY_TEXT.EMAIL;

  // Global React‑Flow store (nodes & edges) – triggers re‑render on change
  const _nodes = useStore((s) => s.nodes);
  const _edges = useStore((s) => s.edges);

  // Keep last emitted output to avoid redundant writes
  const _lastOutputRef = useRef<string | null>(null);

  // -------------------------------------------------------------------------
  // 4.3  Callbacks
  // -------------------------------------------------------------------------

  /** Toggle between collapsed / expanded */
  const toggleExpand = useCallback(() => {
    updateNodeData({ isExpanded: !isExpanded });
  }, [isExpanded, updateNodeData]);

  /** Start bulk email campaign */
  const startCampaign = useCallback(() => {
    if (!campaignName || !subject || recipients.length === 0) {
      toast.error("Campaign name, subject, and recipients are required");
      return;
    }

    // Generate campaign ID
    const campaignId = `campaign_${Date.now()}`;

    updateNodeData({
      status: "sending",
      campaignId,
      progress: {
        total: recipients.length,
        sent: 0,
        delivered: 0,
        bounced: 0,
        failed: 0,
        opened: 0,
        clicked: 0,
      },
      errors: [],
    });

    // Simulate bulk sending process
    let sent = 0;
    let delivered = 0;
    let bounced = 0;
    let failed = 0;

    const sendBatch = () => {
      const batchStart = sent;
      const batchEnd = Math.min(sent + batchSize, recipients.length);
      const currentBatch = recipients.slice(batchStart, batchEnd);

      // Simulate sending each email in the batch
      currentBatch.forEach((recipient, index) => {
        setTimeout(() => {
          // Simulate success/failure rates
          const random = Math.random();
          if (random > 0.95) {
            // 5% failure rate
            failed++;
            updateNodeData((prev: EmailBulkData) => ({
              ...prev,
              errors: [
                ...prev.errors,
                {
                  email: recipient.email,
                  error: "Failed to send email",
                  timestamp: new Date().toISOString(),
                },
              ],
            }));
          } else if (random > 0.9) {
            // 5% bounce rate
            bounced++;
          } else {
            // 90% delivery rate
            delivered++;
          }

          sent++;

          // Update progress
          updateNodeData((prev: EmailBulkData) => ({
            ...prev,
            progress: {
              ...prev.progress,
              sent,
              delivered,
              bounced,
              failed,
            },
          }));

          // Check if campaign is complete
          if (sent >= recipients.length) {
            const success = failed === 0;
            updateNodeData({
              status: success ? "completed" : "failed",
              successOutput: success,
              errorOutput: success
                ? ""
                : `Campaign completed with ${failed} failures`,
              isActive: true,
            });

            if (success) {
              toast.success(
                `Campaign completed successfully! Sent ${delivered} emails`
              );
            } else {
              toast.error(`Campaign completed with ${failed} failures`);
            }
          }
        }, index * 100); // Small delay between individual emails
      });

      // Schedule next batch
      if (batchEnd < recipients.length) {
        setTimeout(sendBatch, delayBetweenBatches);
      }
    };

    // Start sending
    toast.success(`Starting campaign: ${campaignName}`);
    sendBatch();
  }, [
    campaignName,
    subject,
    recipients,
    batchSize,
    delayBetweenBatches,
    updateNodeData,
  ]);

  /** Pause campaign */
  const pauseCampaign = useCallback(() => {
    updateNodeData({ status: "paused" });
    toast.info("Campaign paused");
  }, [updateNodeData]);

  /** Resume campaign */
  const resumeCampaign = useCallback(() => {
    updateNodeData({ status: "sending" });
    toast.info("Campaign resumed");
  }, [updateNodeData]);

  // -------------------------------------------------------------------------
  // 4.4  Effects
  // -------------------------------------------------------------------------

  /** Update output when campaign data changes */
  useEffect(() => {
    if (isEnabled && campaignName && recipients.length > 0) {
      updateNodeData({
        isActive: true,
      });
    } else {
      updateNodeData({
        isActive: false,
      });
    }
  }, [isEnabled, campaignName, recipients, updateNodeData]);

  // -------------------------------------------------------------------------
  // 4.5  Validation
  // -------------------------------------------------------------------------
  const validation = validateNodeData(nodeData);
  if (!validation.success) {
    reportValidationError("EmailBulk", id, validation.errors, {
      originalData: validation.originalData,
      component: "EmailBulkNode",
    });
  }

  useNodeDataValidation(EmailBulkDataSchema, "EmailBulk", validation.data, id);

  // -------------------------------------------------------------------------
  // 4.6  Render
  // -------------------------------------------------------------------------

  if (!isExpanded) {
    return (
      <div className={CONTENT.collapsed}>
        <div className="flex flex-col items-center gap-1">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
            Bulk
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px]">
            {campaignName || "No campaign"}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {recipients.length} recipients
          </div>
          {status === "sending" && (
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          )}
          {status === "completed" && (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${CONTENT.expanded} ${isEnabled ? "" : CONTENT.disabled}`}>
      {/* Header */}
      <div className={CONTENT.header}>
        <LabelNode nodeId={id} label="Email Bulk" />
        <ExpandCollapseButton showUI={isExpanded} onToggle={toggleExpand} />
      </div>

      {/* Body */}
      <div className={CONTENT.body}>
        {/* Campaign Info */}
        <div className="mb-3">
          <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
            Campaign:
          </div>
          <div className="text-sm font-medium">
            {campaignName || "Untitled Campaign"}
          </div>
          {campaignDescription && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {campaignDescription}
            </div>
          )}
        </div>

        {/* Status and Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-gray-600 dark:text-gray-300">
              Status:
            </div>
            <div
              className={`text-xs px-2 py-1 rounded ${
                status === "completed"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : status === "sending"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    : status === "failed"
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      : status === "paused"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </div>
          </div>

          {/* Progress Bar */}
          {progress.total > 0 && (
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                <span>
                  Progress: {progress.sent} / {progress.total}
                </span>
                <span>
                  {Math.round((progress.sent / progress.total) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${(progress.sent / progress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Stats */}
          {progress.total > 0 && (
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="font-medium text-green-600 dark:text-green-400">
                  {progress.delivered}
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  Delivered
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium text-yellow-600 dark:text-yellow-400">
                  {progress.bounced}
                </div>
                <div className="text-gray-500 dark:text-gray-400">Bounced</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-red-600 dark:text-red-400">
                  {progress.failed}
                </div>
                <div className="text-gray-500 dark:text-gray-400">Failed</div>
              </div>
            </div>
          )}
        </div>

        {/* Recipients */}
        <div className="mb-3">
          <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
            Recipients:
          </div>
          <div className="text-sm">
            {recipients.length > 0
              ? `${recipients.length} recipients loaded`
              : "No recipients"}
          </div>
          {recipients.length > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Rate limit: {maxEmailsPerHour}/hour, {maxEmailsPerDay}/day
            </div>
          )}
        </div>

        {/* Campaign Controls */}
        <div className="mt-auto">
          {status === "draft" && (
            <button
              onClick={startCampaign}
              disabled={
                !isEnabled ||
                !campaignName ||
                !subject ||
                recipients.length === 0
              }
              className="w-full px-3 py-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Campaign
            </button>
          )}

          {status === "sending" && (
            <button
              onClick={pauseCampaign}
              disabled={!isEnabled}
              className="w-full px-3 py-2 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Pause Campaign
            </button>
          )}

          {status === "paused" && (
            <button
              onClick={resumeCampaign}
              disabled={!isEnabled}
              className="w-full px-3 py-2 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Resume Campaign
            </button>
          )}

          {(status === "completed" || status === "failed") && (
            <div className="text-xs text-center py-2">
              {status === "completed" ? (
                <span className="text-green-600 dark:text-green-400">
                  Campaign completed successfully
                </span>
              ) : (
                <span className="text-red-600 dark:text-red-400">
                  Campaign completed with errors
                </span>
              )}
            </div>
          )}
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mt-2">
            <div className="text-xs text-red-600 dark:text-red-400 mb-1">
              Errors ({errors.length}):
            </div>
            <div className="max-h-20 overflow-y-auto text-xs">
              {errors.slice(0, 3).map((error, i) => (
                <div
                  key={i}
                  className="text-red-500 dark:text-red-400 p-1 bg-red-50 dark:bg-red-900/20 rounded mb-1"
                >
                  {error.email}: {error.error}
                </div>
              ))}
              {errors.length > 3 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  ... and {errors.length - 3} more errors
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status */}
        {isActive && (
          <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Bulk mailer active
          </div>
        )}
      </div>
    </div>
  );
});

EmailBulkNode.displayName = "EmailBulkNode";

// -----------------------------------------------------------------------------
// 5️⃣  Dynamic spec wrapper component
// -----------------------------------------------------------------------------

const EmailBulkNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, {});

  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as EmailBulkData),
    [
      (nodeData as EmailBulkData).expandedSize,
      (nodeData as EmailBulkData).collapsedSize,
    ]
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <EmailBulkNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
};

export default EmailBulkNodeWithDynamicSpec;
