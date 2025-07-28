"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, ArrowRight, AlertCircle } from "lucide-react";
import { formatAuthError, getAuthErrorType, getRetryInfo } from "@/lib/auth-utils";
import { toast } from "sonner";
import Link from "next/link";

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
			const timer = setTimeout(() => {
				setIsRateLimited(false);
				setRetryAfter(undefined);
				setError(null);
			}, retryAfter * 60 * 1000); // Convert minutes to milliseconds

			return () => clearTimeout(timer);
		}
	}, [isRateLimited, retryAfter]);

	// Don't render if not mounted or authenticated (will redirect)
	if (!mounted || authLoading) {
		return (
			<div className="min-h-screen flex">
				<div className="flex-1 flex items-center justify-center">
					<Loader2 className="h-8 w-8 animate-spin" />
				</div>
			</div>
		);
	}

	if (isAuthenticated) {
		return (
			<div className="min-h-screen flex">
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center">
						<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
						<p className="text-gray-600">Redirecting to dashboard...</p>
					</div>
				</div>
			</div>
		);
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);
		setIsRateLimited(false);
		setRetryAfter(undefined);

		const trimmedEmail = email.trim();
		
		try {
			const result = await signIn({ email: trimmedEmail });
			
			// Clear any previous errors and show success
			setError(null);
			toast.success("Magic link sent!", {
				description: result.message,
				duration: 5000,
			});
			
		} catch (err) {
			if (err instanceof Error) {
				const errorCode = getAuthErrorType(err);
				const retryInfo = getRetryInfo(err);
				const errorMessage = formatAuthError(err);
				
				// Handle rate limiting
				if (errorCode === "RATE_LIMIT_EXCEEDED") {
					setIsRateLimited(true);
					setRetryAfter(retryInfo.retryAfter);
					setError(errorMessage);
					
					toast.error("Too many attempts", {
						description: errorMessage,
						duration: 8000,
					});
				} else {
					// Handle other errors
					setError(errorMessage);
					
					if (errorCode === "USER_NOT_FOUND") {
						toast.error("Account not found", {
							description: "Please check your email or create a new account.",
							duration: 5000,
						});
					} else {
						toast.error("Sign in failed", {
							description: errorMessage,
							duration: 5000,
						});
					}
				}
			} else {
				const errorMessage = "An unexpected error occurred. Please try again.";
				setError(errorMessage);
				toast.error("Error", {
					description: errorMessage,
					duration: 5000,
				});
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex">
			{/* Left side - Branding */}
			<div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 p-12 text-white flex-col justify-between">
				<div>
					<h1 className="text-4xl font-bold mb-4">AgenitiX</h1>
					<p className="text-xl opacity-90">
						Visual Flow Automation Platform
					</p>
				</div>
				
				<div className="space-y-6">
					<div className="flex items-start space-x-4">
						<div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
							<ArrowRight className="w-4 h-4" />
						</div>
						<div>
							<h3 className="font-semibold">Visual Workflow Builder</h3>
							<p className="text-sm opacity-80">
								Create complex automations with our intuitive drag-and-drop interface
							</p>
						</div>
					</div>
					
					<div className="flex items-start space-x-4">
						<div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
							<Mail className="w-4 h-4" />
						</div>
						<div>
							<h3 className="font-semibold">Email Automation</h3>
							<p className="text-sm opacity-80">
								Connect your email accounts and automate your communication workflows
							</p>
						</div>
					</div>
					
					<div className="flex items-start space-x-4">
						<div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
							<ArrowRight className="w-4 h-4" />
						</div>
						<div>
							<h3 className="font-semibold">AI-Powered Insights</h3>
							<p className="text-sm opacity-80">
								Leverage AI to optimize your workflows and improve efficiency
							</p>
						</div>
					</div>
				</div>
				
				<div className="text-sm opacity-70">
					© 2025 AgenitiX. All rights reserved.
				</div>
			</div>

			{/* Right side - Sign in form */}
			<div className="flex-1 flex items-center justify-center p-8">
				<div className="w-full max-w-md space-y-8">
					{/* Mobile branding */}
					<div className="lg:hidden text-center">
						<h1 className="text-3xl font-bold text-gray-900 mb-2">AgenitiX</h1>
						<p className="text-gray-600">Visual Flow Automation Platform</p>
					</div>

					<Card className="border-0 shadow-lg">
						<CardHeader className="space-y-1">
							<CardTitle className="text-2xl font-bold text-center">
								Welcome back
							</CardTitle>
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
										required
										disabled={isLoading}
										className="h-11"
									/>
								</div>

								{/* Error messages */}
								{error && (
									<div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
										<div className="flex items-start space-x-2">
											<AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
											<div className="flex-1">
												<p>{error}</p>
												
												{/* Rate limit specific info */}
												{isRateLimited && retryAfter && (
													<p className="mt-1 text-xs text-red-500">
														You can try again in {retryAfter} {retryAfter === 1 ? 'minute' : 'minutes'}.
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

								<Button 
									type="submit" 
									className="w-full h-11" 
									disabled={isLoading || !email.trim()}
								>
									{isLoading ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Signing in...
										</>
									) : (
										"Sign in"
									)}
								</Button>

								<div className="text-center text-sm">
									<span className="text-gray-600">Don't have an account? </span>
									<Link 
										href="/sign-up" 
										className="font-medium text-blue-600 hover:text-blue-500"
									>
										Sign up
									</Link>
								</div>
							</form>
						</CardContent>
					</Card>

					{/* Additional info */}
					<div className="text-center text-xs text-gray-500">
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