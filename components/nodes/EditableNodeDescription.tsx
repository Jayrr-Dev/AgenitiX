/**
 * EDITABLE NODE DESCRIPTION - Inline description editor for Node Inspector
 *
 * • Displays current description (custom or default)
 * • Double-click to switch into editable mode
 * • Saves edited description into node.data.description via React Flow store
 * • Press Enter or blur to save, Esc to cancel
 * • Falls back to defaultDescription when empty
 *
 * Keywords: node-description, editable, inspector, react-flow, design-tokens
 */

import { type Node, useReactFlow } from "@xyflow/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";

interface EditableNodeDescriptionProps {
	/** Node id within React Flow */
	nodeId: string;
	/** Currently effective description (custom or default) */
	description: string;
	/** Default description from NodeSpec (used as fallback when cleared) */
	defaultDescription: string;
	/** Optional className for styling */
	className?: string;
}

const EditableNodeDescription: React.FC<EditableNodeDescriptionProps> = ({
	nodeId,
	description,
	defaultDescription,
	className = "",
}) => {
	const { setNodes } = useReactFlow();
	const [editing, setEditing] = useState(false);
	const spanRef = useRef<HTMLSpanElement>(null);

	// Focus & select all when entering edit mode
	useEffect(() => {
		if (editing && spanRef.current) {
			const span = spanRef.current;
			span.focus();
			const range = document.createRange();
			range.selectNodeContents(span);
			const sel = window.getSelection();
			sel?.removeAllRanges();
			sel?.addRange(range);
		}
	}, [editing]);

	/** Persist description into node data */
	const save = (newDesc: string) => {
		const trimmed = newDesc.trim();
		setNodes((nodes) =>
			nodes.map((n: Node) =>
				n.id === nodeId ? { ...n, data: { ...n.data, description: trimmed } } : n
			)
		);
		setEditing(false);
	};

	const handleBlur = () => {
		const currentText = spanRef.current?.innerText ?? "";
		save(currentText === "" ? defaultDescription : currentText);
	};

	const handleKeyDown: React.KeyboardEventHandler<HTMLSpanElement> = (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			spanRef.current?.blur();
		}
		if (e.key === "Escape") {
			// Restore original text & exit edit mode
			if (spanRef.current) {
				spanRef.current.innerText = description;
			}
			setEditing(false);
		}
	};

	return (
		<p
			onClick={(e) => {
				// Enter edit mode on double click but allow text selection inside editable span later
				if (!editing && e.detail === 2) {
					setEditing(true);
				}
			}}
			className={className}
			style={{ cursor: editing ? "text" : "pointer" }}
		>
			<span
				ref={spanRef}
				contentEditable={editing}
				suppressContentEditableWarning
				onBlur={handleBlur}
				onKeyDown={handleKeyDown}
				style={{ outline: "none" }}
			>
				{description}
			</span>
		</p>
	);
};

export default EditableNodeDescription;
