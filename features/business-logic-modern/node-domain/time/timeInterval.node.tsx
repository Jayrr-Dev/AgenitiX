/**
 * TimeInterval NODE – Professional interval timer with pulse generation
 *
 * • INTERVAL TIMER: Emits pulses at regular configurable intervals
 * • INLINE CONTROLS: Start/Stop/Reset directly in the node interface
 * • PULSE COUNTER: Tracks number of pulses emitted
 * • PROFESSIONAL UI: Real-time status and next pulse countdown
 * • ADAPTIVE OUTPUT: Configurable output type with flexible data handling
 * • AUTO-START: Optional automatic start on connection
 * • STARTUP-LEVEL QUALITY: Enterprise-grade UI/UX and functionality
 *
 * Keywords: time-interval, pulse-generator, metronome, professional-ui
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
    formatInterval
} from "./utils";
import { ValueDisplay, StatusValueDisplay } from "./components/ValueDisplay";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const TimeIntervalDataSchema = z
    .object({
        // Interval Configuration
        intervalAmount: z.number().min(1).max(3600).default(5), // 1-3600 seconds
        intervalUnit: z.enum(["ms", "s", "min"]).default("s"),

        // Output Configuration
        outputType: z.enum(["counter", "timestamp", "boolean", "custom"]).default("counter"),
        customValue: z.any().default("pulse"),

        // Timer State
        isRunning: z.boolean().default(false),
        pulseCount: z.number().default(0),
        nextPulseTime: z.number().nullable().default(null),
        lastPulseTime: z.number().nullable().default(null),

        // Auto-start Configuration
        autoStart: z.boolean().default(false),

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

export type TimeIntervalData = z.infer<typeof TimeIntervalDataSchema>;

const validateNodeData = createNodeValidator(
    TimeIntervalDataSchema,
    "TimeInterval",
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
    runningIndicator: "absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse",

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

// Generate output value based on type - with proper type handling and dynamic variables
const generateOutputValue = (type: string, count: number, customValue: any): string => {
    switch (type) {
        case "counter":
            return String(count); // Keep as string for compatibility
        case "timestamp":
            return String(Date.now()); // Keep as string for compatibility
        case "boolean":
            // Alternate between true and false based on pulse count
            const boolValue = count % 2 === 1; // Odd = true, Even = false
            return String(boolValue);
        case "custom":
            if (customValue === null || customValue === undefined) {
                return String(customValue);
            }

            // Handle string templates with variables
            if (typeof customValue === 'string') {
                // Replace variables in the string
                const processedValue = customValue
                    .replace(/\{count\}/g, String(count))
                    .replace(/\{timestamp\}/g, String(Date.now()))
                    .replace(/\{time\}/g, new Date().toLocaleTimeString())
                    .replace(/\{date\}/g, new Date().toLocaleDateString())
                    .replace(/\{iso\}/g, new Date().toISOString());
                return processedValue;
            }

            // Handle objects with variable replacement
            if (typeof customValue === 'object' && customValue !== null) {
                try {
                    // Convert to JSON string, then replace variables, then parse back
                    let jsonString = JSON.stringify(customValue);
                    jsonString = jsonString
                        .replace(/"\{count\}"/g, String(count)) // Replace quoted variables with actual values
                        .replace(/"\{timestamp\}"/g, String(Date.now()))
                        .replace(/"\{time\}"/g, `"${new Date().toLocaleTimeString()}"`)
                        .replace(/"\{date\}"/g, `"${new Date().toLocaleDateString()}"`)
                        .replace(/"\{iso\}"/g, `"${new Date().toISOString()}"`);

                    // Also handle unquoted variables in strings within the JSON
                    jsonString = jsonString
                        .replace(/\{count\}/g, String(count))
                        .replace(/\{timestamp\}/g, String(Date.now()))
                        .replace(/\{time\}/g, new Date().toLocaleTimeString())
                        .replace(/\{date\}/g, new Date().toLocaleDateString())
                        .replace(/\{iso\}/g, new Date().toISOString());

                    return jsonString;
                } catch {
                    return JSON.stringify(customValue);
                }
            }

            return String(customValue);
        default:
            return String(count);
    }
};

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

/**
 * Builds a NodeSpec with professional TIME theming and adaptive handles.
 */
function createDynamicSpec(data: TimeIntervalData): NodeSpec {
    const expanded =
        EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
        EXPANDED_SIZES.VE2;
    const collapsed =
        COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
        COLLAPSED_SIZES.C2;

    // Adaptive output handle based on output type
    let outputCode = "s"; // Default to string
    let outputDataType = "String"; // Default to string

    // Set appropriate handle type based on output type
    switch (data.outputType) {
        case "counter":
            outputCode = "n"; // Number
            outputDataType = "Number";
            break;
        case "timestamp":
            outputCode = "n"; // Number (timestamp is numeric)
            outputDataType = "Number";
            break;
        case "boolean":
            outputCode = "b"; // Boolean
            outputDataType = "Boolean";
            break;
        case "custom":
            // For custom, detect type from the custom value with better parsing
            if (typeof data.customValue === 'number') {
                outputCode = "n";
                outputDataType = "Number";
            } else if (typeof data.customValue === 'boolean') {
                outputCode = "b";
                outputDataType = "Boolean";
            } else if (typeof data.customValue === 'object' && data.customValue !== null) {
                outputCode = "j"; // JSON
                outputDataType = "JSON";
            } else if (typeof data.customValue === 'string') {
                const trimmed = data.customValue.trim();

                // Check if it looks like JSON (starts with { or [)
                if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
                    (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                    try {
                        // Try to parse as valid JSON first
                        const parsed = JSON.parse(trimmed);
                        if (Array.isArray(parsed)) {
                            outputCode = "a"; // Array
                            outputDataType = "Array";
                        } else if (typeof parsed === 'object' && parsed !== null) {
                            outputCode = "j"; // JSON
                            outputDataType = "JSON";
                        } else if (typeof parsed === 'number') {
                            outputCode = "n";
                            outputDataType = "Number";
                        } else if (typeof parsed === 'boolean') {
                            outputCode = "b";
                            outputDataType = "Boolean";
                        } else {
                            outputCode = "s";
                            outputDataType = "String";
                        }
                    } catch {
                        // If it fails but contains template variables, determine type
                        if (trimmed.includes('{count}') ||
                            trimmed.includes('{timestamp}') ||
                            trimmed.includes('{time}') ||
                            trimmed.includes('{date}') ||
                            trimmed.includes('{iso}')) {
                            // Determine if it's template object or array
                            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                                outputCode = "a"; // Template Array - treat as Array
                                outputDataType = "Array";
                            } else {
                                outputCode = "j"; // Template JSON - treat as JSON
                                outputDataType = "JSON";
                            }
                        } else {
                            outputCode = "s"; // Looks like JSON but isn't valid
                            outputDataType = "String";
                        }
                    }
                } else {
                    // Check for other simple types
                    if (trimmed === 'true' || trimmed === 'false') {
                        outputCode = "b";
                        outputDataType = "Boolean";
                    } else if (!isNaN(Number(trimmed)) && trimmed !== '') {
                        outputCode = "n";
                        outputDataType = "Number";
                    } else {
                        outputCode = "s";
                        outputDataType = "String";
                    }
                }
            } else {
                outputCode = "s"; // String (default)
                outputDataType = "String";
            }
            break;
        default:
            outputCode = "s";
            outputDataType = "String";
    }

    return {
        kind: "timeInterval",
        displayName: "Time Interval",
        label: "Time Interval",
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
            // Output handle - adaptive based on output type
            {
                id: "output",
                code: outputCode,
                position: "right",
                type: "source",
                dataType: outputDataType,
            },
        ],
        inspector: { key: "TimeIntervalInspector" },
        version: 1,
        runtime: { execute: "timeInterval_execute_v1" },
        initialData: createSafeInitialData(TimeIntervalDataSchema, {
            intervalAmount: 5,
            intervalUnit: "s",
            outputType: "counter",
            customValue: "pulse",
            isRunning: false,
            pulseCount: 0,
            autoStart: false,
        }),
        dataSchema: TimeIntervalDataSchema,
        controls: {
            autoGenerate: true,
            excludeFields: [
                "isActive",
                "isRunning",
                "pulseCount",
                "nextPulseTime",
                "lastPulseTime",
                "expandedSize",
                "collapsedSize",
                "store",
                "inputs",
                "output",
            ],
            customFields: [
                { key: "isEnabled", type: "boolean", label: "Enable Timer" },
                {
                    key: "intervalAmount",
                    type: "number",
                    label: "Interval Amount",
                    ui: { step: 1 },
                },
                {
                    key: "intervalUnit",
                    type: "select",
                    label: "Time Unit",
                },
                {
                    key: "outputType",
                    type: "select",
                    label: "Output Type",
                },
                { key: "autoStart", type: "boolean", label: "Auto Start" },
                { key: "isExpanded", type: "boolean", label: "Expand" },
            ],
        },
        icon: "LuTimer",
        author: "Agenitix Team",
        description: "Emits pulses at regular intervals with configurable timing and output types",
        feature: "base",
        tags: ["time", "interval", "pulse", "timer", "metronome"],
        featureFlag: {
            flag: "test",
            fallback: true,
            disabledMessage: "This timeInterval node is currently disabled",
            hideWhenDisabled: false,
        },
        theming: {},
    };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
    expandedSize: "VE2",
    collapsedSize: "C2",
    intervalAmount: 5,
    intervalUnit: "s",
    outputType: "counter",
} as TimeIntervalData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – interval timer logic & rendering
// -----------------------------------------------------------------------------

const TimeIntervalNode = memo(
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
            intervalAmount,
            intervalUnit,
            outputType,
            customValue,
            isRunning,
            pulseCount,
            nextPulseTime,
            lastPulseTime,
            autoStart,
        } = nodeData as TimeIntervalData;

        // 4.2  Global React‑Flow store (nodes & edges) – triggers re‑render on change
        const nodes = useStore((s) => s.nodes);
        const edges = useStore((s) => s.edges);

        // Refs for interval management
        const intervalRef = useRef<NodeJS.Timeout | null>(null);

        // Local state for custom value input to prevent focus loss
        const [localCustomValue, setLocalCustomValue] = useState(
            typeof customValue === 'string' ? customValue : JSON.stringify(customValue)
        );

        // Ref to track if we're currently editing (to prevent sync overwrites)
        const isEditingRef = useRef(false);

        // Refs to hold current values without causing re-renders
        const currentConfigRef = useRef({
            intervalAmount,
            intervalUnit,
            outputType,
            customValue,
            pulseCount
        });

        // Ref to hold current node data for stable access
        const nodeDataRef = useRef(nodeData as TimeIntervalData);

        // Update refs when values change
        currentConfigRef.current = {
            intervalAmount,
            intervalUnit,
            outputType,
            customValue,
            pulseCount
        };

        nodeDataRef.current = nodeData as TimeIntervalData;

        // Sync local custom value when customValue changes from outside (but not while editing)
        useEffect(() => {
            if (!isEditingRef.current) {
                const newLocalValue = typeof customValue === 'string' ? customValue : JSON.stringify(customValue);
                setLocalCustomValue(newLocalValue);
            }
        }, [customValue]);

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



        /** Start the interval timer - completely stable version */
        const startInterval = useCallback(() => {
            console.log('🚀 startInterval called');

            // Check current state from ref to avoid stale closures
            const currentNodeData = nodeDataRef.current;
            if (!currentNodeData.isEnabled || currentNodeData.isRunning) {
                console.log('❌ Cannot start - isEnabled:', currentNodeData.isEnabled, 'isRunning:', currentNodeData.isRunning);
                return;
            }

            // Clear any existing intervals
            if (intervalRef.current) {
                console.log('🧹 Clearing existing interval');
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }

            // Get current config to avoid stale closures
            const currentConfig = currentConfigRef.current;
            if (!currentConfig) {
                console.log('❌ No current config available');
                return;
            }

            const intervalMs = convertToMs(currentConfig.intervalAmount, currentConfig.intervalUnit);
            const now = Date.now();
            console.log('⏱️ Creating interval with', intervalMs, 'ms');

            // Generate first pulse immediately
            const firstCount = currentConfig.pulseCount + 1;
            const firstOutput = generateOutputValue(currentConfig.outputType, firstCount, currentConfig.customValue);
            console.log('🎯 First pulse:', firstCount, 'output:', firstOutput);

            // Set running state and first pulse immediately
            updateNodeData({
                isRunning: true,
                isActive: true,
                pulseCount: firstCount,
                output: firstOutput,
                store: typeof firstOutput === 'object' && firstOutput !== null
                    ? JSON.stringify(firstOutput)
                    : String(firstOutput),
                lastPulseTime: now,
                nextPulseTime: now + intervalMs,
            });

            // Create a counter starting from the first pulse
            let currentCount = firstCount;

            // Set up the interval for subsequent pulses
            console.log('🎬 Setting up interval...');
            const intervalId = setInterval(() => {
                console.log('🔄 Interval tick - currentCount:', currentCount, 'intervalId:', intervalId);

                // Check if we should still be running (safety check)
                const latestNodeData = nodeDataRef.current;
                if (!latestNodeData.isEnabled || !latestNodeData.isRunning) {
                    console.log('🛑 Stopping interval - node disabled or stopped');
                    clearInterval(intervalId);
                    return;
                }

                currentCount += 1;

                // Use current config values at time of interval execution
                const currentConfig = currentConfigRef.current;
                const outputValue = generateOutputValue(currentConfig.outputType, currentCount, currentConfig.customValue);
                const currentTime = Date.now();
                const nextIntervalMs = convertToMs(currentConfig.intervalAmount, currentConfig.intervalUnit);

                console.log('📤 Updating node data - count:', currentCount, 'output:', outputValue);
                // Update the node data
                updateNodeData({
                    pulseCount: currentCount,
                    output: outputValue,
                    store: typeof outputValue === 'object' && outputValue !== null
                        ? JSON.stringify(outputValue)
                        : String(outputValue),
                    lastPulseTime: currentTime,
                    nextPulseTime: currentTime + nextIntervalMs,
                    isRunning: true,
                    isActive: true,
                });
            }, intervalMs);

            intervalRef.current = intervalId;
            console.log('✅ Interval created with ID:', intervalRef.current);
        }, [updateNodeData]); // Only depend on updateNodeData

        /** Stop the interval timer */
        const stopInterval = useCallback(() => {
            console.log('🛑 stopInterval called');
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            updateNodeData({
                isRunning: false,
                isActive: false,
                nextPulseTime: null,
            });
        }, [updateNodeData]);

        /** Reset the interval timer */
        const resetInterval = useCallback(() => {
            console.log('🔄 resetInterval called');
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            updateNodeData({
                isRunning: false,
                isActive: false,
                pulseCount: 0,
                nextPulseTime: null,
                lastPulseTime: null,
                output: null,
                store: "",
            });
        }, [updateNodeData]);

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

            // Start on control input if not running
            if (controlInput && !isRunning) {
                startInterval();
            }
        }, [computeControlInput, isEnabled, isRunning, startInterval]);

        /* 🔄 Auto-start when enabled and autoStart is true */
        useEffect(() => {
            if (isEnabled && autoStart && !isRunning) {
                startInterval();
            }
        }, [isEnabled, autoStart, isRunning, startInterval]);

        /* 🔄 Update output when type or custom value changes (but not while running) */
        useEffect(() => {
            if (!isRunning && pulseCount > 0) {
                // Update the output with current settings for preview
                const previewValue = generateOutputValue(outputType, pulseCount, customValue);
                updateNodeData({
                    output: previewValue,
                    store: typeof previewValue === 'object' && previewValue !== null
                        ? JSON.stringify(previewValue)
                        : String(previewValue),
                });
            }
        }, [outputType, customValue, isRunning, pulseCount, updateNodeData]);

        /* 🔄 Stop interval when disabled */
        useEffect(() => {
            if (!isEnabled && isRunning) {
                console.log('🛑 Stopping interval because disabled');
                stopInterval();
            }
        }, [isEnabled, isRunning, stopInterval]);

        /* 🔄 Cleanup intervals on unmount only */
        useEffect(() => {
            return () => {
                console.log('🧹 CLEANUP ON UNMOUNT - clearing interval:', intervalRef.current);
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            };
        }, []); // Empty dependency array - only runs on mount/unmount

        // -------------------------------------------------------------------------
        // 4.6  Validation
        // -------------------------------------------------------------------------
        const validation = validateNodeData(nodeData);
        if (!validation.success) {
            reportValidationError("TimeInterval", id, validation.errors, {
                originalData: validation.originalData,
                component: "TimeIntervalNode",
            });
        }

        useNodeDataValidation(
            TimeIntervalDataSchema,
            "TimeInterval",
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
        const intervalMs = convertToMs(intervalAmount, intervalUnit);
        const timeUntilNext = nextPulseTime ? Math.max(0, nextPulseTime - Date.now()) : 0;

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
                    <LabelNode nodeId={id} label={(nodeData as TimeIntervalData).label || spec.displayName} />
                )}

                {!isExpanded ? (
                    // ===== COLLAPSED VIEW - Professional & Compact =====
                    <div className={`${CONTENT.collapsed} ${!isEnabled ? CONTENT.disabled : ''}`}>
                        <div className="flex flex-col items-center justify-center w-full h-full p-2">
                            {/* Icon */}
                            <div className={CONTENT.collapsedIcon}>
                                {spec.icon && renderLucideIcon(spec.icon, "", 18)}
                            </div>

                            {/* Interval Display */}
                            <div className={CONTENT.collapsedTitle}>
                                {formatInterval(intervalAmount, intervalUnit)}
                            </div>

                            {/* Output Type & Count */}
                            <div className={CONTENT.collapsedSubtitle}>
                                {outputType} • {pulseCount} pulses
                            </div>

                            {/* Current Output Preview */}
                            {nodeData.output !== undefined && nodeData.output !== null && (
                                <div className="text-[7px] font-mono text-cyan-600 dark:text-cyan-400 mt-1 max-w-full truncate">
                                    {formatValueForDisplay(nodeData.output, 15)}
                                </div>
                            )}

                            {/* Status Badge */}
                            <div
                                className={`${CONTENT.collapsedStatus} ${isRunning
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
                            {/* Interval Configuration Section */}
                            <div className={CONTENT.configSection}>
                                <div className={CONTENT.configHeader}>
                                    {renderLucideIcon("LuTimer", "text-cyan-500", 10)}
                                    Interval Configuration
                                </div>
                                <div className={CONTENT.configGrid}>
                                    {/* Interval Amount */}
                                    <div className={CONTENT.formGroup}>
                                        <div className={CONTENT.formRow}>
                                            <label className={CONTENT.label}>Interval:</label>
                                            <input
                                                type="number"
                                                className={CONTENT.input}
                                                value={intervalAmount}
                                                min={1}
                                                max={3600}
                                                step={1}
                                                onChange={(e) =>
                                                    updateNodeData({
                                                        intervalAmount: Number.parseInt(e.target.value) || 1,
                                                    })
                                                }
                                                disabled={isRunning}
                                            />
                                        </div>
                                    </div>

                                    {/* Interval Unit */}
                                    <div className={CONTENT.formGroup}>
                                        <div className={CONTENT.formRow}>
                                            <label className={CONTENT.label}>Unit:</label>
                                            <select
                                                className={CONTENT.select}
                                                value={intervalUnit}
                                                onChange={(e) =>
                                                    updateNodeData({
                                                        intervalUnit: e.target.value as any,
                                                    })
                                                }
                                                disabled={isRunning}
                                            >
                                                <option value="ms">Milliseconds</option>
                                                <option value="s">Seconds</option>
                                                <option value="min">Minutes</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Output Type */}
                                    <div className={CONTENT.formGroup}>
                                        <div className={CONTENT.formRow}>
                                            <label className={CONTENT.label}>Output:</label>
                                            <select
                                                className={CONTENT.select}
                                                value={outputType}
                                                onChange={(e) =>
                                                    updateNodeData({
                                                        outputType: e.target.value as any,
                                                    })
                                                }
                                            >
                                                <option value="counter">Counter</option>
                                                <option value="timestamp">Timestamp</option>
                                                <option value="boolean">Boolean</option>
                                                <option value="custom">Custom Value</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Custom Value Input (only show when custom is selected) */}
                                    {outputType === "custom" && (
                                        <div className={CONTENT.formGroup}>
                                            <div className={CONTENT.formRow}>
                                                <label className={CONTENT.label}>Value:</label>
                                                <input
                                                    type="text"
                                                    className={CONTENT.input}
                                                    value={localCustomValue}
                                                    onFocus={() => {
                                                        // Mark as editing to prevent sync overwrites
                                                        isEditingRef.current = true;
                                                    }}
                                                    onChange={(e) => {
                                                        // Update local state only - no re-renders of parent
                                                        setLocalCustomValue(e.target.value);
                                                    }}
                                                    onBlur={(e) => {
                                                        // Mark as not editing
                                                        isEditingRef.current = false;

                                                        // Parse and update node data only on blur
                                                        const rawValue = e.target.value;
                                                        if (rawValue.trim()) {
                                                            try {
                                                                // Try parsing as JSON for complex types
                                                                const parsedValue = JSON.parse(rawValue);
                                                                updateNodeData({ customValue: parsedValue });
                                                            } catch {
                                                                // If not valid JSON, keep as string
                                                                updateNodeData({ customValue: rawValue });
                                                            }
                                                        } else {
                                                            updateNodeData({ customValue: "" });
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        // Also parse on Enter key
                                                        if (e.key === 'Enter') {
                                                            e.currentTarget.blur();
                                                        }
                                                    }}
                                                    placeholder='e.g. "Hello {count}!", 42, {"pulse": {count}}, [1,2,3]'
                                                    disabled={isRunning}
                                                />
                                            </div>
                                            {/* Show detected type and available variables */}
                                            <div className="text-[7px] text-slate-500 dark:text-slate-400 mt-1">
                                                <div>Type: {(() => {
                                                    // Smart type detection for custom values with template support
                                                    if (typeof customValue === 'string') {
                                                        const trimmed = customValue.trim();

                                                        // Check if it looks like JSON (starts with { or [)
                                                        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
                                                            (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                                                            try {
                                                                // Try to parse as valid JSON first
                                                                const parsed = JSON.parse(trimmed);
                                                                if (Array.isArray(parsed)) {
                                                                    return 'array';
                                                                } else {
                                                                    return 'object';
                                                                }
                                                            } catch {
                                                                // If it fails, check if it's template JSON/Array (contains variables)
                                                                if (trimmed.includes('{count}') ||
                                                                    trimmed.includes('{timestamp}') ||
                                                                    trimmed.includes('{time}') ||
                                                                    trimmed.includes('{date}') ||
                                                                    trimmed.includes('{iso}')) {
                                                                    // Determine if it's template object or array
                                                                    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                                                                        return 'template-array';
                                                                    } else {
                                                                        return 'template-object';
                                                                    }
                                                                }
                                                                return 'string'; // Looks like JSON but isn't valid
                                                            }
                                                        }

                                                        // Check for other types
                                                        if (trimmed === 'true' || trimmed === 'false') return 'boolean';
                                                        if (!isNaN(Number(trimmed)) && trimmed !== '') return 'number';

                                                        return 'string';
                                                    }

                                                    return detectDataType(customValue);
                                                })()}</div>
                                                <div className="mt-1">
                                                    Variables: {"{count}"}, {"{timestamp}"}, {"{time}"}, {"{date}"}, {"{iso}"}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Total Interval Display */}
                                    <div className={CONTENT.formGroup}>
                                        <div className={CONTENT.formRow}>
                                            <label className={CONTENT.label}>Total:</label>
                                            <div className="text-[8px] font-mono text-cyan-600 dark:text-cyan-400">
                                                {intervalMs}ms
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Timer Status Section */}
                            <div className={CONTENT.statusSection}>
                                <div className="flex flex-col gap-1">
                                    <StatusValueDisplay
                                        label="Status"
                                        value={isRunning ? "Running" : "Stopped"}
                                        status={isRunning ? "success" : "error"}
                                    />

                                    <StatusValueDisplay
                                        label="Pulses"
                                        value={pulseCount}
                                        status="info"
                                    />

                                    {isRunning && nextPulseTime && (
                                        <StatusValueDisplay
                                            label="Next in"
                                            value={`${Math.ceil(timeUntilNext / 1000)}s`}
                                            status="warning"
                                        />
                                    )}

                                    {lastPulseTime && (
                                        <StatusValueDisplay
                                            label="Last pulse"
                                            value={new Date(lastPulseTime).toLocaleTimeString()}
                                            status="info"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Current Output Display */}
                            {nodeData.output !== undefined && nodeData.output !== null && (
                                <div className={CONTENT.configSection}>
                                    <div className={CONTENT.configHeader}>
                                        {renderLucideIcon("LuArrowRight", "text-cyan-500", 10)}
                                        Current Output
                                    </div>
                                    <ValueDisplay
                                        value={nodeData.output}
                                        showType={true}
                                        className="mt-1"
                                    />
                                </div>
                            )}

                            {/* Control Buttons */}
                            <div className="flex gap-1 mt-2">
                                <button
                                    className={CONTENT.buttonPrimary}
                                    onClick={isRunning ? stopInterval : startInterval}
                                    disabled={!isEnabled}
                                >
                                    {isRunning ? "Stop" : "Start"}
                                </button>

                                <button
                                    className={CONTENT.buttonSecondary}
                                    onClick={resetInterval}
                                    disabled={!isEnabled}
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Expand/Collapse Button */}
                <ExpandCollapseButton
                    showUI={isExpanded}
                    onToggle={toggleExpand}
                    size="sm"
                />
            </>
        );
    },
);

TimeIntervalNode.displayName = "TimeIntervalNode";

// -----------------------------------------------------------------------------
// 5️⃣  High‑order wrapper – inject scaffold with dynamic spec
// -----------------------------------------------------------------------------

/**
 * Memoized scaffolded component to prevent focus loss.
 */
const TimeIntervalNodeWithDynamicSpec = (props: NodeProps) => {
    const { nodeData } = useNodeData(props.id, props.data);

    // Recompute spec when size keys change or output type changes (for adaptive handles)
    const dynamicSpec = useMemo(
        () => createDynamicSpec(nodeData as TimeIntervalData),
        [
            (nodeData as TimeIntervalData).expandedSize,
            (nodeData as TimeIntervalData).collapsedSize,
            (nodeData as TimeIntervalData).outputType,
            (nodeData as TimeIntervalData).customValue,
        ],
    );

    // Memoise the scaffolded component to keep focus
    const ScaffoldedNode = useMemo(
        () =>
            withNodeScaffold(dynamicSpec, (p) => (
                <TimeIntervalNode {...p} spec={dynamicSpec} />
            )),
        [dynamicSpec],
    );

    return <ScaffoldedNode {...props} />;
};

export default TimeIntervalNodeWithDynamicSpec;