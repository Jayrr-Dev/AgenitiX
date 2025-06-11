// Background processing system with Web Worker support
import { nodeSystemEvents } from "../../intergration/events/NodeSystemEvents";

// Worker message types
export type WorkerMessageType =
  | "init"
  | "execute"
  | "terminate"
  | "status"
  | "error"
  | "progress"
  | "result";

// Worker message interface
export interface WorkerMessage {
  id: string;
  type: WorkerMessageType;
  payload: any;
  timestamp: number;
  nodeId?: string;
  nodeType?: string;
}

// Worker execution context
export interface WorkerExecutionContext {
  nodeId: string;
  nodeType: string;
  data: any;
  config: WorkerProcessingConfig;
  startTime: number;
  progress: number;
}

// Background processing configuration
export interface WorkerProcessingConfig {
  timeout: number;
  priority: "low" | "normal" | "high";
  retryAttempts: number;
  retryDelay: number;
  enableProgress: boolean;
  memoryLimit: number; // MB
  cpuLimit: number; // % of single core
  transferable: boolean;
  dependencies: string[];
}

// Default worker configuration
const DEFAULT_WORKER_CONFIG: WorkerProcessingConfig = {
  timeout: 30000, // 30 seconds
  priority: "normal",
  retryAttempts: 3,
  retryDelay: 1000,
  enableProgress: true,
  memoryLimit: 256, // 256MB
  cpuLimit: 80,
  transferable: false,
  dependencies: [],
};

// Worker processing result
export interface WorkerProcessingResult<T = any> {
  success: boolean;
  result?: T;
  error?: string;
  executionTime: number;
  memoryUsage: number;
  progress: number;
  transferredData?: ArrayBuffer[];
}

// Worker health status
export interface WorkerHealthStatus {
  id: string;
  status: "idle" | "busy" | "error" | "terminated";
  currentTask?: string;
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  lastActivity: number;
  errorCount: number;
  taskCount: number;
}

// Worker pool statistics
export interface WorkerPoolStats {
  totalWorkers: number;
  activeWorkers: number;
  idleWorkers: number;
  errorWorkers: number;
  queuedTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageExecutionTime: number;
  totalMemoryUsage: number;
  totalCpuUsage: number;
}

// Serializable worker task
export interface SerializableWorkerTask {
  id: string;
  nodeId: string;
  nodeType: string;
  processLogic: string; // Serialized function
  data: any; // Must be serializable
  config: WorkerProcessingConfig;
  priority: number;
  createdAt: number;
  dependencies?: string[];
}

// Background worker manager
export class BackgroundWorkerManager {
  private static instance: BackgroundWorkerManager | null = null;

  private workers = new Map<string, Worker>();
  private workerHealth = new Map<string, WorkerHealthStatus>();
  private taskQueue: SerializableWorkerTask[] = [];
  private activeTasks = new Map<string, SerializableWorkerTask>();
  private completedTasks = new Map<string, WorkerProcessingResult>();

  private maxWorkers: number;
  private isEnabled: boolean;
  private stats: WorkerPoolStats;

  // Monitoring and cleanup
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(maxWorkers = navigator.hardwareConcurrency || 4) {
    this.maxWorkers = Math.min(maxWorkers, 8); // Cap at 8 workers
    this.isEnabled = this.checkWorkerSupport();
    this.stats = this.initializeStats();

    if (this.isEnabled) {
      this.initializeWorkerPool();
      this.setupMonitoring();
    }
  }

  // Singleton pattern
  static getInstance(maxWorkers?: number): BackgroundWorkerManager {
    if (!BackgroundWorkerManager.instance) {
      BackgroundWorkerManager.instance = new BackgroundWorkerManager(
        maxWorkers
      );
    }
    return BackgroundWorkerManager.instance;
  }

  // Check if Web Workers are supported
  private checkWorkerSupport(): boolean {
    return (
      typeof Worker !== "undefined" &&
      typeof window !== "undefined" &&
      "postMessage" in Worker.prototype
    );
  }

  // Initialize worker pool
  private initializeWorkerPool(): void {
    if (!this.isEnabled) return;

    for (let i = 0; i < this.maxWorkers; i++) {
      this.createWorker(`worker-${i}`);
    }

    console.log(`Initialized worker pool with ${this.maxWorkers} workers`);
  }

  // Create individual worker
  private createWorker(workerId: string): void {
    try {
      // Inline worker code for better bundling
      const workerCode = this.generateWorkerCode();
      const blob = new Blob([workerCode], { type: "application/javascript" });
      const workerUrl = URL.createObjectURL(blob);

      const worker = new Worker(workerUrl);

      // Setup worker message handling
      worker.onmessage = (event) => {
        this.handleWorkerMessage(workerId, event.data);
      };

      worker.onerror = (error) => {
        this.handleWorkerError(workerId, error);
      };

      // Initialize worker
      worker.postMessage({
        id: `init-${Date.now()}`,
        type: "init",
        payload: { workerId },
        timestamp: Date.now(),
      });

      this.workers.set(workerId, worker);
      this.workerHealth.set(workerId, {
        id: workerId,
        status: "idle",
        executionTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        lastActivity: Date.now(),
        errorCount: 0,
        taskCount: 0,
      });

      // Clean up blob URL
      URL.revokeObjectURL(workerUrl);
    } catch (error) {
      console.error(`Failed to create worker ${workerId}:`, error);
    }
  }

  // Generate worker code
  private generateWorkerCode(): string {
    return `
// Web Worker for background node processing
let workerId = null;
let currentTask = null;
let startTime = null;

// Worker message handler
self.onmessage = function(event) {
  const message = event.data;

  try {
    switch (message.type) {
      case 'init':
        workerId = message.payload.workerId;
        postMessage({
          id: message.id,
          type: 'status',
          payload: { status: 'initialized', workerId },
          timestamp: Date.now()
        });
        break;

      case 'execute':
        handleTaskExecution(message);
        break;

      case 'terminate':
        self.close();
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  } catch (error) {
    postMessage({
      id: message.id,
      type: 'error',
      payload: { error: error.message, stack: error.stack },
      timestamp: Date.now()
    });
  }
};

// Handle task execution
async function handleTaskExecution(message) {
  const task = message.payload;
  currentTask = task;
  startTime = Date.now();

  try {
    // Progress reporting
    function reportProgress(progress) {
      postMessage({
        id: task.id,
        type: 'progress',
        payload: { progress, executionTime: Date.now() - startTime },
        timestamp: Date.now(),
        nodeId: task.nodeId,
        nodeType: task.nodeType
      });
    }

    // Deserialize and execute the process logic
    const processLogic = new Function('data', 'context', 'reportProgress', task.processLogic);

    const context = {
      nodeId: task.nodeId,
      nodeType: task.nodeType,
      config: task.config,
      startTime,
      progress: 0
    };

    // Set timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Task timeout')), task.config.timeout);
    });

    // Execute task
    const taskPromise = Promise.resolve(processLogic(task.data, context, reportProgress));

    const result = await Promise.race([taskPromise, timeoutPromise]);

    // Report success
    postMessage({
      id: task.id,
      type: 'result',
      payload: {
        success: true,
        result,
        executionTime: Date.now() - startTime,
        progress: 100
      },
      timestamp: Date.now(),
      nodeId: task.nodeId,
      nodeType: task.nodeType
    });

  } catch (error) {
    // Report error
    postMessage({
      id: task.id,
      type: 'result',
      payload: {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
        progress: 0
      },
      timestamp: Date.now(),
      nodeId: task.nodeId,
      nodeType: task.nodeType
    });
  } finally {
    currentTask = null;
    startTime = null;
  }
}

// Error handler
self.onerror = function(error) {
  postMessage({
    id: 'error-' + Date.now(),
    type: 'error',
    payload: {
      error: error.message,
      filename: error.filename,
      lineno: error.lineno
    },
    timestamp: Date.now()
  });
};
`;
  }

  // Handle worker messages
  private handleWorkerMessage(workerId: string, message: WorkerMessage): void {
    const health = this.workerHealth.get(workerId);
    if (health) {
      health.lastActivity = Date.now();
    }

    switch (message.type) {
      case "status":
        this.handleStatusMessage(workerId, message);
        break;

      case "progress":
        this.handleProgressMessage(workerId, message);
        break;

      case "result":
        this.handleResultMessage(workerId, message);
        break;

      case "error":
        this.handleErrorMessage(workerId, message);
        break;
    }
  }

  // Handle status messages
  private handleStatusMessage(workerId: string, message: WorkerMessage): void {
    const health = this.workerHealth.get(workerId);
    if (health) {
      health.status = message.payload.status;
    }
  }

  // Handle progress messages
  private handleProgressMessage(
    workerId: string,
    message: WorkerMessage
  ): void {
    if (message.nodeId && message.nodeType) {
      // Emit system performance metric for worker progress
      nodeSystemEvents.emitV2(
        "system:performance-metric",
        "worker-progress",
        message.payload.progress,
        message.nodeType
      );
    }
  }

  // Handle result messages
  private handleResultMessage(workerId: string, message: WorkerMessage): void {
    const taskId = message.id;
    const result = message.payload as WorkerProcessingResult;

    // Update worker health
    const health = this.workerHealth.get(workerId);
    if (health) {
      health.status = "idle";
      health.taskCount++;
      if (!result.success) {
        health.errorCount++;
      }
    }

    // Store result
    this.completedTasks.set(taskId, result);

    // Remove from active tasks
    this.activeTasks.delete(taskId);

    // Update stats
    this.stats.completedTasks++;
    if (!result.success) {
      this.stats.failedTasks++;
    }

    // Emit completion event using system performance metric
    if (message.nodeId && message.nodeType) {
      nodeSystemEvents.emitV2(
        "system:performance-metric",
        "worker-task-completed",
        result.executionTime,
        message.nodeType
      );
    }

    // Process next task
    this.processNextTask();
  }

  // Handle error messages
  private handleErrorMessage(workerId: string, message: WorkerMessage): void {
    const health = this.workerHealth.get(workerId);
    if (health) {
      health.status = "error";
      health.errorCount++;
    }

    console.error(`Worker ${workerId} error:`, message.payload);

    // Restart worker if too many errors
    if (health && health.errorCount > 5) {
      this.restartWorker(workerId);
    }
  }

  // Handle worker errors
  private handleWorkerError(workerId: string, error: ErrorEvent): void {
    console.error(`Worker ${workerId} error:`, error);

    const health = this.workerHealth.get(workerId);
    if (health) {
      health.status = "error";
      health.errorCount++;
    }

    // Restart worker
    this.restartWorker(workerId);
  }

  // Restart worker
  private restartWorker(workerId: string): void {
    console.log(`Restarting worker: ${workerId}`);

    // Terminate existing worker
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.terminate();
    }

    // Remove from maps
    this.workers.delete(workerId);
    this.workerHealth.delete(workerId);

    // Create new worker
    setTimeout(() => {
      this.createWorker(workerId);
    }, 1000);
  }

  // Execute task in background
  async executeInBackground<T = any>(
    nodeId: string,
    nodeType: string,
    processLogic: (
      data: any,
      context: WorkerExecutionContext,
      reportProgress?: (progress: number) => void
    ) => T | Promise<T>,
    data: any,
    config: Partial<WorkerProcessingConfig> = {}
  ): Promise<WorkerProcessingResult<T>> {
    if (!this.isEnabled) {
      // Fallback to synchronous execution
      return this.executeSynchronously(
        nodeId,
        nodeType,
        processLogic,
        data,
        config
      );
    }

    const taskConfig = { ...DEFAULT_WORKER_CONFIG, ...config };
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Validate data serializability
    if (!this.isSerializable(data)) {
      throw new Error("Data must be serializable for background processing");
    }

    // Create serializable task
    const task: SerializableWorkerTask = {
      id: taskId,
      nodeId,
      nodeType,
      processLogic: processLogic.toString(),
      data,
      config: taskConfig,
      priority: this.getPriorityValue(taskConfig.priority),
      createdAt: Date.now(),
    };

    // Add to queue
    this.taskQueue.push(task);
    this.taskQueue.sort((a, b) => b.priority - a.priority); // Higher priority first

    this.stats.queuedTasks++;

    // Process immediately if worker available
    this.processNextTask();

    // Return promise that resolves when task completes
    return new Promise((resolve, reject) => {
      const checkCompletion = () => {
        const result = this.completedTasks.get(taskId);
        if (result) {
          this.completedTasks.delete(taskId);
          resolve(result);
        } else {
          setTimeout(checkCompletion, 100);
        }
      };

      // Start checking after a brief delay
      setTimeout(checkCompletion, 100);

      // Timeout fallback
      setTimeout(() => {
        if (!this.completedTasks.has(taskId)) {
          reject(new Error("Task execution timeout"));
        }
      }, taskConfig.timeout + 5000);
    });
  }

  // Process next task in queue
  private processNextTask(): void {
    if (this.taskQueue.length === 0) return;

    // Find available worker
    const availableWorker = this.findAvailableWorker();
    if (!availableWorker) return;

    // Get next task
    const task = this.taskQueue.shift()!;
    this.activeTasks.set(task.id, task);
    this.stats.queuedTasks--;

    // Update worker status
    const health = this.workerHealth.get(availableWorker);
    if (health) {
      health.status = "busy";
      health.currentTask = task.id;
    }

    // Send task to worker
    const worker = this.workers.get(availableWorker);
    if (worker) {
      worker.postMessage({
        id: task.id,
        type: "execute",
        payload: task,
        timestamp: Date.now(),
        nodeId: task.nodeId,
        nodeType: task.nodeType,
      });
    }
  }

  // Find available worker
  private findAvailableWorker(): string | null {
    let availableWorkerId: string | null = null;
    this.workerHealth.forEach((health, workerId) => {
      if (health.status === "idle" && !availableWorkerId) {
        availableWorkerId = workerId;
      }
    });
    return availableWorkerId;
  }

  // Fallback synchronous execution
  private async executeSynchronously<T>(
    nodeId: string,
    nodeType: string,
    processLogic: Function,
    data: any,
    config: Partial<WorkerProcessingConfig>
  ): Promise<WorkerProcessingResult<T>> {
    const taskConfig = { ...DEFAULT_WORKER_CONFIG, ...config };
    const startTime = Date.now();

    try {
      const context: WorkerExecutionContext = {
        nodeId,
        nodeType,
        data,
        config: taskConfig,
        startTime,
        progress: 0,
      };

      const result = await Promise.resolve(processLogic(data, context));

      return {
        success: true,
        result,
        executionTime: Date.now() - startTime,
        memoryUsage: 0,
        progress: 100,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime: Date.now() - startTime,
        memoryUsage: 0,
        progress: 0,
      };
    }
  }

  // Utility methods
  private isSerializable(obj: any): boolean {
    try {
      JSON.stringify(obj);
      return true;
    } catch {
      return false;
    }
  }

  private getPriorityValue(priority: "low" | "normal" | "high"): number {
    switch (priority) {
      case "high":
        return 3;
      case "normal":
        return 2;
      case "low":
        return 1;
      default:
        return 2;
    }
  }

  private initializeStats(): WorkerPoolStats {
    return {
      totalWorkers: this.maxWorkers,
      activeWorkers: 0,
      idleWorkers: this.maxWorkers,
      errorWorkers: 0,
      queuedTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageExecutionTime: 0,
      totalMemoryUsage: 0,
      totalCpuUsage: 0,
    };
  }

  // Setup monitoring
  private setupMonitoring(): void {
    // Health check every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000);

    // Cleanup completed tasks every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupCompletedTasks();
    }, 300000);
  }

  // Perform health check
  private performHealthCheck(): void {
    let activeWorkers = 0;
    let idleWorkers = 0;
    let errorWorkers = 0;

    this.workerHealth.forEach((health, workerId) => {
      // Check for stale workers
      const timeSinceActivity = Date.now() - health.lastActivity;
      if (timeSinceActivity > 300000 && health.status === "busy") {
        // Worker has been busy for > 5 minutes, might be stuck
        console.warn(`Worker ${workerId} appears to be stuck, restarting`);
        this.restartWorker(workerId);
        return;
      }

      switch (health.status) {
        case "busy":
          activeWorkers++;
          break;
        case "idle":
          idleWorkers++;
          break;
        case "error":
          errorWorkers++;
          break;
      }
    });

    // Update stats
    this.stats.activeWorkers = activeWorkers;
    this.stats.idleWorkers = idleWorkers;
    this.stats.errorWorkers = errorWorkers;
  }

  // Cleanup completed tasks
  private cleanupCompletedTasks(): void {
    const cutoffTime = Date.now() - 3600000; // 1 hour ago

    this.completedTasks.forEach((result, taskId) => {
      // Remove old completed tasks
      if (Date.now() - cutoffTime > 3600000) {
        this.completedTasks.delete(taskId);
      }
    });
  }

  // Public API methods
  getStats(): WorkerPoolStats {
    return { ...this.stats };
  }

  getWorkerHealth(): WorkerHealthStatus[] {
    const healthList: WorkerHealthStatus[] = [];
    this.workerHealth.forEach((health) => healthList.push(health));
    return healthList;
  }

  getQueueStatus(): {
    queuedTasks: number;
    activeTasks: number;
    tasks: SerializableWorkerTask[];
  } {
    return {
      queuedTasks: this.taskQueue.length,
      activeTasks: this.activeTasks.size,
      tasks: [...this.taskQueue],
    };
  }

  isBackgroundProcessingAvailable(): boolean {
    return this.isEnabled;
  }

  // Cleanup method
  destroy(): void {
    // Terminate all workers
    this.workers.forEach((worker, workerId) => {
      worker.terminate();
    });

    // Clear intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Clear maps
    this.workers.clear();
    this.workerHealth.clear();
    this.taskQueue.length = 0;
    this.activeTasks.clear();
    this.completedTasks.clear();

    BackgroundWorkerManager.instance = null;
  }
}

// Utility function for worker-safe data serialization
export function makeWorkerSafe<T>(data: T): T {
  // Remove functions and non-serializable objects
  return JSON.parse(JSON.stringify(data));
}

// Hook for background processing
export function useBackgroundProcessing() {
  const manager = BackgroundWorkerManager.getInstance();

  return {
    executeInBackground: manager.executeInBackground.bind(manager),
    getStats: manager.getStats.bind(manager),
    getWorkerHealth: manager.getWorkerHealth.bind(manager),
    getQueueStatus: manager.getQueueStatus.bind(manager),
    isAvailable: manager.isBackgroundProcessingAvailable.bind(manager),
  };
}

// Export singleton instance
export const backgroundWorkerManager = BackgroundWorkerManager.getInstance();
