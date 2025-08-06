/**
 * Route: convex/authFunctions.ts
 * CUSTOM AUTH FUNCTIONS - Magic link authentication functions for backward compatibility
 *
 * • Provides custom magic link authentication functions expected by frontend
 * • Integrates with existing auth_users table and session management
 * • Maintains backward compatibility with current authentication flow
 * • Supports both OAuth (via Convex Auth) and magic link authentication
 * • Rate limiting and security features for magic link generation
 *
 * Keywords: magic-link, authentication, custom-auth, rate-limiting, session-management
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Constants for rate limiting and security
const MAGIC_LINK_EXPIRY = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

// Helper function to generate magic token
function generateMagicToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Send magic link for authentication, basically email-based login
 */
export const sendMagicLink = mutation({
  args: {
    email: v.string(),
    type: v.union(v.literal("login"), v.literal("verification")),
  },
  handler: async (ctx, args) => {
    const { email, type } = args;
    const now = Date.now();

    try {
      // Find user in auth_users table
      let user = await ctx.db
        .query("auth_users")
        .filter((q) => q.eq(q.field("email"), email))
        .first();

      // For login type, user must exist
      if (type === "login" && !user) {
        return {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "No account found with this email address.",
          },
        };
      }

      // Check rate limiting
      if (user) {
        const timeSinceLastAttempt = now - (user.last_login_attempt || 0);
        if (
          user.login_attempts >= MAX_LOGIN_ATTEMPTS &&
          timeSinceLastAttempt < RATE_LIMIT_WINDOW
        ) {
          const retryAfter = Math.ceil((RATE_LIMIT_WINDOW - timeSinceLastAttempt) / 1000 / 60);
          return {
            success: false,
            error: {
              code: "RATE_LIMITED",
              message: `Too many attempts. Try again in ${retryAfter} minutes.`,
              retryAfter,
            },
          };
        }
      }

      // Generate magic token
      const magicToken = generateMagicToken();
      const expiresAt = now + MAGIC_LINK_EXPIRY;

      if (user) {
        // Update existing user with magic link
        await ctx.db.patch(user._id, {
          magic_link_token: magicToken,
          magic_link_expires: expiresAt,
          login_attempts: (user.login_attempts || 0) + 1,
          last_login_attempt: now,
          updated_at: now,
        });
      } else {
        // Create new user for verification type
        user = {
          _id: await ctx.db.insert("auth_users", {
            email,
            name: email.split("@")[0], // Use email prefix as default name
            avatar_url: undefined,
            email_verified: false,
            created_at: now,
            updated_at: now,
            last_login: undefined,
            is_active: false, // Will be activated on verification
            company: undefined,
            role: undefined,
            timezone: undefined,
            magic_link_token: magicToken,
            magic_link_expires: expiresAt,
            login_attempts: 1,
            last_login_attempt: now,
            convex_user_id: undefined,
          }),
        } as any;
      }

      return {
        success: true,
        data: {
          magicToken,
          email,
        },
      };
    } catch (error) {
      console.error("Send magic link error:", error);
      return {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to send magic link. Please try again.",
        },
      };
    }
  },
});

/**
 * Verify magic link and sign in user, basically token-based authentication
 */
export const verifyMagicLink = mutation({
  args: {
    token: v.string(),
    ip_address: v.optional(v.string()),
    user_agent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { token, ip_address, user_agent } = args;
    const now = Date.now();

    try {
      // Find user with the magic token
      const user = await ctx.db
        .query("auth_users")
        .filter((q) => q.eq(q.field("magic_link_token"), token))
        .first();

      if (!user) {
        return {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Invalid or expired magic link.",
          },
        };
      }

      // Check if token is expired
      if (!user.magic_link_expires || now > user.magic_link_expires) {
        return {
          success: false,
          error: {
            code: "EXPIRED_TOKEN",
            message: "Magic link has expired. Please request a new one.",
          },
        };
      }

      // Create Convex Auth session for magic link user
      const sessionExpiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days
      
      // Ensure the user has a corresponding Convex Auth user
      let convexUserId = user.convex_user_id;
      if (!convexUserId) {
        // Create or link to Convex Auth user
        const existingConvexUser = await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", user.email))
          .first();
          
        if (existingConvexUser) {
          convexUserId = existingConvexUser._id;
          // Link the auth_user to the convex user
          await ctx.db.patch(user._id, { convex_user_id: convexUserId });
        } else {
          // Create new Convex Auth user
          convexUserId = await ctx.db.insert("users", {
            email: user.email,
            name: user.name,
            avatar_url: user.avatar_url,
            company: user.company,
            role: user.role,
            timezone: user.timezone,
            email_verified: true,
            is_active: true,
            created_at: now,
            updated_at: now,
            auth_user_id: user._id,
          });
          
          // Link back
          await ctx.db.patch(user._id, { convex_user_id: convexUserId });
        }
      }
      
      // Create Convex Auth session
      await ctx.db.insert("authSessions", {
        userId: convexUserId,
        expirationTime: sessionExpiresAt,
      });

      // Update user: verify email, clear magic link, reset attempts
      await ctx.db.patch(user._id, {
        email_verified: true,
        is_active: true,
        last_login: now,
        magic_link_token: undefined,
        magic_link_expires: undefined,
        login_attempts: 0,
        last_login_attempt: undefined,
        updated_at: now,
      });

      return {
        success: true,
        data: {
          token: token, // Use the magic token as the auth token for the magic link system
          user: {
            id: convexUserId, // Return the Convex Auth user ID
            email: user.email,
            name: user.name,
            avatar_url: user.avatar_url,
            email_verified: user.email_verified,
            is_active: user.is_active,
          },
        },
      };
    } catch (error) {
      console.error("Verify magic link error:", error);
      return {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to verify magic link. Please try again.",
        },
      };
    }
  },
});

/**
 * Sign up new user with magic link verification, basically user registration
 */
export const signUp = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    company: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { email, name, company, role } = args;
    const now = Date.now();

    try {
      // Check if user already exists
      const existingUser = await ctx.db
        .query("auth_users")
        .filter((q) => q.eq(q.field("email"), email))
        .first();

      if (existingUser && existingUser.email_verified) {
        return {
          success: false,
          error: {
            code: "USER_EXISTS",
            message: "An account with this email already exists.",
          },
        };
      }

      // Generate magic token for verification
      const magicToken = generateMagicToken();
      const expiresAt = now + MAGIC_LINK_EXPIRY;

      let userId;
      if (existingUser) {
        // Update existing unverified user
        await ctx.db.patch(existingUser._id, {
          name,
          company,
          role,
          magic_link_token: magicToken,
          magic_link_expires: expiresAt,
          updated_at: now,
        });
        userId = existingUser._id;
      } else {
        // Create new user
        userId = await ctx.db.insert("auth_users", {
          email,
          name,
          avatar_url: undefined,
          email_verified: false,
          created_at: now,
          updated_at: now,
          last_login: undefined,
          is_active: false,
          company,
          role,
          timezone: undefined,
          magic_link_token: magicToken,
          magic_link_expires: expiresAt,
          login_attempts: 0,
          last_login_attempt: undefined,
          convex_user_id: undefined,
        });
      }

      return {
        success: true,
        data: {
          magicToken,
          userId,
          email,
          name,
        },
      };
    } catch (error) {
      console.error("Sign up error:", error);
      return {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create account. Please try again.",
        },
      };
    }
  },
});

/**
 * Get current user by session token, basically session-based authentication
 * Now adapted to work with Convex Auth's authSessions table
 */
export const getCurrentUser = query({
  args: {
    token_hash: v.string(),
  },
  handler: async (ctx, args) => {
    const { token_hash } = args;
    const now = Date.now();

    try {
      // For magic link, we need to find the user via auth_users table
      // since the token_hash is stored there, not in Convex Auth sessions
      const authUser = await ctx.db
        .query("auth_users")
        .filter((q) => q.eq(q.field("magic_link_token"), token_hash))
        .filter((q) => q.eq(q.field("is_active"), true))
        .first();

      if (!authUser) {
        return null;
      }

      // Check if magic link is expired
      if (authUser.magic_link_expires && authUser.magic_link_expires < now) {
        return null;
      }

      // Get the corresponding Convex Auth user
      const user = authUser.convex_user_id ? await ctx.db.get(authUser.convex_user_id) : null;
      
      if (!user) {
        return null;
      }

      return {
        id: user._id,
        email: user.email || authUser.email,
        name: user.name || authUser.name,
        avatar_url: user.avatar_url || authUser.avatar_url,
        email_verified: user.email_verified || authUser.email_verified,
        is_active: user.is_active,
        company: user.company || authUser.company,
        role: user.role || authUser.role,
        timezone: user.timezone || authUser.timezone,
        created_at: user.created_at || authUser.created_at,
        last_login: user.last_login || authUser.last_login,
      };
    } catch (error) {
      console.error("Get current user error:", error);
      return null;
    }
  },
});

/**
 * Sign out user by invalidating session, basically session cleanup
 * Now handles both magic link tokens and Convex Auth sessions
 */
export const signOut = mutation({
  args: {
    token_hash: v.string(),
  },
  handler: async (ctx, args) => {
    const { token_hash } = args;

    try {
      // For magic link users, find by magic link token and clear it
      const authUser = await ctx.db
        .query("auth_users")
        .filter((q) => q.eq(q.field("magic_link_token"), token_hash))
        .first();

      if (authUser) {
        // Clear the magic link token to sign out
        await ctx.db.patch(authUser._id, {
          magic_link_token: undefined,
          magic_link_expires: undefined,
        });

        // If there's a linked Convex Auth user, invalidate their sessions too
        if (authUser.convex_user_id) {
          const convexAuthSessions = await ctx.db
            .query("authSessions")
            .withIndex("userId", (q) => q.eq("userId", authUser.convex_user_id))
            .collect();

          // Delete all Convex Auth sessions for this user
          for (const session of convexAuthSessions) {
            await ctx.db.delete(session._id);
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error("Sign out error:", error);
      return { success: false };
    }
  },
});

/**
 * Delete user account and all associated data, basically complete account removal
 */
export const deleteAccount = mutation({
  args: {
    token_hash: v.optional(v.string()),
    confirmation: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify confirmation text
    if (args.confirmation !== "delete") {
      throw new Error("Invalid confirmation. Please type 'delete' to confirm account deletion.");
    }

    // Get user identity (try Convex Auth first, then fallback to custom auth)
    let user = null;
    
    try {
      // Try Convex Auth first
      const identity = await ctx.auth.getUserIdentity();
      if (identity?.email) {
        user = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("email"), identity.email))
          .first();
      }
    } catch (error) {
      console.log("Convex Auth not available, trying custom auth");
    }

    // Fallback to custom auth if provided
    if (!user && args.token_hash) {
      const session = await ctx.db
        		.query("authSessions")
        .filter((q) => q.eq(q.field("token_hash"), args.token_hash))
        .first();

      if (session && session.is_active) {
        user = await ctx.db.get(session.user_id);
      }
    }

    if (!user) {
      throw new Error("User not found or not authenticated");
    }

    const userId = user._id;

    try {
      // Delete flows and related data
      const userFlows = await ctx.db
        .query("flows")
        .withIndex("by_user_id", (q) => q.eq("user_id", userId))
        .collect();

      for (const flow of userFlows) {
        // Delete flow upvotes
        const upvotes = await ctx.db
          .query("flow_upvotes")
          .withIndex("by_flow_id", (q) => q.eq("flow_id", flow._id))
          .collect();
        for (const upvote of upvotes) {
          await ctx.db.delete(upvote._id);
        }

        // Delete flow shares
        const shares = await ctx.db
          .query("flow_shares")
          .withIndex("by_flow_id", (q) => q.eq("flow_id", flow._id))
          .collect();
        for (const share of shares) {
          await ctx.db.delete(share._id);
        }

        // Delete flow permissions
        const permissions = await ctx.db
          .query("flow_share_permissions")
          .withIndex("by_flow_id", (q) => q.eq("flow_id", flow._id))
          .collect();
        for (const permission of permissions) {
          await ctx.db.delete(permission._id);
        }

        // Delete access requests
        const requests = await ctx.db
          .query("flow_access_requests")
          .withIndex("by_flow_id", (q) => q.eq("flow_id", flow._id))
          .collect();
        for (const request of requests) {
          await ctx.db.delete(request._id);
        }

        // Delete the flow itself
        await ctx.db.delete(flow._id);
      }

      // Delete user sessions
      const sessions = await ctx.db
        		.query("authSessions")
        .withIndex("by_user_id", (q) => q.eq("user_id", userId))
        .collect();
      for (const session of sessions) {
        await ctx.db.delete(session._id);
      }

      // Delete email accounts (if any)
      const emailAccounts = await ctx.db
        .query("email_accounts")
        .withIndex("by_user_id", (q) => q.eq("user_id", userId))
        .collect();
      for (const account of emailAccounts) {
        await ctx.db.delete(account._id);
      }

      // Find and delete corresponding users table record if it exists
      if (user.email) {
        const convexUser = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("email"), user.email))
          .first();
        if (convexUser) {
          await ctx.db.delete(convexUser._id);
        }
      }

      // Finally delete the auth_users record
      await ctx.db.delete(userId);

      return {
        success: true,
        message: "Account deleted successfully",
        deletedFlows: userFlows.length,
      };
    } catch (error) {
      console.error("Error deleting account:", error);
      throw new Error("Failed to delete account. Please try again.");
    }
  },
});

/**
 * Update user profile, basically profile management
 */
export const updateProfile = mutation({
  args: {
    token_hash: v.string(),
    name: v.optional(v.string()),
    company: v.optional(v.string()),
    role: v.optional(v.string()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { token_hash, ...updateData } = args;
    const now = Date.now();

    try {
      // Find active session
      const session = await ctx.db
        		.query("authSessions")
        .filter((q) => q.eq(q.field("token_hash"), token_hash))
        .filter((q) => q.eq(q.field("is_active"), true))
        .first();

      if (!session) {
        return {
          success: false,
          error: "Invalid session",
        };
      }

      // Get user
      const user = await ctx.db.get(session.user_id);
      if (!user) {
        return {
          success: false,
          error: "User not found",
        };
      }

      // Update user profile
      await ctx.db.patch(user._id, {
        ...updateData,
        updated_at: now,
      });

      // Also update Convex Auth user if linked
      if (user.convex_user_id) {
        await ctx.db.patch(user.convex_user_id, {
          ...updateData,
          updated_at: now,
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Update profile error:", error);
      return {
        success: false,
        error: "Failed to update profile",
      };
    }
  },
});

/**
 * Get user sessions for security management, basically session monitoring
 */
