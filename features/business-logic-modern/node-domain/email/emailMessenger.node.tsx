"use client";
/**
 * Route: features/business-logic-modern/node-domain/email/emailMessenger.node.tsx
 * EMAIL MESSENGER NODE – Compose an email object as JSON for downstream sending
 *
 * • Mirrors EmailReader UI/UX for complete consistency (collapsed/expanded views)
 * • Produces a clean JSON payload on the "message-output" handle for `emailSender`
 * • Fields: recipients (to/cc/bcc), subject, content (text/html), optional flags
 * • Output propagation gated by isActive and isEnabled; unified handle output map
 * • Dynamic sizing via expandedSize/collapsedSize with scaffold integration
 *
 * Keywords: email, messenger, compose, json-output, handle-system, shadcn
 */

import type { NodeProps } from "@xyflow/react";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  ChangeEvent,
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
import { generateoutputField } from "@/features/business-logic-modern/infrastructure/node-core/handleOutputUtils";

// Local UI components mirroring EmailReader styling
import { EmailMessengerCollapsed } from "./components/EmailMessengerCollapsed";
import { EmailMessengerExpanded } from "./components/EmailMessengerExpanded";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const EmailMessengerDataSchema = z
  .object({
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
      })
      .default({ text: "", html: "", useHtml: false }),

    // UI State
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    expandedSize: SafeSchemas.text("VE2"),
    collapsedSize: SafeSchemas.text("C2"),

    // Outputs
    output: z.record(z.string(), z.unknown()).optional(),
    label: z.string().optional(),
  })
  .passthrough();

export type EmailMessengerData = z.infer<typeof EmailMessengerDataSchema>;

const validateNodeData = createNodeValidator(
  EmailMessengerDataSchema,
  "EmailMessenger"
);

// -----------------------------------------------------------------------------
// 2️⃣  Constants
// -----------------------------------------------------------------------------

const CATEGORY_TEXT = {
  EMAIL: {
    primary: "text-[--node-email-text]",
  },
} as const;

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

function createDynamicSpec(data: EmailMessengerData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.VE2;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C2;

  /**
   * HANDLE_TOOLTIPS – concise labels following EmailReader conventions
   * [Explanation], basically 1–3 word hints
   */
  const HANDLE_TOOLTIPS = {
    MESSAGE_OUT: "Message",
    STATUS_OUT: "Status",
  } as const;

  return {
    kind: "emailMessenger",
    displayName: "Email Messenger",
    label: "Email Messenger",
    category: CATEGORIES.EMAIL,
    size: { expanded, collapsed },
    handles: [
      {
        id: "message-output",
        code: "json",
        position: "right",
        type: "source",
        dataType: "JSON",
        tooltip: HANDLE_TOOLTIPS.MESSAGE_OUT,
      },
      {
        id: "status-output",
        code: "boolean",
        position: "bottom",
        type: "source",
        dataType: "boolean",
        tooltip: HANDLE_TOOLTIPS.STATUS_OUT,
      },
    ],
    inspector: { key: "EmailMessengerInspector" },
    version: 1,
    runtime: { execute: "emailMessenger_execute_v1" },
    initialData: createSafeInitialData(EmailMessengerDataSchema, {
      recipients: { to: [], cc: [], bcc: [] },
      subject: "",
      content: { text: "", html: "", useHtml: false },
      output: {},
    }),
    dataSchema: EmailMessengerDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "expandedSize",
        "collapsedSize",
        "output",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
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
      "Compose an email JSON payload (recipients, subject, content) for Email Sender",
    feature: "email",
    tags: ["email", "compose", "message", "json"],
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE2",
  collapsedSize: "C2",
} as EmailMessengerData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const EmailMessengerNode = memo(
  ({ id, spec }: NodeProps & { spec: NodeSpec }) => {
    const { nodeData, updateNodeData } = useNodeData(id, {});

    // Category styling for consistent theming, basically email node styling
    const categoryStyles = CATEGORY_TEXT.EMAIL;

    // Derived state
    const { isExpanded, isEnabled, recipients, subject, content } =
      (nodeData as EmailMessengerData) || {};

    // Keep last emitted output to avoid redundant writes
    const lastOutputRef = useRef<string | null>(null);

    // -----------------------------------------------------------------------
    // Callbacks
    // -----------------------------------------------------------------------

    const toggleExpand = useCallback(() => {
      updateNodeData({ isExpanded: !isExpanded });
    }, [isExpanded, updateNodeData]);

    const handleSubjectChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        updateNodeData({ subject: e.target.value });
      },
      [updateNodeData]
    );

    const handleRecipientsChange = useCallback(
      (field: "to" | "cc" | "bcc") => (e: ChangeEvent<HTMLTextAreaElement>) => {
        const recipientString = e.target.value;
        const emails = recipientString
          .split(",")
          .map((email) => email.trim())
          .filter((email) => email.length > 0);
        const safeRecipients = (recipients as EmailMessengerData["recipients"]) || {
          to: [],
          cc: [],
          bcc: [],
        };
        updateNodeData({
          recipients: {
            ...safeRecipients,
            [field]: emails,
          },
        });
      },
      [recipients, updateNodeData]
    );

    const handleContentChange = useCallback(
      (field: "text" | "html") => (e: ChangeEvent<HTMLTextAreaElement>) => {
        const safeContent = content || { text: "", html: "", useHtml: false };
        updateNodeData({
          content: {
            ...safeContent,
            [field]: e.target.value,
          },
        });
      },
      [content, updateNodeData]
    );

    const handleCheckboxChange = useCallback(
      (field: string) => (e: ChangeEvent<HTMLInputElement>) => {
        if (field === "useHtml") {
          const safeContent = content || { text: "", html: "", useHtml: false };
          updateNodeData({ content: { ...safeContent, useHtml: e.target.checked } });
          return;
        }
        updateNodeData({ [field]: e.target.checked } as Partial<EmailMessengerData>);
      },
      [content, updateNodeData]
    );

    // Emit message JSON to handle-specific output
    const emitMessage = useCallback(() => {
      const safeRecipients = recipients || { to: [], cc: [], bcc: [] };
      const safeContent = content || { text: "", html: "", useHtml: false };
      const message = {
        recipients: {
          to: safeRecipients.to,
          cc: safeRecipients.cc,
          bcc: safeRecipients.bcc,
        },
        subject: subject || "",
        content: {
          text: safeContent.text || "",
          html: safeContent.html || "",
          useHtml: Boolean(safeContent.useHtml),
        },
      };

      updateNodeData({
        ["message-output"]: message,
        output: { ["message-output"]: message },
        isActive: true,
      });
    }, [recipients, subject, content, updateNodeData]);

    // -----------------------------------------------------------------------
    // Effects
    // -----------------------------------------------------------------------

    // Auto-enable when a minimal valid message is present
    useEffect(() => {
      const safeRecipients = recipients || { to: [], cc: [], bcc: [] };
      const hasTo = Array.isArray(safeRecipients.to) && safeRecipients.to.length > 0;
      const hasContent = Boolean(content?.text?.trim() || content?.html?.trim());
      const shouldBeActive = isEnabled && hasTo && hasContent && Boolean(subject?.trim());
      const curr = nodeData as EmailMessengerData;
      if ((curr.isActive || false) !== shouldBeActive) {
        updateNodeData({ isActive: shouldBeActive, ["status-output"]: shouldBeActive });
      }
    }, [recipients, subject, content, isEnabled, nodeData, updateNodeData]);

    // Generate unified handle-based output map
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
    }, [spec.handles, (nodeData as any)["message-output"], (nodeData as any)["status-output"], updateNodeData, nodeData]);

    // Validation
    const validation = useMemo(() => validateNodeData(nodeData), [nodeData]);
    if (!validation.success) {
      reportValidationError("EmailMessenger", id, validation.errors, {
        originalData: validation.originalData,
        component: "EmailMessengerNode",
      });
    }

    useNodeDataValidation(
      EmailMessengerDataSchema,
      "EmailMessenger",
      validation.data,
      id
    );

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
      <>
        <LabelNode
          nodeId={id}
          label={(nodeData as EmailMessengerData).label || spec.displayName}
        />

        {isExpanded ? (
          <EmailMessengerExpanded
            nodeData={nodeData as EmailMessengerData}
            isEnabled={isEnabled as boolean}
            onSubjectChange={handleSubjectChange}
            onRecipientsChange={handleRecipientsChange}
            onContentChange={handleContentChange}
            onCheckboxChange={handleCheckboxChange}
            onEmitMessage={emitMessage}
          />
        ) : (
          <EmailMessengerCollapsed
            nodeData={nodeData as EmailMessengerData}
            categoryStyles={categoryStyles}
            onToggleExpand={toggleExpand}
            onEmitMessage={emitMessage}
          />
        )}

        <ExpandCollapseButton showUI={isExpanded} onToggle={toggleExpand} size="sm" />
      </>
    );
  }
);

// -----------------------------------------------------------------------------
// 5️⃣  High‑order wrapper – inject scaffold with dynamic spec
// -----------------------------------------------------------------------------

const EmailMessengerNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec only when the size keys change
  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as EmailMessengerData),
    [
      (nodeData as EmailMessengerData).expandedSize,
      (nodeData as EmailMessengerData).collapsedSize,
    ]
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <EmailMessengerNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
};

export default EmailMessengerNodeWithDynamicSpec;


