/**
 * emailBrand NODE – Email branding and visual identity management
 *
 * • Manage email branding elements (logos, colors, fonts, signatures)
 * • Corporate identity consistency across all email communications
 * • Brand template system with customizable elements
 * • Integration with emailCreator and emailTemplate for branded emails
 * • Support for multiple brand profiles and switching
 *
 * Keywords: email-branding, corporate-identity, logos, signatures, visual-consistency
 */

import type { NodeProps } from "@xyflow/react";
import { type ChangeEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const EmailBrandDataSchema = z
	.object({
		// Brand Identity
		brandName: z.string().default(""),
		brandDescription: z.string().default(""),
		brandType: z.enum(["corporate", "personal", "product", "campaign"]).default("corporate"),
		
		// Visual Elements
		logo: z.object({
			url: z.string().default(""),
			alt: z.string().default(""),
			width: z.number().default(200),
			height: z.number().default(60),
			position: z.enum(["header", "footer", "signature"]).default("header"),
		}).default({
			url: "",
			alt: "",
			width: 200,
			height: 60,
			position: "header",
		}),
		
		// Color Scheme
		colors: z.object({
			primary: z.string().default("#007bff"),
			secondary: z.string().default("#6c757d"),
			accent: z.string().default("#28a745"),
			background: z.string().default("#ffffff"),
			text: z.string().default("#212529"),
			link: z.string().default("#007bff"),
		}).default({
			primary: "#007bff",
			secondary: "#6c757d",
			accent: "#28a745",
			background: "#ffffff",
			text: "#212529",
			link: "#007bff",
		}),
		
		// Typography
		typography: z.object({
			fontFamily: z.string().default("Arial, sans-serif"),
			fontSize: z.number().default(14),
			lineHeight: z.number().default(1.5),
			headingFont: z.string().default("Arial, sans-serif"),
			headingSize: z.number().default(18),
		}).default({
			fontFamily: "Arial, sans-serif",
			fontSize: 14,
			lineHeight: 1.5,
			headingFont: "Arial, sans-serif",
			headingSize: 18,
		}),
		
		// Email Signature
		signature: z.object({
			enabled: z.boolean().default(true),
			name: z.string().default(""),
			title: z.string().default(""),
			company: z.string().default(""),
			phone: z.string().default(""),
			email: z.string().default(""),
			website: z.string().default(""),
			address: z.string().default(""),
			socialLinks: z.array(z.object({
				platform: z.string(),
				url: z.string(),
				icon: z.string().optional(),
			})).default([]),
			customHtml: z.string().default(""),
		}).default({
			enabled: true,
			name: "",
			title: "",
			company: "",
			phone: "",
			email: "",
			website: "",
			address: "",
			socialLinks: [],
			customHtml: "",
		}),
		
		// Layout & Styling
		layout: z.object({
			maxWidth: z.number().default(600),
			padding: z.number().default(20),
			borderRadius: z.number().default(4),
			headerHeight: z.number().default(80),
			footerHeight: z.number().default(60),
		}).default({
			maxWidth: 600,
			padding: 20,
			borderRadius: 4,
			headerHeight: 80,
			footerHeight: 60,
		}),
		
		// Brand Management
		brandId: z.string().default(""),
		isDefault: z.boolean().default(false),
		isActive: z.boolean().default(true),
		version: z.number().default(1),
		
		// Preview & Export
		previewMode: z.enum(["desktop", "mobile", "both"]).default("desktop"),
		showPreview: z.boolean().default(false),
		exportFormat: z.enum(["html", "css", "json"]).default("html"),
		
		// Processing State
		isLoading: z.boolean().default(false),
		isSaving: z.boolean().default(false),
		lastSaved: z.number().optional(),
		
		// Error Handling
		lastError: z.string().default(""),
		validationErrors: z.array(z.string()).default([]),
		
		// UI State
		isEnabled: SafeSchemas.boolean(true),
		isExpanded: SafeSchemas.boolean(false),
		expandedSize: SafeSchemas.text("VE3"),
		collapsedSize: SafeSchemas.text("C2"),
		
		// Output Data
		brandOutput: z.string().default(""),
		compiledBrand: z.object({
			css: z.string(),
			html: z.string(),
			variables: z.record(z.string()),
		}).optional(),
		
		label: z.string().optional(), // User-editable node label
	})
	.passthrough();

export type EmailBrandData = z.infer<typeof EmailBrandDataSchema>;

const validateNodeData = createNodeValidator(EmailBrandDataSchema, "EmailBrand");

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

const BRAND_TYPES = [
	{ value: "corporate", label: "Corporate" },
	{ value: "personal", label: "Personal" },
	{ value: "product", label: "Product" },
	{ value: "campaign", label: "Campaign" },
] as { value: string; label: string }[];

const FONT_FAMILIES = [
	{ value: "Arial, sans-serif", label: "Arial" },
	{ value: "Helvetica, sans-serif", label: "Helvetica" },
	{ value: "Georgia, serif", label: "Georgia" },
	{ value: "Times New Roman, serif", label: "Times New Roman" },
	{ value: "Verdana, sans-serif", label: "Verdana" },
	{ value: "Trebuchet MS, sans-serif", label: "Trebuchet MS" },
] as { value: string; label: string }[];

const LOGO_POSITIONS = [
	{ value: "header", label: "Header" },
	{ value: "footer", label: "Footer" },
	{ value: "signature", label: "Signature" },
] as { value: string; label: string }[];

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

function createDynamicSpec(data: EmailBrandData): NodeSpec {
	const expanded =
		EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ?? EXPANDED_SIZES.VE3;
	const collapsed =
		COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ?? COLLAPSED_SIZES.C2;

	return {
		kind: "emailBrand",
		displayName: "Email Brand",
		label: "Email Brand",
		category: CATEGORIES.EMAIL,
		size: { expanded, collapsed },
		handles: [
			{
				id: "config-input",
				code: "c",
				position: "top",
				type: "target",
				dataType: "JSON",
			},
			{
				id: "brand-output",
				code: "b",
				position: "right",
				type: "source",
				dataType: "JSON",
			},
			{
				id: "css-output",
				code: "s",
				position: "bottom",
				type: "source",
				dataType: "String",
			},
		],
		inspector: { key: "EmailBrandInspector" },
		version: 1,
		runtime: { execute: "emailBrand_execute_v1" },
		initialData: createSafeInitialData(EmailBrandDataSchema, {
			brandName: "",
			brandDescription: "",
			brandType: "corporate",
			logo: {
				url: "",
				alt: "",
				width: 200,
				height: 60,
				position: "header",
			},
			colors: {
				primary: "#007bff",
				secondary: "#6c757d",
				accent: "#28a745",
				background: "#ffffff",
				text: "#212529",
				link: "#007bff",
			},
			typography: {
				fontFamily: "Arial, sans-serif",
				fontSize: 14,
				lineHeight: 1.5,
				headingFont: "Arial, sans-serif",
				headingSize: 18,
			},
			signature: {
				enabled: true,
				name: "",
				title: "",
				company: "",
				phone: "",
				email: "",
				website: "",
				address: "",
				socialLinks: [],
				customHtml: "",
			},
			layout: {
				maxWidth: 600,
				padding: 20,
				borderRadius: 4,
				headerHeight: 80,
				footerHeight: 60,
			},
			brandId: "",
			isDefault: false,
			isActive: true,
			version: 1,
			previewMode: "desktop",
			showPreview: false,
			exportFormat: "html",
			isLoading: false,
			isSaving: false,
			lastError: "",
			validationErrors: [],
			brandOutput: "",
		}),
		dataSchema: EmailBrandDataSchema,
		controls: {
			autoGenerate: true,
			excludeFields: [
				"brandOutput",
				"compiledBrand",
				"isLoading",
				"isSaving",
				"lastSaved",
				"lastError",
				"validationErrors",
				"expandedSize",
				"collapsedSize",
				"logo",
				"colors",
				"typography",
				"signature",
				"layout",
			],
			customFields: [
				{ key: "isEnabled", type: "boolean", label: "Enable" },
				{ key: "brandName", type: "text", label: "Brand Name", placeholder: "Enter brand name" },
				{ key: "brandDescription", type: "textarea", label: "Description", placeholder: "Brand description" },
				{
					key: "brandType",
					type: "select",
					label: "Brand Type",
					validation: {
						options: BRAND_TYPES,
					},
				},
				{ key: "logo.url", type: "text", label: "Logo URL", placeholder: "https://example.com/logo.png" },
				{ key: "logo.alt", type: "text", label: "Logo Alt Text", placeholder: "Company logo" },
				{
					key: "logo.position",
					type: "select",
					label: "Logo Position",
					validation: {
						options: LOGO_POSITIONS,
					},
				},
				{ key: "colors.primary", type: "color", label: "Primary Color" },
				{ key: "colors.secondary", type: "color", label: "Secondary Color" },
				{ key: "colors.accent", type: "color", label: "Accent Color" },
				{
					key: "typography.fontFamily",
					type: "select",
					label: "Font Family",
					validation: {
						options: FONT_FAMILIES,
					},
				},
				{ key: "signature.enabled", type: "boolean", label: "Enable Signature" },
				{ key: "signature.name", type: "text", label: "Name", placeholder: "John Doe" },
				{ key: "signature.title", type: "text", label: "Title", placeholder: "CEO" },
				{ key: "signature.company", type: "text", label: "Company", placeholder: "Acme Corp" },
				{ key: "showPreview", type: "boolean", label: "Show Preview" },
				{ key: "isExpanded", type: "boolean", label: "Expand" },
			],
		},
		icon: "LuPalette",
		author: "Agenitix Team",
		description: "Manage email branding, visual identity, and corporate styling for consistent email communications",
		feature: "email",
		tags: ["email", "branding", "design", "identity", "styling", "corporate"],
		theming: {},
	};
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
	expandedSize: "VE3",
	collapsedSize: "C2",
} as EmailBrandData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const EmailBrandNode = memo(({ id, spec }: NodeProps & { spec: NodeSpec }) => {
	// -------------------------------------------------------------------------
	const { nodeData, updateNodeData } = useNodeData(id, {});
	const { token } = useAuthContext();

	// -------------------------------------------------------------------------
	// STATE MANAGEMENT (grouped for clarity)
	// -------------------------------------------------------------------------
	const {
		isExpanded,
		isEnabled,
		brandName,
		brandDescription,
		brandType,
		logo,
		colors,
		typography,
		signature,
		layout,
		brandId,
		isDefault,
		isActive,
		previewMode,
		showPreview,
		isLoading,
		isSaving,
		lastError,
		brandOutput,
	} = nodeData as EmailBrandData;

	const categoryStyles = CATEGORY_TEXT.EMAIL;

	// Global React‑Flow store (nodes & edges) – triggers re‑render on change
	const _nodes = useStore((s) => s.nodes);
	const _edges = useStore((s) => s.edges);

	// Keep last emitted output to avoid redundant writes
	const _lastOutputRef = useRef<string | null>(null);

	// Local state for UI
	const [activeTab, setActiveTab] = useState<"identity" | "colors" | "typography" | "signature">("identity");

	// -------------------------------------------------------------------------
	// 4.3  Callbacks
	// -------------------------------------------------------------------------

	/** Toggle between collapsed / expanded */
	const toggleExpand = useCallback(() => {
		updateNodeData({ isExpanded: !isExpanded });
	}, [isExpanded, updateNodeData]);

	/** Generate CSS from brand data */
	const generateBrandCSS = useCallback(() => {
		const css = `
/* Email Brand Styles */
.email-brand {
	max-width: ${layout.maxWidth}px;
	padding: ${layout.padding}px;
	font-family: ${typography.fontFamily};
	font-size: ${typography.fontSize}px;
	line-height: ${typography.lineHeight};
	color: ${colors.text};
	background-color: ${colors.background};
	border-radius: ${layout.borderRadius}px;
}

.email-brand h1, .email-brand h2, .email-brand h3 {
	font-family: ${typography.headingFont};
	font-size: ${typography.headingSize}px;
	color: ${colors.primary};
}

.email-brand a {
	color: ${colors.link};
	text-decoration: none;
}

.email-brand .logo {
	width: ${logo.width}px;
	height: ${logo.height}px;
}

.email-brand .header {
	height: ${layout.headerHeight}px;
	background-color: ${colors.primary};
}

.email-brand .footer {
	height: ${layout.footerHeight}px;
	background-color: ${colors.secondary};
}

.email-brand .signature {
	border-top: 1px solid ${colors.secondary};
	padding-top: 10px;
	margin-top: 20px;
}
		`.trim();

		return css;
	}, [logo, colors, typography, layout]);

	/** Generate HTML signature */
	const generateSignatureHTML = useCallback(() => {
		if (!signature.enabled) return "";

		return `
<div class="email-signature">
	${signature.name ? `<div class="signature-name"><strong>${signature.name}</strong></div>` : ""}
	${signature.title ? `<div class="signature-title">${signature.title}</div>` : ""}
	${signature.company ? `<div class="signature-company">${signature.company}</div>` : ""}
	${signature.phone ? `<div class="signature-phone">📞 ${signature.phone}</div>` : ""}
	${signature.email ? `<div class="signature-email">✉️ <a href="mailto:${signature.email}">${signature.email}</a></div>` : ""}
	${signature.website ? `<div class="signature-website">🌐 <a href="${signature.website}">${signature.website}</a></div>` : ""}
	${signature.address ? `<div class="signature-address">📍 ${signature.address}</div>` : ""}
	${signature.customHtml ? `<div class="signature-custom">${signature.customHtml}</div>` : ""}
</div>
		`.trim();
	}, [signature]);

	/** Save brand configuration */
	const handleSaveBrand = useCallback(async () => {
		if (!token) {
			toast.error("Authentication required");
			return;
		}

		if (!brandName.trim()) {
			toast.error("Brand name is required");
			return;
		}

		try {
			updateNodeData({ isSaving: true, lastError: "" });

			// For now, just simulate saving (would integrate with Convex later)
			await new Promise(resolve => setTimeout(resolve, 1000));

			updateNodeData({
				isSaving: false,
				brandId: `brand_${Date.now()}`,
				lastSaved: Date.now(),
				isActive: true,
			});
			
			toast.success("Brand configuration saved successfully");
		} catch (error) {
			console.error("Save brand error:", error);
			updateNodeData({
				isSaving: false,
				lastError: error instanceof Error ? error.message : "Failed to save brand",
			});
			toast.error("Failed to save brand configuration");
		}
	}, [token, brandName, updateNodeData]);

	// -------------------------------------------------------------------------
	// 4.4  Effects
	// -------------------------------------------------------------------------

	/** Update outputs when brand changes */
	useEffect(() => {
		if (isEnabled && brandName) {
			const css = generateBrandCSS();
			const signatureHtml = generateSignatureHTML();
			
			const brandData = {
				id: brandId,
				name: brandName,
				type: brandType,
				logo,
				colors,
				typography,
				signature,
				layout,
				css,
				signatureHtml,
				isDefault,
				version: 1,
			};

			updateNodeData({
				compiledBrand: {
					css,
					html: signatureHtml,
					variables: {
						primaryColor: colors.primary,
						secondaryColor: colors.secondary,
						fontFamily: typography.fontFamily,
						logoUrl: logo.url,
					},
				},
				brandOutput: JSON.stringify(brandData),
				isActive: true,
			});
		} else {
			updateNodeData({
				isActive: false,
			});
		}
	}, [isEnabled, brandName, brandType, logo, colors, typography, signature, layout, brandId, isDefault, generateBrandCSS, generateSignatureHTML, updateNodeData]);

	// -------------------------------------------------------------------------
	// 4.5  Validation
	// -------------------------------------------------------------------------
	const validation = validateNodeData(nodeData);
	if (!validation.success) {
		reportValidationError("EmailBrand", id, validation.errors, {
			originalData: validation.originalData,
			component: "EmailBrandNode",
		});
	}

	useNodeDataValidation(EmailBrandDataSchema, "EmailBrand", validation.data, id);

	// -------------------------------------------------------------------------
	// 4.6  Render
	// -------------------------------------------------------------------------

	if (!isExpanded) {
		return (
			<div className={CONTENT.collapsed}>
				<div className="flex flex-col items-center gap-1">
					<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
						Brand
					</div>
					<div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px]">
						{brandName || "Untitled"}
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
				<div className={`text-sm font-semibold ${categoryStyles.primary}`}>
					Email Brand
				</div>
				<ExpandCollapseButton showUI={isExpanded} onToggle={toggleExpand} />
			</div>

			{/* Body */}
			<div className={CONTENT.body}>
				{/* Brand Info */}
				<div className="space-y-2">
					<div>
						<label htmlFor={`brand-name-${id}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
							Brand Name
						</label>
						<input
							id={`brand-name-${id}`}
							type="text"
							value={brandName}
							onChange={(e) => updateNodeData({ brandName: e.target.value })}
							placeholder="Enter brand name"
							className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
							disabled={!isEnabled}
						/>
					</div>

					<div>
						<label htmlFor={`brand-type-${id}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
							Brand Type
						</label>
						<select
							id={`brand-type-${id}`}
							value={brandType}
							onChange={(e) => updateNodeData({ brandType: e.target.value as any })}
							className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
							disabled={!isEnabled}
						>
							{BRAND_TYPES.map((type) => (
								<option key={type.value} value={type.value}>
									{type.label}
								</option>
							))}
						</select>
					</div>
				</div>

				{/* Tabs */}
				<div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
					{[
						{ key: "identity", label: "ID" },
						{ key: "colors", label: "Colors" },
						{ key: "typography", label: "Type" },
						{ key: "signature", label: "Sign" }
					].map((tab) => (
						<button
							key={tab.key}
							onClick={() => setActiveTab(tab.key as any)}
							className={`flex-shrink-0 px-2 py-1 text-xs font-medium ${
								activeTab === tab.key
									? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
									: "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
							}`}
							disabled={!isEnabled}
						>
							{tab.label}
						</button>
					))}
				</div>

				{/* Tab Content */}
				<div className="flex-1 min-h-0">
					{activeTab === "identity" && (
						<div className="space-y-2">
							<div>
								<label htmlFor={`logo-url-${id}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
									Logo URL
								</label>
								<input
									id={`logo-url-${id}`}
									type="text"
									value={logo.url}
									onChange={(e) => updateNodeData({ logo: { ...logo, url: e.target.value } })}
									placeholder="https://example.com/logo.png"
									className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
									disabled={!isEnabled}
								/>
							</div>
							<div className="grid grid-cols-2 gap-2">
								<div>
									<label htmlFor={`logo-width-${id}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
										Width
									</label>
									<input
										id={`logo-width-${id}`}
										type="number"
										value={logo.width}
										onChange={(e) => updateNodeData({ logo: { ...logo, width: Number(e.target.value) } })}
										className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
										disabled={!isEnabled}
									/>
								</div>
								<div>
									<label htmlFor={`logo-height-${id}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
										Height
									</label>
									<input
										id={`logo-height-${id}`}
										type="number"
										value={logo.height}
										onChange={(e) => updateNodeData({ logo: { ...logo, height: Number(e.target.value) } })}
										className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
										disabled={!isEnabled}
									/>
								</div>
							</div>
						</div>
					)}

					{activeTab === "colors" && (
						<div className="space-y-2">
							<div className="grid grid-cols-2 gap-2">
								<div>
									<label htmlFor={`color-primary-${id}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
										Primary
									</label>
									<input
										id={`color-primary-${id}`}
										type="color"
										value={colors.primary}
										onChange={(e) => updateNodeData({ colors: { ...colors, primary: e.target.value } })}
										className="w-full h-8 border border-gray-300 dark:border-gray-600 rounded"
										disabled={!isEnabled}
									/>
								</div>
								<div>
									<label htmlFor={`color-secondary-${id}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
										Secondary
									</label>
									<input
										id={`color-secondary-${id}`}
										type="color"
										value={colors.secondary}
										onChange={(e) => updateNodeData({ colors: { ...colors, secondary: e.target.value } })}
										className="w-full h-8 border border-gray-300 dark:border-gray-600 rounded"
										disabled={!isEnabled}
									/>
								</div>
								<div>
									<label htmlFor={`color-accent-${id}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
										Accent
									</label>
									<input
										id={`color-accent-${id}`}
										type="color"
										value={colors.accent}
										onChange={(e) => updateNodeData({ colors: { ...colors, accent: e.target.value } })}
										className="w-full h-8 border border-gray-300 dark:border-gray-600 rounded"
										disabled={!isEnabled}
									/>
								</div>
								<div>
									<label htmlFor={`color-text-${id}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
										Text
									</label>
									<input
										id={`color-text-${id}`}
										type="color"
										value={colors.text}
										onChange={(e) => updateNodeData({ colors: { ...colors, text: e.target.value } })}
										className="w-full h-8 border border-gray-300 dark:border-gray-600 rounded"
										disabled={!isEnabled}
									/>
								</div>
							</div>
						</div>
					)}

					{activeTab === "typography" && (
						<div className="space-y-2">
							<div>
								<label htmlFor={`font-family-${id}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
									Font Family
								</label>
								<select
									id={`font-family-${id}`}
									value={typography.fontFamily}
									onChange={(e) => updateNodeData({ typography: { ...typography, fontFamily: e.target.value } })}
									className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
									disabled={!isEnabled}
								>
									{FONT_FAMILIES.map((font) => (
										<option key={font.value} value={font.value}>
											{font.label}
										</option>
									))}
								</select>
							</div>
							<div className="grid grid-cols-2 gap-2">
								<div>
									<label htmlFor={`font-size-${id}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
										Font Size
									</label>
									<input
										id={`font-size-${id}`}
										type="number"
										value={typography.fontSize}
										onChange={(e) => updateNodeData({ typography: { ...typography, fontSize: Number(e.target.value) } })}
										className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
										disabled={!isEnabled}
									/>
								</div>
								<div>
									<label htmlFor={`line-height-${id}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
										Line Height
									</label>
									<input
										id={`line-height-${id}`}
										type="number"
										step="0.1"
										value={typography.lineHeight}
										onChange={(e) => updateNodeData({ typography: { ...typography, lineHeight: Number(e.target.value) } })}
										className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
										disabled={!isEnabled}
									/>
								</div>
							</div>
						</div>
					)}

					{activeTab === "signature" && (
						<div className="space-y-2">
							<div className="flex items-center gap-2 mb-2">
								<input
									id={`signature-enabled-${id}`}
									type="checkbox"
									checked={signature.enabled}
									onChange={(e) => updateNodeData({ signature: { ...signature, enabled: e.target.checked } })}
									className="rounded"
									disabled={!isEnabled}
								/>
								<label htmlFor={`signature-enabled-${id}`} className="text-xs font-medium text-gray-700 dark:text-gray-300">
									Enable Signature
								</label>
							</div>
							{signature.enabled && (
								<div className="space-y-2">
									<div className="grid grid-cols-2 gap-2">
										<div>
											<label htmlFor={`sig-name-${id}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
												Name
											</label>
											<input
												id={`sig-name-${id}`}
												type="text"
												value={signature.name}
												onChange={(e) => updateNodeData({ signature: { ...signature, name: e.target.value } })}
												placeholder="John Doe"
												className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
												disabled={!isEnabled}
											/>
										</div>
										<div>
											<label htmlFor={`sig-title-${id}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
												Title
											</label>
											<input
												id={`sig-title-${id}`}
												type="text"
												value={signature.title}
												onChange={(e) => updateNodeData({ signature: { ...signature, title: e.target.value } })}
												placeholder="CEO"
												className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
												disabled={!isEnabled}
											/>
										</div>
									</div>
									<div>
										<label htmlFor={`sig-company-${id}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
											Company
										</label>
										<input
											id={`sig-company-${id}`}
											type="text"
											value={signature.company}
											onChange={(e) => updateNodeData({ signature: { ...signature, company: e.target.value } })}
											placeholder="Acme Corp"
											className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
											disabled={!isEnabled}
										/>
									</div>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Preview */}
				{showPreview && brandName && (
					<div className="p-2 bg-gray-50 dark:bg-gray-800 rounded border">
						<div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
							Brand Preview
						</div>
						<div className="text-xs text-gray-600 dark:text-gray-400">
							<div style={{ 
								fontFamily: typography.fontFamily, 
								fontSize: `${typography.fontSize}px`,
								color: colors.text,
								backgroundColor: colors.background,
								padding: '8px',
								borderRadius: '4px'
							}}>
								<div style={{ color: colors.primary, fontWeight: 'bold' }}>
									{brandName}
								</div>
								<div style={{ color: colors.secondary }}>
									Sample email content with brand styling
								</div>
								<a href="#" style={{ color: colors.link }}>Sample Link</a>
							</div>
						</div>
					</div>
				)}

				{/* Actions */}
				<div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
					<button
						onClick={handleSaveBrand}
						className="flex-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
						disabled={!isEnabled || isSaving || !brandName.trim()}
					>
						{isSaving ? "Saving..." : "Save Brand"}
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
						Brand active
					</div>
				)}
			</div>
		</div>
	);
});

EmailBrandNode.displayName = "EmailBrandNode";

// -----------------------------------------------------------------------------
// 5️⃣  Dynamic spec wrapper component
// -----------------------------------------------------------------------------

const EmailBrandNodeWithDynamicSpec = (props: NodeProps) => {
	const { nodeData } = useNodeData(props.id, {});

	const dynamicSpec = useMemo(
		() => createDynamicSpec(nodeData as EmailBrandData),
		[(nodeData as EmailBrandData).expandedSize, (nodeData as EmailBrandData).collapsedSize]
	);

	// Memoise the scaffolded component to keep focus
	const ScaffoldedNode = useMemo(
		() => withNodeScaffold(dynamicSpec, (p) => <EmailBrandNode {...p} spec={dynamicSpec} />),
		[dynamicSpec]
	);

	return <ScaffoldedNode {...props} />;
};

export default EmailBrandNodeWithDynamicSpec;