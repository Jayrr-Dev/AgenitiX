import { useMemo } from "react";

import timeDelay from '../../../node-domain/time/timeDelay.node';
import timeInterval from '../../../node-domain/time/timeInterval.node';
import timeThrottle from '../../../node-domain/time/timeThrottle.node';
import timeDebounce from '../../../node-domain/time/timeDebounce.node';
import timeStopwatch from '../../../node-domain/time/timeStopwatch.node';
import timeTimeout from '../../../node-domain/time/timeTimeout.node';
// Add new node imports here (Plop can auto-inject these)
import triggerPulse from '../../../node-domain/trigger/triggerPulse.node';
import timeScheduler from '../../../node-domain/trigger/timeScheduler.node';
import aiTools from '../../../node-domain/ai/aiTools.node';
import storeLocal from '../../../node-domain/store/storeLocal.node';
import aiManager from '../../../node-domain/ai/aiManager.node';
import createJson from '../../../node-domain/create/createJson.node';
import createMap from '../../../node-domain/create/createMap.node';
import viewObject from '../../../node-domain/view/viewObject.node';
import viewArray from '../../../node-domain/view/viewArray.node';
import emailPreview from '../../../node-domain/email/emailPreview.node';
import toBoolean from '../../../node-domain/convert/toBoolean.node';
import toText from '../../../node-domain/convert/toText.node';
import toObject from '../../../node-domain/convert/toObject.node';
import toArray from '../../../node-domain/convert/toArray.node';
import toAny from '../../../node-domain/convert/toAny.node';
import aiAgent from "../../../node-domain/ai/aiAgent.node";
import createText from "../../../node-domain/create/createText.node";
import storeInMemory from "../../../node-domain/create/storeInMemory.node";
import emailAccount from "../../../node-domain/email/emailAccount.node";
import emailCreator from "../../../node-domain/email/emailCreator.node";
import emailReader from "../../../node-domain/email/emailReader.node";
import emailSender from "../../../node-domain/email/emailSender.node";
import emailReplier from "../../../node-domain/email/emailReplier.node";
import emailTemplate from "../../../node-domain/email/emailTemplate.node";
import emailBrand from "../../../node-domain/email/emailBrand.node";
import emailAnalytics from "../../../node-domain/email/emailAnalytics.node";
import emailBulk from "../../../node-domain/email/emailBulk.node";
import emailData from "../../../node-domain/email/emailData.node";
import emailList from "../../../node-domain/email/emailList.node";
import emailUpdater from "../../../node-domain/email/emailUpdater.node";
import testNode from "../../../node-domain/test/testNode.node";
import testToast from "../../../node-domain/test/testToast.node";
// Import all available node components
// This should be automatically updated when new nodes are created via Plop
import flowConditional from "../../../node-domain/flow/flowConditional.node";
import triggerToggle from "../../../node-domain/trigger/triggerToggle.node";
import viewBoolean from "../../../node-domain/view/viewBoolean.node";
import viewText from "../../../node-domain/view/viewText.node";
import logicAnd from "../../../node-domain/logic/logicAnd.node";
import logicOr from "../../../node-domain/logic/logicOr.node";
import logicNot from "../../../node-domain/logic/logicNot.node";
import logicXor from "../../../node-domain/logic/logicXor.node";
import logicXnor from "../../../node-domain/logic/logicXnor.node";

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
			timeDelay,
			timeInterval,
			timeThrottle,
			timeDebounce,
			timeStopwatch,
			timeTimeout,
			// Add new node types here
			flowConditional,
			viewBoolean,
			triggerPulse,
			timeScheduler,
			aiTools,
			storeLocal,
			aiManager,
			createJson,
			createMap,
			viewObject,
			viewArray,
			emailPreview,
			toBoolean,
			toText,
			toObject,
			toArray,
			toAny,
			aiAgent,
			testNode,
			testToast,
			triggerToggle,
			createText,
			storeInMemory,
			emailAccount,
			emailReader,
			emailCreator,
			emailSender,
			emailReplier,
			emailTemplate,
			emailBrand,
			emailAnalytics,
			emailBulk,
			emailData,
			emailList,
			emailUpdater,
			viewText,
			logicAnd,
			logicOr,
			logicNot,
			logicXor,
			logicXnor,
		}),
		[]
	);

	return nodeTypes;
}
