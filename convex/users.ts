/**
 * Route: convex/users.ts
 * USER QUERY HELPERS - Unified user data access across synchronized tables
 *
 * • Provides convenience functions for accessing user data from both tables
 * • Handles authentication and user lookups with automatic fallback
 * • Ensures consistent user data access across the application
 * • Integrates with Convex Auth for authenticated queries
 *
 * Keywords: user-queries, authentication, data-access, convex-auth, synchronized-tables
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get current authenticated user with complete profile data, basically unified user info
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    try {
      // Get user identity from Convex Auth
      const identity = await ctx.auth.getUserIdentity();
      if (!identity?.email) return null;

      // Find user in users table by email (not by auth session ID)
      const user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", identity.email))
        .first();

      if (!user) return null;

      return {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar_url: user.image || user.avatar_url,
        email_verified: !!user.emailVerificationTime || user.email_verified,
        is_active: user.is_active ?? true,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login: user.last_login,
        company: user.company,
        role: user.role,
        timezone: user.timezone,
      };
    } catch (error) {
      // Return null if authentication fails, basically graceful auth handling
      return null;
    }
  },
});

/**
 * Get user by ID, basically simple user lookup
 */
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    try {
      const user = await ctx.db.get(args.userId);
      if (!user) return null;

      return {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar_url: user.image || user.avatar_url,
        email_verified: !!user.emailVerificationTime || user.email_verified,
        is_active: user.is_active ?? true,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login: user.last_login,
        company: user.company,
        role: user.role,
        timezone: user.timezone,
      };
    } catch (error) {
      return null;
    }
  },
});

/**
 * Update user profile data, basically unified profile update
 */
export const updateUserProfile = mutation({
  args: {
    name: v.optional(v.string()),
    company: v.optional(v.string()),
    role: v.optional(v.string()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // Get user identity from Convex Auth
      const identity = await ctx.auth.getUserIdentity();
      if (!identity?.email) throw new Error("Not authenticated");

      // Find user in users table by email (not by auth session ID)
      const user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", identity.email))
        .first();

      if (!user) throw new Error("User not found");

      const now = Date.now();
      const updateData = {
        ...args,
        updated_at: now,
      };

      // Update users table
      await ctx.db.patch(user._id, updateData);

      return { success: true };
    } catch (error) {
      // Re-throw with proper error message, basically enhanced error handling
      throw new Error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    }
  },
});

/**
 * Get user by email, basically email-based user lookup
 */
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (!user) return null;

    return {
      id: user._id,
      email: args.email,
      name: user.name,
      avatar_url: user.image || user.avatar_url,
      email_verified: !!user.emailVerificationTime || user.email_verified,
      is_active: user.is_active ?? true,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login: user.last_login,
      company: user.company,
      role: user.role,
      timezone: user.timezone,
    };
  },
});
