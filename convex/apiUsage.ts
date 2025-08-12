/**
 * Route: convex/apiUsage.ts
 * EMAIL API USAGE TRACKING – Per-user Gmail API quota tracking and provider limits
 *
 * • Stores method-level quota units and provider-level rate caps in `email_api_limits`
 * • Tracks per-user, per-method, per-day usage in `email_api_usages`
 * • Enforces minute-level and daily caps before recording usage
 * • Future-proof: limits can be updated without code changes; unknown methods can be added at runtime
 *
 * Keywords: gmail-quota, api-usage, rate-limits, per-user-tracking, convex
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ------------------------------
// Top-level constants
// ------------------------------

/** Gmail method -> quota units mapping (authoritative list provided by product requirements). */
const GMAIL_METHOD_UNITS: Readonly<Record<string, number>> = Object.freeze({
  "drafts.create": 10,
  "drafts.delete": 10,
  "drafts.get": 5,
  "drafts.list": 5,
  "drafts.send": 100,
  "drafts.update": 15,
  getProfile: 1,
  "history.list": 2,
  "labels.create": 5,
  "labels.delete": 5,
  "labels.get": 1,
  "labels.list": 1,
  "labels.update": 5,
  "messages.attachments.get": 5,
  "messages.batchDelete": 50,
  "messages.batchModify": 50,
  "messages.delete": 10,
  "messages.get": 5,
  "messages.import": 25,
  "messages.insert": 25,
  "messages.list": 5,
  "messages.modify": 5,
  "messages.send": 100,
  "messages.trash": 5,
  "messages.untrash": 5,
  "settings.delegates.create": 100,
  "settings.delegates.delete": 5,
  "settings.delegates.get": 1,
  "settings.delegates.list": 1,
  "settings.filters.create": 5,
  "settings.filters.delete": 5,
  "settings.filters.get": 1,
  "settings.filters.list": 1,
  "settings.forwardingAddresses.create": 100,
  "settings.forwardingAddresses.delete": 5,
  "settings.forwardingAddresses.get": 1,
  "settings.forwardingAddresses.list": 1,
  "settings.getAutoForwarding": 1,
  "settings.getImap": 1,
  "settings.getPop": 1,
  "settings.getVacation": 1,
  "settings.sendAs.create": 100,
  "settings.sendAs.delete": 5,
  "settings.sendAs.get": 1,
  "settings.sendAs.list": 1,
  "settings.sendAs.update": 100,
  "settings.sendAs.verify": 100,
  "settings.updateAutoForwarding": 5,
  "settings.updateImap": 5,
  "settings.updatePop": 100,
  "settings.updateVacation": 5,
  stop: 50,
  "threads.delete": 20,
  "threads.get": 10,
  "threads.list": 10,
  "threads.modify": 10,
  "threads.trash": 10,
  "threads.untrash": 10,
  watch: 100,
});

/**
 * Provider-level default caps (units). Keep conservative defaults and allow overrides in DB.
 * [Explanation], basically baseline limits sourced from Gmail API docs; adjust as needed per project.
 */
const DEFAULT_GMAIL_PROVIDER_LIMITS = Object.freeze({
  provider: "gmail",
  // Use per-minute caps; per-project cap can be tuned in the DB if different for your quota tier
  per_user_per_minute_units: 15000, // [Explanation], basically cap per user per minute
  per_project_per_minute_units: 1200000, // [Explanation], basically project-wide cap per minute
  // Daily cap in units is not officially specified; keep undefined to allow operator override
  daily_quota_max_units: undefined as number | undefined,
  // Optional additional cap for 100-second windows
  per_user_per_100_seconds_units: undefined as number | undefined,
});

// ------------------------------
// Utilities
// ------------------------------

function getDateKey(epochMs: number): string {
  const d = new Date(epochMs);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getMinuteWindowStart(epochMs: number): number {
  return Math.floor(epochMs / 60000) * 60000;
}

async function getOrCreateProviderLimits(
  ctx: any,
  provider: string
): Promise<{
  daily_quota_max_units?: number;
  per_user_per_minute_units?: number;
  per_project_per_minute_units?: number;
  per_user_per_100_seconds_units?: number;
}> {
  const limits = await ctx.db
    .query("email_api_limits")
    .withIndex("by_provider_and_kind", (q: any) =>
      q.eq("provider", provider).eq("kind", "provider")
    )
    .first();

  if (limits) {
    return {
      daily_quota_max_units: limits.daily_quota_max_units ?? undefined,
      per_user_per_minute_units: limits.per_user_per_minute_units ?? undefined,
      per_project_per_minute_units: limits.per_project_per_minute_units ?? undefined,
      per_user_per_100_seconds_units:
        limits.per_user_per_100_seconds_units ?? undefined,
    };
  }

  // Seed provider record on-demand if missing
  const now = Date.now();
  await ctx.db.insert("email_api_limits", {
    kind: "provider",
    provider,
    method: undefined,
    quota_unit: undefined,
    daily_quota_max_units: DEFAULT_GMAIL_PROVIDER_LIMITS.daily_quota_max_units,
    per_user_per_minute_units:
      DEFAULT_GMAIL_PROVIDER_LIMITS.per_user_per_minute_units,
    per_project_per_minute_units:
      DEFAULT_GMAIL_PROVIDER_LIMITS.per_project_per_minute_units,
    per_user_per_100_seconds_units:
      DEFAULT_GMAIL_PROVIDER_LIMITS.per_user_per_100_seconds_units,
    is_active: true,
    created_at: now,
    updated_at: now,
  });

  return {
    daily_quota_max_units: DEFAULT_GMAIL_PROVIDER_LIMITS.daily_quota_max_units,
    per_user_per_minute_units:
      DEFAULT_GMAIL_PROVIDER_LIMITS.per_user_per_minute_units,
    per_project_per_minute_units:
      DEFAULT_GMAIL_PROVIDER_LIMITS.per_project_per_minute_units,
    per_user_per_100_seconds_units:
      DEFAULT_GMAIL_PROVIDER_LIMITS.per_user_per_100_seconds_units,
  };
}

async function getMethodUnits(
  ctx: any,
  provider: string,
  method: string
): Promise<number | undefined> {
  const existing = await ctx.db
    .query("email_api_limits")
    .withIndex("by_provider_and_method", (q: any) =>
      q.eq("provider", provider).eq("method", method)
    )
    .first();
  if (existing?.quota_unit != null) return existing.quota_unit as number;
  if (provider === "gmail") return GMAIL_METHOD_UNITS[method];
  return undefined;
}

// ------------------------------
// Mutations
// ------------------------------

/**
 * Seed or update Gmail provider/method limits.
 */
export const seedEmailGmailLimits = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Upsert provider-level caps
    const provider = DEFAULT_GMAIL_PROVIDER_LIMITS.provider;
    const current = await ctx.db
      .query("email_api_limits")
      .withIndex("by_provider_and_kind", (q: any) =>
        q.eq("provider", provider).eq("kind", "provider")
      )
      .first();

    if (current) {
      await ctx.db.patch(current._id, {
        daily_quota_max_units: DEFAULT_GMAIL_PROVIDER_LIMITS.daily_quota_max_units,
        per_user_per_minute_units:
          DEFAULT_GMAIL_PROVIDER_LIMITS.per_user_per_minute_units,
        per_project_per_minute_units:
          DEFAULT_GMAIL_PROVIDER_LIMITS.per_project_per_minute_units,
        per_user_per_100_seconds_units:
          DEFAULT_GMAIL_PROVIDER_LIMITS.per_user_per_100_seconds_units,
        is_active: true,
        updated_at: now,
      });
    } else {
      await ctx.db.insert("email_api_limits", {
        kind: "provider",
        provider,
        method: undefined,
        quota_unit: undefined,
        daily_quota_max_units: DEFAULT_GMAIL_PROVIDER_LIMITS.daily_quota_max_units,
        per_user_per_minute_units:
          DEFAULT_GMAIL_PROVIDER_LIMITS.per_user_per_minute_units,
        per_project_per_minute_units:
          DEFAULT_GMAIL_PROVIDER_LIMITS.per_project_per_minute_units,
        per_user_per_100_seconds_units:
          DEFAULT_GMAIL_PROVIDER_LIMITS.per_user_per_100_seconds_units,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }

    // Upsert each method mapping
    for (const [method, units] of Object.entries(GMAIL_METHOD_UNITS)) {
      const existing = await ctx.db
        .query("email_api_limits")
        .withIndex("by_provider_and_method", (q: any) =>
          q.eq("provider", provider).eq("method", method)
        )
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, {
          quota_unit: units,
          is_active: true,
          updated_at: now,
        });
      } else {
        await ctx.db.insert("email_api_limits", {
          kind: "method",
          provider,
          method,
          quota_unit: units,
          daily_quota_max_units: undefined,
          per_user_per_minute_units: undefined,
          per_project_per_minute_units: undefined,
          per_user_per_100_seconds_units: undefined,
          is_active: true,
          created_at: now,
          updated_at: now,
        });
      }
    }

    return { success: true, methods: Object.keys(GMAIL_METHOD_UNITS).length };
  },
});

/**
 * Increment usage for a Gmail API method with optional enforcement of provider caps.
 */
export const incrementEmailApiUsage = mutation({
  args: {
    provider: v.literal("gmail"),
    method: v.string(),
    // Provide either user_id or user_email to resolve the user
    user_id: v.optional(v.id("users")),
    user_email: v.optional(v.string()),
    // Optional override if method not known yet
    units_override: v.optional(v.number()),
    // Enforce and throw on violation
    enforce: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const dateKey = getDateKey(now);
    const minuteStart = getMinuteWindowStart(now);

    // Resolve user
    let userId = args.user_id;
    if (!userId && args.user_email) {
      const user = await ctx.db
        .query("users")
        .withIndex("email", (q: any) => q.eq("email", args.user_email))
        .first();
      if (!user) throw new Error("User not found for provided email");
      userId = user._id;
    }
    if (!userId) throw new Error("user_id or user_email is required");

    // Determine method units
    const methodUnits =
      (await getMethodUnits(ctx, args.provider, args.method)) ??
      args.units_override;
    if (!methodUnits) {
      throw new Error("Unknown method units. Provide units_override to proceed.");
    }

    const limits = await getOrCreateProviderLimits(ctx, args.provider);
    const enforce = args.enforce ?? true;

    // Get (or create) per-user daily usage row for this method
    let usage = await ctx.db
      .query("email_api_usages")
      .withIndex("by_user_date_provider_method", (q: any) =>
        q
          .eq("user_id", userId!)
          .eq("date_key", dateKey)
          .eq("provider", args.provider)
          .eq("method", args.method)
      )
      .first();

    if (!usage) {
      const newId = await ctx.db.insert("email_api_usages", {
        user_id: userId!,
        provider: args.provider,
        method: args.method,
        date_key: dateKey,
        unit_count: 0,
        request_count: 0,
        last_request_at: 0,
        minute_window_start: minuteStart,
        minute_unit_count: 0,
        created_at: now,
        updated_at: now,
      });
      usage = await ctx.db.get(newId);
      if (!usage) throw new Error("Failed to initialize usage row");
    }

    // Reset minute window if crossed
    let minuteUnitsUsed = usage.minute_unit_count ?? 0;
    let minuteWindowStart = usage.minute_window_start ?? minuteStart;
    if (minuteWindowStart !== minuteStart) {
      minuteWindowStart = minuteStart;
      minuteUnitsUsed = 0;
    }

    // Compute projected minute total for this user across all methods
    const todaysRowsForUser = await ctx.db
      .query("email_api_usages")
      .withIndex("by_user_and_date", (q: any) =>
        q.eq("user_id", userId!).eq("date_key", dateKey)
      )
      .collect();

    const userMinuteTotal = todaysRowsForUser.reduce((sum: number, row: any) => {
      const sameWindow = (row.minute_window_start ?? 0) === minuteStart;
      return sum + (sameWindow ? row.minute_unit_count ?? 0 : 0);
    }, 0);

    // Compute projected provider-wide minute total across users
    const providerRowsToday = await ctx.db
      .query("email_api_usages")
      .withIndex("by_provider_and_date", (q: any) =>
        q.eq("provider", args.provider).eq("date_key", dateKey)
      )
      .collect();
    const providerMinuteTotal = providerRowsToday.reduce(
      (sum: number, row: any) => sum + ((row.minute_window_start ?? 0) === minuteStart ? row.minute_unit_count ?? 0 : 0),
      0
    );

    // Compute projected daily total for this user (all methods)
    const userDailyTotal = todaysRowsForUser.reduce(
      (sum: number, row: any) => sum + (row.unit_count ?? 0),
      0
    );

    // Enforce limits if configured
    if (enforce) {
      if (
        limits.per_user_per_minute_units != null &&
        userMinuteTotal + methodUnits > limits.per_user_per_minute_units
      ) {
        throw new Error(
          "Per-user per-minute Gmail API limit would be exceeded by this request"
        );
      }
      if (
        limits.per_project_per_minute_units != null &&
        providerMinuteTotal + methodUnits > limits.per_project_per_minute_units
      ) {
        throw new Error(
          "Per-project per-minute Gmail API limit would be exceeded by this request"
        );
      }
      if (
        limits.daily_quota_max_units != null &&
        userDailyTotal + methodUnits > limits.daily_quota_max_units
      ) {
        throw new Error(
          "Per-user daily Gmail API unit limit would be exceeded by this request"
        );
      }
    }

    // Apply increments
    await ctx.db.patch(usage._id, {
      unit_count: (usage.unit_count ?? 0) + methodUnits,
      request_count: (usage.request_count ?? 0) + 1,
      last_request_at: now,
      minute_window_start: minuteWindowStart,
      minute_unit_count: minuteUnitsUsed + methodUnits,
      updated_at: now,
    });

    return {
      success: true,
      provider: args.provider,
      method: args.method,
      unitsApplied: methodUnits,
      minuteWindowStart,
      dateKey,
    };
  },
});

// ------------------------------
// Queries
// ------------------------------

/**
 * Get a concise usage summary for a user for today (units + requests), including current limits.
 */
export const getEmailApiUsageSummary = query({
  args: {
    provider: v.literal("gmail"),
    user_id: v.optional(v.id("users")),
    user_email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Resolve user
    let userId = args.user_id;
    if (!userId && args.user_email) {
      const user = await ctx.db
        .query("users")
        .withIndex("email", (q: any) => q.eq("email", args.user_email))
        .first();
      if (!user) return null;
      userId = user._id;
    }
    if (!userId) return null;

    const now = Date.now();
    const dateKey = getDateKey(now);
    const minuteStart = getMinuteWindowStart(now);

    const limits = await getOrCreateProviderLimits(ctx, args.provider);

    const rows = await ctx.db
      .query("email_api_usages")
      .withIndex("by_user_and_date", (q: any) =>
        q.eq("user_id", userId!).eq("date_key", dateKey)
      )
      .collect();

    const byMethod: Record<string, { units: number; requests: number }> = {};
    let minuteUnits = 0;
    let totalUnits = 0;
    let totalRequests = 0;
    for (const r of rows) {
      if (r.provider !== args.provider) continue;
      totalUnits += r.unit_count ?? 0;
      totalRequests += r.request_count ?? 0;
      if ((r.minute_window_start ?? 0) === minuteStart) {
        minuteUnits += r.minute_unit_count ?? 0;
      }
      const entry = byMethod[r.method] || { units: 0, requests: 0 };
      entry.units += r.unit_count ?? 0;
      entry.requests += r.request_count ?? 0;
      byMethod[r.method] = entry;
    }

    return {
      dateKey,
      minuteStart,
      totals: { units: totalUnits, requests: totalRequests, minuteUnits },
      byMethod,
      limits,
    };
  },
});


