/**
 * Route: convex/authHelpers.ts
 * AUTH HELPERS - Convex Auth utilities only
 *
 * • Single-source auth via Convex Auth
 * • Type-safe identity management
 * • Clean debugging and error handling
 * • No legacy magic-link token handling
 *
 * Keywords: auth-collision-prevention, session-management, hybrid-auth, identity-resolution
 */

import { v } from "convex/values";
import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";

/* -------------------------------------------------------------------------- */
/* 🔧 Re-usable Types                                                         */
/* -------------------------------------------------------------------------- */

export type Provider = "gmail" | "outlook" | "yahoo" | "imap" | "smtp";

export interface SessionIdentity {
  /** Verified e-mail address (Convex or custom) */
  email: string;
  /** Display name (if available) */
  name?: string;
  /** Stable unique identifier (Convex user id or DB id) */
  subject: string;
  /** Source of the session */
  source: "convex";
  /** Token identifier from Convex Auth */
  tokenIdentifier?: string | null;
}

export interface AuthContext {
  session: SessionIdentity | null;
  user: any | null;
  isAuthenticated: boolean;
  authSource: "convex" | null;
}

/* -------------------------------------------------------------------------- */
/* 🪵 Enhanced logging with timestamps and context                           */
/* -------------------------------------------------------------------------- */
export const debug = (context: string, ...args: unknown[]) => {
  if (process.env.NODE_ENV === "development") {
    const timestamp = new Date().toISOString();
    // Debug logging removed for production
  }
};

// No token parsing – Convex Auth only

/* -------------------------------------------------------------------------- */
/* 👤 Enhanced user lookup with error handling                               */
/* -------------------------------------------------------------------------- */
// No token-based user fetch – all access is via ctx.auth in handlers

/* -------------------------------------------------------------------------- */
/* 🏷️ Identity builder with validation                                       */
/* -------------------------------------------------------------------------- */
export const toIdentity = (
  user: any,
  source: SessionIdentity["source"],
  tokenIdentifier?: string
): SessionIdentity => {
  if (!user || !user.email) {
    throw new Error("Invalid user object - missing email");
  }

  const identity: SessionIdentity = {
    email: user.email as string,
    name: (user.name as string) || undefined,
    subject: user._id as string,
    source,
    tokenIdentifier,
  };

  debug("toIdentity", "Created identity:", {
    email: identity.email,
    source: identity.source,
    hasName: !!identity.name,
  });

  return identity;
};

/* -------------------------------------------------------------------------- */
/* 🪄 THE collision-safe session resolver                                     */
/* -------------------------------------------------------------------------- */
export const getSession = async (
  ctx: QueryCtx | ActionCtx | MutationCtx
): Promise<SessionIdentity | null> => {
  const contextType =
    "runQuery" in ctx
      ? "Action"
      : "runMutation" in ctx
        ? "Action"
        : "Query/Mutation";
  debug("getSession", `Starting session resolution in ${contextType}`);
  try {
    const convexIdentity = await ctx.auth.getUserIdentity();
    if (convexIdentity && convexIdentity.email) {
      debug("getSession", "Convex auth successful", {
        email: convexIdentity.email,
      });
      return {
        email: convexIdentity.email,
        name: convexIdentity.name || undefined,
        subject: convexIdentity.tokenIdentifier || (null as unknown as string),
        source: "convex",
        tokenIdentifier: convexIdentity.tokenIdentifier ?? null,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    debug("getSession", "Convex auth error:", errorMessage);
  }
  debug("getSession", "No valid authentication found");
  return null;
};

/* -------------------------------------------------------------------------- */
/* 🔍 Session validation and context building                                */
/* -------------------------------------------------------------------------- */
export const getAuthContext = async (
  ctx: QueryCtx | ActionCtx | MutationCtx
): Promise<AuthContext> => {
  const session = await getSession(ctx);

  if (!session) {
    debug("getAuthContext", "No session available");
    return {
      session: null,
      user: null,
      isAuthenticated: false,
      authSource: null,
    };
  }

  // Fetch full user object for additional context
  let user = null;
  try {
    const db = "db" in ctx ? ctx.db : (ctx as any);
    if (session.source === "convex") {
      // For Convex users, we need to find by email since subject is tokenIdentifier
      user = await db
        .query("users")
        .withIndex("email", (q: any) => q.eq("email", session.email))
        .first();
    }
  } catch (error) {
    debug("getAuthContext", "Error fetching user object:", error);
  }

  const authContext: AuthContext = {
    session,
    user,
    isAuthenticated: true,
    authSource: session.source,
  };

  debug("getAuthContext", "Auth context built:", {
    email: session.email,
    source: session.source,
    hasUser: !!user,
  });

  return authContext;
};

/* -------------------------------------------------------------------------- */
/* 🛡️ Auth guards and validation                                            */
/* -------------------------------------------------------------------------- */
export const requireAuth = async (
  ctx: QueryCtx | ActionCtx | MutationCtx
): Promise<AuthContext> => {
  const authContext = await getAuthContext(ctx);

  if (!authContext.isAuthenticated || !authContext.session) {
    debug("requireAuth", "Authentication required but not found");
    throw new Error("Authentication required. Please sign in to continue.");
  }

  debug("requireAuth", "Authentication validated:", {
    email: authContext.session.email,
    source: authContext.session.source,
  });

  return authContext;
};

export const requireUser = async (
  ctx: QueryCtx | ActionCtx | MutationCtx
): Promise<{ authContext: AuthContext; user: any }> => {
  const authContext = await requireAuth(ctx);

  if (!authContext.user) {
    debug("requireUser", "User object not found in database");
    throw new Error(
      `User not found in database: ${authContext.session!.email}. Please contact support.`
    );
  }

  debug("requireUser", "User validation complete:", {
    userId: authContext.user._id,
    email: authContext.user.email,
  });

  return { authContext, user: authContext.user };
};

/* -------------------------------------------------------------------------- */
/* 📄 Reusable Convex value validators                                       */
/* -------------------------------------------------------------------------- */
export const optionalString = v.optional(v.string());

export const tokenArgs = {} as const;

export const getTokenFromArgs = (
  _args: Record<string, unknown>
): string | undefined => {
  return undefined;
};

/* -------------------------------------------------------------------------- */
/* 🔧 Debugging and monitoring utilities                                     */
/* -------------------------------------------------------------------------- */
export const logAuthState = (
  operation: string,
  authContext: AuthContext,
  additionalData?: Record<string, unknown>
) => {
  debug("AUTH_STATE", `${operation}:`, {
    isAuthenticated: authContext.isAuthenticated,
    authSource: authContext.authSource,
    userEmail: authContext.session?.email,
    userId: authContext.user?._id,
    ...additionalData,
  });
};

export const validateAuthConsistency = (
  operation: string,
  expectedSource: "convex" | "any",
  authContext: AuthContext
) => {
  if (!authContext.isAuthenticated) {
    debug("validateAuthConsistency", `${operation}: Not authenticated`);
    return false;
  }

  if (expectedSource !== "any" && authContext.authSource !== expectedSource) {
    debug("validateAuthConsistency", `${operation}: Auth source mismatch`, {
      expected: expectedSource,
      actual: authContext.authSource,
    });
    return false;
  }

  debug("validateAuthConsistency", `${operation}: Auth consistency validated`);
  return true;
};
