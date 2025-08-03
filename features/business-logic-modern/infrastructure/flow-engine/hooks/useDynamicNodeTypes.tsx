import { useMemo, lazy, Suspense } from "react";
import type { ComponentType } from "react";

// Loading component for lazy-loaded nodes, basically shows fallback while loading
const NodeLoadingFallback = () => (
  <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
    <div className="text-sm text-gray-500">Loading node...</div>
  </div>
);

// Lazy load all node components to reduce initial bundle size, basically improves app startup performance
const triggerPulse = lazy(() => import('../../../node-domain/trigger/triggerPulse.node'));
const timeScheduler = lazy(() => import('../../../node-domain/trigger/timeScheduler.node'));
const aiTools = lazy(() => import('../../../node-domain/ai/aiTools.node'));
const storeLocal = lazy(() => import('../../../node-domain/store/storeLocal.node'));
const aiManager = lazy(() => import('../../../node-domain/ai/aiManager.node'));
const createObject = lazy(() => import('../../../node-domain/create/createObject.node'));
const createMap = lazy(() => import('../../../node-domain/create/createMap.node'));
const viewTest = lazy(() => import('../../../node-domain/view/viewTest.node'));
const aiAgent = lazy(() => import("../../../node-domain/ai/aiAgent.node"));
const createText = lazy(() => import("../../../node-domain/create/createText.node"));
const storeInMemory = lazy(() => import("../../../node-domain/create/storeInMemory.node"));
const emailAccount = lazy(() => import("../../../node-domain/email/emailAccount.node"));
const emailCreator = lazy(() => import("../../../node-domain/email/emailCreator.node"));
const emailReader = lazy(() => import("../../../node-domain/email/emailReader.node"));
const emailSender = lazy(() => import("../../../node-domain/email/emailSender.node"));
const emailReplier = lazy(() => import("../../../node-domain/email/emailReplier.node"));
const emailTemplate = lazy(() => import("../../../node-domain/email/emailTemplate.node"));
const emailBrand = lazy(() => import("../../../node-domain/email/emailBrand.node"));
const emailAnalytics = lazy(() => import("../../../node-domain/email/emailAnalytics.node"));
const emailBulk = lazy(() => import("../../../node-domain/email/emailBulk.node"));
const emailData = lazy(() => import("../../../node-domain/email/emailData.node"));
const emailList = lazy(() => import("../../../node-domain/email/emailList.node"));
const emailUpdater = lazy(() => import("../../../node-domain/email/emailUpdater.node"));
const testNode = lazy(() => import("../../../node-domain/test/testNode.node"));
const testToast = lazy(() => import("../../../node-domain/test/testToast.node"));
const flowConditional = lazy(() => import("../../../node-domain/flow/flowConditional.node"));
const triggerToggle = lazy(() => import("../../../node-domain/trigger/triggerToggle.node"));
const viewBoolean = lazy(() => import("../../../node-domain/view/viewBoolean.node"));
const viewText = lazy(() => import("../../../node-domain/view/viewText.node"));

// Helper function to wrap lazy components with Suspense, basically provides loading fallback
const withSuspense = (LazyComponent: ComponentType<any>) => (props: any) => (
  <Suspense fallback={<NodeLoadingFallback />}>
    <LazyComponent {...props} />
  </Suspense>
);

/**
 * Hook that provides nodeTypes for React Flow
 * Maps node type strings to their actual components
 *
 * When you create a new node with `pnpm new:node`, add the import above
 * and include it in the nodeTypes object below.
 */
export function useDynamicNodeTypes() {
	// Wrap all lazy components with Suspense to provide loading fallbacks, basically prevents errors during async loading
	const nodeTypes = useMemo(
		() => ({
			flowConditional: withSuspense(flowConditional),
			viewBoolean: withSuspense(viewBoolean),
			triggerPulse: withSuspense(triggerPulse),
			timeScheduler: withSuspense(timeScheduler),
			aiTools: withSuspense(aiTools),
			storeLocal: withSuspense(storeLocal),
			aiManager: withSuspense(aiManager),
			createObject: withSuspense(createObject),
			createMap: withSuspense(createMap),
			viewTest: withSuspense(viewTest),
			// Add new node types here
			aiAgent: withSuspense(aiAgent),
			testNode: withSuspense(testNode),
			testToast: withSuspense(testToast),
			triggerToggle: withSuspense(triggerToggle),
			createText: withSuspense(createText),
			storeInMemory: withSuspense(storeInMemory),
			emailAccount: withSuspense(emailAccount),
			emailReader: withSuspense(emailReader),
			emailCreator: withSuspense(emailCreator),
			emailSender: withSuspense(emailSender),
			emailReplier: withSuspense(emailReplier),
			emailTemplate: withSuspense(emailTemplate),
			emailBrand: withSuspense(emailBrand),
			emailAnalytics: withSuspense(emailAnalytics),
			emailBulk: withSuspense(emailBulk),
			emailData: withSuspense(emailData),
			emailList: withSuspense(emailList),
			emailUpdater: withSuspense(emailUpdater),
			viewText: withSuspense(viewText),
		}),
		[]
	);

	return nodeTypes;
}
