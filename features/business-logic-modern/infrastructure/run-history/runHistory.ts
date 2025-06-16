/**
 * RUN HISTORY PLACEHOLDER - to be swapped with Convex implementation.
 */

export interface WorkflowRun {
  id: string;
  workflowId: string;
  status: "running" | "succeeded" | "failed";
  startedAt: number;
  finishedAt?: number;
}

const runs: WorkflowRun[] = [];

export const recordRunStart = (id: string, workflowId: string) => {
  runs.push({ id, workflowId, status: "running", startedAt: Date.now() });
};

export const recordRunEnd = (id: string, status: "succeeded" | "failed") => {
  const run = runs.find((r) => r.id === id);
  if (run) {
    run.status = status;
    run.finishedAt = Date.now();
  }
};

export const getRunHistory = () => runs;
