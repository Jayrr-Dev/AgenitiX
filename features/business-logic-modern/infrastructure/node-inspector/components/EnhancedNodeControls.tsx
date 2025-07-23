/**
 * ENHANCED NODE CONTROLS - NodeSpec-aligned control rendering
 *
 * • Provides enhanced control interfaces based on NodeSpec metadata
 * • Simplified component focused on NodeSpec integration
 * • Works with DynamicControls for comprehensive control coverage
 * • Aligns with modern Plop-based node creation system
 *
 * Keywords: enhanced-controls, nodespec-aligned, plop-integration
 */

"use client";

import type { AgenNode } from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";
import type React from "react";
import type { InspectorNodeInfo } from "../adapters/NodeInspectorAdapter";
import { BaseControl } from "../controls/BaseControl";
import { DynamicControls } from "./DynamicControls";

// ============================================================================
// COMPONENT INTERFACE
// ============================================================================

interface EnhancedNodeControlsProps {
	node: AgenNode;
	nodeInfo: InspectorNodeInfo;
	updateNodeData: (id: string, patch: Record<string, unknown>) => void;
	onLogError: (nodeId: string, message: string) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const EnhancedNodeControls: React.FC<EnhancedNodeControlsProps> = ({
	node,
	nodeInfo,
	updateNodeData,
	onLogError,
}) => {
	// Use DynamicControls for all control rendering
	// This aligns with the NodeSpec system and reduces duplication
	return (
		<BaseControl title={`${nodeInfo.displayName} Configuration`} nodeType={nodeInfo.category}>
			<DynamicControls node={node} updateNodeData={updateNodeData} onLogError={onLogError} />

			{/* Development debug info */}
			{/* {process.env.NODE_ENV === "development" && (
				<div className="mt-4 p-2 bg-control-debug rounded border-control-input text-xs">
					<div className="font-medium text-control-input mb-1">🔧 NodeSpec Integration:</div>
					<div className="space-y-0.5 text-control-placeholder">
						<div>
							Node Type: <code>{node.type}</code>
						</div>
						<div>
							Category: <code>{nodeInfo.category}</code>
						</div>
						<div>Has Controls: {nodeInfo.hasControls ? "✅" : "❌"}</div>
						<div>Valid: {nodeInfo.isValid ? "✅" : "❌"}</div>
					</div>
				</div>
			)} */}
		</BaseControl>
	);
};
