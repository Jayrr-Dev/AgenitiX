/**
 * Route: components/auth/AuthDebugComponent.tsx
 * AUTH DEBUG COMPONENT - Debug component to show authentication state
 *
 * • Shows current authentication status for both OAuth and magic link
 * • Displays user object and token information
 * • Helps debug authentication issues
 * • Only visible in development mode
 *
 * Keywords: auth-debug, development, oauth, magic-link, authentication-state
 */

"use client";

import { useAuthContext } from "./AuthProvider";

export const AuthDebugComponent = () => {
  const auth = useAuthContext();

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-sm p-4 bg-black/90 text-white text-xs rounded border z-50">
      <div className="font-bold mb-2">Auth Debug</div>
      <div>
        <div>OAuth Auth: {auth.isOAuthAuthenticated ? "✅" : "❌"}</div>
        <div>Magic Link: {auth.isAuthenticated ? "✅" : "❌"}</div>
        <div>Loading: {auth.isLoading ? "⏳" : "✅"}</div>
        <div>User ID: {auth.user?.id || "None"}</div>
        <div>User Name: {auth.user?.name || "None"}</div>
        <div>Auth Token: {auth.authToken ? "Present" : "None"}</div>
      </div>
    </div>
  );
};