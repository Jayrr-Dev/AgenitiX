/**
 * Route: features/business-logic-modern/node-domain/email/emailAccount.node.tsx
 * EMAIL ACCOUNT NODE - Email account configuration and authentication
 *
 * • OAuth2 authentication for Gmail and Outlook
 * • Manual configuration for IMAP/SMTP servers
 * • Connection status monitoring and testing
 * • Dark mode optimized with proper contrast
 * • Form inputs, buttons, and status indicators use CSS variables
 *
 * Keywords: email-authentication, oauth2, imap-smtp, dark-mode, form-inputs
 */

import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { z } from "zod";

import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
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
import { useStore } from "@xyflow/react";

// Component imports
import { EmailAccountCollapsed } from "./components/EmailAccountCollapsed";
import { EmailAccountExpanded } from "./components/EmailAccountExpanded";
import { EmailAccountProvider } from "./components/EmailAccountProvider";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const EmailAccountDataSchema = z
  .object({
    // Provider configuration
    provider: z
      .enum(["gmail", "outlook", "yahoo", "imap", "smtp"])
      .default("gmail"),
    email: z.string().default(""),
    displayName: z.string().default(""),

    // Connection state
    isConfigured: z.boolean().default(false),
    isConnected: z.boolean().default(false),
    connectionStatus: z
      .enum(["disconnected", "connecting", "connected", "error"])
      .default("disconnected"),
    lastValidated: z.number().optional(),
    accountId: z.string().optional(), // Convex document ID

    // Manual configuration fields (IMAP/SMTP)
    imapHost: z.string().default(""),
    imapPort: z.number().default(993),
    smtpHost: z.string().default(""),
    smtpPort: z.number().default(587),
    username: z.string().default(""),
    password: z.string().default(""),
    useSSL: z.boolean().default(true),
    useTLS: z.boolean().default(true),

    // OAuth2 state (not stored, just for UI)
    isAuthenticating: z.boolean().default(false),

    // Error handling
    lastError: z.string().default(""),

    // UI state
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    expandedSize: SafeSchemas.text("VE2"),
    collapsedSize: SafeSchemas.text("C2"),

    // output - unified handle-based output system
    output: z.record(z.string(), z.unknown()).optional(), // handle-based output object for Convex compatibility
    label: z.string().optional(), // User-editable node label
  })
  .passthrough();

// Type alias for the schema-based data structure
export type EmailAccountData = z.infer<typeof EmailAccountDataSchema>;

const validateNodeData = createNodeValidator(
  EmailAccountDataSchema,
  "EmailAccount"
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

function createDynamicSpec(data: EmailAccountData): NodeSpec {
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
      {
        id: "trigger-input",
        code: "t",
        position: "top",
        type: "target",
        dataType: "Boolean",
      },
      {
        id: "account-output",
        code: "a",
        position: "right",
        type: "source",
        dataType: "JSON",
      },
      {
        id: "status-output",
        code: "s",
        position: "bottom",
        type: "source",
        dataType: "Boolean",
      },
    ],
    inspector: { key: "EmailAccountInspector" },
    version: 1,
    runtime: { execute: "emailAccount_execute_v1" },
    initialData: createSafeInitialData(EmailAccountDataSchema, {
      provider: "gmail",
      email: "",
      displayName: "",
      isConfigured: false,
      isConnected: false,
      connectionStatus: "disconnected",
      isEnabled: true,
      isActive: false,
      isExpanded: false,
      expandedSize: "VE2",
      collapsedSize: "C2",
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
      output: {}, // handle-based output object for Convex compatibility
      label: undefined, // User-editable node label
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
        {
          key: "provider",
          type: "select",
          label: "Email Provider",
        },
        {
          key: "email",
          type: "text",
          label: "Email Address",
          placeholder: "your.email@example.com",
        },
        {
          key: "displayName",
          type: "text",
          label: "Display Name",
          placeholder: "Your Name",
        },
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
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE2",
  collapsedSize: "C2",
} as EmailAccountData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const EmailAccountNode = memo(
  ({ id, spec }: NodeProps & { spec: NodeSpec }) => {
    // -------------------------------------------------------------------------
    // 4.1  Sync with React‑Flow store and auth
    // -------------------------------------------------------------------------
    const { nodeData, updateNodeData } = useNodeData(id, {}) as {
      nodeData: EmailAccountData;
      updateNodeData: (data: Partial<EmailAccountData>) => void;
    };

    // -------------------------------------------------------------------------
    // 4.2  Derived state
    // -------------------------------------------------------------------------
    const { isExpanded, isEnabled, isConnected, isAuthenticating } =
      nodeData as EmailAccountData;

    const categoryStyles = CATEGORY_TEXT.EMAIL;

    // Global React‑Flow store (nodes & edges) – triggers re‑render on change
    const _nodes = useStore((s) => s.nodes);
    const _edges = useStore((s) => s.edges);

    // Keep last emitted output to avoid redundant writes
    const lastGeneralOutputRef = useRef<Map<string, any> | null>(null);

    // -------------------------------------------------------------------------
    // 4.3  Callbacks
    // -------------------------------------------------------------------------

    /** Toggle between collapsed / expanded */
    const toggleExpand = useCallback(() => {
      updateNodeData({ isExpanded: !isExpanded });
    }, [isExpanded, updateNodeData]);

    // -------------------------------------------------------------------------
    // 4.4  Effects
    // -------------------------------------------------------------------------

    /** Update output when connection state changes */
    useEffect(() => {
      if (isEnabled && isConnected) {
        // Generate Map-based output with error handling
        const outputValue = generateoutputField(spec, nodeData as any);

        // Validate the result
        if (!(outputValue instanceof Map)) {
          console.error(
            `EmailAccount ${id}: generateoutputField did not return a Map`,
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
          updateNodeData({
            output: outputObject,
            isActive: isEnabled && isConnected,
          });
        }
      } else {
        updateNodeData({
          isActive: false,
        });
      }
    }, [isEnabled, isConnected, updateNodeData]);

    // -------------------------------------------------------------------------
    // 4.5  Validation
    // -------------------------------------------------------------------------
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

    // -------------------------------------------------------------------------
    // 4.6  Render
    // -------------------------------------------------------------------------
    return (
      <EmailAccountProvider nodeData={nodeData} updateNodeData={updateNodeData}>
        <>
          {/* Output handle for connecting to other email nodes */}
          <Handle
            type="source"
            position={Position.Right}
            id="account-output"
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
            label={(nodeData as EmailAccountData).label || spec.displayName}
          />

          {/* Conditional rendering based on expanded state */}
          {isExpanded ? (
            <EmailAccountExpanded
              nodeData={nodeData}
              updateNodeData={updateNodeData}
              isEnabled={isEnabled}
              isAuthenticating={isAuthenticating}
            />
          ) : (
            <EmailAccountCollapsed
              nodeData={nodeData}
              categoryStyles={categoryStyles}
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

// -----------------------------------------------------------------------------
// 5️⃣  High‑order wrapper – inject scaffold with dynamic spec
// -----------------------------------------------------------------------------

const EmailAccountNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec only when the size keys change
  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as EmailAccountData),
    [
      (nodeData as EmailAccountData).expandedSize,
      (nodeData as EmailAccountData).collapsedSize,
    ]
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <EmailAccountNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
};

export default EmailAccountNodeWithDynamicSpec;
