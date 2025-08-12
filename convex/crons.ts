/**
 * Route: convex/crons.ts
 * CONVEX CRON JOBS - Resend component housekeeping
 *
 * • Periodically delete old finalized emails from the Resend component tables
 * • Cleans up abandoned emails that indicate transient failures
 * • Keeps storage lean while retaining enough history for debugging
 *
 * Keywords: convex, cron, resend, cleanup, maintenance
 */

import { cronJobs } from "convex/server";
import { components, internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

const crons = cronJobs();

// Clean up every hour, basically prune finalized/abandoned emails on a rolling window
crons.interval(
  "Remove old emails from the resend component",
  { hours: 1 },
  internal.crons.cleanupResend
);

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export const cleanupResend = internalMutation({
  args: {},
  async handler(ctx) {
    await ctx.scheduler.runAfter(0, components.resend.lib.cleanupOldEmails, {
      olderThan: ONE_WEEK_MS,
    });
    await ctx.scheduler.runAfter(
      0,
      components.resend.lib.cleanupAbandonedEmails,
      { olderThan: 4 * ONE_WEEK_MS }
    );
  },
});

export default crons;

// ============================================================================
// WORKFLOW WATCHDOG - Resume stuck workflow runs
// ============================================================================

// [Explanation], basically ensure long-running automations keep progressing
crons.interval(
  "Resume stuck workflow runs",
  { minutes: 5 },
  internal.workflows.resumeStuckRuns
);

// Drive due time scheduler tasks periodically as a safety net.
// [Explanation], basically in case a deploy interrupted a scheduled runAfter, we re-check due tasks.
crons.interval(
  "Drive due time schedules",
  { minutes: 2 },
  internal.scheduleTime.fireDueSchedules
);