/* ------------------------------------------------------------------
 * Route: features/business-logic-modern/node-domain/email/emailAccount.node.tsx
 * EMAIL ACCOUNT NODE  –  authentication, connection status & output
 * ------------------------------------------------------------------
 */

import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { z } from "zod";

import { useStore } from "@xyflow/react";
import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
import { generateoutputField } from "@/features/business-logic-modern/infrastructure/node-core/handleOutputUtils";
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

import { EmailAccountCollapsed } from "./components/EmailAccountCollapsed";
import { EmailAccountExpanded } from "./components/EmailAccountExpanded";
import { EmailAccountProvider } from "./components/EmailAccountProvider";
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";

/* ------------------------------------------------------------------ */
/* 1️⃣  Schema & types                                                */
/* ------------------------------------------------------------------ */

export const EmailAccountDataSchema = z
  .object({
    provider: z.enum(["gmail", "outlook", "yahoo", "imap", "smtp"]),
    email: z.string().default(""),
    displayName: z.string().default(""),

    /* Connection state */
    isConfigured: z.boolean().default(false),
    isConnected: z.boolean().default(false),
    connectionStatus: z
      .enum(["disconnected", "connecting", "connected", "error"])
      .default("disconnected"),
    lastValidated: z.number().optional(),
    accountId: z.string().optional(),

    /* Manual (IMAP/SMTP) */
    imapHost: z.string().default(""),
    imapPort: z.number().default(993),
    smtpHost: z.string().default(""),
    smtpPort: z.number().default(587),
    username: z.string().default(""),
    password: z.string().default(""),
    useSSL: z.boolean().default(true),
    useTLS: z.boolean().default(true),

    /* OAuth UI state */
    isAuthenticating: z.boolean().default(false),

    /* Error handling */
    lastError: z.string().default(""),

    /* UI flags */
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    expandedSize: SafeSchemas.text("VE2"),
    collapsedSize: SafeSchemas.text("C2"),

    /* Output */
    output: z.record(z.string(), z.unknown()).optional(),
    label: z.string().optional(),
  })
  .passthrough();

export type EmailAccountData = z.infer<typeof EmailAccountDataSchema>;

const validateNodeData = createNodeValidator(
  EmailAccountDataSchema,
  "EmailAccount",
);

/* ------------------------------------------------------------------ */
/* 2️⃣  Defaults & helpers                                            */
/* ------------------------------------------------------------------ */

const INITIAL_DATA: Omit<EmailAccountData, "provider"> = {
  email: "",
  displayName: "",
  isConfigured: false,
  isConnected: false,
  connectionStatus: "disconnected",
  imapHost: "",
  imapPort: 993,
  smtpHost: "",
  smtpPort: 587,
  username: "",
  password: "",
  useSSL: true,
  useTLS: true,
  isAuthenticating: false,
  lastError: "",
  isEnabled: true,
  isActive: false,
  isExpanded: false,
  expandedSize: "VE2",
  collapsedSize: "C2",
  output: {},
};

const createDynamicSpec = (
  data: Pick<EmailAccountData, "expandedSize" | "collapsedSize">,
): NodeSpec => {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.VE2;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C2;

  return {
    kind: "emailAccount",
    displayName: "Email Account",
    label: "Email Account",
    category: CATEGORIES.EMAIL,
    size: { expanded, collapsed },
    handles: [
      { id: "trigger-input", code: "t", position: "top", type: "target", dataType: "Boolean" },
      { id: "account-output", code: "a", position: "right", type: "source", dataType: "JSON" },
      { id: "status-output", code: "s", position: "bottom", type: "source", dataType: "Boolean" },
    ],
    inspector: { key: "EmailAccountInspector" },
    version: 1,
    runtime: { execute: "emailAccount_execute_v1" },
    initialData: createSafeInitialData(EmailAccountDataSchema, {
      provider: "gmail",
      ...INITIAL_DATA,
    }),
    dataSchema: EmailAccountDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "accountOutput",
        "statusOutput",
        "expandedSize",
        "collapsedSize",
        "connectionStatus",
        "lastValidated",
        "accountId",
        "isAuthenticating",
        "lastError",
        "isConfigured",
        "isConnected",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        { key: "provider", type: "select", label: "Email Provider" },
        { key: "email", type: "text", label: "Email Address", placeholder: "your.email@example.com" },
        { key: "displayName", type: "text", label: "Display Name", placeholder: "Your Name" },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuMail",
    author: "Agenitix Team",
    description: "Configure and authenticate email accounts for workflow integration",
    feature: "email",
    tags: ["email", "authentication", "oauth2", "gmail", "outlook"],
    theming: {},
  };
};

/* Static spec – fallback for registry */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE2",
  collapsedSize: "C2",
});

/* ------------------------------------------------------------------ */
/* 3️⃣  React node component                                          */
/* ------------------------------------------------------------------ */

const EmailAccountNode = memo(({ id, spec }: NodeProps & { spec: NodeSpec }) => {
  /* ----- state & helpers ------------------------------------------- */
  const { nodeData, updateNodeData } = useNodeData(id, {}) as {
    nodeData: EmailAccountData;
    updateNodeData: (d: Partial<EmailAccountData>) => void;
  };

  const categoryStyles = { primary: "text-[--node-email-text]" };
  const { isExpanded, isEnabled, isConnected } = nodeData;

  /* ----- output effect --------------------------------------------- */
  const lastOutputRef = useRef<Map<string, unknown> | null>(null);

  useEffect(() => {
    if (!isEnabled) return;

    if (isConnected) {
      const outputMap = generateoutputField(spec, nodeData) as Map<
        string,
        unknown
      >;

      /* Only update when content truly changes */
      const changed =
        !lastOutputRef.current ||
        outputMap.size !== lastOutputRef.current.size ||
        [...outputMap.entries()].some(
          ([k, v]) => lastOutputRef.current?.get(k) !== v,
        );

      if (changed) {
        lastOutputRef.current = outputMap;
        updateNodeData({
          output: Object.fromEntries(outputMap),
          isActive: true,
        });
      }
    } else {
      updateNodeData({ isActive: false });
    }
  }, [isEnabled, isConnected, nodeData, spec, updateNodeData]);

  /* ----- validation ------------------------------------------------- */
  const validation = validateNodeData(nodeData);
  if (!validation.success) {
    reportValidationError("EmailAccount", id, validation.errors, {
      originalData: validation.originalData,
      component: "EmailAccountNode",
    });
  }
  useNodeDataValidation(
    EmailAccountDataSchema,
    "EmailAccount",
    validation.data,
    id,
  );

  /* ----- UI handlers ------------------------------------------------ */
  const toggleExpand = useCallback(
    () => updateNodeData({ isExpanded: !isExpanded }),
    [isExpanded, updateNodeData],
  );

  /* ----- render ----------------------------------------------------- */
  return (
    <EmailAccountProvider nodeData={nodeData} updateNodeData={updateNodeData}>
      <>
        {/* Output handle */}
        <Handle
          type="source"
          position={Position.Right}
          id="account-output"
          style={{ background: "#555", width: 8, height: 8, top: 20 }}
        />

        <LabelNode nodeId={id} label={nodeData.label ?? spec.displayName} />

        {isExpanded ? (
          <EmailAccountExpanded
            nodeData={nodeData}
            updateNodeData={updateNodeData}
            isEnabled={isEnabled}
            isAuthenticating={nodeData.isAuthenticating}
          />
        ) : (
          <EmailAccountCollapsed
            nodeData={nodeData}
            categoryStyles={categoryStyles}
            onToggleExpand={toggleExpand}
          />
        )}

        <ExpandCollapseButton showUI={isExpanded} onToggle={toggleExpand} size="sm" />
      </>
    </EmailAccountProvider>
  );
});

/* ------------------------------------------------------------------ */
/* 4️⃣  Wrapper – inject scaffold w/ dynamic spec                     */
/* ------------------------------------------------------------------ */

const EmailAccountNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  const dynamicSpec = useMemo(
    () =>
      createDynamicSpec({
        expandedSize: (nodeData as EmailAccountData).expandedSize,
        collapsedSize: (nodeData as EmailAccountData).collapsedSize,
      }),
    [
      (nodeData as EmailAccountData).expandedSize,
      (nodeData as EmailAccountData).collapsedSize,
    ],
  );

  const Scaffolded = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <EmailAccountNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec],
  );

  return <Scaffolded {...props} />;
};

export default EmailAccountNodeWithDynamicSpec;
