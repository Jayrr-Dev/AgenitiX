"use client";

import { useAuthContext } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatAuthError, getAuthErrorType, getRetryInfo } from "@/lib/auth-utils";
import { AlertCircle, ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { Loading } from "@/components/Loading";
import { toast } from "sonner";

export default function SignInPage() {
	const { signIn, isAuthenticated, isLoading: authLoading } = useAuthContext();
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isRateLimited, setIsRateLimited] = useState(false);
	const [retryAfter, setRetryAfter] = useState<number | undefined>();
	const [mounted, setMounted] = useState(false);

	// Ensure component is mounted to avoid hydration issues
	useEffect(() => {
		setMounted(true);
	}, []);

	// Redirect if already authenticated
	useEffect(() => {
		if (mounted && !authLoading && isAuthenticated) {
			router.push("/dashboard");
		}
	}, [mounted, isAuthenticated, authLoading, router]);

	// Handle rate limit countdown
	useEffect(() => {
		if (isRateLimited && retryAfter) {
			const timer = setTimeout(
				() => {
					setIsRateLimited(false);
					setRetryAfter(undefined);
					setError(null);
				},
				retryAfter * 60 * 1000
			); // Convert minutes to milliseconds

			return () => clearTimeout(timer);
		}
		return undefined;
	}, [isRateLimited, retryAfter]);

	// Don't render if not mounted or authenticated (will redirect)
	if (!mounted || authLoading) {
		return (
			<Loading 
				className="min-h-screen"
				size="w-8 h-8" 
				showText={false}
			/>
		);
	}

	if (isAuthenticated) {
		return (
			<Loading 
				className="min-h-screen"
				size="w-8 h-8" 
				text="Redirecting to dashboard..."
				textSize="text-base"
			/>
		);
	}

	/**
	 * Handles rate limit errors
	 */
	const handleRateLimitError = (errorMessage: string, retryAfter?: number) => {
		setIsRateLimited(true);
		setRetryAfter(retryAfter);
		setError(errorMessage);

		toast.error("Too many attempts", {
			description: errorMessage,
			duration: 8000,
		});
	};

	/**
	 * Handles user not found errors
	 */
	const handleUserNotFoundError = (errorMessage: string) => {
		setError(errorMessage);
		toast.error("Account not found", {
			description: "Please check your email or create a new account.",
			duration: 5000,
		});
	};

	/**
	 * Handles general authentication errors
	 */
	const handleGeneralAuthError = (errorMessage: string) => {
		setError(errorMessage);
		toast.error("Sign in failed", {
			description: errorMessage,
			duration: 5000,
		});
	};

	/**
	 * Handles unexpected errors
	 */
	const handleUnexpectedError = () => {
		const errorMessage = "An unexpected error occurred. Please try again.";
		setError(errorMessage);
		toast.error("Error", {
			description: errorMessage,
			duration: 5000,
		});
	};

	/**
	 * Handles all authentication errors
	 */
	const handleAuthenticationError = (err: unknown) => {
		if (err instanceof Error) {
			const errorCode = getAuthErrorType(err);
			const retryInfo = getRetryInfo(err);
			const errorMessage = formatAuthError(err);

			if (errorCode === "RATE_LIMIT_EXCEEDED") {
				handleRateLimitError(errorMessage, retryInfo.retryAfter);
			} else if (errorCode === "USER_NOT_FOUND") {
				handleUserNotFoundError(errorMessage);
			} else {
				handleGeneralAuthError(errorMessage);
			}
		} else {
			handleUnexpectedError();
		}
	};

	/**
	 * Resets form state before submission
	 */
	const resetFormState = () => {
		setIsLoading(true);
		setError(null);
		setIsRateLimited(false);
		setRetryAfter(undefined);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		resetFormState();

		const trimmedEmail = email.trim();

		try {
			const result = await signIn({ email: trimmedEmail });

			// Clear any previous errors and show success
			setError(null);

			// Log success in development
			if (process.env.NODE_ENV === "development") {
				console.log("\n🎉 MAGIC LINK REQUEST SUCCESSFUL:");
				console.log(`📧 Email: ${trimmedEmail}`);
				console.log(`✅ Status: ${result.message}`);
				console.log("📋 Check the server console for the magic link URL");
				console.log("");
			}

			toast.success("Magic link sent!", {
				description: result.message,
				duration: 5000,
			});
		} catch (err) {
			handleAuthenticationError(err);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen">
			{/* Left side - Branding */}
			<div className="hidden flex-col justify-between bg-gradient-to-br from-blue-600 to-purple-700 p-12 text-white lg:flex lg:w-1/2">
				<div>
					<h1 className="mb-4 font-bold text-4xl">AgenitiX</h1>
					<p className="text-xl opacity-90">Visual Flow Automation Platform</p>
				</div>

				<div className="space-y-6">
					<div className="flex items-start space-x-4">
						<div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
							<ArrowRight className="h-4 w-4" />
						</div>
						<div>
							<h3 className="font-semibold">Visual Workflow Builder</h3>
							<p className="text-sm opacity-80">
								Create complex automations with our intuitive drag-and-drop interface
							</p>
						</div>
					</div>

					<div className="flex items-start space-x-4">
						<div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
							<Mail className="h-4 w-4" />
						</div>
						<div>
							<h3 className="font-semibold">Email Automation</h3>
							<p className="text-sm opacity-80">
								Connect your email accounts and automate your communication workflows
							</p>
						</div>
					</div>

					<div className="flex items-start space-x-4">
						<div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
							<ArrowRight className="h-4 w-4" />
						</div>
						<div>
							<h3 className="font-semibold">AI-Powered Insights</h3>
							<p className="text-sm opacity-80">
								Leverage AI to optimize your workflows and improve efficiency
							</p>
						</div>
					</div>
				</div>

				<div className="text-sm opacity-70">© 2025 AgenitiX. All rights reserved.</div>
			</div>
			{/* Right side - Sign in form */}
			<div className="flex flex-1 items-center justify-center p-8">
				<div className="w-full max-w-md space-y-8">
					{/* Mobile branding */}
					<div className="text-center lg:hidden">
						<h1 className="mb-2 font-bold text-3xl text-gray-900">AgenitiX</h1>
						<p className="text-gray-600">Visual Flow Automation Platform</p>
					</div>

					<Card className="border-0 shadow-lg">
						<CardHeader className="space-y-1">
							<CardTitle className="text-center font-bold text-2xl">Welcome back</CardTitle>
							<CardDescription className="text-center">
								Sign in to your account to continue building workflows
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="email">Email address</Label>
									<Input
										id="email"
										type="email"
										placeholder="Enter your email"
										value={email}
										onChange={(e) => {
											setEmail(e.target.value);
											// Clear errors when user types (but keep rate limiting)
											if (!isRateLimited) {
												setError(null);
											}
										}}
										required={true}
										disabled={isLoading}
										className="h-11"
									/>
								</div>

								{/* Error messages */}
								{error && (
									<div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-600 text-sm">
										<div className="flex items-start space-x-2">
											<AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
											<div className="flex-1">
												<p>{error}</p>

												{/* Rate limit specific info */}
												{isRateLimited && retryAfter && (
													<p className="mt-1 text-red-500 text-xs">
														You can try again in {retryAfter}{" "}
														{retryAfter === 1 ? "minute" : "minutes"}.
													</p>
												)}

												{/* Account not found - show sign up option */}
												{error.includes("Account not found") && (
													<div className="mt-3">
														<Link href="/sign-up">
															<Button variant="outline" size="sm" className="w-full">
																Create New Account
															</Button>
														</Link>
													</div>
												)}
											</div>
										</div>
									</div>
								)}

								<Button type="submit" className="h-11 w-full" disabled={isLoading || !email.trim()}>
									{isLoading ? (
										<>
											<Loading showText={false} size="w-4 h-4" className="mr-2 p-0" />
											Signing in...
										</>
									) : (
										"Sign in"
									)}
								</Button>

								<div className="text-center text-sm">
									<span className="text-gray-600">Don't have an account? </span>
									<Link href="/sign-up" className="font-medium text-blue-600 hover:text-blue-500">
										Sign up
									</Link>
								</div>
							</form>
						</CardContent>
					</Card>

					{/* Additional info */}
					<div className="text-center text-gray-500 text-xs">
						By signing in, you agree to our{" "}
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
