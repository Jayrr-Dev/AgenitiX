/**
 * THEMED MINI MAP COMPONENT - Miniature flow visualization with semantic theming
 *
 * • Miniature overview of the entire flow canvas with zoom and pan controls
 * • Integrated with semantic token system for consistent theming
 * • Responsive design with proper contrast and accessibility
 * • Smooth interactions and visual feedback for navigation
 * • Customizable styling and positioning options
 *
 * Keywords: mini-map, flow-overview, semantic-tokens, navigation, accessibility
 */

"use client";

import { MiniMap } from "@xyflow/react";
import type React from "react";

interface ThemedMiniMapProps {
	className?: string;
	position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
	pannable?: boolean;
	zoomable?: boolean;
	ariaLabel?: string;
}

export const ThemedMiniMap: React.FC<ThemedMiniMapProps> = ({
	className = "",
	position = "bottom-right",
	pannable = true,
	zoomable = true,
	ariaLabel = "Mini map overview",
}) => {
	return (
		<MiniMap
			className={`rounded border border-[var(--infra-minimap-border)] bg-[var(--infra-minimap-bg)] shadow-sm transition-colors duration-200 hover:border-[var(--infra-minimap-border-hover)] hover:bg-[var(--infra-minimap-bg-hover)] ${className}`}
			position={position}
			pannable={pannable}
			zoomable={zoomable}
			ariaLabel={ariaLabel}
			nodeColor={(node) => {
				// Use semantic colors based on node category/type
				const nodeCategory = node.data?.category || node.type;

				// Map node types to categories if category is not directly available
				let resolvedCategory = nodeCategory;
				if (typeof nodeCategory === "string") {
					if (nodeCategory === "createText" || nodeCategory.startsWith("create")) {
						resolvedCategory = "CREATE";
					} else if (nodeCategory.startsWith("view")) {
						resolvedCategory = "VIEW";
					} else if (nodeCategory.startsWith("trigger")) {
						resolvedCategory = "TRIGGER";
					} else if (nodeCategory.startsWith("test")) {
						resolvedCategory = "TEST";
					} else if (nodeCategory.startsWith("email")) {
						resolvedCategory = "EMAIL";
					} else if (nodeCategory.startsWith("flow")) {
						resolvedCategory = "FLOW";
					} else if (nodeCategory.startsWith("time")) {
						resolvedCategory = "TIME";
					} else if (nodeCategory.startsWith("ai")) {
						resolvedCategory = "AI";
					} else if (nodeCategory.startsWith("store")) {
						resolvedCategory = "STORE";
					} else if (nodeCategory.startsWith("cycle")) {
						resolvedCategory = "CYCLE";
					}
				}

				// Debug logging to see what categories we're getting
				if (process.env.NODE_ENV === "development") {
				}

				switch (resolvedCategory) {
					case "CREATE":
						return "var(--node-create-bg)";
					case "VIEW":
						return "var(--node-view-bg)";
					case "TRIGGER":
						return "var(--node-trigger-bg)";
					case "TEST":
						return "var(--node-test-bg)";
					case "CYCLE":
						return "var(--node-cycle-bg)";
					case "STORE":
						return "var(--node-store-bg)";
					case "EMAIL":
						return "var(--node-email-bg)";
					case "AI":
						return "var(--node-ai-bg)";
					case "TIME":
						return "var(--node-time-bg)";
					case "FLOW":
						return "var(--node-flow-bg)";
					default:
						return "var(--node-view-bg)";
				}
			}}
			nodeStrokeColor={(node) => {
				// Use semantic border colors based on node category/type
				const nodeCategory = node.data?.category || node.type;

				// Map node types to categories if category is not directly available
				let resolvedCategory = nodeCategory;
				if (typeof nodeCategory === "string") {
					if (nodeCategory === "createText" || nodeCategory.startsWith("create")) {
						resolvedCategory = "CREATE";
					} else if (nodeCategory.startsWith("view")) {
						resolvedCategory = "VIEW";
					} else if (nodeCategory.startsWith("trigger")) {
						resolvedCategory = "TRIGGER";
					} else if (nodeCategory.startsWith("test")) {
						resolvedCategory = "TEST";
					} else if (nodeCategory.startsWith("cycle")) {
						resolvedCategory = "CYCLE";
					}
				}

				switch (resolvedCategory) {
					case "CREATE":
						return "var(--node-create-bg-hover)"; // Slightly darker for border
					case "VIEW":
						return "var(--node-view-bg-hover)";
					case "TRIGGER":
						return "var(--node-trigger-bg-hover)";
					case "TEST":
						return "var(--node-test-bg-hover)";
					case "CYCLE":
						return "var(--node-cycle-bg-hover)";
					default:
						return "var(--node-view-bg-hover)";
				}
			}}
			nodeStrokeWidth={2}
			maskColor="var(--infra-minimap-mask)"
			style={{
				backgroundColor: "var(--infra-minimap-bg)",
				border: "1px solid var(--infra-minimap-border)",
			}}
		/>
	);
};

export default ThemedMiniMap;
