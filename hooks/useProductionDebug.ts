/**
 * PRODUCTION DEBUG HOOK
 *
 * Comprehensive debugging tools for production state synchronization issues.
 * Provides real-time monitoring, stuck state detection, and recovery mechanisms.
 *
 * Specifically designed to help debug the data propagation bug where node states
 * get "stuck" in production environments.
 */

import { useFlowStore } from "@/features/business-logic-modern/infrastructure/flow-engine/stores/flowStore";
import { useCallback, useEffect, useRef, useState } from "react";

export interface ProductionDebugConfig {
	nodeId: string;
	logStateChanges?: boolean;
	logHydration?: boolean;
	detectStuckState?: boolean;
	stuckStateThreshold?: number; // ms
}

export interface DebugInfo {
	nodeId: string;
	hasHydrated: boolean;
	stateChangeCount: number;
	timeSinceLastChange: number;
	currentData: any;
	lastComparisonMethod?: string;
	performanceMetrics: {
		averageUpdateTime: number;
		slowestUpdate: number;
		totalUpdates: number;
	};
}

export interface DebugUtilities {
	forceRefresh(): void;
	getDebugInfo(): DebugInfo;
	logCurrentState(): void;
	detectStuckState(): boolean;
	clearDebugHistory(): void;
}

/**
 * Production debug hook for monitoring node state changes and detecting issues
 */
export function useProductionDebug(config: ProductionDebugConfig): DebugUtilities {
	const {
		nodeId,
		logStateChanges = true,
		logHydration = true,
		detectStuckState = true,
		stuckStateThreshold = 30000, // 30 seconds
	} = config;

	const node = useFlowStore((state) => state.nodes.find((n) => n.id === nodeId));
	const hasHydrated = useFlowStore((state) => state._hasHydrated);
	const updateNodeData = useFlowStore((state) => state.updateNodeData);

	// Debug state tracking
	const previousDataRef = useRef<any>(null);
	const stateChangeCountRef = useRef(0);
	const lastChangeTimeRef = useRef(Date.now());
	const performanceMetricsRef = useRef({
		totalTime: 0,
		updateCount: 0,
		slowestUpdate: 0,
	});
	const lastComparisonMethodRef = useRef<string>("unknown");

	// State for debug info
	const [debugHistory, setDebugHistory] = useState<
		Array<{
			timestamp: number;
			changes: string[];
			data: any;
			method: string;
		}>
	>([]);

	// Log hydration status changes
	useEffect(() => {
		if (logHydration && process.env.NODE_ENV === "production") {
			console.debug(`[${nodeId}] Hydration status changed:`, {
				hasHydrated,
				timestamp: new Date().toISOString(),
			});
		}
	}, [hasHydrated, nodeId, logHydration]);

	// Monitor state changes and performance
	useEffect(() => {
		if (!(node && logStateChanges)) {
			return;
		}

		const currentData = node.data;
		const previousData = previousDataRef.current;

		if (previousData && process.env.NODE_ENV === "production") {
			const startTime = performance.now();

			// Detect changes
			const changes: string[] = [];

			try {
				for (const key in currentData) {
					if (JSON.stringify(currentData[key]) !== JSON.stringify(previousData[key])) {
						changes.push(key);
					}
				}
			} catch (_error) {
				// Fallback comparison if JSON.stringify fails
				for (const key in currentData) {
					if (currentData[key] !== previousData[key]) {
						changes.push(key);
					}
				}
			}

			const endTime = performance.now();
			const updateTime = endTime - startTime;

			if (changes.length > 0) {
				stateChangeCountRef.current++;
				lastChangeTimeRef.current = Date.now();

				// Update performance metrics
				const metrics = performanceMetricsRef.current;
				metrics.totalTime += updateTime;
				metrics.updateCount++;
				metrics.slowestUpdate = Math.max(metrics.slowestUpdate, updateTime);

				// Log state change
				console.debug(`[${nodeId}] State changed:`, {
					changes,
					changeCount: stateChangeCountRef.current,
					updateTimeMs: updateTime.toFixed(2),
					comparisonMethod: lastComparisonMethodRef.current,
					newData: currentData,
					previousData,
				});

				// Add to debug history (keep last 20 entries)
				setDebugHistory((prev) => [
					...prev.slice(-19),
					{
						timestamp: Date.now(),
						changes,
						data: { ...currentData },
						method: lastComparisonMethodRef.current,
					},
				]);
			}
		}

		previousDataRef.current = currentData ? { ...currentData } : null;
	}, [node?.data, nodeId, logStateChanges]);

	// Stuck state detection
	useEffect(() => {
		if (!detectStuckState || process.env.NODE_ENV !== "production") {
			return;
		}

		const interval = setInterval(() => {
			const timeSinceLastChange = Date.now() - lastChangeTimeRef.current;

			// Check for stuck state
			if (timeSinceLastChange > stuckStateThreshold && stateChangeCountRef.current > 0) {
				console.warn(`[${nodeId}] STUCK STATE DETECTED:`, {
					timeSinceLastChange: `${(timeSinceLastChange / 1000).toFixed(1)}s`,
					totalChanges: stateChangeCountRef.current,
					currentData: node?.data,
					hydrated: hasHydrated,
					lastComparisonMethod: lastComparisonMethodRef.current,
					performanceMetrics: {
						averageUpdateTime:
							performanceMetricsRef.current.updateCount > 0
								? `${(
										performanceMetricsRef.current.totalTime /
											performanceMetricsRef.current.updateCount
									).toFixed(2)}ms`
								: "0ms",
						slowestUpdate: `${performanceMetricsRef.current.slowestUpdate.toFixed(2)}ms`,
					},
				});

				// Attempt automatic recovery
				if (node?.data) {
					console.debug(`[${nodeId}] Attempting automatic recovery...`);
					updateNodeData(nodeId, { ...node.data });
				}
			}
		}, 10000); // Check every 10 seconds

		return () => clearInterval(interval);
	}, [nodeId, detectStuckState, node?.data, hasHydrated, updateNodeData, stuckStateThreshold]);

	// Debug utilities
	const forceRefresh = useCallback(() => {
		if (process.env.NODE_ENV === "production") {
			console.debug(`[${nodeId}] Force refresh triggered`);
			if (node?.data) {
				// Force update by spreading current data
				updateNodeData(nodeId, { ...node.data });
			}
		}
	}, [nodeId, node?.data, updateNodeData]);

	const getDebugInfo = useCallback((): DebugInfo => {
		const metrics = performanceMetricsRef.current;
		return {
			nodeId,
			hasHydrated,
			stateChangeCount: stateChangeCountRef.current,
			timeSinceLastChange: Date.now() - lastChangeTimeRef.current,
			currentData: node?.data,
			lastComparisonMethod: lastComparisonMethodRef.current,
			performanceMetrics: {
				averageUpdateTime: metrics.updateCount > 0 ? metrics.totalTime / metrics.updateCount : 0,
				slowestUpdate: metrics.slowestUpdate,
				totalUpdates: metrics.updateCount,
			},
		};
	}, [nodeId, hasHydrated, node?.data]);

	const logCurrentState = useCallback(() => {
		if (process.env.NODE_ENV === "production") {
			const debugInfo = getDebugInfo();
			console.debug(`[${nodeId}] Current debug state:`, {
				...debugInfo,
				debugHistory: debugHistory.slice(-5), // Last 5 changes
				timestamp: new Date().toISOString(),
			});
		}
	}, [nodeId, getDebugInfo, debugHistory]);

	const detectStuckStateManual = useCallback((): boolean => {
		const timeSinceLastChange = Date.now() - lastChangeTimeRef.current;
		const isStuck = timeSinceLastChange > stuckStateThreshold && stateChangeCountRef.current > 0;

		if (process.env.NODE_ENV === "production" && isStuck) {
			console.warn(
				`[${nodeId}] Manual stuck state detection: STUCK (${(timeSinceLastChange / 1000).toFixed(1)}s)`
			);
		}

		return isStuck;
	}, [nodeId, stuckStateThreshold]);

	const clearDebugHistory = useCallback(() => {
		setDebugHistory([]);
		stateChangeCountRef.current = 0;
		lastChangeTimeRef.current = Date.now();
		performanceMetricsRef.current = {
			totalTime: 0,
			updateCount: 0,
			slowestUpdate: 0,
		};

		if (process.env.NODE_ENV === "production") {
			console.debug(`[${nodeId}] Debug history cleared`);
		}
	}, [nodeId]);

	return {
		forceRefresh,
		getDebugInfo,
		logCurrentState,
		detectStuckState: detectStuckStateManual,
		clearDebugHistory,
	};
}

/**
 * Lightweight version for components that only need basic debugging
 */
export function useBasicProductionDebug(nodeId: string) {
	return useProductionDebug({
		nodeId,
		logStateChanges: true,
		logHydration: false,
		detectStuckState: true,
	});
}
