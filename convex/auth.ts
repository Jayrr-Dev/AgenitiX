import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
export type AuthErrorCode =
	| "USER_NOT_FOUND"
	| "RATE_LIMIT_EXCEEDED"
	| "INVALID_MAGIC_LINK"
	| "EXPIRED_MAGIC_LINK"
	| "USER_ALREADY_EXISTS"
	| "EMAIL_SEND_FAILED"
	| "UNKNOWN_ERROR";

export type AuthError = {
	code: AuthErrorCode;
	message: string;
	retryAfter?: number; // Minutes until user can try again
};

export type AuthResult<T = unknown> =
	| {
			success: true;
			data: T;
	  }
	| {
			success: false;
			error: AuthError;
	  };

// Generate secure random token
function generateMagicToken(): string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";
	for (let i = 0; i < 32; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

// Función de utilidad para normalizar correos electrónicos
function normalizeEmail(email: string): string {
	return email.toLowerCase().trim();
}

// Check if user exists (for better UX)
export const checkUserExists = query({
	args: { email: v.string() },
	handler: async (ctx, args) => {
		const normalizedEmail = normalizeEmail(args.email);

		const user = await ctx.db
			.query("auth_users")
			.withIndex("by_email", (q) => q.eq("email", normalizedEmail))
			.first();

		return {
			exists: !!user,
			isActive: user?.is_active ?? false,
		};
	},
});

// User Registration with Magic Link
export const signUp = mutation({
	args: {
		email: v.string(),
		name: v.string(),
		company: v.optional(v.string()),
		role: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const normalizedEmail = normalizeEmail(args.email);

		// Check if user already exists
		const existingUser = await ctx.db
			.query("auth_users")
			.withIndex("by_email", (q) => q.eq("email", normalizedEmail))
			.first();

		if (existingUser) {
			return {
				success: false,
				error: {
					code: "USER_ALREADY_EXISTS" as const,
					message: "An account with this email already exists. Please sign in instead.",
				},
			};
		}

		// Generate magic link token
		const magicToken = generateMagicToken();
		const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

		// Create new user (unverified)
		const userId = await ctx.db.insert("auth_users", {
			email: normalizedEmail,
			name: args.name,
			company: args.company,
			role: args.role,
			email_verified: false,
			is_active: true,
			created_at: Date.now(),
			updated_at: Date.now(),
			magic_link_token: magicToken,
			magic_link_expires: expiresAt,
			login_attempts: 0,
		});

		return {
			success: true,
			data: {
				userId,
				email: normalizedEmail,
				name: args.name,
				magicToken,
				needsVerification: true,
			},
		};
	},
});

// Send Magic Link (for login or verification)
export const sendMagicLink = mutation({
	args: {
		email: v.string(),
		type: v.union(v.literal("login"), v.literal("verification")),
	},
	handler: async (ctx, args) => {
		const normalizedEmail = normalizeEmail(args.email);

		// Find user
		const user = await ctx.db
			.query("auth_users")
			.withIndex("by_email", (q) => q.eq("email", normalizedEmail))
			.first();

		if (!user) {
			return {
				success: false,
				error: {
					code: "USER_NOT_FOUND" as const,
					message: "No account found with this email address. Please create an account first.",
				},
			};
		}

		// Check rate limiting (max 3 attempts per hour)
		const oneHourAgo = Date.now() - 60 * 60 * 1000;
		const currentAttempts = user.login_attempts || 0;
		const lastAttempt = user.last_login_attempt || 0;

		// Reset attempts if more than an hour has passed
		let attemptsToUse = currentAttempts;
		if (lastAttempt < oneHourAgo) {
			attemptsToUse = 0;
		}

		// Check if user has exceeded rate limit
		if (attemptsToUse >= 3) {
			const timeUntilReset = Math.ceil((lastAttempt + 60 * 60 * 1000 - Date.now()) / (60 * 1000));
			return {
				success: false,
				error: {
					code: "RATE_LIMIT_EXCEEDED" as const,
					message: `Too many attempts. Please try again in ${timeUntilReset} minutes.`,
					retryAfter: timeUntilReset,
				},
			};
		}

		// Generate new magic link token
		const magicToken = generateMagicToken();
		const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

		// Update user with new token and increment attempts
		const newAttempts = lastAttempt < oneHourAgo ? 1 : attemptsToUse + 1;

		await ctx.db.patch(user._id, {
			magic_link_token: magicToken,
			magic_link_expires: expiresAt,
			login_attempts: newAttempts,
			last_login_attempt: Date.now(),
			updated_at: Date.now(),
		});

		return {
			success: true,
			data: {
				email: args.email,
				magicToken,
				type: args.type,
			},
		};
	},
});

// Verify Magic Link and Sign In
export const verifyMagicLink = mutation({
	args: {
		token: v.string(),
		ip_address: v.optional(v.string()),
		user_agent: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Find user by magic link token
		const user = await ctx.db
			.query("auth_users")
			.withIndex("by_magic_link_token", (q) => q.eq("magic_link_token", args.token))
			.first();

		if (!user?.is_active) {
			return {
				success: false,
				error: {
					code: "INVALID_MAGIC_LINK" as const,
					message: "Invalid magic link. Please request a new one.",
				},
			};
		}

		// Check if token is expired
		if (!user.magic_link_expires || user.magic_link_expires < Date.now()) {
			return {
				success: false,
				error: {
					code: "EXPIRED_MAGIC_LINK" as const,
					message: "Magic link has expired. Please request a new one.",
				},
			};
		}

		// Generate session token
		const sessionToken = `session_${user._id}_${Date.now()}`;

		// Create session
		const sessionId = await ctx.db.insert("auth_sessions", {
			user_id: user._id,
			token_hash: sessionToken,
			expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
			created_at: Date.now(),
			ip_address: args.ip_address,
			user_agent: args.user_agent,
			is_active: true,
		});

		// Update user: verify email, clear magic link, reset attempts
		await ctx.db.patch(user._id, {
			email_verified: true,
			last_login: Date.now(),
			updated_at: Date.now(),
			magic_link_token: undefined,
			magic_link_expires: undefined,
			login_attempts: 0,
		});

		return {
			success: true,
			data: {
				user: {
					id: user._id,
					email: user.email,
					name: user.name,
					company: user.company,
					role: user.role,
					email_verified: true,
				},
				sessionToken,
				sessionId,
			},
		};
	},
});

// Legacy signIn for backward compatibility (will be removed)
export const signIn = mutation({
	args: {
		email: v.string(),
		token_hash: v.string(),
		ip_address: v.optional(v.string()),
		user_agent: v.optional(v.string()),
	},
	handler: () => {
		// This is now just for backward compatibility
		// In production, this should redirect to magic link flow
		throw new Error("Please use magic link authentication");
	},
});

// Get Current User (from session)
export const getCurrentUser = query({
	args: { token_hash: v.optional(v.string()) },
	handler: async (ctx, args) => {
		if (!args.token_hash) {
			return null;
		}

		// Find active session
		const session = await ctx.db
			.query("auth_sessions")
			.withIndex("by_token_hash", (q) => q.eq("token_hash", args.token_hash || ""))
			.filter((q) => q.eq(q.field("is_active"), true))
			.filter((q) => q.gt(q.field("expires_at"), Date.now()))
			.unique();

		if (!session) {
			return null;
		}

		// Get user data
		const user = await ctx.db.get(session.user_id);
		if (!user?.is_active) {
			return null;
		}

		return {
			id: user._id,
			email: user.email,
			name: user.name,
			company: user.company,
			role: user.role,
			avatar_url: user.avatar_url,
			email_verified: user.email_verified,
			last_login: user.last_login,
		};
	},
});

// Sign Out
export const signOut = mutation({
	args: { token_hash: v.string() },
	handler: async (ctx, args) => {
		// Find and deactivate session
		const session = await ctx.db
			.query("auth_sessions")
			.withIndex("by_token_hash", (q) => q.eq("token_hash", args.token_hash))
			.first();

		if (session) {
			await ctx.db.patch(session._id, {
				is_active: false,
			});
		}

		return { success: true };
	},
});

// Update User Profile
export const updateProfile = mutation({
	args: {
		token_hash: v.string(),
		name: v.optional(v.string()),
		company: v.optional(v.string()),
		role: v.optional(v.string()),
		timezone: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Get current user from session
		const session = await ctx.db
			.query("auth_sessions")
			.withIndex("by_token_hash", (q) => q.eq("token_hash", args.token_hash))
			.filter((q) => q.eq(q.field("is_active"), true))
			.filter((q) => q.gt(q.field("expires_at"), Date.now()))
			.first();

		if (!session) {
			throw new Error("Invalid session");
		}

		// Update user profile
		const updateData: Record<string, unknown> = { updated_at: Date.now() };
		if (args.name !== undefined) {
			updateData.name = args.name;
		}
		if (args.company !== undefined) {
			updateData.company = args.company;
		}
		if (args.role !== undefined) {
			updateData.role = args.role;
		}
		if (args.timezone !== undefined) {
			updateData.timezone = args.timezone;
		}

		await ctx.db.patch(session.user_id, updateData);

		return { success: true };
	},
});

// Get User Sessions (for security/account management)
export const getUserSessions = query({
	args: { token_hash: v.string() },
	handler: async (ctx, args) => {
		// Get current user
		const session = await ctx.db
			.query("auth_sessions")
			.withIndex("by_token_hash", (q) => q.eq("token_hash", args.token_hash))
			.filter((q) => q.eq(q.field("is_active"), true))
			.first();

		if (!session) {
			throw new Error("Invalid session");
		}

		// Get all active sessions for this user
		const sessions = await ctx.db
			.query("auth_sessions")
			.withIndex("by_user_id", (q) => q.eq("user_id", session.user_id))
			.filter((q) => q.eq(q.field("is_active"), true))
			.collect();

		return sessions.map((s) => ({
			id: s._id,
			created_at: s.created_at,
			ip_address: s.ip_address,
			user_agent: s.user_agent,
			is_current: s._id === session._id,
		}));
	},
});

// Revoke Session (for security)
export const revokeSession = mutation({
	args: {
		token_hash: v.string(),
		session_id: v.id("auth_sessions"),
	},
	handler: async (ctx, args) => {
		// Verify current user owns the session to revoke
		const currentSession = await ctx.db
			.query("auth_sessions")
			.withIndex("by_token_hash", (q) => q.eq("token_hash", args.token_hash))
			.filter((q) => q.eq(q.field("is_active"), true))
			.first();

		if (!currentSession) {
			throw new Error("Invalid session");
		}

		const sessionToRevoke = await ctx.db.get(args.session_id);
		if (!sessionToRevoke || sessionToRevoke.user_id !== currentSession.user_id) {
			throw new Error("Session not found or unauthorized");
		}

		// Revoke the session
		await ctx.db.patch(args.session_id, { is_active: false });

		return { success: true };
	},
});

// Development helper: Reset rate limits (only available in development)
export const resetRateLimits = mutation({
	args: { email: v.string() },
	handler: async (ctx, args) => {
		// Only allow in development
		if (process.env.NODE_ENV === "production") {
			throw new Error("This function is only available in development");
		}

		const user = await ctx.db
			.query("auth_users")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.first();

		if (!user) {
			throw new Error("User not found");
		}

		// Reset rate limiting
		await ctx.db.patch(user._id, {
			login_attempts: 0,
			last_login_attempt: undefined,
			updated_at: Date.now(),
		});

		return { success: true, message: "Rate limits reset" };
	},
});

// Migration helper: Normalize all user emails to lowercase
export const normalizeUserEmails = mutation({
	args: {},
	handler: async (ctx, _args) => {
		const users = await ctx.db.query("auth_users").collect();

		let updatedCount = 0;

		for (const user of users) {
			const normalizedEmail = user.email.toLowerCase().trim();
			if (user.email !== normalizedEmail) {
				await ctx.db.patch(user._id, {
					email: normalizedEmail,
					updated_at: Date.now(),
				});
				updatedCount++;
			}
		}

		return {
			success: true,
			message: `Normalized ${updatedCount} user emails to lowercase`,
			totalUsers: users.length,
			updatedUsers: updatedCount,
		};
	},
});
