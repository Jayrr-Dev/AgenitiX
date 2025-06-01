"use client";

/* -------------------------------------------------------------------------- */
/* DelayNode.tsx – high-throughput version (boolean-safe)                     */
/* -------------------------------------------------------------------------- */

import {
  Position,
  useNodeConnections,
  useNodesData,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import CustomHandle from "../../handles/TypesafeHandle";
import { useFlowStore } from "../../stores/flowStore";
import IconForDelay from "../node-icons/IconForDelay";

/* -------------------------------------------------------------------------- */
/* CONSTANTS & TYPES                                                          */
/* -------------------------------------------------------------------------- */

const MAX_QUEUE_SIZE = 100; // Absolute hard-cap
const INPUT_DEBOUNCE_MS = 16; // 60 Hz frame budget
const STATUS_SNAPSHOT_MS = 100; // UI refresh rate
const QUEUE_PREVIEW_SIZE = 5; // Tooltip preview depth

type Snapshot = {
  len: number;
  preview: unknown[];
  full: boolean;
};

interface DelayNodeData {
  delay: number;
  outputMode?: "passthrough" | "boolean" | "trigger";
  edgeMode?: "level" | "rising" | "falling" | "both";
  lastInputValue?: unknown;
  outputValue?: unknown;
  queueLength?: number;
  queueItems?: unknown[];
  isProcessing?: boolean;
  /** for "boolean pulse" compatibility with trigger nodes */
  triggered?: boolean;
}

type DelayNodeProps = NodeProps<Node<DelayNodeData & Record<string, unknown>>>;

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Smart input comparison that handles both trigger pulses and state changes
 * - For trigger nodes: detect timestamp/unique value changes
 * - For boolean state: supports edge detection modes
 * - For other values: deep equality check
 */
const shouldProcessInput = (
  newVal: unknown,
  oldVal: unknown,
  sourceData: any,
  edgeMode: string = "level"
): boolean => {
  // Handle undefined/null cases
  if (newVal === undefined || newVal === null) return false;
  if (oldVal === undefined || oldVal === null) return true;

  // SPECIAL NaN HANDLING: NaN !== NaN is always true, so handle it specially
  if (typeof newVal === "number" && typeof oldVal === "number") {
    if (Number.isNaN(newVal) && Number.isNaN(oldVal)) {
      return false; // Both are NaN, consider them the same
    }
    if (Number.isNaN(newVal) || Number.isNaN(oldVal)) {
      return true; // One is NaN, the other isn't - they're different
    }
  }

  // TRIGGER DETECTION: Check if source is a trigger-type node
  const isTriggerSource =
    sourceData?.triggered !== undefined ||
    sourceData?.outputMode === "trigger" ||
    (typeof newVal === "number" &&
      typeof oldVal === "number" &&
      Math.abs(newVal - oldVal) > 1000); // timestamp difference

  if (isTriggerSource) {
    // For triggers, compare the actual trigger values/timestamps
    return newVal !== oldVal;
  }

  // BOOLEAN EDGE DETECTION: Handle different edge modes for boolean inputs
  if (typeof newVal === "boolean" && typeof oldVal === "boolean") {
    switch (edgeMode) {
      case "rising":
        return !oldVal && newVal; // false → true
      case "falling":
        return oldVal && !newVal; // true → false
      case "both":
        return newVal !== oldVal; // any change
      case "level":
      default:
        return newVal !== oldVal; // any change (default behavior)
    }
  }

  // OTHER VALUES: Safe deep equality check that handles BigInt
  try {
    const safeStringify = (obj: unknown): string => {
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === "bigint") {
          return value.toString();
        }
        return value;
      });
    };
    return safeStringify(newVal) !== safeStringify(oldVal);
  } catch {
    // Fallback: if serialization fails, consider values different
    return true;
  }
};

const isValid = (x: unknown): boolean => {
  if (x === undefined || x === null) return false;
  // Consider NaN as invalid to prevent it from being processed
  if (typeof x === "number" && Number.isNaN(x)) return false;
  return true;
};

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

const DelayNode: React.FC<DelayNodeProps> = ({ id, data, selected }) => {
  /* ------------- React-Flow helpers ------------------------------------ */
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  /* ------------- Runtime refs ------------------------------------------ */
  const queueRef = useRef<unknown[]>([]); // FIFO
  const runningRef = useRef(false); // processing flag
  const mountedRef = useRef(true); // unmount guard
  const rafRef = useRef<number | null>(null); // RAF id
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRAF = useRef<number | null>(null); // progress anim

  /* ------------- UI state ---------------------------------------------- */
  const [collapsed, setCollapsed] = useState(true);
  const [delayMs, setDelayMs] = useState(() => Math.max(0, data.delay ?? 1000));
  const [outputMode, setOutputMode] = useState<
    "passthrough" | "boolean" | "trigger"
  >(() => data.outputMode ?? "passthrough");
  const [edgeMode, setEdgeMode] = useState<
    "level" | "rising" | "falling" | "both"
  >(() => data.edgeMode ?? "level");
  const [progress, setProgress] = useState(0); // 1 → 0 countdown
  const [processing, setProcessing] = useState(false);
  const [output, setOutput] = useState<unknown>();
  const [snap, setSnap] = useState<Snapshot>({
    len: 0,
    preview: [],
    full: false,
  });
  const [error, setError] = useState<string | null>(null);

  /* ---------------------------------------------------------------------- */
  /* CONNECTION → CURRENT INPUT VALUE                                       */
  /* ---------------------------------------------------------------------- */

  const connections = useNodeConnections({ handleType: "target" });
  const inputCons = useMemo(
    () =>
      connections.filter(
        (c) => c.targetHandle === "x" || c.targetHandle === "b"
      ),
    [connections]
  );
  const sourceIds = useMemo(() => inputCons.map((c) => c.source), [inputCons]);
  const inputsData = useNodesData(sourceIds);

  const currentInput = useCallback((): unknown => {
    const srcData = inputsData[0]?.data;
    if (!srcData) return undefined;

    const keys = [
      "outputValue",
      "value",
      "text",
      "count",
      "triggered",
    ] as const;
    for (const k of keys) {
      if (k in srcData && srcData[k] !== undefined) return srcData[k];
    }
    return srcData;
  }, [inputsData]);

  /* ---------------------------------------------------------------------- */
  /* QUEUE UTILITIES                                                        */
  /* ---------------------------------------------------------------------- */

  const pushInput = useCallback((val: unknown) => {
    if (!isValid(val)) return;
    const q = queueRef.current;
    if (q.length >= MAX_QUEUE_SIZE) q.shift(); // overwrite-oldest
    q.push(val);
  }, []);

  /* ---------------------------------------------------------------------- */
  /* PROCESSOR CORE                                                         */
  /* ---------------------------------------------------------------------- */

  /** Called when one delay completes */
  const finishProcess = useCallback(() => {
    /* stop timers */
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressRAF.current) cancelAnimationFrame(progressRAF.current);
    rafRef.current = timerRef.current = progressRAF.current = null;
    setProgress(0);

    /** dequeued value that just finished waiting */
    const val = queueRef.current.shift();
    runningRef.current = false;
    setProcessing(false);

    /* ---------------- compute output ---------------- */
    let outputValue: unknown;
    switch (outputMode) {
      case "passthrough":
        outputValue = val;
        break;
      case "boolean":
        /* pass the *actual* boolean through - don't force TRUE */
        outputValue = Boolean(val);
        break;
      case "trigger":
        outputValue = Date.now(); // unique timestamp pulse
        break;
      default:
        outputValue = val;
    }

    /* update local + react-flow state */
    setOutput(outputValue);
    const updates: Partial<DelayNodeData> = {
      outputValue,
      queueLength: queueRef.current.length,
      queueItems: queueRef.current.slice(0, QUEUE_PREVIEW_SIZE),
      isProcessing: false,
    };
    if (outputMode === "boolean") updates.triggered = Boolean(outputValue);
    updateNodeData(id, updates);

    /* If boolean pulses should auto-reset, create a short FALSE pulse */
    if (outputMode === "boolean" && outputValue === true) {
      setTimeout(() => {
        if (mountedRef.current && !runningRef.current) {
          setOutput(false);
          updateNodeData(id, { outputValue: false, triggered: false });
        }
      }, 100); // 100 ms pulse
    }

    /* Start the next item, if any */
    if (queueRef.current.length > 0) {
      setTimeout(() => {
        if (!runningRef.current && queueRef.current.length > 0)
          ensureProcessing();
      }, 8);
    }
  }, [id, updateNodeData, outputMode]);

  /** Kick off processing if idle */
  const ensureProcessing = useCallback(() => {
    if (runningRef.current || queueRef.current.length === 0) return;

    runningRef.current = true;
    setProcessing(true);
    setError(null);

    /* progress ring animation (1 → 0) */
    const start = performance.now();
    const dur = delayMs;
    const tick = () => {
      const pct = Math.min((performance.now() - start) / dur, 1);
      setProgress(1 - pct);
      if (pct < 1) progressRAF.current = requestAnimationFrame(tick);
    };
    progressRAF.current = requestAnimationFrame(tick);

    /* choose timer strategy by duration */
    if (dur > 2000) {
      timerRef.current = setTimeout(finishProcess, dur);
    } else {
      const loop = () => {
        if (performance.now() - start >= dur) finishProcess();
        else rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    }
  }, [delayMs, finishProcess]);

  /* ---------------------------------------------------------------------- */
  /* INPUT POLLING (16 ms debounce)                                          */
  /* ---------------------------------------------------------------------- */

  const lastInputRef = useRef<unknown>(data.lastInputValue);
  useEffect(() => {
    const tick = () => {
      const val = currentInput();
      const sourceData = inputsData[0]?.data;

      if (shouldProcessInput(val, lastInputRef.current, sourceData, edgeMode)) {
        lastInputRef.current = val;
        pushInput(val);
        ensureProcessing();
      }
    };
    const idPoll = setInterval(tick, INPUT_DEBOUNCE_MS);
    return () => clearInterval(idPoll);
  }, [currentInput, pushInput, ensureProcessing, inputsData, edgeMode]);

  /* ---------------------------------------------------------------------- */
  /* UI SNAPSHOT (queue length, preview)                                     */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    const idSnap = setInterval(() => {
      const q = queueRef.current;
      setSnap({
        len: q.length,
        preview: q.slice(0, QUEUE_PREVIEW_SIZE),
        full: q.length >= MAX_QUEUE_SIZE,
      });
    }, STATUS_SNAPSHOT_MS);
    return () => clearInterval(idSnap);
  }, []);

  /* ---------------------------------------------------------------------- */
  /* ONE-OFF INITIALISATION                                                  */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    const initialOut = outputMode === "boolean" ? false : undefined;
    setOutput(initialOut);
    updateNodeData(
      id,
      outputMode === "boolean"
        ? { outputValue: initialOut, triggered: false }
        : { outputValue: initialOut }
    );
    return () => {
      mountedRef.current = false;
    };
  }, [id, updateNodeData, outputMode]);

  // Sync outputMode with data.outputMode (for inspector changes)
  useEffect(() => {
    if (data.outputMode && data.outputMode !== outputMode) {
      setOutputMode(data.outputMode);
    }
  }, [data.outputMode, outputMode]);

  /* ---------------------------------------------------------------------- */
  /* EVENT HANDLERS (UI)                                                     */
  /* ---------------------------------------------------------------------- */

  const toggleCollapse = () => setCollapsed((p) => !p);
  const handleDelayChange = (v: number) => {
    const ms = Math.max(0, v);
    setDelayMs(ms);
    updateNodeData(id, { delay: ms });
  };
  const handleOutputModeChange = (
    mode: "passthrough" | "boolean" | "trigger"
  ) => {
    setOutputMode(mode);
    updateNodeData(id, { outputMode: mode });
  };
  const handleEdgeModeChange = (
    mode: "level" | "rising" | "falling" | "both"
  ) => {
    setEdgeMode(mode);
    updateNodeData(id, { edgeMode: mode });
  };

  const clearQueue = () => {
    queueRef.current.length = 0;
    setSnap({ len: 0, preview: [], full: false });
    setError(null);
    const resetOut = outputMode === "boolean" ? false : undefined;
    setOutput(resetOut);
    updateNodeData(
      id,
      outputMode === "boolean"
        ? { outputValue: resetOut, triggered: false }
        : { outputValue: resetOut }
    );
  };

  const forceProcess = () => {
    if (queueRef.current.length > 0 && !runningRef.current) ensureProcessing();
  };

  /* ---------------------------------------------------------------------- */
  /* RENDER                                                                  */
  /* ---------------------------------------------------------------------- */

  return (
    <div
      className={`relative ${collapsed ? "w-[60px] h-[60px] flex items-center justify-center" : "px-4 py-3 min-w-[200px] min-h-[180px]"} rounded-lg shadow border bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-800`}
    >
      {/* TOGGLE BUTTON (top-left) */}
      <button
        onClick={toggleCollapse}
        aria-label={collapsed ? "Expand node" : "Collapse node"}
        className="absolute top-1 left-1 cursor-pointer z-10 w-3 h-3 flex items-center justify-center rounded-full bg-white/80 dark:bg-black/40 border border-blue-300 dark:border-blue-800 text-xs hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors shadow"
        type="button"
      >
        {collapsed ? "⦾" : "⦿"}
      </button>
      {/* queue badge */}
      {snap.len > 0 && (
        <div
          className={`absolute scale-75 z-10 top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-white text-xs font-bold ${snap.full ? "bg-red-500" : "bg-blue-500"}`}
        >
          {snap.len}
        </div>
      )}
      {/* COLLAPSED: Only Icon */}
      {collapsed ? (
        <div className="relative">
          <IconForDelay
            progress={progress}
            size={24}
            color={error ? "#ef4444" : "#3b82f6"}
          />
          {/* {processing && <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />} */}
        </div>
      ) : (
        <>
          {/* HEADER */}
          <div className="flex items-center justify-center w-full mb-2">
            <div className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <IconForDelay
                progress={progress}
                size={20}
                color={error ? "#ef4444" : "#3b82f6"}
              />
              Delay
            </div>
          </div>
          <div className="flex flex-row gap-4 mb-3">
            {/* INPUTS & QUEUE: Two Columns */}

            {/* CONTROLS */}
            <div className="flex flex-col gap-3">
              {/* Inputs Column */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-blue-700 dark:text-blue-200 mb-1">
                  Inputs
                </div>
                <div className="bg-white/60 dark:bg-gray-900 rounded p-2 border border-blue-200 dark:border-blue-800 min-h-[40px]">
                  {inputsData && inputsData.length > 0 ? (
                    inputsData.map((n, i) => (
                      <div
                        key={n.id || i}
                        className="flex items-center gap-2 text-xs text-blue-900 dark:text-blue-100 mb-1"
                      >
                        <span className="font-mono truncate max-w-[80px]">
                          {JSON.stringify(
                            n.data?.outputValue ??
                              n.data?.value ??
                              n.data?.text ??
                              n.data?.count ??
                              n.data?.triggered ??
                              n.data
                          )}
                        </span>
                        <span className="text-[10px] text-blue-400 dark:text-blue-500">
                          [{n.id}]
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">
                      No input
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-700 dark:text-blue-200 mb-1">
                  Delay (ms)
                </label>
                <input
                  type="number"
                  value={delayMs}
                  min={0}
                  step={100}
                  onChange={(e) => handleDelayChange(Number(e.target.value))}
                  className="w-full px-2 py-1 text-xs border rounded bg-gray-900 text-white dark:bg-gray-800 border-blue-300 dark:border-blue-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-700 dark:text-blue-200 mb-1">
                  Output Mode
                </label>
                <select
                  value={outputMode}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (
                      value === "passthrough" ||
                      value === "boolean" ||
                      value === "trigger"
                    ) {
                      handleOutputModeChange(value);
                    }
                  }}
                  className="w-full px-2 py-1 text-xs border rounded bg-gray-900 text-white dark:bg-gray-800 border-blue-300 dark:border-blue-700"
                >
                  <option value="passthrough">Pass Through</option>
                  <option value="boolean">Boolean Pulse</option>
                  <option value="trigger">Timestamp Trigger</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-700 dark:text-blue-200 mb-1">
                  Input Edge Mode
                </label>
                <select
                  value={edgeMode}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (
                      value === "level" ||
                      value === "rising" ||
                      value === "falling" ||
                      value === "both"
                    ) {
                      handleEdgeModeChange(value);
                    }
                  }}
                  className="w-full px-2 py-1 text-xs border rounded bg-gray-900 text-white dark:bg-gray-800 border-blue-300 dark:border-blue-700"
                >
                  <option value="level">Level (Any Change)</option>
                  <option value="rising">Rising Edge (False→True)</option>
                  <option value="falling">Falling Edge (True→False)</option>
                  <option value="both">Both Edges</option>
                </select>
              </div>
              <div className="text-xs text-blue-300 dark:text-blue-200">
                {processing ? (
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    Processing ({Math.round(progress * 100)}%)
                  </span>
                ) : (
                  <span>Ready ({delayMs} ms)</span>
                )}
              </div>
              <div className="text-xs">
                <span className="font-medium">Output: </span>
                {output !== undefined ? (
                  <span
                    className={`font-mono px-2 py-1 rounded text-white text-xs ${outputMode === "boolean" ? (output ? "bg-green-600" : "bg-gray-500") : "bg-blue-600"}`}
                  >
                    {outputMode === "boolean"
                      ? output
                        ? "TRUE"
                        : "FALSE"
                      : outputMode === "trigger"
                        ? `#${String(output).slice(-6)}`
                        : typeof output === "string"
                          ? `"${output}"`
                          : JSON.stringify(output, (key, value) =>
                              typeof value === "bigint"
                                ? value.toString() + "n"
                                : value
                            )}
                  </span>
                ) : (
                  <span className="text-gray-400 italic">undefined</span>
                )}
              </div>
            </div>
            {/* Queue Column */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="text-xs font-semibold text-blue-700 dark:text-blue-200">
                  Queue
                </div>
                <span
                  className={`min-w-[18px] h-4 px-1 flex items-center justify-center rounded-full text-white text-xs font-bold ${snap.full ? "bg-red-500" : "bg-blue-500"}`}
                >
                  {snap.len}
                </span>
              </div>
              <div className="bg-white/60 dark:bg-gray-900 rounded p-2 border border-blue-200 dark:border-blue-800 min-h-[40px] min-w-[120px] overflow-x-auto">
                {snap.preview && snap.preview.length > 0 ? (
                  snap.preview.map((item, i) => (
                    <div
                      key={i}
                      className="font-mono text-xs text-blue-900 dark:text-blue-100 truncate max-w-[120px]"
                    >
                      {JSON.stringify(item)}
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 italic">
                    Queue empty
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={forceProcess}
              className="flex-1 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 shadow"
              disabled={processing || snap.len === 0}
            >
              Force
            </button>
            <button
              onClick={clearQueue}
              className="flex-1 text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 shadow"
              disabled={snap.len === 0}
            >
              Clear
            </button>
          </div>
        </>
      )}
      {/* -------- HANDLES --------------------------------------------------- */}
      <CustomHandle
        type="target"
        position={Position.Left}
        id="x"
        dataType="x"
      />
      {/* <CustomHandle type="target" position={Position.Left} id="b" dataType="b" style={{ top: '70%' }} /> */}

      {/* Source handles – always expose *both*; connecting logic decides which. */}
      <CustomHandle
        type="source"
        position={Position.Right}
        id="x"
        dataType="x"
      />
      {/* <CustomHandle type="source" position={Position.Right} id="b" dataType="b" style={{ top: '70%' }} /> */}
    </div>
  );
};

export default DelayNode;
