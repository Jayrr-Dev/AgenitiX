/**
 * TimeScheduler NODE – Task scheduling and automation
 *
 * • Schedule tasks to run at specific intervals or times
 * • Support for one-time and recurring schedules
 * • Configure start time, interval, and end conditions
 * • Outputs trigger signals based on the schedule
 * • Supports manual trigger and automatic scheduling
 * • Uses findEdgeByHandle utility for robust React Flow edge handling
 * • Auto-disables when all input connections are removed
 *
 * Keywords: time-scheduler, automation, scheduling, recurring-tasks, cron
 */

import type { NodeProps } from "@xyflow/react";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  ChangeEvent,
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
import { useReactFlow, useStore } from "@xyflow/react";
import { findEdgeByHandle } from "@/features/business-logic-modern/infrastructure/flow-engine/utils/edgeUtils";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------
export const TimeSchedulerDataSchema = z
  .object({
    // Core state
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    
    // Schedule configuration
    scheduleType: z.enum(["interval", "daily", "once"]).default("interval"),
    intervalMinutes: z.number().min(0.1).max(1440).default(5), // 0.1 min to 24 hours
    startTime: z.string().default(""), // HH:MM format for daily schedule
    lastTriggered: z.number().nullable().default(null), // timestamp of last trigger
    nextTrigger: z.number().nullable().default(null), // timestamp of next scheduled trigger
    manualTrigger: SafeSchemas.boolean(false), // for manual triggering
    
    // I/O
    store: SafeSchemas.text("Schedule configuration"),
    inputs: SafeSchemas.optionalText().nullable().default(null),
    outputs: SafeSchemas.optionalText(),
    
    // UI
    expandedSize: SafeSchemas.text("FE3"),
    collapsedSize: SafeSchemas.text("C3"),
    label: z.string().optional(), // User-editable node label
  })
  .passthrough();

export type TimeSchedulerData = z.infer<typeof TimeSchedulerDataSchema>;

const validateNodeData = createNodeValidator(
  TimeSchedulerDataSchema,
  "TimeScheduler",
);

// -----------------------------------------------------------------------------
// 2️⃣  Constants
// -----------------------------------------------------------------------------

const CATEGORY_TEXT = {
  TRIGGER: {
    primary: "text-[--node--t-r-i-g-g-e-r-text]",
  },
} as const;

const CONTENT = {
  expanded: "p-2 w-full h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm",
  collapsed: "flex items-center justify-center w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg border border-blue-200 dark:border-blue-700 shadow-sm",
  header: "flex items-center justify-between mb-2",
  body: "flex-1 flex flex-col gap-2",
  disabled: "opacity-60 grayscale transition-all duration-300",
  
  // Schedule configuration section
  configSection: "bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-700 shadow-sm",
  configHeader: "text-[8px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1",
  configGrid: "grid grid-cols-1 gap-1",
  
  // Form controls
  formGroup: "flex flex-col gap-1",
  formRow: "flex items-center justify-between gap-1",
  label: "text-[8px] font-medium text-slate-600 dark:text-slate-400 min-w-0 flex-shrink-0",
  input: "flex-1 min-w-0 px-1.5 py-0.5 text-[8px] border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors",
  select: "flex-1 min-w-0 px-1.5 py-0.5 text-[8px] border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors",
  
  // Status section
  statusSection: "bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-lg p-2 border border-slate-200 dark:border-slate-700",
  statusGrid: "grid grid-cols-1 gap-1",
  statusRow: "flex items-center justify-between",
  statusLabel: "text-[8px] font-medium text-slate-500 dark:text-slate-400",
  statusValue: "text-[8px] font-semibold",
  statusActive: "text-emerald-600 dark:text-emerald-400",
  statusInactive: "text-red-500 dark:text-red-400",
  
  // Action buttons
  buttonPrimary: "w-full px-1.5 py-0.5 text-[9px] font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed rounded-md transition-all duration-200 shadow-sm hover:shadow-md",
  
  // Notes section
  notesSection: "bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 border border-amber-200 dark:border-amber-800",
  notesLabel: "text-[8px] font-medium text-amber-700 dark:text-amber-300 mb-0.5 flex items-center gap-1",
  notesTextarea: "w-full resize-none bg-transparent text-[8px] text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 border-0 outline-none p-0",
  
  // Collapsed view
  collapsedIcon: "text-lg mb-1 text-blue-600 dark:text-blue-400",
  collapsedTitle: "text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1",
  collapsedSubtitle: "text-[8px] text-slate-500 dark:text-slate-400",
  collapsedStatus: "mt-1 px-1 py-0.5 rounded-full text-[8px] font-medium",
  collapsedActive: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  collapsedInactive: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
} as const;

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

/**
 * Builds a NodeSpec whose size keys can change at runtime via node data.
 */
function createDynamicSpec(data: TimeSchedulerData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.FE0;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C1;

  return {
    kind: "timeScheduler",
    displayName: "TimeScheduler",
    label: "TimeScheduler",
    category: CATEGORIES.TRIGGER,
    size: { expanded, collapsed },
    handles: [
      {
        id: "json-input",
        code: "j",
        position: "top",
        type: "target",
        dataType: "JSON",
      },
      {
        id: "output",
        code: "s",
        position: "right",
        type: "source",
        dataType: "String",
      },
      {
        id: "input",
        code: "b",
        position: "left",
        type: "target",
        dataType: "Boolean",
      },
    ],
    inspector: { key: "TimeSchedulerInspector" },
    version: 1,
    runtime: { execute: "timeScheduler_execute_v1" },
    initialData: createSafeInitialData(TimeSchedulerDataSchema, {
      store: "Schedule configuration",
      inputs: null,
      outputs: "",
      scheduleType: "interval",
      intervalMinutes: 5,
      startTime: "",
      lastTriggered: null,
      nextTrigger: null,
      manualTrigger: false,
      expandedSize: "FE3",
      collapsedSize: "C3",
    }),
    dataSchema: TimeSchedulerDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "inputs",
        "outputs",
        "expandedSize",
        "collapsedSize",
        "lastTriggered",
        "nextTrigger",
        "manualTrigger",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable Scheduler" },
        { 
          key: "scheduleType", 
          type: "select", 
          label: "Schedule Type"
        },
        { 
          key: "intervalMinutes", 
          type: "number", 
          label: "Interval (minutes)",
          ui: { step: 0.1 },
        },
        { 
          key: "startTime", 
          type: "text", 
          label: "Start Time (HH:MM)",
          placeholder: "13:30",
        },
        {
          key: "store",
          type: "textarea",
          label: "Notes",
          placeholder: "Enter schedule notes here...",
          ui: { rows: 2 },
        },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuSettings",
    author: "Agenitix Team",
    description: "TimeScheduler node for task scheduling and automation",
    feature: "base",
    tags: ["trigger", "timeScheduler"],
    featureFlag: {
      flag: "test",
      fallback: true,
      disabledMessage: "This timeScheduler node is currently disabled",
      hideWhenDisabled: false,
    },
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "FE3",
  collapsedSize: "C3",
} as TimeSchedulerData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const TimeSchedulerNode = memo(
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
    store,
    scheduleType,
    intervalMinutes,
    startTime,
    lastTriggered,
    nextTrigger,
    manualTrigger
  } = nodeData as TimeSchedulerData;

    // 4.2  Global React‑Flow store (nodes & edges) – triggers re‑render on change
    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);

    // keep last emitted output to avoid redundant writes
    const lastOutputRef = useRef<string | null>(null);

    const categoryStyles = CATEGORY_TEXT.TRIGGER;

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

    /** Propagate output ONLY when node is active AND enabled */
    const propagate = useCallback(
      (value: string) => {
        const shouldSend = isActive && isEnabled;
        const out = shouldSend ? value : null;
        if (out !== lastOutputRef.current) {
          lastOutputRef.current = out;
          updateNodeData({ outputs: out });
        }
      },
      [isActive, isEnabled, updateNodeData],
    );

    /** Clear JSON‑ish fields when inactive or disabled */
    const blockJsonWhenInactive = useCallback(() => {
      if (!isActive || !isEnabled) {
        updateNodeData({
          json: null,
          data: null,
          payload: null,
          result: null,
          response: null,
        });
      }
    }, [isActive, isEnabled, updateNodeData]);

    /** 
     * Compute the latest text coming from connected input handles.
     * 
     * Uses findEdgeByHandle utility to properly handle React Flow's handle naming
     * conventions (handles get type suffixes like "json-input__j", "input__b").
     * 
     * Priority: json-input > input (modify based on your node's specific handles)
     */
    const computeInput = useCallback((): string | null => {
      // Check json-input handle first, then input handle as fallback
      const jsonInputEdge = findEdgeByHandle(edges, id, "json-input");
      const inputEdge = findEdgeByHandle(edges, id, "input");
      
      const incoming = jsonInputEdge || inputEdge;
      if (!incoming) return null;

      const src = nodes.find((n) => n.id === incoming.source);
      if (!src) return null;

      // priority: outputs ➜ store ➜ whole data
      const inputValue = src.data?.outputs ?? src.data?.store ?? src.data;
      return typeof inputValue === 'string' ? inputValue : String(inputValue || '');
    }, [edges, nodes, id]);

    /** Handle textarea change (memoised for perf) */
    const handleStoreChange = useCallback(
      (e: ChangeEvent<HTMLTextAreaElement>) => {
        updateNodeData({ store: e.target.value });
      },
      [updateNodeData],
    );

    // -------------------------------------------------------------------------
    // 4.5  Effects
    // -------------------------------------------------------------------------

    /* 🔄 Whenever nodes/edges change, recompute inputs. */
    useEffect(() => {
      const inputVal = computeInput();
      if (inputVal !== (nodeData as TimeSchedulerData).inputs) {
        updateNodeData({ inputs: inputVal });
      }
    }, [computeInput, nodeData, updateNodeData]);

    /* 🔄 Make isEnabled dependent on input value only when there are connections. */
    useEffect(() => {
      const hasInput = (nodeData as TimeSchedulerData).inputs;
      // Only auto-control isEnabled when there are connections (inputs !== null)
      // When inputs is null (no connections), let user manually control isEnabled
      if (hasInput !== null) {
        const nextEnabled = hasInput && hasInput.trim().length > 0;
        if (nextEnabled !== isEnabled) {
          updateNodeData({ isEnabled: nextEnabled });
        }
      }
    }, [nodeData, isEnabled, updateNodeData]);

    // Scheduling logic
    const scheduleTimerRef = useRef<NodeJS.Timeout | null>(null);
    
    // Calculate next trigger time based on schedule type
    const calculateNextTrigger = useCallback(() => {
      const now = Date.now();
      let nextTime: number | null = null;
      
      if (!isEnabled) return null;
      
      switch (scheduleType) {
        case "interval":
          // Convert minutes to milliseconds
          nextTime = now + (intervalMinutes * 60 * 1000);
          break;
          
        case "daily":
          if (startTime) {
            // Parse HH:MM format
            const [hours, minutes] = startTime.split(":").map(Number);
            if (!isNaN(hours) && !isNaN(minutes)) {
              const scheduledTime = new Date();
              scheduledTime.setHours(hours, minutes, 0, 0);
              
              // If time already passed today, schedule for tomorrow
              if (scheduledTime.getTime() <= now) {
                scheduledTime.setDate(scheduledTime.getDate() + 1);
              }
              
              nextTime = scheduledTime.getTime();
            }
          }
          break;
          
        case "once":
          if (startTime) {
            // Parse HH:MM format for one-time schedule
            const [hours, minutes] = startTime.split(":").map(Number);
            if (!isNaN(hours) && !isNaN(minutes)) {
              const scheduledTime = new Date();
              scheduledTime.setHours(hours, minutes, 0, 0);
              
              // Only set if it's in the future
              if (scheduledTime.getTime() > now) {
                nextTime = scheduledTime.getTime();
              }
            }
          }
          break;
      }
      
      return nextTime;
    }, [scheduleType, intervalMinutes, startTime, isEnabled]);
    
    // Trigger the scheduled action
    const triggerScheduledAction = useCallback(() => {
      if (!isEnabled) return;
      
      // Update last triggered time
      const now = Date.now();
      updateNodeData({ 
        lastTriggered: now,
        isActive: true,
        outputs: JSON.stringify({
          triggered: true,
          timestamp: now,
          scheduleType,
          triggerType: "automatic"
        })
      });
      
      // For one-time schedule, disable after triggering
      if (scheduleType === "once") {
        // Wait a bit before disabling to ensure output is propagated
        setTimeout(() => {
          updateNodeData({ isEnabled: false, isActive: false });
        }, 1000);
        return;
      }
      
      // Calculate and set next trigger time
      const next = calculateNextTrigger();
      if (next) {
        updateNodeData({ nextTrigger: next });
      }
      
      // Reset active state after a short delay
      setTimeout(() => {
        updateNodeData({ isActive: false });
      }, 1000);
    }, [isEnabled, scheduleType, updateNodeData, calculateNextTrigger]);
    
    // Manual trigger handler
    const handleManualTrigger = useCallback(() => {
      if (!isEnabled) return;
      
      const now = Date.now();
      updateNodeData({ 
        lastTriggered: now,
        isActive: true,
        outputs: JSON.stringify({
          triggered: true,
          timestamp: now,
          scheduleType,
          triggerType: "manual"
        })
      });
      
      // Reset active state and manual trigger after a short delay
      setTimeout(() => {
        updateNodeData({ isActive: false, manualTrigger: false });
      }, 1000);
    }, [isEnabled, scheduleType, updateNodeData]);
    
    // Setup and manage scheduling timer
    useEffect(() => {
      // Clear any existing timer
      if (scheduleTimerRef.current) {
        clearTimeout(scheduleTimerRef.current);
        scheduleTimerRef.current = null;
      }
      
      if (!isEnabled) return;
      
      // Handle manual trigger
      if (manualTrigger) {
        handleManualTrigger();
        return;
      }
      
      // Calculate next trigger time if not already set
      const next = nextTrigger || calculateNextTrigger();
      if (!next) return;
      
      // Update next trigger in node data if it changed
      if (next !== nextTrigger) {
        updateNodeData({ nextTrigger: next });
      }
      
      // Set timeout for next trigger
      const timeUntilTrigger = next - Date.now();
      if (timeUntilTrigger > 0) {
        scheduleTimerRef.current = setTimeout(triggerScheduledAction, timeUntilTrigger);
      } else if (timeUntilTrigger <= 0) {
        // Trigger immediately if scheduled time has passed
        triggerScheduledAction();
      }
      
      // Cleanup timer on unmount
      return () => {
        if (scheduleTimerRef.current) {
          clearTimeout(scheduleTimerRef.current);
        }
      };
    }, [isEnabled, manualTrigger, nextTrigger, calculateNextTrigger, triggerScheduledAction, handleManualTrigger, updateNodeData]);
    
    // Update node active state based on enabled status
    useEffect(() => {
      if (!isEnabled && isActive) {
        updateNodeData({ isActive: false });
      }
    }, [isEnabled, isActive, updateNodeData]);

    // Format time for display
    const formatTime = useCallback((timestamp: number | null): string => {
      if (!timestamp) return "Not scheduled";
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, []);
    
    // Format date for display
    const formatDate = useCallback((timestamp: number | null): string => {
      if (!timestamp) return "";
      const date = new Date(timestamp);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Check if date is today or tomorrow
      if (date.toDateString() === today.toDateString()) {
        return "Today";
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return "Tomorrow";
      } else {
        return date.toLocaleDateString();
      }
    }, []);

    // -------------------------------------------------------------------------
    // 4.6  Validation
    // -------------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("TimeScheduler", id, validation.errors, {
        originalData: validation.originalData,
        component: "TimeSchedulerNode",
      });
    }

    useNodeDataValidation(
      TimeSchedulerDataSchema,
      "TimeScheduler",
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
    // 4.8  Render
    // -------------------------------------------------------------------------
    return (
      <>
        {/* Editable label or icon */}
        {!isExpanded &&
        spec.size.collapsed.width === 60 &&
        spec.size.collapsed.height === 60 ? (
          <div className="absolute inset-0 flex justify-center text-lg p-1 text-foreground/80">
            {spec.icon && renderLucideIcon(spec.icon, "", 16)}
          </div>
        ) : (
          <LabelNode nodeId={id} label={(nodeData as TimeSchedulerData).label || spec.displayName} />
        )}

        {!isExpanded ? (
          <div className={`${CONTENT.expanded} ${!isEnabled ? CONTENT.disabled : ''}`}>
            {/* Header with title and expand button */}
            <div className={CONTENT.header}>
              <ExpandCollapseButton
                showUI={isExpanded}
                onToggle={toggleExpand}
                size="sm"
              />
            </div>

            <div className={CONTENT.body}>
              {/* Schedule Configuration Section */}
              <div className={CONTENT.configSection}>
                <div className={CONTENT.configHeader}>
                  {renderLucideIcon("LuSettings", "text-slate-500", 10)}
                  Schedule
                </div>
                <div className={CONTENT.configGrid}>
                  {/* Schedule Type */}
                  <div className={CONTENT.formGroup}>
                    <div className={CONTENT.formRow}>
                      <label className={CONTENT.label}>Type:</label>
                      <select 
                        className={CONTENT.select}
                        value={scheduleType}
                        onChange={(e) => updateNodeData({ scheduleType: e.target.value as any })}
                      >
                        <option value="interval">Interval</option>
                        <option value="daily">Daily</option>
                        <option value="once">One-time</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Interval Settings */}
                  {scheduleType === "interval" && (
                    <div className={CONTENT.formGroup}>
                      <div className={CONTENT.formRow}>
                        <label className={CONTENT.label}>Every:</label>
                        <div className="flex items-center gap-1 flex-1">
                          <input
                            type="number"
                            className={CONTENT.input}
                            value={intervalMinutes}
                            min={0.1}
                            max={1440}
                            step={0.1}
                            onChange={(e) => updateNodeData({ intervalMinutes: parseFloat(e.target.value) || 1 })}
                          />
                          <span className="text-[8px] text-slate-500 dark:text-slate-400">min</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Time Settings */}
                  {(scheduleType === "daily" || scheduleType === "once") && (
                    <div className={CONTENT.formGroup}>
                      <div className={CONTENT.formRow}>
                        <label className={CONTENT.label}>Time:</label>
                        <input
                          type="time"
                          className={CONTENT.input}
                          value={startTime}
                          onChange={(e) => updateNodeData({ startTime: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Section */}
              <div className={CONTENT.statusSection}>
                <div className={CONTENT.statusGrid}>
                  <div className={CONTENT.statusRow}>
                    <span className={CONTENT.statusLabel}>Status:</span>
                    <span className={`${CONTENT.statusValue} ${isEnabled ? CONTENT.statusActive : CONTENT.statusInactive}`}>
                      {isEnabled ? '● Active' : '○ Disabled'}
                    </span>
                  </div>
                  
                  {lastTriggered && (
                    <div className={CONTENT.statusRow}>
                      <span className={CONTENT.statusLabel}>Last triggered:</span>
                      <span className={CONTENT.statusValue}>
                        {formatTime(lastTriggered)}
                      </span>
                    </div>
                  )}
                  
                  {nextTrigger && isEnabled && (
                    <div className={CONTENT.statusRow}>
                      <span className={CONTENT.statusLabel}>Next trigger:</span>
                      <span className={CONTENT.statusValue}>
                        {formatDate(nextTrigger)} {formatTime(nextTrigger)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button 
                className={CONTENT.buttonPrimary}
                disabled={!isEnabled || isActive}
                onClick={() => updateNodeData({ manualTrigger: true })}
              >
                {isActive ? 'Triggering...' : 'Trigger Now'}
              </button>
            </div>
          </div>
        ) : (
          <div className={`${CONTENT.collapsed} ${!isEnabled ? CONTENT.disabled : ''}`}>
            <div className="flex flex-col items-center justify-center w-full h-full p-2">
              {/* Icon */}
              <div className={CONTENT.collapsedIcon}>
                {spec.icon && renderLucideIcon(spec.icon, "", 18)}
              </div>
              
              {/* Title */}
              <div className={CONTENT.collapsedTitle}>
                {scheduleType === "interval" ? `${intervalMinutes}m` : 
                 scheduleType === "daily" ? "Daily" : "One-time"}
              </div>
              
              {/* Next trigger info */}
              {nextTrigger && isEnabled && (
                <div className={CONTENT.collapsedSubtitle}>
                  {formatTime(nextTrigger)}
                </div>
              )}
              
              {/* Status badge */}
              <div className={`${CONTENT.collapsedStatus} ${isEnabled ? CONTENT.collapsedActive : CONTENT.collapsedInactive}`}>
                {isEnabled ? 'Active' : 'Disabled'}
              </div>
            </div>
          </div>
        )}
      </>
    );
  },
);

// -----------------------------------------------------------------------------
// 5️⃣  High‑order wrapper – inject scaffold with dynamic spec
// -----------------------------------------------------------------------------

/**
 * ⚠️ THIS is the piece that fixes the focus‑loss issue.
 *
 * `withNodeScaffold` returns a *component function*.  Re‑creating that function
 * on every keystroke causes React to unmount / remount the subtree (and your
 * textarea loses focus).  We memoise the scaffolded component so its identity
 * stays stable across renders unless the *spec itself* really changes.
 */
const TimeSchedulerNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec only when the size keys change
  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as TimeSchedulerData),
    [
      (nodeData as TimeSchedulerData).expandedSize,
      (nodeData as TimeSchedulerData).collapsedSize,
    ],
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <TimeSchedulerNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec],
  );

  return <ScaffoldedNode {...props} />;
};

export default TimeSchedulerNodeWithDynamicSpec;
