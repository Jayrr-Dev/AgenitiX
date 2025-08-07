/**
 * Route: convex/auth.ts
 * CONVEX AUTH CONFIGURATION - Modern authentication setup with GitHub & Google OAuth and user sync
 *
 * • Integrates with existing auth_users table schema via custom afterUserCreatedOrUpdated callback
 * • Supports OAuth providers (GitHub, Google) with profile data mapping
 * • Maintains backward compatibility with existing magic link authentication
 * • Maps Convex Auth user data to custom schema fields (snake_case naming)
 * • Handles user creation with starter template provisioning
 * • Bidirectional sync between users and auth_users tables
 *
 * Keywords: convex-auth, oauth, github, google, custom-schema, backward-compatibility, user-sync
 */

import { convexAuth } from "@convex-dev/auth/server";
import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import Resend from "@auth/core/providers/resend";
import { Password } from "@convex-dev/auth/providers/Password";

// Debug environment variables in development only, basically check if auth keys are loaded
if (process.env.NODE_ENV === "development") {
  console.log("🔑 Convex Auth Environment Debug:", {
    nodeEnv: process.env.NODE_ENV,
    hasGitHubId: !!process.env.AUTH_GITHUB_ID,
    hasGitHubSecret: !!process.env.AUTH_GITHUB_SECRET,
    hasGoogleId: !!process.env.AUTH_GOOGLE_ID,
    hasGoogleSecret: !!process.env.AUTH_GOOGLE_SECRET,
    hasAuthSecret: !!process.env.AUTH_SECRET,
    gitHubIdPrefix: process.env.AUTH_GITHUB_ID?.substring(0, 8) + "...",
    googleIdPrefix: process.env.AUTH_GOOGLE_ID?.substring(0, 8) + "...",
    authSecretPrefix: process.env.AUTH_SECRET?.substring(0, 8) + "...",
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('AUTH')),
  });
}

export const { auth, signIn, signOut: oauthSignOut, store, isAuthenticated } = convexAuth({
  providers: [
    GitHub,
    // Google, // Temporarily disabled to avoid conflict with email account OAuth
    Password, // Keep for backwards compatibility
    Resend, // Standard Auth.js email provider for magic links
  ],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, args) {
      // Log user creation only in development, basically track onboarding flow
      if (process.env.NODE_ENV === "development") {
        console.log("🔧 User callback triggered");
        console.log("Args:", JSON.stringify(args));
      }
      
      const { userId, existingUserId } = args;
      const user = await ctx.db.get(userId);
      
      if (!user?.email) return;

      const now = Date.now();

      // Update user with additional fields
      await ctx.db.patch(userId, {
        avatar_url: user.image,
        email_verified: !!user.emailVerificationTime,
        updated_at: now,
        last_login: now,
        is_active: true,
      });

      // Provision starter templates for new users only, basically onboarding workflows
      if (!existingUserId) {
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
                user_id: userId,
                nodes: template.nodes,
                edges: template.edges,
                canvas_updated_at: nowISO,
                created_at: nowISO,
                updated_at: nowISO,
              });
            } catch (error) {
              // Log template creation errors only in development, basically debug onboarding
              if (process.env.NODE_ENV === "development") {
                console.error(`Failed to create template "${template.name}":`, error);
              }
            }
          }
        } catch (error) {
          // Log starter template errors only in development, basically debug onboarding flow
          if (process.env.NODE_ENV === "development") {
            console.error("Failed to provision starter templates:", error);
          }
        }
      }
    },
  },
});

// Note: Custom auth functions in authFunctions.ts are kept for backward compatibility
// but Convex Auth is now the primary authentication system