/**
 * emailTemplate NODE – Template management system
 *
 * • Create, edit, and manage email templates with dynamic variables
 * • Template categorization and organization system
 * • Variable substitution with preview functionality
 * • Import/export templates for sharing and backup
 * • Integration with emailCreator, emailReplier, and other email nodes
 *
 * Keywords: email-templates, variables, preview, management, organization
 */

import type { NodeProps } from "@xyflow/react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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

import { useAuthContext } from "@/components/auth/AuthProvider";
import { api } from "@/convex/_generated/api";
// Convex integration
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

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

    // Output Data
    templateOutput: z.string().default(""),
    outputs: z.string().default(""), // Structured output for viewText nodes
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
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Boolean" },
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

  return {
    kind: "emailTemplate",
    displayName: "Email Template",
    label: "Email Template",
    category: CATEGORIES.EMAIL,
    size: { expanded, collapsed },
    handles: [
      {
        id: "data-input",
        code: "d",
        position: "top",
        type: "target",
        dataType: "JSON",
      },
      {
        id: "template-output",
        code: "t",
        position: "right",
        type: "source",
        dataType: "JSON",
      },
      {
        id: "compiled-output",
        code: "c",
        position: "bottom",
        type: "source",
        dataType: "JSON",
      },
      {
        id: "outputs",
        code: "o",
        position: "right",
        type: "source",
        dataType: "String",
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
  ({ id, spec }: NodeProps & { spec: NodeSpec }) => {
    // -------------------------------------------------------------------------
    const { nodeData, updateNodeData } = useNodeData(id, {});
    const { authToken: token } = useAuthContext();

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

    // -------------------------------------------------------------------------
    // 4.3  Convex integration
    // -------------------------------------------------------------------------
    const emailTemplates = useQuery(api.emailAccounts.getEmailReplyTemplates, {
      token_hash: token || undefined,
    });

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
      let compiledSubject = subject;
      let compiledHtml = htmlContent;
      let compiledText = textContent;

      // Replace variables with preview data
      variables.forEach((variable) => {
        const value =
          previewData[variable.name] ||
          variable.defaultValue ||
          `{{${variable.name}}}`;
        const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, "g");

        compiledSubject = compiledSubject.replace(regex, value);
        compiledHtml = compiledHtml.replace(regex, value);
        compiledText = compiledText.replace(regex, value);
      });

      return {
        subject: compiledSubject,
        html: compiledHtml,
        text: compiledText,
        variables: previewData,
      };
    }, [subject, htmlContent, textContent, variables, previewData]);

    /** Save template */
    const handleSaveTemplate = useCallback(async () => {
      console.log("🔐 Auth Debug:", { token: token ? "present" : "missing", tokenLength: token?.length });
      
      if (!token) {
        toast.error("Authentication required - please login first");
        return;
      }

      if (!templateName.trim()) {
        toast.error("Template name is required");
        return;
      }

      try {
        updateNodeData({ isSaving: true, lastError: "" });

        const templateData = {
          name: templateName,
          category: category,
          subject_template: subject,
          content_template: htmlContent || textContent,
          variables: variables.map((v) => v.name),
          description: templateDescription,
        };

        const result = await saveTemplateMutation({
          token_hash: token || undefined,
          name: templateName,
          subject: subject,
          body: htmlContent || textContent,
          category: category,
          description: templateDescription,
          variables: variables.map((v) => v.name),
        });

        if (result.success) {
          // Create structured output
          const formattedOutput = {
            "📄 Template Saved": {
              "Template Name": templateName,
              "Category": category,
              "Subject": subject,
              "Variables": variables.length > 0 ? variables.map(v => v.name).join(", ") : "None",
              "Content Type": htmlContent ? "HTML + Text" : "Text Only",
              "Content Length": `${(htmlContent || textContent).length} characters`,
              "Template ID": result.templateId,
              "✅ Status": result.isUpdate ? "Updated" : "Created",
              "⏰ Saved At": new Date().toLocaleString(),
            }
          };

          updateNodeData({
            isSaving: false,
            templateId: result.templateId,
            lastSaved: Date.now(),
            isActive: true,
            outputs: JSON.stringify(formattedOutput, null, 2),
          });
          toast.success(`Template ${result.isUpdate ? 'updated' : 'created'} successfully`);
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
      token,
      templateName,
      category,
      subject,
      htmlContent,
      textContent,
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
      if (isEnabled && templateName) {
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
      variables,
      previewData,
      templateId,
      compileTemplate,
      updateNodeData,
    ]);

    /** Update structured output for viewText nodes */
    useEffect(() => {
      if (templateName && isEnabled) {
        const formattedOutput = {
          "📄 Email Template": {
            "Template Name": templateName,
            "Category": category || "general",
            "Subject": subject || "(No subject)",
            "Variables": variables.length > 0 ? variables.map(v => v.name).join(", ") : "None",
            "Content Type": htmlContent ? "HTML + Text" : textContent ? "Text Only" : "Empty",
            "Content Length": `${(htmlContent || textContent || "").length} characters`,
            "Status": isActive ? "✅ Active" : "⏸️ Inactive",
            "Last Updated": lastSaved ? new Date(lastSaved).toLocaleString() : "Not saved",
          }
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
      variables,
      htmlContent,
      textContent,
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
                value={templateName}
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
                value={category}
                onChange={(e) => updateNodeData({ category: e.target.value })}
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
                value={subject}
                onChange={(e) => updateNodeData({ subject: e.target.value })}
                placeholder="Email subject with {{variables}}"
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                disabled={!isEnabled}
              />
            </div>
          </div>

          {/* Content Areas */}
          <div className="space-y-2">
            <div>
              <label
                htmlFor={`template-html-${id}`}
                className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                HTML Content
              </label>
              <textarea
                id={`template-html-${id}`}
                value={htmlContent}
                onChange={(e) =>
                  updateNodeData({ htmlContent: e.target.value })
                }
                placeholder="HTML email content with {{variables}}"
                className="w-full h-20 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                disabled={!isEnabled}
              />
            </div>
            <div>
              <label
                htmlFor={`template-text-${id}`}
                className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Text Content
              </label>
              <textarea
                id={`template-text-${id}`}
                value={textContent}
                onChange={(e) =>
                  updateNodeData({ textContent: e.target.value })
                }
                placeholder="Plain text fallback"
                className="w-full h-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                disabled={!isEnabled}
              />
            </div>
          </div>

          {/* Preview */}
          {showPreview && templateName && (
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
          <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSaveTemplate}
              className="flex-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              disabled={!isEnabled || isSaving || !templateName.trim()}
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
                {templateName || "Untitled"}
              </div>
              {isActive && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
          </div>
        )}

        <ExpandCollapseButton showUI={isExpanded} onToggle={toggleExpand} />
      </>
    );
  }
);

EmailTemplateNode.displayName = "EmailTemplateNode";

// -----------------------------------------------------------------------------
// 5️⃣  Dynamic spec wrapper component
// -----------------------------------------------------------------------------

const EmailTemplateNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, {});

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
