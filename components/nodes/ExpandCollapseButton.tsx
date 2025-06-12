import React from "react";

const TOGGLE_SYMBOLS = {
  EXPANDED: "⦿",
  COLLAPSED: "⦾",
} as const;

interface ExpandCollapseButtonProps {
  showUI: boolean;
  onToggle: () => void;
  className?: string;
  size?: "sm" | "md";
}

export const ExpandCollapseButton: React.FC<ExpandCollapseButtonProps> = ({
  showUI,
  onToggle,
  className = "",
  size = "sm",
}) => {
  const sizeClasses = size === "sm" ? "w-2 h-2" : "w-3 h-3";

  return (
    <button
      aria-label={showUI ? "Collapse node" : "Expand node"}
      title={showUI ? "Collapse" : "Expand"}
      onClick={onToggle}
      className={`absolute text-black top-1 left-1 cursor-pointer z-10 ${sizeClasses} flex items-center justify-center bg-transparent rounded-full border text-xs transition-colors ${className}`}
      type="button"
    >
      {showUI ? TOGGLE_SYMBOLS.EXPANDED : TOGGLE_SYMBOLS.COLLAPSED}
    </button>
  );
};