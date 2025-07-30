import { useMemo } from "react";

import triggerPulse from '../../../node-domain/trigger/triggerPulse.node';
import aiTools from '../../../node-domain/ai/aiTools.node';
// Add new node imports here (Plop can auto-inject these)
import aiAgent from "../../../node-domain/ai/aiAgent.node";
import createText from "../../../node-domain/create/createText.node";
import storeInMemory from "../../../node-domain/create/storeInMemory.node";
import emailAccount from "../../../node-domain/email/emailAccount.node";
import emailCreator from "../../../node-domain/email/emailCreator.node";
import emailReader from "../../../node-domain/email/emailReader.node";
import testNode from "../../../node-domain/test/testNode.node";
// Import all available node components
// This should be automatically updated when new nodes are created via Plop
import flowConditional from "../../../node-domain/flow/flowConditional.node";
import triggerToggle from "../../../node-domain/trigger/triggerToggle.node";
import viewBoolean from "../../../node-domain/view/viewBoolean.node";
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
			flowConditional,
			viewBoolean,
			triggerPulse,
			aiTools,
			// Add new node types here
			aiAgent,
			testNode,
			triggerToggle,
			createText,
			storeInMemory,
			emailAccount,
			emailReader,
			emailCreator,
			viewText,
		}),
		[]
	);

	return nodeTypes;
}
