/**
 * emailUpdater NODE – Email modification and update operations
 *
 * • Update email metadata (flags, labels, categories)
 * • Move emails between folders
 * • Mark emails as read/unread, important/not important
 * • Add or remove labels and tags
 * • Batch update capabilities for multiple emails
 *
 * Keywords: email-update, flags, labels, folders, batch-operations
 */

import type { NodeProps } from "@xyflow/react";

import { memo, useCallback, useEffect, useMemo } from "react";
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

import { toast } from "sonner";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const EmailUpdaterDataSchema = z
  .object({
    // Email Selection
    emailIds: z.array(z.string()).default([]),
    selectedAccount: z.string().default(""),
    folderPath: z.string().default("INBOX"),

    // Update Operations
    operations: z
      .object({
        markAsRead: z.boolean().default(false),
        markAsUnread: z.boolean().default(false),
        markAsImportant: z.boolean().default(false),
        markAsNotImportant: z.boolean().default(false),
        moveToFolder: z.string().default(""),
        addLabels: z.array(z.string()).default([]),
        removeLabels: z.array(z.string()).default([]),
        archive: z.boolean().default(false),
        trash: z.boolean().default(false),
        restore: z.boolean().default(false),
      })
      .default({
        markAsRead: false,
        markAsUnread: false,
        markAsImportant: false,
        markAsNotImportant: false,
        moveToFolder: "",
        addLabels: [],
        removeLabels: [],
        archive: false,
        trash: false,
        restore: false,
      }),

    // Batch Processing
    batchSize: z.number().default(10),
    processingDelay: z.number().default(500),

    // Processing State
    status: z
      .enum(["idle", "processing", "success", "error", "partial"])
      .default("idle"),
    progress: z
      .object({
        total: z.number().default(0),
        processed: z.number().default(0),
        succeeded: z.number().default(0),
        failed: z.number().default(0),
      })
      .default({
        total: 0,
        processed: 0,
        succeeded: 0,
        failed: 0,
      }),

    // Error Handling
    error: z.string().default(""),
    errors: z
      .array(
        z.object({
          emailId: z.string(),
          error: z.string(),
        })
      )
      .default([]),

    // UI State
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    expandedSize: SafeSchemas.text("VE2"),
    collapsedSize: SafeSchemas.text("C2"),

    // output
    updatedEmailIds: z.array(z.string()).default([]),
    successOutput: z.boolean().default(false),
    errorOutput: z.string().default(""),

    label: z.string().optional(),
  })
  .passthrough();

export type EmailUpdaterData = z.infer<typeof EmailUpdaterDataSchema>;

const validateNodeData = createNodeValidator(
  EmailUpdaterDataSchema,
  "EmailUpdater"
);

// -----------------------------------------------------------------------------
// 2️⃣  Constants & Components
// -----------------------------------------------------------------------------

const CONTENT = {
  expanded: "p-4 w-full h-full flex flex-col",
  collapsed: "flex items-center justify-center w-full h-full",
  header: "flex items-center justify-between mb-3",
  body: "flex-1 flex flex-col gap-3",
  disabled:
    "opacity-75 bg-zinc-100 dark:bg-zinc-500 rounded-md transition-all duration-300",
} as const;

/** Reusable operation checkbox component, basically reduces repetitive JSX */
const OperationCheckbox = memo(
  ({
    label,
    checked,
    onChange,
    disabled,
  }: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
  }) => (
    <label className="flex items-center space-x-2 text-xs">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="rounded"
      />
      <span>{label}</span>
    </label>
  )
);

OperationCheckbox.displayName = "OperationCheckbox";

/** Memoized operations section to prevent re-renders, basically optimize checkbox groups */
const OperationsSection = memo(
  ({
    operations,
    isEnabled,
    toggleOperation,
  }: {
    operations: EmailUpdaterData["operations"];
    isEnabled: boolean;
    toggleOperation: (
      operation: keyof EmailUpdaterData["operations"],
      value: boolean
    ) => void;
  }) => (
    <div className="mb-3">
      <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">
        Update Operations:
      </div>

      {/* Read/Unread */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <OperationCheckbox
          label="Mark as Read"
          checked={operations.markAsRead}
          onChange={(checked) => toggleOperation("markAsRead", checked)}
          disabled={!isEnabled}
        />
        <OperationCheckbox
          label="Mark as Unread"
          checked={operations.markAsUnread}
          onChange={(checked) => toggleOperation("markAsUnread", checked)}
          disabled={!isEnabled}
        />
      </div>

      {/* Important/Not Important */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <OperationCheckbox
          label="Mark Important"
          checked={operations.markAsImportant}
          onChange={(checked) => toggleOperation("markAsImportant", checked)}
          disabled={!isEnabled}
        />
        <OperationCheckbox
          label="Not Important"
          checked={operations.markAsNotImportant}
          onChange={(checked) => toggleOperation("markAsNotImportant", checked)}
          disabled={!isEnabled}
        />
      </div>

      {/* Archive/Trash/Restore */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <OperationCheckbox
          label="Archive"
          checked={operations.archive}
          onChange={(checked) => toggleOperation("archive", checked)}
          disabled={!isEnabled}
        />
        <OperationCheckbox
          label="Trash"
          checked={operations.trash}
          onChange={(checked) => toggleOperation("trash", checked)}
          disabled={!isEnabled}
        />
        <OperationCheckbox
          label="Restore"
          checked={operations.restore}
          onChange={(checked) => toggleOperation("restore", checked)}
          disabled={!isEnabled}
        />
      </div>
    </div>
  )
);

OperationsSection.displayName = "OperationsSection";

/** Memoized status display to prevent re-renders, basically optimize status indicators */
const StatusDisplay = memo(
  ({
    status,
    progress,
    error,
  }: {
    status: EmailUpdaterData["status"];
    progress: EmailUpdaterData["progress"];
    error: string;
  }) => {
    if (status === "processing") {
      return (
        <div className="mb-2">
          <div className="text-xs text-gray-600 dark:text-gray-300">
            Processing: {progress.processed} of {progress.total}
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{
                width: `${(progress.processed / progress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      );
    }

    if (status === "success") {
      return (
        <div className="text-xs text-green-600 dark:text-green-400 mb-2">
          Successfully updated {progress.succeeded} emails
        </div>
      );
    }

    if (status === "error") {
      return (
        <div className="text-xs text-red-600 dark:text-red-400 mb-2">
          {error || "Failed to update emails"}
        </div>
      );
    }

    if (status === "partial") {
      return (
        <div className="text-xs text-yellow-600 dark:text-yellow-400 mb-2">
          Updated {progress.succeeded} emails, failed to update{" "}
          {progress.failed} emails
        </div>
      );
    }

    return null;
  }
);

StatusDisplay.displayName = "StatusDisplay";

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

function createDynamicSpec(data: EmailUpdaterData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.VE2;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C2;

  return {
    kind: "emailUpdater",
    displayName: "Email Updater",
    label: "Email Updater",
    category: CATEGORIES.EMAIL,
    size: { expanded, collapsed },
    handles: [
      {
        id: "email-input",
        code: "e",
        position: "left",
        type: "target",
        dataType: "Array",
      },
      {
        id: "account-input",
        code: "a",
        position: "top",
        type: "target",
        dataType: "JSON",
      },
      {
        id: "updated-output",
        code: "u",
        position: "right",
        type: "source",
        dataType: "Array",
      },
      {
        id: "success-output",
        code: "s",
        position: "bottom",
        type: "source",
        dataType: "Boolean",
      },
    ],
    inspector: { key: "EmailUpdaterInspector" },
    version: 1,
    runtime: { execute: "emailUpdater_execute_v1" },
    initialData: createSafeInitialData(EmailUpdaterDataSchema, {
      emailIds: [],
      selectedAccount: "",
      folderPath: "INBOX",
      operations: {
        markAsRead: false,
        markAsUnread: false,
        markAsImportant: false,
        markAsNotImportant: false,
        moveToFolder: "",
        addLabels: [],
        removeLabels: [],
        archive: false,
        trash: false,
        restore: false,
      },
      batchSize: 10,
      processingDelay: 500,
      status: "idle",
      progress: {
        total: 0,
        processed: 0,
        succeeded: 0,
        failed: 0,
      },
      error: "",
      errors: [],
      updatedEmailIds: [],
      successOutput: false,
      errorOutput: "",
    }),
    dataSchema: EmailUpdaterDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "updatedEmailIds",
        "successOutput",
        "errorOutput",
        "progress",
        "errors",
        "expandedSize",
        "collapsedSize",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        { key: "batchSize", type: "number", label: "Batch Size" },
        {
          key: "processingDelay",
          type: "number",
          label: "Processing Delay (ms)",
        },
        {
          key: "operations.markAsRead",
          type: "boolean",
          label: "Mark as Read",
        },
        {
          key: "operations.markAsUnread",
          type: "boolean",
          label: "Mark as Unread",
        },
        {
          key: "operations.markAsImportant",
          type: "boolean",
          label: "Mark as Important",
        },
        { key: "operations.archive", type: "boolean", label: "Archive" },
        { key: "operations.trash", type: "boolean", label: "Move to Trash" },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuPencil",
    author: "Agenitix Team",
    description: "Update email properties and metadata in batch operations",
    feature: "email",
    tags: ["email", "update", "batch", "operations", "flags", "labels"],
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE2",
  collapsedSize: "C2",
} as EmailUpdaterData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const EmailUpdaterNode = memo(({ id }: NodeProps & { spec: NodeSpec }) => {
  // -------------------------------------------------------------------------
  const { nodeData, updateNodeData } = useNodeData(id, {});

  // -------------------------------------------------------------------------
  // STATE MANAGEMENT (grouped for clarity)
  // -------------------------------------------------------------------------
  const {
    isExpanded,
    isEnabled,
    emailIds,
    operations,
    status,
    progress,
    error,
    batchSize,
    processingDelay,
    isActive,
  } = nodeData as EmailUpdaterData;

  // Memoize operation validation check, basically avoid recalculating on every render
  const hasValidOperations = useMemo(() => {
    return Object.values(operations).some((value) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === "string") {
        return !!value;
      }
      return !!value;
    });
  }, [operations]);

  // -------------------------------------------------------------------------
  // 4.3  Callbacks
  // -------------------------------------------------------------------------

  /** Toggle between collapsed / expanded */
  const toggleExpand = useCallback(() => {
    updateNodeData({ isExpanded: !isExpanded });
  }, [isExpanded, updateNodeData]);

  /** Toggle operation - optimized to reduce object recreation, basically prevent new objects on every call */
  const toggleOperation = useCallback(
    (operation: keyof typeof operations, value: boolean) => {
      // Only update if value actually changed to prevent unnecessary re-renders
      if (operations[operation] === value) {
        return;
      }

      updateNodeData({
        operations: {
          ...operations,
          [operation]: value,
        },
      });
    },
    [operations, updateNodeData]
  );

  /** Execute update operation */
  const executeUpdate = useCallback(() => {
    if (emailIds.length === 0) {
      toast.error("No emails selected for update");
      return;
    }

    if (!hasValidOperations) {
      toast.error("At least one update operation must be selected");
      return;
    }

    // Set status to processing
    updateNodeData({
      status: "processing",
      progress: {
        total: emailIds.length,
        processed: 0,
        succeeded: 0,
        failed: 0,
      },
      error: "",
      errors: [],
    });

    // Simulate processing
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    const errors: { emailId: string; error: string }[] = [];

    const processBatch = () => {
      const batch = emailIds.slice(processed, processed + batchSize);
      if (batch.length === 0) {
        // All done
        const success = failed === 0;
        updateNodeData({
          status: success
            ? "success"
            : failed === emailIds.length
              ? "error"
              : "partial",
          progress: {
            total: emailIds.length,
            processed: emailIds.length,
            succeeded,
            failed,
          },
          error: success ? "" : `Failed to update ${failed} emails`,
          errors,
          updatedEmailIds:
            succeeded > 0
              ? emailIds.filter((id) => !errors.some((e) => e.emailId === id))
              : [],
          successOutput: success,
          errorOutput: success ? "" : `Failed to update ${failed} emails`,
          isActive: true,
        });

        if (success) {
          toast.success(`Successfully updated ${succeeded} emails`);
        } else {
          toast.error(`Failed to update ${failed} emails`);
        }
        return;
      }

      // Process this batch
      batch.forEach((emailId) => {
        // Simulate success/failure (95% success rate)
        const isSuccess = Math.random() > 0.05;
        if (isSuccess) {
          succeeded++;
        } else {
          failed++;
          errors.push({
            emailId,
            error: "Failed to update email",
          });
        }
      });

      processed += batch.length;

      // Update progress
      updateNodeData({
        progress: {
          total: emailIds.length,
          processed,
          succeeded,
          failed,
        },
      });

      // Process next batch
      setTimeout(processBatch, processingDelay);
    };

    // Start processing
    processBatch();
  }, [
    emailIds,
    hasValidOperations,
    batchSize,
    processingDelay,
    updateNodeData,
  ]);

  // -------------------------------------------------------------------------
  // 4.4  Effects
  // -------------------------------------------------------------------------

  /** Update output when data changes */
  useEffect(() => {
    if (isEnabled && emailIds.length > 0) {
      updateNodeData({
        isActive: true,
      });
    } else {
      updateNodeData({
        isActive: false,
      });
    }
  }, [isEnabled, emailIds, updateNodeData]);

  // -------------------------------------------------------------------------
  // 4.5  Validation
  // -------------------------------------------------------------------------
  const validation = validateNodeData(nodeData);
  if (!validation.success) {
    reportValidationError("EmailUpdater", id, validation.errors, {
      originalData: validation.originalData,
      component: "EmailUpdaterNode",
    });
  }

  useNodeDataValidation(
    EmailUpdaterDataSchema,
    "EmailUpdater",
    validation.data,
    id
  );

  // -------------------------------------------------------------------------
  // 4.6  Render
  // -------------------------------------------------------------------------

  if (!isExpanded) {
    return (
      <div className={CONTENT.collapsed}>
        <div className="flex flex-col items-center gap-1">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
            Updater
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {emailIds.length > 0 ? `${emailIds.length} emails` : "No emails"}
          </div>
          {status === "processing" && (
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          )}
          {isActive && status === "success" && (
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
        <LabelNode nodeId={id} label="Email Updater" />
        <ExpandCollapseButton showUI={isExpanded} onToggle={toggleExpand} />
      </div>

      {/* Body */}
      <div className={CONTENT.body}>
        {/* Email Count */}
        <div className="mb-3">
          <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
            Selected Emails:
          </div>
          <div className="text-sm font-medium">
            {emailIds.length > 0
              ? `${emailIds.length} emails selected`
              : "No emails selected"}
          </div>
        </div>

        {/* Update Operations */}
        <OperationsSection
          operations={operations}
          isEnabled={isEnabled}
          toggleOperation={toggleOperation}
        />

        {/* Status and Execute */}
        <div className="mt-auto">
          <StatusDisplay status={status} progress={progress} error={error} />

          <button
            type="button"
            onClick={executeUpdate}
            disabled={
              !isEnabled || status === "processing" || emailIds.length === 0
            }
            className="w-full px-3 py-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "processing" ? "Processing..." : "Update Emails"}
          </button>
        </div>

        {/* Status */}
        {error && (
          <div className="text-xs text-red-500 dark:text-red-400 p-1 bg-red-50 dark:bg-red-900/20 rounded mt-2">
            {error}
          </div>
        )}

        {isActive && (
          <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Updater active
          </div>
        )}
      </div>
    </div>
  );
});

EmailUpdaterNode.displayName = "EmailUpdaterNode";

// -----------------------------------------------------------------------------
// 5️⃣  Dynamic spec wrapper component
// -----------------------------------------------------------------------------

const EmailUpdaterNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, {});
  const typedNodeData = nodeData as EmailUpdaterData;

  const dynamicSpec = useMemo(
    () => createDynamicSpec(typedNodeData),
    [typedNodeData.expandedSize, typedNodeData.collapsedSize]
  );

  // Memoise the scaffolded component to keep focus, basically prevent unnecessary re-renders
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <EmailUpdaterNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
};

export default EmailUpdaterNodeWithDynamicSpec;
