"use client";

import { useAuthContext } from "@/components/auth/AuthProvider";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/Loading";
import { CheckCircle, Mail, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function VerifyMagicLinkPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");
	const email = searchParams.get("email");

	const [status, setStatus] = useState<"loading" | "success" | "error" | "expired">("loading");
	const [error, setError] = useState<string | null>(null);

	const { isAuthenticated } = useAuthContext();
	const { signIn } = useAuthActions();

	// Redirect if already authenticated
	useEffect(() => {
		if (isAuthenticated) {
			router.push("/dashboard");
		}
	}, [isAuthenticated, router]);

	useEffect(() => {
		if (!token || !email) {
			setStatus("error");
			setError(
				"Invalid magic link. Missing token or email parameter. Please check the magic link and try again."
			);
			return;
		}

		// Basic token validation
		if (token.length < 10) {
			setStatus("error");
			setError("Invalid verification token format. Please request a new magic link.");
			return;
		}

		// Don't verify if already authenticated
		if (isAuthenticated) {
			return;
		}

		const verify = async () => {
			try {
				console.log("🔐 Verifying magic link with Convex Auth:", { email, token: token.substring(0, 10) + "..." });
				
				// Use Convex Auth Email provider's verification flow
				await signIn("email", { 
					email,
					code: token, // Pass token as code for email verification
				});

				console.log("✅ Magic link verification successful");
				setStatus("success");

				// Show success toast
				toast.success("Account verified!", {
					description: "Welcome to AgenitiX! Redirecting to your dashboard...",
					duration: 3000,
				});

				// Wait a moment for the auth state to update, then redirect
				setTimeout(() => {
					router.push("/dashboard");
				}, 1500);
			} catch (err) {
				console.error("❌ Magic link verification failed:", err);

				if (err instanceof Error) {
					// Check for specific error types
					const errorMessage = err.message.toLowerCase();

					if (errorMessage.includes("expired")) {
						setStatus("expired");
						setError("This magic link has expired. Please request a new one.");
						toast.error("Magic link expired", {
							description: "Please request a new magic link to continue.",
							duration: 5000,
						});
					} else if (errorMessage.includes("invalid") || errorMessage.includes("token")) {
						setStatus("error");
						setError(
							"This magic link is invalid or has already been used. Please request a new one."
						);
						toast.error("Invalid magic link", {
							description: "This link may have been used already or is malformed.",
							duration: 5000,
						});
					} else {
						setStatus("error");
						setError(err.message || "Verification failed. Please try again.");
						toast.error("Verification failed", {
							description: err.message || "Please try requesting a new magic link.",
							duration: 5000,
						});
					}
				} else {
					setStatus("error");
					setError("An unexpected error occurred during verification. Please try again.");
				}
			}
		};

		verify();
	}, [token, email, signIn, router, isAuthenticated]);

	const getStatusContent = () => {
		switch (status) {
					case "loading":
			return {
				icon: <Loading showText={false} size="w-12 h-12" className="p-0" variant="border" />,
				title: "Verifying your account...",
				description: "Please wait while we verify your magic link.",
				showRetry: false,
			};

			case "success":
				return {
					icon: <CheckCircle className="h-12 w-12 text-green-600" />,
					title: "Welcome to AgenitiX!",
					description:
						"Your account has been verified successfully. Taking you to your dashboard...",
					showRetry: false,
				};

			case "expired":
				return {
					icon: <XCircle className="h-12 w-12 text-orange-600" />,
					title: "Magic Link Expired",
					description:
						error ||
						"This magic link has expired for security reasons. Please request a new one to continue.",
					showRetry: true,
				};
			default:
				return {
					icon: <XCircle className="h-12 w-12 text-red-600" />,
					title: "Verification Failed",
					description:
						error ||
						"We couldn't verify this magic link. It may be invalid, expired, or already used.",
					showRetry: true,
				};
		}
	};

	const content = getStatusContent();

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
			<div className="w-full max-w-md space-y-8">
				{/* Logo */}
				<div className="text-center">
					<h1 className="mb-2 font-bold text-3xl text-gray-900">AgenitiX</h1>
					<p className="text-gray-600">Visual Flow Automation Platform</p>
				</div>

				{/* Status Card */}
				<Card className="border-0 shadow-lg">
					<CardHeader className="pb-4 text-center">
						<div className="mb-4 flex justify-center">{content.icon}</div>
						<CardTitle className="font-bold text-xl">{content.title}</CardTitle>
						<CardDescription className="text-center">{content.description}</CardDescription>
					</CardHeader>

					{content.showRetry && (
						<CardContent className="pt-0">
							<div className="space-y-4">
								<Link href="/sign-in">
									<Button className="w-full">
										<Mail className="mr-2 h-4 w-4" />
										{status === "expired" ? "Get New Magic Link" : "Try Again"}
									</Button>
								</Link>

								<div className="space-y-2 text-center">
									<Link href="/sign-up" className="block text-gray-600 text-sm hover:text-gray-800">
										Don't have an account? Sign up
									</Link>
									<Link href="/" className="block text-blue-600 text-sm hover:text-blue-500">
										← Back to Home
									</Link>
								</div>
							</div>
						</CardContent>
					)}
				</Card>

				{/* Help text */}
				<div className="text-center text-gray-500 text-xs">
					Having trouble? Contact support at{" "}
					<a href="mailto:support@agenitix.com" className="underline hover:text-gray-700">
						support@agenitix.com
					</a>
				</div>
			</div>
		</div>
	);
}
