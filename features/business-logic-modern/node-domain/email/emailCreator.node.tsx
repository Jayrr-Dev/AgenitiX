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

import { type ChangeEvent, memo, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

// UI Components
import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";

// Node Infrastructure
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
import { createSafeInitialData } from "@/features/business-logic-modern/infrastructure/node-core/schema-helpers";
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
import { useNodeData } from "@/hooks/useNodeData";

// Email Components
import { RichTextEditor } from "./components/RichTextEditor";

// Types and Utilities
import type { EmailValidationResult } from "./types";

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
				alignment: z.enum(["left", "center", "right", "justify"]).default("left"),
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
		isEnabled: z.boolean().default(true),
		expandedSize: z.string().default("VE3"),
		collapsedSize: z.string().default("C2"),

		// Outputs
		emailOutput: z.any().optional(),
		validationOutput: z.boolean().optional(),
		errorOutput: z.string().default(""),
	})
	.passthrough();

export type EmailCreatorData = z.infer<typeof EmailCreatorDataSchema>;

const validateNodeData = createNodeValidator(EmailCreatorDataSchema, "EmailCreator");

// -----------------------------------------------------------------------------
// 2️⃣  Dynamic Spec Generation
// -----------------------------------------------------------------------------

function createDynamicSpec(data: EmailCreatorData): NodeSpec {
	const _expanded =
		EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ?? EXPANDED_SIZES.VE3;
	const _collapsed =
		COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ?? COLLAPSED_SIZES.C2;

	return {
		kind: "emailCreator",
		displayName: "Email Creator",
		label: "Email Creator",
		category: "EMAIL",
		size: {
			expanded: EXPANDED_SIZES.FE2, // 180x180 for email composition
			collapsed: COLLAPSED_SIZES.C1W, // 120x60 for collapsed view
		},
		handles: [
			{
				id: "accountInput",
				type: "target",
				dataType: "emailAccount",
				position: "left",
			},
			{
				id: "templateInput",
				type: "target",
				dataType: "emailTemplate",
				position: "left",
			},
			{
				id: "variableInput",
				type: "target",
				dataType: "any",
				position: "left",
			},
			{
				id: "emailOutput",
				type: "source",
				dataType: "composedEmail",
				position: "right",
			},
			{
				id: "validationOutput",
				type: "source",
				dataType: "boolean",
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
				"expandedSize",
				"collapsedSize",
				"validation",
				"attachments",
			],
			customFields: [
				{ key: "isEnabled", type: "boolean", label: "Enable" },
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
const parseEmailAddresses = (emailString: string): { valid: string[]; invalid: string[] } => {
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
const validateEmailContent = (data: EmailCreatorData): EmailValidationResult => {
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
	const totalAttachmentSize = data.attachments.reduce((sum, att) => sum + att.size, 0);
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

const EmailCreatorNode = memo(({ id, spec }: NodeProps & { spec: NodeSpec }) => {
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
		formatting,
		validation,
		isEnabled,
		expandedSize,
		collapsedSize,
		emailOutput,
		validationOutput,
		errorOutput,
	} = nodeData as EmailCreatorData;

	// -------------------------------------------------------------------------
	// 4.2  State Management
	// -------------------------------------------------------------------------
	const [isExpanded, setIsExpanded] = useState(false);
	const [_previewMode, _setPreviewMode] = useState<"desktop" | "mobile" | "text">("desktop");

	// -------------------------------------------------------------------------
	// 4.3  Validation and Processing
	// -------------------------------------------------------------------------
	const validationResult = useMemo(() => {
		return validateEmailContent(nodeData as EmailCreatorData);
	}, [recipients, subject, content, attachments]);

	// Update validation in node data when it changes
	useEffect(() => {
		if (
			validationResult.isValid !== validation.isValid ||
			JSON.stringify(validationResult.errors) !== JSON.stringify(validation.errors) ||
			JSON.stringify(validationResult.warnings) !== JSON.stringify(validation.warnings)
		) {
			updateNodeData({
				validation: validationResult,
				validationOutput: validationResult.isValid,
				errorOutput: validationResult.errors.join(", "),
			});
		}
	}, [validationResult, validation, updateNodeData]);

	// -------------------------------------------------------------------------
	// 4.4  Event Handlers
	// -------------------------------------------------------------------------

	/** Handle recipients change */
	const handleRecipientsChange = useCallback(
		(field: "to" | "cc" | "bcc") => (e: ChangeEvent<HTMLTextAreaElement>) => {
			const recipientString = e.target.value;
			const { valid, invalid } = parseEmailAddresses(recipientString);

			// Update recipients with validated emails
			updateNodeData({
				recipients: {
					...recipients,
					[field]: valid,
				},
			});

			// Show validation feedback for invalid emails
			if (invalid.length > 0) {
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
				<div className={`${CONTENT.expanded} ${isEnabled ? "" : CONTENT.disabled}`}>
					<div className={CONTENT.header}>
						<span className="text-sm font-medium">Email Creator</span>
						<div
							className={`text-xs ${isValidEmail ? "text-green-600" : hasErrors ? "text-red-600" : "text-yellow-600"}`}
						>
							{isValidEmail ? "Valid Email" : hasErrors ? "Has Errors" : "Incomplete"}
						</div>
					</div>

					<div className={CONTENT.body}>
						{/* Recipients Section */}
						<div>
							<label className="text-xs text-gray-600 mb-1 block">To (comma-separated):</label>
							<textarea
								value={recipients.to.join(", ")}
								onChange={handleRecipientsChange("to")}
								placeholder="recipient@example.com, another@example.com"
								className="w-full text-xs p-2 border rounded resize-none"
								rows={2}
								disabled={!isEnabled}
							/>
						</div>

						{/* CC Recipients */}
						<div>
							<label className="text-xs text-gray-600 mb-1 block">CC (optional):</label>
							<textarea
								value={recipients.cc.join(", ")}
								onChange={handleRecipientsChange("cc")}
								placeholder="cc@example.com"
								className="w-full text-xs p-2 border rounded resize-none"
								rows={1}
								disabled={!isEnabled}
							/>
						</div>

						{/* Subject */}
						<div>
							<label className="text-xs text-gray-600 mb-1 block">Subject:</label>
							<input
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
							<label className="text-xs text-gray-600 mb-2 block">Message Content:</label>
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
							<label className="flex items-center text-xs text-gray-600 mb-1">
								<input
									type="checkbox"
									checked={template.useTemplate}
									onChange={(e) => handleTemplateToggle(e.target.checked)}
									className="mr-2"
									disabled={!isEnabled}
								/>
								Use Template
							</label>
							{template.useTemplate && (
								<select className="w-full text-xs p-2 border rounded" disabled={!isEnabled}>
									<option value="">Select template...</option>
									<option value="welcome">Welcome Email</option>
									<option value="newsletter">Newsletter</option>
									<option value="notification">Notification</option>
								</select>
							)}
						</div>

						{/* Validation Status */}
						<div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
							<div>
								Status: {isValidEmail ? "✅ Valid" : hasErrors ? "❌ Invalid" : "⚠️ Incomplete"}
							</div>
							<div>
								Recipients: {recipients.to.length + recipients.cc.length + recipients.bcc.length}
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
				<div className={`${CONTENT.collapsed} ${isEnabled ? "" : CONTENT.disabled}`}>
					<div className="text-center p-2">
						<div className={`text-xs font-mono ${categoryStyles.primary}`}>Email Creator</div>
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
				onToggle={() => setIsExpanded(!isExpanded)}
				size="sm"
			/>
		</>
	);
});

EmailCreatorNode.displayName = "EmailCreatorNode";

// -----------------------------------------------------------------------------
// 5️⃣  Dynamic Spec Wrapper
// -----------------------------------------------------------------------------

const EmailCreatorNodeWithDynamicSpec = (props: NodeProps) => {
	const { nodeData } = useNodeData(props.id, props.data);

	// Recompute spec only when the size keys change
	const dynamicSpec = useMemo(
		() => createDynamicSpec(nodeData as EmailCreatorData),
		[(nodeData as EmailCreatorData).expandedSize, (nodeData as EmailCreatorData).collapsedSize]
	);

	const ScaffoldedNode = useMemo(
		() => withNodeScaffold(dynamicSpec, (p) => <EmailCreatorNode {...p} spec={dynamicSpec} />),
		[dynamicSpec]
	);

	return <ScaffoldedNode {...props} />;
};

export default EmailCreatorNodeWithDynamicSpec;
