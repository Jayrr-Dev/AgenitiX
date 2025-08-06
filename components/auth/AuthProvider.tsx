"use client";

import { useConvexAuth as useConvexAuthFromHook } from "@/hooks/useConvexAuth";
import { useAuthActions, useAuthToken } from "@convex-dev/auth/react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { type ReactNode, createContext, useContext, useEffect, useMemo, useRef, useCallback } from "react";

type AuthContextType = ReturnType<typeof useConvexAuth> & {
	isAuthenticated: boolean;
	isOAuthAuthenticated: boolean;
	authToken: string | null;
	isLoading: boolean;
	// Override signOut with our combined function type, basically unified logout
	signOut: () => Promise<void>;
	// Add user property for Convex Auth user
	user?: {
		id: string;
		name?: string;
		email?: string;
		image?: string;
	} | null;
	// 🎯 COLLISION PREVENTION - Session tracking and recovery
	sessionSource: "convex" | null;
	recoverAuth: () => boolean;
	// Legacy functions for backwards compatibility (but using new system)
	signIn: (params: { email: string }) => Promise<any>;
	signUp: (params: { email: string; name: string; company?: string; role?: string }) => Promise<any>;
	verifyMagicLink: (token: string, ip?: string, userAgent?: string) => Promise<any>;
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
	const convexOAuthMethods = useConvexAuthFromHook();
	const convexAuthState = useConvexAuth();
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
	}, [isOAuthAuthenticated, authToken]);

	// Listen for messages from OAuth popups to preserve session with ENHANCED RECOVERY
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			console.log("📨 AuthProvider received message:", event.data, "from:", event.origin);
			if (event.origin !== window.location.origin) {
				console.log("❌ Ignoring message from different origin");
				return;
			}
			
			if (event.data?.type === 'PRESERVE_SESSION') {
				console.log("🔄 CRITICAL: Preserving session after OAuth popup - initiating recovery");
				
				// ENHANCED RECOVERY STRATEGY
				const currentAuth = {
					isAuthenticated: isOAuthAuthenticated,
					hasTokens: !!localStorage.getItem('__convexAuthJWT_httpsveraciousparakeet120convexcloud')
				};
				
				console.log("🔍 Current auth state before recovery:", currentAuth);
				
				if (!currentAuth.isAuthenticated && !currentAuth.hasTokens) {
					console.log("🚨 No auth state detected - forcing full page reload");
					window.location.href = '/dashboard';
				} else if (!currentAuth.isAuthenticated && currentAuth.hasTokens) {
					console.log("🔄 Tokens exist but not authenticated - soft reload");
					window.location.reload();
				} else {
					console.log("✅ Auth state preserved - no recovery needed");
				}
			}
		};

		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	}, [isOAuthAuthenticated]);

	// Debug storage changes and detect session clearing with IMMEDIATE RECOVERY
	useEffect(() => {
		const handleStorageChange = (event: StorageEvent) => {
			console.log("🗄️ Storage changed:", {
				key: event.key,
				oldValue: event.oldValue,
				newValue: event.newValue,
				url: event.url
			});

			// CRITICAL: Detect Convex token clearing
			if (event.key?.includes('convex') && event.key?.includes('auth') && event.oldValue && !event.newValue) {
				console.error("🚨 CONVEX AUTH TOKEN CLEARED! Initiating emergency recovery:", {
					key: event.key,
					oldValue: event.oldValue.substring(0, 100) + "...",
					stackTrace: new Error().stack
				});
				
				// 🚨 EMERGENCY RECOVERY - Immediate action
				if (event.key.includes('JWT')) {
					console.log("🚑 EMERGENCY: JWT cleared - attempting immediate restoration");
					
					// Check if we're in an OAuth callback URL and ignore if so
					const currentUrl = window.location.href;
					if (currentUrl.includes('error=no_code') || currentUrl.includes('callback')) {
						console.log("🚑 OAuth callback detected - scheduling delayed recovery");
						setTimeout(() => {
							console.log("🔄 Delayed recovery: Redirecting to dashboard");
							window.location.href = '/dashboard';
						}, 2000);
					} else {
						// Immediate recovery for non-OAuth contexts
						setTimeout(() => {
							if (!isOAuthAuthenticated) {
								console.log("🚑 Emergency redirect to restore session");
								window.location.reload();
							}
						}, 1000);
					}
				}
			}
		};

		window.addEventListener('storage', handleStorageChange);
		return () => window.removeEventListener('storage', handleStorageChange);
	}, [isOAuthAuthenticated]);

	// Monitor auth token changes in real-time
	useEffect(() => {
		const interval = setInterval(() => {
			const currentJWT = localStorage.getItem('__convexAuthJWT_httpsveraciousparakeet120convexcloud');
			const currentRefresh = localStorage.getItem('__convexAuthRefreshToken_httpsveraciousparakeet120convexcloud');
			
			if (process.env.NODE_ENV === "development") {
				console.log("🔍 Token monitor:", {
					hasJWT: !!currentJWT,
					hasRefresh: !!currentRefresh,
					jwtLength: currentJWT?.length || 0,
					refreshLength: currentRefresh?.length || 0,
					isAuthenticated: isOAuthAuthenticated,
					timestamp: new Date().toISOString()
				});
			}
		}, 5000); // Check every 5 seconds

		return () => clearInterval(interval);
	}, [isOAuthAuthenticated]);

	// 🎯 SESSION SOURCE TRACKING - Critical for collision detection
	const sessionSource = useMemo(() => {
		if (isOAuthAuthenticated && authToken) return "convex";
		return null;
	}, [isOAuthAuthenticated, authToken]);

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

	// 🚨 COLLISION DETECTION - Monitor for session source changes
	const prevSessionSourceRef = useRef<string | null>(null);
	useEffect(() => {
		if (prevSessionSourceRef.current && prevSessionSourceRef.current !== sessionSource) {
			console.error("🚨 SESSION SOURCE CHANGED - POSSIBLE COLLISION:", {
				previous: prevSessionSourceRef.current,
				current: sessionSource,
				timestamp: new Date().toISOString(),
				stackTrace: new Error().stack
			});
		}
		prevSessionSourceRef.current = sessionSource;
	}, [sessionSource]);

	// Fetch real user data from Convex database for OAuth users, basically get actual profile information  
	const oauthUserData = useQuery(
		api.users.getUserById,
		oauthUserId ? { userId: oauthUserId as any } : "skip"
	);

	// Create a unified user object using Convex Auth
	const user = isOAuthAuthenticated && oauthUserId
		? (() => {
			// Use real user data from database if available, otherwise fallback to JWT info
			if (oauthUserData) {
				return {
					id: oauthUserId,
					name: oauthUserData.name || "User",
					email: oauthUserData.email || "user@example.com",
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
		: null;

	// Debug logging for auth state
	if (process.env.NODE_ENV === "development") {
		console.log("AuthProvider Debug:", {
			isOAuthAuthenticated,
			authToken: !!authToken,
			authTokenValue: authToken ? authToken.substring(0, 50) + "..." : null,
			userId: user?.id,
			userObject: user,
		});
	}

	// Sign out function using Convex Auth
	const combinedSignOut = async () => {
		try {
			console.log("🚪 Starting sign out...");
			
			// Always try to sign out from Convex Auth (works for both OAuth and email auth)
			try {
				console.log("🔑 Signing out from Convex Auth...");
				await convexOAuthMethods.signOutOAuth();
			} catch (signOutError) {
				console.log("⚠️ Convex sign out failed (might already be signed out):", signOutError);
			}
			
			// Clear all auth-related localStorage items
			const authKeys = [
				'__convexAuthJWT_httpsveraciousparakeet120convexcloud',
				'__convexAuthRefreshToken_httpsveraciousparakeet120convexcloud',
				'agenitix_auth_token',
				'convex-auth-token',
			];
			
			console.log("🧹 Clearing localStorage auth keys...");
			authKeys.forEach(key => {
				if (localStorage.getItem(key)) {
					localStorage.removeItem(key);
					console.log(`✅ Cleared ${key}`);
				}
			});
			
			// Clear any auth-related cookies
			document.cookie.split(";").forEach(cookie => {
				const eqPos = cookie.indexOf("=");
				const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
				if (name.includes('auth') || name.includes('convex') || name.includes('token')) {
					document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
					console.log(`🧹 Cleared cookie: ${name}`);
				}
			});
			
			console.log("✅ Sign out complete, redirecting...");
			
			// Use window.location.replace to avoid back button issues
			window.location.replace('/');
			
		} catch (error) {
			console.error("❌ Sign out error:", error);
			// Force clear everything even if sign out calls fail
			console.log("🔥 Force clearing all storage...");
			localStorage.clear();
			sessionStorage.clear();
			
			// Clear all cookies
			document.cookie.split(";").forEach(cookie => {
				const eqPos = cookie.indexOf("=");
				const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
				document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
			});
			
			window.location.replace('/');
		}
	};

	// Legacy auth functions for backwards compatibility - now using Convex Auth
	const legacySignIn = async (params: { email: string }) => {
		return await convexSignIn("email", { email: params.email });
	};

	const legacySignUp = async (params: { email: string; name: string; company?: string; role?: string }) => {
		// Convex Auth Email provider handles both sign up and sign in the same way
		return await convexSignIn("email", { email: params.email });
	};

	const legacyVerifyMagicLink = async (token: string, ip?: string, userAgent?: string) => {
		// This should not be called directly anymore - verification is handled by the /auth/verify page
		throw new Error("Please use the magic link URL instead of calling verifyMagicLink directly");
	};

	// 🔧 AUTH RECOVERY MECHANISM
	const recoverAuth = useCallback(() => {
		const lastKnownJWT = localStorage.getItem('__convexAuthJWT_httpsveraciousparakeet120convexcloud');
		const lastKnownRefresh = localStorage.getItem('__convexAuthRefreshToken_httpsveraciousparakeet120convexcloud');
		
		console.log("🔄 Attempting auth recovery:", {
			hasJWT: !!lastKnownJWT,
			hasRefresh: !!lastKnownRefresh,
			currentAuth: isOAuthAuthenticated,
		});
		
		if (lastKnownJWT && !isOAuthAuthenticated) {
			console.log("🔄 Auth tokens found but not authenticated - triggering reload");
			window.location.reload();
			return true;
		}
		
		return false;
	}, [isOAuthAuthenticated]);

	// 🚨 AUTO-RECOVERY on auth loss detection
	useEffect(() => {
		if (sessionSource === null && prevSessionSourceRef.current === "convex") {
			console.error("🚨 CONVEX AUTH LOST - Attempting immediate recovery");
			
			// Try multiple recovery strategies
			setTimeout(async () => {
				console.log("🔄 Strategy 1: Basic token recovery");
				if (recoverAuth()) {
					console.log("✅ Basic recovery initiated");
					return;
				}
				
				console.log("🔄 Strategy 2: Force Convex auth refresh");
				try {
					// Try to trigger Convex auth refresh
					await convexOAuthMethods.signOutOAuth();
					setTimeout(() => {
						console.log("🔄 Strategy 3: Redirect to restore session");
						// Force navigation to trigger auth restoration
						window.location.href = '/dashboard';
					}, 1000);
				} catch (error) {
					console.error("❌ All recovery strategies failed:", error);
				}
			}, 500); // Faster response
		}
	}, [sessionSource, recoverAuth, convexOAuthMethods]);

	const combinedAuth = {
		...convexOAuthMethods,
		authToken,
		isOAuthAuthenticated,
		user,
		// Set authentication status based on Convex Auth only
		isAuthenticated: isOAuthAuthenticated,
		isLoading: convexAuthState.isLoading, // Use Convex Auth's proper loading state
		// 🎯 COLLISION PREVENTION - Expose session tracking
		sessionSource,
		recoverAuth,
		// Legacy functions for backwards compatibility
		signIn: legacySignIn,
		signUp: legacySignUp,
		verifyMagicLink: legacyVerifyMagicLink,
		// Use our sign out function
		signOut: combinedSignOut,
	};

	return <AuthContext.Provider value={combinedAuth as unknown as AuthContextType}>{children}</AuthContext.Provider>;
};
