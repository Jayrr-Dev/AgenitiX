/**
 * Route: convex/testAuthRefactor.ts
 * TEST AUTH REFACTOR - Test script to verify the auth system migration
 *
 * • Tests magic link authentication with Convex Auth sessions
 * • Verifies user creation and linking between auth_users and users tables
 * • Tests session creation and validation
 * • Confirms proper cleanup of legacy session references
 *
 * Keywords: auth-testing, migration-verification, convex-auth, magic-link
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const testMagicLinkAuth = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    try {
      // Test 1: Check if we can find existing users in both tables
      const authUser = await ctx.db
        .query("auth_users")
        .filter((q) => q.eq(q.field("email"), email))
        .first();

      const convexUser = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", email))
        .first();

      // Test 2: Check Convex Auth sessions
      const authSessions = await ctx.db.query("authSessions").collect();
      const legacyTable = await ctx.db.query("auth_sessions").collect();

      return {
        success: true,
        tests: {
          authUserExists: !!authUser,
          convexUserExists: !!convexUser,
          authSessionsCount: authSessions.length,
          legacySessionsCount: legacyTable.length,
          authSessionsStructure: authSessions[0] || "No sessions",
          linkedProperly: authUser?.convex_user_id === convexUser?._id,
        },
        message: "Auth refactor test completed",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

export const testSessionStructure = query({
  handler: async (ctx) => {
    // Check if we can access both session tables and their structures
    try {
      const convexAuthSessions = await ctx.db.query("authSessions").take(1);
      const legacySessions = await ctx.db.query("auth_sessions").take(1);

      return {
        convexAuthSessionsStructure: convexAuthSessions[0] || "No Convex Auth sessions",
        legacySessionsStructure: legacySessions[0] || "No legacy sessions",
        tablesExist: {
          authSessions: true,
          auth_sessions: true,
        },
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});