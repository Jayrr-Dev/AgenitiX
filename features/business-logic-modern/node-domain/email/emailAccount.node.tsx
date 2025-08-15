/* ------------------------------------------------------------------
 * Route: features/business-logic-modern/node-domain/email/emailAccount.node.tsx
 * EMAIL ACCOUNT NODE  –  authentication, connection status & output
 *
 * • Emits typed per-handle values for downstream nodes
 * • Aligns handle data types with TypeSafeHandle mapping (emailAccount, Boolean)
 * • Generates stable Map-based outputs and avoids update loops
 * ------------------------------------------------------------------
 */

import { type NodeProps } from "@xyflow/react";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { z } from "zod";

import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
import { generateoutputField } from "@/features/business-logic-modern/infrastructure/node-core/utils/handleOutputUtils";
import {
  SafeSchemas,
  createSafeInitialData,
} from "@/features/business-logic-modern/infrastructure/node-core/utils/schema-helpers";
import {
  createNodeValidator,
  reportValidationError,
  useNodeDataValidation,
} from "@/features/business-logic-modern/infrastructure/node-core/utils/validation";
import { withNodeScaffold } from "@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold";
import { CATEGORIES } from "@/features/business-logic-modern/infrastructure/theming/categories";
import {
  COLLAPSED_SIZES,
  EXPANDED_SIZES,
} from "@/features/business-logic-modern/infrastructure/theming/sizing";
import { useNodeData } from "@/hooks/useNodeData";

import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
import { EmailAccountCollapsed } from "./components/EmailAccountCollapsed";
import { EmailAccountExpanded } from "./components/EmailAccountExpanded";
import { EmailAccountProvider } from "./components/EmailAccountProvider";

/* ------------------------------------------------------------------ */
/* 1️⃣  Schema & types                                                */
/* ------------------------------------------------------------------ */

export const EmailAccountDataSchema = z
  .object({
    provider: z.enum(["gmail", "outlook", "imap", "smtp"]).default("gmail"),
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
  "EmailAccount"
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
  data: Pick<EmailAccountData, "expandedSize" | "collapsedSize">
): NodeSpec => {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.VE2;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C2;

  /**
   * HANDLE_TOOLTIPS – ultra‑concise labels for handles
   * [Explanation], basically 1–3 word hints shown before dynamic value/type
   */
  const HANDLE_TOOLTIPS = {
    TRIGGER_IN: "Trigger",
    ACCOUNT_OUT: "Email Account",
    STATUS_OUT: "Status",
  } as const;

  return {
    kind: "emailAccount",
    displayName: "Email Account",
    label: "Email Account",
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
      // Expose a strongly-typed account payload for downstream consumers, basically provide the connected account object
      {
        id: "account-output",
        code: "account",
        position: "right",
        type: "source",
        dataType: "JSON",
        iconKey: "account",
        tooltip: HANDLE_TOOLTIPS.ACCOUNT_OUT,
        // Declare emitted account JSON shape for downstream validation
        jsonShape: {
          type: "object",
          properties: {
            accountId: { type: "string" },
            provider: { type: "string", optional: true },
            email: { type: "string", optional: true },
            displayName: { type: "string", optional: true },
            isConnected: { type: "boolean", optional: true },
            lastValidated: { type: "number", optional: true },
          },
        },
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
        // Hide email and displayName to avoid manual typing; these come from OAuth for oauth2 providers
        "email",
        "displayName",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        { key: "provider", type: "select", label: "Email Provider" },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuMail",
    author: "Agenitix Team",
    description:
      "Configure and authenticate email accounts for workflow integration",
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

const EmailAccountNode = memo(
  ({ id, spec }: NodeProps & { spec: NodeSpec }) => {
    /* ----- state & helpers ------------------------------------------- */
    // Ensure validated defaults are present to avoid undefined provider, basically seed with safe initial data
    const { nodeData, updateNodeData } = useNodeData(
      id,
      createSafeInitialData(EmailAccountDataSchema, {
        provider: "gmail",
        ...INITIAL_DATA,
      })
    ) as {
      nodeData: EmailAccountData;
      updateNodeData: (d: Partial<EmailAccountData>) => void;
    };

    const categoryStyles = { primary: "text-[--node-email-text]" };
    const { isExpanded, isEnabled, isConnected } = nodeData;
    // Enforce provider default at runtime for older saved nodes, basically auto-set to gmail if missing
    useEffect(() => {
      if (!nodeData.provider) {
        updateNodeData({ provider: "gmail" });
      }
    }, [nodeData.provider, updateNodeData]);

    /* ----- output effect --------------------------------------------- */
    const lastOutputRef = useRef<Map<string, unknown> | null>(null);
    const lastPerHandleSnapshotRef = useRef<{
      account?: unknown;
      status?: boolean;
    } | null>(null);

    useEffect(() => {
      // Guard: outputs only when node is enabled
      if (!isEnabled) return;

      // Build per-handle values derived from current state
      const statusOutput: boolean = Boolean(isConnected);
      const accountOutput: Record<string, unknown> | undefined = isConnected
        ? {
            accountId: nodeData.accountId,
            provider: nodeData.provider,
            email: nodeData.email,
            displayName: nodeData.displayName,
            isConnected: nodeData.isConnected,
            lastValidated: nodeData.lastValidated,
          }
        : undefined;

      // Snapshot for change detection on per-handle payloads
      const prevSnapshot = lastPerHandleSnapshotRef.current;
      const perHandleChanged =
        !prevSnapshot ||
        prevSnapshot.status !== statusOutput ||
        JSON.stringify(prevSnapshot.account ?? null) !==
          JSON.stringify(accountOutput ?? null);

      // Generate Map-based output using a synthetic data view that includes per-handle fields
      const syntheticData = {
        ...(nodeData as Record<string, unknown>),
        "status-output": statusOutput,
        "account-output": accountOutput,
      };

      const outputMap = generateoutputField(spec, syntheticData) as Map<
        string,
        unknown
      >;

      // Compare against last emitted Map to avoid redundant writes
      const mapChanged =
        !lastOutputRef.current ||
        outputMap.size !== lastOutputRef.current.size ||
        [...outputMap.entries()].some(
          ([key, value]) => lastOutputRef.current?.get(key) !== value
        );

      if (isConnected) {
        if (perHandleChanged || mapChanged) {
          lastPerHandleSnapshotRef.current = {
            account: accountOutput,
            status: statusOutput,
          };
          lastOutputRef.current = outputMap;
          updateNodeData({
            // Persist per-handle fields so downstream nodes can read them directly if needed
            "status-output": statusOutput,
            "account-output": accountOutput,
            // Serialized Map for inspector/view nodes
            output: Object.fromEntries(outputMap),
            isActive: true,
          });
        }
      } else {
        // When disconnected, clear outputs once if needed
        if (
          perHandleChanged ||
          (lastOutputRef.current && lastOutputRef.current.size > 0)
        ) {
          lastPerHandleSnapshotRef.current = {
            account: undefined,
            status: false,
          };
          lastOutputRef.current = new Map();
          updateNodeData({
            "status-output": false,
            "account-output": undefined,
            output: {},
            isActive: false,
          });
        }
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
      id
    );

    /* ----- UI handlers ------------------------------------------------ */
    const toggleExpand = useCallback(
      () => updateNodeData({ isExpanded: !isExpanded }),
      [isExpanded, updateNodeData]
    );

    /* ----- render ----------------------------------------------------- */
    return (
      <EmailAccountProvider
        nodeId={id}
        nodeData={nodeData}
        updateNodeData={updateNodeData}
      >
        <>
          {/* Handles are rendered by scaffold from spec */}

          <LabelNode nodeId={id} label={nodeData.label ?? spec.displayName} />

          {isExpanded ? (
            <>
              <EmailAccountExpanded
                nodeData={nodeData}
                updateNodeData={updateNodeData}
                isEnabled={isEnabled}
                isAuthenticating={nodeData.isAuthenticating}
              />
            </>
          ) : (
            <EmailAccountCollapsed
              nodeData={nodeData}
              categoryStyles={categoryStyles}
              onToggleExpand={toggleExpand}
            />
          )}

          <ExpandCollapseButton
            showUI={isExpanded}
            onToggle={toggleExpand}
            size="sm"
          />
        </>
      </EmailAccountProvider>
    );
  }
);

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
    ]
  );

  const Scaffolded = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <EmailAccountNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <Scaffolded {...props} />;
};

export default EmailAccountNodeWithDynamicSpec;
