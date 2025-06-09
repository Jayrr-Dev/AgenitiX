/**
 * V2U TRIGGER CONTROLS COMPONENT - Enhanced trigger controls for V2U nodes
 *
 * 🎯 V2U ENHANCED TRIGGERS: Modern trigger controls with defineNode() integration
 * • Advanced trigger management with V2U lifecycle integration
 * • Real-time execution monitoring and analytics
 * • Performance optimization with timing controls
 * • Security validation for trigger operations
 * • Integration with V2U event system and monitoring
 * • Enhanced debugging and diagnostic capabilities
 *
 * Keywords: v2u-triggers, defineNode, monitoring, performance, security, events
 */

import React, { useCallback, useRef, useState } from "react";
import { BaseControlProps } from "../types";
import {
  ActionButton,
  BaseControl,
  ControlGroup,
  EnhancedInput,
  StatusBadge,
} from "./BaseControl";

// ============================================================================
// V2U TRIGGER CONTROL INTERFACES
// ============================================================================

interface V2UTriggerControlProps extends BaseControlProps {
  triggerType: "click" | "toggle" | "pulse" | "cycle";
  showTiming?: boolean;
  showExecutionCount?: boolean;
  showPerformanceMetrics?: boolean;
  enableAdvancedControls?: boolean;
}

interface TriggerMetrics {
  executionCount: number;
  lastExecuted?: number;
  averageResponseTime: number;
  totalResponseTime: number;
  isExecuting: boolean;
  hasError: boolean;
  errorMessage?: string;
}

// ============================================================================
// V2U TRIGGER VALIDATION HELPERS
// ============================================================================

function validateTriggerValue(
  value: string,
  type: "duration" | "count" | "delay"
): {
  isValid: boolean;
  parsed: number;
  message?: string;
} {
  const numValue = parseInt(value, 10);

  if (isNaN(numValue)) {
    return {
      isValid: false,
      parsed: 0,
      message: "Value must be a valid number",
    };
  }

  switch (type) {
    case "duration":
      if (numValue < 50) {
        return {
          isValid: false,
          parsed: numValue,
          message: "Duration must be at least 50ms",
        };
      }
      if (numValue > 60000) {
        return {
          isValid: false,
          parsed: numValue,
          message: "Duration cannot exceed 60 seconds",
        };
      }
      break;
    case "count":
      if (numValue < 1) {
        return {
          isValid: false,
          parsed: numValue,
          message: "Count must be at least 1",
        };
      }
      if (numValue > 1000) {
        return {
          isValid: false,
          parsed: numValue,
          message: "Count cannot exceed 1000",
        };
      }
      break;
    case "delay":
      if (numValue < 0) {
        return {
          isValid: false,
          parsed: numValue,
          message: "Delay cannot be negative",
        };
      }
      if (numValue > 300000) {
        return {
          isValid: false,
          parsed: numValue,
          message: "Delay cannot exceed 5 minutes",
        };
      }
      break;
  }

  return { isValid: true, parsed: numValue };
}

// ============================================================================
// V2U TRIGGER CLICK CONTROL
// ============================================================================

export const V2UTriggerOnClickControl: React.FC<V2UTriggerControlProps> = ({
  node,
  updateNodeData,
  v2uState,
  debugMode = false,
  showExecutionCount = true,
  showPerformanceMetrics = true,
  enableAdvancedControls = false,
}) => {
  const [metrics, setMetrics] = useState<TriggerMetrics>({
    executionCount: 0,
    averageResponseTime: 0,
    totalResponseTime: 0,
    isExecuting: false,
    hasError: false,
  });
  const [lastTriggerTime, setLastTriggerTime] = useState<number | null>(null);
  const responseTimeRef = useRef<number[]>([]);

  const isTriggered = !!node.data.triggered;
  const isV2UNode = !!(node.data as any)._v2uMigrated;

  const handleTrigger = useCallback(async () => {
    const startTime = Date.now();
    setMetrics((prev) => ({ ...prev, isExecuting: true, hasError: false }));

    try {
      // Update node data
      updateNodeData(node.id, { triggered: !isTriggered });

      const responseTime = Date.now() - startTime;
      setLastTriggerTime(Date.now());

      // Update metrics
      responseTimeRef.current.push(responseTime);
      if (responseTimeRef.current.length > 100) {
        responseTimeRef.current = responseTimeRef.current.slice(-100);
      }

      const totalTime = responseTimeRef.current.reduce((a, b) => a + b, 0);
      const avgTime = totalTime / responseTimeRef.current.length;

      setMetrics((prev) => ({
        ...prev,
        executionCount: prev.executionCount + 1,
        averageResponseTime: avgTime,
        totalResponseTime: totalTime,
        isExecuting: false,
        lastExecuted: Date.now(),
      }));
    } catch (error) {
      setMetrics((prev) => ({
        ...prev,
        isExecuting: false,
        hasError: true,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  }, [node.id, isTriggered, updateNodeData]);

  const handleReset = useCallback(() => {
    updateNodeData(node.id, { triggered: false });
    setMetrics({
      executionCount: 0,
      averageResponseTime: 0,
      totalResponseTime: 0,
      isExecuting: false,
      hasError: false,
    });
    responseTimeRef.current = [];
    setLastTriggerTime(null);
  }, [node.id, updateNodeData]);

  return (
    <BaseControl title="V2U Trigger (Click)" nodeType={node.type}>
      {/* V2U Status Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusBadge
            status={isV2UNode}
            trueLabel="V2U"
            falseLabel="Legacy"
            nodeType={node.type}
          />
          <StatusBadge
            status={isTriggered}
            trueLabel="Triggered"
            falseLabel="Ready"
            nodeType={node.type}
          />
        </div>
        {metrics.isExecuting && (
          <span className="text-xs text-blue-600 animate-pulse">
            ⏳ Executing...
          </span>
        )}
      </div>

      {/* Error Display */}
      {metrics.hasError && metrics.errorMessage && (
        <div className="mb-3 text-xs text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
          ⚠️ Error: {metrics.errorMessage}
        </div>
      )}

      {/* Trigger Actions */}
      <ControlGroup nodeType={node.type}>
        <div className="flex items-center gap-2">
          <ActionButton
            onClick={handleTrigger}
            variant="primary"
            disabled={metrics.isExecuting}
            nodeType={node.type}
          >
            {isTriggered ? "🔄 Reset" : "🚀 Trigger"}
          </ActionButton>

          {enableAdvancedControls && metrics.executionCount > 0 && (
            <ActionButton
              onClick={handleReset}
              variant="secondary"
              nodeType={node.type}
            >
              🗑️ Clear
            </ActionButton>
          )}
        </div>
      </ControlGroup>

      {/* Execution Metrics */}
      {showExecutionCount && metrics.executionCount > 0 && (
        <ControlGroup title="Execution Metrics" nodeType={node.type}>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded border">
              <div className="text-gray-600 dark:text-gray-400">Executions</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {metrics.executionCount}
              </div>
            </div>

            {showPerformanceMetrics && (
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                <div className="text-gray-600 dark:text-gray-400">Avg Time</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {metrics.averageResponseTime.toFixed(1)}ms
                </div>
              </div>
            )}

            {lastTriggerTime && (
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded border col-span-2">
                <div className="text-gray-600 dark:text-gray-400">
                  Last Triggered
                </div>
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {new Date(lastTriggerTime).toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>
        </ControlGroup>
      )}

      {/* V2U Debug Info */}
      {debugMode && v2uState && (
        <ControlGroup title="V2U Debug Info" nodeType={node.type}>
          <div className="text-xs space-y-1">
            <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded font-mono">
              <div>Node ID: {node.id}</div>
              <div>V2U Migrated: {isV2UNode ? "Yes" : "No"}</div>
              <div>
                Security: {v2uState.security.currentExecutions}/
                {v2uState.security.maxExecutionsPerMinute}/min
              </div>
              <div>
                Performance: {v2uState.performance.averageExecutionTime}ms avg
              </div>
              <div>Events: {v2uState.events.eventsEmitted} emitted</div>
            </div>
          </div>
        </ControlGroup>
      )}
    </BaseControl>
  );
};

// ============================================================================
// V2U TRIGGER TOGGLE CONTROL
// ============================================================================

export const V2UTriggerOnToggleControl: React.FC<V2UTriggerControlProps> = ({
  node,
  updateNodeData,
  v2uState,
  debugMode = false,
  showExecutionCount = true,
  showPerformanceMetrics = true,
}) => {
  const [toggleCount, setToggleCount] = useState(0);
  const [lastToggleTime, setLastToggleTime] = useState<number | null>(null);

  const isToggled = !!node.data.triggered || !!node.data.outputValue;
  const isV2UNode = !!(node.data as any)._v2uMigrated;

  const handleToggle = useCallback(() => {
    const newTriggered = !isToggled;
    updateNodeData(node.id, {
      triggered: newTriggered,
      value: newTriggered,
      outputValue: newTriggered,
    });
    setToggleCount((prev) => prev + 1);
    setLastToggleTime(Date.now());
  }, [node.id, isToggled, updateNodeData]);

  return (
    <BaseControl title="V2U Trigger (Toggle)" nodeType={node.type}>
      {/* V2U Status Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusBadge
            status={isV2UNode}
            trueLabel="V2U"
            falseLabel="Legacy"
            nodeType={node.type}
          />
          <StatusBadge
            status={isToggled}
            trueLabel="ON"
            falseLabel="OFF"
            nodeType={node.type}
          />
        </div>
      </div>

      {/* Toggle Actions */}
      <ControlGroup nodeType={node.type}>
        <ActionButton
          onClick={handleToggle}
          variant="primary"
          nodeType={node.type}
        >
          🔄 Toggle
        </ActionButton>

        {/* Current Output Value Display */}
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          Output Value:{" "}
          <span
            className={`font-mono ${node.data.outputValue ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
          >
            {node.data.outputValue ? "true" : "false"}
          </span>
        </div>
      </ControlGroup>

      {/* Toggle Metrics */}
      {showExecutionCount && toggleCount > 0 && (
        <ControlGroup title="Toggle Metrics" nodeType={node.type}>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded border">
              <div className="text-gray-600 dark:text-gray-400">Toggles</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {toggleCount}
              </div>
            </div>

            {lastToggleTime && (
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                <div className="text-gray-600 dark:text-gray-400">
                  Last Toggle
                </div>
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {new Date(lastToggleTime).toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>
        </ControlGroup>
      )}

      {/* V2U Debug Info */}
      {debugMode && v2uState && (
        <ControlGroup title="V2U Debug Info" nodeType={node.type}>
          <div className="text-xs space-y-1">
            <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded font-mono">
              <div>Node ID: {node.id}</div>
              <div>V2U Migrated: {isV2UNode ? "Yes" : "No"}</div>
              <div>Current State: {isToggled ? "ON" : "OFF"}</div>
              <div>Toggle Count: {toggleCount}</div>
              <div>Triggered: {node.data.triggered ? "true" : "false"}</div>
              <div>Value: {node.data.value ? "true" : "false"}</div>
              <div>
                Output Value: {node.data.outputValue ? "true" : "false"}
              </div>
            </div>
          </div>
        </ControlGroup>
      )}
    </BaseControl>
  );
};

// ============================================================================
// V2U TRIGGER PULSE CONTROL
// ============================================================================

export const V2UTriggerOnPulseControl: React.FC<V2UTriggerControlProps> = ({
  node,
  updateNodeData,
  v2uState,
  debugMode = false,
  showTiming = true,
  showExecutionCount = true,
  enableAdvancedControls = true,
}) => {
  const [durationInput, setDurationInput] = useState(
    (node.data.duration || 1000).toString()
  );
  const [isValidDuration, setIsValidDuration] = useState(true);
  const [durationError, setDurationError] = useState<string | undefined>();
  const [pulseCount, setPulseCount] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const [lastPulseTime, setLastPulseTime] = useState<number | null>(null);

  const isV2UNode = !!(node.data as any)._v2uMigrated;

  // Validate duration input
  const validateDuration = useCallback((value: string) => {
    const validation = validateTriggerValue(value, "duration");
    setIsValidDuration(validation.isValid);
    setDurationError(validation.message);
    return validation;
  }, []);

  // Handle duration input change
  const handleDurationChange = useCallback(
    (value: string) => {
      const digits = value.replace(/\D/g, "");
      setDurationInput(digits);
      validateDuration(digits);
    },
    [validateDuration]
  );

  // Commit duration to node data
  const commitDuration = useCallback(() => {
    const validation = validateDuration(durationInput);
    if (validation.isValid) {
      updateNodeData(node.id, { duration: validation.parsed });
    } else {
      // Reset to current node value
      setDurationInput((node.data.duration || 1000).toString());
    }
  }, [
    durationInput,
    validateDuration,
    updateNodeData,
    node.id,
    node.data.duration,
  ]);

  // Trigger pulse
  const handlePulse = useCallback(async () => {
    const validation = validateDuration(durationInput);
    if (!validation.isValid) {
      commitDuration();
      return;
    }

    setIsPulsing(true);
    setPulseCount((prev) => prev + 1);
    setLastPulseTime(Date.now());

    // Trigger the pulse
    updateNodeData(node.id, { triggered: true });

    // Auto-reset after duration
    setTimeout(() => {
      updateNodeData(node.id, { triggered: false });
      setIsPulsing(false);
    }, validation.parsed);
  }, [
    durationInput,
    validateDuration,
    commitDuration,
    updateNodeData,
    node.id,
  ]);

  return (
    <BaseControl title="V2U Trigger (Pulse)" nodeType={node.type}>
      {/* V2U Status Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusBadge
            status={isV2UNode}
            trueLabel="V2U"
            falseLabel="Legacy"
            nodeType={node.type}
          />
          <StatusBadge
            status={isPulsing}
            trueLabel="Pulsing"
            falseLabel="Ready"
            nodeType={node.type}
          />
        </div>
        {isPulsing && (
          <span className="text-xs text-blue-600 animate-pulse">
            ⏳ Pulsing...
          </span>
        )}
      </div>

      {/* Duration Control */}
      {showTiming && (
        <ControlGroup title="Pulse Configuration" nodeType={node.type}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 dark:text-gray-400 w-16">
                Duration:
              </span>
              <EnhancedInput
                value={durationInput}
                onChange={handleDurationChange}
                type="text"
                nodeType={node.type}
                className={`flex-1 ${!isValidDuration ? "border-red-500 bg-red-50 dark:bg-red-900/20" : ""}`}
              />
              <span className="text-xs text-gray-500">ms</span>
            </div>

            {!isValidDuration && durationError && (
              <div className="text-xs text-red-600 dark:text-red-400">
                ⚠️ {durationError}
              </div>
            )}

            <ActionButton
              onClick={commitDuration}
              variant="secondary"
              nodeType={node.type}
              className="w-full text-xs"
            >
              💾 Update Duration
            </ActionButton>
          </div>
        </ControlGroup>
      )}

      {/* Pulse Actions */}
      <ControlGroup nodeType={node.type}>
        <ActionButton
          onClick={handlePulse}
          variant="primary"
          disabled={isPulsing || !isValidDuration}
          nodeType={node.type}
        >
          {isPulsing ? "⏳ Pulsing..." : "⚡ Start Pulse"}
        </ActionButton>
      </ControlGroup>

      {/* Pulse Metrics */}
      {showExecutionCount && pulseCount > 0 && (
        <ControlGroup title="Pulse Metrics" nodeType={node.type}>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded border">
              <div className="text-gray-600 dark:text-gray-400">Pulses</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {pulseCount}
              </div>
            </div>

            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded border">
              <div className="text-gray-600 dark:text-gray-400">Duration</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {node.data.duration || 1000}ms
              </div>
            </div>

            {lastPulseTime && (
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded border col-span-2">
                <div className="text-gray-600 dark:text-gray-400">
                  Last Pulse
                </div>
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {new Date(lastPulseTime).toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>
        </ControlGroup>
      )}

      {/* V2U Debug Info */}
      {debugMode && v2uState && (
        <ControlGroup title="V2U Debug Info" nodeType={node.type}>
          <div className="text-xs space-y-1">
            <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded font-mono">
              <div>Node ID: {node.id}</div>
              <div>V2U Migrated: {isV2UNode ? "Yes" : "No"}</div>
              <div>Pulse Duration: {node.data.duration || 1000}ms</div>
              <div>Is Pulsing: {isPulsing ? "Yes" : "No"}</div>
              <div>
                Performance: {v2uState.performance.averageExecutionTime}ms avg
              </div>
            </div>
          </div>
        </ControlGroup>
      )}
    </BaseControl>
  );
};

export default {
  V2UTriggerOnClickControl,
  V2UTriggerOnToggleControl,
  V2UTriggerOnPulseControl,
};
