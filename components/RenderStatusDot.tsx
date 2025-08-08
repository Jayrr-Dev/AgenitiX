"use client";

/**
 * Route: components/RenderStatusDot.tsx
 * RENDER STATUS DOT - Reusable status indicator with optional glow
 *
 * • Color-codes: green (event/active), yellow (processing), red (error), gray (neutral/off)
 * • Subtle glow effect for non-off states (configurable)
 * • Accessible with role and aria-label
 *
 * Keywords: status-dot, indicator, glow, accessibility, ui-component
 */

import { memo, useMemo } from "react";

/** Tailwind class tokens for sizes */
const SIZE_CLASS_BY_TOKEN = {
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
} as const;

/** Hex/RGBA values used for glow shadows */
const GLOW_SHADOW_BY_COLOR = {
  green: "shadow-[0_0_10px_rgba(34,197,94,0.55)]",
  yellow: "shadow-[0_0_10px_rgba(234,179,8,0.55)]",
  red: "shadow-[0_0_10px_rgba(239,68,68,0.55)]",
} as const;

/** Background color classes */
const BG_CLASS_BY_COLOR = {
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
  gray: "bg-gray-400 dark:bg-gray-600",
} as const;

export type RenderStatusDotSize = keyof typeof SIZE_CLASS_BY_TOKEN;

export interface RenderStatusDotProps {
  /**
   * When true, renders green. Highest priority after error and processing.
   * [Explanation], basically turns the dot green when an event is active
   */
  eventActive?: boolean;
  /**
   * When true, renders yellow. Higher priority than eventActive.
   * [Explanation], basically turns the dot yellow while processing
   */
  isProcessing?: boolean;
  /**
   * When true, renders red. Highest priority overall.
   * [Explanation], basically turns the dot red on any error
   */
  hasError?: boolean;
  /**
   * Enables glow for non-off states (green/yellow/red). Default: true
   * [Explanation], basically toggles the soft glow effect
   */
  enableGlow?: boolean;
  /** Size token for the dot. Default: 'sm' */
  size?: RenderStatusDotSize;
  /** Extra classes for positioning or layout */
  className?: string;
  /** Accessible label override; falls back to computed status text */
  ariaLabel?: string;
  /** Optional title tooltip override; falls back to computed status text */
  titleText?: string;
}

/**
 * Computes the visual state from props using a strict precedence:
 * hasError > isProcessing > eventActive > gray (neutral/off)
 */
function computeDotColor(props: Pick<RenderStatusDotProps, "hasError" | "isProcessing" | "eventActive">) {
  if (props.hasError) return "red" as const;
  if (props.isProcessing) return "yellow" as const;
  if (props.eventActive) return "green" as const;
  return "gray" as const;
}

/**
 * RenderStatusDot – compact status indicator with optional glow.
 */
export const RenderStatusDot = memo(function RenderStatusDot({
  eventActive = false,
  isProcessing = false,
  hasError = false,
  enableGlow = true,
  size = "sm",
  className = "",
  ariaLabel,
  titleText,
}: RenderStatusDotProps) {
  const color = useMemo(
    () => computeDotColor({ hasError, isProcessing, eventActive }),
    [hasError, isProcessing, eventActive],
  );

  const sizeClass = SIZE_CLASS_BY_TOKEN[size] ?? SIZE_CLASS_BY_TOKEN.sm;
  const bgClass = BG_CLASS_BY_COLOR[color];

  const shouldGlow = enableGlow && color !== "gray";
  const glowClass = shouldGlow ? GLOW_SHADOW_BY_COLOR[color] : "";

  const statusText =
    color === "red"
      ? "error"
      : color === "yellow"
        ? "processing"
        : color === "green"
          ? "active"
          : "neutral";

  return (
    <span
      role="status"
      aria-label={ariaLabel ?? `status: ${statusText}`}
      title={titleText ?? statusText}
      className={[
        "inline-block rounded-full align-middle transition-shadow duration-200",
        sizeClass,
        bgClass,
        glowClass,
        className,
      ].join(" ")}
    />
  );
});

RenderStatusDot.displayName = "RenderStatusDot";

export default RenderStatusDot;


