/**
 * Route: components/auth/GitHubButton.tsx
 * GITHUB OAUTH BUTTON - Modern authentication button for GitHub sign-in
 *
 * • Provides GitHub OAuth authentication using Convex Auth
 * • Integrates with existing auth system via useAuthContext
 * • Shows loading states and handles errors gracefully
 * • Uses GitHub branding and icon following design standards
 * • Maintains consistent styling with existing sign-in components
 *
 * Keywords: github-oauth, authentication-button, convex-auth, oauth-signin
 */

import { useAuthActions } from "@convex-dev/auth/react";

import { Button } from "@/components/ui/button";
import { Loading } from "@/components/Loading";
import { Github } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface GitHubButtonProps {
  disabled?: boolean;
  className?: string;
}

export const GitHubButton = ({ disabled = false, className = "" }: GitHubButtonProps) => {
  const { signIn } = useAuthActions();
  const [isLoading, setIsLoading] = useState(false);

  const handleGitHubSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("github");
      toast.success("Redirecting to GitHub...", {
        description: "You'll be redirected back after authentication",
        duration: 3000,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to sign in with GitHub";
      toast.error("GitHub sign-in failed", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleGitHubSignIn}
      disabled={disabled || isLoading}
      className={`h-11 w-full ${className}`}
    >
      {isLoading ? (
        <>
          <Loading showText={false} size="w-4 h-4" className="mr-2 p-0" />
          Connecting to GitHub...
        </>
      ) : (
        <>
          <Github className="mr-2 h-4 w-4" />
          Continue with GitHub
        </>
      )}
    </Button>
  );
};