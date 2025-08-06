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
import { Email } from "@convex-dev/auth/providers/Email";
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
    Password, // Keep for backwards compatibility
    Email({
      id: "email", 
      name: "Email",
      sendVerificationRequest: async ({ identifier: email, url, token }) => {
        // Create a custom magic link URL that includes both email and token
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const magicLinkUrl = `${baseUrl}/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
        
        // Always log to console for development
        console.log("\n🔗 MAGIC LINK GENERATED:");
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Token: ${token}`);
        console.log(`🔗 Original Auth URL: ${url}`);
        console.log(`🔗 Magic Link URL: ${magicLinkUrl}`);
        console.log("📋 Click this magic link to sign in:");
        console.log(magicLinkUrl);
        console.log(""); 

        // In production, you would send actual emails here with the magicLinkUrl
        // For development, just return success
        return;
      },
    }),
  ],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, args) {
      console.log("🔧 User callback triggered");
      console.log("Args:", JSON.stringify(args));
      
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