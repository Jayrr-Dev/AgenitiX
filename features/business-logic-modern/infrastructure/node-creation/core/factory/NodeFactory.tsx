/**
 * NODE FACTORY – Enterprise‑grade node creation system
 *
 * Key features
 * ------------
 * • Modular safety layers
 * • GPU‑accelerated visual updates (UltraFastPropagationEngine)
 * • Atomic state with Immer
 * • Robust error boundaries & memory‑safe cleanup (WeakRef / FinalizationRegistry)
 * • JSON input support, React 19 concurrent ready
 * • Tree‑shaking & SSR‑safe style injection
 *
 * Performance highlights
 * ----------------------
 * • Static imports → smaller bundle, better tree‑shaking
 * • Per‑canvas schedulers → no head‑of‑line blocking
 * • WeakRef caches & object pools → fewer allocations
 * • Idle‑time hydration & node parking → lower CPU when off‑screen
 *
 * @version   3.0.0
 * @author    Enterprise Team
 */

/* ─────────────────────────── Theme bootstrap ─────────────────────────── */
import "../../../theming/init/themeInitializer";
import {
  NodeState,
  UltraFastPropagationEngine,
} from "./systems/propagation/UltraFastPropagationEngine";

/* ─────────────────────────────── React / XYFlow ────────────────────────── */
import type { Node, NodeProps } from "@xyflow/react";
import React, {
  createContext,
  memo,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

/* ──────────────────────────────── Types & utils ────────────────────────── */
import {
  freezeConfig,
  validateNodeConfigLegacy as validateNodeConfig,
} from "./config";
import { ERROR_INJECTION_SUPPORTED_NODES } from "./config/constants";
import { initializeEnterpriseStylesLegacy as initializeEnterpriseStyles } from "./core";
import type { BaseNodeData, NodeFactoryConfig } from "./types";
import { validateNodeSize } from "./types";
import { configureNodeHandles } from "./utils/handles";

/* ──────────────────────────────── Hooks ────────────────────────────────── */
import {
  useNodeConnections,
  useNodeHandles,
  useNodeProcessing,
  useNodeRegistration,
  useNodeState,
  useNodeStyling,
} from "./hooks";

/* ───────────────────────────── Components ──────────────────────────────── */
import { NodeContainer } from "./components/NodeContainer";
import { NodeContent } from "./components/NodeContent";
import { DeferUntilIdle } from "./systems/performance/IdleHydration";
import { NodeErrorBoundary } from "./systems/safety";

/* ───────────────────────────── Safety layers ───────────────────────────── */
import { SafeDataFlowController } from "./providers/DataFlowProvider";
import { SafeStateLayer } from "./providers/SafeStateProvider";
import { globalSafetyLayers } from "./utils/management/nodeUtilities";

/* ───────────────────────────── Performance ─────────────────────────────── */
import { createNodeParkingManager } from "./systems/performance/NodeParkingManager";
import { createScheduler } from "./systems/performance/Scheduler";

/* ───────────────────────────── Flow Store ──────────────────────────────── */
import { useFlowStore } from "@/features/business-logic-modern/infrastructure/flow-engine/stores/flowStore";

/* ======================================================================== */
/* Context & hooks                                                          */
/* ======================================================================== */

interface SafetyLayerInstance {
  state: SafeStateLayer<Record<string, unknown>>;
  dataFlow: SafeDataFlowController;
  scheduler?: ReturnType<typeof createScheduler>;
  parkingManager: ReturnType<typeof createNodeParkingManager> | any;
  propagationEngine:
    | UltraFastPropagationEngine
    | import("./utils/management/nodeUtilities").PropagationEngineInterface;
  getNodeState: (nodeId: string) => NodeState | undefined;
  forceDeactivate: (nodeId: string) => void;
  propagateUltraFast: (
    nodeId: string,
    active: boolean,
    isButtonDriven?: boolean
  ) => void;
}

const SafetyLayersContext = createContext<SafetyLayerInstance | null>(null);

export function SafetyLayersProvider({
  children,
  layers,
  customScheduler,
}: {
  children: React.ReactNode;
  layers?: SafetyLayerInstance;
  customScheduler?: ReturnType<typeof createScheduler>;
}) {
  const scheduler = customScheduler || createScheduler();
  const parkingManager = createNodeParkingManager();
  const propagationEngine = new UltraFastPropagationEngine();

  const defaultLayers: SafetyLayerInstance = {
    state: new SafeStateLayer(),
    dataFlow: new SafeDataFlowController(),
    scheduler,
    parkingManager,
    propagationEngine,
    getNodeState: (id) =>
      "getNodeState" in propagationEngine
        ? propagationEngine.getNodeState(id)
        : undefined,
    forceDeactivate: (id) => {
      const s = new SafeStateLayer();
      if ("forceDeactivate" in propagationEngine) {
        propagationEngine.forceDeactivate(id, (nId, data) =>
          s.updateState(nId, data)
        );
      }
    },
    propagateUltraFast: (id, active, btn = true) => {
      const s = new SafeStateLayer();
      if ("propagate" in propagationEngine) {
        propagationEngine.propagate(
          id,
          active,
          (nId, data) => s.updateState(nId, data),
          btn
        );
      }
    },
  };

  return (
    <SafetyLayersContext.Provider value={layers || defaultLayers}>
      {children}
    </SafetyLayersContext.Provider>
  );
}

function useSafetyLayers(): SafetyLayerInstance {
  return useContext(SafetyLayersContext) || globalSafetyLayers;
}

export function useNodeStateMachine(nodeId: string) {
  const { propagateUltraFast, forceDeactivate, getNodeState } =
    useSafetyLayers();
  const [currentState, setCurrentState] = useState<NodeState>();

  useEffect(() => {
    const update = () => setCurrentState(getNodeState(nodeId));
    update();
    const i = setInterval(update, 100);
    return () => clearInterval(i);
  }, [nodeId, getNodeState]);

  return {
    propagateUltraFast: (active: boolean, btn = true) =>
      propagateUltraFast(nodeId, active, btn),
    forceDeactivate: () => forceDeactivate(nodeId),
    getNodeState: () => getNodeState(nodeId),
    currentState,
    isActive: currentState === NodeState.ACTIVE,
    isInactive: currentState === NodeState.INACTIVE,
    isPendingActivation: currentState === NodeState.PENDING_ACTIVATION,
    isPendingDeactivation: currentState === NodeState.PENDING_DEACTIVATION,
  };
}

/* ======================================================================== */
/* Main factory util                                                        */
/* ======================================================================== */

export function createNodeComponent<T extends BaseNodeData>(
  cfg: NodeFactoryConfig<T>
) {
  validateNodeConfig(cfg);
  const frozenCfg = freezeConfig(cfg);
  const handleResult = configureNodeHandles(frozenCfg as any);
  const handles = handleResult.handles;
  if (frozenCfg.size && !validateNodeSize(frozenCfg.size)) {
    console.warn(`Invalid size for ${frozenCfg.nodeType}`, frozenCfg.size);
  }
  const finalCfg = Object.freeze({ ...frozenCfg, handles });
  initializeEnterpriseStyles();
  if (ERROR_INJECTION_SUPPORTED_NODES.includes(finalCfg.nodeType as any)) {
    console.debug(`${finalCfg.nodeType}: error injection enabled`);
  }

  const EnterpriseNode = ({
    id,
    data,
    selected,
  }: NodeProps<Node<T & Record<string, unknown>>>) => {
    const safety = useSafetyLayers();
    const safetyRef = useRef(safety);

    /* ───────────── Hook stack ───────────── */
    const regCfg = useNodeRegistration(
      finalCfg as unknown as NodeFactoryConfig<BaseNodeData>
    );
    const nodeState = useNodeState<T>(
      id,
      data,
      regCfg as unknown as NodeFactoryConfig<T>
    );
    const connData = useNodeConnections(id, regCfg.handles!);
    const procState = useNodeProcessing<T>(
      id,
      nodeState,
      connData,
      regCfg as unknown as NodeFactoryConfig<T>,
      safetyRef.current,
      nodeState.updateNodeDataWithBusinessLogic
    );
    const styling = useNodeStyling(
      regCfg.nodeType,
      selected,
      procState.error,
      procState.isActive,
      nodeState.data
    );
    const handleCfg = useNodeHandles(
      regCfg.handles!,
      connData.connections,
      connData.allNodes
    );

    /* Flow store for node operations */
    const updateNodeId = useFlowStore((state) => state.updateNodeId);

    /* Register with state machine */
    useEffect(() => {
      const { state, dataFlow, propagationEngine, propagateUltraFast } =
        safetyRef.current;
      state.registerNode(id, nodeState.data as T, nodeState.updateNodeDataWithBusinessLogic);
      dataFlow.setNodeActivation(id, procState.isActive);
      propagateUltraFast(id, procState.isActive, false);
      return () => {
        // Handle both UltraFastPropagationEngine and PropagationEngineInterface
        if ("cleanupNode" in propagationEngine) {
          propagationEngine.cleanupNode(id);
        }
        state.cleanup(id);
        dataFlow.cleanup(id);
      };
    }, [id, nodeState.data, nodeState.updateNodeDataWithBusinessLogic, procState.isActive]);

    /* Sync DOM with machine state */
    useEffect(() => {
      const { getNodeState } = safetyRef.current;
      const s = getNodeState(id);
      const el = document.querySelector(`[data-id="${id}"]`);
      if (el && s !== undefined) el.setAttribute("data-node-state", `${s}`);
    }, [id, procState.isActive]);

    /* Heavy nodes hydrate when idle */
    const heavy = [
      "code-editor",
      "large-dataset",
      "complex-visualization",
    ].includes(regCfg.nodeType);
    const content = (
      <NodeErrorBoundary
        nodeId={id}
        resetKeys={[
          id,
          String(procState.error || ""),
          JSON.stringify(nodeState.data),
        ]}
      >
        <NodeContainer
          id={id}
          styling={styling}
          nodeState={nodeState}
          enhancedConfig={regCfg}
          isEnterprise
          onNodeIdChange={updateNodeId}
        >
          <NodeContent
            id={id}
            nodeState={nodeState}
            processingState={procState}
            styling={styling}
            handles={handleCfg}
            enhancedConfig={regCfg}
          />
        </NodeContainer>
      </NodeErrorBoundary>
    );

    return heavy ? (
      <DeferUntilIdle timeout={3000}>{content}</DeferUntilIdle>
    ) : (
      content
    );
  };

  EnterpriseNode.displayName = `Enterprise${frozenCfg.displayName}`;
  return memo(EnterpriseNode);
}

/* ======================================================================== */
/* Re‑exports                                                               */
/* ======================================================================== */
export { freezeConfig, validateNodeConfig } from "./config";
export { initializeEnterpriseStyles } from "./core";
export {
  createButtonControl,
  createCheckboxControl,
  createColorControl,
  createConditionalControl,
  createGroupControl,
  createNumberInputControl,
  createRangeControl,
  createSelectControl,
  createTextareaControl,
  createTextInputControl,
} from "./helpers/inspectorControlHelpers";
export {
  createLogicNodeConfig,
  createTextNodeConfig,
  createTriggeredNodeConfig,
  createUniversalNodeConfig,
} from "./helpers/nodeConfigHelpers";
export type { BaseNodeData, HandleConfig, NodeFactoryConfig } from "./types";
