/**
 * Route: convex/auth.ts
 * CONVEX AUTH CONFIGURATION - Modern authentication setup with GitHub and Google OAuth
 *
 * • Integrates with existing auth_users table schema via custom createOrUpdateUser callback
 * • Supports OAuth providers (GitHub, Google) with profile data mapping
 * • Maintains backward compatibility with existing magic link authentication
 * • Maps Convex Auth user data to custom schema fields (snake_case naming)
 * • Handles user creation with starter template provisioning
 *
 * Keywords: convex-auth, oauth, github, google, custom-schema, backward-compatibility
 */

import { convexAuth } from "@convex-dev/auth/server";
import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { DataModel } from "./_generated/dataModel";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, args) {
      // This callback is called after the user is created or updated in the users table
      // We use this to sync with our existing auth_users table
      
      const { userId, existingUserId } = args;
      const user = await ctx.db.get(userId);
      
      if (!user?.email) return;

            // Check if user exists in our custom auth_users table
      const existingAuthUser = await ctx.db
        .query("auth_users")
        .filter((q) => q.eq(q.field("email"), user.email))
        .first();

      const now = Date.now();

      if (existingAuthUser) {
        // Update existing user in auth_users table
        await ctx.db.patch(existingAuthUser._id, {
          name: user.name || existingAuthUser.name,
          avatar_url: user.image || existingAuthUser.avatar_url,
          email_verified: !!user.emailVerificationTime || existingAuthUser.email_verified,
          updated_at: now,
          last_login: now,
        });
      } else {
        // Create new user in auth_users table
        const authUserId = await ctx.db.insert("auth_users", {
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
    });

    // Provision starter templates for new user, basically welcome workflows
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
      }
    },
  },
});