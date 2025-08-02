/**
 * BUTTON ICONED - Shadcn-style button with React icons support
 *
 * • Follows shadcn/ui patterns with class-variance-authority for variants
 * • Supports React icons positioned to the left of text
 * • Responsive design - automatically hides text on mobile, shows only icon
 * • Configurable text, className, size, and icon
 * • Full TypeScript support with proper prop validation
 * • Maintains accessibility with proper ARIA labels
 *
 * Keywords: shadcn, button-iconed, react-icons, responsive, mobile-first
 */

import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonIconedVariants = cva(
	"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground hover:bg-primary/90",
				destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
				outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
				secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
				ghost: "hover:bg-accent hover:text-accent-foreground",
				link: "text-primary underline-offset-4 hover:underline",
			},
							size: {
					default: "h-10 px-4 py-2",
					sm: "h-9 px-3",
					lg: "h-11 px-8",
					xs: "h-6 px-2",
					icon: "h-10 w-10",
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

const iconSizeMap = {
	xs: 12,
	sm: 14,
	default: 16,
	lg: 18,
	icon: 16,
} as const;

const iconSizeVariants = {
	xs: 12,
	sm: 14,
	default: 16,
	lg: 18,
	xl: 20,
	"2xl": 24,
} as const;

export interface ButtonIconedProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonIconedVariants> {
	/** React icon component to display */
	icon: React.ComponentType<{ size?: number; className?: string }>;
	/** Text to display next to the icon */
	text: string;
	/** Custom className to override or extend default styles */
	customClassName?: string;
	/** Use Slot for composition */
	asChild?: boolean;
	/** Hide text on all screen sizes (icon only) */
	iconOnly?: boolean;
	/** Icon size variant - overrides default size mapping */
	iconSize?: keyof typeof iconSizeVariants;
	/** Custom icon size in pixels - overrides iconSize variant */
	customIconSize?: number;
}

const ButtonIconed = React.forwardRef<HTMLButtonElement, ButtonIconedProps>(
	(
		{
			className,
			customClassName,
			variant,
			size,
			width,
			icon: Icon,
			text,
			asChild = false,
			iconOnly = false,
			iconSize,
			customIconSize,
			...props
		},
		ref
	) => {
		const Comp = asChild ? Slot : "button";
		
		// Get icon size based on button size or custom props
		const finalIconSize = customIconSize 
			? customIconSize 
			: iconSize 
				? iconSizeVariants[iconSize] 
				: iconSizeMap[size || "default"];
		
		// Determine if we should show text based on screen size and iconOnly prop
		const shouldHideText = iconOnly;
		
		// Base button classes
		const buttonClasses = buttonIconedVariants({ variant, size, width });
		
		// Text classes with responsive hiding
		const textClasses = shouldHideText 
			? "sr-only" 
			: "hidden sm:inline-block ml-2";
		
		// Icon container classes
		const iconContainerClasses = "flex-shrink-0";
		
		// Adjust padding for mobile (icon-only mode) - ensure square shape
		const responsivePadding = shouldHideText 
			? "" 
			: size === "xs" 
				? "sm:px-0" 
				: size === "sm" 
					? "sm:px-4" 
					: size === "lg" 
						? "sm:px-8" 
						: "sm:px-4";
		
		// Mobile icon-only padding - make square by setting width equal to height (only on mobile)
		const mobileIconPadding = shouldHideText 
			? "" 
			: size === "xs" 
				? "px-0 w-8 sm:w-auto sm:px-3" // Square on mobile, auto width on desktop
				: size === "sm" 
					? "px-0 w-9 sm:w-auto sm:px-4" // Square on mobile, auto width on desktop
					: size === "lg" 
						? "px-0 w-11 sm:w-auto sm:px-8" // Square on mobile, auto width on desktop
						: "px-0 w-10 sm:w-auto sm:px-4"; // Square on mobile, auto width on desktop
		
		// Final className composition
		const finalClassName = customClassName
			? cn(customClassName)
			: cn(
					buttonClasses,
					!shouldHideText && mobileIconPadding,
					className
			  );

		return (
			<Comp
				className={finalClassName}
				ref={ref}
				aria-label={text} // Always provide accessible label
				title={text} // Tooltip for icon-only mode
				{...props}
			>
				<div className={iconContainerClasses}>
					<Icon size={finalIconSize} className="flex-shrink-0" />
				</div>
				<span className={textClasses}>
					{text}
				</span>
			</Comp>
		);
	}
);

ButtonIconed.displayName = "ButtonIconed";

export { ButtonIconed, buttonIconedVariants };