/**
 * Route: convex/userSync.ts
 * USER SYNCHRONIZATION UTILITIES - Helper functions for syncing users and auth_users tables
 *
 * • Provides utilities to sync data between Convex Auth users table and custom auth_users table
 * • Handles bidirectional sync to ensure data consistency across tables
 * • Includes utilities for finding users by email and maintaining relationships
 * • Supports migration scenarios where data exists in one table but not the other
 *
 * Keywords: user-sync, auth-users, convex-auth, bidirectional-sync, data-consistency
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Sync auth_users data to users table, basically ensuring Convex Auth table has latest data
 */
export const syncAuthUserToConvexUser = mutation({
  args: { 
    authUserId: v.id("auth_users"),
    convexUserId: v.optional(v.id("users"))
  },
  handler: async (ctx, args) => {
    const authUser = await ctx.db.get(args.authUserId);
    if (!authUser) throw new Error("Auth user not found");

    let userId = args.convexUserId;
    
    // Find existing user by email if no userId provided
    if (!userId) {
      const existingUser = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), authUser.email))
        .first();
      userId = existingUser?._id;
    }

    const now = Date.now();
    const syncData = {
      name: authUser.name,
      email: authUser.email,
      avatar_url: authUser.avatar_url,
      email_verified: authUser.email_verified,
      created_at: authUser.created_at,
      updated_at: now,
      last_login: authUser.last_login,
      is_active: authUser.is_active,
      company: authUser.company,
      role: authUser.role,
      timezone: authUser.timezone,
      magic_link_token: authUser.magic_link_token,
      magic_link_expires: authUser.magic_link_expires,
      login_attempts: authUser.login_attempts,
      last_login_attempt: authUser.last_login_attempt,
      auth_user_id: args.authUserId,
    };

    if (userId) {
      // Update existing user
      await ctx.db.patch(userId, syncData);
      // Update cross-reference in auth_users
      await ctx.db.patch(args.authUserId, { convex_user_id: userId });
      return userId;
    } else {
      // Create new user
      const newUserId = await ctx.db.insert("users", syncData);
      // Update cross-reference in auth_users
      await ctx.db.patch(args.authUserId, { convex_user_id: newUserId });
      return newUserId;
    }
  },
});

/**
 * Sync users data to auth_users table, basically ensuring custom table has latest data
 */
export const syncConvexUserToAuthUser = mutation({
  args: { 
    convexUserId: v.id("users"),
    authUserId: v.optional(v.id("auth_users"))
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.convexUserId);
    if (!user) throw new Error("Convex user not found");
    if (!user.email) throw new Error("User must have email to sync");

    let authUserId = args.authUserId;
    
    // Find existing auth_user by email if no authUserId provided
    if (!authUserId) {
      const existingAuthUser = await ctx.db
        .query("auth_users")
        .filter((q) => q.eq(q.field("email"), user.email))
        .first();
      authUserId = existingAuthUser?._id;
    }

    const now = Date.now();
    const syncData = {
      email: user.email,
      name: user.name || "User",
      avatar_url: user.image || user.avatar_url,
      email_verified: !!user.emailVerificationTime || !!user.email_verified,
      created_at: user.created_at || now,
      updated_at: now,
      last_login: user.last_login || now,
      is_active: user.is_active ?? true,
      company: user.company,
      role: user.role,
      timezone: user.timezone,
      magic_link_token: user.magic_link_token,
      magic_link_expires: user.magic_link_expires,
      login_attempts: user.login_attempts || 0,
      last_login_attempt: user.last_login_attempt,
      convex_user_id: args.convexUserId,
    };

    if (authUserId) {
      // Update existing auth_user
      await ctx.db.patch(authUserId, syncData);
      // Update cross-reference in users
      await ctx.db.patch(args.convexUserId, { auth_user_id: authUserId });
      return authUserId;
    } else {
      // Create new auth_user
      const newAuthUserId = await ctx.db.insert("auth_users", syncData);
      // Update cross-reference in users
      await ctx.db.patch(args.convexUserId, { auth_user_id: newAuthUserId });
      return newAuthUserId;
    }
  },
});

/**
 * Get user by email from either table, basically finding user regardless of table
 */
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const [convexUser, authUser] = await Promise.all([
      ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), args.email))
        .first(),
      ctx.db
        .query("auth_users")
        .filter((q) => q.eq(q.field("email"), args.email))
        .first(),
    ]);

    return {
      convexUser,
      authUser,
      synchronized: !!(convexUser && authUser),
    };
  },
});

/**
 * Force sync all users between tables, basically migration utility
 */
export const syncAllUsers = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all users from both tables
    const [convexUsers, authUsers] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("auth_users").collect(),
    ]);

    const results = {
      syncedToAuth: 0,
      syncedToConvex: 0,
      errors: [] as string[],
    };

    // Sync Convex users to auth_users table
    for (const user of convexUsers) {
      if (!user.email) continue;
      
      try {
        const existingAuthUser = authUsers.find(au => au.email === user.email);
        await ctx.db.call("userSync:syncConvexUserToAuthUser", {
          convexUserId: user._id,
          authUserId: existingAuthUser?._id,
        });
        results.syncedToAuth++;
      } catch (error) {
        results.errors.push(`Failed to sync user ${user._id}: ${error}`);
      }
    }

    // Sync auth_users to Convex users table
    for (const authUser of authUsers) {
      try {
        const existingUser = convexUsers.find(u => u.email === authUser.email);
        await ctx.db.call("userSync:syncAuthUserToConvexUser", {
          authUserId: authUser._id,
          convexUserId: existingUser?._id,
        });
        results.syncedToConvex++;
      } catch (error) {
        results.errors.push(`Failed to sync auth_user ${authUser._id}: ${error}`);
      }
    }

    return results;
  },
});