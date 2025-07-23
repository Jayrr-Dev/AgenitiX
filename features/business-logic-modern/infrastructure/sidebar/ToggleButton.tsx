import React from "react";

interface ToggleButtonProps {
	isHidden: boolean;
	onToggle: () => void;
}

export function ToggleButton({ isHidden, onToggle }: ToggleButtonProps) {
	return (
		<button
			onClick={onToggle}
			className="absolute bottom-0 right-0.5 z-40 cursor-pointer"
			aria-label={isHidden ? "Show sidebar" : "Hide sidebar"}
			title={isHidden ? "Show sidebar (Alt+S)" : "Hide sidebar (Alt+S)"}
		>
			{isHidden ? "⦾" : "⦿"}
		</button>
	);
}
