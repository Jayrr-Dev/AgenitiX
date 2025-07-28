import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { AuthResult } from "@/convex/auth";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";

// Simple token management (in production, use secure storage)
const TOKEN_KEY = "agenitix_auth_token";

export const useAuth = () => {
	const [token, setToken] = useState<string | null>(null);

	// Initialize token from localStorage
	useEffect(() => {
		const storedToken = localStorage.getItem(TOKEN_KEY);
		if (storedToken) {
			setToken(storedToken);
		}
	}, []);

	// Get current user
	const user = useQuery(api.auth.getCurrentUser, token ? { token_hash: token } : "skip");

	// Authentication mutations
	const signUpMutation = useMutation(api.auth.signUp);
	const sendMagicLinkMutation = useMutation(api.auth.sendMagicLink);
	const verifyMagicLinkMutation = useMutation(api.auth.verifyMagicLink);
	const signOutMutation = useMutation(api.auth.signOut);
	const updateProfileMutation = useMutation(api.auth.updateProfile);

	// Sign up function with Magic Link
	const signUp = useCallback(
		async (data: {
			email: string;
			name: string;
			company?: string;
			role?: string;
		}) => {
			// Create user account (unverified)
			const result = (await signUpMutation(data)) as AuthResult;

			// Handle Convex errors
			if (!result.success) {
				const error = new Error(result.error.message);
				(error as any).code = result.error.code;
				(error as any).retryAfter = result.error.retryAfter;
				throw error;
			}

			// Send verification email
			try {
				const emailResult = await fetch("/api/auth/send-magic-link", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						email: data.email,
						name: data.name,
						magicToken: result.data.magicToken,
						type: "verification",
					}),
				});

				if (!emailResult.ok) {
					const error = new Error("Failed to send verification email");
					(error as any).code = "EMAIL_SEND_FAILED";
					throw error;
				}

				return {
					...result.data,
					message: "Account created! Check your email to verify and sign in.",
				};
			} catch (emailError) {
				console.error("Email send error:", emailError);
				throw emailError;
			}
		},
		[signUpMutation]
	);

	// Send Magic Link for sign in
	const signIn = useCallback(
		async (data: { email: string }) => {
			// Request magic link from Convex
			const result = (await sendMagicLinkMutation({
				email: data.email,
				type: "login",
			})) as AuthResult;

			// Handle Convex errors
			if (!result.success) {
				const error = new Error(result.error.message);
				(error as any).code = result.error.code;
				(error as any).retryAfter = result.error.retryAfter;
				throw error;
			}

			// Send email with magic link
			try {
				const emailResult = await fetch("/api/auth/send-magic-link", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						email: data.email,
						name: data.email.split("@")[0], // Use email prefix as fallback name
						magicToken: result.data.magicToken,
						type: "login",
					}),
				});

				if (!emailResult.ok) {
					const error = new Error("Failed to send magic link email");
					(error as any).code = "EMAIL_SEND_FAILED";
					throw error;
				}

				return {
					success: true,
					email: data.email,
					message: "Magic link sent! Check your email to sign in.",
				};
			} catch (emailError) {
				console.error("Email send error:", emailError);
				throw emailError;
			}
		},
		[sendMagicLinkMutation]
	);

	// Sign out function
	const signOut = useCallback(async () => {
		try {
			if (token) {
				await signOutMutation({ token_hash: token });
			}
			setToken(null);
			localStorage.removeItem(TOKEN_KEY);
		} catch (error) {
			console.error("Sign out error:", error);
			// Still clear local state even if server call fails
			setToken(null);
			localStorage.removeItem(TOKEN_KEY);
		}
	}, [signOutMutation, token]);

	// Verify Magic Link and sign in
	const verifyMagicLink = useCallback(
		async (magicToken: string, ipAddress?: string, userAgent?: string) => {
			const result = (await verifyMagicLinkMutation({
				token: magicToken,
				ip_address: ipAddress,
				user_agent: userAgent,
			})) as AuthResult;

			// Handle Convex errors
			if (!result.success) {
				const error = new Error(result.error.message);
				(error as any).code = result.error.code;
				throw error;
			}

			// Set session token
			const sessionToken = result.data.sessionToken;
			setToken(sessionToken);
			localStorage.setItem(TOKEN_KEY, sessionToken);

			return result.data;
		},
		[verifyMagicLinkMutation]
	);

	// Update profile function
	const updateProfile = useCallback(
		async (data: {
			name?: string;
			company?: string;
			role?: string;
			timezone?: string;
		}) => {
			if (!token) {
				throw new Error("Not authenticated");
			}

			try {
				return await updateProfileMutation({
					token_hash: token,
					...data,
				});
			} catch (error) {
				console.error("Update profile error:", error);
				throw error;
			}
		},
		[updateProfileMutation, token]
	);

	const isAuthenticated = !!user && !!token;

	return {
		// State
		user,
		isLoading: user === undefined && token !== null,
		isAuthenticated,
		token,

		// Actions
		signUp,
		signIn,
		verifyMagicLink,
		signOut,
		updateProfile,
	};
};

// Hook for getting user sessions (security management)
export const useUserSessions = () => {
	const [token, setToken] = useState<string | null>(null);

	useEffect(() => {
		const storedToken = localStorage.getItem(TOKEN_KEY);
		if (storedToken) {
			setToken(storedToken);
		}
	}, []);

	const sessions = useQuery(api.auth.getUserSessions, token ? { token_hash: token } : "skip");

	const revokeSessionMutation = useMutation(api.auth.revokeSession);

	const revokeSession = useCallback(
		async (sessionId: Id<"auth_sessions">) => {
			if (!token) {
				throw new Error("Not authenticated");
			}

			try {
				return await revokeSessionMutation({
					token_hash: token,
					session_id: sessionId,
				});
			} catch (error) {
				console.error("Revoke session error:", error);
				throw error;
			}
		},
		[revokeSessionMutation, token]
	);

	return {
		sessions,
		isLoading: sessions === undefined && token !== null,
		revokeSession,
	};
};
