"use client";

import { useAuthContext } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2, Mail, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function VerifyMagicLinkPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const [status, setStatus] = useState<"loading" | "success" | "error" | "expired">("loading");
	const [error, setError] = useState<string | null>(null);

	const { verifyMagicLink, isAuthenticated } = useAuthContext();

	// Redirect if already authenticated
	useEffect(() => {
		if (isAuthenticated) {
			router.push("/dashboard");
		}
	}, [isAuthenticated, router]);

	useEffect(() => {
		if (!token) {
			setStatus("error");
			setError(
				"No verification token provided in the URL. Please check the magic link and try again."
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
				const _result = await verifyMagicLink(
					token,
					"127.0.0.1", // In production, get real IP
					navigator.userAgent
				);

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
				console.error("Magic link verification failed:", err);

				if (err instanceof Error) {
					// Check for specific error codes with proper type checking
					const errorCode = "code" in err && typeof err.code === "string" ? err.code : null;

					switch (errorCode) {
						case "EXPIRED_MAGIC_LINK":
							setStatus("expired");
							setError("This magic link has expired. Please request a new one.");
							toast.error("Magic link expired", {
								description: "Please request a new magic link to continue.",
								duration: 5000,
							});
							break;
						case "INVALID_MAGIC_LINK":
							setStatus("error");
							setError(
								"This magic link is invalid or has already been used. Please request a new one."
							);
							toast.error("Invalid magic link", {
								description: "This link may have been used already or is malformed.",
								duration: 5000,
							});
							break;
						default:
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
	}, [token, verifyMagicLink, router, isAuthenticated]);

	const getStatusContent = () => {
		switch (status) {
			case "loading":
				return {
					icon: <Loader2 className="h-12 w-12 animate-spin text-blue-600" />,
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
								<Link href="/sign-in" legacyBehavior>
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
