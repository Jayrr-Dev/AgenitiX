import { mutation } from "../_generated/server";

/**
 * Migration: Open Source Preparation
 *
 * This migration prepares the AgenitiX database for open source release by:
 * 1. Adding open source metadata tracking
 * 2. Adding community contribution fields
 * 3. Adding feature flags for community features
 * 4. Updating existing tables with open source metadata
 *
 * Version: 0.12.0
 * Date: 2025-01-23
 *
 * @param ctx - Convex context
 */
export const openSourcePreparation = mutation({
  args: {},
  handler: async (ctx) => {
    const migrationId = await ctx.db.insert("migrations", {
      version: "0.12.0",
      name: "open_source_preparation",
      description: "Prepare database for open source release",
      applied_at: Date.now(),
      changes: [
        "Added open_source_metadata table",
        "Added user contribution tracking fields",
        "Added community feature flags",
        "Updated flows table with open source metadata",
      ],
    });

    // Create open source metadata table
    await ctx.db.insert("open_source_metadata", {
      project_name: "AgenitiX",
      license: "MIT",
      version: "0.12.0",
      open_source_since: Date.now(),
      github_url: "https://github.com/agenitix/agenitix",
      documentation_url: "https://github.com/agenitix/agenitix#readme",
      community_features_enabled: true,
      contribution_tracking_enabled: true,
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    // Add community feature flags
    await ctx.db.insert("feature_flags", {
      flag_name: "community_contributions",
      description: "Enable community contribution features",
      enabled: true,
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    await ctx.db.insert("feature_flags", {
      flag_name: "open_source_analytics",
      description: "Enable open source usage analytics",
      enabled: true,
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    await ctx.db.insert("feature_flags", {
      flag_name: "community_templates",
      description: "Enable community template sharing",
      enabled: true,
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    // Update existing flows with open source metadata
    const flows = await ctx.db.query("flows").collect();
    for (const flow of flows) {
      await ctx.db.patch(flow._id, {
        open_source_metadata: {
          is_community_template: false,
          contribution_status: "private",
          license: "MIT",
          tags: ["workflow", "automation"],
          created_for_open_source: false,
        },
        updated_at: new Date().toISOString(),
      });
    }

    // Update users table with contribution tracking
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      await ctx.db.patch(user._id, {
        contribution_metadata: {
          is_contributor: false,
          contribution_count: 0,
          first_contribution_at: undefined,
          last_contribution_at: undefined,
          contribution_types: [],
        },
        open_source_user: true,
        updated_at: Date.now(),
      });
    }

    console.log(
      `Migration completed successfully. Migration ID: ${migrationId}`
    );

    return {
      success: true,
      migrationId,
      message: "Open source preparation migration completed successfully",
      changesApplied: [
        "Created open_source_metadata table",
        "Added community feature flags",
        "Updated flows with open source metadata",
        "Updated users with contribution tracking",
      ],
    };
  },
});

/**
 * Rollback migration for open source preparation
 *
 * This function can be used to rollback the open source preparation migration
 * if needed during development or testing.
 */
export const rollbackOpenSourcePreparation = mutation({
  args: {},
  handler: async (ctx) => {
    // Remove open source metadata
    const openSourceMetadata = await ctx.db
      .query("open_source_metadata")
      .collect();
    for (const metadata of openSourceMetadata) {
      await ctx.db.delete(metadata._id);
    }

    // Remove community feature flags
    const communityFlags = await ctx.db
      .query("feature_flags")
      .filter((q) => q.eq(q.field("flag_name"), "community_contributions"))
      .collect();

    for (const flag of communityFlags) {
      await ctx.db.delete(flag._id);
    }

    const analyticsFlags = await ctx.db
      .query("feature_flags")
      .filter((q) => q.eq(q.field("flag_name"), "open_source_analytics"))
      .collect();

    for (const flag of analyticsFlags) {
      await ctx.db.delete(flag._id);
    }

    const templateFlags = await ctx.db
      .query("feature_flags")
      .filter((q) => q.eq(q.field("flag_name"), "community_templates"))
      .collect();

    for (const flag of templateFlags) {
      await ctx.db.delete(flag._id);
    }

    // Remove open source metadata from flows
    const flows = await ctx.db.query("flows").collect();
    for (const flow of flows) {
      const { open_source_metadata, ...rest } = flow;
      await ctx.db.patch(flow._id, {
        ...rest,
        updated_at: new Date().toISOString(),
      });
    }

    // Remove contribution metadata from users
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      const { contribution_metadata, open_source_user, ...rest } = user;
      await ctx.db.patch(user._id, {
        ...rest,
        updated_at: Date.now(),
      });
    }

    console.log("Rollback completed successfully");

    return {
      success: true,
      message: "Open source preparation migration rolled back successfully",
    };
  },
});
