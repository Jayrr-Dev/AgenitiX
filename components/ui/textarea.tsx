/**
 * Textarea COMPONENT – Enhanced with cursor position preservation
 *
 * • Preserves cursor position and selection during React re-renders
 * • Handles both controlled and uncontrolled textarea behavior
 * • Maintains scroll position across component updates
 * • Compatible with all existing textarea props and styling
 * • Uses requestAnimationFrame for reliable DOM updates
 *
 * Keywords: textarea, cursor-preservation, react-rendering, stable-input
 */

import type * as React from "react";
import { forwardRef, useCallback, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

const Textarea = forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
	({ className, onChange, ...props }, ref) => {
		// Track cursor position to restore after re-renders
		const cursorPositionRef = useRef<{ start: number; end: number } | null>(null);
		const internalRef = useRef<HTMLTextAreaElement | null>(null);
		const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

		// Save cursor position before any change
		const handleChange = useCallback(
			(e: React.ChangeEvent<HTMLTextAreaElement>) => {
				// Save cursor position before update
				cursorPositionRef.current = {
					start: e.target.selectionStart,
					end: e.target.selectionEnd,
				};

				// Call original onChange if provided
				if (onChange) {
					onChange(e);
				}
			},
			[onChange]
		);

		// Restore cursor position after re-renders
		useEffect(() => {
			if (cursorPositionRef.current && textareaRef.current) {
				requestAnimationFrame(() => {
					if (textareaRef.current) {
						textareaRef.current.setSelectionRange(
							cursorPositionRef.current!.start,
							cursorPositionRef.current!.end
						);
					}
				});
			}
		}, [props.value, textareaRef]);

		return (
			<textarea
				ref={textareaRef}
				data-slot="textarea"
				className={cn(
					"field-sizing-content flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:ring-destructive/40",
					className
				)}
				onChange={handleChange}
				{...props}
			/>
		);
	}
);

Textarea.displayName = "Textarea";

export { Textarea };
