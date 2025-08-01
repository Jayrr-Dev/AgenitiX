/**
 * emailList NODE – Email list management operations
 *
 * • Create and manage email distribution lists
 * • Import/export contact lists from various formats
 * • Filter and segment email lists based on criteria
 * • Validate email addresses in bulk
 * • Manage subscriptions and unsubscriptions
 *
 * Keywords: email-lists, contacts, distribution, segmentation, subscriptions
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
import { toast } from "sonner";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const EmailListDataSchema = z
	.object({
		// List Metadata
		listName: z.string().default(""),
		listDescription: z.string().default(""),
		
		// Email Addresses
		emails: z.array(z.string()).default([]),
		
		// Validation Results
		validEmails: z.array(z.string()).default([]),
		invalidEmails: z.array(z.string()).default([]),	
	
		// Import/Export
		importSource: z.enum(["manual", "csv", "text", "json"]).default("manual"),
		importData: z.string().default(""),
		exportFormat: z.enum(["csv", "text", "json"]).default("csv"),
		
		// Segmentation
		segments: z.array(
			z.object({
				name: z.string(),
				criteria: z.string(),
				emails: z.array(z.string()).default([]),
			})
		).default([]),
		
		// Subscription Management
		unsubscribedEmails: z.array(z.string()).default([]),
		bouncedEmails: z.array(z.string()).default([]),
		
		// Processing State
		isProcessing: z.boolean().default(false),
		processingStep: z.string().default(""),
		
		// UI State
		activeTab: z.enum(["list", "import", "export", "segments"]).default("list"),
		isEnabled: SafeSchemas.boolean(true),
		isActive: SafeSchemas.boolean(false),
		isExpanded: SafeSchemas.boolean(false),
		expandedSize: SafeSchemas.text("VE3"),
		collapsedSize: SafeSchemas.text("C2"),
		
		// Outputs
		listOutput: z.array(z.string()).default([]),
		validatedOutput: z.boolean().default(false),
		errorOutput: z.string().default(""),
		
		label: z.string().optional(),
	})
	.passthrough();

export type EmailListData = z.infer<typeof EmailListDataSchema>;

const validateNodeData = createNodeValidator(EmailListDataSchema, "EmailList");

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
	disabled: "opacity-75 bg-zinc-100 dark:bg-zinc-500 rounded-md transition-all duration-300",
} as const;

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

function createDynamicSpec(data: EmailListData): NodeSpec {
	const expanded =
		EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ?? EXPANDED_SIZES.VE3;
	const collapsed =
		COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ?? COLLAPSED_SIZES.C2;

	return {
		kind: "emailList",
		displayName: "Email List",
		label: "Email List",
		category: CATEGORIES.EMAIL,
		size: { expanded, collapsed },
		handles: [
			{
				id: "email-input",
				code: "e",
				position: "left",
				type: "target",
				dataType: "Array",
			},
			{
				id: "list-output",
				code: "l",
				position: "right",
				type: "source",
				dataType: "Array",
			},
			{
				id: "validated-output",
				code: "v",
				position: "bottom",
				type: "source",
				dataType: "Boolean",
			},
		],
		inspector: { key: "EmailListInspector" },
		version: 1,
		runtime: { execute: "emailList_execute_v1" },
		initialData: createSafeInitialData(EmailListDataSchema, {
			listName: "",
			listDescription: "",
			emails: [],
			validEmails: [],
			invalidEmails: [],
			importSource: "manual",
			importData: "",
			exportFormat: "csv",
			segments: [],
			unsubscribedEmails: [],
			bouncedEmails: [],
			isProcessing: false,
			processingStep: "",
			activeTab: "list",
			listOutput: [],
			validatedOutput: false,
			errorOutput: "",
		}),
		dataSchema: EmailListDataSchema,
		controls: {
			autoGenerate: true,
			excludeFields: [
				"isActive",
				"listOutput",
				"validatedOutput",
				"errorOutput",
				"isProcessing",
				"processingStep",
				"expandedSize",
				"collapsedSize",
				"segments",
			],
			customFields: [
				{ key: "isEnabled", type: "boolean", label: "Enable" },
				{ key: "listName", type: "text", label: "List Name", placeholder: "Enter list name" },
				{ key: "listDescription", type: "textarea", label: "Description", placeholder: "List description" },
				{
					key: "importSource",
					type: "select",
					label: "Import Source",
					validation: {
						options: [
							{ value: "manual", label: "Manual" },
							{ value: "csv", label: "CSV" },
							{ value: "text", label: "Text" },
							{ value: "json", label: "JSON" },
						],
					},
				},
				{ key: "importData", type: "textarea", label: "Import Data", placeholder: "Paste email data" },
				{
					key: "exportFormat",
					type: "select",
					label: "Export Format",
					validation: {
						options: [
							{ value: "csv", label: "CSV" },
							{ value: "text", label: "Text" },
							{ value: "json", label: "JSON" },
						],
					},
				},
				{ key: "isExpanded", type: "boolean", label: "Expand" },
			],
		},
		icon: "LuList",
		author: "Agenitix Team",
		description: "Manage email distribution lists and contacts with import/export capabilities",
		feature: "email",
		tags: ["email", "list", "contacts", "distribution", "segmentation"],
		theming: {},
	};
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
	expandedSize: "VE3",
	collapsedSize: "C2",
} as EmailListData);

// -----------------------------------------------------------------------------
// 4️⃣  Utility Functions
// -----------------------------------------------------------------------------

/** Validate email address */
const validateEmail = (email: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

/** Parse and validate a list of emails */
const parseEmailList = (input: string): { valid: string[]; invalid: string[] } => {
	const rawEmails = input
		.split(/[,;\n\s]+/)
		.map(e => e.trim())
		.filter(e => e.length > 0);
	
	const valid: string[] = [];
	const invalid: string[] = [];
	
	rawEmails.forEach(email => {
		if (validateEmail(email)) {
			valid.push(email);
		} else {
			invalid.push(email);
		}
	});
	
	return { valid, invalid };
};

// -----------------------------------------------------------------------------
// 5️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const EmailListNode = memo(({ id, spec }: NodeProps & { spec: NodeSpec }) => {
	// -------------------------------------------------------------------------
	const { nodeData, updateNodeData } = useNodeData(id, {});
	const { token } = useAuthContext();

	// -------------------------------------------------------------------------
	// STATE MANAGEMENT (grouped for clarity)
	// -------------------------------------------------------------------------
	const {
		isExpanded,
		isEnabled,
		listName,
		listDescription,
		emails,
		validEmails,
		invalidEmails,
		importSource,
		importData,
		exportFormat,
		segments,
		activeTab,
		isProcessing,
		isActive,
	} = nodeData as EmailListData;

	const categoryStyles = CATEGORY_TEXT.EMAIL;

	// Global React‑Flow store (nodes & edges) – triggers re‑render on change
	const _nodes = useStore((s) => s.nodes);
	const _edges = useStore((s) => s.edges);

	// Keep last emitted output to avoid redundant writes
	const _lastOutputRef = useRef<string | null>(null);

	// Local state for UI
	const [newEmail, setNewEmail] = useState("");

	// -------------------------------------------------------------------------
	// 4.3  Callbacks
	// -------------------------------------------------------------------------

	/** Toggle between collapsed / expanded */
	const toggleExpand = useCallback(() => {
		updateNodeData({ isExpanded: !isExpanded });
	}, [isExpanded, updateNodeData]);

	/** Add a single email */
	const addEmail = useCallback(() => {
		if (!newEmail) return;
		
		if (validateEmail(newEmail)) {
			if (emails.includes(newEmail)) {
				toast.error("Email already exists in the list");
				return;
			}
			
			updateNodeData({
				emails: [...emails, newEmail],
				validEmails: [...validEmails, newEmail],
				listOutput: [...emails, newEmail],
			});
			setNewEmail("");
			toast.success("Email added successfully");
		} else {
			toast.error("Invalid email address");
		}
	}, [newEmail, emails, validEmails, updateNodeData]);

	/** Remove an email */
	const removeEmail = useCallback(
		(email: string) => {
			updateNodeData({
				emails: emails.filter(e => e !== email),
				validEmails: validEmails.filter(e => e !== email),
				invalidEmails: invalidEmails.filter(e => e !== email),
				listOutput: emails.filter(e => e !== email),
			});
			toast.success("Email removed");
		},
		[emails, validEmails, invalidEmails, updateNodeData]
	);

	/** Import emails from bulk input */
	const importEmails = useCallback(() => {
		if (!importData) {
			toast.error("No import data provided");
			return;
		}
		
		updateNodeData({ isProcessing: true, processingStep: "Importing emails..." });
		
		setTimeout(() => {
			try {
				const result = parseEmailList(importData);
				const uniqueEmails = [...new Set([...emails, ...result.valid])];
				
				updateNodeData({
					emails: uniqueEmails,
					validEmails: [...new Set([...validEmails, ...result.valid])],
					invalidEmails: [...new Set([...invalidEmails, ...result.invalid])],
					isProcessing: false,
					processingStep: "",
					listOutput: uniqueEmails,
					validatedOutput: result.invalid.length === 0,
					errorOutput: result.invalid.length > 0 ? `Found ${result.invalid.length} invalid emails` : "",
				});
				
				toast.success(`Imported ${result.valid.length} email addresses`);
				if (result.invalid.length > 0) {
					toast.warning(`Found ${result.invalid.length} invalid emails`);
				}
			} catch (error) {
				updateNodeData({
					isProcessing: false,
					processingStep: "",
					errorOutput: `Import error: ${(error as Error).message}`,
				});
				toast.error(`Import error: ${(error as Error).message}`);
			}
		}, 100);
	}, [importData, emails, validEmails, invalidEmails, updateNodeData]);

	// -------------------------------------------------------------------------
	// 4.4  Effects
	// -------------------------------------------------------------------------

	/** Update outputs when emails change */
	useEffect(() => {
		if (isEnabled && emails.length > 0) {
			updateNodeData({
				listOutput: emails,
				validatedOutput: invalidEmails.length === 0,
				isActive: true,
			});
		} else {
			updateNodeData({
				isActive: false,
			});
		}
	}, [isEnabled, emails, invalidEmails, updateNodeData]);

	// -------------------------------------------------------------------------
	// 4.5  Validation
	// -------------------------------------------------------------------------
	const validation = validateNodeData(nodeData);
	if (!validation.success) {
		reportValidationError("EmailList", id, validation.errors, {
			originalData: validation.originalData,
			component: "EmailListNode",
		});
	}

	useNodeDataValidation(EmailListDataSchema, "EmailList", validation.data, id);

	// -------------------------------------------------------------------------
	// 4.6  Render
	// -------------------------------------------------------------------------

	if (!isExpanded) {
		return (
			<div className={CONTENT.collapsed}>
				<div className="flex flex-col items-center gap-1">
					<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
						List
					</div>
					<div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px]">
						{listName || "Untitled"}
					</div>
					<div className="text-xs text-gray-500 dark:text-gray-400">
						{emails.length} contacts
					</div>
					{isActive && (
						<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
					)}
				</div>
			</div>
		);
	}

	return (
		<div className={`${CONTENT.expanded} ${!isEnabled ? CONTENT.disabled : ""}`}>
			{/* Header */}
			<div className={CONTENT.header}>
				<LabelNode
					label="Email List"
					className={`text-sm font-semibold ${categoryStyles.primary}`}
				/>
				<ExpandCollapseButton isExpanded={isExpanded} onClick={toggleExpand} />
			</div>

			{/* Body */}
			<div className={CONTENT.body}>
				{/* List Name and Description */}
				<div className="space-y-2 mb-3">
					<div>
						<label htmlFor={`list-name-${id}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
							List Name
						</label>
						<input
							id={`list-name-${id}`}
							type="text"
							value={listName}
							onChange={(e) => updateNodeData({ listName: e.target.value })}
							placeholder="Enter list name"
							className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
							disabled={!isEnabled}
						/>
					</div>
					<div>
						<label htmlFor={`list-desc-${id}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
							Description
						</label>
						<input
							id={`list-desc-${id}`}
							type="text"
							value={listDescription}
							onChange={(e) => updateNodeData({ listDescription: e.target.value })}
							placeholder="List description"
							className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
							disabled={!isEnabled}
						/>
					</div>
				</div>

				{/* Add Email */}
				<div className="space-y-2 mb-3">
					<div className="text-xs font-medium text-gray-700 dark:text-gray-300">Add Email</div>
					<div className="flex gap-2">
						<input
							type="email"
							value={newEmail}
							onChange={(e) => setNewEmail(e.target.value)}
							placeholder="Enter email address"
							className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
							disabled={!isEnabled}
							onKeyPress={(e) => e.key === 'Enter' && addEmail()}
						/>
						<button
							onClick={addEmail}
							disabled={!isEnabled || !newEmail}
							className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Add
						</button>
					</div>
				</div>

				{/* Import Section */}
				<div className="space-y-2 mb-3">
					<div className="text-xs font-medium text-gray-700 dark:text-gray-300">Bulk Import</div>
					<div className="grid grid-cols-4 gap-1 mb-2">
						{["manual", "csv", "text", "json"].map((source) => (
							<button
								key={source}
								onClick={() => updateNodeData({ importSource: source as any })}
								className={`px-2 py-1 text-xs rounded ${
									importSource === source
										? "bg-blue-500 text-white"
										: "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
								}`}
								disabled={!isEnabled}
							>
								{source.toUpperCase()}
							</button>
						))}
					</div>
					<textarea
						value={importData}
						onChange={(e) => updateNodeData({ importData: e.target.value })}
						placeholder={
							importSource === "csv"
								? "Paste CSV data (email in first column)"
								: importSource === "json"
								? "Paste JSON data (array of emails or objects with email property)"
								: "Paste email addresses (separated by commas, spaces, or new lines)"
						}
						className="w-full h-20 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
						disabled={!isEnabled}
					/>
					<button
						onClick={importEmails}
						disabled={!isEnabled || !importData || isProcessing}
						className="w-full px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isProcessing ? "Importing..." : "Import Emails"}
					</button>
				</div>

				{/* Email List */}
				<div className="flex-1 min-h-0">
					<div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
						Email List ({emails.length} total, {validEmails.length} valid, {invalidEmails.length} invalid)
					</div>
					<div className="h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-800">
						{emails.length === 0 ? (
							<div className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
								No emails in list
							</div>
						) : (
							<div className="space-y-1">
								{emails.map((email) => (
									<div key={email} className="flex items-center justify-between text-xs p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
										<span className={validateEmail(email) ? "text-gray-900 dark:text-gray-100" : "text-red-500"}>
											{email}
										</span>
										<button
											onClick={() => removeEmail(email)}
											className="text-red-500 hover:text-red-700 text-xs px-1"
											disabled={!isEnabled}
										>
											×
										</button>
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Status */}
				{isActive && (
					<div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-2">
						<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
						List active
					</div>
				)}
			</div>
		</div>
	);
});

EmailListNode.displayName = "EmailListNode";

// -----------------------------------------------------------------------------
// 6️⃣  Dynamic spec wrapper component
// -----------------------------------------------------------------------------

const EmailListNodeWithDynamicSpec = (props: NodeProps) => {
	const { nodeData } = useNodeData(props.id, {});

	const dynamicSpec = useMemo(
		() => createDynamicSpec(nodeData as EmailListData),
		[(nodeData as EmailListData).expandedSize, (nodeData as EmailListData).collapsedSize]
	);

	// Memoise the scaffolded component to keep focus
	const ScaffoldedNode = useMemo(
		() => withNodeScaffold(dynamicSpec, (p) => <EmailListNode {...p} spec={dynamicSpec} />),
		[dynamicSpec]
	);

	return <ScaffoldedNode {...props} />;
};

export default EmailListNodeWithDynamicSpec;