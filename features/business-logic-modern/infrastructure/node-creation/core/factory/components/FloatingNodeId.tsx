import { useNodeDisplay } from "@flow-engine/contexts/NodeDisplayContext";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface FloatingNodeIdProps {
  nodeId: string;
  className?: string;
  onNodeIdChange?: (oldId: string, newId: string) => boolean;
}

/**
 * FLOATING NODE ID - Editable node identifier display
 *
 * Features:
 * • Double-click to edit node ID
 * • Enter to save, Escape to cancel
 * • Auto-focus and select text when editing
 * • Click outside to cancel edit
 * • Validates new ID before saving
 *
 * @param nodeId - Current node identifier
 * @param className - Additional CSS classes
 * @param onNodeIdChange - Callback when ID changes (oldId, newId) => boolean
 */
export const FloatingNodeId: React.FC<FloatingNodeIdProps> = ({
  nodeId,
  className = "",
  onNodeIdChange,
}) => {
  const { showNodeIds } = useNodeDisplay();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeId);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update edit value when nodeId prop changes
  useEffect(() => {
    setEditValue(nodeId);
  }, [nodeId]);

  // Auto-focus and select text when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Handle double-click to enter edit mode
  const handleDoubleClick = () => {
    if (!onNodeIdChange) return; // Only allow editing if callback provided
    setIsEditing(true);
    setEditValue(nodeId);
  };

  // Validate new node ID
  const isValidNodeId = (id: string): boolean => {
    // Basic validation: non-empty, alphanumeric with hyphens/underscores
    return /^[a-zA-Z0-9_-]+$/.test(id) && id.length > 0 && id.length <= 50;
  };

  // Save the new node ID
  const handleSave = () => {
    const trimmedValue = editValue.trim();

    if (!isValidNodeId(trimmedValue)) {
      // Reset to original value if invalid
      setEditValue(nodeId);
      setIsEditing(false);
      return;
    }

    if (trimmedValue !== nodeId && onNodeIdChange) {
      const success = onNodeIdChange(nodeId, trimmedValue);

      // Show toast if ID change failed (duplicate ID)
      if (success === false) {
        toast.error("🚫 Duplicate Node ID", {
          description: `Node ID "${trimmedValue}" already exists. Please choose a different ID.`,
          duration: 4000,
        });
        // Reset to original value
        setEditValue(nodeId);
        setIsEditing(false);
        return;
      }
    }

    setIsEditing(false);
  };

  // Cancel editing
  const handleCancel = () => {
    setEditValue(nodeId);
    setIsEditing(false);
  };

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation(); // Prevent interfering with flow editor shortcuts

    switch (e.key) {
      case "Enter":
        handleSave();
        break;
      case "Escape":
        handleCancel();
        break;
    }
  };

  // Handle click outside to cancel (blur event)
  const handleBlur = () => {
    handleSave();
  };

  if (!showNodeIds) return null;

  const baseClasses = `
    absolute -top-5 left-1/2 transform -translate-x-1/2
    text-[8px] px-1 py-0 rounded text-gray-500 z-50
    pointer-events-auto font-mono whitespace-nowrap
    ${className}
  `;

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={`
          ${baseClasses}
          bg-transparent text-gray-500 dark:text-gray-400
          border-none outline-none
          selection:bg-blue-200 dark:selection:bg-blue-800
          min-w-[40px] max-w-[120px] text-center
        `}
        style={{ fontSize: "8px" }}
        placeholder="Node ID"
      />
    );
  }

  return (
    <div
      className={`
        ${baseClasses}
        ${onNodeIdChange ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" : ""}
        transition-colors duration-150
      `}
      style={{ fontSize: "8px" }}
      onDoubleClick={handleDoubleClick}
      title={onNodeIdChange ? "Double-click to edit node ID" : "Node ID"}
    >
      {nodeId}
    </div>
  );
};
