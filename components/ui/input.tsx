import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "node";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, variant = "default", ...props }, ref) => {
		const baseStyles = "flex w-full ring-offset-background file:border-0 file:bg-transparent file:font-medium disabled:cursor-not-allowed disabled:opacity-50";
		
		const variants = {
			default: "h-6 rounded-md border border-input bg-background px-3 py-1 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-2 ring-0",
			node: "h-6 rounded-sm border-0 bg-transparent px-2 py-0.5 text-[10px] placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 ring-0 shadow-none"
		};

		return (
			<input
				type={type}
				className={cn(
					baseStyles,
					variants[variant],
					className
				)}
				ref={ref}
				{...props}
			/>
		);
	}
);
Input.displayName = "Input";

export { Input };
