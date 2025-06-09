/**
 * PERFORMANCE SYSTEM - Enterprise-grade performance optimizations
 *
 * • Exports object pooling, scheduling, and parking management utilities
 * • Provides memory optimization and viewport-based rendering
 * • Implements React 19+ compatible scheduling strategies
 * • Features configurable performance monitoring and statistics
 * • Includes idle hydration and data buffer management
 *
 * Keywords: performance, optimization, memory, viewport, scheduling, enterprise
 */

// Object Pooling
export {
  createNodeDataPool,
  createNodeObjectPool,
  ObjectPool,
} from "./ObjectPool";

// Data Buffer Management
export {
  calculateOptimalBufferSize,
  createHighPerformanceBuffer,
  globalDataBuffer,
  isSharedArrayBufferSupported,
  NodeDataBuffer,
} from "./NodeDataBuffer";

export type { DataView, NodeDataBufferOptions } from "./NodeDataBuffer";

// Idle Hydration
export {
  DeferUntilIdle,
  getRecommendedTimeout,
  isIdleCallbackSupported,
  useIdleState,
} from "./IdleHydration";

export type { DeferUntilIdleProps } from "./IdleHydration";

// Scheduling
export {
  createPriorityScheduler,
  createScheduler,
  createSimpleScheduler,
  PriorityScheduler,
  scheduleUrgent,
} from "./Scheduler";

export type { SchedulerFunction, SchedulerTask } from "./Scheduler";

// Node Parking
export {
  aggressiveParkingStrategy,
  createCustomParkingManager,
  createNodeParkingManager,
  defaultParkingStrategy,
} from "./NodeParkingManager";

export type { NodeParkingManager, ParkingStrategy } from "./NodeParkingManager";
