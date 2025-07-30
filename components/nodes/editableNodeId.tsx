/**
 * EDITABLE NODE ID - Double-click to edit node ID in inspector
 *
 * • Displays current node ID with double-click to edit
 * • Validates ID uniqueness before saving
 * • Persists changes via React Flow updateNodeId
 * • Styled with design tokens for consistency
 *
 * Keywords: node-id, editable, inspector, validation, react-flow
 */

import type React from "react";
import { useEffect, useRef, useState } from "react";

interface EditableNodeIdProps {
	/** Current node ID */
	nodeId: string;
	/** Callback to update node ID - returns true if successful */
	onUpdateId: (oldId: string, newId: string) => boolean;
	/** Optional styling class */
	className?: string;
}

/**
 * Editable node ID component for the inspector panel.
 * Double-click to edit, Enter/blur to save, Escape to cancel.
 */
const EditableNodeId: React.FC<EditableNodeIdProps> = ({ nodeId, onUpdateId, className = "" }) => {
	const [editing, setEditing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const spanRef = useRef<HTMLSpanElement>(null);

	// Clear error when nodeId changes
	useEffect(() => {
		setError(null);
	}, []);

	// Focus and select all text when entering edit mode
	useEffect(() => {
		if (editing) {
			const span = spanRef.current;
			if (span) {
				span.focus();
				// Select all text when entering edit mode
				const range = document.createRange();
				range.selectNodeContents(span);
				const selection = window.getSelection();
				selection?.removeAllRanges();
				selection?.addRange(range);
			}
		}
	}, [editing]);

	/** Validate and save new ID */
	const save = (newId: string) => {
		const trimmedId = newId.trim();

		// Validate ID format (basic validation)
		if (!trimmedId) {
			setError("ID cannot be empty");
			return;
		}

		if (!/^[a-zA-Z0-9_-]+$/.test(trimmedId)) {
			setError("ID can only contain letters, numbers, hyphens, and underscores");
			return;
		}

		// If ID hasn't changed, just exit edit mode
		if (trimmedId === nodeId) {
			setEditing(false);
			setError(null);
			return;
		}

		// Try to update the ID
		const success = onUpdateId(nodeId, trimmedId);
		if (success) {
			setEditing(false);
			setError(null);
		} else {
			setError("ID already exists");
		}
	};

	const onBlur = () => {
		const currentText = spanRef.current?.innerText || "";
		save(currentText);
	};

	const onKeyDown: React.KeyboardEventHandler<HTMLSpanElement> = (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			spanRef.current?.blur();
		}
		if (e.key === "Escape") {
			// Restore original text and exit edit mode
			if (spanRef.current) {
				spanRef.current.innerText = nodeId;
			}
			setEditing(false);
			setError(null);
		}
	};

	return (
		<div className={className}>
			<span
				ref={spanRef}
				contentEditable={editing}
				suppressContentEditableWarning={true}
				onClick={() => setEditing(true)}
				onBlur={onBlur}
				onKeyDown={onKeyDown}
				className={`inline-block ${editing ? "cursor-text" : "cursor-pointer"} ${
					error ? "text-red-500" : ""
				} ${editing ? "rounded px-1 focus:ring-1 focus:ring-blue-500" : ""}`}
				style={{
					outline: "none",
					userSelect: editing ? "text" : "none",
					whiteSpace: "nowrap",
					minWidth: "60px",
					borderBottom: editing ? "1px solid currentColor" : "1px solid transparent",
				}}
				title={editing ? "Enter to save, Escape to cancel" : "Click to edit ID"}
			>
				{nodeId}
			</span>
			{error && <div className="mt-1 text-red-500 text-xs">{error}</div>}
		</div>
	);
};

export default EditableNodeId;
