"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { GitHubButton } from "@/components/auth/GitHubButton";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Loading } from "@/components/Loading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { shouldEnableTestMode } from "@/lib/production-config";
import { useAuthActions } from "@convex-dev/auth/react";
import { ArrowRight, Building, CheckCircle, Mail, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SignUpPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { signIn: convexSignIn } = useAuthActions();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

  // Don't render if authenticated (will redirect)
  if (authLoading) {
    return <Loading className="min-h-screen" size="w-8 h-8" showText={false} />;
  }

  if (isAuthenticated) {
    return null;
  }

  const handleChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Use new Convex Auth Email provider - it handles both sign up and sign in
      await convexSignIn("resend", {
        email: formData.email.trim(),
      });

      setSuccess(true);

      // Log success in development - magic link will be logged by the auth provider
      if (shouldEnableTestMode()) {
        console.log("Magic link sent successfully");
      }

      toast.success("Magic link sent!", {
        description:
          "Check your email and click the link to complete registration.",
        duration: 5000,
      });
    } catch (err) {
      const { formatAuthError } = await import("@/lib/auth-utils");
      const errorMessage = formatAuthError(err);
      setError(errorMessage);

      // Also show toast for better UX
      toast.error("Sign up failed", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.email.trim(); // Only email is required for magic link

  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden flex-col justify-between bg-gradient-to-br from-purple-600 to-blue-700 p-12 text-white lg:flex lg:w-1/2">
        <div>
          <h1 className="mb-4 font-bold text-4xl">Join AgenitiX</h1>
          <p className="text-xl opacity-90">
            Start automating your workflows today
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold">Free to Get Started</h3>
              <p className="text-sm opacity-80">
                Create your account and start building workflows immediately
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <Building className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold">Team Collaboration</h3>
              <p className="text-sm opacity-80">
                Invite your team members and collaborate on automation projects
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <ArrowRight className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold">Enterprise Ready</h3>
              <p className="text-sm opacity-80">
                Scale your automations with enterprise-grade security and
                reliability
              </p>
            </div>
          </div>
        </div>

        <div className="text-sm opacity-70">
          © 2025 AgenitiX. All rights reserved.
        </div>
      </div>

      {/* Right side - Sign up form */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile branding */}
          <div className="text-center lg:hidden">
            <h1 className="mb-2 font-bold text-3xl text-gray-900">AgenitiX</h1>
            <p className="text-gray-600">Visual Flow Automation Platform</p>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-center font-bold text-2xl">
                Create your account
              </CardTitle>
              <CardDescription className="text-center">
                Join thousands of users automating their workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="text-center space-y-4">
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Magic link sent!
                    </h3>
                    <p className="text-gray-600 mt-1">
                      Check your email and click the link to complete your
                      registration.
                    </p>
                    {process.env.NODE_ENV === "development" && (
                      <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2 mt-3">
                        <strong>Development mode:</strong> Check the server
                        console for the magic link URL.
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => {
                      setSuccess(false);
                      setFormData({
                        name: "",
                        email: "",
                        company: "",
                        role: "",
                      });
                    }}
                    variant="outline"
                  >
                    Send another link
                  </Button>
                </div>
              ) : (
                <>
                  {/* OAuth Sign-up Options */}
                  <div className="space-y-3 mb-6">
                    <GoogleButton disabled={isLoading} />
                    <GitHubButton disabled={isLoading} />

                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-500">
                          Or continue with email
                        </span>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full name (optional)</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={handleChange("name")}
                          disabled={isLoading}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={handleChange("email")}
                          required={true}
                          disabled={isLoading}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company">Company (optional)</Label>
                        <Input
                          id="company"
                          type="text"
                          placeholder="Your company name"
                          value={formData.company}
                          onChange={handleChange("company")}
                          disabled={isLoading}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role">Role (optional)</Label>
                        <Input
                          id="role"
                          type="text"
                          placeholder="Your role or title"
                          value={formData.role}
                          onChange={handleChange("role")}
                          disabled={isLoading}
                          className="h-11"
                        />
                      </div>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      className="h-11 w-full"
                      disabled={isLoading || !isFormValid}
                    >
                      {isLoading ? (
                        <>
                          <Loading
                            showText={false}
                            size="w-4 h-4"
                            className="mr-2 p-0"
                          />
                          Sending magic link...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Send magic link
                        </>
                      )}
                    </Button>

                    <div className="text-center text-sm">
                      <span className="text-gray-600">
                        Already have an account?{" "}
                      </span>
                      <Link
                        href="/sign-in"
                        className="font-medium text-blue-600 hover:text-blue-500"
                      >
                        Sign in
                      </Link>
                    </div>
                  </form>
                </>
              )}
            </CardContent>
          </Card>

          {/* Additional info */}
          <div className="text-center text-gray-500 text-xs">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-gray-700">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-gray-700">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
