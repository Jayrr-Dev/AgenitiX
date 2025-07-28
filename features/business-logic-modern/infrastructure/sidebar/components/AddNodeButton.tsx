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
			className={`group relative w-full rounded-lg border-2 border-node-view border-dashed bg-node-create p-3 transition-all duration-200 ease-in-out hover:border-node-create hover:bg-node-create-hover focus:outline-none focus:ring-2 focus:ring-node-create focus:ring-offset-2 ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
        ${className}
      `}
		>
			<div className="flex flex-col items-center space-y-2">
				<div className="text-control-debug text-lg transition-colors group-hover:text-node-create-text">
					+
				</div>
				<div className="font-medium text-node-create-text text-xs group-hover:text-node-create-text">
					Add Node
				</div>
			</div>
		</button>
	);
};
