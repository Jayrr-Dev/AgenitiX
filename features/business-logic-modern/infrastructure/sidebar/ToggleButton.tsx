interface ToggleButtonProps {
	isHidden: boolean;
	onToggle: () => void;
}

export function ToggleButton({ isHidden, onToggle }: ToggleButtonProps) {
	return (
		<button
			onClick={onToggle}
			className="absolute right-0.5 bottom-0 z-40 cursor-pointer"
			aria-label={isHidden ? "Show sidebar" : "Hide sidebar"}
			title={isHidden ? "Show (Alt+S)" : "Hide (Alt+S)"}
			type="button"
		>
			{isHidden ? "⦾" : "⦿"}
		</button>
	);
}
