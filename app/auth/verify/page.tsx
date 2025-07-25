"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react";
import Link from "next/link";

export default function VerifyMagicLinkPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");
	
	const [status, setStatus] = useState<"loading" | "success" | "error" | "expired">("loading");
	const [error, setError] = useState<string | null>(null);
	
	const verifyMagicLink = useMutation(api.auth.verifyMagicLink);

	useEffect(() => {
		if (!token) {
			setStatus("error");
			setError("No verification token provided");
			return;
		}

		const verify = async () => {
			try {
				const result = await verifyMagicLink({
					token,
					ip_address: "127.0.0.1", // In production, get real IP
					user_agent: navigator.userAgent,
				});

				// Store session token
				localStorage.setItem("agenitix_auth_token", result.sessionToken);
				
				setStatus("success");
				
				// Force a page reload to ensure auth context updates
				// This prevents hydration issues and ensures clean state
				setTimeout(() => {
					window.location.href = "/dashboard";
				}, 1500);

			} catch (err) {
				console.error("Magic link verification failed:", err);
				
				if (err instanceof Error) {
					if (err.message.includes("expired")) {
						setStatus("expired");
					} else {
						setStatus("error");
						setError(err.message);
					}
				} else {
					setStatus("error");
					setError("Verification failed");
				}
			}
		};

		verify();
	}, [token, verifyMagicLink, router]);

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
					description: "Your account has been verified successfully. Taking you to your dashboard...",
					showRetry: false,
				};
			
			case "expired":
				return {
					icon: <XCircle className="h-12 w-12 text-orange-600" />,
					title: "Link Expired",
					description: "This magic link has expired. Please request a new one to continue.",
					showRetry: true,
				};
			
			case "error":
			default:
				return {
					icon: <XCircle className="h-12 w-12 text-red-600" />,
					title: "Verification Failed",
					description: error || "Something went wrong during verification. Please try again.",
					showRetry: true,
				};
		}
	};

	const content = getStatusContent();

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				{/* Logo */}
				<div className="text-center">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						AgenitiX
					</h1>
					<p className="text-gray-600">
						Visual Flow Automation Platform
					</p>
				</div>

				{/* Status Card */}
				<Card className="border-0 shadow-lg">
					<CardHeader className="text-center pb-4">
						<div className="flex justify-center mb-4">
							{content.icon}
						</div>
						<CardTitle className="text-xl font-bold">
							{content.title}
						</CardTitle>
						<CardDescription className="text-center">
							{content.description}
						</CardDescription>
					</CardHeader>
					
					{content.showRetry && (
						<CardContent className="pt-0">
							<div className="space-y-4">
								<Link href="/sign-in">
									<Button className="w-full">
										<Mail className="mr-2 h-4 w-4" />
										Request New Magic Link
									</Button>
								</Link>
								
								<div className="text-center">
									<Link 
										href="/" 
										className="text-sm text-blue-600 hover:text-blue-500"
									>
										← Back to Home
									</Link>
								</div>
							</div>
						</CardContent>
					)}
				</Card>

				{/* Help text */}
				<div className="text-center text-xs text-gray-500">
					Having trouble? Contact support at{" "}
					<a href="mailto:support@agenitix.com" className="underline hover:text-gray-700">
						support@agenitix.com
					</a>
				</div>
			</div>
		</div>
	);
}