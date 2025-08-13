"use client";
/**
 * emailTemplate NODE – Template management system
 *
 * • Create, edit, and manage email templates with dynamic variables
 * • Template categorization and organization system
 * • Variable substitution with preview functionality
 * • Import/export templates for sharing and backup
 * • Integration with emailCreator, emailReplier, and other email nodes
 * • Modal-based email designer to prevent hydration errors
 *
 * Keywords: email-templates, variables, preview, management, organization, modal-designer
 */

import type { NodeProps } from "@xyflow/react";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { z } from "zod";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";

// Ensure GrapesJS styles are loaded once at module load
import "grapesjs/dist/css/grapes.min.css";

// -----------------------------------------------------------------------------
// 1) Remove previous Unlayer/Easy Email editor integrations
//    We now use GrapesJS (newsletter preset) inside the modal
// -----------------------------------------------------------------------------


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
import { api } from "@/convex/_generated/api";
// Convex integration
import { useMutation, useQuery, useConvexAuth } from "convex/react";
import { toast } from "sonner";

// Easy Email Editor (React + MJML)
// [Explanation], basically embed drag‑and‑drop email designer based on MJML
// CSS should be imported at app layout level per Next.js best practices:
//  - 'easy-email-editor/lib/style.css'
//  - 'easy-email-extensions/lib/style.css'
//  - '@arco-themes/react-easy-email-theme/css/arco.css'

// Unified per-handle output system
import { generateoutputField } from "@/features/business-logic-modern/infrastructure/node-core/handleOutputUtils";

// -----------------------------------------------------------------------------
// Client-only wrapper to prevent SSR hydration issues
// -----------------------------------------------------------------------------
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
}

// -----------------------------------------------------------------------------
// Dynamic EmailEditor components to prevent SSR issues
// -----------------------------------------------------------------------------
 
// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const EmailTemplateDataSchema = z
  .object({
    // Template Configuration
    templateName: z.string().default(""),
    templateDescription: z.string().default(""),
    category: z.string().default("general"),

    // Template Content
    subject: z.string().default(""),
    htmlContent: z.string().default(""),
    textContent: z.string().default(""),

    // Easy Email Editor state (serialized JSON)
    editorData: z.record(z.string(), z.unknown()).optional().default({}),
    selectedTemplateId: z.string().default(""),

    // Variables System
    variables: z
      .array(
        z.object({
          name: z.string(),
          type: z
            .enum(["text", "number", "date", "boolean", "email", "url"])
            .default("text"),
          required: z.boolean().default(false),
          defaultValue: z.string().default(""),
          description: z.string().default(""),
        })
      )
      .default([]),

    // Template Management
    templateId: z.string().default(""),
    isTemplate: z.boolean().default(true),
    version: z.number().default(1),

    // Preview System
    previewData: z.record(z.string()).default({}),
    showPreview: z.boolean().default(false),

    // Import/Export
    importData: z.string().default(""),
    exportFormat: z.enum(["json", "html", "text"]).default("json"),

    // Processing State
    isLoading: z.boolean().default(false),
    isSaving: z.boolean().default(false),
    lastSaved: z.number().optional(),

    // Error Handling
    lastError: z.string().default(""),
    validationErrors: z.array(z.string()).default([]),

    // UI State
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    expandedSize: SafeSchemas.text("VE3"),
    collapsedSize: SafeSchemas.text("C2"),
    showEditorModal: SafeSchemas.boolean(false),

    // Output Data
    templateOutput: z.string().default(""),
    outputs: z.string().default(""), // Structured output for viewText nodes
    output: z.record(z.string(), z.unknown()).optional(),
    compiledTemplate: z
      .object({
        subject: z.string(),
        html: z.string(),
        text: z.string(),
        variables: z.record(z.string()),
      })
      .optional(),

    label: z.string().optional(), // User-editable node label
  })
  .passthrough();

export type EmailTemplateData = z.infer<typeof EmailTemplateDataSchema>;

const validateNodeData = createNodeValidator(
  EmailTemplateDataSchema,
  "EmailTemplate"
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

const TEMPLATE_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "welcome", label: "Welcome" },
  { value: "notification", label: "Notification" },
  { value: "marketing", label: "Marketing" },
  { value: "transactional", label: "Transactional" },
  { value: "support", label: "Support" },
  { value: "newsletter", label: "Newsletter" },
  { value: "custom", label: "Custom" },
];

const VARIABLE_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "number" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "boolean" },
  { value: "email", label: "Email" },
  { value: "url", label: "URL" },
] as const;

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

function createDynamicSpec(data: EmailTemplateData): NodeSpec {
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
    DATA_IN: "Data",
    TEMPLATE_OUT: "Template",
    COMPILED_OUT: "Compiled",
    OUTPUTS_OUT: "Outputs",
  } as const;

  return {
    kind: "emailTemplate",
    displayName: "Email Template",
    label: "Email Template",
    category: CATEGORIES.EMAIL,
    size: { expanded, collapsed },
    handles: [
      {
        id: "data-input",
        code: "account",
        position: "top",
        type: "target",
        dataType: "JSON",
        tooltip: HANDLE_TOOLTIPS.DATA_IN,
      },
      {
        id: "template-output",
        code: "json",
        position: "right",
        type: "source",
        dataType: "JSON",
        tooltip: HANDLE_TOOLTIPS.TEMPLATE_OUT,
      },
      {
        id: "compiled-output",
        code: "json",
        position: "bottom",
        type: "source",
        dataType: "JSON",
        tooltip: HANDLE_TOOLTIPS.COMPILED_OUT,
      },
      {
        id: "outputs",
        code: "json",
        position: "right",
        type: "source",
        dataType: "string",
        tooltip: HANDLE_TOOLTIPS.OUTPUTS_OUT,
      },
    ],
    inspector: { key: "EmailTemplateInspector" },
    version: 1,
    runtime: { execute: "emailTemplate_execute_v1" },
    initialData: createSafeInitialData(EmailTemplateDataSchema, {
      templateName: "",
      templateDescription: "",
      category: "general",
      subject: "",
      htmlContent: "",
      textContent: "",
      editorData: {},
      variables: [],
      templateId: "",
      isTemplate: true,
      version: 1,
      previewData: {},
      showPreview: false,
      importData: "",
      exportFormat: "json",
      isLoading: false,
      isSaving: false,
      lastError: "",
      validationErrors: [],
      templateOutput: "",
      output: {},
      showEditorModal: false,
    }),
    dataSchema: EmailTemplateDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "templateOutput",
        "compiledTemplate",
        "isLoading",
        "isSaving",
        "lastSaved",
        "lastError",
        "validationErrors",
        "expandedSize",
        "collapsedSize",
        "showEditorModal",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        {
          key: "templateName",
          type: "text",
          label: "Template Name",
          placeholder: "Enter template name",
        },
        {
          key: "templateDescription",
          type: "textarea",
          label: "Description",
          placeholder: "Template description",
        },
        {
          key: "category",
          type: "select",
          label: "Category",
          validation: {
            options: TEMPLATE_CATEGORIES,
          },
        },
        {
          key: "subject",
          type: "text",
          label: "Subject",
          placeholder: "Email subject with {{variables}}",
        },
        {
          key: "htmlContent",
          type: "textarea",
          label: "HTML Content",
          placeholder: "HTML email content",
        },
        {
          key: "textContent",
          type: "textarea",
          label: "Text Content",
          placeholder: "Plain text fallback",
        },
        { key: "showPreview", type: "boolean", label: "Show Preview" },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuFileText",
    author: "Agenitix Team",
    description:
      "Create and manage email templates with dynamic variables and preview functionality",
    feature: "email",
    tags: ["email", "template", "variables", "preview", "management"],
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE3",
  collapsedSize: "C2",
} as EmailTemplateData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const EmailTemplateNode = memo(
  ({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
    // -------------------------------------------------------------------------
    const { nodeData, updateNodeData } = useNodeData(id, data);
    const { user } = useAuth();
    const { isAuthenticated } = useConvexAuth();

    // -------------------------------------------------------------------------
    // STATE MANAGEMENT (grouped for clarity)
    // -------------------------------------------------------------------------
    const {
      isExpanded,
      isEnabled,
      templateName,
      templateDescription,
      category,
      subject,
      htmlContent,
      textContent,
      editorData,
      variables,
      templateId,
      previewData,
      showPreview,
      isLoading,
      isSaving,
      lastError,
      templateOutput,
      isActive,
      lastSaved,
      showEditorModal,
    } = nodeData as EmailTemplateData;

    const categoryStyles = CATEGORY_TEXT.EMAIL;

    // Global React‑Flow store (nodes & edges) – triggers re‑render on change
    const _nodes = useStore((s) => s.nodes);
    const _edges = useStore((s) => s.edges);

    // Keep last emitted output to avoid redundant writes
    const _lastOutputRef = useRef<string | null>(null);

    // Local state for UI
    const [activeTab, setActiveTab] = useState<
      "content" | "variables" | "preview"
    >("content");
    const [newVariable, setNewVariable] = useState({
      name: "",
      type: "text" as const,
      required: false,
      defaultValue: "",
      description: "",
    });
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
      (nodeData as EmailTemplateData).selectedTemplateId || ""
    );

    // -------------------------------------------------------------------------
    // 4.3  Convex integration
    // -------------------------------------------------------------------------
    const emailTemplates = useQuery(
      api.emailAccounts.getEmailReplyTemplates,
      user ? {} : "skip"
    );

    const saveTemplateMutation = useMutation(
      api.emailAccounts.storeEmailReplyTemplate
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
        subject: template.subject_template,
        content: template.content_template,
        variables: template.variables,
      }));
    }, [emailTemplates]);

    // -------------------------------------------------------------------------
    // 4.5  Callbacks
    // -------------------------------------------------------------------------

    /** Toggle between collapsed / expanded */
    const toggleExpand = useCallback(() => {
      updateNodeData({ isExpanded: !isExpanded });
    }, [isExpanded, updateNodeData]);

    /** Compile template with preview data */
    const compileTemplate = useCallback(() => {
      let compiledSubject = subject || "";
      let compiledHtml = htmlContent || "";
      let compiledText = textContent || "";

      // Replace variables with preview data
      (variables || []).forEach((variable) => {
        if (!variable || !variable.name) return;
        const value =
          (previewData || {})[variable.name] ||
          variable.defaultValue ||
          `{{${variable.name}}}`;
        const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, "g");

        compiledSubject = compiledSubject.replace(regex, value);
        compiledHtml = compiledHtml.replace(regex, value);
        compiledText = compiledText.replace(regex, value);
      });

      // Clean up HTML content to prevent whitespace hydration issues
      // [Explanation], basically remove extra whitespace and normalize HTML formatting
      if (compiledHtml) {
        compiledHtml = compiledHtml
          .replace(/\s+/g, ' ') // Normalize whitespace
          .replace(/>\s+</g, '><') // Remove whitespace between tags
          .trim(); // Remove leading/trailing whitespace
      }

      return {
        subject: compiledSubject.trim(),
        html: compiledHtml,
        text: compiledText.trim(),
        variables: previewData,
      };
    }, [subject || "", htmlContent || "", textContent || "", variables || [], previewData || {}]);

    /** Save template */
    const handleSaveTemplate = useCallback(async () => {
      if (!user || !isAuthenticated) {
        toast.error("Authentication required - please login first");
        return;
      }

      if (!templateName || !templateName.trim()) {
        toast.error("Template name is required");
        return;
      }

      try {
        updateNodeData({ isSaving: true, lastError: "" });

        const serializedBody = JSON.stringify(
          (editorData as Record<string, unknown>) || {},
          null,
          2
        );

        const result = await saveTemplateMutation({
          name: templateName,
          subject: subject || "",
          body: serializedBody,
          category: category || "general",
          description: templateDescription || "",
          variables: (variables || [])
            .map((v) => v?.name || "")
            .filter(Boolean),
        });

        if (result.success) {
          // Create structured output
          const formattedOutput = {
            "📄 Template Saved": {
              "Template Name": templateName || "",
              Category: category || "general",
              Subject: subject || "",
              Variables:
                (variables || []).length > 0
                  ? (variables || []).map((v) => v?.name || "").filter(Boolean).join(", ")
                  : "None",
              "Content Type": editorData ? "Easy Email JSON" : (htmlContent || textContent) ? "HTML + Text" : "Text Only",
              "Content Length": `${(htmlContent || textContent || "").length} characters`,
              "Template ID": result.templateId,
              "✅ Status": result.isUpdate ? "Updated" : "Created",
              "⏰ Saved At": new Date().toLocaleString(),
            },
          };

          updateNodeData({
            isSaving: false,
            templateId: result.templateId,
            lastSaved: Date.now(),
            isActive: true,
            outputs: JSON.stringify(formattedOutput, null, 2),
          });
          toast.success(
            `Template ${result.isUpdate ? "updated" : "created"} successfully`
          );
        } else {
          throw new Error("Failed to save template");
        }
      } catch (error) {
        console.error("Save template error:", error);
        updateNodeData({
          isSaving: false,
          lastError:
            error instanceof Error ? error.message : "Failed to save template",
        });
        toast.error("Failed to save template", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }, [
      user,
      isAuthenticated,
      templateName,
      category,
      subject,
      editorData,
      variables,
      templateDescription,
      saveTemplateMutation,
      updateNodeData,
    ]);

    // -------------------------------------------------------------------------
    // 4.6  Effects
    // -------------------------------------------------------------------------

    /** Update output when template changes */
    useEffect(() => {
      if (isEnabled && templateName && templateName.trim()) {
        const compiled = compileTemplate();
        updateNodeData({
          compiledTemplate: compiled,
          templateOutput: JSON.stringify({
            id: templateId,
            name: templateName,
            category,
            subject,
            htmlContent,
            textContent,
            variables,
            compiled,
          }),
          isActive: true,
        });
      } else {
        updateNodeData({
          isActive: false,
        });
      }
    }, [
      isEnabled,
      templateName,
      category,
      subject,
      htmlContent,
      textContent,
      variables || [],
      previewData || {},
      templateId,
      compileTemplate,
      updateNodeData,
    ]);

    /** Update structured output for viewText nodes */
    useEffect(() => {
      if (templateName && templateName.trim() && isEnabled) {
        const formattedOutput = {
          "📄 Email Template": {
            "Template Name": templateName || "",
            Category: category || "general",
            Subject: subject || "(No subject)",
            Variables:
              (variables || []).length > 0
                ? (variables || []).map((v) => v.name || "").join(", ")
                : "None",
            "Content Type": editorData
              ? "Easy Email JSON"
              : htmlContent
                ? "HTML + Text"
                : textContent
                  ? "Text Only"
                  : "Empty",
            "Content Length": `${(htmlContent || textContent || "").length} characters`,
            Status: isActive ? "✅ Active" : "⏸️ Inactive",
            "Last Updated": lastSaved
              ? new Date(lastSaved).toLocaleString()
              : "Not saved",
          },
        };

        updateNodeData({
          outputs: JSON.stringify(formattedOutput, null, 2),
        });
      } else {
        updateNodeData({
          outputs: "",
        });
      }
    }, [
      templateName,
      category,
      subject,
      variables || [],
      htmlContent,
      textContent,
      editorData,
      isActive,
      lastSaved,
      isEnabled,
      updateNodeData,
    ]);

    // -------------------------------------------------------------------------
    // 4.7  Validation
    // -------------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("EmailTemplate", id, validation.errors, {
        originalData: validation.originalData,
        component: "EmailTemplateNode",
      });
    }

    useNodeDataValidation(
      EmailTemplateDataSchema,
      "EmailTemplate",
      validation.data,
      id
    );

    // -------------------------------------------------------------------------
    // 4.8a  Unified handle-based output (expose editorData on template-output)
    // -------------------------------------------------------------------------
    const _lastHandleMapRef = useRef<Map<string, unknown> | null>(null);
    useEffect(() => {
      try {
        const perHandle: Record<string, unknown> = {
          ["template-output"]: (editorData as Record<string, unknown>) || {},
        };
        const synthetic = { ...(nodeData as any), ...perHandle };
        const map = generateoutputField(spec, synthetic);
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
    }, [spec.handles, editorData, nodeData, updateNodeData]);

    // -------------------------------------------------------------------------
    // 4.8  Render
    // -------------------------------------------------------------------------

    return (
      <>
        <LabelNode nodeId={id} label="Email Template" />

        {isExpanded ? (
          <div
            className={`${CONTENT.expanded} ${isEnabled ? "" : CONTENT.disabled}`}
          >
            {/* Header */}
            <div className={CONTENT.header}>
              <span className="font-medium text-sm">Email Template</span>
            </div>

            {/* Body */}
            <div className={CONTENT.body}>
              {/* Template Info */}
              <div className="space-y-2">
                <div>
                  <label
                    htmlFor={`template-name-${id}`}
                    className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Template Name
                  </label>
                  <input
                    id={`template-name-${id}`}
                    type="text"
                    value={templateName || ""}
                    onChange={(e) =>
                      updateNodeData({ templateName: e.target.value })
                    }
                    placeholder="Enter template name"
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    disabled={!isEnabled}
                  />
                </div>

                <div>
                  <label
                    htmlFor={`template-category-${id}`}
                    className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Category
                  </label>
                  <select
                    id={`template-category-${id}`}
                    value={category || "general"}
                    onChange={(e) =>
                      updateNodeData({ category: e.target.value })
                    }
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    disabled={!isEnabled}
                  >
                    {TEMPLATE_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor={`template-subject-${id}`}
                    className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Subject
                  </label>
                  <input
                    id={`template-subject-${id}`}
                    type="text"
                    value={subject || ""}
                    onChange={(e) =>
                      updateNodeData({ subject: e.target.value })
                    }
                    placeholder="Email subject with {{variables}}"
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    disabled={!isEnabled}
                  />
                </div>
              </div>

            {/* Designer – Easy Email Editor */}
            <div className="space-y-2">
              <div>
                <div className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Designer – GrapesJS (MJML)
                </div>
                <div className="rounded border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
                  <div className="text-center">
                    <button
                      onClick={() => updateNodeData({ showEditorModal: true })}
                      className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2 mx-auto"
                      disabled={!isEnabled}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      {editorData && Object.keys(editorData).length > 0 ? "Edit Email Design" : "Create Email Design"}
                    </button>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {editorData && Object.keys(editorData).length > 0 
                        ? "Designer has content - click to edit" 
                        : "No design content yet - click to create"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

              {/* Preview */}
              {showPreview && templateName && templateName.trim() && (
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Preview
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <div>
                      <strong>Subject:</strong> {compileTemplate().subject}
                    </div>
                    <div className="mt-1">
                      <strong>Content:</strong>
                    </div>
                    <div className="mt-1 p-1 bg-white dark:bg-gray-700 rounded text-xs max-h-20 overflow-y-auto">
                      {compileTemplate().html ||
                        compileTemplate().text ||
                        "No content"}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                {/* Load saved template into designer */}
                <div className="flex gap-2 items-center">
                  <select
                    value={(nodeData as any).selectedTemplateId || ""}
                    onChange={(e) => updateNodeData({ selectedTemplateId: e.target.value })}
                    className="min-w-0 flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    disabled={!isEnabled || !Array.isArray(emailTemplates)}
                  >
                    <option value="">Select saved template…</option>
                    {(emailTemplates || []).map((t: any) => (
                      <option key={String(t.id)} value={String(t.id)}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const selectedId = (nodeData as any).selectedTemplateId;
                      if (!selectedId) return;
                      const t = (emailTemplates || []).find(
                        (x: any) => String(x.id) === String(selectedId)
                      );
                      if (!t) return;
                      try {
                        const parsed = JSON.parse(String(t.content_template || "{}"));
                        updateNodeData({ editorData: parsed, isActive: true });
                        toast.success("Template loaded into designer");
                      } catch {
                        toast.error("Saved template is not in JSON format");
                      }
                    }}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    disabled={!isEnabled || !((nodeData as any).selectedTemplateId || "")}
                  >
                    Load
                  </button>
                </div>
                <button
                  onClick={handleSaveTemplate}
                  className="flex-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                  disabled={!isEnabled || isSaving || !templateName || !templateName.trim()}
                >
                  {isSaving ? "Saving..." : "Save Template"}
                </button>

                <button
                  onClick={() => updateNodeData({ showPreview: !showPreview })}
                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  disabled={!isEnabled}
                >
                  {showPreview ? "Hide Preview" : "Show Preview"}
                </button>
              </div>

              {/* Status */}
              {lastError && (
                <div className="text-xs text-red-500 dark:text-red-400 p-1 bg-red-50 dark:bg-red-900/20 rounded">
                  {lastError}
                </div>
              )}

              {isActive && (
                <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Template active
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            className={`${CONTENT.collapsed} ${isEnabled ? "" : CONTENT.disabled}`}
          >
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Template
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px]">
                {templateName?.trim() || "Untitled"}
              </div>
              <div className="flex items-center gap-1">
                {isActive && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
                {editorData && Object.keys(editorData).length > 0 && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" title="Has design content" />
                )}
              </div>
            </div>
          </div>
        )}

        <ExpandCollapseButton showUI={isExpanded} onToggle={toggleExpand} />

        {/* Email Editor Modal */}
        {showEditorModal && (
          <EmailEditorModal
            isOpen={showEditorModal}
            onClose={() => updateNodeData({ showEditorModal: false })}
            editorData={editorData as Record<string, unknown>}
            onSave={(data) => {
              const design = (data as any)?.design ?? (data as any) ?? {};
              const html = String((data as any)?.html ?? "");
              const plain = (() => {
                try {
                  const doc = new DOMParser().parseFromString(html, 'text/html');
                  return (doc.body?.textContent || "").trim();
                } catch {
                  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                }
              })();
              updateNodeData({ 
                editorData: design, 
                htmlContent: html,
                textContent: plain,
                showEditorModal: false, 
                isActive: true 
              });
              toast.success("Email design saved");
            }}
          />
        )}
      </>
    );
  }
);

EmailTemplateNode.displayName = "EmailTemplateNode";

// -----------------------------------------------------------------------------
// 5️⃣  Dynamic spec wrapper component
// -----------------------------------------------------------------------------

const EmailTemplateNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as EmailTemplateData),
    [
      (nodeData as EmailTemplateData).expandedSize,
      (nodeData as EmailTemplateData).collapsedSize,
    ]
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <EmailTemplateNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
};

export default EmailTemplateNodeWithDynamicSpec;

// -----------------------------------------------------------------------------
// Email Editor Modal Component
// -----------------------------------------------------------------------------
type EmailEditorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  editorData: Record<string, unknown>;
  onSave: (data: Record<string, unknown>) => void;
};

function EmailEditorModal({ isOpen, onClose, editorData, onSave }: EmailEditorModalProps) {
  const [isClient, setIsClient] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setIsClient(true); }, []);

  // Lock background scroll while modal is open
  useEffect(() => {
    if (!isClient) return;
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [isClient, isOpen]);

  // Initialize GrapesJS when modal opens
  useEffect(() => {
    console.log("🔍 GrapesJS useEffect triggered:", {
      isOpen,
      isClient,
      hasContainer: !!containerRef.current,
      hasEditor: !!editorRef.current,
      containerElement: containerRef.current
    });

    if (!isOpen || !isClient) {
      console.log("🚫 GrapesJS init skipped due to conditions");
      return;
    }

    // Clean up any existing editor before creating new one
    if (editorRef.current?.ed) {
      console.log("🧹 Cleaning up existing editor");
      try {
        editorRef.current.ed.destroy();
      } catch (e) {
        console.warn("⚠️ Error destroying previous editor:", e);
      }
      editorRef.current = null;
    }

    console.log("🚀 Starting GrapesJS initialization...");

    const initGrapesJS = async () => {
      try {
        // Wait for container to be available and properly attached to document
        let attempts = 0;
        const maxAttempts = 20;
        
        while (attempts < maxAttempts) {
          if (containerRef.current && 
              containerRef.current.ownerDocument && 
              containerRef.current.isConnected &&
              containerRef.current.offsetParent !== null) {
            break;
          }
          console.log(`🔄 Waiting for container to be ready (attempt ${attempts + 1}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        if (attempts >= maxAttempts) {
          console.error("❌ Container never became ready for GrapesJS");
          return;
        }
        
        console.log("📦 Loading GrapesJS modules...");
        const { default: grapesjs } = await import("grapesjs");
        console.log("✅ GrapesJS module loaded:", typeof grapesjs);

        // Final validation
        if (!containerRef.current || !containerRef.current.isConnected) {
          console.error("❌ Container not properly connected to document");
          return;
        }

        // Validate required child elements exist
        const editorMain = containerRef.current.querySelector('.editor-main');
        const blockCategories = containerRef.current.querySelector('.gjs-block-categories');
        const panelRight = containerRef.current.querySelector('.panel__right');
        const panelSwitcher = containerRef.current.querySelector('.panel__switcher');

        if (!editorMain || !blockCategories || !panelRight || !panelSwitcher) {
          console.error("❌ Required child elements not found:", {
            editorMain: !!editorMain,
            blockCategories: !!blockCategories,
            panelRight: !!panelRight,
            panelSwitcher: !!panelSwitcher
          });
          return;
        }

        console.log("🎯 Initializing GrapesJS with container:", {
          element: containerRef.current,
          isConnected: containerRef.current.isConnected,
          ownerDocument: !!containerRef.current.ownerDocument,
          offsetParent: containerRef.current.offsetParent,
          childElements: {
            editorMain: !!editorMain,
            blockCategories: !!blockCategories,
            panelRight: !!panelRight,
            panelSwitcher: !!panelSwitcher
          }
        });
        
        const ed = grapesjs.init({
          container: containerRef.current!.querySelector('.editor-main'),
          height: "100%",
          width: "100%",
          storageManager: false,
          fromElement: false,
          // Configure block manager to use our left panel
          blockManager: {
            appendTo: containerRef.current!.querySelector('.gjs-block-categories'),
          },
          // Configure panels to use our structure
          panels: {
            defaults: [
              {
                id: 'layers',
                el: containerRef.current!.querySelector('.panel__right'),
                resizable: {
                  maxDim: 350,
                  minDim: 200,
                  tc: 0,
                  cl: 1,
                  cr: 0,
                  bc: 0,
                  keyWidth: 'flex-basis',
                },
              },
              {
                id: 'panel-switcher',
                el: containerRef.current!.querySelector('.panel__switcher'),
                buttons: [
                  {
                    id: 'show-layers',
                    active: true,
                    label: 'Layers',
                    command: 'show-layers',
                    togglable: false,
                  },
                  {
                    id: 'show-style',
                    active: true,
                    label: 'Styles',
                    command: 'show-styles',
                    togglable: false,
                  },
                ],
              },
            ],
          },
          // Enhanced canvas configuration
          canvas: {
            styles: [
              'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700'
            ],
            scripts: [],
          },
        });

        console.log("✅ GrapesJS editor created:", ed);
        console.log("📊 Editor details:", {
          container: ed.getContainer(),
          wrapper: ed.getWrapper(),
          canvas: ed.Canvas?.getElement(),
        });

        // Add basic HTML blocks
        ed.BlockManager.add("text", {
          label: "Text",
          category: "Basic",
          content: '<div data-gjs-type="text">Insert your text here</div>',
        });

        ed.BlockManager.add("image", {
          label: "Image", 
          category: "Basic",
          content: { type: "image" },
        });

        ed.BlockManager.add("button", {
          label: "Button",
          category: "Basic", 
          content: '<a href="#" style="display:inline-block;background:#007cba;color:#fff;padding:10px 20px;text-decoration:none;border-radius:3px;">Button</a>',
        });

        ed.BlockManager.add("section", {
          label: "Section",
          category: "Layout",
          content: '<section style="padding:20px;"><div>Section content</div></section>',
        });

        console.log("✅ Blocks added");

        // Set default content
        const defaultContent = `
          <div style="padding: 20px; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; margin-bottom: 20px;">Welcome to Email Designer</h1>
            <p style="color: #666; line-height: 1.6;">Drag blocks from the left panel to start building your email template.</p>
            <a href="#" style="display: inline-block; background: #007cba; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px;">Get Started</a>
          </div>
        `;

        console.log("📝 Setting default content...");
        ed.setComponents(defaultContent);
        console.log("✅ Content set");

        // Ensure editor is properly rendered
        ed.refresh();
        console.log("🔄 Editor refreshed");

        // Initialize panels and commands
        setTimeout(() => {
          try {
            // Open blocks panel
            const commands = ed.Commands;
            if (commands && commands.has('sw-visibility')) {
              commands.run('sw-visibility');
              console.log("✅ Blocks panel opened");
            }
            
            // Show layers panel
            if (commands && commands.has('show-layers')) {
              commands.run('show-layers');
              console.log("✅ Layers panel opened");
            }
            
            // Show styles panel  
            if (commands && commands.has('show-styles')) {
              commands.run('show-styles');
              console.log("✅ Styles panel opened");
            }
            
          } catch (e) {
            console.log("ℹ️ Panel initialization error:", e);
          }
        }, 200);

        // Final validation that editor is visible
        setTimeout(() => {
          const canvas = ed.Canvas?.getElement();
          console.log("🎨 Canvas element check:", {
            exists: !!canvas,
            visible: canvas ? canvas.offsetWidth > 0 && canvas.offsetHeight > 0 : false,
            dimensions: canvas ? { width: canvas.offsetWidth, height: canvas.offsetHeight } : null
          });
        }, 500);

        // Listen for changes
        ed.on("component:add component:remove component:update style:change", () => {
          console.log("📝 Content changed, marking unsaved");
          setHasUnsavedChanges(true);
        });

        console.log("✅ GrapesJS fully initialized and ready");
        editorRef.current = { ed };

      } catch (error) {
        console.error("❌ GrapesJS initialization failed:", error);
        console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace");
      }
    };

    // Use requestAnimationFrame to ensure portal DOM is fully attached
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(() => {
        initGrapesJS();
      });
    }, 50);

    // Cleanup function when modal closes
    return () => {
      clearTimeout(timeoutId);
      if (editorRef.current?.ed) {
        console.log("🧹 Cleaning up GrapesJS editor on unmount");
        try {
          editorRef.current.ed.destroy();
        } catch (e) {
          console.warn("⚠️ Error destroying editor on cleanup:", e);
        }
        editorRef.current = null;
      }
    };
  }, [isOpen, isClient, editorData]);

  const handleSave = useCallback(() => {
    console.log("💾 Save triggered");
    const bundle = editorRef.current as { ed: any } | null;
    if (!bundle?.ed) {
      console.warn("❌ No editor available for save");
      return;
    }

    const { ed } = bundle;
    console.log("📝 Getting content from editor...");

    const html = ed.getHtml?.() || "";
    const css = ed.getCss?.() || "";
    
    console.log("📄 Content retrieved:", { htmlLength: html.length, cssLength: css.length });

    // Combine HTML with CSS
    const compiledHtml = css 
      ? `${html}\n<style>${css}</style>` 
      : html;

    // Extract plain text, basically remove HTML tags and clean whitespace
    const text = compiledHtml
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const saveData = {
      design: { grapesHtml: html, grapesCss: css },
      html: compiledHtml,
      text
    };

    console.log("💾 Saving data:", saveData);
    onSave(saveData);
  }, [onSave]);

  if (!isOpen || !isClient) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[2147483647] bg-black/60"
      onClick={onClose}
    >
      <div 
        className="absolute inset-0 w-screen h-screen bg-white dark:bg-gray-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Email Designer {hasUnsavedChanges && <span className="text-orange-500 text-sm">(Unsaved Changes)</span>}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={handleSave} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
            <button onClick={onClose} className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">Close</button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-hidden relative">
          <div 
            ref={containerRef}
            id="grapesjs-editor-container"
            className="w-full h-full flex"
            style={{ 
              height: 'calc(100vh - 48px)', 
              width: '100%',
              minHeight: '400px',
              position: 'relative'
            }} 
          >
            {/* Left Panel for Blocks */}
            <div className="panel__left" style={{ width: '250px', borderRight: '1px solid #ddd' }}>
              <div className="panel__switcher" style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                {/* Panel switcher buttons will be added by GrapesJS */}
              </div>
              <div className="gjs-block-categories" style={{ height: 'calc(100% - 50px)', overflow: 'auto' }}>
                {/* Blocks will be added here by GrapesJS */}
              </div>
            </div>
            
            {/* Main Editor Area */}
            <div className="editor-main" style={{ flex: '1', position: 'relative' }}>
              {/* Canvas will be added here by GrapesJS */}
            </div>
            
            {/* Right Panel for Layers/Styles */}
            <div className="panel__right" style={{ width: '250px', borderLeft: '1px solid #ddd' }}>
              {/* Layers and styles panels will be added here by GrapesJS */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
