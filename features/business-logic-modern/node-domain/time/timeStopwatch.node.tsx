/**
 * TimeStopwatch NODE – Professional stopwatch with precise timing
 *
 * • PRECISION TIMING: High-precision stopwatch with millisecond accuracy
 * • INLINE CONTROLS: Start/Stop/Reset/Lap directly in the node
 * • LAP TRACKING: Record and display lap times
 * • PROFESSIONAL UI: Real-time elapsed time display
 * • MULTIPLE OUTPUTS: Elapsed time, lap times, running state
 * • BENCHMARK MODE: Perfect for performance measurement
 * • STARTUP-LEVEL QUALITY: Enterprise-grade timing functionality
 *
 * Keywords: time-stopwatch, precision-timing, benchmark, professional-ui
 */

import type { NodeProps } from "@xyflow/react";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { z } from "zod";

import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
import { renderLucideIcon } from "@/features/business-logic-modern/infrastructure/node-core/iconUtils";
import {
  SafeSchemas,
  createSafeInitialData,
} from "@/features/business-logic-modern/infrastructure/node-core/schema-helpers";
import {
  createNodeValidator,
  reportValidationError,
  useNodeDataValidation,
} from "@/features/business-logic-modern/infrastructure/node-core/validation";
import { withNodeScaffold } from "@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold";
import { useNodeFeatureFlag } from "@/features/business-logic-modern/infrastructure/node-core/useNodeFeatureFlag";
import { CATEGORIES } from "@/features/business-logic-modern/infrastructure/theming/categories";
import {
  COLLAPSED_SIZES,
  EXPANDED_SIZES,
} from "@/features/business-logic-modern/infrastructure/theming/sizing";
import { useNodeData } from "@/hooks/useNodeData";
import { useStore } from "@xyflow/react";
import { findEdgeByHandle } from "@/features/business-logic-modern/infrastructure/flow-engine/utils/edgeUtils";
import { 
    detectDataType, 
    formatValueForDisplay, 
    getHandleCodeForType, 
    getDataTypeForValue,
    deepClone,
    convertToMs,
    formatInterval,
    formatMs
} from "./utils";
import { ValueDisplay, StatusValueDisplay } from "./components/ValueDisplay";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const TimeStopwatchDataSchema = z
  .object({
    // Stopwatch State
    isRunning: z.boolean().default(false),
    startTime: z.number().nullable().default(null),
    elapsedTime: z.number().default(0), // in milliseconds
    pausedTime: z.number().default(0), // accumulated paused time
    
    // Lap Tracking
    lapTimes: z.array(z.number()).default([]),
    lastLapTime: z.number().default(0),
    lapCount: z.number().default(0),
    
    // Output Configuration
    outputFormat: z.enum(["ms", "seconds", "formatted"]).default("formatted"),
    precision: z.number().min(0).max(3).default(2), // decimal places
    
    // Node State
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    expandedSize: SafeSchemas.text("VE2"),
    collapsedSize: SafeSchemas.text("C2"),
    label: z.string().optional(),
    
    // Legacy fields for compatibility
    store: SafeSchemas.text(""),
    inputs: SafeSchemas.optionalText().nullable().default(null),
    output: SafeSchemas.optionalText(),
  })
  .passthrough();

export type TimeStopwatchData = z.infer<typeof TimeStopwatchDataSchema>;

const validateNodeData = createNodeValidator(
  TimeStopwatchDataSchema,
  "TimeStopwatch",
);

// -----------------------------------------------------------------------------
// 2️⃣  Constants & Utilities - Professional TIME theming
// -----------------------------------------------------------------------------

const CATEGORY_TEXT = {
  TIME: {
    primary: "text-[--node-time-text]",
    secondary: "text-[--node-time-text-secondary]",
  },
} as const;

const CONTENT = {
  // Professional expanded layout with TIME theming
  expanded:
    "p-3 w-full h-full flex flex-col bg-gradient-to-br from-cyan-50 to-teal-100 dark:from-cyan-900/30 dark:to-teal-900/30 rounded-lg border border-cyan-200 dark:border-cyan-700 shadow-sm",
  
  // Professional collapsed layout with TIME theming  
  collapsed:
    "flex items-center justify-center w-full h-full bg-gradient-to-br from-cyan-50 to-teal-100 dark:from-cyan-900/30 dark:to-teal-900/30 rounded-lg border border-cyan-200 dark:border-cyan-700 shadow-sm",
  
  header: "flex items-center justify-between mb-2",
  body: "flex-1 flex flex-col gap-2",
  disabled: "opacity-60 grayscale transition-all duration-300",

  // Running indicator with TIME theming
  runningIndicator: "absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse",
  
  // Professional configuration sections
  configSection:
    "bg-white dark:bg-slate-800 rounded-lg p-2 border border-cyan-200 dark:border-cyan-700 shadow-sm",
  configHeader:
    "text-[8px] font-semibold text-cyan-700 dark:text-cyan-300 mb-1 flex items-center gap-1",
  configGrid: "grid grid-cols-1 gap-1",

  // Professional form controls with TIME theming
  formGroup: "flex flex-col gap-1",
  formRow: "flex items-center justify-between gap-1",
  label:
    "text-[8px] font-medium text-cyan-600 dark:text-cyan-400 min-w-0 flex-shrink-0",
  input:
    "flex-1 min-w-0 px-1.5 py-0.5 text-[8px] border border-cyan-300 dark:border-cyan-600 rounded-md bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-transparent transition-colors",
  select:
    "flex-1 min-w-0 px-1.5 py-0.5 text-[8px] border border-cyan-300 dark:border-cyan-600 rounded-md bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-transparent transition-colors",

  // Professional status section with TIME theming
  statusSection:
    "bg-gradient-to-r from-cyan-50 to-teal-100 dark:from-cyan-800 dark:to-teal-700 rounded-lg p-2 border border-cyan-200 dark:border-cyan-700",
  statusGrid: "grid grid-cols-1 gap-1",
  statusRow: "flex items-center justify-between",
  statusLabel: "text-[8px] font-medium text-cyan-500 dark:text-cyan-400",
  statusValue: "text-[8px] font-semibold",
  statusRunning: "text-emerald-600 dark:text-emerald-400",
  statusStopped: "text-red-500 dark:text-red-400",

  // Time display
  timeDisplay: "text-lg font-mono font-bold text-center py-2 bg-slate-100 dark:bg-slate-800 rounded-md",
  timeRunning: "text-emerald-600 dark:text-emerald-400",
  timeStopped: "text-slate-600 dark:text-slate-400",

  // Control buttons
  buttonPrimary:
    "px-2 py-1 text-[8px] font-medium text-white bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed rounded-md transition-all duration-200 shadow-sm hover:shadow-md",
  buttonSecondary:
    "px-2 py-1 text-[8px] font-medium text-cyan-600 dark:text-cyan-400 bg-white dark:bg-slate-700 border border-cyan-300 dark:border-cyan-600 hover:bg-cyan-50 dark:hover:bg-slate-600 rounded-md transition-all duration-200",

  // Professional collapsed view with TIME theming
  collapsedIcon: "text-lg mb-1 text-cyan-600 dark:text-cyan-400",
  collapsedTitle:
    "text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1",
  collapsedSubtitle: "text-[8px] text-slate-500 dark:text-slate-400",
  collapsedStatus: "mt-1 px-1 py-0.5 rounded-full text-[8px] font-medium",
  collapsedRunning:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  collapsedStopped:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
} as const;

// Format time for display
const formatTime = (ms: number, format: string, precision: number): string => {
  switch (format) {
    case "ms":
      return `${ms}ms`;
    case "seconds":
      return (ms / 1000).toFixed(precision);
    case "formatted":
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const milliseconds = ms % 1000;
      
      if (minutes > 0) {
        return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0').slice(0, precision)}`;
      } else {
        return `${seconds}.${milliseconds.toString().padStart(3, '0').slice(0, precision)}s`;
      }
    default:
      return `${ms}ms`;
  }
};

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

/**
 * Builds a NodeSpec for professional stopwatch functionality.
 */
function createDynamicSpec(data: TimeStopwatchData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.VE2;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C2;

  return {
    kind: "timeStopwatch",
    displayName: "Time Stopwatch",
    label: "Time Stopwatch",
    category: CATEGORIES.TIME,
    size: { expanded, collapsed },
    handles: [
      // Control input - optional trigger for start/stop
      {
        id: "control",
        code: "b",
        position: "left",
        type: "target",
        dataType: "Boolean",
      },
      // Elapsed time output
      {
        id: "elapsed",
        code: "n",
        position: "right",
        type: "source",
        dataType: "Number",
      },
      // Running state output
      {
        id: "running",
        code: "b",
        position: "bottom",
        type: "source",
        dataType: "Boolean",
      },
    ],
    inspector: { key: "TimeStopwatchInspector" },
    version: 1,
    runtime: { execute: "timeStopwatch_execute_v1" },
    initialData: createSafeInitialData(TimeStopwatchDataSchema, {
      isRunning: false,
      startTime: null,
      elapsedTime: 0,
      pausedTime: 0,
      lapTimes: [],
      lastLapTime: 0,
      lapCount: 0,
      outputFormat: "formatted",
      precision: 2,
    }),
    dataSchema: TimeStopwatchDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "isRunning",
        "startTime",
        "elapsedTime",
        "pausedTime",
        "lapTimes",
        "lastLapTime",
        "lapCount",
        "expandedSize",
        "collapsedSize",
        "store",
        "inputs",
        "output",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable Stopwatch" },
        {
          key: "outputFormat",
          type: "select",
          label: "Output Format",
        },
        { 
          key: "precision", 
          type: "number", 
          label: "Precision",
          ui: { step: 1 },
        },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuStopwatch",
    author: "Agenitix Team",
    description: "High-precision stopwatch with lap timing and multiple output formats",
    feature: "base",
    tags: ["time", "stopwatch", "timing", "benchmark", "precision"],
    featureFlag: {
      flag: "test",
      fallback: true,
      disabledMessage: "This timeStopwatch node is currently disabled",
      hideWhenDisabled: false,
    },
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE2",
  collapsedSize: "C2",
  outputFormat: "formatted",
  precision: 2,
} as TimeStopwatchData);
// -----------------------------------------------------------------------------
// 4️⃣  React component – stopwatch logic & rendering
// -----------------------------------------------------------------------------

const TimeStopwatchNode = memo(
  ({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
    // -------------------------------------------------------------------------
    // 4.1  Sync with React‑Flow store
    // -------------------------------------------------------------------------
    const { nodeData, updateNodeData } = useNodeData(id, data);

    // -------------------------------------------------------------------------
    // 4.2  Derived state
    // -------------------------------------------------------------------------
    const { 
      isExpanded, 
      isEnabled, 
      isActive, 
      isRunning,
      startTime,
      elapsedTime,
      pausedTime,
      lapTimes,
      lastLapTime,
      lapCount,
      outputFormat,
      precision,
    } = nodeData as TimeStopwatchData;

    // 4.2  Global React‑Flow store (nodes & edges) – triggers re‑render on change
    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);

    // Refs for timing management
    const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Local state for custom values to prevent focus loss
    const [localCustomValue, setLocalCustomValue] = useState("");
    
    // Ref to track if we're currently editing
    const isEditingRef = useRef(false);

    const categoryStyles = CATEGORY_TEXT.TIME;

    // -------------------------------------------------------------------------
    // 4.3  Feature flag evaluation (after all hooks)
    // -------------------------------------------------------------------------
    const flagState = useNodeFeatureFlag(spec.featureFlag);

    // -------------------------------------------------------------------------
    // 4.4  Callbacks
    // -------------------------------------------------------------------------

    /** Toggle between collapsed / expanded */
    const toggleExpand = useCallback(() => {
      updateNodeData({ isExpanded: !isExpanded });
    }, [isExpanded, updateNodeData]);

    /** Clear update intervals */
    const clearUpdateInterval = useCallback(() => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }, []);

    /** Update elapsed time */
    const updateElapsedTime = useCallback(() => {
      if (!isRunning || !startTime) return;

      const now = Date.now();
      const currentElapsed = now - startTime + pausedTime;
      
      updateNodeData({
        elapsedTime: currentElapsed,
        output: formatTime(currentElapsed, outputFormat, precision),
        isActive: true,
      });
    }, [isRunning, startTime, pausedTime, outputFormat, precision, updateNodeData]);

    /** Start the stopwatch */
    const startStopwatch = useCallback(() => {
      if (!isEnabled || isRunning) return;

      const now = Date.now();
      clearUpdateInterval();
      
      updateNodeData({ 
        isRunning: true,
        startTime: now,
        isActive: true,
      });

      // Set up update interval for smooth display (16ms ≈ 60fps)
      updateIntervalRef.current = setInterval(updateElapsedTime, 16); // ~60fps for smooth display

    }, [isEnabled, isRunning, clearUpdateInterval, updateNodeData, updateElapsedTime]);

    /** Stop/Pause the stopwatch */
    const stopStopwatch = useCallback(() => {
      if (!isRunning || !startTime) return;

      clearUpdateInterval();
      const now = Date.now();
      const finalElapsed = now - startTime + pausedTime;
      
      updateNodeData({ 
        isRunning: false,
        pausedTime: finalElapsed,
        elapsedTime: finalElapsed,
        output: formatTime(finalElapsed, outputFormat, precision),
      });
    }, [isRunning, startTime, pausedTime, outputFormat, precision, clearUpdateInterval, updateNodeData]);

    /** Reset the stopwatch */
    const resetStopwatch = useCallback(() => {
      clearUpdateInterval();
      updateNodeData({ 
        isRunning: false,
        startTime: null,
        elapsedTime: 0,
        pausedTime: 0,
        lapTimes: [],
        lastLapTime: 0,
        lapCount: 0,
        output: formatTime(0, outputFormat, precision),
        isActive: false,
      });
    }, [outputFormat, precision, clearUpdateInterval, updateNodeData]);

    /** Record a lap time */
    const recordLap = useCallback(() => {
      if (!isRunning || !startTime) return;

      const now = Date.now();
      const currentElapsed = now - startTime + pausedTime;
      const lapTime = currentElapsed - lastLapTime;
      
      updateNodeData({
        lapTimes: [...lapTimes, lapTime],
        lastLapTime: currentElapsed,
        lapCount: lapCount + 1,
      });
    }, [isRunning, startTime, pausedTime, lastLapTime, lapTimes, lapCount, updateNodeData]);

    /**
     * Check for control input (start/stop trigger)
     */
    const computeControlInput = useCallback((): boolean => {
      const controlEdge = findEdgeByHandle(edges, id, "control");
      if (!controlEdge) return false;

      const src = nodes.find((n) => n.id === controlEdge.source);
      if (!src) return false;

      const value = src.data?.output ?? src.data?.store ?? src.data;
      return Boolean(value);
    }, [edges, nodes, id]);

    // -------------------------------------------------------------------------
    // 4.5  Effects
    // -------------------------------------------------------------------------

    /* 🔄 Monitor control input for start/stop */
    useEffect(() => {
      if (!isEnabled) return;

      const controlInput = computeControlInput();
      
      // Toggle on control input
      if (controlInput) {
        if (isRunning) {
          stopStopwatch();
        } else {
          startStopwatch();
        }
      }
    }, [computeControlInput, isEnabled, isRunning, startStopwatch, stopStopwatch]);

    /* 🔄 Update elapsed time when running */
    useEffect(() => {
      if (isRunning) {
        updateElapsedTime();
      }
    }, [isRunning, updateElapsedTime]);

    /* 🔄 Stop stopwatch when disabled */
    useEffect(() => {
      if (!isEnabled && isRunning) {
        stopStopwatch();
      }
    }, [isEnabled, isRunning, stopStopwatch]);

    /* 🔄 Cleanup intervals on unmount only */
    useEffect(() => {
      return () => {
        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current);
          updateIntervalRef.current = null;
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };
    }, []); // Empty dependency array - only runs on mount/unmount

    // -------------------------------------------------------------------------
    // 4.6  Validation
    // -------------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("TimeStopwatch", id, validation.errors, {
        originalData: validation.originalData,
        component: "TimeStopwatchNode",
      });
    }

    useNodeDataValidation(
      TimeStopwatchDataSchema,
      "TimeStopwatch",
      validation.data,
      id,
    );

    // -------------------------------------------------------------------------
    // 4.7  Feature flag conditional rendering
    // -------------------------------------------------------------------------

    // If flag is loading, show loading state
    if (flagState.isLoading) {
      return (
        <div className={`${CONTENT.collapsed} animate-pulse`}>
          <div className="flex flex-col items-center justify-center w-full h-full p-2">
            <div className={`${CONTENT.collapsedIcon} opacity-50`}>
              {spec.icon && renderLucideIcon(spec.icon, "", 18)}
            </div>
            <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              Loading...
            </div>
          </div>
        </div>
      );
    }

    // If flag is disabled and should hide, return null
    if (!flagState.isEnabled && flagState.hideWhenDisabled) {
      return null;
    }

    // If flag is disabled, show disabled message
    if (!flagState.isEnabled) {
      return (
        <div className="flex items-center justify-center p-4 text-sm text-muted-foreground border border-dashed border-muted-foreground/20 rounded-lg">
          {flagState.disabledMessage}
        </div>
      );
    }

    // -------------------------------------------------------------------------
    // 4.8  Computed display values
    // -------------------------------------------------------------------------
    const displayTime = formatTime(elapsedTime, outputFormat, precision);
    const currentElapsed = isRunning && startTime ? Date.now() - startTime + pausedTime : elapsedTime;

    // -------------------------------------------------------------------------
    // 4.9  Professional Render - Startup Quality
    // -------------------------------------------------------------------------
    return (
      <>
        {/* Running indicator when actively running */}
        {isRunning && <div className={CONTENT.runningIndicator} />}

        {/* Editable label or icon */}
        {!isExpanded &&
        spec.size.collapsed.width === 60 &&
        spec.size.collapsed.height === 60 ? (
          <div className="absolute inset-0 flex justify-center text-lg p-0 text-foreground/80">
            {spec.icon && renderLucideIcon(spec.icon, "", 16)}
          </div>
        ) : (
          <LabelNode nodeId={id} label={(nodeData as TimeStopwatchData).label || spec.displayName} />
        )}

        {!isExpanded ? (
          // ===== COLLAPSED VIEW - Professional & Compact =====
          <div className={`${CONTENT.collapsed} ${!isEnabled ? CONTENT.disabled : ''}`}>
            <div className="flex flex-col items-center justify-center w-full h-full p-2">
              {/* Icon */}
              <div className={CONTENT.collapsedIcon}>
                {spec.icon && renderLucideIcon(spec.icon, "", 18)}
              </div>

              {/* Time Display */}
              <div className={CONTENT.collapsedTitle}>
                {formatTime(currentElapsed, "formatted", 1)}
              </div>

              {/* Lap Count */}
              <div className={CONTENT.collapsedSubtitle}>
                {lapCount} laps
              </div>

              {/* Status Badge */}
              <div
                className={`${CONTENT.collapsedStatus} ${
                  isRunning 
                    ? CONTENT.collapsedRunning 
                    : CONTENT.collapsedStopped
                }`}
              >
                {isRunning ? "Running" : "Stopped"}
              </div>
            </div>
          </div>
        ) : (
          // ===== EXPANDED VIEW - Professional Interface =====
          <div className={`${CONTENT.expanded} ${!isEnabled ? CONTENT.disabled : ''}`}>
            <div className={CONTENT.body}>
              {/* Time Display */}
              <div className={`${CONTENT.timeDisplay} ${isRunning ? CONTENT.timeRunning : CONTENT.timeStopped}`}>
                {formatTime(currentElapsed, outputFormat, precision)}
              </div>

              {/* Control Buttons */}
              <div className="flex gap-1">
                <button
                  className={CONTENT.buttonPrimary}
                  onClick={isRunning ? stopStopwatch : startStopwatch}
                  disabled={!isEnabled}
                >
                  {isRunning ? "Stop" : "Start"}
                </button>
                <button
                  className={CONTENT.buttonSecondary}
                  onClick={resetStopwatch}
                  disabled={!isEnabled}
                >
                  Reset
                </button>
                <button
                  className={CONTENT.buttonSecondary}
                  onClick={recordLap}
                  disabled={!isEnabled || !isRunning}
                >
                  Lap
                </button>
              </div>

              {/* Stopwatch Configuration Section */}
              <div className={CONTENT.configSection}>
                <div className={CONTENT.configHeader}>
                  {renderLucideIcon("LuStopwatch", "text-cyan-500", 10)}
                  Configuration
                </div>
                <div className={CONTENT.configGrid}>
                  {/* Output Format */}
                  <div className={CONTENT.formGroup}>
                    <div className={CONTENT.formRow}>
                      <label className={CONTENT.label}>Format:</label>
                      <select
                        className={CONTENT.select}
                        value={outputFormat}
                        onChange={(e) =>
                          updateNodeData({
                            outputFormat: e.target.value as any,
                          })
                        }
                      >
                        <option value="formatted">Formatted (0:00.000)</option>
                        <option value="seconds">Seconds (0.000)</option>
                        <option value="ms">Milliseconds (0000ms)</option>
                      </select>
                    </div>
                  </div>

                  {/* Precision */}
                  <div className={CONTENT.formGroup}>
                    <div className={CONTENT.formRow}>
                      <label className={CONTENT.label}>Precision:</label>
                      <input
                        type="number"
                        className={CONTENT.input}
                        value={precision}
                        min={0}
                        max={3}
                        step={1}
                        onChange={(e) =>
                          updateNodeData({
                            precision: Number.parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics Section */}
              <div className={CONTENT.statusSection}>
                <div className={CONTENT.statusGrid}>
                  <div className={CONTENT.statusRow}>
                    <span className={CONTENT.statusLabel}>Status:</span>
                    <span
                      className={`${CONTENT.statusValue} ${
                        isRunning 
                          ? CONTENT.statusRunning 
                          : CONTENT.statusStopped
                      }`}
                    >
                      {isRunning ? "Running" : "Stopped"}
                    </span>
                  </div>
                  
                  <div className={CONTENT.statusRow}>
                    <span className={CONTENT.statusLabel}>Laps:</span>
                    <span className={`${CONTENT.statusValue} font-mono`}>
                      {lapCount}
                    </span>
                  </div>
                  
                  {lapTimes.length > 0 && (
                    <div className={CONTENT.statusRow}>
                      <span className={CONTENT.statusLabel}>Last Lap:</span>
                      <span className={`${CONTENT.statusValue} font-mono text-blue-600 dark:text-blue-400`}>
                        {formatTime(lapTimes[lapTimes.length - 1], outputFormat, precision)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expand/Collapse Button - Always visible */}
        <ExpandCollapseButton
          showUI={isExpanded}
          onToggle={toggleExpand}
          size="sm"
        />
      </>
    );
  },
);

TimeStopwatchNode.displayName = "TimeStopwatchNode";

// -----------------------------------------------------------------------------
// 5️⃣  High‑order wrapper – inject scaffold with dynamic spec
// -----------------------------------------------------------------------------

/**
 * Memoized scaffolded component to prevent focus loss.
 */
const TimeStopwatchNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec when size keys change
  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as TimeStopwatchData),
    [
      (nodeData as TimeStopwatchData).expandedSize,
      (nodeData as TimeStopwatchData).collapsedSize,
    ],
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <TimeStopwatchNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec],
  );

  return <ScaffoldedNode {...props} />;
};

export default TimeStopwatchNodeWithDynamicSpec;