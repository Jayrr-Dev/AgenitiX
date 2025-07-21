// components/Loading.tsx
import React from "react";
import { twMerge } from "tailwind-merge";

export interface LoadingProps {
  /** Extra classes on the wrapper (for centering, backdrop, etc.) */
  className?: string;
  /** Overall size of the spinner (outer ring + inner fill), e.g. "w-12 h-12" */
  size?: string;
  /** Thickness of the ring, as padding around the inner circle, e.g. "p-1", "p-2" */
  ringThickness?: string;
  /** Background color for the inner fill—use to match your page bg, e.g. "bg-white" */
  innerBg?: string;
}

/**
 * A centered, spinning gradient ring loader.
 */
export const Loading: React.FC<LoadingProps> = ({
  className = "h-screen",
  size = "w-12 h-12",
  ringThickness = "p-0.5",
  innerBg = "bg-background",
}) => {
  // Flex container to center the spinner
  const containerClasses = twMerge(
    "flex items-center justify-center w-full h-full",
    className
  );

  // Outer ring: gradient background, rounded, spinning
  const outerClasses = twMerge(
    "inline-block animate-spin rounded-full",
    size,
    ringThickness,
    // Tailwind gradient; adjust stops/direction here if needed
    "bg-linear-to-r from-blue-500 via-purple-500 to-red-500"
  );

  // Inner circle: covers the gradient's center, yielding a ring
  const innerClasses = twMerge(
    "rounded-full w-full h-full",
    innerBg
  );

  return (
    <div className={containerClasses}>
      <div className={outerClasses}>
        <div
          role="status"
          aria-label="Loading"
          className={innerClasses}
        />
      </div>
    </div>
  );
};
