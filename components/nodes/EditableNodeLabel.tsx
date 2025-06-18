/**
 * EDITABLE NODE LABEL - Double-click to edit node label in inspector
 *
 * • Displays current node label with double-click to edit
 * • Updates node data with new label value
 * • Falls back to display name if no custom label set
 * • Styled with design tokens for consistency
 *
 * Keywords: node-label, editable, inspector, node-data, react-flow
 */

import React, { useEffect, useRef, useState } from "react";

interface EditableNodeLabelProps {
  /** Current node ID for updating data */
  nodeId: string;
  /** Current label value */
  label: string;
  /** Fallback display name when no custom label */
  displayName: string;
  /** Callback to update node data */
  onUpdateNodeData: (nodeId: string, data: any) => void;
  /** Optional styling class */
  className?: string;
}

/**
 * Editable node label component for the inspector panel.
 * Double-click to edit, Enter/blur to save, Escape to cancel.
 */
const EditableNodeLabel: React.FC<EditableNodeLabelProps> = ({
  nodeId,
  label,
  displayName,
  onUpdateNodeData,
  className = "",
}) => {
  const [editing, setEditing] = useState(false);
  const spanRef = useRef<HTMLSpanElement>(null);

  // Get the display value - use custom label if set, otherwise use display name
  const displayValue = label || displayName;

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

  /** Save new label */
  const save = (newLabel: string) => {
    const trimmedLabel = newLabel.trim();

    // Update node data with new label
    onUpdateNodeData(nodeId, { label: trimmedLabel });
    setEditing(false);
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
        spanRef.current.innerText = displayValue;
      }
      setEditing(false);
    }
  };

  return (
    <span
      ref={spanRef}
      contentEditable={editing}
      suppressContentEditableWarning
      onDoubleClick={() => setEditing(true)}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      className={`${className} inline-block ${editing ? "cursor-text" : "cursor-pointer"}`}
      style={{
        outline: "none",
        userSelect: editing ? "text" : "none",
        whiteSpace: "nowrap",
        minWidth: "60px",
        borderBottom: editing
          ? "1px solid currentColor"
          : "1px solid transparent",
      }}
      title={
        editing
          ? "Enter to save, Escape to cancel"
          : "Double-click to edit label"
      }
    >
      {displayValue}
    </span>
  );
};

export default EditableNodeLabel;
