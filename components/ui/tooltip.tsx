"use client";

/**
 * Route: components/ui/tooltip.tsx
 * UI TOOLTIP – Radix wrapper with Framer Motion fade transitions
 *
 * • Client-side only; server-safe wrapper remains in provider/root
 * • Smooth fade-in/out using AnimatePresence + motion.div
 * • Retains Radix positioning, portal, and accessibility
 * • Style classes kept minimal; framer-motion handles animation
 *
 * Keywords: tooltip, radix-ui, framer-motion, fade, animate-presence
 */

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";

// Animation configs as top-level constants for maintainability
const TOOLTIP_MOTION_INITIAL = { opacity: 0, scale: 0.96, y: 6 };
const TOOLTIP_MOTION_ANIMATE = { opacity: 1, scale: 1, y: 0 };
const TOOLTIP_MOTION_EXIT = { opacity: 0, scale: 0.96, y: 6 };
const TOOLTIP_MOTION_TRANSITION = { duration: 0.22, ease: "easeOut" } as const;

// Internal context to propagate open state to Content for exit animations
const TooltipOpenContext = React.createContext<boolean>(false);
const useTooltipOpen = (): boolean => React.useContext(TooltipOpenContext);

function TooltipProvider({
	delayDuration = 0,
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

function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
    // Controlled/uncontrolled support to expose open state for animations
    const { open: controlledOpen, defaultOpen, onOpenChange, children, ...rest } = props as {
        open?: boolean;
        defaultOpen?: boolean;
        onOpenChange?: (open: boolean) => void;
        children?: React.ReactNode;
    };

    const isControlled = controlledOpen !== undefined;
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState<boolean>(defaultOpen ?? false);
    const isOpen = isControlled ? (controlledOpen as boolean) : uncontrolledOpen;

    const handleOpenChange = React.useCallback(
        (next: boolean) => {
            onOpenChange?.(next);
            if (!isControlled) setUncontrolledOpen(next);
        },
        [isControlled, onOpenChange]
    );

    return (
        <TooltipProvider>
            <TooltipOpenContext.Provider value={isOpen}>
                <TooltipPrimitive.Root
                    data-slot="tooltip"
                    open={isOpen}
                    onOpenChange={handleOpenChange}
                    {...rest}
                >
                    {children}
                </TooltipPrimitive.Root>
            </TooltipOpenContext.Provider>
        </TooltipProvider>
    );
}

function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
	return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
    className,
    sideOffset = 0,
    children,
    ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
    const isOpen = useTooltipOpen();

    return (
        <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
                // Keep mounted so exit animation can play, basically don't unmount instantly
                forceMount
                data-slot="tooltip-content"
                sideOffset={sideOffset}
                // Keep container styles minimal; visual styles live on motion.div
                className={cn(
                    "z-[9999] origin-[var(--radix-tooltip-content-transform-origin)]",
                    className
                )}
                {...props}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            initial={TOOLTIP_MOTION_INITIAL}
                            animate={TOOLTIP_MOTION_ANIMATE}
                            exit={TOOLTIP_MOTION_EXIT}
                            transition={TOOLTIP_MOTION_TRANSITION}
                            className={
                                "min-w-[50px] max-w-[160px] text-center rounded-md bg-muted px-2 py-1 m-2 font-light text-foreground text-[12px] shadow-sm"
                            }
                        >
                            {children}
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
    );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
