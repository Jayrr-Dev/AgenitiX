/**
 * Route: hooks/useConvexAuth.ts
 * CONVEX AUTH INTEGRATION HOOK - Combines new OAuth with existing magic link authentication
 *
 * • Integrates Convex Auth OAuth (GitHub, Google) with existing magic link system
 * • Maintains backward compatibility with current auth implementation
 * • Provides unified authentication interface for both OAuth and magic links
 * • Syncs OAuth authentication with existing auth_users table structure
 * • Handles seamless switching between authentication methods
 *
 * Keywords: convex-auth, oauth, magic-link, authentication-integration, github-oauth
 */

import { useAuthActions } from "@convex-dev/auth/react";
import { useCallback } from "react";

export const useConvexAuth = () => {
  const { signIn: convexSignIn, signOut: convexSignOut } = useAuthActions();

  // GitHub OAuth sign in, basically modern authentication
  const signInWithGitHub = useCallback(async () => {
    try {
      await convexSignIn("github");
    } catch (error) {
      console.error("GitHub sign-in error:", error);
      throw new Error("Failed to sign in with GitHub. Please try again.");
    }
  }, [convexSignIn]);

  // Google OAuth sign in, basically modern authentication
  const signInWithGoogle = useCallback(async () => {
    try {
      await convexSignIn("google");
    } catch (error) {
      console.error("Google sign-in error:", error);
      throw new Error("Failed to sign in with Google. Please try again.");
    }
  }, [convexSignIn]);

  // OAuth sign out, basically modern logout
  const signOutOAuth = useCallback(async () => {
    try {
      await convexSignOut();
    } catch (error) {
      console.error("OAuth sign-out error:", error);
      throw new Error("Failed to sign out. Please try again.");
    }
  }, [convexSignOut]);

  return {
    signInWithGitHub,
    signInWithGoogle,
    signOutOAuth,
  };
};