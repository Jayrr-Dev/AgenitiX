/**
 * Route: convex/aiUsage.ts
 * AI API USAGE TRACKING – Per-user LLM token tracking and provider/model limits
 *
 * • Stores provider/model-level token caps in `ai_api_limits`
 * • Tracks per-user, per-model, per-day token usage in `ai_api_usages`
 * • Enforces per-minute and daily caps before recording usage
 * • Designed to work with Convex Agents SDK threads/messages usage fields
 *
 * Keywords: ai-usage, token-tracking, rate-limits, convex-agents, per-user
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ------------------------------
// Defaults
// ------------------------------

type ProviderId = "openai" | "anthropic" | "google" | "custom";

const DEFAULT_PROVIDER_LIMITS: Readonly<
  Record<ProviderId, Partial<{
    tokens_per_user_per_minute: number;
    tokens_per_project_per_minute: number;
    tokens_per_user_per_day: number;
  }>>
> = Object.freeze({
  openai: {
    // Leave undefined by default to allow operator overrides in DB
  },
  anthropic: {},
  google: {},
  custom: {},
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

async function getEffectiveLimits(
  ctx: any,
  provider: string,
  model?: string
): Promise<{
  tokens_per_user_per_minute?: number;
  tokens_per_project_per_minute?: number;
  tokens_per_user_per_day?: number;
  request_max_tokens?: number;
}> {
  // Prefer model-level record if present
  if (model) {
    const modelLimits = await ctx.db
      .query("ai_api_limits")
      .withIndex("by_provider_and_model", (q: any) =>
        q.eq("provider", provider).eq("model", model)
      )
      .first();
    if (modelLimits) {
      return {
        tokens_per_user_per_minute: modelLimits.tokens_per_user_per_minute ?? undefined,
        tokens_per_project_per_minute: modelLimits.tokens_per_project_per_minute ?? undefined,
        tokens_per_user_per_day: modelLimits.tokens_per_user_per_day ?? undefined,
        request_max_tokens: modelLimits.request_max_tokens ?? undefined,
      };
    }
  }

  // Fallback to provider-level record
  const providerLimits = await ctx.db
    .query("ai_api_limits")
    .withIndex("by_provider_and_kind", (q: any) =>
      q.eq("provider", provider).eq("kind", "provider")
    )
    .first();
  if (providerLimits) {
    return {
      tokens_per_user_per_minute: providerLimits.tokens_per_user_per_minute ?? undefined,
      tokens_per_project_per_minute: providerLimits.tokens_per_project_per_minute ?? undefined,
      tokens_per_user_per_day: providerLimits.tokens_per_user_per_day ?? undefined,
      request_max_tokens: providerLimits.request_max_tokens ?? undefined,
    };
  }

  // Use defaults if present
  const defaults = DEFAULT_PROVIDER_LIMITS[(provider as ProviderId) || "custom"] || {};
  return {
    tokens_per_user_per_minute: defaults.tokens_per_user_per_minute,
    tokens_per_project_per_minute: defaults.tokens_per_project_per_minute,
    tokens_per_user_per_day: defaults.tokens_per_user_per_day,
    request_max_tokens: undefined,
  };
}

// ------------------------------
// Mutations
// ------------------------------

/**
 * Seed or update provider/model token caps.
 */
export const seedAiLimits = mutation({
  args: {
    provider: v.union(v.literal("openai"), v.literal("anthropic"), v.literal("google"), v.literal("custom")),
    // Optional model caps
    models: v.optional(
      v.array(
        v.object({
          model: v.string(),
          request_max_tokens: v.optional(v.number()),
          tokens_per_user_per_minute: v.optional(v.number()),
          tokens_per_project_per_minute: v.optional(v.number()),
          tokens_per_user_per_day: v.optional(v.number()),
        })
      )
    ),
    provider_caps: v.optional(
      v.object({
        tokens_per_user_per_minute: v.optional(v.number()),
        tokens_per_project_per_minute: v.optional(v.number()),
        tokens_per_user_per_day: v.optional(v.number()),
        request_max_tokens: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Upsert provider-level
    const existingProvider = await ctx.db
      .query("ai_api_limits")
      .withIndex("by_provider_and_kind", (q: any) =>
        q.eq("provider", args.provider).eq("kind", "provider")
      )
      .first();

    const defaults = DEFAULT_PROVIDER_LIMITS[args.provider] || {};
    const providerCaps = args.provider_caps || {};
    if (existingProvider) {
      await ctx.db.patch(existingProvider._id, {
        tokens_per_user_per_minute: providerCaps.tokens_per_user_per_minute ?? defaults.tokens_per_user_per_minute,
        tokens_per_project_per_minute: providerCaps.tokens_per_project_per_minute ?? defaults.tokens_per_project_per_minute,
        tokens_per_user_per_day: providerCaps.tokens_per_user_per_day ?? defaults.tokens_per_user_per_day,
        request_max_tokens: providerCaps.request_max_tokens ?? existingProvider.request_max_tokens,
        is_active: true,
        updated_at: now,
      });
    } else {
      await ctx.db.insert("ai_api_limits", {
        kind: "provider",
        provider: args.provider,
        model: undefined,
        tokens_per_user_per_minute: providerCaps.tokens_per_user_per_minute ?? defaults.tokens_per_user_per_minute,
        tokens_per_project_per_minute: providerCaps.tokens_per_project_per_minute ?? defaults.tokens_per_project_per_minute,
        tokens_per_user_per_day: providerCaps.tokens_per_user_per_day ?? defaults.tokens_per_user_per_day,
        request_max_tokens: providerCaps.request_max_tokens,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }

    // Upsert model-level
    if (args.models && args.models.length > 0) {
      for (const m of args.models) {
        const existingModel = await ctx.db
          .query("ai_api_limits")
          .withIndex("by_provider_and_model", (q: any) =>
            q.eq("provider", args.provider).eq("model", m.model)
          )
          .first();
        if (existingModel) {
          await ctx.db.patch(existingModel._id, {
            request_max_tokens: m.request_max_tokens ?? existingModel.request_max_tokens,
            tokens_per_user_per_minute: m.tokens_per_user_per_minute ?? existingModel.tokens_per_user_per_minute,
            tokens_per_project_per_minute: m.tokens_per_project_per_minute ?? existingModel.tokens_per_project_per_minute,
            tokens_per_user_per_day: m.tokens_per_user_per_day ?? existingModel.tokens_per_user_per_day,
            is_active: true,
            updated_at: now,
          });
        } else {
          await ctx.db.insert("ai_api_limits", {
            kind: "model",
            provider: args.provider,
            model: m.model,
            request_max_tokens: m.request_max_tokens,
            tokens_per_user_per_minute: m.tokens_per_user_per_minute,
            tokens_per_project_per_minute: m.tokens_per_project_per_minute,
            tokens_per_user_per_day: m.tokens_per_user_per_day,
            is_active: true,
            created_at: now,
            updated_at: now,
          });
        }
      }
    }

    return { success: true };
  },
});

/**
 * Increment AI usage for a model with optional enforcement.
 */
export const incrementAiUsage = mutation({
  args: {
    provider: v.union(v.literal("openai"), v.literal("anthropic"), v.literal("google"), v.literal("custom")),
    model: v.string(),
    // Provide either user_id or user_email to resolve the user
    user_id: v.optional(v.id("users")),
    user_email: v.optional(v.string()),
    // Token counts
    prompt_tokens: v.number(),
    completion_tokens: v.number(),
    total_tokens: v.number(),
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

    // Limits
    const limits = await getEffectiveLimits(ctx, args.provider, args.model);
    const enforce = args.enforce ?? true;

    // Get or create usage row
    let usage = await ctx.db
      .query("ai_api_usages")
      .withIndex("by_user_date_provider_model", (q: any) =>
        q
          .eq("user_id", userId!)
          .eq("date_key", dateKey)
          .eq("provider", args.provider)
          .eq("model", args.model)
      )
      .first();

    if (!usage) {
      const newId = await ctx.db.insert("ai_api_usages", {
        user_id: userId!,
        provider: args.provider,
        model: args.model,
        date_key: dateKey,
        prompt_token_count: 0,
        completion_token_count: 0,
        total_token_count: 0,
        request_count: 0,
        last_request_at: 0,
        minute_window_start: minuteStart,
        minute_token_count: 0,
        created_at: now,
        updated_at: now,
      });
      usage = await ctx.db.get(newId);
      if (!usage) throw new Error("Failed to initialize AI usage row");
    }

    // Reset minute window if crossed
    let minuteTokens = usage.minute_token_count ?? 0;
    let minuteWindowStart = usage.minute_window_start ?? minuteStart;
    if (minuteWindowStart !== minuteStart) {
      minuteWindowStart = minuteStart;
      minuteTokens = 0;
    }

    // Aggregate for per-minute and per-day checks
    const todaysRowsForUser = await ctx.db
      .query("ai_api_usages")
      .withIndex("by_user_and_date", (q: any) =>
        q.eq("user_id", userId!).eq("date_key", dateKey)
      )
      .collect();

    const userMinuteTotal = todaysRowsForUser.reduce((sum: number, row: any) => {
      const sameWindow = (row.minute_window_start ?? 0) === minuteStart;
      return sum + (sameWindow ? row.minute_token_count ?? 0 : 0);
    }, 0);

    const providerRowsToday = await ctx.db
      .query("ai_api_usages")
      .withIndex("by_provider_and_date", (q: any) =>
        q.eq("provider", args.provider).eq("date_key", dateKey)
      )
      .collect();
    const providerMinuteTotal = providerRowsToday.reduce(
      (sum: number, row: any) => sum + ((row.minute_window_start ?? 0) === minuteStart ? row.minute_token_count ?? 0 : 0),
      0
    );

    const userDailyTotal = todaysRowsForUser.reduce(
      (sum: number, row: any) => sum + (row.total_token_count ?? 0),
      0
    );

    // Enforce limits
    if (enforce) {
      if (
        limits.request_max_tokens != null &&
        args.total_tokens > limits.request_max_tokens
      ) {
        throw new Error("Per-request token limit would be exceeded by this call");
      }
      if (
        limits.tokens_per_user_per_minute != null &&
        userMinuteTotal + args.total_tokens > limits.tokens_per_user_per_minute
      ) {
        throw new Error("Per-user per-minute token limit would be exceeded");
      }
      if (
        limits.tokens_per_project_per_minute != null &&
        providerMinuteTotal + args.total_tokens > limits.tokens_per_project_per_minute
      ) {
        throw new Error("Per-project per-minute token limit would be exceeded");
      }
      if (
        limits.tokens_per_user_per_day != null &&
        userDailyTotal + args.total_tokens > limits.tokens_per_user_per_day
      ) {
        throw new Error("Per-user daily token limit would be exceeded");
      }
    }

    // Apply increments
    await ctx.db.patch(usage._id, {
      prompt_token_count: (usage.prompt_token_count ?? 0) + args.prompt_tokens,
      completion_token_count: (usage.completion_token_count ?? 0) + args.completion_tokens,
      total_token_count: (usage.total_token_count ?? 0) + args.total_tokens,
      request_count: (usage.request_count ?? 0) + 1,
      last_request_at: now,
      minute_window_start: minuteWindowStart,
      minute_token_count: minuteTokens + args.total_tokens,
      updated_at: now,
    });

    return {
      success: true,
      provider: args.provider,
      model: args.model,
      tokensApplied: args.total_tokens,
      minuteWindowStart,
      dateKey,
    };
  },
});

// ------------------------------
// Queries
// ------------------------------

export const getAiUsageSummary = query({
  args: {
    provider: v.union(v.literal("openai"), v.literal("anthropic"), v.literal("google"), v.literal("custom")),
    user_id: v.optional(v.id("users")),
    user_email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
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

    const limits = await getEffectiveLimits(ctx, args.provider);

    const rows = await ctx.db
      .query("ai_api_usages")
      .withIndex("by_user_and_date", (q: any) =>
        q.eq("user_id", userId!).eq("date_key", dateKey)
      )
      .collect();

    const byModel: Record<string, { prompt: number; completion: number; total: number; requests: number }> = {};
    let minuteTokens = 0;
    let totalTokens = 0;
    let totalRequests = 0;
    for (const r of rows) {
      if (r.provider !== args.provider) continue;
      totalTokens += r.total_token_count ?? 0;
      totalRequests += r.request_count ?? 0;
      if ((r.minute_window_start ?? 0) === minuteStart) {
        minuteTokens += r.minute_token_count ?? 0;
      }
      const entry = byModel[r.model] || { prompt: 0, completion: 0, total: 0, requests: 0 };
      entry.prompt += r.prompt_token_count ?? 0;
      entry.completion += r.completion_token_count ?? 0;
      entry.total += r.total_token_count ?? 0;
      entry.requests += r.request_count ?? 0;
      byModel[r.model] = entry;
    }

    return {
      dateKey,
      minuteStart,
      totals: { tokens: totalTokens, requests: totalRequests, minuteTokens },
      byModel,
      limits,
    };
  },
});


