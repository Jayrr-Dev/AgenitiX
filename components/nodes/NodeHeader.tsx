/**
 * NODE HEADER COMPONENT - Standard header for node components
 *
 * • Displays node title with consistent styling across all node types
 * • Integrates with node theming system for category-based styling
 * • Provides proper text contrast and accessibility compliance
 * • Supports dark/light theme switching with semantic tokens
 *
 * Keywords: node-header, theming, accessibility, consistency
 */

import type React from "react";

interface NodeHeaderProps {
	title: string;
	className?: string;
}

export const NodeHeader: React.FC<NodeHeaderProps> = ({ title, className = "" }) => {
	return (
		<div
			className={`border-node-view border-b p-2 font-medium text-node-view text-sm ${className}`}
		>
			{title}
		</div>
	);
};
