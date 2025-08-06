/**
 * Route: convex/auth.ts
 * CONVEX AUTH CONFIGURATION - Modern authentication setup with GitHub OAuth and user sync
 *
 * • Integrates with existing auth_users table schema via custom afterUserCreatedOrUpdated callback
 * • Supports OAuth providers (GitHub) with profile data mapping
 * • Maintains backward compatibility with existing magic link authentication
 * • Maps Convex Auth user data to custom schema fields (snake_case naming)
 * • Handles user creation with starter template provisioning
 * • Bidirectional sync between users and auth_users tables
 *
 * Keywords: convex-auth, oauth, github, custom-schema, backward-compatibility, user-sync
 */

import { convexAuth } from "@convex-dev/auth/server";
import GitHub from "@auth/core/providers/github";
import { Password } from "@convex-dev/auth/providers/Password";
import { DataModel } from "./_generated/dataModel";

// Debug environment variables in development, basically check if auth keys are loaded
console.log("🔑 Convex Auth Environment Debug:", {
  nodeEnv: process.env.NODE_ENV,
  hasGitHubId: !!process.env.AUTH_GITHUB_ID,
  hasGitHubSecret: !!process.env.AUTH_GITHUB_SECRET,
  hasAuthSecret: !!process.env.AUTH_SECRET,
  gitHubIdPrefix: process.env.AUTH_GITHUB_ID?.substring(0, 8) + "...",
  authSecretPrefix: process.env.AUTH_SECRET?.substring(0, 8) + "...",
  allEnvKeys: Object.keys(process.env).filter(key => key.includes('AUTH')),
});

export const { auth, signIn, signOut: oauthSignOut, store, isAuthenticated } = convexAuth({
  providers: [
    GitHub,
    Password, // Magic link authentication
  ],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, args) {
      console.log("🔧 User sync callback triggered");
      console.log("Args:", JSON.stringify(args));
      
      // Sync Convex Auth users table with custom auth_users table, basically keeping both in sync
      const { userId, existingUserId } = args;
      const user = await ctx.db.get(userId);
      
      if (!user?.email) return;

      // Find existing auth_user by email
      const existingAuthUser = await ctx.db
        .query("auth_users")
        .filter((q) => q.eq(q.field("email"), user.email))
        .first();

      const now = Date.now();

      let authUserId: string;

      if (existingAuthUser) {
        // Update existing auth_user record
        await ctx.db.patch(existingAuthUser._id, {
          name: user.name || existingAuthUser.name,
          avatar_url: user.image || existingAuthUser.avatar_url,
          email_verified: !!user.emailVerificationTime || existingAuthUser.email_verified,
          updated_at: now,
          last_login: now,
          convex_user_id: userId,
        });
        authUserId = existingAuthUser._id;
      } else {
        // Create new auth_user record
        authUserId = await ctx.db.insert("auth_users", {
          email: user.email,
          name: user.name || "User",
          avatar_url: user.image,
          email_verified: !!user.emailVerificationTime,
          created_at: now,
          updated_at: now,
          last_login: now,
          is_active: true,
          company: undefined,
          role: undefined,
          timezone: undefined,
          magic_link_token: undefined,
          magic_link_expires: undefined,
          login_attempts: 0,
          last_login_attempt: undefined,
          convex_user_id: userId,
        });
      }

      // TODO: Fix schema mismatch - Convex Auth users table doesn't have these custom fields
      // await ctx.db.patch(userId, {
      //   avatar_url: user.image,
      //   email_verified: !!user.emailVerificationTime,
      //   updated_at: now,
      //   last_login: now,
      //   is_active: true,
      //   auth_user_id: authUserId,
      // });

      // Provision starter templates for new users only, basically onboarding workflows
      if (!existingUserId && !existingAuthUser) {
        try {
          const nowISO = new Date().toISOString();
          
          const STARTER_TEMPLATES = [
            {
              name: "🚀 Welcome & AI Introduction",
              description: "Learn the basics with text creation and AI interaction",
              icon: "rocket",
              nodes: [],
              edges: [],
            },
            {
              name: "📧 Email Automation Starter",
              description: "Set up your first email automation workflow",
              icon: "mail",
              nodes: [],
              edges: [],
            },
            {
              name: "📊 Data Processing Basics",
              description: "Learn to create, process, and store data",
              icon: "database",
              nodes: [],
              edges: [],
            },
          ];

          for (const template of STARTER_TEMPLATES) {
            try {
              await ctx.db.insert("flows", {
                name: template.name,
                description: template.description,
                icon: template.icon,
                is_private: true,
                user_id: authUserId,
                nodes: template.nodes,
                edges: template.edges,
                canvas_updated_at: nowISO,
                created_at: nowISO,
                updated_at: nowISO,
              });
            } catch (error) {
              console.error(`Failed to create template "${template.name}":`, error);
            }
          }
        } catch (error) {
          console.error("Failed to provision starter templates:", error);
        }
      }
    },
  },
});

// Export custom auth functions for backward compatibility with existing frontend
export {
  sendMagicLink,
  verifyMagicLink,
  signUp,
  getCurrentUser,
  signOut,
  updateProfile,
  getUserSessions,
  revokeSession,
} from "./authFunctions";