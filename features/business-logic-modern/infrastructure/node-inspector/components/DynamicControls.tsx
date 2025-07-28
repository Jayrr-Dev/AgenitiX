/**
 * DYNAMIC CONTROLS COMPONENT - Apple-Inspired Clean Interface
 *
 * • Beautiful, minimal controls following Apple's design principles
 * • Schema-driven automatic generation with zero maintenance
 * • Clean typography, perfect spacing, and intuitive interactions
 * • Focused on essential functionality with elegant simplicity
 * • Scales to 400+ node types with consistent visual language
 *
 * Keywords: apple-design, clean-ui, schema-driven, minimal-interface, scalable
 */

"use client";

import type React from "react";
import { useCallback, useMemo, useState } from "react";
import type { AgenNode } from "../../flow-engine/types/nodeData";
import { type ControlField, NodeInspectorService } from "../services/NodeInspectorService";

// ============================================================================
// CONSTANTS - Apple Design System
// ============================================================================

const _APPLE_COLORS = {
	primary: "rgb(0, 122, 255)",
	success: "rgb(52, 199, 89)",
	warning: "rgb(255, 149, 0)",
	danger: "rgb(255, 59, 48)",
	gray: {
		50: "rgb(249, 249, 249)",
		100: "rgb(242, 242, 247)",
		200: "rgb(229, 229, 234)",
		300: "rgb(199, 199, 204)",
		400: "rgb(142, 142, 147)",
		500: "rgb(99, 99, 102)",
		600: "rgb(72, 72, 74)",
		700: "rgb(58, 58, 60)",
		800: "rgb(44, 44, 46)",
		900: "rgb(28, 28, 30)",
	},
} as const;

const _APPLE_SPACING = {
	xs: "4px",
	sm: "8px",
	md: "12px",
	lg: "16px",
	xl: "20px",
	xxl: "24px",
} as const;

// ============================================================================
// COMPONENT INTERFACE
// ============================================================================

interface DynamicControlsProps {
	node: AgenNode;
	updateNodeData: (id: string, patch: Record<string, unknown>) => void;
	onLogError?: (nodeId: string, message: string, type?: string) => void;
}

interface ControlRendererProps {
	field: ControlField;
	value: unknown;
	onChange: (value: unknown) => void;
	nodeType: string;
	hasError: boolean;
	errorMessage?: string;
}

// ============================================================================
// APPLE-INSPIRED CONTROL RENDERERS
// ============================================================================

/**
 * Clean text input with Apple's refined styling
 */
const AppleTextInput: React.FC<ControlRendererProps> = ({
	field,
	value,
	onChange,
	hasError,
	errorMessage,
}) => {
	return (
		<div className="space-y-2">
			<label className="block font-medium text-gray-900 text-sm dark:text-white">
				{field.label}
			</label>
			<input
				type="text"
				value={String(value || "")}
				onChange={(e) => onChange(e.target.value)}
				placeholder={field.placeholder}
				className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm transition-all duration-200 ease-out placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-gray-800 dark:placeholder:text-gray-500 ${
					hasError
						? "border-red-300 bg-red-50/50 dark:border-red-600 dark:bg-red-900/10"
						: "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
				}
        `}
			/>
			{hasError && errorMessage && (
				<p className="flex items-center gap-1 text-red-600 text-xs dark:text-red-400">
					<span className="h-3 w-3 text-red-500">⚠</span>
					{errorMessage}
				</p>
			)}
		</div>
	);
};

/**
 * Elegant textarea with Apple's attention to detail
 */
const AppleTextarea: React.FC<ControlRendererProps> = ({
	field,
	value,
	onChange,
	hasError,
	errorMessage,
}) => {
	return (
		<div className="space-y-2">
			<label className="block font-medium text-gray-900 text-sm dark:text-white">
				{field.label}
			</label>
			<textarea
				value={String(value || "")}
				onChange={(e) => onChange(e.target.value)}
				placeholder={field.placeholder}
				rows={field.ui?.rows || 3}
				className={`w-full resize-none rounded-lg border bg-white px-3 py-2.5 text-sm transition-all duration-200 ease-out placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-gray-800 dark:placeholder:text-gray-500 ${
					hasError
						? "border-red-300 bg-red-50/50 dark:border-red-600 dark:bg-red-900/10"
						: "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
				}
        `}
			/>
			{hasError && errorMessage && (
				<p className="flex items-center gap-1 text-red-600 text-xs dark:text-red-400">
					<span className="h-3 w-3 text-red-500">⚠</span>
					{errorMessage}
				</p>
			)}
		</div>
	);
};

/**
 * Precise number input with Apple's numeric styling
 */
const AppleNumberInput: React.FC<ControlRendererProps> = ({
	field,
	value,
	onChange,
	hasError,
	errorMessage,
}) => {
	const handleChange = useCallback(
		(newValue: string) => {
			const numValue = Number.parseFloat(newValue);
			if (!Number.isNaN(numValue)) {
				onChange(numValue);
			} else if (newValue === "") {
				onChange(field.defaultValue);
			}
		},
		[onChange, field.defaultValue]
	);

	return (
		<div className="space-y-2">
			<label className="block font-medium text-gray-900 text-sm dark:text-white">
				{field.label}
			</label>
			<input
				type="number"
				value={String(value ?? "")}
				onChange={(e) => handleChange(e.target.value)}
				placeholder={field.placeholder}
				step={field.ui?.step || 1}
				min={field.validation?.min}
				max={field.validation?.max}
				className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm transition-all duration-200 ease-out placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-gray-800 dark:placeholder:text-gray-500 ${
					hasError
						? "border-red-300 bg-red-50/50 dark:border-red-600 dark:bg-red-900/10"
						: "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
				}
        `}
			/>
			{hasError && errorMessage && (
				<p className="flex items-center gap-1 text-red-600 text-xs dark:text-red-400">
					<span className="h-3 w-3 text-red-500">⚠</span>
					{errorMessage}
				</p>
			)}
		</div>
	);
};

/**
 * Beautiful toggle switch inspired by iOS
 */
const AppleToggle: React.FC<ControlRendererProps> = ({
	field,
	value,
	onChange,
	hasError,
	errorMessage,
}) => {
	const boolValue = Boolean(value);

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<label className="font-medium text-gray-900 text-sm dark:text-white">{field.label}</label>
				<button
					onClick={() => onChange(!boolValue)}
					className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 ${boolValue ? "bg-blue-600 shadow-sm" : "bg-gray-200 dark:bg-gray-700"}
          `}
					type="button"
				>
					<span
						className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${boolValue ? "translate-x-6" : "translate-x-1"}
            `}
					/>
				</button>
			</div>
			{hasError && errorMessage && (
				<p className="flex items-center gap-1 text-red-600 text-xs dark:text-red-400">
					<span className="h-3 w-3 text-red-500">⚠</span>
					{errorMessage}
				</p>
			)}
		</div>
	);
};

/**
 * Clean select dropdown with Apple's refined styling
 */
const AppleSelect: React.FC<ControlRendererProps> = ({
	field,
	value,
	onChange,
	hasError,
	errorMessage,
}) => {
	const options = field.validation?.options || [];

	return (
		<div className="space-y-2">
			<label className="block font-medium text-gray-900 text-sm dark:text-white">
				{field.label}
			</label>
			<select
				value={String(value || "")}
				onChange={(e) => onChange(e.target.value)}
				className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm transition-all duration-200 ease-out focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-gray-800 ${
					hasError
						? "border-red-300 bg-red-50/50 dark:border-red-600 dark:bg-red-900/10"
						: "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
				}
        `}
			>
				{!field.required && <option value="">Select {field.label}</option>}
				{options.map((option) => (
					<option key={String(option.value)} value={String(option.value)}>
						{option.label}
					</option>
				))}
			</select>
			{hasError && errorMessage && (
				<p className="flex items-center gap-1 text-red-600 text-xs dark:text-red-400">
					<span className="h-3 w-3 text-red-500">⚠</span>
					{errorMessage}
				</p>
			)}
		</div>
	);
};

/**
 * URL input with validation styling
 */
const AppleUrlInput: React.FC<ControlRendererProps> = ({
	field,
	value,
	onChange,
	hasError,
	errorMessage,
}) => {
	return (
		<div className="space-y-2">
			<label className="block font-medium text-gray-900 text-sm dark:text-white">
				{field.label}
			</label>
			<input
				type="url"
				value={String(value || "")}
				onChange={(e) => onChange(e.target.value)}
				placeholder={field.placeholder || "https://example.com"}
				className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm transition-all duration-200 ease-out placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-gray-800 dark:placeholder:text-gray-500 ${
					hasError
						? "border-red-300 bg-red-50/50 dark:border-red-600 dark:bg-red-900/10"
						: "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
				}
        `}
			/>
			{hasError && errorMessage && (
				<p className="flex items-center gap-1 text-red-600 text-xs dark:text-red-400">
					<span className="h-3 w-3 text-red-500">⚠</span>
					{errorMessage}
				</p>
			)}
		</div>
	);
};

/**
 * Email input with validation styling
 */
const AppleEmailInput: React.FC<ControlRendererProps> = ({
	field,
	value,
	onChange,
	hasError,
	errorMessage,
}) => {
	return (
		<div className="space-y-2">
			<label className="block font-medium text-gray-900 text-sm dark:text-white">
				{field.label}
			</label>
			<input
				type="email"
				value={String(value || "")}
				onChange={(e) => onChange(e.target.value)}
				placeholder={field.placeholder || "user@example.com"}
				className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm transition-all duration-200 ease-out placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-gray-800 dark:placeholder:text-gray-500 ${
					hasError
						? "border-red-300 bg-red-50/50 dark:border-red-600 dark:bg-red-900/10"
						: "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
				}
        `}
			/>
			{hasError && errorMessage && (
				<p className="flex items-center gap-1 text-red-600 text-xs dark:text-red-400">
					<span className="h-3 w-3 text-red-500">⚠</span>
					{errorMessage}
				</p>
			)}
		</div>
	);
};

/**
 * Color picker with Apple's attention to visual design
 */
const AppleColorPicker: React.FC<ControlRendererProps> = ({
	field,
	value,
	onChange,
	hasError,
	errorMessage,
}) => {
	return (
		<div className="space-y-2">
			<label className="block font-medium text-gray-900 text-sm dark:text-white">
				{field.label}
			</label>
			<div className="flex items-center gap-3">
				<input
					type="color"
					value={String(value || "#000000")}
					onChange={(e) => onChange(e.target.value)}
					className="h-10 w-12 cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700"
				/>
				<input
					type="text"
					value={String(value || "")}
					onChange={(e) => onChange(e.target.value)}
					placeholder="#000000"
					className={`flex-1 rounded-lg border bg-white px-3 py-2.5 font-mono text-sm transition-all duration-200 ease-out placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-gray-800 dark:placeholder:text-gray-500 ${
						hasError
							? "border-red-300 bg-red-50/50 dark:border-red-600 dark:bg-red-900/10"
							: "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
					}
          `}
				/>
			</div>
			{hasError && errorMessage && (
				<p className="flex items-center gap-1 text-red-600 text-xs dark:text-red-400">
					<span className="h-3 w-3 text-red-500">⚠</span>
					{errorMessage}
				</p>
			)}
		</div>
	);
};

/**
 * Date input with clean styling
 */
const AppleDateInput: React.FC<ControlRendererProps> = ({
	field,
	value,
	onChange,
	hasError,
	errorMessage,
}) => {
	return (
		<div className="space-y-2">
			<label className="block font-medium text-gray-900 text-sm dark:text-white">
				{field.label}
			</label>
			<input
				type="date"
				value={String(value || "")}
				onChange={(e) => onChange(e.target.value)}
				className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm transition-all duration-200 ease-out focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-gray-800 ${
					hasError
						? "border-red-300 bg-red-50/50 dark:border-red-600 dark:bg-red-900/10"
						: "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
				}
        `}
			/>
			{hasError && errorMessage && (
				<p className="flex items-center gap-1 text-red-600 text-xs dark:text-red-400">
					<span className="h-3 w-3 text-red-500">⚠</span>
					{errorMessage}
				</p>
			)}
		</div>
	);
};

/**
 * JSON editor with syntax highlighting and validation
 */
const AppleJsonEditor: React.FC<ControlRendererProps> = ({
	field,
	value,
	onChange,
	hasError,
	errorMessage,
}) => {
	const [jsonError, setJsonError] = useState<string | null>(null);

	const handleJsonChange = useCallback(
		(newValue: string) => {
			try {
				if (newValue.trim()) {
					JSON.parse(newValue);
					setJsonError(null);
					onChange(JSON.parse(newValue));
				} else {
					setJsonError(null);
					onChange(null);
				}
			} catch (_error) {
				setJsonError("Invalid JSON format");
				// Still update the raw value for editing
				onChange(newValue);
			}
		},
		[onChange]
	);

	const displayValue = useMemo(() => {
		if (typeof value === "string") {
			return value;
		}
		if (value === null || value === undefined) {
			return "";
		}
		return JSON.stringify(value, null, 2);
	}, [value]);

	return (
		<div className="space-y-2">
			<label className="block font-medium text-gray-900 text-sm dark:text-white">
				{field.label}
			</label>
			<textarea
				value={displayValue}
				onChange={(e) => handleJsonChange(e.target.value)}
				placeholder={field.placeholder || '{"key": "value"}'}
				rows={field.ui?.rows || 4}
				className={`w-full resize-none rounded-lg border bg-white px-3 py-2.5 font-mono text-sm transition-all duration-200 ease-out placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-gray-800 dark:placeholder:text-gray-500 ${
					hasError || jsonError
						? "border-red-300 bg-red-50/50 dark:border-red-600 dark:bg-red-900/10"
						: "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
				}
        `}
			/>
			{(hasError || jsonError) && (
				<p className="flex items-center gap-1 text-red-600 text-xs dark:text-red-400">
					<span className="h-3 w-3 text-red-500">⚠</span>
					{jsonError || errorMessage}
				</p>
			)}
			{field.ui?.showPreview && !jsonError && displayValue && (
				<div className="text-gray-500 text-xs dark:text-gray-400">
					<div className="mb-1 font-medium">Preview:</div>
					<pre className="max-h-20 overflow-auto rounded border bg-gray-50 p-2 text-xs dark:bg-gray-800">
						{JSON.stringify(typeof value === "string" ? JSON.parse(value) : value, null, 2)}
					</pre>
				</div>
			)}
		</div>
	);
};

// ============================================================================
// MAIN DYNAMIC CONTROLS COMPONENT
// ============================================================================

export const DynamicControls: React.FC<DynamicControlsProps> = ({
	node,
	updateNodeData,
	onLogError,
}) => {
	// State for tracking validation errors
	const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

	// Generate control fields from the node's schema using enhanced service
	const controlFields = useMemo(() => {
		const fields = NodeInspectorService.generateControlFields(node.type as any);
		return fields;
	}, [node.type]);

	// Get current node data with defaults applied
	const nodeDataWithDefaults = useMemo(() => {
		return NodeInspectorService.getNodeDataWithDefaults(node);
	}, [node.id, node.data, node.type]);

	// Check if the node has any custom controls available
	const hasControls = controlFields.length > 0;

	/**
	 * Handle individual field updates with validation
	 */
	const handleFieldUpdate = useCallback(
		(fieldKey: string, value: unknown) => {
			// Apply update immediately for better UX
			updateNodeData(node.id, { [fieldKey]: value });

			// Clear any existing validation error for this field
			setValidationErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[fieldKey];
				return newErrors;
			});

			// Validate the update
			const updateResult = NodeInspectorService.updateNodeData(node, {
				[fieldKey]: value,
			});

			if (!updateResult.success) {
				// Set validation error
				const fieldError = updateResult.errors.find((error) => error.startsWith(`${fieldKey}:`));
				if (fieldError) {
					setValidationErrors((prev) => ({
						...prev,
						[fieldKey]: fieldError,
					}));
				}

				// Log error if handler provided
				if (onLogError) {
					onLogError(
						node.id,
						`Validation failed for ${fieldKey}: ${fieldError || "Unknown error"}`,
						"warning"
					);
				}
			}
		},
		[node, updateNodeData, onLogError]
	);

	/**
	 * Render individual control based on field type
	 */
	const renderControl = useCallback(
		(field: ControlField) => {
			const currentValue = nodeDataWithDefaults[field.key] ?? field.defaultValue;
			const hasError = field.key in validationErrors;
			const errorMessage = validationErrors[field.key];

			const commonProps: ControlRendererProps = {
				field,
				value: currentValue,
				onChange: (value) => handleFieldUpdate(field.key, value),
				nodeType: node.type as string,
				hasError,
				errorMessage,
			};

			switch (field.type) {
				case "textarea":
					return <AppleTextarea key={field.key} {...commonProps} />;
				case "number":
					return <AppleNumberInput key={field.key} {...commonProps} />;
				case "boolean":
					return <AppleToggle key={field.key} {...commonProps} />;
				case "select":
					return <AppleSelect key={field.key} {...commonProps} />;
				case "url":
					return <AppleUrlInput key={field.key} {...commonProps} />;
				case "email":
					return <AppleEmailInput key={field.key} {...commonProps} />;
				case "color":
					return <AppleColorPicker key={field.key} {...commonProps} />;
				case "date":
					return <AppleDateInput key={field.key} {...commonProps} />;
				case "json":
					return <AppleJsonEditor key={field.key} {...commonProps} />;
				default:
					return <AppleTextInput key={field.key} {...commonProps} />;
			}
		},
		[nodeDataWithDefaults, validationErrors, handleFieldUpdate]
	);

	// ============================================================================
	// RENDER
	// ============================================================================

	if (!hasControls) {
		return (
			<div className="flex flex-col items-center justify-center px-4 py-8 text-center">
				<div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
					<span className="text-gray-400 text-lg dark:text-gray-500">⚙️</span>
				</div>
				<p className="mb-1 text-gray-500 text-sm dark:text-gray-400">No configuration needed</p>
				<p className="text-gray-400 text-xs dark:text-gray-500">This node works automatically</p>
			</div>
		);
	}

	return (
		<div className="space-y-4 p-4">
			{/* Control Fields */}
			<div className="space-y-4">{controlFields.map(renderControl)}</div>

			{/* Validation Status */}
			{Object.keys(validationErrors).length > 0 && (
				<div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
					<div className="flex items-center gap-2 text-red-800 text-sm dark:text-red-200">
						<span className="text-red-500">⚠</span>
						<span className="font-medium">Configuration Issues</span>
					</div>
					<p className="mt-1 text-red-600 text-xs dark:text-red-400">
						Please fix the errors above to ensure proper node operation.
					</p>
				</div>
			)}
		</div>
	);
};
