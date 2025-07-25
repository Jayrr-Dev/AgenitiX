import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCallback, useEffect, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";

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
	const user = useQuery(
		api.auth.getCurrentUser,
		token ? { token_hash: token } : "skip"
	);

	// Authentication mutations
	const signUpMutation = useMutation(api.auth.signUp);
	const sendMagicLinkMutation = useMutation(api.auth.sendMagicLink);
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
			try {
				// Create user account (unverified)
				const result = await signUpMutation(data);
				
				// Send verification email
				const emailResult = await fetch('/api/auth/send-magic-link', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						email: data.email,
						name: data.name,
						magicToken: result.magicToken,
						type: 'verification',
					}),
				});

				if (!emailResult.ok) {
					throw new Error('Failed to send verification email');
				}

				const emailData = await emailResult.json();
				
				// In development, show magic link in console
				if (process.env.NODE_ENV === 'development' && emailData.magicLinkUrl) {
					console.log('🔗 MAGIC LINK FOR TESTING:', emailData.magicLinkUrl);
					console.log('👆 Click this link to verify your account');
				}
				
				return { 
					...result, 
					needsVerification: true,
					message: 'Account created! Check your email to verify and sign in.'
				};
			} catch (error) {
				console.error("Sign up error:", error);
				throw error;
			}
		},
		[signUpMutation]
	);

	// Send Magic Link for sign in
	const signIn = useCallback(
		async (data: { email: string }) => {
			try {
				// Request magic link from Convex
				const result = await sendMagicLinkMutation({
					email: data.email,
					type: 'login',
				});
				
				// Send email with magic link
				const emailResult = await fetch('/api/auth/send-magic-link', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						email: data.email,
						name: data.email.split('@')[0], // Use email prefix as fallback name
						magicToken: result.magicToken,
						type: 'login',
					}),
				});

				if (!emailResult.ok) {
					throw new Error('Failed to send magic link email');
				}
				
				return { 
					success: true,
					email: data.email,
					message: 'Magic link sent! Check your email to sign in.'
				};
			} catch (error) {
				console.error("Sign in error:", error);
				throw error;
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

	return {
		// State
		user,
		isLoading: user === undefined && token !== null,
		isAuthenticated: !!user && !!token,
		token,

		// Actions
		signUp,
		signIn,
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

	const sessions = useQuery(
		api.auth.getUserSessions,
		token ? { token_hash: token } : "skip"
	);

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