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
}

/**
 * Editable label component that stores its value inside the node's data.
 */
const LabelNode: React.FC<LabelNodeProps> = ({ nodeId, label }) => {
	const [editing, setEditing] = useState(false);
	const spanRef = useRef<HTMLSpanElement>(null);
	const { setNodes } = useReactFlow();
	const { resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	// Ensure client-side rendering to avoid hydration mismatch
	useEffect(() => {
		setMounted(true);
	}, []);

	// Get theme-aware label color
	const isDarkMode = mounted && resolvedTheme === "dark";
	const labelColor = isDarkMode ? "var(--core-label-color)" : "var(--core-label-color)";

	// focus when entering edit mode
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

	const handleContainerClick = (e: React.MouseEvent) => {
		// Only handle double-click when not editing
		if (!editing && e.detail === 2) {
			setEditing(true);
		}
	};

	return (
		<div
			className="absolute left-1/2 -translate-x-1/2 px-1 text-center select-none truncate"
			onClick={handleContainerClick}
			style={{
				pointerEvents: editing ? "none" : "auto", // Disable pointer events when editing
				top: "var(--core-label-top)",
				fontSize: "var(--core-label-font-size)",
				fontWeight: "var(--core-label-font-weight)",
				fontFamily: "var(--core-label-font-family, inherit)",
				color: labelColor,
				zIndex: editing ? 10 : 1, // Higher z-index when editing
			}}
		>
			<span
				ref={spanRef}
				contentEditable={editing}
				suppressContentEditableWarning
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
		</div>
	);
};

export default LabelNode;
