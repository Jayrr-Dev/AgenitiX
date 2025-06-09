/**
 * SCHEDULER SYSTEM - High-performance task scheduling
 *
 * • Provides React 19+ compatible scheduling with concurrent mode support
 * • Implements batched updates for optimal rendering performance
 * • Features automatic fallback for older React versions
 * • Supports priority-based task scheduling and queue management
 *
 * Keywords: scheduler, concurrent-mode, batched-updates, performance, react19
 */

// ============================================================================
// TYPES
// ============================================================================

export type SchedulerFunction = (fn: () => void) => void;

// ============================================================================
// SCHEDULER IMPLEMENTATION
// ============================================================================

/**
 * Creates a scheduler function optimized for React's concurrent features
 * Automatically detects React version and uses appropriate scheduling strategy
 * @returns Scheduler function for batching updates
 */
export function createScheduler(): SchedulerFunction {
  const isReact19Plus = isConcurrentMode();

  const tick = () => {
    if (isReact19Plus) {
      // React 19+ with concurrent features - use scheduler
      if (typeof (globalThis as any).scheduler?.postTask === "function") {
        return (fn: () => void) => (globalThis as any).scheduler.postTask(fn);
      }
    }

    // Fallback for older React versions or when scheduler is unavailable
    return (fn: () => void) => {
      Promise.resolve().then(fn);
    };
  };

  return tick();
}

/**
 * Detect if we're in concurrent mode (React 19+)
 * @returns True if React 19+ concurrent features are available
 */
function isConcurrentMode(): boolean {
  try {
    // Check React version
    if (
      typeof (globalThis as any).React !== "undefined" &&
      (globalThis as any).React.version
    ) {
      const version = (globalThis as any).React.version;
      const majorVersion = parseInt(version.split(".")[0]);
      return majorVersion >= 19;
    }

    // Check for concurrent features
    return typeof (globalThis as any).scheduler?.postTask === "function";
  } catch {
    return false;
  }
}

// ============================================================================
// ADVANCED SCHEDULER WITH PRIORITY SUPPORT
// ============================================================================

export interface SchedulerTask {
  id: string;
  fn: () => void;
  priority: "urgent" | "normal" | "background";
  delay?: number;
}

/**
 * Advanced scheduler with priority queue and task management
 */
export class PriorityScheduler {
  private tasks: Map<string, SchedulerTask> = new Map();
  private running = false;
  private baseScheduler: SchedulerFunction;

  constructor() {
    this.baseScheduler = createScheduler();
  }

  /**
   * Schedule a task with priority
   * @param task - Task to schedule
   */
  schedule(task: SchedulerTask): void {
    this.tasks.set(task.id, task);

    if (!this.running) {
      this.running = true;
      this.baseScheduler(() => this.processTasks());
    }
  }

  /**
   * Cancel a scheduled task
   * @param taskId - ID of task to cancel
   */
  cancel(taskId: string): void {
    this.tasks.delete(taskId);
  }

  /**
   * Process all scheduled tasks in priority order
   */
  private processTasks(): void {
    const taskArray = Array.from(this.tasks.values());

    // Sort by priority (urgent first, then normal, then background)
    const priorityOrder = { urgent: 0, normal: 1, background: 2 };
    taskArray.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    // Execute tasks
    for (const task of taskArray) {
      try {
        if (task.delay && task.delay > 0) {
          setTimeout(task.fn, task.delay);
        } else {
          task.fn();
        }
      } catch (error) {
        console.error(`[PriorityScheduler] Task ${task.id} failed:`, error);
      }
    }

    // Clear processed tasks
    this.tasks.clear();
    this.running = false;
  }
  /**
   * Get scheduler statistics
   * @returns Current scheduler state with task counts by priority
   */
  getStats(): {
    pendingTasks: number;
    isRunning: boolean;
    tasksByPriority: Record<string, number>;
  } {
    const tasksByPriority: Record<string, number> = {
      urgent: 0,
      normal: 0,
      background: 0,
    };

    // Convert Map values to array to avoid iteration issues
    const taskValues = Array.from(this.tasks.values());

    for (const task of taskValues) {
      const priority = task.priority as keyof typeof tasksByPriority;
      tasksByPriority[priority]++;
    }

    return {
      pendingTasks: this.tasks.size,
      isRunning: this.running,
      tasksByPriority,
    };
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Create a simple scheduler for immediate use
 * @returns Ready-to-use scheduler function
 */
export function createSimpleScheduler(): SchedulerFunction {
  return createScheduler();
}

/**
 * Create a priority scheduler for advanced use cases
 * @returns New priority scheduler instance
 */
export function createPriorityScheduler(): PriorityScheduler {
  return new PriorityScheduler();
}

/**
 * Schedule a task with high priority
 * @param fn - Function to execute
 * @param scheduler - Optional custom scheduler
 */
export function scheduleUrgent(
  fn: () => void,
  scheduler?: PriorityScheduler
): void {
  if (scheduler) {
    scheduler.schedule({
      id: `urgent-${Date.now()}-${Math.random()}`,
      fn,
      priority: "urgent",
    });
  } else {
    const simpleScheduler = createScheduler();
    simpleScheduler(fn);
  }
}
