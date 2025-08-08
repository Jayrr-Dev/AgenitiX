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
  /** The value to display (number or short status text) */
  count: number | string;
  /** Optional error text to display beneath the count */
  error?: string;
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
  error,
  textColor = "text-green-700 dark:text-green-300",
  bgColor = "bg-green-200 dark:bg-green-900/30",
  labelColor = "text-green-600 dark:text-green-200",
  className,
}: CounterBoxProps) => {
  return (
    <div className={cn(bgColor, "rounded min-w-[40px] px-1 py-0.5", className)}>
      <div className={cn("text-[10px]", labelColor, "font-medium")}>{label}</div>
      <div className={cn(textColor, "font-semibold")}>{count}</div>
      {error ? (
        <div className={cn("text-[10px] mt-0.5", "text-red-600 dark:text-red-400")}>{error}</div>
      ) : null}
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
    count: number | string;
    error?: string;
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
      <div className="flex flex-row gap-1 text-center">
        {counters.map((counter, idx) => {
          const hasError = Boolean(
            typeof counter.error === "string" && counter.error.trim() !== ""
          );
          const effectiveCount = hasError ? counter.error! : counter.count;
          const effectiveTextColor = hasError
            ? "text-red-700 dark:text-red-300"
            : counter.textColor || defaultTextColor;
          const effectiveBgColor = hasError
            ? "bg-red-200 dark:bg-red-900/30"
            : counter.bgColor || defaultBgColor;
          const effectiveLabelColor = hasError
            ? "text-red-600 dark:text-red-200"
            : counter.labelColor || defaultLabelColor;

          return (
            <CounterBox
              key={`${counter.label}-${idx}`}
              label={counter.label}
              count={effectiveCount}
              textColor={effectiveTextColor}
              bgColor={effectiveBgColor}
              labelColor={effectiveLabelColor}
            />
          );
        })}
      </div>
    </div>
  );
};
