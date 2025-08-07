/**
 * Route: convex/authHelpers.ts
 * AUTH HELPERS - Collision-safe authentication utilities
 *
 * • Prevents auth system collisions between Convex OAuth and email OAuth
 * • Priority-based session resolution (Convex first, then custom tokens)
 * • Type-safe identity management with source tracking
 * • Comprehensive debugging and error handling
 * • Eliminates token format conflicts and auth override issues
 *
 * Keywords: auth-collision-prevention, session-management, hybrid-auth, identity-resolution
 */

import { api } from "./_generated/api";
import { v } from "convex/values";
import type { 
  DatabaseReader, 
  DatabaseWriter, 
  QueryCtx, 
  ActionCtx,
  MutationCtx 
} from "./_generated/server";

/* -------------------------------------------------------------------------- */
/* 🔧 Re-usable Types                                                         */
/* -------------------------------------------------------------------------- */

export type Provider =
  | "gmail"
  | "outlook" 
  | "yahoo"
  | "imap"
  | "smtp";

export interface SessionIdentity {
  /** Verified e-mail address (Convex or custom) */
  email: string;
  /** Display name (if available) */
  name?: string;
  /** Stable unique identifier (Convex user id or DB id) */
  subject: string;
  /** Source of the session - CRITICAL for collision prevention */
  source: "convex" | "custom";
  /** Raw token identifier for debugging */
  tokenIdentifier?: string;
}

export interface AuthContext {
  session: SessionIdentity | null;
  user: any | null;
  isAuthenticated: boolean;
  authSource: "convex" | "custom" | null;
}

/* -------------------------------------------------------------------------- */
/* 🪵 Enhanced logging with timestamps and context                           */
/* -------------------------------------------------------------------------- */
export const debug = (context: string, ...args: unknown[]) => {
  if (process.env.NODE_ENV === "development") {
    const timestamp = new Date().toISOString();
    // eslint-disable-next-line no-console
    console.log(`🔐 [${timestamp}] [${context}]`, ...args);
  }
};

/* -------------------------------------------------------------------------- */
/* 🎟️ Enhanced token parsing with validation                                */
/* -------------------------------------------------------------------------- */

const CONVEX_PREFIX = "convex_user_";

export const parseToken = (token?: string) => {
  if (!token || typeof token !== "string") {
    debug("parseToken", "No token provided or invalid type");
    return null;
  }

  if (token.startsWith(CONVEX_PREFIX)) {
    const id = token.slice(CONVEX_PREFIX.length);
    debug("parseToken", "Convex token detected:", { id: id.substring(0, 10) + "..." });
    return { kind: "convex" as const, id };
  }

  debug("parseToken", "Magic link token detected:", { hash: token.substring(0, 10) + "..." });
  return { kind: "magic" as const, hash: token };
};

export const isValidToken = (token?: string): boolean => {
  if (!token) return false;
  const parsed = parseToken(token);
  return parsed !== null;
};

/* -------------------------------------------------------------------------- */
/* 👤 Enhanced user lookup with error handling                               */
/* -------------------------------------------------------------------------- */
export const fetchUserByToken = async (
  db: DatabaseReader | DatabaseWriter,
  token?: string,
): Promise<any | null> => {
  const parsed = parseToken(token);
  if (!parsed) {
    debug("fetchUserByToken", "Invalid token format");
    return null;
  }

  try {
    if (parsed.kind === "convex") {
      debug("fetchUserByToken", "Fetching Convex user:", { id: parsed.id });
      const user = await db.get(parsed.id as any);
      if (user) {
        debug("fetchUserByToken", "Convex user found:", { 
          email: (user as any).email || "no-email" 
        });
      } else {
        debug("fetchUserByToken", "Convex user not found");
      }
      return user;
    }

    /* Magic-link lookup with enhanced filtering */
    debug("fetchUserByToken", "Fetching magic link user");
    const user = await db
      .query("users")
      .filter((q) => q.eq(q.field("magic_link_token"), parsed.hash))
      .filter((q) => q.eq(q.field("is_active"), true))
      .filter((q) =>
        q.or(
          q.eq(q.field("magic_link_expires"), null),
          q.gt(q.field("magic_link_expires"), Date.now())
        )
      )
      .first();

    if (user) {
      debug("fetchUserByToken", "Magic link user found:", { 
        email: (user as any).email || "no-email" 
      });
    } else {
      debug("fetchUserByToken", "Magic link user not found or expired");
    }
    
    return user;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    debug("fetchUserByToken", "Error fetching user:", errorMessage);
    return null;
  }
};

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
    name: user.name as string || undefined,
    subject: user._id as string,
    source,
    tokenIdentifier,
  };

  debug("toIdentity", "Created identity:", {
    email: identity.email,
    source: identity.source,
    hasName: !!identity.name
  });

  return identity;
};

/* -------------------------------------------------------------------------- */
/* 🪄 THE collision-safe session resolver                                     */
/* -------------------------------------------------------------------------- */
export const getSession = async (
  ctx: QueryCtx | ActionCtx | MutationCtx,
  token?: string,
): Promise<SessionIdentity | null> => {
  const contextType = "runQuery" in ctx ? "Action" : "runMutation" in ctx ? "Action" : "Query/Mutation";
  debug("getSession", `Starting session resolution in ${contextType}`, { 
    hasToken: !!token,
    tokenType: token ? parseToken(token)?.kind : "none"
  });

  /* 1️⃣ Try Convex auth first (PRIORITY - prevents collisions) */
  try {
    const convexIdentity = await ctx.auth.getUserIdentity();
    console.log('🔍 getSession: Convex auth result:', {
      hasIdentity: !!convexIdentity,
      email: convexIdentity?.email,
      tokenIdentifier: convexIdentity?.tokenIdentifier,
      name: convexIdentity?.name
    });
    
    if (convexIdentity && convexIdentity.email) {
      debug("getSession", "✅ Convex auth successful:", { 
        email: convexIdentity.email,
        tokenIdentifier: convexIdentity.tokenIdentifier
      });
      
      return {
        email: convexIdentity.email,
        name: convexIdentity.name || undefined,
        subject: convexIdentity.tokenIdentifier!,
        source: "convex",
        tokenIdentifier: convexIdentity.tokenIdentifier,
      };
    }
    debug("getSession", "Convex auth returned empty identity");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log('🔍 getSession: Convex auth error:', errorMessage);
    debug("getSession", "⚠️ Convex auth unavailable:", errorMessage);
  }

  /* 2️⃣ Fallback to custom token ONLY if no Convex auth */
  if (token) {
    debug("getSession", "🎫 Attempting custom token authentication");
    
    try {
      const db = "db" in ctx ? ctx.db : ctx as any; // Handle different context types
      const user = await fetchUserByToken(db, token);
      
      if (user) {
        debug("getSession", "✅ Custom auth successful:", { email: user.email });
        return toIdentity(user, "custom", token);
      }
      
      debug("getSession", "❌ Custom token invalid or user not found");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      debug("getSession", "❌ Custom auth error:", errorMessage);
    }
  }

  debug("getSession", "🚫 No valid authentication found");
  return null;
};

/* -------------------------------------------------------------------------- */
/* 🔍 Session validation and context building                                */
/* -------------------------------------------------------------------------- */
export const getAuthContext = async (
  ctx: QueryCtx | ActionCtx | MutationCtx,
  token?: string,
): Promise<AuthContext> => {
  const session = await getSession(ctx, token);
  
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
    const db = "db" in ctx ? ctx.db : ctx as any;
    
    if (session.source === "convex") {
      // For Convex users, we need to find by email since subject is tokenIdentifier
      user = await db
        .query("users")
        .withIndex("email", (q: any) => q.eq("email", session.email))
        .first();
    } else {
      // For custom users, subject is the user ID
      user = await db.get(session.subject as any);
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
  ctx: QueryCtx | ActionCtx | MutationCtx,
  token?: string,
): Promise<AuthContext> => {
  const authContext = await getAuthContext(ctx, token);
  
  if (!authContext.isAuthenticated || !authContext.session) {
    debug("requireAuth", "Authentication required but not found");
    throw new Error(
      "Authentication required. Please sign in to continue."
    );
  }

  debug("requireAuth", "Authentication validated:", {
    email: authContext.session.email,
    source: authContext.session.source,
  });

  return authContext;
};

export const requireUser = async (
  ctx: QueryCtx | ActionCtx | MutationCtx,
  token?: string,
): Promise<{ authContext: AuthContext; user: any }> => {
  const authContext = await requireAuth(ctx, token);
  
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

export const tokenArgs = {
  token_hash: optionalString,
  sessionToken: optionalString,
};

export const getTokenFromArgs = (args: { token_hash?: string; sessionToken?: string }): string | undefined => {
  const token = args.token_hash || args.sessionToken;
  debug("getTokenFromArgs", "Extracting token:", { 
    hasTokenHash: !!args.token_hash,
    hasSessionToken: !!args.sessionToken,
    resultToken: token ? parseToken(token)?.kind : "none"
  });
  return token;
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
  expectedSource: "convex" | "custom" | "any",
  authContext: AuthContext,
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