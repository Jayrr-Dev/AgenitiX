import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Migration Runner for AgenitiX Open Source
 *
 * This module provides functions to run and manage database migrations
 * for the open source transition.
 */

/**
 * Check if a migration has already been applied
 */
export const checkMigrationStatus = query({
  args: { migrationName: v.string() },
  handler: async (ctx, { migrationName }) => {
    const migration = await ctx.db
      .query("migrations")
      .filter((q) => q.eq(q.field("name"), migrationName))
      .first();

    return {
      exists: !!migration,
      appliedAt: migration?.applied_at,
      version: migration?.version,
      changes: migration?.changes,
    };
  },
});

/**
 * List all applied migrations
 */
export const listMigrations = query({
  args: {},
  handler: async (ctx) => {
    const migrations = await ctx.db.query("migrations").order("desc").collect();

    return migrations.map((migration) => ({
      id: migration._id,
      name: migration.name,
      version: migration.version,
      description: migration.description,
      appliedAt: migration.applied_at,
      changes: migration.changes,
    }));
  },
});

/**
 * Run the open source preparation migration
 */
export const runOpenSourceMigration = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if migration already exists
    const existingMigration = await ctx.db
      .query("migrations")
      .filter((q) => q.eq(q.field("name"), "open_source_preparation"))
      .first();

    if (existingMigration) {
      return {
        success: false,
        message: "Open source preparation migration has already been applied",
        migrationId: existingMigration._id,
        appliedAt: existingMigration.applied_at,
      };
    }

    try {
      // Create migration record
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

      // Create open source metadata
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
      const featureFlags = [
        {
          flag_name: "community_contributions",
          description: "Enable community contribution features",
          enabled: true,
          created_at: Date.now(),
          updated_at: Date.now(),
        },
        {
          flag_name: "open_source_analytics",
          description: "Enable open source usage analytics",
          enabled: true,
          created_at: Date.now(),
          updated_at: Date.now(),
        },
        {
          flag_name: "community_templates",
          description: "Enable community template sharing",
          enabled: true,
          created_at: Date.now(),
          updated_at: Date.now(),
        },
      ];

      for (const flag of featureFlags) {
        await ctx.db.insert("feature_flags", flag);
      }

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

      // Update users with contribution tracking
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
        flowsUpdated: flows.length,
        usersUpdated: users.length,
      };
    } catch (error) {
      console.error("Migration failed:", error);
      return {
        success: false,
        message: `Migration failed: ${error}`,
        error: error,
      };
    }
  },
});

/**
 * Get open source metadata
 */
export const getOpenSourceMetadata = query({
  args: {},
  handler: async (ctx) => {
    const metadata = await ctx.db.query("open_source_metadata").first();
    return metadata;
  },
});

/**
 * Get feature flags
 */
export const getFeatureFlags = query({
  args: {},
  handler: async (ctx) => {
    const flags = await ctx.db.query("feature_flags").collect();
    return flags.map((flag) => ({
      id: flag._id,
      name: flag.flag_name,
      description: flag.description,
      enabled: flag.enabled,
      createdAt: flag.created_at,
      updatedAt: flag.updated_at,
    }));
  },
});

/**
 * Update a feature flag
 */
export const updateFeatureFlag = mutation({
  args: {
    flagName: v.string(),
    enabled: v.boolean(),
  },
  handler: async (ctx, { flagName, enabled }) => {
    const flag = await ctx.db
      .query("feature_flags")
      .filter((q) => q.eq(q.field("flag_name"), flagName))
      .first();

    if (!flag) {
      throw new Error(`Feature flag '${flagName}' not found`);
    }

    await ctx.db.patch(flag._id, {
      enabled,
      updated_at: Date.now(),
    });

    return {
      success: true,
      message: `Feature flag '${flagName}' updated to ${enabled ? "enabled" : "disabled"}`,
    };
  },
});
