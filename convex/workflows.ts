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

type Step = AiStep | DelayStep | EmailStep;

type ExecutionData = {
  steps?: Step[];
  results?: unknown[];
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
    const run = await ctx.runQuery(internal.workflows.getWorkflowRunInternal, {
      runId,
    });
    if (!run) return;
    if (run.status !== "running") return;

    // Respect cancellation
    if (run.cancelled) {
      await ctx.runMutation(internal.workflows.updateWorkflowRunInternal, {
        runId,
        updates: { status: "cancelled", completed_at: now },
      });
      return;
    }

    // Renew lease (soft lock)
    await ctx.runMutation(internal.workflows.updateWorkflowRunInternal, {
      runId,
      updates: { lease_until: now + LEASE_MS },
    });

    // Perform a single step
    const { done, updated } = await performStep(ctx, run);

    await ctx.runMutation(internal.workflows.updateWorkflowRunInternal, {
      runId,
      updates: {
        nodes_executed: updated.nodes_executed,
        total_nodes: updated.total_nodes,
        execution_data: updated.execution_data,
        step_cursor: updated.step_cursor,
        attempt: 0,
      },
    });

    if (done) {
      await ctx.runMutation(internal.workflows.updateWorkflowRunInternal, {
        runId,
        updates: {
          status: "completed",
          completed_at: Date.now(),
        },
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
      const run = await ctx.runQuery(
        internal.workflows.getWorkflowRunInternal,
        { runId }
      );
      if (!run) return;
      const nextAttempt = attempt + 1;
      if (nextAttempt >= MAX_ATTEMPTS) {
        await ctx.runMutation(internal.workflows.updateWorkflowRunInternal, {
          runId,
          updates: {
            status: "failed",
            error_message: String(error),
            completed_at: Date.now(),
          },
        });
        return;
      }
      const delay = computeBackoffMs(nextAttempt - 1);
      await ctx.runMutation(internal.workflows.updateWorkflowRunInternal, {
        runId,
        updates: {
          attempt: nextAttempt,
          next_run_at: Date.now() + delay,
        },
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
      internal.workflows.getRunningWorkflowRuns,
      {}
    );

    for (const run of running) {
      if (run.cancelled) continue;
      const leaseExpired = !run.lease_until || run.lease_until < now;
      if (leaseExpired) {
        const attempt = typeof run.attempt === "number" ? run.attempt : 0;
        const delay = computeBackoffMs(attempt);
        await ctx.runMutation(internal.workflows.updateWorkflowRunInternal, {
          runId: run._id,
          updates: {
            attempt: attempt + 1,
            next_run_at: now + delay,
            lease_until: now + LEASE_MS,
          },
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
  _ctx: Parameters<typeof executeNextStep.handler>[0],
  run: {
    nodes_executed: number;
    total_nodes: number;
    execution_data: unknown;
    step_cursor?: number | null;
  }
): Promise<StepResult> {
  // [Explanation], basically safely parse execution data
  const exec = (run.execution_data as {
    steps?: Array<
      | { type: "ai"; prompt: string; threadId?: string; agentConfig?: any }
      | { type: "delay"; ms: number }
    >;
    results?: unknown[];
  }) || { steps: [], results: [] };

  const cursor = (run.step_cursor ?? 0) as number;
  const steps = exec.steps ?? [];
  const results = Array.isArray(exec.results) ? exec.results : [];

  if (cursor >= steps.length) {
    return {
      done: true,
      updated: {
        nodes_executed: run.nodes_executed,
        total_nodes: steps.length,
        execution_data: { steps, results },
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
        execution_data: { steps, results },
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
        execution_data: { steps, results: newResults },
        step_cursor: cursor + 1,
      },
    };
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
        execution_data: { steps, results: newResults },
        step_cursor: cursor + 1,
      },
    };
  }

  // Fallback: skip unknown step
  return {
    done: false,
    updated: {
      nodes_executed: run.nodes_executed + 1,
      total_nodes: steps.length,
      execution_data: { steps, results },
      step_cursor: cursor + 1,
    },
  };
}

// =============================================================================
// INTERNAL HELPERS FOR ACTIONS
// =============================================================================

/** Internal query to get workflow run (for actions) */
export const getWorkflowRunInternal = query({
  args: { runId: v.id("workflow_runs") },
  async handler(ctx, { runId }) {
    return await ctx.db.get(runId);
  },
});

/** Internal query to get running workflow runs (for actions) */
export const getRunningWorkflowRuns = query({
  args: {},
  async handler(ctx) {
    return await ctx.db
      .query("workflow_runs")
      .withIndex("by_status", (q) => q.eq("status", "running"))
      .collect();
  },
});

/** Internal mutation to update workflow run (for actions) */
export const updateWorkflowRunInternal = mutation({
  args: {
    runId: v.id("workflow_runs"),
    updates: v.object({
      status: v.optional(
        v.union(
          v.literal("running"),
          v.literal("completed"),
          v.literal("failed"),
          v.literal("cancelled")
        )
      ),
      completed_at: v.optional(v.number()),
      lease_until: v.optional(v.number()),
      nodes_executed: v.optional(v.number()),
      total_nodes: v.optional(v.number()),
      execution_data: v.optional(v.any()),
      step_cursor: v.optional(v.number()),
      attempt: v.optional(v.number()),
      next_run_at: v.optional(v.number()),
      error_message: v.optional(v.string()),
    }),
  },
  async handler(ctx, { runId, updates }) {
    await ctx.db.patch(runId, updates);
  },
});
