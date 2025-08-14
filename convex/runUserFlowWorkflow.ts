/**
 * Route: convex/runUserFlowWorkflow.ts
 * RUN USER FLOW WORKFLOW - Executes a React Flow graph via Convex Workflow
 *
 * • Compiles a React Flow graph to a deterministic plan
 * • Runs nodes as Convex actions with delays/retries/parallelism
 * • Integrates with existing email/AI/server actions
 *
 * Keywords: reactflow, convex-workflow, durable, retries, scheduling
 */

import { v } from "convex/values";
import { internal, components } from "./_generated/api";
import { internalAction, mutation } from "./_generated/server";
import { workflow as WORKFLOW } from "./workflow";

// --------------------------------------------------------------------------------
// Types (keep minimal and permissive to avoid import churn across node domains)
// --------------------------------------------------------------------------------

type NodeKind = string; // e.g., "emailSend", "aiSummarize", etc.
type GraphNode = { id: string; kind: NodeKind; config: Record<string, unknown> };
type GraphEdge = { from: string; to: string };
type PlanStep = { kind: NodeKind; config: Record<string, unknown>; runAfterMs?: number };
type ParallelBlock = { parallel: PlanStep[] };
type Plan = Array<PlanStep | ParallelBlock>;

// --------------------------------------------------------------------------------
// Example actions for common node kinds
// These use existing logic where possible (e.g., email through resend)
// --------------------------------------------------------------------------------

export const node_emailSend = internalAction({
  args: { to: v.string(), subject: v.string(), body: v.string() },
  handler: async (ctx, { to, subject, body }): Promise<void> => {
    // Use resend component directly to avoid extra indirection
    const html = `<p>${body}</p>`;
    await ctx.runMutation(components.resend.lib.sendEmail, {
      from: "noreply@agenitix.com",
      to,
      subject,
      html,
      options: {
        apiKey: process.env.RESEND_API_KEY || "",
        initialBackoffMs: 1000,
        retryAttempts: 3,
        testMode: false,
      },
    });
  },
});

export const node_wait = internalAction({
  args: { ms: v.number() },
  handler: async (_ctx, { ms }): Promise<void> => {
    // Cooperative delay handled by schedule; keep body simple
    await new Promise((r) => setTimeout(r, Math.max(0, ms)));
  },
});

// --------------------------------------------------------------------------------
// Compile React Flow -> deterministic plan (simple topo pass)
// --------------------------------------------------------------------------------

function compileGraphToPlan(nodes: GraphNode[], edges: GraphEdge[]): Plan {
  const byId = new Map(nodes.map((n) => [n.id, n] as const));
  const incoming = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const n of nodes) {
    incoming.set(n.id, 0);
    adj.set(n.id, []);
  }
  for (const e of edges) {
    if (!byId.has(e.from) || !byId.has(e.to)) continue;
    incoming.set(e.to, (incoming.get(e.to) || 0) + 1);
    const fromAdj = adj.get(e.from);
    if (fromAdj) {
      fromAdj.push(e.to);
    }
  }
  // Kahn's algorithm with parallel layers
  const plan: Plan = [];
  let layer = nodes.filter((n) => (incoming.get(n.id) || 0) === 0).map((n) => n.id);
  const visited = new Set<string>();
  while (layer.length) {
    const nextLayer: string[] = [];
    const steps: PlanStep[] = [];
    for (const id of layer) {
      if (visited.has(id)) continue;
      visited.add(id);
      const node = byId.get(id);
      if (!node) continue;
      steps.push({ kind: node.kind, config: node.config });
      const idAdj = adj.get(id);
      if (idAdj) {
        for (const to of idAdj) {
          const inc = (incoming.get(to) || 0) - 1;
          incoming.set(to, inc);
          if (inc === 0) nextLayer.push(to);
        }
      }
    }
    if (steps.length === 1) plan.push(steps[0]);
    else if (steps.length > 1) plan.push({ parallel: steps });
    layer = nextLayer;
  }
  return plan;
}

// --------------------------------------------------------------------------------
// Workflow definition: executes compiled plan
// --------------------------------------------------------------------------------

export const runUserFlowWorkflow = WORKFLOW.define({
  args: { plan: v.any() },
  handler: async (step, { plan }): Promise<void> => {
    const compiled = plan as Plan;
    for (const item of compiled) {
      if ((item as ParallelBlock).parallel) {
        const block = item as ParallelBlock;
        await Promise.all(block.parallel.map((s) => runStep(step, s)));
      } else {
        await runStep(step, item as PlanStep);
      }
    }
  },
});

async function runStep(step: any, s: PlanStep): Promise<unknown> {
  const opts = s.runAfterMs ? { runAfter: s.runAfterMs } : undefined;
  switch (s.kind) {
    case "emailSend": {
      const to = String(s.config.to || "");
      const subject = String(s.config.subject || "");
      const body = String(s.config.body || "");
      if (!to) return;
      return step.runAction(internal.runUserFlowWorkflow.node_emailSend, { to, subject, body }, { retry: true, ...opts });
    }
    case "wait": {
      const ms = Number(s.config.ms || 0);
      if (ms > 0) return step.runAction(internal.runUserFlowWorkflow.node_wait, { ms }, opts);
      return;
    }
    default: {
      // Unknown kind: no-op to avoid crashes; you can extend with your node kinds
      return;
    }
  }
}

// --------------------------------------------------------------------------------
// Public mutations to start/cancel/check status
// --------------------------------------------------------------------------------

export const startUserFlow = mutation({
  args: { nodes: v.any(), edges: v.any() },
  handler: async (ctx, { nodes, edges }): Promise<void> => {
    const plan = compileGraphToPlan(nodes, edges);
    // Note: This would need to be implemented as a proper workflow
    // For now, we'll just compile the plan
    console.log("Compiled plan:", plan);
  },
});

export const cancelUserFlow = mutation({
  args: { id: v.any() },
  handler: async (ctx, { id }) => WORKFLOW.cancel(ctx, id),
});

export const getUserFlowStatus = mutation({
  args: { id: v.any() },
  handler: async (ctx, { id }) => WORKFLOW.status(ctx, id),
});


