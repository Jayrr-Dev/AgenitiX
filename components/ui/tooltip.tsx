"use client";

/**
 * Route: components/ui/tooltip.tsx
 * UI TOOLTIP – Radix wrapper with CSS transitions (optimized for drag performance)
 *
 * • Client-only
 * • Minimal render work: no Framer Motion, no forceMount
 * • Uses Radix portal only when open
 * • Higher default delay to avoid opening while dragging
 *
 * Keywords: tooltip, radix-ui, performance, css-animations, drag-optimization
 */

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as React from "react";

import { cn } from "@/lib/utils";

// Top-level constants
const TOOLTIP_DEFAULT_DELAY_MS = 500; // Reduce accidental opens during drag

/** Provider: keep default delay reasonably high for canvas interactions */
function TooltipProvider({
  delayDuration = TOOLTIP_DEFAULT_DELAY_MS,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

/** Root: lightweight wrapper without internal state machinery */
function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  );
}

function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

/** Content: mounted only when open; CSS-based animations via data-state */
function TooltipContent({
  className,
  sideOffset = 4,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-[9999] rounded-md bg-muted px-2 py-1 m-2 text-[12px] text-foreground shadow-sm",
          // CSS animations (shadcn pattern)
          "data-[state=delayed-open]:animate-in data-[state=closed]:animate-out",
          "data-[state=delayed-open]:fade-in-0 data-[state=closed]:fade-out-0",
          "data-[state=delayed-open]:zoom-in-95 data-[state=closed]:zoom-out-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
          "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2",
          className
        )}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
