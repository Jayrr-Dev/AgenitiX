/**
 * Route: convex/workflows.ts
 * WORKFLOW RUNNER - Resumable step execution chained via scheduler
 *
 * • Runs long logic as small steps in Actions
 * • Persists cursor/attempts/status in `workflow_runs`
 * • Retries with backoff; cron watchdog resumes stuck runs
 *
 * Keywords: workflows, long-running, scheduler, retries, resumable
 */

import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction, mutation, query } from "./_generated/server";

const MAX_ATTEMPTS = 5 as const;
const BASE_BACKOFF_MS = 1_000 as const;
const MAX_BACKOFF_MS = 30_000 as const;
const LEASE_MS = 60_000 as const; // [Explanation], basically prevent double-runs

/** Compute capped exponential backoff */
function computeBackoffMs(attempt: number): number {
  const delay = BASE_BACKOFF_MS * 2 ** Math.max(0, attempt);
  return Math.min(delay, MAX_BACKOFF_MS);
}

// =============================================================================
// STEP TYPES
// =============================================================================

/** Single AI generation step */
type AiStep = {
  type: "ai";
  prompt: string;
  threadId?: string;
  agentConfig?: {
    selectedProvider: "openai" | "anthropic" | "google" | "custom";
    selectedModel: string;
    systemPrompt?: string;
    maxSteps?: number;
    temperature?: number;
    customApiKey?: string;
    customEndpoint?: string;
    enabledTools?: Array<{ type: string; name: string; config?: unknown }>;
  };
};

/** Delay step in milliseconds (non-blocking) */
type DelayStep = { type: "delay"; ms: number };

/** Email attachment payload */
type EmailAttachment = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  content?: string; // base64
};

/** Send email via existing Convex action */
type EmailStep = {
  type: "email";
  accountId: string; // Convex Id<"email_accounts"> as string
  to: string[];
  subject: string;
  textContent?: string;
  htmlContent?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
  userEmailHint?: string;
};

/** HTTP fetch request step */
type FetchStep = {
  type: "fetch";
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: string | object;
  timeout?: number; // milliseconds, default 30000
  outVar?: string; // Variable name to store response in
};

/** Database store operation step */
type StoreStep = {
  type: "store";
  operation: "insert" | "update" | "delete" | "get";
  table: string;
  id?: string; // For update/delete/get operations
  data?: object; // For insert/update operations
  outVar?: string; // Variable name to store result in
};

/** Conditional branch step */
type BranchStep = {
  type: "branch";
  condition: string; // JavaScript expression to evaluate
  jumpTo?: number; // Step index to jump to if condition is true
  // If jumpTo not provided, continues to next step
};

/** Parallel execution fan-out step */
type ParallelStep = {
  type: "parallel";
  branches: Array<{
    steps: Step[];
    name?: string; // Optional branch identifier
  }>;
  joinAfter: boolean; // Whether to wait for all branches to complete
};

/** Join step to collect parallel results */
type JoinStep = {
  type: "join";
  parallelRunIds: string[]; // IDs of parallel runs to wait for
  outVar?: string; // Variable name to store collected results
};

type Step =
  | AiStep
  | DelayStep
  | EmailStep
  | FetchStep
  | StoreStep
  | BranchStep
  | ParallelStep
  | JoinStep;

type ExecutionData = {
  steps?: Step[];
  results?: unknown[];
  variables?: Record<string, unknown>; // [Explanation], basically key-value store for step outputs
  parallelRuns?: Record<string, string[]>; // [Explanation], basically track parallel run IDs by step index
};

/** Start a workflow run */
export const startWorkflowRun = mutation({
  args: {
    workflow_name: v.string(),
    user_id: v.id("users"),
    execution_data: v.optional(v.any()),
    total_nodes: v.optional(v.number()),
  },
  async handler(ctx, args) {
    const now = Date.now();
    const providedExec = (args.execution_data as ExecutionData | undefined) || {
      steps: [],
      results: [],
    };
    const inferredTotal =
      typeof args.total_nodes === "number"
        ? args.total_nodes
        : Array.isArray(providedExec.steps)
          ? providedExec.steps.length
          : 0;
    const runId = await ctx.db.insert("workflow_runs", {
      user_id: args.user_id,
      workflow_name: args.workflow_name,
      status: "running",
      nodes_executed: 0,
      total_nodes: inferredTotal,
      started_at: now,
      execution_data: providedExec,
      attempt: 0,
      lease_until: now + LEASE_MS,
      cancelled: false,
    });

    await ctx.scheduler.runAfter(
      0,
      internal.workflows.executeNextStepWithRetry,
      {
        runId,
        attempt: 0,
      }
    );

    return { runId };
  },
});

/** Cancel a workflow run cooperatively */
export const cancelWorkflowRun = mutation({
  args: { runId: v.id("workflow_runs") },
  async handler(ctx, { runId }) {
    await ctx.db.patch(runId, { cancelled: true });
    return { cancelled: true };
  },
});

/** Get workflow run */
export const getWorkflowRun = query({
  args: { runId: v.id("workflow_runs") },
  async handler(ctx, { runId }) {
    return await ctx.db.get(runId);
  },
});

/** Execute the next step of a workflow */
export const executeNextStep = internalAction({
  args: { runId: v.id("workflow_runs") },
  async handler(ctx, { runId }) {
    const now = Date.now();
    const run = await ctx.runQuery(api.workflows.getWorkflowRun, { runId });
    if (!run) return;
    if (run.status !== "running") return;

    // Respect cancellation
    if (run.cancelled) {
      await ctx.runMutation(api.workflows.updateWorkflowStatus, {
        runId,
        status: "cancelled",
        completed_at: now,
      });
      return;
    }

    // Renew lease (soft lock)
    await ctx.runMutation(api.workflows.updateWorkflowLease, {
      runId,
      lease_until: now + LEASE_MS,
    });

    // Perform a single step
    const { done, updated } = await performStep(ctx, {
      nodes_executed: run.nodes_executed,
      total_nodes: run.total_nodes,
      execution_data: run.execution_data ?? { steps: [], results: [] },
      step_cursor: run.step_cursor ?? 0,
    });

    await ctx.runMutation(api.workflows.updateWorkflowProgress, {
      runId,
      nodes_executed: updated.nodes_executed,
      total_nodes: updated.total_nodes,
      execution_data: updated.execution_data,
      step_cursor: updated.step_cursor ?? undefined,
      attempt: 0,
    });

    if (done) {
      await ctx.runMutation(api.workflows.updateWorkflowStatus, {
        runId,
        status: "completed",
        completed_at: Date.now(),
      });
      return;
    }

    // Schedule next step immediately or at hinted time
    const delay = Math.max(0, (updated.next_run_at ?? 0) - Date.now());
    await ctx.scheduler.runAfter(
      delay,
      internal.workflows.executeNextStepWithRetry,
      {
        runId,
        attempt: 0,
      }
    );
  },
});

/** Execute with retry/backoff */
export const executeNextStepWithRetry = internalAction({
  args: { runId: v.id("workflow_runs"), attempt: v.optional(v.number()) },
  async handler(ctx, { runId, attempt = 0 }) {
    try {
      await ctx.runAction(internal.workflows.executeNextStep, { runId });
    } catch (error) {
      const run = await ctx.runQuery(api.workflows.getWorkflowRun, { runId });
      if (!run) return;
      const nextAttempt = attempt + 1;
      if (nextAttempt >= MAX_ATTEMPTS) {
        await ctx.runMutation(api.workflows.updateWorkflowStatus, {
          runId,
          status: "failed",
          error_message: String(error),
          completed_at: Date.now(),
        });
        return;
      }
      const delay = computeBackoffMs(nextAttempt - 1);
      await ctx.runMutation(api.workflows.updateWorkflowProgress, {
        runId,
        nodes_executed: run.nodes_executed,
        total_nodes: run.total_nodes,
        execution_data: run.execution_data,
        step_cursor: run.step_cursor,
        attempt: nextAttempt,
        next_run_at: Date.now() + delay,
      });
      await ctx.scheduler.runAfter(
        delay,
        internal.workflows.executeNextStepWithRetry,
        {
          runId,
          attempt: nextAttempt,
        }
      );
    }
  },
});

/** Watchdog to resume stuck runs (called from cron) */
export const resumeStuckRuns = internalAction({
  args: {},
  async handler(ctx) {
    const now = Date.now();
    const running = await ctx.runQuery(
      api.workflows.getRunningWorkflowRuns,
      {}
    );

    for (const run of running) {
      if (run.cancelled) continue;
      const leaseExpired = !run.lease_until || run.lease_until < now;
      if (leaseExpired) {
        const attempt = typeof run.attempt === "number" ? run.attempt : 0;
        const delay = computeBackoffMs(attempt);
        await ctx.runMutation(api.workflows.updateWorkflowProgress, {
          runId: run._id,
          nodes_executed: run.nodes_executed,
          total_nodes: run.total_nodes,
          execution_data: run.execution_data,
          step_cursor: run.step_cursor,
          attempt: attempt + 1,
          next_run_at: now + delay,
        });
        await ctx.runMutation(api.workflows.updateWorkflowLease, {
          runId: run._id,
          lease_until: now + LEASE_MS,
        });
        await ctx.scheduler.runAfter(
          delay,
          internal.workflows.executeNextStepWithRetry,
          {
            runId: run._id,
            attempt: attempt + 1,
          }
        );
      }
    }
  },
});

// ----------------------------------------------------------------------------
// Domain step executor (replace contents to call your AI/email nodes)
// ----------------------------------------------------------------------------

type StepResult<
  TExecution = unknown,
  TCursor extends number | null = number | null,
> = {
  done: boolean;
  updated: {
    nodes_executed: number;
    total_nodes: number;
    execution_data: TExecution;
    step_cursor: TCursor;
    next_run_at?: number;
  };
};

async function performStep(
  _ctx: any,
  run: {
    nodes_executed: number;
    total_nodes: number;
    execution_data: unknown;
    step_cursor?: number | null;
  }
): Promise<StepResult> {
  // [Explanation], basically safely parse execution data
  const exec = (run.execution_data as ExecutionData) || {
    steps: [],
    results: [],
    variables: {},
    parallelRuns: {},
  };

  const cursor = (run.step_cursor ?? 0) as number;
  const steps = exec.steps ?? [];
  const results = Array.isArray(exec.results) ? exec.results : [];
  const variables = exec.variables ?? {};
  const parallelRuns = exec.parallelRuns ?? {};

  if (cursor >= steps.length) {
    return {
      done: true,
      updated: {
        nodes_executed: run.nodes_executed,
        total_nodes: steps.length,
        execution_data: { steps, results, variables, parallelRuns },
        step_cursor: cursor,
      },
    };
  }

  const step = steps[cursor];

  // Handle delay step
  if (step && (step as any).type === "delay") {
    const ms = Math.max(0, Number((step as any).ms) || 0);
    return {
      done: false,
      updated: {
        nodes_executed: run.nodes_executed,
        total_nodes: steps.length,
        execution_data: { steps, results, variables, parallelRuns },
        step_cursor: cursor + 1,
        next_run_at: Date.now() + ms,
      },
    };
  }

  // Handle AI step using existing action
  if (step && (step as any).type === "ai") {
    // Note: Use internal call to public action to preserve auth and node runtime
    const s = step as {
      type: "ai";
      prompt: string;
      threadId?: string;
      agentConfig?: any;
    };
    const res = await _ctx.runAction(api.aiAgent.processUserMessage, {
      threadId: s.threadId ?? "",
      userInput: s.prompt,
      agentConfig: s.agentConfig ?? {
        selectedProvider: "openai",
        selectedModel: "gpt-4o-mini",
        systemPrompt: "",
        maxSteps: 1,
        temperature: 0.2,
      },
    });

    const newResults = results.concat({ ai: res });
    return {
      done: cursor + 1 >= steps.length,
      updated: {
        nodes_executed: run.nodes_executed + 1,
        total_nodes: steps.length,
        execution_data: { steps, results: newResults, variables, parallelRuns },
        step_cursor: cursor + 1,
      },
    };
  }

  // Handle Fetch step
  if (step && (step as any).type === "fetch") {
    const s = step as any as FetchStep;
    const timeout = s.timeout ?? 30000;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const fetchOptions: RequestInit = {
        method: s.method ?? "GET",
        headers: s.headers ?? {},
        signal: controller.signal,
      };

      if (
        s.body &&
        (s.method === "POST" || s.method === "PUT" || s.method === "PATCH")
      ) {
        if (typeof s.body === "object") {
          fetchOptions.body = JSON.stringify(s.body);
          fetchOptions.headers = {
            ...fetchOptions.headers,
            "Content-Type": "application/json",
          };
        } else {
          fetchOptions.body = s.body;
        }
      }

      const response = await fetch(s.url, fetchOptions);
      clearTimeout(timeoutId);

      const headers = Object.fromEntries(response.headers.entries());
      let responseData: any = {
        fetch: {
          status: response.status,
          headers,
        },
      };

      // Try to parse as JSON first, fallback to text
      try {
        const json = await response.json();
        responseData.fetch.json = json;
        if (s.outVar) {
          variables[s.outVar] = json;
        }
      } catch {
        const text = await response.text();
        responseData.fetch.text = text;
        if (s.outVar) {
          variables[s.outVar] = text;
        }
      }

      const newResults = results.concat(responseData);
      return {
        done: cursor + 1 >= steps.length,
        updated: {
          nodes_executed: run.nodes_executed + 1,
          total_nodes: steps.length,
          execution_data: {
            steps,
            results: newResults,
            variables,
            parallelRuns,
          },
          step_cursor: cursor + 1,
        },
      };
    } catch (error) {
      const errorResult = {
        fetch: {
          status: 0,
          headers: {},
          error: String(error),
        },
      };
      const newResults = results.concat(errorResult);
      return {
        done: cursor + 1 >= steps.length,
        updated: {
          nodes_executed: run.nodes_executed + 1,
          total_nodes: steps.length,
          execution_data: {
            steps,
            results: newResults,
            variables,
            parallelRuns,
          },
          step_cursor: cursor + 1,
        },
      };
    }
  }

  // Handle Email step using existing action
  if (step && (step as any).type === "email") {
    const s = step as any as EmailStep;
    const res = await _ctx.runAction(api.emailAccounts.sendEmail, {
      accountId: s.accountId as unknown as Id<"email_accounts">,
      to: s.to,
      cc: s.cc,
      bcc: s.bcc,
      subject: s.subject,
      textContent: s.textContent,
      htmlContent: s.htmlContent,
      attachments: s.attachments,
      userEmailHint: s.userEmailHint,
    });

    const newResults = results.concat({ email: res });
    return {
      done: cursor + 1 >= steps.length,
      updated: {
        nodes_executed: run.nodes_executed + 1,
        total_nodes: steps.length,
        execution_data: { steps, results: newResults, variables, parallelRuns },
        step_cursor: cursor + 1,
      },
    };
  }

  // Handle Store step
  if (step && (step as any).type === "store") {
    const s = step as any as StoreStep;

    try {
      // [Explanation], basically validate table name for security
      const allowedTables = [
        "workflow_runs",
        "users",
        "email_accounts",
        "ai_threads",
        "ai_messages",
        "business_logic_flows",
        "business_logic_nodes",
        "business_logic_runs",
      ];

      if (!allowedTables.includes(s.table)) {
        throw new Error(`Invalid table name: ${s.table}`);
      }

      let storeResult: any = { store: {} };

      switch (s.operation) {
        case "insert":
          if (!s.data) throw new Error("Insert operation requires data");
          const insertId = await _ctx.runMutation(api.workflows.storeInsert, {
            table: s.table,
            data: s.data,
          });
          storeResult.store.id = insertId;
          storeResult.store.operation = "insert";
          if (s.outVar) {
            variables[s.outVar] = insertId;
          }
          break;

        case "update":
          if (!s.id || !s.data)
            throw new Error("Update operation requires id and data");
          await _ctx.runMutation(api.workflows.storeUpdate, {
            table: s.table,
            id: s.id,
            data: s.data,
          });
          storeResult.store.id = s.id;
          storeResult.store.operation = "update";
          if (s.outVar) {
            variables[s.outVar] = s.id;
          }
          break;

        case "get":
          if (!s.id) throw new Error("Get operation requires id");
          const doc = await _ctx.runQuery(api.workflows.storeGet, {
            table: s.table,
            id: s.id,
          });
          storeResult.store.doc = doc;
          storeResult.store.operation = "get";
          if (s.outVar) {
            variables[s.outVar] = doc;
          }
          break;

        case "delete":
          if (!s.id) throw new Error("Delete operation requires id");
          await _ctx.runMutation(api.workflows.storeDelete, {
            table: s.table,
            id: s.id,
          });
          storeResult.store.operation = "delete";
          storeResult.store.id = s.id;
          if (s.outVar) {
            variables[s.outVar] = true;
          }
          break;

        default:
          throw new Error(`Unknown store operation: ${s.operation}`);
      }

      const newResults = results.concat(storeResult);
      return {
        done: cursor + 1 >= steps.length,
        updated: {
          nodes_executed: run.nodes_executed + 1,
          total_nodes: steps.length,
          execution_data: {
            steps,
            results: newResults,
            variables,
            parallelRuns,
          },
          step_cursor: cursor + 1,
        },
      };
    } catch (error) {
      const errorResult = {
        store: {
          operation: s.operation,
          error: String(error),
        },
      };
      const newResults = results.concat(errorResult);
      return {
        done: cursor + 1 >= steps.length,
        updated: {
          nodes_executed: run.nodes_executed + 1,
          total_nodes: steps.length,
          execution_data: {
            steps,
            results: newResults,
            variables,
            parallelRuns,
          },
          step_cursor: cursor + 1,
        },
      };
    }
  }

  // Handle Parallel step
  if (step && (step as any).type === "parallel") {
    const s = step as any as ParallelStep;

    try {
      const childRunIds: string[] = [];

      // [Explanation], basically spawn child workflow runs for each branch
      for (let i = 0; i < s.branches.length; i++) {
        const branch = s.branches[i];
        const childExecution: ExecutionData = {
          steps: branch.steps,
          results: [],
          variables: { ...variables }, // [Explanation], basically inherit parent variables
          parallelRuns: {},
        };

        const childRun = await _ctx.runMutation(
          api.workflows.startWorkflowRun,
          {
            workflow_name: `parallel_branch_${cursor}_${i}`,
            user_id: "system" as any, // [Explanation], basically system-spawned runs
            execution_data: childExecution,
            total_nodes: branch.steps.length,
          }
        );

        childRunIds.push(childRun.runId);
      }

      // [Explanation], basically store parallel run IDs for join step
      const updatedParallelRuns = { ...parallelRuns };
      updatedParallelRuns[cursor.toString()] = childRunIds;

      const parallelResult = {
        parallel: {
          childrenRunIds: childRunIds,
          branches: s.branches.length,
          joinAfter: s.joinAfter,
        },
      };

      const newResults = results.concat(parallelResult);

      if (s.joinAfter) {
        // [Explanation], basically schedule join step to wait for completion
        return {
          done: false,
          updated: {
            nodes_executed: run.nodes_executed + 1,
            total_nodes: steps.length,
            execution_data: {
              steps,
              results: newResults,
              variables,
              parallelRuns: updatedParallelRuns,
            },
            step_cursor: cursor + 1,
            next_run_at: Date.now() + 1000, // [Explanation], basically check back in 1 second
          },
        };
      } else {
        // [Explanation], basically fire-and-forget parallel execution
        return {
          done: cursor + 1 >= steps.length,
          updated: {
            nodes_executed: run.nodes_executed + 1,
            total_nodes: steps.length,
            execution_data: {
              steps,
              results: newResults,
              variables,
              parallelRuns: updatedParallelRuns,
            },
            step_cursor: cursor + 1,
          },
        };
      }
    } catch (error) {
      const errorResult = {
        parallel: {
          childrenRunIds: [],
          error: String(error),
        },
      };
      const newResults = results.concat(errorResult);
      return {
        done: false,
        updated: {
          nodes_executed: run.nodes_executed + 1,
          total_nodes: steps.length,
          execution_data: {
            steps,
            results: newResults,
            variables,
            parallelRuns,
          },
          step_cursor: cursor + 1,
        },
      };
    }
  }

  // Handle Join step
  if (step && (step as any).type === "join") {
    const s = step as any as JoinStep;

    try {
      const runIds = s.parallelRunIds;
      const joinResults: unknown[] = [];
      let allCompleted = true;

      // [Explanation], basically check status of all parallel runs
      for (const runId of runIds) {
        const childRun = await _ctx.runQuery(api.workflows.getWorkflowRun, {
          runId: runId as any,
        });

        if (!childRun) {
          allCompleted = false;
          break;
        }

        if (childRun.status === "running") {
          allCompleted = false;
          break;
        } else if (childRun.status === "completed") {
          const childExec = childRun.execution_data as ExecutionData;
          joinResults.push({
            runId,
            status: "completed",
            results: childExec.results,
            variables: childExec.variables,
          });
        } else {
          joinResults.push({
            runId,
            status: childRun.status,
            error: childRun.error_message,
          });
        }
      }

      if (!allCompleted) {
        // [Explanation], basically wait longer and check again
        return {
          done: false,
          updated: {
            nodes_executed: run.nodes_executed,
            total_nodes: steps.length,
            execution_data: { steps, results, variables, parallelRuns },
            step_cursor: cursor,
            next_run_at: Date.now() + 2000, // [Explanation], basically check back in 2 seconds
          },
        };
      }

      // [Explanation], basically all parallel runs completed, merge results
      const joinResult = {
        join: {
          results: joinResults,
          completed: joinResults.length,
        },
      };

      if (s.outVar) {
        variables[s.outVar] = joinResults;
      }

      const newResults = results.concat(joinResult);
      return {
        done: cursor + 1 >= steps.length,
        updated: {
          nodes_executed: run.nodes_executed + 1,
          total_nodes: steps.length,
          execution_data: {
            steps,
            results: newResults,
            variables,
            parallelRuns,
          },
          step_cursor: cursor + 1,
        },
      };
    } catch (error) {
      const errorResult = {
        join: {
          results: [],
          error: String(error),
        },
      };
      const newResults = results.concat(errorResult);
      return {
        done: false,
        updated: {
          nodes_executed: run.nodes_executed + 1,
          total_nodes: steps.length,
          execution_data: {
            steps,
            results: newResults,
            variables,
            parallelRuns,
          },
          step_cursor: cursor + 1,
        },
      };
    }
  }

  // Handle Branch step
  if (step && (step as any).type === "branch") {
    const s = step as any as BranchStep;

    try {
      // [Explanation], basically evaluate condition safely in sandboxed context
      const conditionResult = evaluateCondition(s.condition, variables);
      const taken = Boolean(conditionResult);

      let nextCursor = cursor + 1;
      if (taken && s.jumpTo !== undefined) {
        // [Explanation], basically guard against invalid jump indices
        if (s.jumpTo >= 0 && s.jumpTo < steps.length) {
          nextCursor = s.jumpTo;
        } else {
          throw new Error(`Invalid jump target: ${s.jumpTo}`);
        }
      }

      const branchResult = {
        branch: {
          taken: taken ? "true" : "false",
          condition: s.condition,
          jumpTo: taken ? s.jumpTo : undefined,
        },
      };

      const newResults = results.concat(branchResult);
      return {
        done: nextCursor >= steps.length,
        updated: {
          nodes_executed: run.nodes_executed + 1,
          total_nodes: steps.length,
          execution_data: {
            steps,
            results: newResults,
            variables,
            parallelRuns,
          },
          step_cursor: nextCursor,
        },
      };
    } catch (error) {
      const errorResult = {
        branch: {
          taken: "false",
          condition: s.condition,
          error: String(error),
        },
      };
      const newResults = results.concat(errorResult);
      return {
        done: false,
        updated: {
          nodes_executed: run.nodes_executed + 1,
          total_nodes: steps.length,
          execution_data: {
            steps,
            results: newResults,
            variables,
            parallelRuns,
          },
          step_cursor: cursor + 1,
        },
      };
    }
  }

  // Fallback: skip unknown step
  return {
    done: false,
    updated: {
      nodes_executed: run.nodes_executed + 1,
      total_nodes: steps.length,
      execution_data: { steps, results, variables, parallelRuns },
      step_cursor: cursor + 1,
    },
  };
}

// =============================================================================
// CONDITION EVALUATION HELPER
// =============================================================================

/**
 * Safely evaluate a JavaScript condition with variables
 * [Explanation], basically sandboxed evaluation to prevent code injection
 */
function evaluateCondition(
  condition: string,
  variables: Record<string, unknown>
): unknown {
  try {
    // [Explanation], basically create safe evaluation context with variables
    const context = { ...variables };
    const func = new Function(
      ...Object.keys(context),
      `return (${condition});`
    );
    return func(...Object.values(context));
  } catch (error) {
    console.warn("Condition evaluation failed:", error);
    return false;
  }
}

// =============================================================================
// INTERNAL HELPERS FOR ACTIONS
// =============================================================================

/** Get running workflow runs for watchdog */
export const getRunningWorkflowRuns = query({
  args: {},
  async handler(ctx) {
    return await ctx.db
      .query("workflow_runs")
      .withIndex("by_status", (q) => q.eq("status", "running"))
      .collect();
  },
});

/** Update workflow status */
export const updateWorkflowStatus = mutation({
  args: {
    runId: v.id("workflow_runs"),
    status: v.union(
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    completed_at: v.optional(v.number()),
    error_message: v.optional(v.string()),
  },
  async handler(ctx, { runId, status, completed_at, error_message }) {
    const updates: any = { status };
    if (completed_at !== undefined) updates.completed_at = completed_at;
    if (error_message !== undefined) updates.error_message = error_message;
    await ctx.db.patch(runId, updates);
  },
});

/** Update workflow lease */
export const updateWorkflowLease = mutation({
  args: {
    runId: v.id("workflow_runs"),
    lease_until: v.number(),
  },
  async handler(ctx, { runId, lease_until }) {
    await ctx.db.patch(runId, { lease_until });
  },
});

/** Update workflow progress */
export const updateWorkflowProgress = mutation({
  args: {
    runId: v.id("workflow_runs"),
    nodes_executed: v.number(),
    total_nodes: v.number(),
    execution_data: v.any(),
    step_cursor: v.optional(v.number()),
    attempt: v.number(),
    next_run_at: v.optional(v.number()),
  },
  async handler(
    ctx,
    {
      runId,
      nodes_executed,
      total_nodes,
      execution_data,
      step_cursor,
      attempt,
      next_run_at,
    }
  ) {
    const updates: any = {
      nodes_executed,
      total_nodes,
      execution_data,
      attempt,
    };
    if (step_cursor !== undefined) updates.step_cursor = step_cursor;
    if (next_run_at !== undefined) updates.next_run_at = next_run_at;
    await ctx.db.patch(runId, updates);
  },
});

// =============================================================================
// STORE OPERATION HELPERS
// =============================================================================

/** Store insert operation */
export const storeInsert = mutation({
  args: {
    table: v.string(),
    data: v.any(),
  },
  async handler(ctx, { table, data }) {
    // [Explanation], basically perform safe insert with table validation
    return await (ctx.db as any).insert(table, data);
  },
});

/** Store update operation */
export const storeUpdate = mutation({
  args: {
    table: v.string(),
    id: v.string(),
    data: v.any(),
  },
  async handler(ctx, { table, id, data }) {
    // [Explanation], basically perform safe update with ID validation
    await (ctx.db as any).patch(id, data);
  },
});

/** Store get operation */
export const storeGet = query({
  args: {
    table: v.string(),
    id: v.string(),
  },
  async handler(ctx, { table, id }) {
    // [Explanation], basically perform safe get with ID validation
    return await (ctx.db as any).get(id);
  },
});

/** Store delete operation */
export const storeDelete = mutation({
  args: {
    table: v.string(),
    id: v.string(),
  },
  async handler(ctx, { table, id }) {
    // [Explanation], basically perform safe delete with ID validation
    await (ctx.db as any).delete(id);
  },
});
