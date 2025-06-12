import React from "react";

const TOGGLE_SYMBOLS = {
  EXPANDED: "⦿",
  COLLAPSED: "⦾",
} as const;

interface ExpandCollapseButtonProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const ExpandCollapseButton: React.FC<ExpandCollapseButtonProps> = ({
  isCollapsed,
  onToggle,
}) => {
  return (
    <button
      aria-label={isCollapsed ? "Expand node" : "Collapse node"}
      title={isCollapsed ? "Expand" : "Collapse"}
      onClick={onToggle}
      className="absolute top-2 right-2 cursor-pointer z-10 w-5 h-5 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full border border-gray-300 dark:border-gray-500 text-xs transition-colors"
      type="button"
    >
      {isCollapsed ? TOGGLE_SYMBOLS.COLLAPSED : TOGGLE_SYMBOLS.EXPANDED}
    </button>
  );
}; 