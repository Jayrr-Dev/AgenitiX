"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useUserCheck } from "@/hooks/useUserCheck";
import { RateLimitWarning } from "@/components/auth/RateLimitWarning";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
	const { signIn, isAuthenticated, isLoading: authLoading } = useAuthContext();
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [emailToCheck, setEmailToCheck] = useState<string | null>(null);
	const [showRateLimit, setShowRateLimit] = useState(false);
	const [mounted, setMounted] = useState(false);
	
	// Check if user exists (only when we have a valid email)
	const { exists: userExists, isLoading: checkingUser } = useUserCheck(emailToCheck);

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

		const trimmedEmail = email.trim();
		
		// First check if user exists to provide better UX
		setEmailToCheck(trimmedEmail);
		
		// Wait a bit for the user check to complete
		await new Promise(resolve => setTimeout(resolve, 100));
		
		// If user doesn't exist, show friendly error without calling signIn
		if (emailToCheck && !checkingUser && !userExists) {
			setError("Account not found. Please check your email or create a new account.");
			setIsLoading(false);
			return;
		}

		try {
			const result = await signIn({ email: trimmedEmail });
			
			// Show success message with toast
			setError(null);
			const { toast } = await import("sonner");
			toast.success("Magic link sent!", {
				description: result.message,
				duration: 5000,
			});
			
		} catch (err) {
			const { formatAuthError } = await import("@/lib/auth-utils");
			const errorMessage = formatAuthError(err);
			
			// Check if it's a rate limiting error
			if (err instanceof Error && err.message.includes("Too many attempts")) {
				setShowRateLimit(true);
				setError(null);
				
				const { toast } = await import("sonner");
				toast.error("Too many attempts", {
					description: "Please wait an hour before trying again for security reasons.",
					duration: 8000,
				});
			} else {
				setError(errorMessage);
				
				// Also show toast for better UX
				const { toast } = await import("sonner");
				toast.error("Sign in failed", {
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
											setError(null); // Clear error when user types
											// Check user existence after a delay
											const trimmedEmail = e.target.value.trim();
											if (trimmedEmail.includes('@') && trimmedEmail.length > 5) {
												setTimeout(() => {
													setEmailToCheck(trimmedEmail);
												}, 500);
											}
										}}
										required
										disabled={isLoading}
										className="h-11"
									/>
									{/* Show loading indicator when checking user */}
									{checkingUser && emailToCheck && (
										<p className="text-xs text-gray-500 flex items-center">
											<Loader2 className="w-3 h-3 animate-spin mr-1" />
											Checking account...
										</p>
									)}
								</div>

								{/* Rate limiting warning */}
								{showRateLimit && (
									<RateLimitWarning 
										email={email}
										onDismiss={() => {
											setShowRateLimit(false);
											setEmail("");
										}}
									/>
								)}

								{/* Regular error messages */}
								{error && !showRateLimit && (
									<div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
										{error}
										{error.includes("Account not found") && (
											<div className="mt-2">
												<Link href="/sign-up">
													<Button variant="outline" size="sm" className="w-full">
														Create New Account
													</Button>
												</Link>
											</div>
										)}
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