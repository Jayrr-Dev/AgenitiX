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
import { EmailTemplateCollapsed } from "./components/EmailTemplateCollapsed";
import { EmailTemplateExpanded } from "./components/EmailTemplateExpanded";
import { STARTER_TEMPLATES_GRAPES, type StarterTemplate } from "./data/starterTemplates";

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
    expandedSize: SafeSchemas.text("VE2"),
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
    EXPANDED_SIZES.VE2;
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
  expandedSize: "VE2",
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

    /** Handle opening template designer */
    const handleOpenDesigner = useCallback(() => {
      updateNodeData({ showEditorModal: true });
    }, [updateNodeData]);

    /** Handle template name change */
    const handleTemplateNameChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        updateNodeData({ templateName: e.target.value });
      },
      [updateNodeData]
    );

    /** Handle category change */
    const handleCategoryChange = useCallback(
      (category: string) => {
        updateNodeData({ category });
      },
      [updateNodeData]
    );

    /** Handle subject change */
    const handleSubjectChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        updateNodeData({ subject: e.target.value });
      },
      [updateNodeData]
    );

    /** Handle description change */
    const handleDescriptionChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        updateNodeData({ templateDescription: e.target.value });
      },
      [updateNodeData]
    );

    /** Handle toggle preview */
    const handleTogglePreview = useCallback(() => {
      updateNodeData({ showPreview: !showPreview });
    }, [showPreview, updateNodeData]);

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

    /**
     * Prepare MJML for the visual editor
     * [Explanation], basically strip head, resolve simple conditionals, and replace variables with placeholders
     */
    const createCleanMjmlForEditor = useCallback((mjmlContent: string, variableNames: string[]): string => {
      if (!mjmlContent || typeof mjmlContent !== "string") return "";

      let clean = mjmlContent;

      // 1) Remove <mj-head> to avoid duplicated styles, we will inject a normalized theme head
      // [Explanation], basically keep editor stable and consistent across templates
      clean = clean.replace(/<mj-head>[\s\S]*?<\/mj-head>/g, "");

      // 2) Resolve common conditional blocks to a default branch
      // [Explanation], basically choose verification branch as default for predictable layout
      clean = clean.replace(
        /\{\{#if\s+type\s*===\s*\"verification\"\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g,
        (_, verificationContent: string, elseContent: string) => verificationContent
      );

      // 3) Flatten any remaining simple #if blocks by keeping inner content
      // [Explanation], basically remove wrapper and keep content so layout stays intact
      clean = clean.replace(/\{\{#if[^}]+\}\}([\s\S]*?)\{\{\/if\}\}/g, "$1");

      // 4) Replace variables with readable placeholders so editor shows nice text
      // [Explanation], basically use [var] for visibility without leaking handlebars
      for (const varName of variableNames || []) {
        const re = new RegExp(`\\{\\{${varName}\\}\\}`, "g");
        clean = clean.replace(re, `[${varName}]`);
      }

      // 4.5) Remove any remaining handlebars control tags that are not variables
      // [Explanation], basically strip {{#...}}, {{/...}} and {{else}} that may linger
      clean = clean
        .replace(/\{\{\s*else\s*\}\}/g, "")
        .replace(/\{\{\s*#[^}]+\}\}/g, "")
        .replace(/\{\{\s*\/[^{]+\}\}/g, "");

      // 5) Inject a normalized theme head with default attributes (font, colors, spacing)
      const themeHead = `\n  <mj-head>\n    <mj-attributes>\n      <mj-all font-family=\"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif\" />\n      <mj-text font-size=\"14px\" color=\"#111827\" line-height=\"1.6\" />\n      <mj-section padding=\"0px\" />\n      <mj-column padding=\"0px\" />\n      <mj-button background-color=\"#111827\" color=\"#ffffff\" font-weight=\"600\" border-radius=\"6px\" inner-padding=\"12px 16px\" />\n      <mj-divider border-color=\"#e5e7eb\" border-width=\"1px\" />\n    </mj-attributes>\n  </mj-head>`;

      const hasRoot = /<mjml>[\s\S]*<\/mjml>/.test(clean);
      const hasBody = /<mj-body[\s\S]*<\/mj-body>/.test(clean);

      if (hasRoot && hasBody) {
        // Insert theme head right after <mjml>
        clean = clean.replace(/<mjml>/, `<mjml>\n${themeHead}\n`);
      } else {
        // Wrap arbitrary content into a valid MJML with theme
        clean = `\n<mjml>\n${themeHead}\n  <mj-body background-color=\"#ffffff\">\n    <mj-section background-color=\"#ffffff\">\n      <mj-column>\n        <mj-raw>\n${clean}\n        </mj-raw>\n      </mj-column>\n    </mj-section>\n  </mj-body>\n</mjml>`;
      }

      return clean;
    }, []);

    /** Load template data into current node */
    const handleLoadTemplate = useCallback((template: {
      name: string;
      subject: string;
      htmlContent: string;
      textContent: string;
      variables: string[];
      category: string;
    }) => {
      // Transform variables from string array to variable objects
      const variableObjects = template.variables.map(varName => ({
        name: varName,
        type: "text" as const,
        required: false,
        defaultValue: "",
        description: "",
      }));

      // Create a cleaned MJML for the editor view
      // [Explanation], basically feed GrapesJS body-only MJML without handlebars noise
      const cleanMjmlForEditor = createCleanMjmlForEditor(template.htmlContent, template.variables);

      // Create editor data structure for GrapesJS compatibility
      // [Explanation], basically structure the HTML content for the editor and output system
      const editorDataStructure = {
        grapesHtml: cleanMjmlForEditor,
        grapesCss: "", // Default empty CSS, can be enhanced later
        templateData: {
          name: template.name,
          subject: template.subject,
          category: template.category,
          variables: template.variables,
        },
        loadedFrom: "starter-template",
        loadedAt: Date.now(),
      };

      // Create template output for handle system
      const templateOutputData = {
        name: template.name,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
        variables: variableObjects,
        category: template.category,
        compiledAt: Date.now(),
        source: "starter-template",
      };

      // Provide sensible preview defaults so compiled view looks nice immediately
      const defaultPreviewData = (template.variables || []).reduce((acc, key) => {
        const FALLBACKS: Record<string, string> = {
          name: "John Doe",
          magicLinkUrl: "https://example.com/verify?token=abc123",
          type: "verification",
          requestFromIp: "192.168.1.1",
          requestFromLocation: "San Francisco, CA",
          loginCode: "A1B2C3",
          validationCode: "123456",
          serviceName: "Your Platform",
          dashboardUrl: "https://example.com/dashboard",
          docsUrl: "https://example.com/docs",
          supportUrl: "https://example.com/support",
          username: "johndoe",
          invitedByUsername: "Jane Smith",
          invitedByEmail: "jane@example.com",
          teamName: "Automation Team",
          inviteLink: "https://example.com/invite?token=xyz789",
          inviteFromIp: "192.168.1.1",
          inviteFromLocation: "New York, NY",
        };
        acc[key] = FALLBACKS[key] ?? `[${key}]`;
        return acc;
      }, {} as Record<string, string>);

      updateNodeData({
        templateName: template.name,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
        variables: variableObjects,
        category: template.category,
        editorData: editorDataStructure,
        previewData: defaultPreviewData,
        templateOutput: templateOutputData,
        isActive: true,
        lastSaved: Date.now(),
        // Trigger output generation by updating template-output field
        ["template-output"]: templateOutputData,
      });

      toast.success(`Template "${template.name}" loaded successfully`);
    }, [updateNodeData]);

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
          <EmailTemplateExpanded
            nodeId={id}
            nodeData={nodeData as EmailTemplateData}
            isEnabled={isEnabled as boolean}
            canSave={Boolean(isEnabled && templateName?.trim() && !isSaving)}
            onTemplateNameChange={handleTemplateNameChange}
            onCategoryChange={handleCategoryChange}
            onSubjectChange={handleSubjectChange}
            onDescriptionChange={handleDescriptionChange}

            onOpenDesigner={handleOpenDesigner}
            onSaveTemplate={handleSaveTemplate}
            onLoadTemplate={handleLoadTemplate}
          />
        ) : (
          <EmailTemplateCollapsed
            nodeData={nodeData as EmailTemplateData}
            categoryStyles={categoryStyles}
            onToggleExpand={toggleExpand}
            onOpenDesigner={handleOpenDesigner}
          />
        )}

        <ExpandCollapseButton showUI={isExpanded} onToggle={toggleExpand} />

        {/* Email Editor Modal */}
        {showEditorModal && (
          <EmailEditorModal
            isOpen={showEditorModal}
            onClose={() => updateNodeData({ showEditorModal: false })}
            editorData={{
              ...(editorData as Record<string, unknown>),
              nodeData: { htmlContent, textContent, subject, templateName } // Pass additional node data
            }}
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
  const [isEntering, setIsEntering] = useState(false);
  const [isLoaderOpen, setIsLoaderOpen] = useState(false);
  const [templateQuery, setTemplateQuery] = useState("");
  const [templateCategory, setTemplateCategory] = useState<string>("all");
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const destroyTimerRef = useRef<number | null>(null);
  const modalRootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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
    if (!isOpen || !isClient) {
      return;
    }

    // Clean up any existing editor before creating new one
    if (editorRef.current?.ed) {
      try {
        (document.activeElement as HTMLElement | null)?.blur?.();
      } catch {}
      try {
        editorRef.current.ed.destroy();
      } catch (e) {
        // Editor cleanup error
      }
      editorRef.current = null;
    }

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
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        if (attempts >= maxAttempts) {
          return;
        }
        
        const { default: grapesjs } = await import("grapesjs");

    // Final validation
    if (!containerRef.current || !containerRef.current.isConnected) {
      return;
    }

    // Load MJML plugin per docs
    const { default: grapesjsMjml } = await import("grapesjs-mjml");
        // Compute offset so Pickr appended to modal root aligns to the input
        const editorRect = (containerRef.current as HTMLElement).getBoundingClientRect();
        const pickerOffset = {
          top: Math.round(26 - editorRect.top),
          left: Math.round(-editorRect.left),
        };

    const ed = grapesjs.init({
      container: '#gjs-email-editor',
      height: "100%",
      width: "100%",
      storageManager: false,
      fromElement: false,
      // [Explanation], basically keep defaults per docs and let preset manage panels
      plugins: [grapesjsMjml],
      pluginsOpts: {
        [grapesjsMjml as unknown as string]: {}
      },
      // [Explanation], basically no colorPicker overrides to avoid panel interference
    });



        // Load existing content if available, otherwise use default MJML
        let contentToLoad = `
          <mjml>
            <mj-body background-color="#f6f6f6">
              <mj-section background-color="#ffffff">
                <mj-column>
                  <mj-text align="center" font-size="22px" font-weight="700">Welcome to Email Designer</mj-text>
                  <mj-text align="center" color="#666">Drag blocks from the left panel to start building your email template.</mj-text>
                  <mj-button background-color="#007cba" color="#ffffff" href="#">Get Started</mj-button>
                </mj-column>
              </mj-section>
            </mj-body>
          </mjml>
        `;

        // Check if we have existing content from loaded template or previous edits
        if (editorData && typeof editorData === 'object') {
          const data = editorData as any;
          // If we have grapesHtml from a loaded starter template
          if (data.grapesHtml && typeof data.grapesHtml === 'string') {
            contentToLoad = data.grapesHtml;
          }
          // If we have existing MJML content in the editor data
          else if (data.mjml && typeof data.mjml === 'string') {
            contentToLoad = data.mjml;
          }
        }
        // Fallback to editorData.nodeData htmlContent if it looks like MJML
        else if (editorData && (editorData as any).nodeData && (editorData as any).nodeData.htmlContent && typeof (editorData as any).nodeData.htmlContent === 'string' && (editorData as any).nodeData.htmlContent.includes('<mjml>')) {
          contentToLoad = (editorData as any).nodeData.htmlContent;
        }

        ed.setComponents(contentToLoad);
        // Ensure editor is properly rendered
        ed.refresh();
        try {
          const wrapper = ed.getWrapper?.();
          if (wrapper && ed.select) ed.select(wrapper);
        } catch {}
        // [Explanation], basically move the views panel (blocks/layers/styles) into the top toolbar
        try {
          const viewsPanel = ed.Panels?.getPanel?.('views');
          // const topOptionsEl = ed.getContainer()?.querySelector('.gjs-pn-panel.gjs-pn-options');
          // if (viewsPanel && topOptionsEl) {
          //   viewsPanel.set('appendTo', topOptionsEl as HTMLElement);
          // }
        } catch {}
        // [Explanation], basically defer blocks panel open until the UI mounts
        setTimeout(() => { try { ed.runCommand('open-blocks'); } catch {} }, 200);


        // Final validation that editor is visible
        setTimeout(() => {
          const canvas = ed.Canvas?.getElement();
          // Canvas validation check
        }, 500);

        // Listen for changes
        ed.on("component:add component:remove component:update style:change", () => {
          setHasUnsavedChanges(true);
        });
        editorRef.current = { ed };

      } catch (error) {
        // GrapesJS initialization failed
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
      if (destroyTimerRef.current) {
        window.clearTimeout(destroyTimerRef.current);
        destroyTimerRef.current = null;
      }
      if (editorRef.current?.ed) {
        try { (document.activeElement as HTMLElement | null)?.blur?.(); } catch {}
        const ed = editorRef.current.ed;
        destroyTimerRef.current = window.setTimeout(() => {
          try { ed.destroy(); } catch (e) { /* Editor cleanup error */ }
          editorRef.current = null;
          destroyTimerRef.current = null;
        }, 120);
      }
      // No runtime style cleanup required
    };
  }, [isOpen, isClient, editorData]);

  // [Explanation], basically open/close the loader panel
  const handleOpenLoader = useCallback(() => setIsLoaderOpen(true), []);
  const handleCloseLoader = useCallback(() => {
    setIsLoaderOpen(false);
    setTemplateQuery("");
    setTemplateCategory("all");
  }, []);

  const handleUseTemplate = useCallback((tpl: StarterTemplate) => {
    const bundle = editorRef.current as { ed: any } | null;
    if (!bundle?.ed) return;
    const { ed } = bundle;
    ed.setComponents(tpl.mjml || "");
    ed.refresh?.();
    try {
      const wrapper = ed.getWrapper?.();
      if (wrapper && ed.select) ed.select(wrapper);
    } catch {}
    setHasUnsavedChanges(true);
    setIsLoaderOpen(false);
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const t of STARTER_TEMPLATES_GRAPES) set.add(t.category);
    return ["all", ...Array.from(set)];
  }, []);

  const filteredTemplates = useMemo(() => {
    const q = templateQuery.trim().toLowerCase();
    return STARTER_TEMPLATES_GRAPES.filter((t) => {
      const inCat = templateCategory === "all" || t.category === templateCategory;
      if (!q) return inCat;
      const hay = `${t.name} ${t.subject} ${t.description} ${t.tags?.join(" ")}`.toLowerCase();
      return inCat && hay.includes(q);
    });
  }, [templateQuery, templateCategory]);

  const handleSave = useCallback(() => {
    const bundle = editorRef.current as { ed: any } | null;
    if (!bundle?.ed) {
      return;
    }

    const { ed } = bundle;

    const html = ed.getHtml?.() || "";
    const css = ed.getCss?.() || "";

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

    onSave(saveData);
  }, [onSave]);

  // Trigger enter animation (keep hook order stable regardless of open state)
  useEffect(() => {
    if (!isClient) return;
    setIsEntering(false);
    if (!isOpen) return;
    const t = setTimeout(() => setIsEntering(true), 10);
    return () => clearTimeout(t);
  }, [isOpen, isClient]);

  if (!isOpen || !isClient) return null;

    const modalContent = (
      <div
      className="fixed inset-0 z-[2147483647] bg-black/60 flex items-center justify-center p-6"
      onClick={onClose}
        ref={modalRootRef}
    >
        <div
        className={`relative flex h-[min(90vh,850px)] w-[min(98vw,1600px)] flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl transform-gpu transition-all duration-200 ease-out ${isEntering ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-1 scale-95'}`}
          onClick={(e) => e.stopPropagation()}
          ref={panelRef}
      >
        {/* Header */}
        <div className="flex h-12 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Email Designer {hasUnsavedChanges && <span className="text-orange-500 text-sm">(Unsaved Changes)</span>}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={handleOpenLoader} className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700">Load</button>
            <button onClick={handleSave} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
            <button onClick={onClose} className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">Close</button>
          </div>  
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-hidden relative m-2">
          <div
            ref={containerRef}
            id="gjs-email-editor"
            style={{
              height: 'calc(100% - 0px)',
              width: '100%',
              minHeight: '400px',
              position: 'relative',
              display: 'block',
              overflow: 'hidden'
            }}
          />

          {isLoaderOpen && (
            <div className="absolute inset-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Starter Templates</span>
                  <input
                    value={templateQuery}
                    onChange={(e) => setTemplateQuery(e.target.value)}
                    placeholder="Search templates..."
                    className="h-9 w-64 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <select
                    value={templateCategory}
                    onChange={(e) => setTemplateCategory(e.target.value)}
                    className="h-9 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleCloseLoader} className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">Close</button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-auto">
                {filteredTemplates.map((tpl) => (
                  <div key={tpl.id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 flex flex-col">
                    <div className="mb-2">
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{tpl.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{tpl.category}</div>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 mb-3">{tpl.description}</div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {tpl.tags?.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">{tag}</span>
                        ))}
                      </div>
                      <button onClick={() => handleUseTemplate(tpl)} className="px-2 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700">Use</button>
                    </div>
                  </div>
                ))}
                {filteredTemplates.length === 0 && (
                  <div className="col-span-full text-center text-sm text-gray-500 dark:text-gray-400 py-8">No templates found.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
