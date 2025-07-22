/**
 * ADD NODE BUTTON - Node creation button with semantic tokens
 *
 * • Provides button for adding new nodes to the flow
 * • Uses semantic tokens for consistent theming
 * • Integrates with node creation system
 * • Maintains accessibility and interaction patterns
 * • Supports hover and focus states with semantic styling
 *
 * Keywords: add-node-button, semantic-tokens, node-creation, accessibility, interaction
 */

import type React from "react";

interface AddNodeButtonProps {
	onClick: () => void;
	disabled?: boolean;
	className?: string;
	title?: string;
}

export const AddNodeButton: React.FC<AddNodeButtonProps> = ({
	onClick,
	disabled = false,
	className = "",
	title,
}) => {
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			title={title}
			className={`
        group relative w-full p-3 rounded-lg border-2 border-dashed
        border-node-view hover:border-node-create
        bg-node-create hover:bg-node-create-hover
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-node-create focus:ring-offset-2
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
		>
			<div className="flex flex-col items-center space-y-2">
				<div className="text-lg text-control-debug group-hover:text-node-create-text transition-colors">
					+
				</div>
				<div className="text-xs text-node-create-text group-hover:text-node-create-text font-medium">
					Add Node
				</div>
			</div>
		</button>
	);
};
