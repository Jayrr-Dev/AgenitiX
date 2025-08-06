import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";

interface AuthError extends Error {
	code?: string;
	retryAfter?: number;
}

interface AuthResult<T> {
	success: boolean;
	data?: T;
	error?: {
		code: string;
		message: string;
		retryAfter?: number;
	};
}

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
	const user = useQuery(api.authFunctions.getCurrentUser, token ? { token_hash: token } : "skip");

	// Authentication mutations
	const signUpMutation = useMutation(api.authFunctions.signUp);
	const sendMagicLinkMutation = useMutation(api.authFunctions.sendMagicLink);
	const verifyMagicLinkMutation = useMutation(api.authFunctions.verifyMagicLink);
	const signOutMutation = useMutation(api.authFunctions.signOut);
	const updateProfileMutation = useMutation(api.authFunctions.updateProfile);

	// Sign up function with Magic Link
	const signUp = useCallback(
		async (data: {
			email: string;
			name: string;
			company?: string;
			role?: string;
		}) => {
			// Create user account (unverified)
			const result = (await signUpMutation(data)) as AuthResult<{
				magicToken: string;
				userId: string;
				email: string;
				name: string;
			}>;

			// Handle Convex errors
			if (!result.success) {
				const error = new Error(result.error?.message || "Authentication failed");
				(error as AuthError).code = result.error?.code;
				(error as AuthError).retryAfter = result.error?.retryAfter;
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
						magicToken: result.data?.magicToken,
						type: "verification",
					}),
				});

				if (!emailResult.ok) {
					const error = new Error("Failed to send verification email");
					(error as AuthError).code = "EMAIL_SEND_FAILED";
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
				type: "login", // Changed from "verification" to "login" for sign in
			})) as AuthResult<{ magicToken: string }>;

			// Handle Convex errors
			if (!result.success) {
				const error = new Error(result.error?.message || "Authentication failed");
				(error as AuthError).code = result.error?.code;
				(error as AuthError).retryAfter = result.error?.retryAfter;
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
						magicToken: result.data?.magicToken,
						type: "login",
					}),
				});

				if (!emailResult.ok) {
					const error = new Error("Failed to send magic link email");
					(error as AuthError).code = "EMAIL_SEND_FAILED";
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
			})) as AuthResult<{
				sessionToken: string;
				user: { id: string; email: string; name: string };
			}>;

			// Handle Convex errors
			if (!result.success) {
				const error = new Error(result.error?.message || "Verification failed");
				(error as AuthError).code = result.error?.code || "VERIFICATION_ERROR";
				throw error;
			}

			// Set session token
			const sessionToken = result.data?.sessionToken;
			if (sessionToken) {
				setToken(sessionToken);
				localStorage.setItem(TOKEN_KEY, sessionToken);
			}

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

	// Session management is now handled through Convex Auth

	return {
		// Session management now handled by Convex Auth
		sessions: [], // Deprecated
		isLoading: false, // Simplified for now
	};
};
