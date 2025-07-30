/**
 * EDITABLE JSON EDITOR - Edit node data as JSON with validation
 *
 * • Allows editing of node data as raw JSON
 * • Validates JSON syntax before saving
 * • Provides toggle between view and edit modes
 * • Highlights syntax errors with clear error messages
 * • Maintains proper formatting and indentation
 *
 * Keywords: json-editor, editable, validation, node-data, syntax-highlighting
 */

import { Edit3, Save, X } from "lucide-react";
import type React from "react";
import { useCallback, useMemo, useState } from "react";
import { JsonHighlighter } from "../utils/JsonHighlighter";

interface EditableJsonEditorProps {
	/** Current node data */
	data: Record<string, unknown>;
	/** Callback to update node data */
	onUpdateData: (newData: Record<string, unknown>) => void;
	/** Optional CSS classes */
	className?: string;
}

/**
 * Editable JSON editor with syntax highlighting and validation
 */
export const EditableJsonEditor: React.FC<EditableJsonEditorProps> = ({
	data,
	onUpdateData,
	className = "",
}) => {
	const [isEditing, setIsEditing] = useState(false);
	const [jsonValue, setJsonValue] = useState("");
	const [jsonError, setJsonError] = useState<string | null>(null);

	// Convert data to formatted JSON string
	const formatJson = useMemo(() => {
		try {
			return JSON.stringify(data, null, 2);
		} catch (_error) {
			return String(data);
		}
	}, [data]);

	// Start editing mode
	const startEditing = useCallback(() => {
		setJsonValue(formatJson);
		setJsonError(null);
		setIsEditing(true);
	}, [formatJson]);

	// Cancel editing mode
	const cancelEditing = useCallback(() => {
		setIsEditing(false);
		setJsonValue("");
		setJsonError(null);
	}, []);

	// Validate and save JSON
	const saveJson = useCallback(() => {
		try {
			const parsedData = JSON.parse(jsonValue);
			onUpdateData(parsedData);
			setIsEditing(false);
			setJsonError(null);
		} catch (error) {
			setJsonError(error instanceof Error ? error.message : "Invalid JSON format");
		}
	}, [jsonValue, onUpdateData]);

	// Handle JSON input change
	const handleJsonChange = useCallback(
		(value: string) => {
			setJsonValue(value);

			// Clear error when user starts typing
			if (jsonError) {
				setJsonError(null);
			}
		},
		[jsonError]
	);

	// Handle key shortcuts
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === "Escape") {
				cancelEditing();
			} else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				saveJson();
			}
		},
		[cancelEditing, saveJson]
	);

	if (isEditing) {
		return (
			<div className={`space-y-2 ${className} p-1`}>
				{/* Edit Mode Header */}
				<div className="flex items-center justify-between">
					<div className="font-medium text-gray-700 text-xs dark:text-gray-300">Edit JSON Data</div>
					<div className="flex items-center gap-1">
						<button
							type="button"
							onClick={saveJson}
							className="flex items-center gap-1 rounded border border-green-300 bg-green-100 px-2 py-1 text-green-700 text-xs transition-colors hover:bg-green-200 dark:border-green-700 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800"
							title="Save (Ctrl+Enter)"
						>
							<Save className="h-3 w-3" />
							Save
						</button>
						<button
							type="button"
							onClick={cancelEditing}
							className="flex items-center gap-1 rounded border border-gray-300 bg-gray-100 px-2 py-1 text-gray-700 text-xs transition-colors hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
							title="Cancel (Escape)"
						>
							<X className="h-3 w-3" />
							Cancel
						</button>
					</div>
				</div>

				{/* JSON Editor */}
				<div className="relative">
					<textarea
						value={jsonValue}
						onChange={(e) => handleJsonChange(e.target.value)}
						onKeyDown={handleKeyDown}
						className={`h-64 w-full resize-none rounded-md border bg-white px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-gray-800 ${
							jsonError
								? "border-red-300 bg-red-50/50 dark:border-red-600 dark:bg-red-900/10"
								: "border-gray-300 dark:border-gray-600"
						}
            `}
						placeholder="Enter valid JSON..."
						spellCheck={false}
					/>
				</div>

				{/* Error Message */}
				{jsonError && (
					<div className="rounded border border-red-200 bg-red-50 p-2 text-red-600 text-xs dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
						<div className="font-medium">JSON Error:</div>
						<div className="mt-1">{jsonError}</div>
					</div>
				)}

				{/* Help Text */}
				<div className="text-gray-500 text-xs dark:text-gray-400">
					<kbd className="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-800">
						Ctrl+Enter
					</kbd>{" "}
					to save •{" "}
					<kbd className="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-800">
						Esc
					</kbd>{" "}
					to cancel
				</div>
			</div>
		);
	}

	// View Mode
	return (
		<div className={`space-y-2 ${className} p-1`}>
			{/* View Mode Header */}
			<div className="flex items-center justify-between ">
				<div className="font-medium text-gray-700 text-xs dark:text-gray-300 ">JSON Data</div>
				<button
					type="button"
					onClick={startEditing}
					className="flex items-center gap-1 rounded border border-blue-300 bg-blue-100 px-2 py-0.5 text-blue-700 text-xs transition-colors hover:bg-blue-200 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
					title="Edit JSON"
				>
					<Edit3 className="h-3 w-3" />
				</button>
			</div>

			{/* JSON Display */}
			<div className="overflow-x-auto overflow-y-auto rounded-md border border-gray-300 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800">
				<JsonHighlighter data={data} className="w-full" />
			</div>
		</div>
	);
};
