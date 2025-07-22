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
	data: any;
	/** Callback to update node data */
	onUpdateData: (newData: any) => void;
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
		} catch (error) {
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
			<div className={`space-y-2 ${className}`}>
				{/* Edit Mode Header */}
				<div className="flex items-center justify-between">
					<div className="text-xs font-medium text-gray-700 dark:text-gray-300">Edit JSON Data</div>
					<div className="flex items-center gap-1">
						<button
							onClick={saveJson}
							className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300 rounded border border-green-300 dark:border-green-700 transition-colors"
							title="Save (Ctrl+Enter)"
						>
							<Save className="w-3 h-3" />
							Save
						</button>
						<button
							onClick={cancelEditing}
							className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 transition-colors"
							title="Cancel (Escape)"
						>
							<X className="w-3 h-3" />
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
						className={`
              w-full h-64 px-3 py-2 text-sm font-mono
              bg-white dark:bg-gray-800
              border rounded-md resize-none
              focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
              ${
								jsonError
									? "border-red-300 dark:border-red-600 bg-red-50/50 dark:bg-red-900/10"
									: "border-gray-300 dark:border-gray-600"
							}
            `}
						placeholder="Enter valid JSON..."
						spellCheck={false}
						autoFocus
					/>
				</div>

				{/* Error Message */}
				{jsonError && (
					<div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
						<div className="font-medium">JSON Error:</div>
						<div className="mt-1">{jsonError}</div>
					</div>
				)}

				{/* Help Text */}
				<div className="text-xs text-gray-500 dark:text-gray-400">
					<kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">
						Ctrl+Enter
					</kbd>{" "}
					to save •{" "}
					<kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">
						Esc
					</kbd>{" "}
					to cancel
				</div>
			</div>
		);
	}

	// View Mode
	return (
		<div className={`space-y-2 ${className}`}>
			{/* View Mode Header */}
			<div className="flex items-center justify-between">
				<div className="text-xs font-medium text-gray-700 dark:text-gray-300">Node Data</div>
				<button
					onClick={startEditing}
					className="flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded border border-blue-300 dark:border-blue-700 transition-colors"
					title="Edit JSON"
				>
					<Edit3 className="w-3 h-3" />
				</button>
			</div>

			{/* JSON Display */}
			<div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-600 p-3 overflow-y-auto overflow-x-auto">
				<JsonHighlighter data={data} className="w-full" />
			</div>
		</div>
	);
};
