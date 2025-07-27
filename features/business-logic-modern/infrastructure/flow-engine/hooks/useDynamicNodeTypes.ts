import React, { useMemo } from "react";

import createText from "../../../node-domain/create/createText.node";
import storeInMemory from "../../../node-domain/create/storeInMemory.node";
// Import all available node components
// This should be automatically updated when new nodes are created via Plop
// Add new node imports here (Plop can auto-inject these)
import testNode from '../../../node-domain/test/testNode.node';
import triggerToggle from '../../../node-domain/trigger/triggerToggle.node';
import viewText from "../../../node-domain/view/viewText.node";

/**
 * Hook that provides nodeTypes for React Flow
 * Maps node type strings to their actual components
 *
 * When you create a new node with `pnpm new:node`, add the import above
 * and include it in the nodeTypes object below.
 */
export function useDynamicNodeTypes() {
	const nodeTypes = useMemo(
		() => ({
			// Add new node types here
    testNode,
    triggerToggle,
			createText,
			storeInMemory,
			viewText,
		}),
		[]
	);

	return nodeTypes;
}
