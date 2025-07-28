/**
 * NODE DOCUMENTATION GENERATOR - Enhanced with Infrastructure Integration
 *
 * • Generates comprehensive documentation for individual nodes
 * • Includes sidebar and inspector integration status
 * • Creates markdown, HTML, and API documentation
 * • Auto-updates documentation index
 * • Integrates with Plop node creation workflow
 * • Includes detailed node specification information
 *
 * Keywords: node-documentation, infrastructure-integration, sidebar, inspector, auto-generation, node-spec
 */

import * as fs from "node:fs";
import * as path from "node:path";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface NodeDocData {
	kind: string;
	domain: string;
	category: string;
	displayName: string;
	description: string;
	icon?: string;
	author?: string;
	feature?: string;
	tags?: string[];
	inputs: Array<{
		id: string;
		type: string;
		description: string;
		position: string;
	}>;
	outputs: Array<{
		id: string;
		type: string;
		description: string;
		position: string;
	}>;
	examples: Array<{
		title: string;
		description: string;
		code: string;
	}>;
	relatedNodes: string[];
	infrastructure: {
		sidebar: {
			integrated: boolean;
			category: string;
			folder?: string;
			order?: number;
		};
		inspector: {
			integrated: boolean;
			key: string;
			hasControls: boolean;
			controlTypes: string[];
		};
	};
	specification: {
		size: {
			expanded: { width: number; height: number | string };
			collapsed: { width: number; height: number | string };
			humanReadable: {
				expanded: string;
				collapsed: string;
			};
		};
		version: number;
		runtime?: {
			execute?: string;
		};
		memory?: {
			enabled: boolean;
			maxSize?: number;
			maxEntries?: number;
			persistent?: boolean;
			evictionPolicy?: string;
		};
		controls?: {
			autoGenerate: boolean;
			excludeFields: string[];
			customFields: Array<{
				key: string;
				type: string;
				label: string;
				placeholder?: string;
				ui?: Record<string, any>;
			}>;
		};
		dataSchema?: {
			fields: Array<{
				name: string;
				type: string;
				required: boolean;
				defaultValue?: any;
			}>;
		};
		icon?: string;
		author?: string;
		feature?: string;
		tags?: string[];
	};
	theming: {
		category: string;
		designTokens: {
			background: string;
			border: string;
			text: string;
			textSecondary: string;
			hover: string;
			selected: string;
			error: string;
		};
		responsive: {
			mobileOptimized: boolean;
			tabletOptimized: boolean;
			desktopOptimized: boolean;
		};
		accessibility: {
			ariaLabels: string[];
			keyboardSupport: boolean;
			screenReaderSupport: boolean;
			focusManagement: boolean;
		};
		visualStates: {
			hover: boolean;
			selected: boolean;
			active: boolean;
			error: boolean;
			disabled: boolean;
		};
	};
}

// ============================================================================
// SIZE CONSTANTS MAPPING
// ============================================================================

const SIZE_MAPPINGS = {
	// Collapsed sizes
	C1: { width: 60, height: 60, description: "60×60px (Standard collapsed)" },
	C1W: { width: 120, height: 60, description: "120×60px (Wide collapsed)" },
	C2: { width: 120, height: 120, description: "120×120px (Large collapsed)" },
	C3: { width: 180, height: 180, description: "180×180px (Extra large collapsed)" },

	// Fixed expanded sizes
	FE0: { width: 60, height: 60, description: "60×60px (Tiny expanded)" },
	FE1: { width: 120, height: 120, description: "120×120px (Default expanded)" },
	FE1H: { width: 120, height: 180, description: "120×180px (Tall expanded)" },
	FE2: { width: 180, height: 180, description: "180×180px (Large expanded)" },
	FE3: { width: 240, height: 240, description: "240×240px (Extra large expanded)" },

	// Variable expanded sizes
	VE0: { width: 60, height: "auto", description: "60px width, variable height" },
	VE1: { width: 120, height: "auto", description: "120px width, variable height" },
	VE2: { width: 180, height: "auto", description: "180px width, variable height" },
	VE3: { width: 240, height: "auto", description: "240px width, variable height" },
} as const;

// ============================================================================
// INFRASTRUCTURE INTEGRATION DETECTION
// ============================================================================

/**
 * Detect sidebar integration for a node
 */
function detectSidebarIntegration(
	kind: string,
	category: string
): NodeDocData["infrastructure"]["sidebar"] {
	// Check if node is in the sidebar registry
	const sidebarRegistryPath = path.join(
		process.cwd(),
		"features/business-logic-modern/infrastructure/node-registry/nodespec-registry.ts"
	);

	if (fs.existsSync(sidebarRegistryPath)) {
		const registryContent = fs.readFileSync(sidebarRegistryPath, "utf-8");
		const isRegistered =
			registryContent.includes("createText: createTextSpec") ||
			registryContent.includes(`${kind}: ${kind}Spec`);

		return {
			integrated: isRegistered,
			category: category,
			folder: category.toLowerCase(),
			order: 1,
		};
	}

	return {
		integrated: false,
		category: category,
	};
}

/**
 * Detect inspector integration for a node
 */
function detectInspectorIntegration(kind: string): NodeDocData["infrastructure"]["inspector"] {
	// Check if node has inspector controls
	const inspectorServicePath = path.join(
		process.cwd(),
		"features/business-logic-modern/infrastructure/node-inspector/services/NodeInspectorService.ts"
	);

	let hasControls = false;
	const controlTypes: string[] = [];

	if (fs.existsSync(inspectorServicePath)) {
		const serviceContent = fs.readFileSync(inspectorServicePath, "utf-8");
		hasControls =
			serviceContent.includes("generateControlFields") &&
			serviceContent.includes("NodeInspectorService");

		// Detect common control types
		if (serviceContent.includes("text")) {
			controlTypes.push("text");
		}
		if (serviceContent.includes("textarea")) {
			controlTypes.push("textarea");
		}
		if (serviceContent.includes("boolean")) {
			controlTypes.push("boolean");
		}
		if (serviceContent.includes("number")) {
			controlTypes.push("number");
		}
		if (serviceContent.includes("select")) {
			controlTypes.push("select");
		}
	}

	return {
		integrated: hasControls,
		key: `${kind}Inspector`,
		hasControls: hasControls,
		controlTypes: controlTypes,
	};
}

// ============================================================================
// NODE SPECIFICATION DETECTION
// ============================================================================

/**
 * Extract node specification details from the node file
 */
function extractNodeSpecification(kind: string, domain: string): NodeDocData["specification"] {
	const nodeFilePath = path.join(
		process.cwd(),
		"features/business-logic-modern/node-domain",
		domain,
		`${kind}.node.tsx`
	);

	if (!fs.existsSync(nodeFilePath)) {
		return getDefaultSpecification(kind);
	}

	const nodeContent = fs.readFileSync(nodeFilePath, "utf-8");

	// Extract size information
	const sizeMatch = nodeContent.match(/size:\s*{\s*expanded:\s*(\w+),\s*collapsed:\s*(\w+)/);
	const expandedSize = sizeMatch ? sizeMatch[1] : "FE1";
	const collapsedSize = sizeMatch ? sizeMatch[2] : "C1";

	// Extract version
	const versionMatch = nodeContent.match(/version:\s*(\d+)/);
	const version = versionMatch ? Number.parseInt(versionMatch[1]) : 1;

	// Extract runtime information
	const runtimeMatch = nodeContent.match(/runtime:\s*{\s*execute:\s*["']([^"']+)["']/);
	const runtime = runtimeMatch ? { execute: runtimeMatch[1] } : undefined;

	// Extract memory configuration
	const memoryMatch = nodeContent.match(/memory:\s*{([^}]+)}/);
	const memory = memoryMatch ? parseMemoryConfig(memoryMatch[1]) : undefined;

	// Extract controls configuration
	const controlsMatch = nodeContent.match(/controls:\s*{([^}]+)}/);
	const controls = controlsMatch ? parseControlsConfig(controlsMatch[1]) : undefined;

	// Extract new NodeSpec fields
	const iconMatch = nodeContent.match(/icon:\s*["']([^"']+)["']/);
	const icon = iconMatch ? iconMatch[1] : undefined;

	const authorMatch = nodeContent.match(/author:\s*["']([^"']+)["']/);
	const author = authorMatch ? authorMatch[1] : undefined;

	const featureMatch = nodeContent.match(/feature:\s*["']([^"']+)["']/);
	const feature = featureMatch ? featureMatch[1] : undefined;

	const tagsMatch = nodeContent.match(/tags:\s*\[([^\]]+)\]/);
	const tags = tagsMatch ? parseTags(tagsMatch[1]) : undefined;

	// Extract data schema - look for Zod schema definition
	const schemaMatch = nodeContent.match(
		/const\s+\w+DataSchema\s*=\s*z\s*\.\s*object\s*\(\s*{([\s\S]*?)}\s*\)/
	);
	if (schemaMatch) {
		const _dataSchema = parseDataSchema(schemaMatch[1]);
	} else {
		// Try alternative pattern for multi-line schema with passthrough
		const altSchemaMatch = nodeContent.match(
			/const\s+\w+DataSchema\s*=\s*z\s*\.\s*object\s*\(\s*{([\s\S]*?)}\s*\)\s*\.\s*passthrough/
		);
		if (altSchemaMatch) {
			const dataSchema = parseDataSchema(altSchemaMatch[1]);
			return {
				size: {
					expanded: SIZE_MAPPINGS[expandedSize as keyof typeof SIZE_MAPPINGS] || {
						width: 120,
						height: 120,
					},
					collapsed: SIZE_MAPPINGS[collapsedSize as keyof typeof SIZE_MAPPINGS] || {
						width: 60,
						height: 60,
					},
					humanReadable: {
						expanded:
							SIZE_MAPPINGS[expandedSize as keyof typeof SIZE_MAPPINGS]?.description ||
							"Custom size",
						collapsed:
							SIZE_MAPPINGS[collapsedSize as keyof typeof SIZE_MAPPINGS]?.description ||
							"Custom size",
					},
				},
				version,
				runtime,
				memory,
				controls,
				dataSchema,
				icon,
				author,
				feature,
			};
		}
	}
	const dataSchema = schemaMatch ? parseDataSchema(schemaMatch[1]) : undefined;

	return {
		size: {
			expanded: SIZE_MAPPINGS[expandedSize as keyof typeof SIZE_MAPPINGS] || {
				width: 120,
				height: 120,
			},
			collapsed: SIZE_MAPPINGS[collapsedSize as keyof typeof SIZE_MAPPINGS] || {
				width: 60,
				height: 60,
			},
			humanReadable: {
				expanded:
					SIZE_MAPPINGS[expandedSize as keyof typeof SIZE_MAPPINGS]?.description || "Custom size",
				collapsed:
					SIZE_MAPPINGS[collapsedSize as keyof typeof SIZE_MAPPINGS]?.description || "Custom size",
			},
		},
		version,
		runtime,
		memory,
		controls,
		dataSchema,
		icon,
		author,
		feature,
		tags,
	};
}

/**
 * Parse memory configuration from node file
 */
function parseMemoryConfig(configStr: string): NodeDocData["specification"]["memory"] {
	const maxSizeMatch = configStr.match(/maxSize:\s*(\d+)/);
	const maxEntriesMatch = configStr.match(/maxEntries:\s*(\d+)/);
	const persistentMatch = configStr.match(/persistent:\s*(true|false)/);
	const evictionMatch = configStr.match(/evictionPolicy:\s*["'](\w+)["']/);

	return {
		enabled: true,
		maxSize: maxSizeMatch ? Number.parseInt(maxSizeMatch[1]) : 1024 * 1024,
		maxEntries: maxEntriesMatch ? Number.parseInt(maxEntriesMatch[1]) : 1000,
		persistent: persistentMatch ? persistentMatch[1] === "true" : false,
		evictionPolicy: evictionMatch ? evictionMatch[1] : "LRU",
	};
}

/**
 * Parse tags from node file
 */
function parseTags(tagsStr: string): string[] {
	return tagsStr
		.split(",")
		.map((tag) => tag.trim().replace(/['"]/g, ""))
		.filter((tag) => tag.length > 0);
}

/**
 * Parse controls configuration from node file
 */
function parseControlsConfig(configStr: string): NodeDocData["specification"]["controls"] {
	const autoGenerateMatch = configStr.match(/autoGenerate:\s*(true|false)/);
	const excludeFieldsMatch = configStr.match(/excludeFields:\s*\[([^\]]+)\]/);
	const customFieldsMatch = configStr.match(/customFields:\s*\[([^\]]+)\]/);

	return {
		autoGenerate: autoGenerateMatch ? autoGenerateMatch[1] === "true" : true,
		excludeFields: excludeFieldsMatch
			? excludeFieldsMatch[1].split(",").map((f) => f.trim().replace(/"/g, ""))
			: [],
		customFields: customFieldsMatch ? parseCustomFields(customFieldsMatch[1]) : [],
	};
}

/**
 * Parse custom fields from controls configuration
 */
function parseCustomFields(fieldsStr: string): Array<{
	key: string;
	type: string;
	label: string;
	placeholder?: string;
	ui?: Record<string, any>;
}> {
	// Simple parsing for common field patterns
	const fields: Array<{
		key: string;
		type: string;
		label: string;
		placeholder?: string;
		ui?: Record<string, any>;
	}> = [];

	const fieldMatches = fieldsStr.match(/{[^}]+}/g);
	if (fieldMatches) {
		fieldMatches.forEach((field) => {
			const keyMatch = field.match(/key:\s*["']([^"']+)["']/);
			const typeMatch = field.match(/type:\s*["']([^"']+)["']/);
			const labelMatch = field.match(/label:\s*["']([^"']+)["']/);
			const placeholderMatch = field.match(/placeholder:\s*["']([^"']+)["']/);

			if (keyMatch && typeMatch && labelMatch) {
				fields.push({
					key: keyMatch[1],
					type: typeMatch[1],
					label: labelMatch[1],
					placeholder: placeholderMatch ? placeholderMatch[1] : undefined,
				});
			}
		});
	}

	return fields;
}

/**
 * Parse data schema from node file
 */
function parseDataSchema(schemaStr: string): NodeDocData["specification"]["dataSchema"] {
	const fields: Array<{
		name: string;
		type: string;
		required: boolean;
		defaultValue?: any;
	}> = [];

	// Extract field definitions from Zod schema
	const lines = schemaStr
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line);

	lines.forEach((line) => {
		// Match field patterns like: text: z.string().default(""),
		const fieldMatch = line.match(
			/(\w+):\s*z\.(\w+)(?:\([^)]*\))?(?:\.(\w+)(?:\([^)]*\))?)?(?:\.(\w+)(?:\([^)]*\))?)?/
		);
		if (fieldMatch) {
			const fieldName = fieldMatch[1];
			const fieldType = fieldMatch[2];

			// Check if field is optional
			const isOptional = line.includes(".optional()");

			// Extract default value
			let defaultValue: any = undefined;
			const defaultMatch = line.match(/\.default\(([^)]+)\)/);
			if (defaultMatch) {
				const defaultStr = defaultMatch[1];
				if (defaultStr === '""') {
					defaultValue = "";
				} else if (defaultStr === "false") {
					defaultValue = false;
				} else if (defaultStr === "true") {
					defaultValue = true;
				} else if (defaultStr === "0") {
					defaultValue = 0;
				} else if (defaultStr === "[]") {
					defaultValue = [];
				} else if (defaultStr === "{}") {
					defaultValue = {};
				} else {
					defaultValue = defaultStr;
				}
			}

			// Only add if we have a valid field name and type
			if (fieldName && fieldType) {
				fields.push({
					name: fieldName,
					type: fieldType,
					required: !isOptional,
					defaultValue,
				});
			}
		}
	});

	return { fields };
}

/**
 * Get default specification for nodes without detailed specs
 */
function getDefaultSpecification(_kind: string): NodeDocData["specification"] {
	return {
		size: {
			expanded: { width: 120, height: 120 },
			collapsed: { width: 60, height: 60 },
			humanReadable: {
				expanded: "120×120px (Default expanded)",
				collapsed: "60×60px (Standard collapsed)",
			},
		},
		version: 1,
		runtime: undefined,
		memory: undefined,
		controls: undefined,
		dataSchema: undefined,
	};
}

/**
 * Extract theming information from node files
 */
function extractThemingInfo(
	kind: string,
	domain: string,
	category: string
): NodeDocData["theming"] {
	const nodeFile = path.join(
		process.cwd(),
		"features/business-logic-modern/node-domain",
		domain,
		`${kind}.node.tsx`
	);

	if (!fs.existsSync(nodeFile)) {
		return getDefaultTheming(category);
	}

	const content = fs.readFileSync(nodeFile, "utf-8");

	// Extract design tokens based on category
	const designTokens = extractDesignTokens(category, content);

	// Analyze responsive design patterns
	const responsive = analyzeResponsiveDesign(content);

	// Analyze accessibility features
	const accessibility = analyzeAccessibility(content);

	// Analyze visual states
	const visualStates = analyzeVisualStates(content);

	return {
		category,
		designTokens,
		responsive,
		accessibility,
		visualStates,
	};
}

/**
 * Extract design tokens based on category and content
 */
function extractDesignTokens(
	category: string,
	content: string
): NodeDocData["theming"]["designTokens"] {
	const categoryLower = category.toLowerCase();

	// Default tokens based on category
	const defaultTokens = {
		background: `var(--node-${categoryLower}-bg)`,
		border: `var(--node-${categoryLower}-border)`,
		text: `var(--node-${categoryLower}-text)`,
		textSecondary: `var(--node-${categoryLower}-text-secondary)`,
		hover: `var(--node-${categoryLower}-hover)`,
		selected: `var(--node-${categoryLower}-selected)`,
		error: `var(--node-${categoryLower}-error)`,
	};

	// Check for custom token usage in content
	const customTokenPatterns = [
		{ pattern: /--node-(\w+)-bg/g, property: "background" },
		{ pattern: /--node-(\w+)-border/g, property: "border" },
		{ pattern: /--node-(\w+)-text/g, property: "text" },
		{ pattern: /--node-(\w+)-text-secondary/g, property: "textSecondary" },
		{ pattern: /--node-(\w+)-hover/g, property: "hover" },
		{ pattern: /--node-(\w+)-selected/g, property: "selected" },
		{ pattern: /--node-(\w+)-error/g, property: "error" },
	];

	const tokens = { ...defaultTokens };

	customTokenPatterns.forEach(({ pattern, property }) => {
		const matches = content.match(pattern);
		if (matches && matches.length > 0) {
			tokens[property as keyof typeof tokens] =
				`var(--node-${matches[0].split("-")[2]}-${property === "textSecondary" ? "text-secondary" : property})`;
		}
	});

	return tokens;
}

/**
 * Analyze responsive design patterns
 */
function analyzeResponsiveDesign(content: string): NodeDocData["theming"]["responsive"] {
	const responsiveClasses = [
		"sm:",
		"md:",
		"lg:",
		"xl:",
		"2xl:",
		"max-sm:",
		"max-md:",
		"max-lg:",
		"max-xl:",
		"min-w-",
		"max-w-",
		"min-h-",
		"max-h-",
	];

	const hasResponsiveClasses = responsiveClasses.some((cls) => content.includes(cls));

	return {
		mobileOptimized: content.includes("sm:") || content.includes("max-sm:"),
		tabletOptimized: content.includes("md:") || content.includes("lg:"),
		desktopOptimized: content.includes("xl:") || content.includes("2xl:") || hasResponsiveClasses,
	};
}

/**
 * Analyze accessibility features
 */
function analyzeAccessibility(content: string): NodeDocData["theming"]["accessibility"] {
	const ariaLabels = (content.match(/aria-label="([^"]+)"/g) || []).map((label) =>
		label.replace('aria-label="', "").replace('"', "")
	);

	const hasKeyboardSupport =
		content.includes("onKeyDown") ||
		content.includes("onKeyUp") ||
		content.includes("onKeyPress") ||
		content.includes("tabIndex");

	const hasScreenReaderSupport =
		ariaLabels.length > 0 || content.includes("role=") || content.includes("aria-");

	const hasFocusManagement =
		content.includes("focus") || content.includes("blur") || content.includes("tabIndex");

	return {
		ariaLabels,
		keyboardSupport: hasKeyboardSupport,
		screenReaderSupport: hasScreenReaderSupport,
		focusManagement: hasFocusManagement,
	};
}

/**
 * Analyze visual states
 */
function analyzeVisualStates(content: string): NodeDocData["theming"]["visualStates"] {
	return {
		hover: content.includes("hover:") || content.includes("onMouseEnter"),
		selected: content.includes("selected") || content.includes("isSelected"),
		active: content.includes("active") || content.includes("isActive"),
		error: content.includes("error") || content.includes("isError"),
		disabled: content.includes("disabled") || content.includes("isDisabled"),
	};
}

/**
 * Get default theming configuration
 */
function getDefaultTheming(category: string): NodeDocData["theming"] {
	const categoryLower = category.toLowerCase();

	return {
		category,
		designTokens: {
			background: `var(--node-${categoryLower}-bg)`,
			border: `var(--node-${categoryLower}-border)`,
			text: `var(--node-${categoryLower}-text)`,
			textSecondary: `var(--node-${categoryLower}-text-secondary)`,
			hover: `var(--node-${categoryLower}-hover)`,
			selected: `var(--node-${categoryLower}-selected)`,
			error: `var(--node-${categoryLower}-error)`,
		},
		responsive: {
			mobileOptimized: true,
			tabletOptimized: true,
			desktopOptimized: true,
		},
		accessibility: {
			ariaLabels: [],
			keyboardSupport: true,
			screenReaderSupport: true,
			focusManagement: true,
		},
		visualStates: {
			hover: true,
			selected: true,
			active: true,
			error: true,
			disabled: false,
		},
	};
}

// ============================================================================
// DOCUMENTATION GENERATION
// ============================================================================

/**
 * Generate comprehensive documentation for a node
 */
export function generateNodeDocumentation(nodeData: NodeDocData) {
	// Detect infrastructure integration
	const infrastructure = {
		sidebar: detectSidebarIntegration(nodeData.kind, nodeData.category),
		inspector: detectInspectorIntegration(nodeData.kind),
	};
	nodeData.infrastructure = infrastructure;

	// Extract node specification
	nodeData.specification = extractNodeSpecification(nodeData.kind, nodeData.domain);

	// Extract theming information
	nodeData.theming = extractThemingInfo(nodeData.kind, nodeData.domain, nodeData.category);

	// Generate all documentation formats
	generateMarkdownDoc(nodeData);
	generateHTMLDoc(nodeData);
	generateAPIDoc(nodeData);
	updateDocsIndex(nodeData);
}

/**
 * Generate markdown documentation
 */
function generateMarkdownDoc(nodeData: NodeDocData) {
	const {
		kind,
		domain,
		category,
		displayName,
		description,
		inputs,
		outputs,
		examples,
		relatedNodes,
	} = nodeData;
	const infrastructure = nodeData.infrastructure;
	const spec = nodeData.specification;

	const docsDir = path.join(process.cwd(), "documentation", "nodes", domain);
	if (!fs.existsSync(docsDir)) {
		fs.mkdirSync(docsDir, { recursive: true });
	}

	const markdownContent = `# ${displayName} Node Documentation

## Overview

**Node Type**: \`${kind}\`  
**Domain**: ${domain}  
**Category**: ${category}  
**Display Name**: ${displayName}
${spec.icon ? `**Icon**: ${spec.icon}` : ""}
${spec.author ? `**Author**: ${spec.author}` : ""}
${spec.feature ? `**Feature**: ${spec.feature}` : ""}
${spec.tags && spec.tags.length > 0 ? `**Tags**: ${spec.tags.join(", ")}` : ""}

${description}

## Node Specification

### Size Configuration
- **Expanded Size**: ${spec.size.humanReadable.expanded}
- **Collapsed Size**: ${spec.size.humanReadable.collapsed}
- **Dimensions**: ${spec.size.expanded.width}×${spec.size.expanded.height} (expanded) / ${spec.size.collapsed.width}×${spec.size.collapsed.height} (collapsed)

### Version Information
- **Schema Version**: ${spec.version}
- **Runtime Version**: ${spec.runtime?.execute || "Not specified"}

### Memory Configuration
${
	spec.memory
		? `
- **Memory Enabled**: ✅ Yes
- **Max Size**: ${formatBytes(spec.memory.maxSize || 0)}
- **Max Entries**: ${spec.memory.maxEntries?.toLocaleString() || "1,000"}
- **Persistent**: ${spec.memory.persistent ? "✅ Yes" : "❌ No"}
- **Eviction Policy**: ${spec.memory.evictionPolicy || "LRU"}
`
		: `
- **Memory Enabled**: ❌ No
- **Memory System**: Not configured
`
}

### Controls Configuration
${
	spec.controls
		? `
- **Auto-Generate Controls**: ${spec.controls.autoGenerate ? "✅ Yes" : "❌ No"}
- **Excluded Fields**: ${spec.controls.excludeFields.length > 0 ? spec.controls.excludeFields.join(", ") : "None"}
- **Custom Fields**: ${spec.controls.customFields.length > 0 ? spec.controls.customFields.map((f) => f.label).join(", ") : "None"}
`
		: `
- **Controls**: Not configured
`
}

### Data Schema
${
	spec.dataSchema
		? `
${spec.dataSchema.fields.map((field) => `- **${field.name}** (${field.type})${field.required ? " - Required" : " - Optional"}`).join("\n")}
`
		: `
- **Schema**: Not specified
`
}

## Theming & Design System

### Design Tokens
- **Background**: \`${nodeData.theming.designTokens.background}\`
- **Border**: \`${nodeData.theming.designTokens.border}\`
- **Text**: \`${nodeData.theming.designTokens.text}\`
- **Text Secondary**: \`${nodeData.theming.designTokens.textSecondary}\`
- **Hover**: \`${nodeData.theming.designTokens.hover}\`
- **Selected**: \`${nodeData.theming.designTokens.selected}\`
- **Error**: \`${nodeData.theming.designTokens.error}\`

### Responsive Design
- **Mobile Optimized**: ${nodeData.theming.responsive.mobileOptimized ? "✅ Yes" : "❌ No"}
- **Tablet Optimized**: ${nodeData.theming.responsive.tabletOptimized ? "✅ Yes" : "❌ No"}
- **Desktop Optimized**: ${nodeData.theming.responsive.desktopOptimized ? "✅ Yes" : "❌ No"}

### Accessibility Features
- **Keyboard Support**: ${nodeData.theming.accessibility.keyboardSupport ? "✅ Yes" : "❌ No"}
- **Screen Reader Support**: ${nodeData.theming.accessibility.screenReaderSupport ? "✅ Yes" : "❌ No"}
- **Focus Management**: ${nodeData.theming.accessibility.focusManagement ? "✅ Yes" : "❌ No"}
- **ARIA Labels**: ${nodeData.theming.accessibility.ariaLabels.length > 0 ? nodeData.theming.accessibility.ariaLabels.join(", ") : "None"}

### Visual States
- **Hover State**: ${nodeData.theming.visualStates.hover ? "✅ Supported" : "❌ Not Supported"}
- **Selected State**: ${nodeData.theming.visualStates.selected ? "✅ Supported" : "❌ Not Supported"}
- **Active State**: ${nodeData.theming.visualStates.active ? "✅ Supported" : "❌ Not Supported"}
- **Error State**: ${nodeData.theming.visualStates.error ? "✅ Supported" : "❌ Not Supported"}
- **Disabled State**: ${nodeData.theming.visualStates.disabled ? "✅ Supported" : "❌ Not Supported"}

## Infrastructure Integration

### Sidebar Integration
- **Status**: ${infrastructure?.sidebar.integrated ? "✅ Integrated" : "❌ Not Integrated"}
- **Category**: ${infrastructure?.sidebar.category}
- **Folder**: ${infrastructure?.sidebar.folder || "Default"}
- **Order**: ${infrastructure?.sidebar.order || "Default"}

### Inspector Integration
- **Status**: ${infrastructure?.inspector.integrated ? "✅ Integrated" : "❌ Not Integrated"}
- **Inspector Key**: \`${infrastructure?.inspector.key}\`
- **Has Controls**: ${infrastructure?.inspector.hasControls ? "✅ Yes" : "❌ No"}
- **Control Types**: ${infrastructure?.inspector?.controlTypes?.length > 0 ? infrastructure.inspector.controlTypes?.join(", ") : "None"}

## Node Interface

### Inputs
${inputs.map((input) => `- **${input.id}** (${input.type}) - ${input.description} [${input.position}]`).join("\n")}

### Outputs
${outputs.map((output) => `- **${output.id}** (${output.type}) - ${output.description} [${output.position}]`).join("\n")}

## Usage Examples

${examples
	.map(
		(example) => `### ${example.title}

${example.description}

\`\`\`typescript
${example.code}
\`\`\`
`
	)
	.join("\n")}

## Related Nodes

${relatedNodes.map((node) => `- ${node}`).join("\n")}

## Technical Details

### NodeSpec Configuration
\`\`\`typescript
const spec: NodeSpec = {
  kind: "${kind}",
  displayName: "${displayName}",
  category: "${category}",
  size: {
    expanded: { width: ${spec.size.expanded.width}, height: ${typeof spec.size.expanded.height === "string" ? `"${spec.size.expanded.height}"` : spec.size.expanded.height} },
    collapsed: { width: ${spec.size.collapsed.width}, height: ${spec.size.collapsed.height} }
  },
  version: ${spec.version},
  ${spec.runtime ? `runtime: { execute: "${spec.runtime.execute}" },` : ""}
  ${spec.memory ? `memory: { maxSize: ${spec.memory.maxSize}, maxEntries: ${spec.memory.maxEntries}, persistent: ${spec.memory.persistent}, evictionPolicy: "${spec.memory.evictionPolicy}" },` : ""}
  // ... additional configuration
};
\`\`\`

### Data Schema
\`\`\`typescript
const ${displayName}DataSchema = z.object({
  // Schema definition
});
\`\`\`

## Integration Status

| Component | Status | Details |
|-----------|--------|---------|
| **Sidebar** | ${infrastructure?.sidebar.integrated ? "✅ Integrated" : "❌ Not Integrated"} | ${infrastructure?.sidebar.integrated ? `Available in ${infrastructure.sidebar.category} category` : "Not available in sidebar"} |
| **Inspector** | ${infrastructure?.inspector.integrated ? "✅ Integrated" : "❌ Not Integrated"} | ${infrastructure?.inspector.hasControls ? "Has dynamic controls" : "No custom controls"} |
| **Registry** | ✅ Registered | Node is registered in the NodeSpec registry |
| **Flow Engine** | ✅ Available | Node can be used in React Flow |
| **Memory System** | ${spec.memory ? "✅ Configured" : "❌ Not configured"} | ${spec.memory ? `Uses ${formatBytes(spec.memory.maxSize || 0)} memory with ${spec.memory.evictionPolicy} eviction` : "No memory configuration"} |

## Development Notes

This node follows the modern NodeSpec architecture and integrates with:
- **Sidebar System**: ${infrastructure?.sidebar.integrated ? "Available for drag-and-drop creation" : "Not available in sidebar"}
- **Inspector System**: ${infrastructure?.inspector.integrated ? "Has dynamic controls in Node Inspector" : "No custom inspector controls"}
- **Theming System**: Uses category-based theming (${category})
- **Validation System**: Schema-driven validation with Zod
- **Memory System**: ${spec.memory ? `Configured with ${formatBytes(spec.memory.maxSize || 0)} capacity` : "Not configured"}
`;

	const markdownPath = path.join(docsDir, `${kind}.md`);
	fs.writeFileSync(markdownPath, markdownContent);
}

/**
 * Generate HTML documentation
 */
function generateHTMLDoc(nodeData: NodeDocData) {
	const { kind, domain, displayName, description, inputs, outputs, examples } = nodeData;
	const infrastructure = nodeData.infrastructure;
	const spec = nodeData.specification;

	const docsDir = path.join(process.cwd(), "documentation", "nodes", domain);
	if (!fs.existsSync(docsDir)) {
		fs.mkdirSync(docsDir, { recursive: true });
	}

	const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${displayName} Node Documentation</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; }
        .content { padding: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .integration-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
        .integration-card { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 20px; }
        .integration-card h3 { margin-top: 0; color: #495057; }
        .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .status.success { background: #d4edda; color: #155724; }
        .status.error { background: #f8d7da; color: #721c24; }
        .code-block { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; padding: 15px; overflow-x: auto; }
        .example { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 10px 0; }
        .io-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .io-section { background: #f8f9fa; border-radius: 6px; padding: 20px; }
        .io-item { background: white; border: 1px solid #e9ecef; border-radius: 4px; padding: 10px; margin: 5px 0; }
        .io-item strong { color: #495057; }
        .io-item .type { color: #6c757d; font-size: 0.9em; }
        .spec-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin: 20px 0; }
        .spec-card { background: #e3f2fd; border: 1px solid #bbdefb; border-radius: 6px; padding: 15px; }
        .spec-card h4 { margin-top: 0; color: #1976d2; }
        .spec-value { font-weight: bold; color: #0d47a1; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${displayName} Node</h1>
            <p>${description}</p>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>Node Specification</h2>
                <div class="spec-grid">
                    <div class="spec-card">
                        <h4>Size Configuration</h4>
                        <p><strong>Expanded:</strong> <span class="spec-value">${spec.size.humanReadable.expanded}</span></p>
                        <p><strong>Collapsed:</strong> <span class="spec-value">${spec.size.humanReadable.collapsed}</span></p>
                    </div>
                    
                    <div class="spec-card">
                        <h4>Version Information</h4>
                        <p><strong>Schema Version:</strong> <span class="spec-value">${spec.version}</span></p>
                        <p><strong>Runtime:</strong> <span class="spec-value">${spec.runtime?.execute || "Not specified"}</span></p>
                    </div>
                    
                    <div class="spec-card">
                        <h4>Memory Configuration</h4>
                        ${
													spec.memory
														? `
                        <p><strong>Enabled:</strong> <span class="spec-value">✅ Yes</span></p>
                        <p><strong>Max Size:</strong> <span class="spec-value">${formatBytes(spec.memory.maxSize || 0)}</span></p>
                        <p><strong>Max Entries:</strong> <span class="spec-value">${spec.memory.maxEntries?.toLocaleString() || "1,000"}</span></p>
                        <p><strong>Persistent:</strong> <span class="spec-value">${spec.memory.persistent ? "✅ Yes" : "❌ No"}</span></p>
                        <p><strong>Eviction:</strong> <span class="spec-value">${spec.memory.evictionPolicy || "LRU"}</span></p>
                        `
														: `
                        <p><strong>Enabled:</strong> <span class="spec-value">❌ No</span></p>
                        <p><strong>Configuration:</strong> <span class="spec-value">Not configured</span></p>
                        `
												}
                    </div>
                    
                    <div class="spec-card">
                        <h4>Controls Configuration</h4>
                        ${
													spec.controls
														? `
                        <p><strong>Auto-Generate:</strong> <span class="spec-value">${spec.controls.autoGenerate ? "✅ Yes" : "❌ No"}</span></p>
                        <p><strong>Excluded Fields:</strong> <span class="spec-value">${spec.controls.excludeFields.length > 0 ? spec.controls.excludeFields.join(", ") : "None"}</span></p>
                        <p><strong>Custom Fields:</strong> <span class="spec-value">${spec.controls.customFields.length > 0 ? spec.controls.customFields.map((f) => f.label).join(", ") : "None"}</span></p>
                        `
														: `
                        <p><strong>Configuration:</strong> <span class="spec-value">Not configured</span></p>
                        `
												}
                    </div>
                    
                    <div class="spec-card">
                        <h4>Theming & Design</h4>
                        <p><strong>Category:</strong> <span class="spec-value">${nodeData.theming.category}</span></p>
                        <p><strong>Background:</strong> <span class="spec-value">${nodeData.theming.designTokens.background}</span></p>
                        <p><strong>Border:</strong> <span class="spec-value">${nodeData.theming.designTokens.border}</span></p>
                        <p><strong>Text:</strong> <span class="spec-value">${nodeData.theming.designTokens.text}</span></p>
                    </div>
                    
                    <div class="spec-card">
                        <h4>Responsive Design</h4>
                        <p><strong>Mobile:</strong> <span class="spec-value">${nodeData.theming.responsive.mobileOptimized ? "✅ Optimized" : "❌ Not optimized"}</span></p>
                        <p><strong>Tablet:</strong> <span class="spec-value">${nodeData.theming.responsive.tabletOptimized ? "✅ Optimized" : "❌ Not optimized"}</span></p>
                        <p><strong>Desktop:</strong> <span class="spec-value">${nodeData.theming.responsive.desktopOptimized ? "✅ Optimized" : "❌ Not optimized"}</span></p>
                    </div>
                    
                    <div class="spec-card">
                        <h4>Accessibility</h4>
                        <p><strong>Keyboard:</strong> <span class="spec-value">${nodeData.theming.accessibility.keyboardSupport ? "✅ Supported" : "❌ Not supported"}</span></p>
                        <p><strong>Screen Reader:</strong> <span class="spec-value">${nodeData.theming.accessibility.screenReaderSupport ? "✅ Supported" : "❌ Not supported"}</span></p>
                        <p><strong>Focus Management:</strong> <span class="spec-value">${nodeData.theming.accessibility.focusManagement ? "✅ Supported" : "❌ Not supported"}</span></p>
                        <p><strong>ARIA Labels:</strong> <span class="spec-value">${nodeData.theming.accessibility.ariaLabels.length > 0 ? nodeData.theming.accessibility.ariaLabels.join(", ") : "None"}</span></p>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>Infrastructure Integration</h2>
                <div class="integration-grid">
                    <div class="integration-card">
                        <h3>Sidebar Integration</h3>
                        <p><span class="status ${infrastructure?.sidebar.integrated ? "success" : "error"}">${infrastructure?.sidebar.integrated ? "Integrated" : "Not Integrated"}</span></p>
                        <p><strong>Category:</strong> ${infrastructure?.sidebar.category}</p>
                        <p><strong>Folder:</strong> ${infrastructure?.sidebar.folder || "Default"}</p>
                        <p><strong>Order:</strong> ${infrastructure?.sidebar.order || "Default"}</p>
                    </div>
                    
                    <div class="integration-card">
                        <h3>Inspector Integration</h3>
                        <p><span class="status ${infrastructure?.inspector.integrated ? "success" : "error"}">${infrastructure?.inspector.integrated ? "Integrated" : "Not Integrated"}</span></p>
                        <p><strong>Inspector Key:</strong> <code>${infrastructure?.inspector.key}</code></p>
                        <p><strong>Has Controls:</strong> ${infrastructure?.inspector.hasControls ? "Yes" : "No"}</p>
                        <p><strong>Control Types:</strong> ${infrastructure?.inspector?.controlTypes?.length > 0 ? infrastructure.inspector.controlTypes?.join(", ") : "None"}</p>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>Theming & Design System</h2>
                <div class="integration-grid">
                    <div class="integration-card">
                        <h3>Design Tokens</h3>
                        <p><strong>Background:</strong> <code>${nodeData.theming.designTokens.background}</code></p>
                        <p><strong>Border:</strong> <code>${nodeData.theming.designTokens.border}</code></p>
                        <p><strong>Text:</strong> <code>${nodeData.theming.designTokens.text}</code></p>
                        <p><strong>Text Secondary:</strong> <code>${nodeData.theming.designTokens.textSecondary}</code></p>
                        <p><strong>Hover:</strong> <code>${nodeData.theming.designTokens.hover}</code></p>
                        <p><strong>Selected:</strong> <code>${nodeData.theming.designTokens.selected}</code></p>
                        <p><strong>Error:</strong> <code>${nodeData.theming.designTokens.error}</code></p>
                    </div>
                    
                    <div class="integration-card">
                        <h3>Visual States</h3>
                        <p><strong>Hover:</strong> <span class="status ${nodeData.theming.visualStates.hover ? "success" : "error"}">${nodeData.theming.visualStates.hover ? "Supported" : "Not Supported"}</span></p>
                        <p><strong>Selected:</strong> <span class="status ${nodeData.theming.visualStates.selected ? "success" : "error"}">${nodeData.theming.visualStates.selected ? "Supported" : "Not Supported"}</span></p>
                        <p><strong>Active:</strong> <span class="status ${nodeData.theming.visualStates.active ? "success" : "error"}">${nodeData.theming.visualStates.active ? "Supported" : "Not Supported"}</span></p>
                        <p><strong>Error:</strong> <span class="status ${nodeData.theming.visualStates.error ? "success" : "error"}">${nodeData.theming.visualStates.error ? "Supported" : "Not Supported"}</span></p>
                        <p><strong>Disabled:</strong> <span class="status ${nodeData.theming.visualStates.disabled ? "success" : "error"}">${nodeData.theming.visualStates.disabled ? "Supported" : "Not Supported"}</span></p>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>Node Interface</h2>
                <div class="io-grid">
                    <div class="io-section">
                        <h3>Inputs</h3>
                        ${inputs
													.map(
														(input) => `
                        <div class="io-item">
                            <strong>${input.id}</strong> <span class="type">(${input.type})</span>
                            <br><small>${input.description} [${input.position}]</small>
                        </div>
                        `
													)
													.join("")}
                    </div>
                    
                    <div class="io-section">
                        <h3>Outputs</h3>
                        ${outputs
													.map(
														(output) => `
                        <div class="io-item">
                            <strong>${output.id}</strong> <span class="type">(${output.type})</span>
                            <br><small>${output.description} [${output.position}]</small>
                        </div>
                        `
													)
													.join("")}
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>Usage Examples</h2>
                ${examples
									.map(
										(example) => `
                <div class="example">
                    <h3>${example.title}</h3>
                    <p>${example.description}</p>
                    <div class="code-block">
                        <pre><code>${example.code}</code></pre>
                    </div>
                </div>
                `
									)
									.join("")}
            </div>
        </div>
    </div>
</body>
</html>`;

	const htmlPath = path.join(docsDir, `${kind}.html`);
	fs.writeFileSync(htmlPath, htmlContent);
}

/**
 * Generate API documentation
 */
function generateAPIDoc(nodeData: NodeDocData) {
	const { kind, displayName, inputs, outputs, category } = nodeData;
	const infrastructure = nodeData.infrastructure;
	const spec = nodeData.specification;

	// Fix interface name (remove spaces and make camelCase)
	const interfaceName = `${displayName.replace(/\s+/g, "")}Data`;

	const apiDir = path.join(process.cwd(), "documentation", "api");
	if (!fs.existsSync(apiDir)) {
		fs.mkdirSync(apiDir, { recursive: true });
	}

	// Generate data schema fields
	const _schemaFields =
		spec.dataSchema?.fields
			.map((field) => {
				const zodType =
					field.type === "string"
						? "string"
						: field.type === "number"
							? "number"
							: field.type === "boolean"
								? "boolean"
								: field.type === "array"
									? "array"
									: field.type === "object"
										? "object"
										: "string";

				return `  ${field.name}: z.${zodType}()${field.required ? "" : ".optional()"}${field.defaultValue !== undefined ? `.default(${JSON.stringify(field.defaultValue)})` : ""},`;
			})
			.join("\n") || "  // Define your Zod schema fields here";

	// Generate handle specifications
	const handleSpecs = [...inputs, ...outputs]
		.map((handle) => {
			// Map handle types to proper codes based on actual node specification
			let code = "j"; // default to JSON
			if (handle.type.includes("string") || handle.type.includes("text") || handle.type === "s") {
				code = "s";
			} else if (
				handle.type.includes("number") ||
				handle.type.includes("num") ||
				handle.type === "n"
			) {
				code = "n";
			} else if (
				handle.type.includes("boolean") ||
				handle.type.includes("bool") ||
				handle.type === "b"
			) {
				code = "b";
			} else if (handle.type.includes("array") || handle.type === "a") {
				code = "a";
			} else if (handle.type.includes("object") || handle.type === "o") {
				code = "o";
			} else if (handle.type === "j") {
				code = "j";
			}

			return `    { id: "${handle.id}", code: "${code}", position: "${handle.position}", type: "${handle.type}" },`;
		})
		.join("\n");

	// Generate initial data
	const initialDataFields =
		spec.dataSchema?.fields
			.map(
				(field) =>
					`    ${field.name}: ${field.defaultValue !== undefined ? JSON.stringify(field.defaultValue) : "null"},`
			)
			.join("\n") || "    // Define initial data properties here";

	const apiContent = `/**
 * ${displayName} Node - API Reference
 * 
 * Infrastructure Integration Status:
 * - Sidebar: ${infrastructure?.sidebar.integrated ? "Integrated" : "Not Integrated"}
 * - Inspector: ${infrastructure?.inspector.integrated ? "Integrated" : "Not Integrated"}
 * - Memory: ${spec.memory ? "Configured" : "Not configured"}
 * 
 * Node Specification:
 * - Size: ${spec.size.humanReadable.expanded} / ${spec.size.humanReadable.collapsed}
 * - Version: ${spec.version}
 * - Runtime: ${spec.runtime?.execute || "Not specified"}
 * ${spec.icon ? `- Icon: ${spec.icon}` : ""}
 * ${spec.author ? `- Author: ${spec.author}` : ""}
 * ${spec.feature ? `- Feature: ${spec.feature}` : ""}
 * 
 * Theming & Design:
 * - Category: ${nodeData.theming.category}
 * - Design Tokens: ${nodeData.theming.designTokens.background}, ${nodeData.theming.designTokens.border}, ${nodeData.theming.designTokens.text}
 * - Responsive: ${nodeData.theming.responsive.mobileOptimized ? "Mobile" : ""}${nodeData.theming.responsive.tabletOptimized ? " Tablet" : ""}${nodeData.theming.responsive.desktopOptimized ? " Desktop" : ""} optimized
 * - Accessibility: ${nodeData.theming.accessibility.keyboardSupport ? "Keyboard" : ""}${nodeData.theming.accessibility.screenReaderSupport ? " Screen Reader" : ""}${nodeData.theming.accessibility.focusManagement ? " Focus Management" : ""} supported
 */

import React from 'react';
import { z } from 'zod';
import type { NodeProps } from '@xyflow/react';

// Node Data Schema
export const ${interfaceName}Schema = z.object({
${
	spec.dataSchema?.fields
		.map(
			(field) =>
				`  /** ${field.required ? "Required" : "Optional"} ${field.type} field${field.defaultValue !== undefined ? ` (default: ${JSON.stringify(field.defaultValue)})` : ""} */
  ${field.name}: z.${field.type === "string" ? "string" : field.type === "boolean" ? "boolean" : field.type === "number" ? "number" : "string"}().default(${field.defaultValue !== undefined ? JSON.stringify(field.defaultValue) : field.type === "string" ? '""' : field.type === "boolean" ? "false" : field.type === "number" ? "0" : '""'}),`
		)
		.join("\n") || "  // Define your node data properties here"
}
});

// Type inference from schema
export type ${interfaceName} = z.infer<typeof ${interfaceName}Schema>;

// Node Specification
export const ${kind}Spec = {
  kind: '${kind}',
  displayName: '${displayName}',
  category: '${category}',
  size: {
    expanded: { width: ${spec.size.expanded.width}, height: ${typeof spec.size.expanded.height === "string" ? `"${spec.size.expanded.height}"` : spec.size.expanded.height} },
    collapsed: { width: ${spec.size.collapsed.width}, height: ${spec.size.collapsed.height} }
  },
  version: ${spec.version},
  ${spec.runtime ? `runtime: { execute: "${spec.runtime.execute}" },` : ""}
  ${
		spec.memory
			? `memory: { 
    enabled: ${spec.memory.enabled},
    maxSize: ${spec.memory.maxSize || 0}, 
    maxEntries: ${spec.memory.maxEntries || 1000}, 
    persistent: ${spec.memory.persistent}, 
    evictionPolicy: "${spec.memory.evictionPolicy || "LRU"}" 
  },`
			: ""
	}
  handles: [
${handleSpecs}
  ],
  inspector: {
    key: '${infrastructure?.inspector.key}'
  },
  initialData: {
${initialDataFields}
  },
  controls: {
    autoGenerate: ${true},
    excludeFields: ${spec.controls ? JSON.stringify(spec.controls.excludeFields) : "[]"},
    customFields: ${spec.controls ? JSON.stringify(spec.controls.customFields, null, 2) : "[]"}
  },
  ${spec.icon ? `icon: '${spec.icon}',` : ""}
  ${spec.author ? `author: '${spec.author}',` : ""}
  ${nodeData.description ? `description: '${nodeData.description}',` : ""}
  ${spec.feature ? `feature: '${spec.feature}',` : ""}
};

// Node Component
export const ${displayName.replace(/\s+/g, "")}Node = ({ data, id }: NodeProps) => {
  // Your node component implementation
  return React.createElement('div', null, 'Node content goes here');
};

// Export for use in other modules
export default ${displayName.replace(/\s+/g, "")}Node;
`;

	const apiPath = path.join(apiDir, `${kind}.ts`);
	fs.writeFileSync(apiPath, apiContent);
}

/**
 * Update documentation index
 */
function updateDocsIndex(nodeData: NodeDocData) {
	const { kind, domain, displayName } = nodeData;

	const indexPath = path.join(process.cwd(), "documentation", "nodes", "README.md");
	let indexContent = "";

	if (fs.existsSync(indexPath)) {
		indexContent = fs.readFileSync(indexPath, "utf-8");
	} else {
		indexContent = `# Node Documentation

## Available Nodes

`;
	}

	// Add node to index if not already present
	if (!indexContent.includes(`- [${displayName}](./${domain}/${kind}.md)`)) {
		const nodeEntry = `- [${displayName}](./${domain}/${kind}.md) - ${nodeData.description}`;

		// Find the right section to add the node
		if (indexContent.includes("## Available Nodes")) {
			const lines = indexContent.split("\n");
			const availableNodesIndex = lines.findIndex((line) => line === "## Available Nodes");
			lines.splice(availableNodesIndex + 1, 0, nodeEntry);
			indexContent = lines.join("\n");
		} else {
			indexContent += `\n${nodeEntry}\n`;
		}

		fs.writeFileSync(indexPath, indexContent);
	}
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes: number): string {
	if (bytes === 0) {
		return "0 Bytes";
	}
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function extractHandlesFromNodeFile(
	kind: string,
	domain: string
): {
	inputs: Array<{ id: string; type: string; description: string; position: string }>;
	outputs: Array<{ id: string; type: string; description: string; position: string }>;
} {
	const nodeFilePath = path.join(
		process.cwd(),
		"features",
		"business-logic-modern",
		"node-domain",
		domain,
		`${kind}.node.tsx`
	);

	if (!fs.existsSync(nodeFilePath)) {
		console.warn(`⚠️  Node file not found: ${nodeFilePath}`);
		return { inputs: [], outputs: [] };
	}

	try {
		const content = fs.readFileSync(nodeFilePath, "utf8");

		// Extract handles array from the spec
		const handlesMatch = content.match(/handles:\s*\[([\s\S]*?)\]/);
		if (!handlesMatch) {
			console.warn(`⚠️  No handles found in ${kind} node`);
			return { inputs: [], outputs: [] };
		}

		const handlesContent = handlesMatch[1];

		// Parse individual handle objects
		const handleMatches = handlesContent.match(/\{[^}]*\}/g);
		if (!handleMatches) {
			return { inputs: [], outputs: [] };
		}

		const inputs: Array<{ id: string; type: string; description: string; position: string }> = [];
		const outputs: Array<{ id: string; type: string; description: string; position: string }> = [];

		handleMatches.forEach((handleStr) => {
			// Extract handle properties
			const idMatch = handleStr.match(/id:\s*['"`]([^'"`]+)['"`]/);
			const typeMatch = handleStr.match(/type:\s*['"`]([^'"`]+)['"`]/);
			const dataTypeMatch = handleStr.match(/dataType:\s*['"`]([^'"`]+)['"`]/);
			const positionMatch = handleStr.match(/position:\s*['"`]([^'"`]+)['"`]/);

			if (idMatch && typeMatch && positionMatch) {
				const id = idMatch[1];
				const type = typeMatch[1];
				const dataType = dataTypeMatch ? dataTypeMatch[1] : "any";
				const position = positionMatch[1];

				// Generate description based on handle properties
				let description = "";
				if (type === "target") {
					description = `Input ${dataType} data`;
				} else if (type === "source") {
					description = `Output ${dataType} data`;
				}

				const handle = {
					id,
					type: dataType,
					description,
					position,
				};

				if (type === "target") {
					inputs.push(handle);
				} else if (type === "source") {
					outputs.push(handle);
				}
			}
		});

		return { inputs, outputs };
	} catch (error) {
		console.error(`❌ Error reading ${kind} node file:`, error);
		return { inputs: [], outputs: [] };
	}
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Generate documentation for a specific node
 */
export function generateNodeDocs(
	kind: string,
	domain: string,
	category: string,
	displayName: string
) {
	const nodeData: NodeDocData = {
		kind,
		domain,
		category,
		displayName,
		description: `The ${displayName} node provides functionality for ${domain} operations in the ${category} category.`,
		inputs: [],
		outputs: [],
		examples: [
			{
				title: "Basic Usage",
				description: "Create a basic instance of the node",
				code: `const node = {
  id: '${kind}-1',
  type: '${kind}',
  data: {
    // Your node data here
  }
};`,
			},
		],
		relatedNodes: [],
		infrastructure: {
			sidebar: {
				integrated: false,
				category: category,
			},
			inspector: {
				integrated: false,
				key: `${kind}Inspector`,
				hasControls: false,
				controlTypes: [],
			},
		},
		specification: {
			size: {
				expanded: { width: 120, height: 120 },
				collapsed: { width: 60, height: 60 },
				humanReadable: {
					expanded: "120×120px (Default expanded)",
					collapsed: "60×60px (Standard collapsed)",
				},
			},
			version: 1,
			runtime: undefined,
			memory: undefined,
			controls: undefined,
			dataSchema: undefined,
		},
		theming: {
			category: category,
			designTokens: {
				background: `var(--node-${category.toLowerCase()}-bg)`,
				border: `var(--node-${category.toLowerCase()}-border)`,
				text: `var(--node-${category.toLowerCase()}-text)`,
				textSecondary: `var(--node-${category.toLowerCase()}-text-secondary)`,
				hover: `var(--node-${category.toLowerCase()}-hover)`,
				selected: `var(--node-${category.toLowerCase()}-selected)`,
				error: `var(--node-${category.toLowerCase()}-error)`,
			},
			responsive: {
				mobileOptimized: true,
				tabletOptimized: true,
				desktopOptimized: true,
			},
			accessibility: {
				ariaLabels: [],
				keyboardSupport: true,
				screenReaderSupport: true,
				focusManagement: true,
			},
			visualStates: {
				hover: true,
				selected: true,
				active: true,
				error: true,
				disabled: false,
			},
		},
	};

	// Extract handles from the node file
	const { inputs, outputs } = extractHandlesFromNodeFile(kind, domain);
	nodeData.inputs = inputs;
	nodeData.outputs = outputs;

	generateNodeDocumentation(nodeData);
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

if (require.main === module) {
	const args = process.argv.slice(2);

	if (args.length < 4) {
		console.error("Usage: node generate-node-docs.ts <kind> <domain> <category> <displayName>");
		process.exit(1);
	}

	const [kind, domain, category, displayName] = args;
	generateNodeDocs(kind, domain, category, displayName);
}
