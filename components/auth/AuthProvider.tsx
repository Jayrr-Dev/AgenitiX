"use client";

import { useAuth } from "@/hooks/useAuth";
import { useConvexAuth } from "@/hooks/useConvexAuth";
import { useAuthActions, useAuthToken } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { type ReactNode, createContext, useContext, useEffect } from "react";

type AuthContextType = ReturnType<typeof useAuth> & ReturnType<typeof useConvexAuth> & {
	isOAuthAuthenticated: boolean;
	authToken: string | null;
	// Override signOut with our combined function type, basically unified logout
	signOut: () => Promise<void>;
	// Add user property for Convex Auth user
	user?: {
		id: string;
		name?: string;
		email?: string;
		image?: string;
	} | null;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuthContext = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuthContext must be used within AuthProvider");
	}
	return context;
};

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
	const auth = useAuth();
	const convexAuth = useConvexAuth();
	const authToken = useAuthToken();
	const { signIn: convexSignIn } = useAuthActions();
	
	// Check if user is authenticated via OAuth, basically modern authentication using Convex Auth
	const isOAuthAuthenticated = !!authToken;
	
	// Clear conflicting Supabase auth tokens on mount, basically clean slate for Convex Auth
	useEffect(() => {
		const supabaseCookies = document.cookie.split(';').filter(cookie => 
			cookie.trim().startsWith('sb-nobcxrkriivdlksjnlef-auth-token')
		);
		
		if (supabaseCookies.length > 0) {
			console.log("🧹 Clearing conflicting Supabase auth tokens...");
			// Clear Supabase cookies by setting them to expire
			supabaseCookies.forEach(cookie => {
				const name = cookie.split('=')[0].trim();
				document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
			});
		}
	}, []);

	// Watch for auth state changes and check for successful OAuth callback
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const authCode = urlParams.get('code');
		const state = urlParams.get('state');
		
		if (process.env.NODE_ENV === "development") {
			console.log("🔄 Auth State Change:", {
				isOAuthAuthenticated,
				authToken: !!authToken,
				magicLinkAuth: auth.isAuthenticated,
				magicLinkLoading: auth.isLoading,
				hasAuthCode: !!authCode,
				authCode: authCode,
				state: state,
				url: window.location.href,
				cookies: document.cookie,
				localStorage: Object.keys(localStorage).filter(key => 
					key.includes('auth') || key.includes('convex') || key.includes('token')
				).map(key => ({
					key,
					value: localStorage.getItem(key)?.substring(0, 200) + "..." // Show more detail for auth tokens
				})),
				// Check for specific Convex auth tokens
				convexJWT: localStorage.getItem('__convexAuthJWT_httpsveraciousparakeet120convexcloud'),
				convexRefreshToken: localStorage.getItem('__convexAuthRefreshToken_httpsveraciousparakeet120convexcloud'),
			});
		}

		// If we have an auth code but haven't processed it yet, wait a bit longer
		if (authCode && !authToken) {
			console.log("⏳ OAuth callback detected, waiting for authentication to complete...");
			console.log("🔍 Auth Code Details:", {
				authCode,
				state,
				authToken: !!authToken,
			});
		}

		// If we have a JWT token but aren't authenticated, log it but don't clear immediately
		const convexJWT = localStorage.getItem('__convexAuthJWT_httpsveraciousparakeet120convexcloud');
		if (convexJWT && convexJWT !== 'undefined' && !authToken) {
			console.log("⚠️ Found Convex JWT token but user not authenticated");
			console.log("🔐 JWT Token (first 50 chars):", convexJWT.substring(0, 50) + "...");
			console.log("💡 This might resolve automatically - waiting for auth state to update...");
		}
	}, [isOAuthAuthenticated, authToken, auth.isAuthenticated, auth.isLoading]);

	// Extract user ID from OAuth token if available, basically get the real user identifier
	const oauthUserId = isOAuthAuthenticated && authToken
		? (() => {
			try {
				const tokenPayload = JSON.parse(atob(authToken.split('.')[1]));
				const fullSubject = tokenPayload.sub;
				return fullSubject.includes('|') ? fullSubject.split('|')[0] : fullSubject;
			} catch (error) {
				console.error("Failed to decode JWT token:", error);
				return null;
			}
		})()
		: null;

	// Fetch real user data from Convex database for OAuth users, basically get actual profile information  
	const oauthUserData = useQuery(
		api.users.getUserById,
		oauthUserId ? { userId: oauthUserId as any } : "skip"
	);

	// Create a unified user object - prefer Convex Auth user if available, fallback to magic link user
	const user = isOAuthAuthenticated && oauthUserId
		? (() => {
			// Use real user data from database if available, otherwise fallback to JWT info
			if (oauthUserData) {
				return {
					id: oauthUserId,
					name: oauthUserData.name || "GitHub User",
					email: oauthUserData.email || "github-user@oauth.local",
					image: oauthUserData.avatar_url,
				};
			}
			
			// Fallback while loading user data
			return {
				id: oauthUserId,
				name: "Loading...",
				email: "Loading...",
			};
		})()
		: auth.user;

	// Debug logging for auth state
	if (process.env.NODE_ENV === "development") {
		console.log("AuthProvider Debug:", {
			isOAuthAuthenticated,
			authToken: !!authToken,
			magicLinkAuth: auth.isAuthenticated,
			magicLinkLoading: auth.isLoading,
			authTokenValue: authToken ? authToken.substring(0, 50) + "..." : null,
			userId: user?.id,
			userObject: user,
		});
	}

	// Combined sign out function that handles both authentication methods, basically unified logout
	const combinedSignOut = async () => {
		try {
			console.log("🚪 Starting combined sign out...");
			
			// Sign out from OAuth if authenticated via OAuth
			if (isOAuthAuthenticated) {
				console.log("🔑 Signing out from OAuth...");
				await convexAuth.signOutOAuth();
			}
			
			// Sign out from magic link auth if authenticated via magic link
			if (auth.isAuthenticated) {
				console.log("✉️ Signing out from magic link auth...");
				await auth.signOut();
			}
			
			// Clear all auth-related localStorage items, basically complete cleanup
			const authKeys = [
				'__convexAuthJWT_httpsveraciousparakeet120convexcloud',
				'__convexAuthRefreshToken_httpsveraciousparakeet120convexcloud',
				'agenitix_auth_token',
				'convex-auth-token',
			];
			
			authKeys.forEach(key => {
				if (localStorage.getItem(key)) {
					localStorage.removeItem(key);
					console.log(`🧹 Cleared ${key}`);
				}
			});
			
			// Force reload to ensure complete state reset
			window.location.href = '/';
			
		} catch (error) {
			console.error("❌ Sign out error:", error);
			// Force clear everything even if sign out calls fail
			localStorage.clear();
			window.location.href = '/';
		}
	};

	const combinedAuth = {
		...auth,
		...convexAuth,
		authToken,
		isOAuthAuthenticated,
		user,
		// Override isAuthenticated to check both auth methods
		isAuthenticated: auth.isAuthenticated || isOAuthAuthenticated,
		// Use our combined sign out function instead of individual ones
		signOut: combinedSignOut,
	};

	return <AuthContext.Provider value={combinedAuth as unknown as AuthContextType}>{children}</AuthContext.Provider>;
};
