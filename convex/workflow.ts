/**
 * Route: convex/workflow.ts
 * WORKFLOW MANAGER - Durable workflows via Convex component
 *
 * • Central manager to define/start/cancel/observe workflows
 * • Survives restarts; supports retries, delays, and parallelism
 * • Server-only file; do not import in client
 *
 * Keywords: convex-workflow, durable, retries, scheduling
 */

import { WorkflowManager } from "@convex-dev/workflow";
import { components } from "./_generated/api";

export const workflow = new WorkflowManager(components.workflow);


