import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface FloatingNodeIdProps {
  nodeId: string;
  className?: string;
  onNodeIdChange?: (oldId: string, newId: string) => boolean;
  show?: boolean;
}

/**
 * FLOATING NODE ID - Editable node identifier display
 */
export const FloatingNodeId: React.FC<FloatingNodeIdProps> = ({
  nodeId,
  className = "",
  onNodeIdChange,
  show = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeId);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(nodeId);
  }, [nodeId]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    if (!onNodeIdChange) return;
    setIsEditing(true);
    setEditValue(nodeId);
  };

  const isValidNodeId = (id: string): boolean => {
    return /^[a-zA-Z0-9_-]+$/.test(id) && id.length > 0 && id.length <= 50;
  };

  const handleSave = () => {
    const trimmedValue = editValue.trim();

    if (!isValidNodeId(trimmedValue)) {
      setEditValue(nodeId);
      setIsEditing(false);
      return;
    }

    if (trimmedValue !== nodeId && onNodeIdChange) {
      const success = onNodeIdChange(nodeId, trimmedValue);
      if (success === false) {
        toast.error("🚫 Duplicate Node ID", {
          description: `Node ID "${trimmedValue}" already exists.`,
          duration: 4000,
        });
        setEditValue(nodeId);
        setIsEditing(false);
        return;
      }
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(nodeId);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };
  
  const handleBlur = () => handleSave();

  if (!show) return null;

  const baseClasses = `absolute -top-5 left-1/2 transform -translate-x-1/2 text-[8px] px-1 py-0 rounded text-gray-500 z-50 pointer-events-auto font-mono whitespace-nowrap ${className}`;

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={`${baseClasses} bg-transparent text-gray-500 dark:text-gray-400 border-none outline-none selection:bg-blue-200 dark:selection:bg-blue-800 min-w-[40px] max-w-[120px] text-center`}
        style={{ fontSize: "8px" }}
        placeholder="Node ID"
      />
    );
  }

  return (
    <div
      className={`${baseClasses} ${onNodeIdChange ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" : ""} transition-colors duration-150`}
      style={{ fontSize: "8px" }}
      onDoubleClick={handleDoubleClick}
      title={onNodeIdChange ? "Double-click to edit ID" : "Node ID"}
    >
      {nodeId}
    </div>
  );
}; 