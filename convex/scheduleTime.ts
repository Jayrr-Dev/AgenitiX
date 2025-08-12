/**
 * Route: convex/scheduleTime.ts
 * TRIGGER TIME SCHEDULER - Durable schedules using Convex scheduler
 *
 * • Stores per-node time schedules in `trigger_time_schedules`
 * • Uses `ctx.scheduler.runAfter` for durable scheduled execution
 * • Supports interval, daily (HH:MM), and once (HH:MM) schedules
 * • Manual trigger supported and reschedules if still enabled
 *
 * Keywords: scheduler, durable, interval, daily, once, convex, runAfter, crons
 */

import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction, internalMutation, mutation, query } from "./_generated/server";

type ScheduleType = "interval" | "daily" | "once";

function parseStartTimeToNext(timestampNow: number, hhmm: string): number | null {
  if (!hhmm) return null;
  const [hhStr, mmStr] = hhmm.split(":");
  const hours = Number(hhStr);
  const minutes = Number(mmStr);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  const d = new Date(timestampNow);
  d.setHours(hours, minutes, 0, 0);
  if (d.getTime() <= timestampNow) {
    // move to next day
    d.setDate(d.getDate() + 1);
  }
  return d.getTime();
}

function computeNextTriggerAt(
  now: number,
  scheduleType: ScheduleType,
  intervalMinutes?: number,
  startTime?: string
): number | null {
  switch (scheduleType) {
    case "interval": {
      const minutes = typeof intervalMinutes === "number" ? intervalMinutes : 5;
      const ms = Math.max(0.1, Math.min(1440, minutes)) * 60 * 1000;
      return now + ms;
    }
    case "daily": {
      return parseStartTimeToNext(now, startTime ?? "");
    }
    case "once": {
      if (!startTime) return null;
      const [hhStr, mmStr] = startTime.split(":");
      const hours = Number(hhStr);
      const minutes = Number(mmStr);
      if (
        Number.isNaN(hours) ||
        Number.isNaN(minutes) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
      ) {
        return null;
      }
      const d = new Date(now);
      d.setHours(hours, minutes, 0, 0);
      // Only schedule if it's still in the future today
      return d.getTime() > now ? d.getTime() : null;
    }
    default:
      return null;
  }
}

export const getScheduleForNode = query({
  args: { nodeId: v.string() },
  async handler(ctx, { nodeId }) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) return null;

    return await ctx.db
      .query("trigger_time_schedules")
      .withIndex("by_node_id", (q) => q.eq("node_id", nodeId))
      .first();
  },
});

export const upsertTimeSchedule = mutation({
  args: {
    nodeId: v.string(),
    flowId: v.optional(v.string()),
    scheduleType: v.union(v.literal("interval"), v.literal("daily"), v.literal("once")),
    intervalMinutes: v.optional(v.number()),
    startTime: v.optional(v.string()),
    isEnabled: v.boolean(),
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) throw new Error("Not authenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) throw new Error("User not found");

    const now = Date.now();
    const next = args.isEnabled
      ? computeNextTriggerAt(now, args.scheduleType, args.intervalMinutes, args.startTime)
      : null;

    const existing = await ctx.db
      .query("trigger_time_schedules")
      .withIndex("by_node_id", (q) => q.eq("node_id", args.nodeId))
      .first();

    let id: Id<"trigger_time_schedules">;
    if (existing) {
      await ctx.db.patch(existing._id, {
        user_id: user._id,
        node_id: args.nodeId,
        flow_id: args.flowId,
        schedule_type: args.scheduleType,
        interval_minutes: args.intervalMinutes,
        start_time: args.startTime,
        is_enabled: args.isEnabled,
        next_trigger_at: next ?? undefined,
        updated_at: now,
      } as any);
      id = existing._id as Id<"trigger_time_schedules">;
    } else {
      id = await ctx.db.insert("trigger_time_schedules", {
        user_id: user._id,
        node_id: args.nodeId,
        flow_id: args.flowId,
        schedule_type: args.scheduleType,
        interval_minutes: args.intervalMinutes,
        start_time: args.startTime,
        is_enabled: args.isEnabled,
        last_triggered: undefined,
        next_trigger_at: next ?? undefined,
        created_at: now,
        updated_at: now,
      } as any);
    }

    // Schedule the next run durably if enabled and we computed a trigger time
    if (args.isEnabled && next && next > now) {
      const delay = Math.max(0, next - now);
      await ctx.scheduler.runAfter(delay, internal.scheduleTime.fireSchedule, {
        scheduleId: id,
      });
    }

    return await ctx.db.get(id);
  },
});

export const manualTrigger = mutation({
  args: { scheduleId: v.id("trigger_time_schedules") },
  async handler(ctx, { scheduleId }) {
    const schedule = await ctx.db.get(scheduleId);
    if (!schedule) throw new Error("Schedule not found");
    if (!schedule.is_enabled) throw new Error("Schedule is disabled");

    const now = Date.now();
    await ctx.db.patch(scheduleId, {
      last_triggered: now,
      updated_at: now,
    } as any);

    // Compute and schedule next if applicable (interval/daily)
    let next: number | null = null;
    if (schedule.schedule_type === "interval") {
      next = computeNextTriggerAt(now, "interval", schedule.interval_minutes ?? undefined);
    } else if (schedule.schedule_type === "daily") {
      next = computeNextTriggerAt(now, "daily", undefined, schedule.start_time ?? undefined);
    } else {
      // once: disable after manual trigger
      await ctx.db.patch(scheduleId, { is_enabled: false } as any);
    }

    if (next) {
      await ctx.db.patch(scheduleId, { next_trigger_at: next } as any);
      await ctx.scheduler.runAfter(Math.max(0, next - now), internal.scheduleTime.fireSchedule, {
        scheduleId,
      });
    }

    return { success: true, triggeredAt: now };
  },
});

export const fireSchedule = internalAction({
  args: { scheduleId: v.id("trigger_time_schedules") },
  async handler(ctx, { scheduleId }) {
    const schedule = await ctx.runQuery(api.scheduleTime.getById, { scheduleId });
    if (!schedule) return;
    if (!schedule.is_enabled) return;

    const now = Date.now();

    // Mark trigger
    await ctx.runMutation(api.scheduleTime._markTriggered, {
      scheduleId,
      timestamp: now,
    });

    // Compute next
    let next: number | null = null;
    if (schedule.schedule_type === "interval") {
      next = computeNextTriggerAt(now, "interval", schedule.interval_minutes ?? undefined);
    } else if (schedule.schedule_type === "daily") {
      next = computeNextTriggerAt(now, "daily", undefined, schedule.start_time ?? undefined);
    } else if (schedule.schedule_type === "once") {
      // one-shot: disable
      await ctx.runMutation(api.scheduleTime._setEnabled, { scheduleId, isEnabled: false });
      return;
    }

    if (next) {
      await ctx.runMutation(api.scheduleTime._setNext, { scheduleId, next });
      await ctx.scheduler.runAfter(Math.max(0, next - now), internal.scheduleTime.fireSchedule, {
        scheduleId,
      });
    }
  },
});

/** Scan for due schedules and fire them (cron watchdog) */
export const fireDueSchedules = internalMutation({
  args: {},
  async handler(ctx) {
    const now = Date.now();
    const due = await ctx.db
      .query("trigger_time_schedules")
      .withIndex("by_next_trigger_at", (q) => q.lte("next_trigger_at", now))
      .collect();
    for (const s of due) {
      if (!s.is_enabled) continue;
      await ctx.scheduler.runAfter(0, internal.scheduleTime.fireSchedule, {
        scheduleId: s._id as Id<"trigger_time_schedules">,
      });
    }
  },
});

// Internal helpers
export const _markTriggered = mutation({
  args: { scheduleId: v.id("trigger_time_schedules"), timestamp: v.number() },
  async handler(ctx, { scheduleId, timestamp }) {
    await ctx.db.patch(scheduleId, { last_triggered: timestamp, updated_at: timestamp } as any);
  },
});

export const _setNext = mutation({
  args: { scheduleId: v.id("trigger_time_schedules"), next: v.number() },
  async handler(ctx, { scheduleId, next }) {
    await ctx.db.patch(scheduleId, { next_trigger_at: next, updated_at: Date.now() } as any);
  },
});

export const _setEnabled = mutation({
  args: { scheduleId: v.id("trigger_time_schedules"), isEnabled: v.boolean() },
  async handler(ctx, { scheduleId, isEnabled }) {
    await ctx.db.patch(scheduleId, { is_enabled: isEnabled, updated_at: Date.now() } as any);
  },
});

export const getById = query({
  args: { scheduleId: v.id("trigger_time_schedules") },
  async handler(ctx, { scheduleId }) {
    return await ctx.db.get(scheduleId);
  },
});


