/**
 * EmailDraft NODE – Content‑focused, schema‑driven, type‑safe
 *
 * • Shows only internal layout; the scaffold provides borders, sizing, theming, and interactivity.
 * • Zod schema auto‑generates type‑checked Inspector controls.
 * • Dynamic sizing (expandedSize / collapsedSize) drives the spec.
 * • Output propagation is gated by `isActive` *and* `isEnabled` to prevent runaway loops.
 * • Uses findEdgeByHandle utility for robust React Flow edge handling.
 * • Auto-enables when inputs connect; never auto-disables automatically.
 * • Code is fully commented and follows current React + TypeScript best practices.
 *
 * Keywords: email-draft, schema-driven, type‑safe, clean‑architecture
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
import { renderLucideIcon } from "@/features/business-logic-modern/infrastructure/node-core/utils/iconUtils";
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
import { useNodeFeatureFlag } from "@/features/business-logic-modern/infrastructure/node-core/features/useNodeFeatureFlag";
import { CATEGORIES } from "@/features/business-logic-modern/infrastructure/theming/categories";
import {
  COLLAPSED_SIZES,
  EXPANDED_SIZES,
} from "@/features/business-logic-modern/infrastructure/theming/sizing";
import { useNodeData } from "@/hooks/useNodeData";
import { useReactFlow, useStore } from "@xyflow/react";
import { findEdgeByHandle } from "@/features/business-logic-modern/infrastructure/flow-engine/utils/edgeUtils";
import { EmailDraftCollapsed } from "./components/EmailDraftCollapsed";
import { EmailDraftExpanded } from "./components/EmailDraftExpanded";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const EmailDraftDataSchema = z
  .object({
    // Email composition fields
    recipients: z.object({
      to: z.array(z.string()).default([]),
      cc: z.array(z.string()).default([]),
      bcc: z.array(z.string()).default([]),
    }).default({ to: [], cc: [], bcc: [] }),
    
    subject: z.string().default(""),
    body: z.object({
      text: z.string().default(""),
      html: z.string().default(""),
      mode: z.enum(["text", "html", "rich"]).default("text"),
    }).default({ text: "", html: "", mode: "text" }),
    
    // Attachments
    attachments: z.array(z.object({
      id: z.string(),
      name: z.string(),
      size: z.number(),
      type: z.string(),
      content: z.string().optional(), // base64 for small files
      url: z.string().optional(), // for large files
    })).default([]),
    
    // Template support
    template: z.object({
      id: z.string().optional(),
      name: z.string().optional(),
      variables: z.record(z.string(), z.string()).default({}),
    }).optional(),
    
    // Draft metadata & management
    draftId: z.string().optional(), // Gmail draft ID
    draftMode: z.enum(["new", "existing", "browse"]).default("new"), // Current mode
    lastSaved: z.number().optional(), // timestamp
    autoSave: z.boolean().default(true),
    
    // Draft browsing & selection
    availableDrafts: z.array(z.object({
      id: z.string(),
      subject: z.string(),
      snippet: z.string(),
      lastModified: z.number(),
      hasAttachments: z.boolean().default(false),
    })).default([]),
    selectedDraftId: z.string().optional(),
    isLoadingDrafts: z.boolean().default(false),
    
    // Account connection
    accountId: z.string().default(""), // Connected email account
    fromAddress: z.string().default(""),
    
    // UI state
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    expandedSize: SafeSchemas.text("FE3"),
    collapsedSize: SafeSchemas.text("C2"),
    
    // Output data
    inputs: SafeSchemas.optionalText().nullable().default(null),
    output: z.record(z.string(), z.unknown()).optional(),
    
    // Legacy field for backwards compatibility
    store: SafeSchemas.text(""),
    
    label: z.string().optional(), // User-editable node label
  })
  .passthrough();

export type EmailDraftData = z.infer<typeof EmailDraftDataSchema>;

const validateNodeData = createNodeValidator(
  EmailDraftDataSchema,
  "EmailDraft",
);

// -----------------------------------------------------------------------------
// 2️⃣  Constants
// -----------------------------------------------------------------------------

const CATEGORY_TEXT = {
  EMAIL: {
    primary: "text-[--node--e-m-a-i-l-text]",
  },
} as const;

const CONTENT = {
  expanded: "p-4 w-full h-full flex flex-col",
  collapsed: "flex items-center justify-center w-full h-full",
  header: "flex items-center justify-between mb-3",
  body: "flex-1 flex items-center justify-center",
  disabled: "opacity-75 bg-zinc-100 dark:bg-zinc-500 rounded-md transition-all duration-300",
} as const;

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

/**
 * Builds a NodeSpec whose size keys can change at runtime via node data.
 */
function createDynamicSpec(data: EmailDraftData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.FE3;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C2;

  return {
    kind: "emailDraft",
    displayName: "EmailDraft",
    label: "EmailDraft",
    category: CATEGORIES.EMAIL,
    size: { expanded, collapsed },
    handles: [
      {
        id: "account-input",
        code: "account",
        position: "left",
        type: "target",
        dataType: "emailAccount",
        tooltip: "Email Account",
      },
      {
        id: "template-input",
        code: "template",
        position: "top",
        type: "target",
        dataType: "JSON",
        tooltip: "Email Template",
      },
      {
        id: "draft-output",
        code: "draft",
        position: "right",
        type: "source",
        dataType: "emailDraft",
        tooltip: "Email Draft",
      },
      {
        id: "status-output",
        code: "status",
        position: "bottom",
        type: "source",
        dataType: "boolean",
        tooltip: "Draft Status",
      },
    ],
    inspector: { key: "EmailDraftInspector" },
    version: 1,
    runtime: { execute: "emailDraft_execute_v1" },
    initialData: createSafeInitialData(EmailDraftDataSchema, {
      recipients: { to: [], cc: [], bcc: [] },
      subject: "",
      body: { text: "", html: "", mode: "text" },
      attachments: [],
      draftMode: "new",
      availableDrafts: [],
      isLoadingDrafts: false,
      accountId: "",
      fromAddress: "",
      autoSave: true,
      store: "",
      inputs: null,
      output: {},
    }),
    dataSchema: EmailDraftDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "inputs",
        "output",
        "expandedSize",
        "collapsedSize",
        "draftId",
        "lastSaved",
        "availableDrafts",
        "selectedDraftId",
        "isLoadingDrafts",
        "store", // deprecated field
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        { key: "autoSave", type: "boolean", label: "Auto Save" },
        { key: "isExpanded", type: "boolean", label: "Expand" },
        { 
          key: "draftMode", 
          type: "select", 
          label: "Mode"
        },
        {
          key: "subject",
          type: "text",
          label: "Subject",
          placeholder: "Email subject...",
        },
        {
          key: "body.text",
          type: "textarea",
          label: "Body",
          placeholder: "Compose your email...",
          ui: { rows: 6 },
        },
      ],
    },
    icon: "LuMail",
    author: "Agenitix Team",
    description: "EmailDraft node for creating and managig email drafts",
    feature: "email",
    tags: ["email"],
    featureFlag: {
      flag: "test",
      fallback: true,
      disabledMessage: "This emailDraft node is currently disabled",
      hideWhenDisabled: false,
    },
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "FE3",
  collapsedSize: "C2",
} as EmailDraftData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const EmailDraftNode = memo(
  ({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
    // -------------------------------------------------------------------------
    // 4.1  Sync with React‑Flow store
    // -------------------------------------------------------------------------
    const { nodeData, updateNodeData } = useNodeData(id, data);

    // -------------------------------------------------------------------------
    // 4.2  Derived state
    // -------------------------------------------------------------------------
    const draftData = nodeData as EmailDraftData;
    const { 
      isExpanded, 
      isEnabled, 
      isActive, 
      recipients, 
      subject, 
      body, 
      accountId,
      fromAddress,
      autoSave 
    } = draftData;

    // 4.2  Global React‑Flow store (nodes & edges) – triggers re‑render on change
    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);

    // keep last emitted output to avoid redundant writes
    const lastOutputRef = useRef<Record<string, unknown> | null>(null);

    const categoryStyles = CATEGORY_TEXT.EMAIL;

    // -------------------------------------------------------------------------
    // 4.3  Connected email account detection
    // -------------------------------------------------------------------------
    const connectedAccount = useMemo(() => {
      const accountEdge = findEdgeByHandle(edges, id, "account-input");
      if (!accountEdge) return null;
      
      const accountNode = nodes.find(n => n.id === accountEdge.source);
      if (!accountNode || accountNode.type !== "emailAccount") return null;
      
      const accountData = accountNode.data as any;
      
      // Get the REAL Convex document ID, not the React Flow node ID
      const realAccountId = accountData?.accountId || accountData?._id;
      
      if (!realAccountId) {
        console.warn("EmailDraft: Connected email account missing accountId/._id", { accountData });
        return null;
      }
      
      return {
        email: (accountData?.email as string) || "",
        displayName: (accountData?.displayName as string) || "",
        isConnected: (accountData?.isConnected as boolean) || false,
        accountId: realAccountId, // Use the REAL Convex document ID
      };
    }, [edges, nodes, id]);

    // Update accountId and fromAddress when connection changes
    useEffect(() => {
      console.log("EmailDraft account connection:", {
        connectedAccount,
        currentAccountId: accountId,
        hasConnection: !!connectedAccount,
        isConnected: connectedAccount?.isConnected,
      });
      
      if (connectedAccount && connectedAccount.accountId !== accountId) {
        console.log("Updating accountId from connection:", {
          from: accountId,
          to: connectedAccount.accountId,
        });
        updateNodeData({
          accountId: connectedAccount.accountId,
          fromAddress: connectedAccount.email,
        });
      } else if (!connectedAccount && accountId) {
        console.log("Clearing accountId - no connection");
        updateNodeData({
          accountId: "",
          fromAddress: "",
        });
      }
    }, [connectedAccount, accountId, updateNodeData]);

    // -------------------------------------------------------------------------
    // 4.4  Callbacks
    // -------------------------------------------------------------------------

    /** Toggle between collapsed / expanded */
    const toggleExpand = useCallback(() => {
      updateNodeData({ isExpanded: !isExpanded });
    }, [isExpanded, updateNodeData]);

    /** Propagate draft data ONLY when node is active AND enabled */
    const propagate = useCallback(() => {
      const shouldSend = isActive && isEnabled;
      const draftOutput = shouldSend ? {
        draft: {
          recipients,
          subject,
          body,
          fromAddress,
          accountId,
          attachments: draftData.attachments || [],
          draftId: draftData.draftId,
          lastSaved: draftData.lastSaved,
        },
        status: {
          isValid: ((recipients as any)?.to || []).length > 0 && (subject as string || "").trim().length > 0,
          hasChanges: !draftData.lastSaved || Date.now() - (draftData.lastSaved as number) > 5000,
          isConnected: !!connectedAccount?.isConnected,
        }
      } : {};
      
      // Only update if output actually changed
      const outputString = JSON.stringify(draftOutput);
      const lastOutputString = JSON.stringify(lastOutputRef.current || {});
      
      if (outputString !== lastOutputString) {
        lastOutputRef.current = draftOutput;
        updateNodeData({ output: draftOutput });
      }
    }, [isActive, isEnabled, recipients, subject, body, fromAddress, accountId, draftData, connectedAccount, updateNodeData]);

    /**
     * Compute template data from connected template-input handle
     */
    const computeTemplateInput = useCallback(() => {
      const templateEdge = findEdgeByHandle(edges, id, "template-input");
      if (!templateEdge) return null;

      const templateNode = nodes.find(n => n.id === templateEdge.source);
      if (!templateNode) return null;

      // Try to extract template data from the source node
      const templateData = templateNode.data?.output ?? templateNode.data?.template ?? templateNode.data;
      
      if (templateData && typeof templateData === 'object') {
        const template = templateData as any; // Type assertion for template data
        return {
          id: template.id || templateNode.id,
          name: template.name || template.displayName || "Template",
          subject: template.subject || "",
          body: template.body || template.content || "",
          variables: template.variables || {},
        };
      }
      
      return null;
    }, [edges, nodes, id]);

    // -------------------------------------------------------------------------
    // 4.5  Effects
    // -------------------------------------------------------------------------

    /* 🔄 Apply template data when template input changes */
    useEffect(() => {
      const templateData = computeTemplateInput();
      if (templateData && (!draftData.template || (draftData.template as any)?.id !== templateData.id)) {
        updateNodeData({
          template: templateData,
          subject: templateData.subject || subject,
          body: {
            ...(body as any),
            text: templateData.body || (body as any).text,
          }
        });
      }
    }, [computeTemplateInput, draftData.template, subject, body, updateNodeData]);

    /* 🔄 Auto-enable when connected to an email account */
    useEffect(() => {
      if (connectedAccount?.isConnected && !isEnabled) {
        updateNodeData({ isEnabled: true });
      }
    }, [connectedAccount, isEnabled, updateNodeData]);

    /* 🔄 Monitor draft validity and update active state */
    useEffect(() => {
      const hasValidRecipients = ((recipients as any)?.to || []).length > 0;
      const hasSubject = (subject as string || "").trim().length > 0;
      const hasBody = ((body as any)?.text || "").trim().length > 0;
      const hasValidDraft = hasValidRecipients && (hasSubject || hasBody);

      // If disabled, always set isActive to false
      if (!isEnabled) {
        if (isActive) updateNodeData({ isActive: false });
      } else {
        if (isActive !== hasValidDraft) {
          updateNodeData({ isActive: hasValidDraft });
        }
      }
    }, [recipients, subject, body, isEnabled, isActive, updateNodeData]);

    /* 🔄 Propagate output when draft data changes */
    useEffect(() => {
      propagate();
    }, [propagate]);

    // -------------------------------------------------------------------------
    // 4.6  Feature flag evaluation
    // -------------------------------------------------------------------------
    const flagState = useNodeFeatureFlag(spec.featureFlag);

    // -------------------------------------------------------------------------
    // 4.6  Validation
    // -------------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("EmailDraft", id, validation.errors, {
        originalData: validation.originalData,
        component: "EmailDraftNode",
      });
    }

    useNodeDataValidation(
      EmailDraftDataSchema,
      "EmailDraft",
      validation.data,
      id,
    );

    // -------------------------------------------------------------------------
    // 4.7  Feature flag conditional rendering
    // -------------------------------------------------------------------------

    // If flag is loading, show loading state
    if (flagState.isLoading) {
      return (
        <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
          Loading emailDraft feature...
        </div>
      );
    }

    // If flag is disabled and should hide, return null
    if (!flagState.isEnabled && flagState.hideWhenDisabled) {
      return null;
    }

    // If flag is disabled, show disabled message
    if (!flagState.isEnabled) {
      return (
        <div className="flex items-center justify-center p-4 text-sm text-muted-foreground border border-dashed border-muted-foreground/20 rounded-lg">
          {flagState.disabledMessage}
        </div>
      );
    }

    // -------------------------------------------------------------------------
    // 4.8  Render
    // -------------------------------------------------------------------------
    return (
      <>
        {/* Editable label or icon */}
        {!isExpanded &&
        spec.size.collapsed.width === 60 &&
        spec.size.collapsed.height === 60 ? (
          <div className="absolute inset-0 flex justify-center text-lg p-0 text-foreground/80">
            {spec.icon && renderLucideIcon(spec.icon, "", 16)}
          </div>
        ) : (
          <LabelNode nodeId={id} label={(draftData.label as string) || spec.displayName} />
        )}

        {!isExpanded ? (
          <EmailDraftCollapsed
            nodeData={draftData}
            isEnabled={isEnabled as boolean}
            categoryStyles={categoryStyles}
          />
              ) : (
        <EmailDraftExpanded
          nodeId={id}
          nodeData={draftData}
          updateNodeData={updateNodeData}
          isEnabled={isEnabled as boolean}
          categoryStyles={categoryStyles}
          connectedAccount={connectedAccount || undefined}
        />
      )}

        <ExpandCollapseButton
          showUI={isExpanded as boolean}
          onToggle={toggleExpand}
          size="sm"
        />
      </>
    );
  },
);

// -----------------------------------------------------------------------------
// 5️⃣  High‑order wrapper – inject scaffold with dynamic spec
// -----------------------------------------------------------------------------

/**
 * ⚠️ THIS is the piece that fixes the focus‑loss issue.
 *
 * `withNodeScaffold` returns a *component function*.  Re‑creating that function
 * on every keystroke causes React to unmount / remount the subtree (and your
 * textarea loses focus).  We memoise the scaffolded component so its identity
 * stays stable across renders unless the *spec itself* really changes.
 */
const EmailDraftNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec only when the size keys change
  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as EmailDraftData),
    [
      (nodeData as EmailDraftData).expandedSize,
      (nodeData as EmailDraftData).collapsedSize,
    ],
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <EmailDraftNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec],
  );

  return <ScaffoldedNode {...props} />;
};

export default EmailDraftNodeWithDynamicSpec;
