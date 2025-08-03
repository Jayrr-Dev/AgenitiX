/**
 * emailCreator NODE – Email composition and formatting
 *
 * • Comprehensive email composition with rich text editing
 * • Template integration with dynamic variable support
 * • Attachment management with security validation
 * • Multi-format preview and validation system
 * • Integration with emailAccount and emailSender nodes
 *
 * Keywords: email-composition, rich-text, templates, attachments, validation
 */

"use client";

import {
  type ChangeEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { z } from "zod";

// UI Components
import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
import { Textarea } from "@/components/ui/textarea";

// Node Infrastructure
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
import { 
  SafeSchemas,
  createSafeInitialData 
} from "@/features/business-logic-modern/infrastructure/node-core/schema-helpers";
import {
  createNodeValidator,
  reportValidationError,
  useNodeDataValidation,
} from "@/features/business-logic-modern/infrastructure/node-core/validation";
import { withNodeScaffold } from "@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold";
import type { NodeProps } from "@xyflow/react";

// Theming and Sizing
import {
  COLLAPSED_SIZES,
  EXPANDED_SIZES,
} from "@/features/business-logic-modern/infrastructure/theming/sizing";
import { CATEGORIES } from "@/features/business-logic-modern/infrastructure/theming/categories";
import { useNodeData } from "@/hooks/useNodeData";
import { useStore } from "@xyflow/react";

// Email Components
import { RichTextEditor } from "./components/RichTextEditor";

// Types and Utilities
import type { EmailValidationResult } from "./types";

// Convex
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";

// -----------------------------------------------------------------------------
// 🎨  Styling Constants
// -----------------------------------------------------------------------------

const CATEGORY_TEXT = {
  EMAIL: {
    primary: "text-[--node-email-text]",
  },
} as const;

const CONTENT = {
  expanded: "p-4 w-full h-full flex flex-col",
  collapsed: "flex items-center justify-center w-full h-full",
  disabled: "opacity-50 pointer-events-none",
  header: "flex items-center justify-between mb-3",
  body: "flex-1 overflow-hidden",
} as const;

// -----------------------------------------------------------------------------
// 1️⃣  Data Schema & Validation
// -----------------------------------------------------------------------------

export const EmailCreatorDataSchema = z
  .object({
    // Basic Email Fields
    recipients: z
      .object({
        to: z.array(z.string()).default([]),
        cc: z.array(z.string()).default([]),
        bcc: z.array(z.string()).default([]),
      })
      .default({ to: [], cc: [], bcc: [] }),

    subject: z.string().default(""),

    // Content
    content: z
      .object({
        text: z.string().default(""),
        html: z.string().default(""),
        mode: z.enum(["text", "html", "rich"]).default("rich"),
      })
      .default({
        text: "",
        html: "",
        mode: "rich",
      }),

    // Template Integration
    template: z
      .object({
        id: z.string().optional(),
        name: z.string().optional(),
        variables: z.record(z.string()).default({}),
        useTemplate: z.boolean().default(false),
      })
      .default({
        variables: {},
        useTemplate: false,
      }),

    // Attachments
    attachments: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          size: z.number(),
          type: z.string(),
          content: z.string().optional(), // base64 for small files
          url: z.string().optional(), // for large files
        })
      )
      .default([]),

    // Formatting Options
    formatting: z
      .object({
        font: z.string().default("Arial"),
        fontSize: z.number().default(14),
        textColor: z.string().default("#000000"),
        backgroundColor: z.string().default("#ffffff"),
        alignment: z
          .enum(["left", "center", "right", "justify"])
          .default("left"),
      })
      .default({
        font: "Arial",
        fontSize: 14,
        textColor: "#000000",
        backgroundColor: "#ffffff",
        alignment: "left",
      }),

    // Validation & Preview
    validation: z
      .object({
        isValid: z.boolean().default(false),
        errors: z.array(z.string()).default([]),
        warnings: z.array(z.string()).default([]),
      })
      .default({
        isValid: false,
        errors: [],
        warnings: [],
      }),

    // Node Configuration
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    expandedSize: SafeSchemas.text("VE3"),
    collapsedSize: SafeSchemas.text("C2"),
    label: z.string().optional(),

    // output
    emailOutput: z.any().optional(),
    validationOutput: z.boolean().optional(),
    errorOutput: z.string().default(""),
    outputs: z.string().default(""), // Structured output for viewText nodes
  })
  .passthrough();

export type EmailCreatorData = z.infer<typeof EmailCreatorDataSchema>;

const validateNodeData = createNodeValidator(
  EmailCreatorDataSchema,
  "EmailCreator"
);

// -----------------------------------------------------------------------------
// 2️⃣  Dynamic Spec Generation
// -----------------------------------------------------------------------------

function createDynamicSpec(data: EmailCreatorData): NodeSpec {
  const _expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.VE3;
  const _collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C2;

  return {
    kind: "emailCreator",
    displayName: "Email Creator",
    label: "Email Creator",
    category: CATEGORIES.EMAIL,
    size: {
      expanded: _expanded,
      collapsed: _collapsed,
    },
    handles: [
      {
        id: "accountInput",
        type: "target",
        dataType: "JSON",
        code: "j",
        position: "left",
      },
      {
        id: "templateInput",
        type: "target",
        dataType: "JSON",
        code: "j",
        position: "left",
      },
      {
        id: "variableInput",
        type: "target",
        dataType: "any",
        code: "x",
        position: "left",
      },
      {
        id: "emailOutput",
        type: "source",
        dataType: "JSON",
        code: "m",
        position: "right",
      },
      {
        id: "validationOutput",
        type: "source",
        dataType: "Boolean",
        code: "b",
        position: "right",
      },
      {
        id: "outputs",
        type: "source",
        dataType: "String",
        code: "o",
        position: "right",
      },
    ],
    inspector: { key: "EmailCreatorInspector" },
    version: 1,
    runtime: { execute: "emailCreator_execute_v1" },
    initialData: createSafeInitialData(EmailCreatorDataSchema, {
      recipients: { to: [], cc: [], bcc: [] },
      subject: "",
      content: {
        text: "",
        html: "",
        mode: "rich",
      },
      template: {
        variables: {},
        useTemplate: false,
      },
      attachments: [],
      formatting: {
        font: "Arial",
        fontSize: 14,
        textColor: "#000000",
        backgroundColor: "#ffffff",
        alignment: "left",
      },
      validation: {
        isValid: false,
        errors: [],
        warnings: [],
      },
      isEnabled: true,
      isActive: false,
      isExpanded: false,
      expandedSize: "VE3",
      collapsedSize: "C2",
      errorOutput: "",
    }),
    dataSchema: EmailCreatorDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "emailOutput",
        "validationOutput",
        "errorOutput",
        "isActive",
        "expandedSize",
        "collapsedSize",
        "validation",
        "attachments",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        { key: "isExpanded", type: "boolean", label: "Expand" },
        {
          key: "subject",
          type: "text",
          label: "Subject",
          placeholder: "Email subject...",
        },
        {
          key: "recipients.to",
          type: "textarea",
          label: "To (comma-separated)",
          placeholder: "recipient@example.com, another@example.com",
        },
        {
          key: "content.text",
          type: "textarea",
          label: "Message Content",
          placeholder: "Enter your email message...",
        },
      ],
    },
    icon: "LuMail",
    author: "Agenitix Team",
    description: "Create and compose emails with rich text editing and template support",
    feature: "email",
    tags: ["email", "composition", "rich-text", "templates"],
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE3",
  collapsedSize: "C2",
} as EmailCreatorData);

// -----------------------------------------------------------------------------
// 3️⃣  Utility Functions
// -----------------------------------------------------------------------------

/** Validate email addresses */
const validateEmailAddress = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim()) && email.length <= 254;
};

/** Parse comma-separated email addresses */
const parseEmailAddresses = (
  emailString: string
): { valid: string[]; invalid: string[] } => {
  const emails = emailString
    .split(/[,;\n]/)
    .map((email) => email.trim())
    .filter((email) => email.length > 0);

  const valid: string[] = [];
  const invalid: string[] = [];

  for (const email of emails) {
    if (validateEmailAddress(email)) {
      valid.push(email);
    } else {
      invalid.push(email);
    }
  }

  return { valid, invalid };
};

/** Validate email content */
const validateEmailContent = (
  data: EmailCreatorData
): EmailValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate recipients
  if (data.recipients.to.length === 0) {
    errors.push("At least one recipient is required");
  }

  // Validate subject
  if (!data.subject.trim()) {
    errors.push("Subject is required");
  } else if (data.subject.length > 200) {
    warnings.push("Subject is very long and may be truncated");
  }

  // Validate content
  if (!(data.content.text.trim() || data.content.html.trim())) {
    errors.push("Message content is required");
  }

  // Validate attachments
  const totalAttachmentSize = data.attachments.reduce(
    (sum, att) => sum + att.size,
    0
  );
  if (totalAttachmentSize > 25 * 1024 * 1024) {
    // 25MB
    errors.push("Total attachment size exceeds 25MB limit");
  }

  if (data.attachments.length > 10) {
    warnings.push("Large number of attachments may cause delivery issues");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

// -----------------------------------------------------------------------------
// 4️⃣  React Component – Data Propagation & Rendering
// -----------------------------------------------------------------------------

const EmailCreatorNode = memo(
  ({ id, spec }: NodeProps & { spec: NodeSpec }) => {
    // -------------------------------------------------------------------------
    // 4.1  Sync with React‑Flow store
    // -------------------------------------------------------------------------
    const { nodeData, updateNodeData } = useNodeData(id, {});

    const {
      recipients,
      subject,
      content,
      template,
      attachments,
      validation,
      isEnabled = true,
      isActive = false,
      isExpanded = false,
    } = nodeData as EmailCreatorData;

    // Global React‑Flow store (nodes & edges) – triggers re‑render on change
    const _nodes = useStore((s) => s.nodes);
    const _edges = useStore((s) => s.edges);

    // Authentication and template loading
    const { token } = useAuth();
    const availableTemplates = useQuery(
      api.emailAccounts.getEmailReplyTemplates,
      token ? { token_hash: token } : "skip"
    );

    // -------------------------------------------------------------------------
    // 4.2  Template Connection Detection
    // -------------------------------------------------------------------------
    
    // Detect connected EmailTemplate nodes
    const connectedTemplateData = useMemo(() => {
      const templateEdges = _edges.filter(
        (e) => e.target === id && e.targetHandle === "templateInput"
      );
      
      if (templateEdges.length === 0) return null;
      
      const templateNode = _nodes.find((n) => n.id === templateEdges[0].source);
      if (!templateNode || templateNode.type !== 'emailTemplate') return null;
      
      const templateNodeData = templateNode.data;
      if (!templateNodeData?.templateName || !templateNodeData?.isActive) return null;
      
      return {
        name: String(templateNodeData.templateName || ""),
        subject: String(templateNodeData.subject || ""),
        htmlContent: String(templateNodeData.htmlContent || ""),
        textContent: String(templateNodeData.textContent || ""),
        variables: Array.isArray(templateNodeData.variables) ? templateNodeData.variables : [],
        category: String(templateNodeData.category || "general")
      };
    }, [_nodes, _edges, id]);

    // -------------------------------------------------------------------------
    // 4.3  State Management
    // -------------------------------------------------------------------------
    const [_previewMode, _setPreviewMode] = useState<
      "desktop" | "mobile" | "text"
    >("desktop");

    // -------------------------------------------------------------------------
    // 4.4  Auto-load Template from Connection
    // -------------------------------------------------------------------------
    
    // Auto-load template when connected to EmailTemplate node
    useEffect(() => {
      if (connectedTemplateData) {
        console.log('📄 Loading template from connection:', connectedTemplateData.name);
        
        // Extract variables from template content
        const extractVariables = (text: string) => {
          const variableRegex = /\{\{(\w+)\}\}/g;
          const variables: string[] = [];
          let match;
          while ((match = variableRegex.exec(text)) !== null) {
            if (!variables.includes(match[1])) {
              variables.push(match[1]);
            }
          }
          return variables;
        };
        
        const subjectVars = extractVariables(connectedTemplateData.subject || "");
        const contentVars = extractVariables((connectedTemplateData.htmlContent || "") + (connectedTemplateData.textContent || ""));
        const allVariables = [...new Set([...subjectVars, ...contentVars])];
        
        // Create variables object with empty values
        const variablesObj: Record<string, string> = {};
        const existingVariables = template.variables as Record<string, string> || {};
        allVariables.forEach(varName => {
          variablesObj[varName] = existingVariables[varName] || ""; // Keep existing values
        });
        
        updateNodeData({
          subject: connectedTemplateData.subject,
          content: {
            ...content,
            html: connectedTemplateData.htmlContent,
            text: connectedTemplateData.textContent,
            mode: connectedTemplateData.htmlContent ? "html" : "text"
          },
          template: {
            ...template,
            id: `template_${Date.now()}`,
            name: connectedTemplateData.name,
            variables: variablesObj,
            useTemplate: true
          }
        });
      }
    }, [connectedTemplateData, updateNodeData]);

    // Process template variables and update content
    useEffect(() => {
      if (template.useTemplate && connectedTemplateData && Object.keys(template.variables).length > 0) {
        // Replace variables in subject and content
        const processTemplate = (text: string, variables: Record<string, string>) => {
          let processed = text;
          Object.entries(variables).forEach(([varName, varValue]) => {
            const regex = new RegExp(`\\{\\{${varName}\\}\\}`, 'g');
            processed = processed.replace(regex, varValue || `{{${varName}}}`);
          });
          return processed;
        };

        const processedSubject = processTemplate(connectedTemplateData.subject, template.variables);
        const processedHtmlContent = processTemplate(connectedTemplateData.htmlContent, template.variables);
        const processedTextContent = processTemplate(connectedTemplateData.textContent, template.variables);

        // Update subject and content with processed template
        updateNodeData({
          subject: processedSubject,
          content: {
            ...content,
            html: processedHtmlContent,
            text: processedTextContent,
          },
        });
      }
    }, [template.variables, connectedTemplateData, template.useTemplate, updateNodeData]);

    // -------------------------------------------------------------------------
    // 4.5  Validation and Processing
    // -------------------------------------------------------------------------
    const validationResult = useMemo(() => {
      return validateEmailContent(nodeData as EmailCreatorData);
    }, [recipients, subject, content, attachments]);

    // Update validation in node data when it changes
    useEffect(() => {
      if (
        validationResult.isValid !== validation.isValid ||
        JSON.stringify(validationResult.errors) !==
          JSON.stringify(validation.errors) ||
        JSON.stringify(validationResult.warnings) !==
          JSON.stringify(validation.warnings)
      ) {
        updateNodeData({
          validation: validationResult,
          validationOutput: validationResult.isValid,
          errorOutput: validationResult.errors.join(", "),
        });
      }
    }, [validationResult, validation, updateNodeData]);

    // Update structured output for viewText nodes
    useEffect(() => {
      const totalRecipients = recipients.to.length + recipients.cc.length + recipients.bcc.length;
      const contentLength = (content.html || content.text || "").length;
      
      if (subject || totalRecipients > 0 || contentLength > 0) {
        const simpleOutput = `📧 Email: ${subject || "(No subject)"} | To: ${totalRecipients} recipients | ${validationResult.isValid ? "✅ Valid" : "❌ Invalid"}`;
        
        updateNodeData({
          outputs: simpleOutput,
        });
      } else {
        updateNodeData({
          outputs: "",
        });
      }
    }, [subject, recipients, content, template, attachments, validationResult, updateNodeData]);

    // -------------------------------------------------------------------------
    // 4.4  Event Handlers
    // -------------------------------------------------------------------------

    /** Handle recipients change */
    const handleRecipientsChange = useCallback(
      (field: "to" | "cc" | "bcc") => (e: ChangeEvent<HTMLTextAreaElement>) => {
        const recipientString = e.target.value;
        
        // Always update the raw value immediately for responsive UI
        updateNodeData({
          recipients: {
            ...recipients,
            [field]: recipientString.split(/[,;\n]/).map(email => email.trim()).filter(email => email.length > 0),
          },
        });
      },
      [recipients, updateNodeData]
    );

    /** Handle recipients validation on blur */
    const handleRecipientsBlur = useCallback(
      (field: "to" | "cc" | "bcc") => (e: ChangeEvent<HTMLTextAreaElement>) => {
        const recipientString = e.target.value;
        const { valid, invalid } = parseEmailAddresses(recipientString);

        // Update with validated emails
        updateNodeData({
          recipients: {
            ...recipients,
            [field]: valid,
          },
        });

        // Show validation feedback only on blur and if there are invalid emails
        if (invalid.length > 0 && recipientString.trim().length > 0) {
          toast.warning(`Invalid email addresses: ${invalid.join(", ")}`);
        }
      },
      [recipients, updateNodeData]
    );

    /** Handle subject change */
    const handleSubjectChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        updateNodeData({ subject: e.target.value });
      },
      [updateNodeData]
    );

    /** Handle template toggle */
    const handleTemplateToggle = useCallback(
      (useTemplate: boolean) => {
        updateNodeData({
          template: {
            ...template,
            useTemplate,
          },
        });
      },
      [template, updateNodeData]
    );

    /** Handle template variable change */
    const handleVariableChange = useCallback(
      (varName: string, value: string) => {
        updateNodeData({
          template: {
            ...template,
            variables: {
              ...template.variables,
              [varName]: value,
            },
          },
        });
      },
      [template, updateNodeData]
    );

    /** Handle manual template selection */
    const handleTemplateSelection = useCallback(
      (templateId: string) => {
        if (!templateId || !availableTemplates) return;
        
        const selectedTemplate = availableTemplates.find(t => t.id === templateId);
        if (!selectedTemplate) return;

        console.log('📄 Loading selected template:', selectedTemplate.name);
        
        // Extract variables from template content
        const extractVariables = (text: string) => {
          const variableRegex = /\{\{(\w+)\}\}/g;
          const variables: string[] = [];
          let match;
          while ((match = variableRegex.exec(text)) !== null) {
            if (!variables.includes(match[1])) {
              variables.push(match[1]);
            }
          }
          return variables;
        };
        
        const subjectVars = extractVariables(selectedTemplate.subject_template || "");
        const contentVars = extractVariables(selectedTemplate.content_template || "");
        const allVariables = [...new Set([...subjectVars, ...contentVars])];
        
        // Create variables object with empty values
        const variablesObj: Record<string, string> = {};
        allVariables.forEach(varName => {
          variablesObj[varName] = "";
        });
        
        // Determine if content is HTML or text
        const isHtml = selectedTemplate.content_template?.includes('<') && selectedTemplate.content_template?.includes('>');
        
        updateNodeData({
          subject: selectedTemplate.subject_template || "",
          content: {
            ...content,
            html: isHtml ? selectedTemplate.content_template || "" : "",
            text: !isHtml ? selectedTemplate.content_template || "" : "",
            mode: isHtml ? "html" : "text"
          },
          template: {
            ...template,
            id: selectedTemplate.id,
            name: selectedTemplate.name,
            variables: variablesObj,
            useTemplate: true
          }
        });
        
        toast.success(`Template "${selectedTemplate.name}" loaded successfully!`);
      },
      [availableTemplates, template, content, updateNodeData]
    );

    /** Toggle between collapsed / expanded */
    const toggleExpand = useCallback(() => {
      updateNodeData({ isExpanded: !isExpanded });
    }, [isExpanded, updateNodeData]);

    // -------------------------------------------------------------------------
    // 4.5  Validation & Error Handling
    // -------------------------------------------------------------------------
    const nodeValidation = validateNodeData(nodeData);
    if (!nodeValidation.success) {
      reportValidationError("EmailCreator", id, nodeValidation.errors, {
        originalData: nodeValidation.originalData,
        component: "EmailCreatorNode",
      });
    }

    useNodeDataValidation(EmailCreatorDataSchema, "EmailCreator", nodeData, id);

    // -------------------------------------------------------------------------
    // 4.6  Generate emailOutput for EmailSender connection
    // -------------------------------------------------------------------------
    useEffect(() => {
      if (validationResult.isValid && (subject || recipients.to.length > 0)) {
        const emailData = {
          recipients: {
            to: recipients.to,
            cc: recipients.cc,
            bcc: recipients.bcc,
          },
          subject: subject,
          content: {
            text: content.text,
            html: content.html,
            useHtml: content.mode === "html" || content.mode === "rich",
          },
          attachments: attachments,
          template: template.useTemplate ? {
            id: template.id,
            name: template.name,
            variables: template.variables,
          } : undefined,
        };
        
        updateNodeData({
          emailOutput: emailData,
          validationOutput: validationResult.isValid,
          errorOutput: validationResult.errors.join(", "),
        });
      } else {
        updateNodeData({
          emailOutput: undefined,
          validationOutput: false,
          errorOutput: validationResult.errors.join(", "),
        });
      }
    }, [subject, recipients, content, template, attachments, validationResult, updateNodeData]);

    // -------------------------------------------------------------------------
    // 4.6  Computed Values
    // -------------------------------------------------------------------------
    const categoryStyles = CATEGORY_TEXT.EMAIL;
    const isValidEmail = validationResult.isValid;
    const hasWarnings = validationResult.warnings.length > 0;
    const hasErrors = validationResult.errors.length > 0;

    // -------------------------------------------------------------------------
    // 4.7  Render
    // -------------------------------------------------------------------------
    return (
      <>
        <LabelNode nodeId={id} label={spec?.displayName || "Email Creator"} />

        {isExpanded ? (
          <div
            className={`${CONTENT.expanded} ${isEnabled ? "" : CONTENT.disabled}`}
          >
            <div className={CONTENT.header}>
              <span className="text-sm font-medium">Email Creator</span>
              <div
                className={`text-xs ${isValidEmail ? "text-green-600" : hasErrors ? "text-red-600" : "text-yellow-600"}`}
              >
                {isValidEmail
                  ? "Valid Email"
                  : hasErrors
                    ? "Has Errors"
                    : "Incomplete"}
              </div>
            </div>

            <div className={CONTENT.body}>
              {/* Recipients Section */}
              <div>
                <label
                  htmlFor="email-to"
                  className="text-xs text-gray-600 mb-1 block"
                >
                  To (comma-separated):
                </label>
                <Textarea
                  id="email-to"
                  value={recipients.to.join(", ")}
                  onChange={handleRecipientsChange("to")}
                  placeholder="recipient@example.com, another@example.com"
                  className="w-full text-xs p-2 resize-none"
                  rows={2}
                  disabled={!isEnabled}
                />
              </div>

              {/* CC Recipients */}
              <div>
                <label
                  htmlFor="email-cc"
                  className="text-xs text-gray-600 mb-1 block"
                >
                  CC (optional):
                </label>
                <Textarea
                  id="email-cc"
                  value={recipients.cc.join(", ")}
                  onChange={handleRecipientsChange("cc")}
                  placeholder="cc@example.com"
                  className="w-full text-xs p-2 resize-none"
                  rows={1}
                  disabled={!isEnabled}
                />
              </div>

              {/* Subject */}
              <div>
                <label
                  htmlFor="email-subject"
                  className="text-xs text-gray-600 mb-1 block"
                >
                  Subject:
                </label>
                <input
                  id="email-subject"
                  type="text"
                  value={subject}
                  onChange={handleSubjectChange}
                  placeholder="Email subject..."
                  className="w-full text-xs p-2 border rounded"
                  disabled={!isEnabled}
                />
              </div>

              {/* Rich Text Editor */}
              <div>
                <label
                  htmlFor="email-content"
                  className="text-xs text-gray-600 mb-2 block"
                >
                  Message Content:
                </label>
                <RichTextEditor
                  value={content}
                  onChange={(newContent) => {
                    updateNodeData({
                      content: newContent,
                    });
                  }}
                  disabled={!isEnabled}
                  placeholder="Compose your email message..."
                />
              </div>

              {/* Template Section */}
              <div>
                <label className="text-xs text-gray-600 mb-1 block">
                  <input
                    type="checkbox"
                    checked={template.useTemplate}
                    onChange={(e) => handleTemplateToggle(e.target.checked)}
                    className="mr-2"
                    disabled={!isEnabled}
                  />
                  Use Template
                </label>
                
                {/* Connected Template Info */}
                {connectedTemplateData && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                    <div className="font-medium text-blue-800">📧 Connected Template: {connectedTemplateData.name}</div>
                    <div className="text-blue-600 mt-1">Category: {connectedTemplateData.category}</div>
                  </div>
                )}
                
                {template.useTemplate && !connectedTemplateData && (
                  <div className="mt-2">
                    <select
                      className="w-full text-xs p-2 border rounded"
                      disabled={!isEnabled}
                      value={template.id || ""}
                      onChange={(e) => handleTemplateSelection(e.target.value)}
                    >
                      <option value="">Select template...</option>
                      {availableTemplates?.map((tmpl) => (
                        <option key={tmpl.id} value={tmpl.id}>
                          {tmpl.name} ({tmpl.category})
                        </option>
                      ))}
                    </select>
                    
                    {/* Loading state */}
                    {availableTemplates === undefined && (
                      <div className="text-xs text-gray-500 mt-1">
                        🔄 Loading templates...
                      </div>
                    )}
                    
                    {/* No templates state */}
                    {availableTemplates?.length === 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        📄 No templates found. Create one in EmailTemplate node.
                      </div>
                    )}
                  </div>
                )}
                
                {/* Template Variables */}
                {template.useTemplate && Object.keys(template.variables).length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-gray-600 mb-2 font-medium">📝 Template Variables:</div>
                    <div className="space-y-2">
                      {Object.entries(template.variables).map(([varName, varValue]) => (
                        <div key={varName}>
                          <label className="text-xs text-gray-500 block mb-1">
                            {varName}:
                          </label>
                          <input
                            type="text"
                            value={varValue}
                            onChange={(e) => handleVariableChange(varName, e.target.value)}
                            placeholder={`Enter value for ${varName}`}
                            className="w-full text-xs p-2 border rounded"
                            disabled={!isEnabled}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Validation Status */}
              <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                <div>
                  Status:{" "}
                  {isValidEmail
                    ? "✅ Valid"
                    : hasErrors
                      ? "❌ Invalid"
                      : "⚠️ Incomplete"}
                </div>
                <div>
                  Recipients:{" "}
                  {recipients.to.length +
                    recipients.cc.length +
                    recipients.bcc.length}
                </div>
                <div>Attachments: {attachments.length}</div>
                {hasErrors && (
                  <div className="text-red-600 mt-1">
                    Errors: {validationResult.errors.join(", ")}
                  </div>
                )}
                {hasWarnings && (
                  <div className="text-yellow-600 mt-1">
                    Warnings: {validationResult.warnings.join(", ")}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`${CONTENT.collapsed} ${isEnabled ? "" : CONTENT.disabled}`}
          >
            <div className="text-center p-2">
              <div className={`text-xs font-mono ${categoryStyles.primary}`}>
                Email Creator
              </div>
              <div
                className={`text-xs ${isValidEmail ? "text-green-600" : hasErrors ? "text-red-600" : "text-yellow-600"}`}
              >
                {isValidEmail ? "Ready" : hasErrors ? "Invalid" : "Incomplete"}
              </div>
            </div>
          </div>
        )}

        <ExpandCollapseButton
          showUI={isExpanded}
          onToggle={toggleExpand}
          size="sm"
        />
      </>
    );
  }
);

EmailCreatorNode.displayName = "EmailCreatorNode";

// -----------------------------------------------------------------------------
// 5️⃣  Dynamic Spec Wrapper
// -----------------------------------------------------------------------------

const EmailCreatorNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec only when the size keys change
  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as EmailCreatorData),
    [
      (nodeData as EmailCreatorData).expandedSize,
      (nodeData as EmailCreatorData).collapsedSize,
    ]
  );

  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <EmailCreatorNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
};

export default EmailCreatorNodeWithDynamicSpec;
