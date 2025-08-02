/**
 * BUTTON TOGGLE - Shadcn-style toggle button component
 *
 * • Follows shadcn/ui patterns with class-variance-authority for variants
 * • Supports customizable initial and active states with different text
 * • Configurable width, height, and styling through variants
 * • Built-in toggle state management or controlled mode
 * • Full TypeScript support with proper prop validation
 *
 * Keywords: shadcn, button-toggle, cva, variants, state-management
 */

import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonToggleVariants = cva(
	"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer text-center",
	{
		variants: {
			variant: {
				default: "border",
				primary: "border border-blue-600",
				secondary: "border border-gray-600",
				success: "border border-green-600",
				destructive: "border border-red-600",
				outline: "border border-input",
				ghost: "border border-transparent",
			},
			size: {
				default: "h-10 px-4 py-2",
				sm: "h-8 px-3 py-1.5",
				lg: "h-12 px-6 py-3",
				xs: "h-6 px-2 py-1 text-xs",
			},
			width: {
				auto: "w-auto",
				xs: "w-12",
				sm: "w-16",
				md: "w-20",
				lg: "w-24",
				xl: "w-32",
				fixed: "min-w-[3rem]",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
			width: "auto",
		},
	}
);

// Define state styles as a simple object instead of using cva
const toggleStateStyles = {
	default: {
		initial: "bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
		active: "bg-accent text-accent-foreground hover:bg-accent/80",
	},
	primary: {
		initial: "bg-background text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20",
		active: "bg-blue-500 text-white hover:bg-blue-600",
	},
	secondary: {
		initial: "bg-background text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-950/20",
		active: "bg-gray-500 text-white hover:bg-gray-600",
	},
	success: {
		initial: "bg-background text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20",
		active: "bg-green-500 text-white hover:bg-green-600",
	},
	destructive: {
		initial: "bg-background text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20",
		active: "bg-red-500 text-white hover:bg-red-600",
	},
	outline: {
		initial: "bg-background hover:bg-accent hover:text-accent-foreground",
		active: "bg-accent text-accent-foreground hover:bg-accent/80",
	},
	ghost: {
		initial: "hover:bg-accent hover:text-accent-foreground",
		active: "bg-accent text-accent-foreground hover:bg-accent/80",
	},
} as const;

export interface ButtonToggleProps
	extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children" | "onToggle">,
		VariantProps<typeof buttonToggleVariants> {
	/** Whether the button is in active state (controlled mode) */
	isActive?: boolean;
	/** Text to display when in initial/inactive state */
	initialText: string;
	/** Text to display when in active state */
	activeText: string;
	/** Custom className to override default styles */
	customClassName?: string;
	/** Callback when toggle state changes */
	onToggle?: (isActive: boolean) => void;
}

const ButtonToggle = React.forwardRef<HTMLButtonElement, ButtonToggleProps>(
	(
		{
			className,
			customClassName,
			variant,
			size,
			width,
			isActive: controlledActive,
			initialText,
			activeText,
			onToggle,
			onClick,
			...props
		},
		ref
	) => {
		// Internal state for uncontrolled mode
		const [internalActive, setInternalActive] = React.useState(false);
		
		// Use controlled state if provided, otherwise use internal state
		const isActive = controlledActive !== undefined ? controlledActive : internalActive;
		
		// Get the appropriate state styles
		const variantKey = variant || "default";
		const stateStyles = toggleStateStyles[variantKey];
		const currentStateStyle = isActive ? stateStyles.active : stateStyles.initial;
		
		// Handle click events
		const handleClick = React.useCallback(
			(e: React.MouseEvent<HTMLButtonElement>) => {
				const newActiveState = !isActive;
				
				// Update internal state if uncontrolled
				if (controlledActive === undefined) {
					setInternalActive(newActiveState);
				}
				
				// Call external handlers
				onToggle?.(newActiveState);
				onClick?.(e);
			},
			[isActive, controlledActive, onToggle, onClick]
		);

		// Use custom className if provided, otherwise use computed styles
		const finalClassName = customClassName
			? cn(customClassName)
			: cn(
					buttonToggleVariants({ variant, size, width }),
					currentStateStyle,
					className
			  );

		return (
			<button
				className={finalClassName}
				onClick={handleClick}
				ref={ref}
				{...props}
			>
				{isActive ? activeText : initialText}
			</button>
		);
	}
);

ButtonToggle.displayName = "ButtonToggle";

export { ButtonToggle, buttonToggleVariants, toggleStateStyles };