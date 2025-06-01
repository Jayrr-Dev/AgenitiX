/**
 * UPDATE MANAGER UTILITY - Intelligent node update scheduling system
 *
 * • Provides smart update scheduling with priority-based execution
 * • Implements debounced updates for smooth performance optimization
 * • Supports batch processing for multiple node updates
 * • Features instant vs smooth update strategies for different scenarios
 * • Integrates with factory systems for efficient state management
 *
 * Keywords: update-manager, scheduling, debouncing, batch-processing, priority-based, performance
 */

import { SMOOTH_ACTIVATION_DELAY } from "../constants";
import { debouncedUpdates } from "./cacheManager";

// ============================================================================
// UPDATE TIMING UTILITIES
// ============================================================================

/**
 * CLEAR PENDING UPDATE
 * Removes any scheduled update for a node
 */
export const clearPendingUpdate = (nodeId: string): void => {
  const existingTimeout = debouncedUpdates.get(nodeId);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
    debouncedUpdates.delete(nodeId);
  }
};

/**
 * SCHEDULE DELAYED UPDATE
 * Schedules a smooth activation update
 */
export const scheduleDelayedUpdate = (
  nodeId: string,
  updateFn: () => void
): void => {
  clearPendingUpdate(nodeId);

  const newTimeout = setTimeout(() => {
    updateFn();
    debouncedUpdates.delete(nodeId);
  }, SMOOTH_ACTIVATION_DELAY);

  debouncedUpdates.set(nodeId, newTimeout);
};

/**
 * SMART NODE UPDATE
 * Provides immediate feedback for turning OFF, smooth updates for turning ON
 */
export const smartNodeUpdate = (
  nodeId: string,
  updateFn: () => void,
  isActivating: boolean,
  priority: "instant" | "smooth" = "smooth"
): void => {
  // INSTANT updates for deactivation or high priority
  if (!isActivating || priority === "instant") {
    clearPendingUpdate(nodeId);
    updateFn();
    return;
  }

  // SMOOTH updates for activation (debounced)
  scheduleDelayedUpdate(nodeId, updateFn);
};

/**
 * DEBOUNCE NODE UPDATE (Legacy compatibility)
 * Backward compatibility wrapper
 */
export const debounceNodeUpdate = (
  nodeId: string,
  updateFn: () => void,
  delay: number = SMOOTH_ACTIVATION_DELAY
): void => {
  smartNodeUpdate(nodeId, updateFn, true, "smooth");
};

// ============================================================================
// BATCH UPDATE UTILITIES
// ============================================================================

/**
 * BATCH NODE UPDATES
 * Groups multiple updates together for performance
 */
export const batchNodeUpdates = (
  updates: Array<{
    nodeId: string;
    updateFn: () => void;
    isActivating: boolean;
    priority?: "instant" | "smooth";
  }>
): void => {
  // Group by priority
  const instantUpdates = updates.filter(
    (u) => !u.isActivating || u.priority === "instant"
  );
  const smoothUpdates = updates.filter(
    (u) => u.isActivating && u.priority !== "instant"
  );

  // Execute instant updates immediately
  instantUpdates.forEach(({ nodeId, updateFn }) => {
    clearPendingUpdate(nodeId);
    updateFn();
  });

  // Schedule smooth updates
  smoothUpdates.forEach(({ nodeId, updateFn }) => {
    scheduleDelayedUpdate(nodeId, updateFn);
  });
};

/**
 * CLEAR ALL PENDING UPDATES
 * Clears all scheduled updates (useful for cleanup)
 */
export const clearAllPendingUpdates = (): void => {
  debouncedUpdates.forEach((timeout) => {
    clearTimeout(timeout);
  });
  debouncedUpdates.clear();
};

/**
 * GET PENDING UPDATES COUNT
 * Returns number of pending updates
 */
export const getPendingUpdatesCount = (): number => {
  return debouncedUpdates.size;
};
