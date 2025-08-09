"use client";

import { api } from "@/convex/_generated/api";
import { useConvexAuth as useConvexAuthFromHook } from "@/hooks/useConvexAuth";
import { useAuthActions, useAuthToken } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

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
  signUp: (params: {
    email: string;
    name: string;
    company?: string;
    role?: string;
  }) => Promise<any>;
  verifyMagicLink: (
    token: string,
    ip?: string,
    userAgent?: string
  ) => Promise<any>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
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

  // Auth key constants, basically stable identifiers for Convex tokens
  const CONVEX_JWT_KEY = "__convexAuthJWT_httpsveraciousparakeet120convexcloud";
  const CONVEX_REFRESH_KEY =
    "__convexAuthRefreshToken_httpsveraciousparakeet120convexcloud";
  const AUTH_ROTATION_GRACE_MS = 2500; // Grace window to ignore transient removals during refresh

  // Check if user is authenticated via OAuth, basically modern authentication using Convex Auth
  const isOAuthAuthenticated = !!authToken;

  // Clear conflicting Supabase auth tokens on mount, basically clean slate for Convex Auth
  useEffect(() => {
    const supabaseCookies = document.cookie
      .split(";")
      .filter((cookie) =>
        cookie.trim().startsWith("sb-nobcxrkriivdlksjnlef-auth-token")
      );

    if (supabaseCookies.length > 0) {
      // Clear Supabase cookies by setting them to expire
      supabaseCookies.forEach((cookie) => {
        const name = cookie.split("=")[0].trim();
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });
    }
  }, []);

  // Watch for auth state changes and check for successful OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get("code");
    const state = urlParams.get("state");
  }, [isOAuthAuthenticated, authToken]);

  // Listen for messages from OAuth popups to preserve session with ENHANCED RECOVERY
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type === "PRESERVE_SESSION") {
        // ENHANCED RECOVERY STRATEGY
        const currentAuth = {
          isAuthenticated: isOAuthAuthenticated,
          hasTokens: !!localStorage.getItem(
            "__convexAuthJWT_httpsveraciousparakeet120convexcloud"
          ),
        };

        if (!currentAuth.isAuthenticated && !currentAuth.hasTokens) {
          window.location.href = "/dashboard";
        } else if (!currentAuth.isAuthenticated && currentAuth.hasTokens) {
          window.location.reload();
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isOAuthAuthenticated]);

  // Debug storage changes and detect session clearing with IMMEDIATE RECOVERY (dev logging only)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // CRITICAL: Detect Convex token clearing
      if (
        event.key?.includes("convex") &&
        event.key?.includes("auth") &&
        event.oldValue &&
        !event.newValue
      ) {
        // During refresh, storage may briefly remove a token before writing a new one
        // Wait a short grace period and re-check before forcing a reload, basically avoid false positives
        window.setTimeout(() => {
          const hasJwt = Boolean(localStorage.getItem(CONVEX_JWT_KEY));
          const hasRefresh = Boolean(localStorage.getItem(CONVEX_REFRESH_KEY));

          // If tokens are back, do nothing. Only recover if they remain missing and user is unauthenticated
          if (!hasJwt && !hasRefresh && !isOAuthAuthenticated) {
            const currentUrl = window.location.href;
            if (
              currentUrl.includes("error=no_code") ||
              currentUrl.includes("callback")
            ) {
              window.location.href = "/dashboard";
            } else {
              window.location.reload();
            }
          }
        }, AUTH_ROTATION_GRACE_MS);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [isOAuthAuthenticated]);

  // Monitor auth token changes in real-time (development only with reduced frequency)
  useEffect(() => {
    // Only run token monitoring in development and reduce frequency to avoid log spam
    if (process.env.NODE_ENV !== "development") return;

    const interval = setInterval(() => {
      const currentJWT = localStorage.getItem(
        "__convexAuthJWT_httpsveraciousparakeet120convexcloud"
      );
      const currentRefresh = localStorage.getItem(
        "__convexAuthRefreshToken_httpsveraciousparakeet120convexcloud"
      );

      // Only log when authentication state changes, basically reduce noise
      const hasTokens = !!currentJWT && !!currentRefresh;
      if (hasTokens !== isOAuthAuthenticated) {
        // Silent monitoring - no logging
      }
    }, 30000); // Check every 30 seconds instead of 5

    return () => clearInterval(interval);
  }, [isOAuthAuthenticated]);

  // 🎯 SESSION SOURCE TRACKING - Critical for collision detection
  const sessionSource = useMemo(() => {
    if (isOAuthAuthenticated && authToken) return "convex";
    return null;
  }, [isOAuthAuthenticated, authToken]);

  // Extract user ID from OAuth token if available, basically get the real user identifier
  const oauthUserId =
    isOAuthAuthenticated && authToken
      ? (() => {
          try {
            const tokenPayload = JSON.parse(atob(authToken.split(".")[1]));
            const fullSubject = tokenPayload.sub;
            return fullSubject.includes("|")
              ? fullSubject.split("|")[0]
              : fullSubject;
          } catch (error) {
            console.error("Failed to decode JWT token:", error);
            return null;
          }
        })()
      : null;

  // 🚨 COLLISION DETECTION - Monitor for session source changes
  const prevSessionSourceRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      prevSessionSourceRef.current &&
      prevSessionSourceRef.current !== sessionSource
    ) {
      console.error("🚨 SESSION SOURCE CHANGED - POSSIBLE COLLISION:", {
        previous: prevSessionSourceRef.current,
        current: sessionSource,
        timestamp: new Date().toISOString(),
        stackTrace: new Error().stack,
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
  const user =
    isOAuthAuthenticated && oauthUserId
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

  // Throttled debug logging for auth state to avoid spam, basically reduce noise
  useEffect(() => {
    // Only log in development with heavy throttling to prevent console spam
    if (process.env.NODE_ENV === "development" && Math.random() < 0.01) {
      // Silent monitoring - no logging
    }
  }, [isOAuthAuthenticated, user?.id]);

  const combinedSignOut = async () => {
    try {
      // Clear Convex Auth
      await convexOAuthMethods.signOutOAuth();

      // Clear all local storage
      localStorage.clear();
      sessionStorage.clear();

      // Clear all cookies
      document.cookie.split(";").forEach((cookie) => {
        const eqPos = cookie.indexOf("=");
        const name =
          eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });

      // Use window.location.replace to avoid back button issues
      window.location.replace("/");
    } catch (error) {
      // Log sign out errors only in development, basically debug logout issues
      if (process.env.NODE_ENV === "development") {
        console.error("❌ Sign out error:", error);
      }
      localStorage.clear();
      sessionStorage.clear();

      // Clear all cookies
      document.cookie.split(";").forEach((cookie) => {
        const eqPos = cookie.indexOf("=");
        const name =
          eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });

      window.location.replace("/");
    }
  };

  // Legacy auth functions for backwards compatibility - now using Convex Auth
  const legacySignIn = async (params: { email: string }) => {
    return await convexSignIn("resend", { email: params.email });
  };

  const legacySignUp = async (params: {
    email: string;
    name: string;
    company?: string;
    role?: string;
  }) => {
    // Convex Auth Resend provider handles both sign up and sign in the same way
    return await convexSignIn("resend", { email: params.email });
  };

  const legacyVerifyMagicLink = async (
    token: string,
    ip?: string,
    userAgent?: string
  ) => {
    // This should not be called directly anymore - verification is handled by the /auth/verify page
    throw new Error(
      "Please use the magic link URL instead of calling verifyMagicLink directly"
    );
  };

  // 🔧 AUTH RECOVERY MECHANISM
  const recoverAuth = useCallback(() => {
    const lastKnownJWT = localStorage.getItem(
      "__convexAuthJWT_httpsveraciousparakeet120convexcloud"
    );
    const lastKnownRefresh = localStorage.getItem(
      "__convexAuthRefreshToken_httpsveraciousparakeet120convexcloud"
    );

    if (lastKnownJWT && !isOAuthAuthenticated) {
      window.location.reload();
      return true;
    }

    return false;
  }, [isOAuthAuthenticated]);

  // 🚨 AUTO-RECOVERY on auth loss detection
  useEffect(() => {
    if (sessionSource === null && prevSessionSourceRef.current === "convex") {
      console.error(
        "🚨 CONVEX AUTH LOST - Deferring recovery while checking for token rotation"
      );

      const isOAuthFlow = sessionStorage.getItem("oauth_node_state");
      if (isOAuthFlow) return;

      // Defer to allow normal token rotation to complete, basically avoid reload loops
      const timeout = window.setTimeout(async () => {
        const hasJwt = Boolean(localStorage.getItem(CONVEX_JWT_KEY));
        const hasRefresh = Boolean(localStorage.getItem(CONVEX_REFRESH_KEY));
        if (hasJwt || hasRefresh) return; // tokens restored, no action

        if (recoverAuth()) return;

        try {
          await convexOAuthMethods.signOutOAuth();
          window.location.href = "/dashboard";
        } catch (error) {
          console.error("❌ All recovery strategies failed:", error);
        }
      }, AUTH_ROTATION_GRACE_MS);

      return () => window.clearTimeout(timeout);
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

  return (
    <AuthContext.Provider value={combinedAuth as unknown as AuthContextType}>
      {children}
    </AuthContext.Provider>
  );
};
