/**
 * LABEL NODE - Editable node title displayed above node content
 *
 * • Renders current label centred at top of node
 * • Double-click toggles inline edit <input>
 * • Persists value in React Flow node data under key `label`
 * • Defaults to NodeSpec.displayName when no label set
 * • Supports dark mode theming
 *
 * Keywords: node-label, editable, persistent, react-flow, design-tokens, dark-mode
 */

import { type Node, useReactFlow } from "@xyflow/react";
import { useTheme } from "next-themes";
import type React from "react";
import { useEffect, useRef, useState } from "react";

interface LabelNodeProps {
	/** React-Flow node id */
	nodeId: string;
	/** Current label value */
	label: string;
	/** Callback to handle editing */
	onEdit?: (nodeId: string) => void;
}

/**
 * Editable label component that stores its value inside the node's data.
 */
const LabelNode: React.FC<LabelNodeProps> = ({ nodeId, label, onEdit }) => {
	const [editing, setEditing] = useState(false);
	const spanRef = useRef<HTMLSpanElement>(null);
	const { setNodes } = useReactFlow();
	const { resolvedTheme } = useTheme();

	// Get theme-aware label color
	const isDarkMode = resolvedTheme === "dark";
	const labelColor = isDarkMode ? "var(--core-label-color)" : "var(--core-label-color)";

	// Focus and select all text when entering edit mode
	useEffect(() => {
		if (editing && spanRef.current) {
			spanRef.current.focus();
			// Select all text for easy editing
			const range = document.createRange();
			range.selectNodeContents(spanRef.current);
			const selection = window.getSelection();
			selection?.removeAllRanges();
			selection?.addRange(range);
		}
	}, [editing]);

	/** Persist new label in React Flow state */
	const save = (newLabel: string) => {
		setNodes((nodes) =>
			nodes.map((n: Node) => (n.id === nodeId ? { ...n, data: { ...n.data, label: newLabel } } : n))
		);
		setEditing(false);
	};

	const onBlur = () => {
		const currentText = spanRef.current?.innerText || "";
		save(currentText.trim() === "" ? label : currentText.trim());
	};

	const onKeyDown: React.KeyboardEventHandler<HTMLSpanElement> = (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			spanRef.current?.blur();
		}
		if (e.key === "Escape") {
			// Restore original text and exit edit mode
			if (spanRef.current) {
				spanRef.current.innerText = label;
			}
			setEditing(false);
		}
	};

	return (
		<button
			type="button"
			className="-translate-x-1/2 absolute left-1/2 select-none truncate px-1 text-center"
			onClick={() => {
				// Handle editing if callback is provided
				if (typeof onEdit === "function") {
					onEdit(nodeId);
				}
			}}
			aria-label="Edit node label"
			style={{
				maxWidth: "200px",
				fontSize: "14px",
				color: "var(--core-text-primary)",
				backgroundColor: "var(--core-fill-bg)",
				border: "1px solid var(--core-fill-border)",
				borderRadius: "4px",
			}}
		>
			<span
				ref={spanRef}
				contentEditable={editing}
				suppressContentEditableWarning={true}
				onBlur={onBlur}
				onKeyDown={onKeyDown}
				style={{
					outline: "none",
					cursor: editing ? "text" : "pointer",
					fontSize: "var(--core-label-font-size)",
					fontWeight: "var(--core-label-font-weight)",
					fontFamily: "var(--core-label-font-family, inherit)",
					color: labelColor,
					whiteSpace: "nowrap",
					userSelect: editing ? "text" : "none",
					pointerEvents: editing ? "auto" : "none", // Only allow events on span when editing
				}}
			>
				{label}
			</span>
		</button>
	);
};

export default LabelNode;
