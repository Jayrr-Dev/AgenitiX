/**
 * COUNTER BOX - Reusable counter display component
 *
 * • Shows label and count in a styled box
 * • Configurable colors and text
 * • Dark mode support
 * • Consistent with node styling patterns
 *
 * Keywords: counter, stats, metrics, display
 */

import { cn } from "@/lib/utils";

interface CounterBoxProps {
  /** The label text shown above the count */
  label: string;
  /** The numeric value to display */
  count: number;
  /** Container text color class (should include dark mode variant) */
  textColor?: string;
  /** Background color class (should include dark mode variant) */
  bgColor?: string;
  /** Label text color class (should include dark mode variant) */
  labelColor?: string;
  /** Optional additional className for the container */
  className?: string;
}

export const CounterBox = ({
  label,
  count,
  textColor = "text-green-700 dark:text-green-300",
  bgColor = "bg-green-200 dark:bg-green-900/30",
  labelColor = "text-green-600 dark:text-green-200",
  className,
}: CounterBoxProps) => {
  return (
    <div className={cn(bgColor, "rounded px-1 py-0.5", className)}>
      <div className={cn("text-[10px]", labelColor, "font-medium")}>{label}</div>
      <div className={cn(textColor, "font-semibold")}>{count}</div>
    </div>
  );
};

/**
 * Container for multiple counter boxes with consistent styling
 */
interface CounterBoxContainerProps {
  /** Counter box configurations */
  counters: Array<{
    label: string;
    count: number;
    textColor?: string;
    bgColor?: string;
    labelColor?: string;
  }>;
  /** Container text color class (default style, can be overridden per counter) */
  defaultTextColor?: string;
  /** Container background color class (default style, can be overridden per counter) */
  defaultBgColor?: string;
  /** Label text color class (default style, can be overridden per counter) */
  defaultLabelColor?: string;
  /** Optional additional className for the container */
  className?: string;
}



export const CounterBoxContainer = ({
  counters,
  defaultTextColor = "text-foreground",
  defaultBgColor = "bg-muted opacity-90",
  defaultLabelColor = "text-foreground",
  className,
}: CounterBoxContainerProps) => {
  return (
    <div className={cn("text-xs font-mono", defaultTextColor, "font-semibold", className)}>
      <div className="grid grid-cols-2 gap-1 text-center">
        {counters.map((counter, idx) => (
          <CounterBox
            key={`${counter.label}-${idx}`}
            label={counter.label}
            count={counter.count}
            textColor={counter.textColor || defaultTextColor}
            bgColor={counter.bgColor || defaultBgColor}
            labelColor={counter.labelColor || defaultLabelColor}
          />
        ))}
      </div>
    </div>
  );
};
