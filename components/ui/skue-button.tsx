/**
 * COMPONENT: SkueButton - Circular animated toggle button (shadcn-compatible)
 *
 * • Client component using hidden checkbox + label for accessible toggle semantics
 * • Scoped styles via CSS Module to match provided gradients, shadows, and animations
 * • Supports controlled and uncontrolled modes with `checked` and `onCheckedChange`
 * • Optional custom icon via children; sensible default icon if none provided
 * • Follows project conventions (TypeScript, no any, top-level constants)
 *
 * Keywords: shadcn, button, toggle, css-modules, accessibility, animations
 */

"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import styles from "./skue-button.module.css";

const SKUE_DEFAULT_ICON = (
	<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
		<path d="M12 2a10 10 0 1 0 10 10A10.012 10.012 0 0 0 12 2Zm1 15h-2v-2h2Zm0-4h-2V7h2Z" />
	</svg>
);

const skueButtonContainerVariants = cva("relative", {
	variants: {
		size: {
			default: "", // fixed by CSS module (7em)
			sm: "scale-90",
			lg: "scale-110",
		},
	},
	defaultVariants: {
		size: "default",
	},
});

export interface SkueButtonProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">,
		VariantProps<typeof skueButtonContainerVariants> {
	/** Controlled checked state */
	checked?: boolean;
	/** Uncontrolled default checked state */
	defaultChecked?: boolean;
	/** Called when checked changes */
	onCheckedChange?: (checked: boolean) => void;
	/** Accessible label for the toggle */
	ariaLabel?: string;
	/** Optional custom icon (defaults to circular info icon) */
	children?: React.ReactNode;
  /** Provide a custom id to link input and label */
	id?: string;
  /** Optional CSS variable to hint host surface background for shadow blending */
  surfaceBgVar?: string;
	/** When true, makes the icon glow with enhanced visual effects */
	activated?: boolean;
}

export const SkueButton = React.forwardRef<HTMLDivElement, SkueButtonProps>(
	(
      {
			className,
			checked,
			defaultChecked,
			onCheckedChange,
			ariaLabel = "Toggle",
			children,
			size,
			id,
        surfaceBgVar,
			activated = false,
			...rest
		},
		ref
	) => {
		const generatedIdRef = React.useRef<string>(`skue-${Math.random().toString(36).slice(2)}`);
		const inputId = id || generatedIdRef.current;

		const isControlled = typeof checked === "boolean";
		const [internalChecked, setInternalChecked] = React.useState<boolean>(Boolean(defaultChecked));
		const effectiveChecked = isControlled ? Boolean(checked) : internalChecked;

		const handleChange = React.useCallback(
			(e: React.ChangeEvent<HTMLInputElement>) => {
				const next = e.target.checked;
				if (!isControlled) {
					setInternalChecked(next);
				}
				onCheckedChange?.(next);
			},
			[isControlled, onCheckedChange]
		);

      return (
			<div
				ref={ref}
				className={cn(
					skueButtonContainerVariants({ size }), 
					styles.container, 
					activated && styles.activated,
					className
				)}
          style={surfaceBgVar ? ({
            // Allows consumers to override the surface color driving shadows
            // [Explanation], basically pass host bg into the CSS module via var
            ["--skue-surface-bg" as any]: `var(${surfaceBgVar})`,
          } as React.CSSProperties) : undefined}
          {...rest}
			>
				<input
					id={inputId}
					type="checkbox"
					aria-label={ariaLabel}
					checked={effectiveChecked}
					onChange={handleChange}
				/>
				<label className={styles.button} htmlFor={inputId}>
					<span className={styles.icon} aria-hidden>
						{children ?? SKUE_DEFAULT_ICON}
					</span>
				</label>
			</div>
		);
	}
);

SkueButton.displayName = "SkueButton";

export default SkueButton;


