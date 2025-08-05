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

import { query, mutation } from "./_generated/server";
import { auth } from "./auth";
import { v } from "convex/values";

/**
 * Get current authenticated user with complete profile data, basically unified user info
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    // Get associated auth_user data if available
    let authUser = null;
    if (user.auth_user_id) {
      authUser = await ctx.db.get(user.auth_user_id);
    } else if (user.email) {
      // Fallback to email lookup if cross-reference is missing
      authUser = await ctx.db
        .query("auth_users")
        .filter((q) => q.eq(q.field("email"), user.email))
        .first();
    }

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      avatar_url: user.image || user.avatar_url || authUser?.avatar_url,
      email_verified: !!user.emailVerificationTime || user.email_verified || authUser?.email_verified,
      is_active: user.is_active ?? authUser?.is_active ?? true,
      created_at: user.created_at || authUser?.created_at,
      updated_at: user.updated_at || authUser?.updated_at,
      last_login: user.last_login || authUser?.last_login,
      company: user.company || authUser?.company,
      role: user.role || authUser?.role,
      timezone: user.timezone || authUser?.timezone,
      // Include both IDs for debugging/admin purposes
      convex_user_id: user._id,
      auth_user_id: user.auth_user_id || authUser?._id,
    };
  },
});

/**
 * Get user by ID with fallback to auth_users table, basically flexible user lookup
 */
export const getUserById = query({
  args: { userId: v.union(v.id("users"), v.id("auth_users")) },
  handler: async (ctx, args) => {
    // Try as Convex user ID first
    try {
      const user = await ctx.db.get(args.userId as any);
      if (user && "email" in user) {
        // This is a users table record
        const authUser = user.auth_user_id ? await ctx.db.get(user.auth_user_id) : null;
        
        return {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar_url: user.image || user.avatar_url || authUser?.avatar_url,
          email_verified: !!user.emailVerificationTime || user.email_verified || authUser?.email_verified,
          is_active: user.is_active ?? authUser?.is_active ?? true,
          created_at: user.created_at || authUser?.created_at,
          updated_at: user.updated_at || authUser?.updated_at,
          last_login: user.last_login || authUser?.last_login,
          company: user.company || authUser?.company,
          role: user.role || authUser?.role,
          timezone: user.timezone || authUser?.timezone,
          convex_user_id: user._id,
          auth_user_id: user.auth_user_id || authUser?._id,
        };
      } else if (user && !("image" in user)) {
        // This is an auth_users table record
        const convexUser = user.convex_user_id ? await ctx.db.get(user.convex_user_id) : null;
        
        return {
          id: convexUser?._id || user._id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url || convexUser?.image,
          email_verified: user.email_verified || !!convexUser?.emailVerificationTime,
          is_active: user.is_active,
          created_at: user.created_at,
          updated_at: user.updated_at,
          last_login: user.last_login,
          company: user.company,
          role: user.role,
          timezone: user.timezone,
          convex_user_id: user.convex_user_id,
          auth_user_id: user._id,
        };
      }
    } catch (error) {
      // ID doesn't exist in either table
      return null;
    }

    return null;
  },
});

/**
 * Update user profile data across both tables, basically unified profile update
 */
export const updateUserProfile = mutation({
  args: {
    name: v.optional(v.string()),
    company: v.optional(v.string()),
    role: v.optional(v.string()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const now = Date.now();
    const updateData = {
      ...args,
      updated_at: now,
    };

    // Update users table
    await ctx.db.patch(userId, updateData);

    // Update auth_users table if linked
    if (user.auth_user_id) {
      await ctx.db.patch(user.auth_user_id, updateData);
    } else if (user.email) {
      // Find and update by email if no cross-reference
      const authUser = await ctx.db
        .query("auth_users")
        .filter((q) => q.eq(q.field("email"), user.email))
        .first();
      
      if (authUser) {
        await ctx.db.patch(authUser._id, updateData);
        // Establish cross-reference
        await ctx.db.patch(userId, { auth_user_id: authUser._id });
        await ctx.db.patch(authUser._id, { convex_user_id: userId });
      }
    }

    return { success: true };
  },
});

/**
 * Get user by email from unified tables, basically email-based user lookup
 */
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const [user, authUser] = await Promise.all([
      ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), args.email))
        .first(),
      ctx.db
        .query("auth_users")
        .filter((q) => q.eq(q.field("email"), args.email))
        .first(),
    ]);

    if (!user && !authUser) return null;

    // Prefer data from users table (Convex Auth)
    const primaryUser = user || authUser;
    const secondaryUser = user ? authUser : null;

    return {
      id: user?._id || authUser?._id,
      email: args.email,
      name: primaryUser.name,
      avatar_url: user?.image || user?.avatar_url || authUser?.avatar_url,
      email_verified: !!user?.emailVerificationTime || user?.email_verified || authUser?.email_verified,
      is_active: user?.is_active ?? authUser?.is_active ?? true,
      created_at: user?.created_at || authUser?.created_at,
      updated_at: user?.updated_at || authUser?.updated_at,
      last_login: user?.last_login || authUser?.last_login,
      company: user?.company || authUser?.company,
      role: user?.role || authUser?.role,
      timezone: user?.timezone || authUser?.timezone,
      convex_user_id: user?._id,
      auth_user_id: authUser?._id,
      synchronized: !!(user && authUser),
    };
  },
});