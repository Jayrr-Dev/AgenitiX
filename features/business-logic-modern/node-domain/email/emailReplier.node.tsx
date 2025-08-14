/**
 * emailReplier NODE – Automated reply generation
 *
 * • Intelligent email reply generation with context awareness
 * • Template-based responses with dynamic content insertion
 * • Integration with AI models for smart reply suggestions
 * • Support for multiple reply strategies (auto, template, AI-generated)
 * • Seamless integration with emailReader and emailSender nodes
 *
 * Keywords: email-reply, automation, templates, AI-generation, smart-responses
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
import { findEdgesByHandle } from "@/features/business-logic-modern/infrastructure/flow-engine/utils/edgeUtils";
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
import { normalizeHandleId } from "@/features/business-logic-modern/infrastructure/node-core/utils/handleOutputUtils";
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
import { useReactFlow, useStore } from "@xyflow/react";
import { getEmailReaderMessagesForNode } from "./stores/use-email-reader-outputs";

import { useAuth } from "@/components/auth/AuthProvider";
import { api } from "@/convex/_generated/api";
import { useFlowMetadataOptional } from "@/features/business-logic-modern/infrastructure/flow-engine/contexts/flow-metadata-context";
// Convex integration
import { useQuery } from "convex/react";
import { toast } from "sonner";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const EmailReplierDataSchema = z
  .object({
    // Reply Strategy Configuration
    replyStrategy: z
      .enum(["auto", "template", "ai-generated", "hybrid"])
      .default("template"),

    // Template Configuration
    selectedTemplate: z.string().default(""),
    customTemplate: z.string().default(""),
    useCustomTemplate: z.boolean().default(false),

    // AI Configuration
    aiModel: z
      .enum(["gpt-3.5-turbo", "gpt-4", "claude-3", "local"])
      .default("gpt-3.5-turbo"),
    aiPrompt: z
      .string()
      .default(
        "Generate a professional and helpful email reply based on the context provided."
      ),
    includeContext: z.boolean().default(true),
    maxTokens: z.number().min(50).max(2000).default(500),
    temperature: z.number().min(0).max(2).default(0.7),

    // Reply Settings
    replyToAll: z.boolean().default(false),
    includeOriginal: z.boolean().default(true),
    addSignature: z.boolean().default(true),
    signature: z.string().default(""),

    // Auto-Reply Rules
    enableAutoReply: z.boolean().default(false),
    autoReplyConditions: z
      .array(
        z.object({
          field: z.enum(["sender", "subject", "content", "time"]),
          operator: z.enum([
            "contains",
            "equals",
            "startsWith",
            "endsWith",
            "regex",
          ]),
          value: z.string(),
          caseSensitive: z.boolean().default(false),
        })
      )
      .default([]),

    // Content Processing
    extractKeywords: z.boolean().default(true),
    analyzeSentiment: z.boolean().default(false),
    detectLanguage: z.boolean().default(true),
    preserveFormatting: z.boolean().default(true),

    // Output Configuration
    outputFormat: z.enum(["html", "text", "markdown"]).default("html"),
    includeMetadata: z.boolean().default(false),

    // Processing State
    isProcessing: z.boolean().default(false),
    lastProcessed: z.number().optional(),
    processedCount: z.number().default(0),

    // Error Handling
    lastError: z.string().default(""),
    retryCount: z.number().default(0),
    maxRetries: z.number().min(0).max(5).default(3),

    // UI State
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    expandedSize: SafeSchemas.text("VE2"),
    collapsedSize: SafeSchemas.text("C2"),

    // Input Data
    inputEmails: z.array(z.any()).default([]), // Array of emails from emailReader
    inputEmail: z.string().default(""),

    // Output Data
    generatedReply: z.string().default(""),
    replyMetadata: z
      .object({
        strategy: z.string(),
        confidence: z.number(),
        processingTime: z.number(),
        tokensUsed: z.number().optional(),
      })
      .optional(),
    label: z.string().optional(), // User-editable node label
  })
  .passthrough();

export type EmailReplierData = z.infer<typeof EmailReplierDataSchema>;

const validateNodeData = createNodeValidator(
  EmailReplierDataSchema,
  "EmailReplier"
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

function createDynamicSpec(data: EmailReplierData): NodeSpec {
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
    MESSAGES_IN: "Messages",
    TEMPLATE_IN: "Template",
    MESSAGE_OUT: "Message",
    STATUS_OUT: "Status",
    OUTPUTS_OUT: "Outputs",
  } as const;

  return {
    kind: "emailReplier",
    displayName: "Email Replier",
    label: "Email Replier",
    category: CATEGORIES.EMAIL,
    size: { expanded, collapsed },
    handles: [
      {
        id: "messages-input",
        code: "m",
        position: "top",
        type: "target",
        dataType: "array",
        tooltip: HANDLE_TOOLTIPS.MESSAGES_IN,
      },
      {
        id: "template-input",
        code: "t",
        position: "left",
        type: "target",
        dataType: "string",
        tooltip: HANDLE_TOOLTIPS.TEMPLATE_IN,
      },
      {
        id: "message-output",
        code: "m",
        position: "right",
        type: "source",
        dataType: "JSON",
        tooltip: HANDLE_TOOLTIPS.MESSAGE_OUT,
      },
      {
        id: "status-output",
        code: "string",
        position: "bottom",
        type: "source",
        dataType: "boolean",
        tooltip: HANDLE_TOOLTIPS.STATUS_OUT,
      },
      {
        id: "outputs",
        code: "o",
        position: "right",
        type: "source",
        dataType: "string",
        tooltip: HANDLE_TOOLTIPS.OUTPUTS_OUT,
      },
    ],
    inspector: { key: "EmailReplierInspector" },
    version: 1,
    runtime: { execute: "emailReplier_execute_v1" },
    initialData: createSafeInitialData(EmailReplierDataSchema, {
      replyStrategy: "template",
      selectedTemplate: "",
      customTemplate: "Thank you for your email. I will get back to you soon.",
      useCustomTemplate: false,
      aiModel: "gpt-3.5-turbo",
      aiPrompt:
        "Generate a professional and helpful email reply based on the context provided.",
      includeContext: true,
      maxTokens: 500,
      temperature: 0.7,
      replyToAll: false,
      includeOriginal: true,
      addSignature: true,
      signature: "",
      enableAutoReply: false,
      autoReplyConditions: [],
      extractKeywords: true,
      analyzeSentiment: false,
      detectLanguage: true,
      preserveFormatting: true,
      outputFormat: "html",
      includeMetadata: false,
      isProcessing: false,
      processedCount: 0,
      lastError: "",
      retryCount: 0,
      maxRetries: 3,
      inputEmails: [],
      inputEmail: "",
      generatedReply: "",
    }),
    dataSchema: EmailReplierDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "inputEmails",
        "inputEmail",
        "generatedReply",
        "replyMetadata",
        "isProcessing",
        "lastProcessed",
        "processedCount",
        "lastError",
        "retryCount",
        "expandedSize",
        "collapsedSize",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        {
          key: "replyStrategy",
          type: "select",
          label: "Reply Strategy",
          validation: {
            options: [
              { value: "auto", label: "Auto Reply" },
              { value: "template", label: "Template Based" },
              { value: "ai-generated", label: "AI Generated" },
              { value: "hybrid", label: "Hybrid (Template + AI)" },
            ],
          },
        },
        {
          key: "customTemplate",
          type: "textarea",
          label: "Custom Template",
          placeholder: "Enter your reply template...",
        },
        {
          key: "useCustomTemplate",
          type: "boolean",
          label: "Use Custom Template",
        },
        {
          key: "aiModel",
          type: "select",
          label: "AI Model",
          validation: {
            options: [
              { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
              { value: "gpt-4", label: "GPT-4" },
              { value: "claude-3", label: "Claude 3" },
              { value: "local", label: "Local Model" },
            ],
          },
        },
        { key: "replyToAll", type: "boolean", label: "Reply to All" },
        { key: "includeOriginal", type: "boolean", label: "Include Original" },
        { key: "addSignature", type: "boolean", label: "Add Signature" },
        { key: "enableAutoReply", type: "boolean", label: "Enable Auto Reply" },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuMail",
    author: "Agenitix Team",
    description:
      "Automated email reply generation with AI and template support",
    feature: "email",
    tags: [
      "email",
      "reply",
      "automation",
      "ai",
      "templates",
      "smart-responses",
    ],
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE2",
  collapsedSize: "C2",
} as EmailReplierData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const EmailReplierNode = memo(
  ({ id, spec }: NodeProps & { spec: NodeSpec }) => {
    // -------------------------------------------------------------------------
    const { nodeData, updateNodeData } = useNodeData(id, {});
    const { authToken: token } = useAuth();
    const flowMetadata = useFlowMetadataOptional();
    const flowId = String(flowMetadata?.flow?.id ?? "");

    // -------------------------------------------------------------------------
    // STATE MANAGEMENT (grouped for clarity)
    // -------------------------------------------------------------------------
    const {
      isExpanded,
      isEnabled,
      replyStrategy,
      selectedTemplate,
      customTemplate,
      useCustomTemplate,
      aiModel,
      aiPrompt,
      includeContext,
      maxTokens,
      temperature,
      replyToAll,
      includeOriginal,
      addSignature,
      signature,
      enableAutoReply,
      autoReplyConditions,
      extractKeywords,
      analyzeSentiment,
      detectLanguage,
      preserveFormatting,
      outputFormat,
      includeMetadata,
      isProcessing,
      lastProcessed,
      processedCount,
      lastError,
      retryCount,
      maxRetries,
      inputEmails,
      inputEmail,
      generatedReply,
      replyMetadata,
    } = nodeData as EmailReplierData;

    const categoryStyles = CATEGORY_TEXT.EMAIL;

    // Global React‑Flow store – subscribe only to edges relevant to this node
    const _edges = useStore(
      (s) => s.edges.filter((e) => e.source === id || e.target === id),
      (a, b) => {
        if (a === b) return true;
        if (a.length !== b.length) return false;
        const aIds = a.map((e) => e.id).join("|");
        const bIds = b.map((e) => e.id).join("|");
        return aIds === bIds;
      }
    );
    const { getNodes } = useReactFlow();

    // Keep last emitted output to avoid redundant writes
    const _lastOutputRef = useRef<string | null>(null);

    // -------------------------------------------------------------------------
    // 4.3  Convex integration
    // -------------------------------------------------------------------------
    const emailTemplates = useQuery(
      api.emailAccounts.getEmailReplyTemplates,
      {}
    );

    // -------------------------------------------------------------------------
    // 4.4  Available templates for selection
    // -------------------------------------------------------------------------
    const availableTemplates = useMemo(() => {
      if (!Array.isArray(emailTemplates)) {
        return [];
      }

      return emailTemplates.map((template: any) => ({
        value: template.id,
        label: template.name,
        category: template.category,
        content: template.content_template,
      }));
    }, [emailTemplates]);

    // -------------------------------------------------------------------------
    // 4.5  Callbacks
    // -------------------------------------------------------------------------

    /** Toggle between collapsed / expanded */
    const toggleExpand = useCallback(() => {
      updateNodeData({ isExpanded: !isExpanded });
    }, [isExpanded, updateNodeData]);

    // Detect connection with emailReader and update inputEmails using handle-based outputs
    const lastEmailsJsonRef = useRef<string>("[]");
    useEffect(() => {
      const incoming = findEdgesByHandle(_edges as any, id, "messages-input");
      if (!incoming || incoming.length === 0) {
        if (lastEmailsJsonRef.current !== "[]") {
          lastEmailsJsonRef.current = "[]";
          updateNodeData({ inputEmails: [], inputEmail: "" });
        }
        return;
      }
      // Prefer first connected source for now
      const edge = incoming[0];
      const sourceNode = (getNodes() as any[]).find(
        (n) => n.id === edge.source
      );
      // Prefer ephemeral outputs store from EmailReader (current flow scope)
      let next = getEmailReaderMessagesForNode(flowId, edge.source);
      // Fallback: legacy data paths if any
      if (!Array.isArray(next) || next.length === 0) {
        const data = (sourceNode?.data ?? {}) as Record<string, unknown>;
        let emails: unknown = [];
        const output = (data.output ?? {}) as Record<string, unknown>;
        if (edge.sourceHandle) {
          const h = normalizeHandleId(edge.sourceHandle);
          emails = output[h] ?? emails;
        }
        if (!Array.isArray(emails))
          emails = output["messages-output"] ?? emails;
        if (!Array.isArray(emails)) emails = (data as any).messages;
        if (
          !Array.isArray(emails) &&
          typeof (data as any).emailsOutput === "string"
        ) {
          try {
            const parsed = JSON.parse((data as any).emailsOutput as string);
            if (Array.isArray(parsed)) emails = parsed;
          } catch {}
        }
        next = Array.isArray(emails) ? (emails as any[]) : [];
      }
      const nextJson = JSON.stringify(next);
      if (nextJson !== lastEmailsJsonRef.current) {
        lastEmailsJsonRef.current = nextJson;
        const first = next[0] as any;
        const body = first?.body ?? first?.content ?? first?.text ?? "";
        updateNodeData({ inputEmails: next as any[], inputEmail: body });
      }
    }, [_edges, id, getNodes, updateNodeData]);

    /** Handle strategy change */
    const handleStrategyChange = useCallback(
      (e: ChangeEvent<HTMLSelectElement>) => {
        const newStrategy = e.target.value as EmailReplierData["replyStrategy"];
        updateNodeData({ replyStrategy: newStrategy });

        if (
          newStrategy === "template" &&
          !selectedTemplate &&
          !useCustomTemplate
        ) {
          updateNodeData({ useCustomTemplate: true });
        }
      },
      [selectedTemplate, useCustomTemplate, updateNodeData]
    );

    /** Handle template selection */
    const handleTemplateChange = useCallback(
      (e: ChangeEvent<HTMLSelectElement>) => {
        const templateId = e.target.value;
        const template = availableTemplates.find(
          (t: any) => t.value === templateId
        );
        updateNodeData({
          selectedTemplate: templateId,
          customTemplate: template?.content || customTemplate,
        });
      },
      [availableTemplates, customTemplate, updateNodeData]
    );

    /** Handle custom template change */
    const handleCustomTemplateChange = useCallback(
      (e: ChangeEvent<HTMLTextAreaElement>) => {
        updateNodeData({ customTemplate: e.target.value });
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

    /** Handle AI model change */
    const handleAIModelChange = useCallback(
      (e: ChangeEvent<HTMLSelectElement>) => {
        updateNodeData({
          aiModel: e.target.value as EmailReplierData["aiModel"],
        });
      },
      [updateNodeData]
    );

    /** Handle AI prompt change */
    const handleAIPromptChange = useCallback(
      (e: ChangeEvent<HTMLTextAreaElement>) => {
        updateNodeData({ aiPrompt: e.target.value });
      },
      [updateNodeData]
    );

    /** Handle signature change */
    const handleSignatureChange = useCallback(
      (e: ChangeEvent<HTMLTextAreaElement>) => {
        updateNodeData({ signature: e.target.value });
      },
      [updateNodeData]
    );

    /** Handle generate reply action */
    const handleGenerateReply = useCallback(async () => {
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      try {
        updateNodeData({
          isProcessing: true,
          lastError: "",
          retryCount: 0,
        });

        // Simulate reply generation for now (AI integration ready for future)
        setTimeout(() => {
          const mockReply = `Thank you for your email. This is a ${replyStrategy} reply generated at ${new Date().toLocaleString()}.`;

          // Generate structured output
          const outputData = {
            "📧 Email Reply Generated": {
              Strategy: replyStrategy || "auto",
              Tone: "professional",
              "Reply Length": `${mockReply.length} characters`,
              "✅ Features Applied": {
                "Reply to All": replyToAll ? "✅" : "❌",
                "Include Original": includeOriginal ? "✅" : "❌",
                "Add Signature": addSignature ? "✅" : "❌",
                "Auto Reply": enableAutoReply ? "✅" : "❌",
              },
              "📊 Processing": {
                "Input Source":
                  inputEmails?.length > 0 ? "EmailReader" : "Manual",
                "Generated At": new Date().toLocaleString(),
                Status: "✅ Success (Simulated)",
              },
            },
          };

          updateNodeData({
            isProcessing: false,
            generatedReply: mockReply,
            lastProcessed: Date.now(),
            processedCount: processedCount + 1,
            replyMetadata: {
              strategy: replyStrategy,
              confidence: 0.85,
              processingTime: 2000,
              tokensUsed: replyStrategy.includes("ai") ? 150 : undefined,
            },
            isActive: true,
            outputs: JSON.stringify(outputData, null, 2),
          });

          toast.success("Reply generated successfully");
        }, 2000);
      } catch (error) {
        console.error("Reply generation error:", error);
        updateNodeData({
          isProcessing: false,
          lastError:
            error instanceof Error ? error.message : "Failed to generate reply",
          retryCount: retryCount + 1,
        });
        toast.error("Failed to generate reply", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }, [
      token,
      replyStrategy,
      processedCount,
      retryCount,
      replyToAll,
      includeOriginal,
      addSignature,
      enableAutoReply,
      inputEmails,
      updateNodeData,
    ]);

    // -------------------------------------------------------------------------
    // 4.6  Effects
    // -------------------------------------------------------------------------

    /** Update output map when reply state changes */
    const lastOutputRef = useRef<string>("{}");
    useEffect(() => {
      if (
        isEnabled &&
        typeof generatedReply === "string" &&
        generatedReply.length > 0
      ) {
        const payload = {
          reply: generatedReply,
          metadata: replyMetadata ?? null,
        };
        const outputObj: Record<string, unknown> = {
          "message-output": payload,
          "status-output": true,
        };
        const json = JSON.stringify(outputObj);
        if (json !== lastOutputRef.current) {
          lastOutputRef.current = json;
          updateNodeData({ output: outputObj, isActive: true });
        }
      } else {
        if (lastOutputRef.current !== "{}") {
          lastOutputRef.current = "{}";
          updateNodeData({ output: {}, isActive: false });
        }
      }
    }, [isEnabled, generatedReply, replyMetadata, updateNodeData]);

    // -------------------------------------------------------------------------
    // 4.7  Validation
    // -------------------------------------------------------------------------
    // CIRCULAR REFERENCE FIX: Safe validation with error handling
    try {
      const validation = validateNodeData(nodeData);
      if (!validation.success) {
        reportValidationError("EmailReplier", id, validation.errors, {
          originalData: validation.originalData,
          component: "EmailReplierNode",
        });
      }

      useNodeDataValidation(
        EmailReplierDataSchema,
        "EmailReplier",
        validation.data,
        id
      );
    } catch (error) {
      console.error("Validation error in EmailReplier:", error);
      // Continue rendering even if validation fails
    }

    // -------------------------------------------------------------------------
    // 4.8  Render
    // -------------------------------------------------------------------------
    return (
      <>
        {/* Editable label */}
        <LabelNode
          nodeId={id}
          label={(nodeData as EmailReplierData).label || spec.displayName}
        />

        {isExpanded ? (
          <div
            className={`${CONTENT.expanded} ${isEnabled ? "" : CONTENT.disabled}`}
          >
            <div className={CONTENT.header}>
              <span className="font-medium text-sm">Email Replier</span>
              <div
                className={`text-xs ${isProcessing ? "text-blue-600" : generatedReply ? "text-green-600" : lastError ? "text-red-600" : "text-gray-600"}`}
              >
                {isProcessing
                  ? "🔄 Processing"
                  : generatedReply
                    ? "✓ Ready"
                    : lastError
                      ? "✗ Error"
                      : "○ Idle"}
              </div>
            </div>

            <div className={`${CONTENT.body} max-h-[400px] overflow-y-auto`}>
              {/* Reply Strategy Selection */}
              <div>
                <label
                  htmlFor="reply-strategy-select"
                  className="mb-1 block text-gray-600 text-xs"
                >
                  Reply Strategy:
                </label>
                <select
                  id="reply-strategy-select"
                  value={replyStrategy}
                  onChange={handleStrategyChange}
                  className="w-full rounded border border-gray-300 p-2 text-xs"
                  disabled={!isEnabled || isProcessing}
                >
                  <option value="auto">Auto Reply</option>
                  <option value="template">Template Based</option>
                  <option value="ai-generated">AI Generated</option>
                  <option value="hybrid">Hybrid (Template + AI)</option>
                </select>
              </div>

              {/* Template Configuration */}
              {(replyStrategy === "template" || replyStrategy === "hybrid") && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-gray-600 text-xs">Template:</label>
                    <label className="flex items-center text-xs">
                      <input
                        type="checkbox"
                        checked={useCustomTemplate}
                        onChange={handleCheckboxChange("useCustomTemplate")}
                        className="mr-1"
                        disabled={!isEnabled}
                      />
                      Custom
                    </label>
                  </div>

                  {useCustomTemplate ? (
                    <textarea
                      value={customTemplate}
                      onChange={handleCustomTemplateChange}
                      placeholder="Enter your custom reply template..."
                      className="w-full rounded border border-gray-300 p-2 text-xs resize-none"
                      rows={3}
                      disabled={!isEnabled || isProcessing}
                    />
                  ) : (
                    <select
                      value={selectedTemplate}
                      onChange={handleTemplateChange}
                      className="w-full rounded border border-gray-300 p-2 text-xs"
                      disabled={!isEnabled || isProcessing}
                    >
                      <option value="">Select template...</option>
                      {availableTemplates.map((template: any) => (
                        <option key={template.value} value={template.value}>
                          {template.label} ({template.category})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* AI Configuration */}
              {(replyStrategy === "ai-generated" ||
                replyStrategy === "hybrid") && (
                <div className="space-y-2">
                  <div>
                    <label
                      htmlFor="ai-model-select"
                      className="mb-1 block text-gray-600 text-xs"
                    >
                      AI Model:
                    </label>
                    <select
                      id="ai-model-select"
                      value={aiModel}
                      onChange={handleAIModelChange}
                      className="w-full rounded border border-gray-300 p-2 text-xs"
                      disabled={!isEnabled || isProcessing}
                    >
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      <option value="gpt-4">GPT-4</option>
                      <option value="claude-3">Claude 3</option>
                      <option value="local">Local Model</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="ai-prompt-textarea"
                      className="mb-1 block text-gray-600 text-xs"
                    >
                      AI Prompt:
                    </label>
                    <textarea
                      id="ai-prompt-textarea"
                      value={aiPrompt}
                      onChange={handleAIPromptChange}
                      placeholder="Enter AI prompt for reply generation..."
                      className="w-full rounded border border-gray-300 p-2 text-xs resize-none"
                      rows={2}
                      disabled={!isEnabled || isProcessing}
                    />
                  </div>
                </div>
              )}

              {/* Reply Settings */}
              <div className="flex flex-col gap-2">
                <label className="flex items-center text-xs">
                  <input
                    type="checkbox"
                    checked={replyToAll}
                    onChange={handleCheckboxChange("replyToAll")}
                    className="mr-2"
                    disabled={!isEnabled}
                  />
                  Reply to All
                </label>
                <label className="flex items-center text-xs">
                  <input
                    type="checkbox"
                    checked={includeOriginal}
                    onChange={handleCheckboxChange("includeOriginal")}
                    className="mr-2"
                    disabled={!isEnabled}
                  />
                  Include Original Message
                </label>
                <label className="flex items-center text-xs">
                  <input
                    type="checkbox"
                    checked={addSignature}
                    onChange={handleCheckboxChange("addSignature")}
                    className="mr-2"
                    disabled={!isEnabled}
                  />
                  Add Signature
                </label>
                <label className="flex items-center text-xs">
                  <input
                    type="checkbox"
                    checked={enableAutoReply}
                    onChange={handleCheckboxChange("enableAutoReply")}
                    className="mr-2"
                    disabled={!isEnabled}
                  />
                  Enable Auto Reply
                </label>
              </div>

              {/* Signature */}
              {addSignature && (
                <div>
                  <label
                    htmlFor="signature-textarea"
                    className="mb-1 block text-gray-600 text-xs"
                  >
                    Signature:
                  </label>
                  <textarea
                    id="signature-textarea"
                    value={signature}
                    onChange={handleSignatureChange}
                    placeholder="Enter your email signature..."
                    className="w-full rounded border border-gray-300 p-2 text-xs resize-none"
                    rows={2}
                    disabled={!isEnabled}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateReply}
                  disabled={!isEnabled || isProcessing}
                  className="flex-1 rounded bg-blue-500 p-2 text-white text-xs hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  type="button"
                >
                  {isProcessing ? "Generating..." : "Generate Reply"}
                </button>
              </div>

              {/* Reply Preview */}
              {generatedReply && (
                <div>
                  <label className="mb-1 block text-gray-600 text-xs">
                    Generated Reply:
                  </label>
                  <div className="rounded bg-gray-50 border border-gray-200 p-2 text-xs max-h-24 overflow-y-auto">
                    {generatedReply}
                  </div>
                </div>
              )}

              {/* Status Information */}
              <div className="rounded bg-gray-50 p-2 text-gray-500 text-xs">
                <div>
                  Strategy: {replyStrategy} | Processed: {processedCount}
                </div>
                {lastProcessed && (
                  <div>Last: {new Date(lastProcessed).toLocaleString()}</div>
                )}
                {replyMetadata && (
                  <div>
                    Confidence: {Math.round(replyMetadata.confidence * 100)}% |
                    Time: {replyMetadata.processingTime}ms
                    {replyMetadata.tokensUsed &&
                      ` | Tokens: ${replyMetadata.tokensUsed}`}
                  </div>
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
                {generatedReply ? `${replyStrategy} reply` : "No reply"}
              </div>
              <div
                className={`text-xs ${isProcessing ? "text-blue-600" : generatedReply ? "text-green-600" : lastError ? "text-red-600" : "text-gray-600"}`}
              >
                {isProcessing
                  ? "🔄"
                  : generatedReply
                    ? "✓"
                    : lastError
                      ? "✗"
                      : "○"}{" "}
                {isProcessing
                  ? "Processing"
                  : generatedReply
                    ? "Ready"
                    : lastError
                      ? "Error"
                      : "Idle"}
              </div>
            </div>
          </div>
        )}

        <ExpandCollapseButton showUI={isExpanded} onToggle={toggleExpand} />
      </>
    );
  }
);

// -----------------------------------------------------------------------------
// 5️⃣  High‑order wrapper – inject scaffold with dynamic spec
// -----------------------------------------------------------------------------

const EmailReplierNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec only when the size keys change
  const { expandedSize, collapsedSize } = nodeData as EmailReplierData;
  const dynamicSpec = useMemo(
    () =>
      createDynamicSpec({
        expandedSize,
        collapsedSize,
      } as EmailReplierData),
    [expandedSize, collapsedSize]
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <EmailReplierNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
};

export default EmailReplierNodeWithDynamicSpec;
