/**
 * Magic Link Test Component
 * 
 * This component helps test the magic link authentication flow
 * It should only be used in development mode
 */

"use client";

import { useAuthContext } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

export default function MagicLinkTest() {
	const { signIn, signUp, isAuthenticated } = useAuthContext();
	const [email, setEmail] = useState("");
	const [name, setName] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [testType, setTestType] = useState<"signin" | "signup">("signin");

	// Only show in development
	if (process.env.NODE_ENV !== "development") {
		return null;
	}

	const handleTestSignIn = async () => {
		if (!email.trim()) {
			toast.error("Please enter an email address");
			return;
		}

		setIsLoading(true);
		try {
			await signIn({ email: email.trim() });
			toast.success("Magic link sent! Check the console for the link.");
		} catch (error) {
			console.error("Sign in test failed:", error);
			toast.error("Sign in test failed");
		} finally {
			setIsLoading(false);
		}
	};

	const handleTestSignUp = async () => {
		if (!email.trim() || !name.trim()) {
			toast.error("Please enter both email and name");
			return;
		}

		setIsLoading(true);
		try {
			await signUp({
				email: email.trim(),
				name: name.trim(),
			});
			toast.success("Account created! Check the console for the verification link.");
		} catch (error) {
			console.error("Sign up test failed:", error);
			toast.error("Sign up test failed");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="fixed bottom-4 right-4 z-50">
			<Card className="w-80 border-2 border-blue-200 bg-blue-50">
				<CardHeader className="pb-3">
					<CardTitle className="text-sm text-black">🧪 Magic Link Test</CardTitle>
					<CardDescription className="text-xs">
						Development only - Test magic link authentication
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="space-y-2">
						<Label htmlFor="test-email" className="text-xs">Email</Label>
						<Input
							id="test-email"
							type="email"
							placeholder="test@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="h-8 text-xs"
						/>
					</div>

					{testType === "signup" && (
						<div className="space-y-2">
							<Label htmlFor="test-name" className="text-xs">Name</Label>
							<Input
								id="test-name"
								type="text"
								placeholder="Test User"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="h-8 text-xs"
							/>
						</div>
					)}

					<div className="flex space-x-2">
						<Button
							size="sm"
							variant={testType === "signin" ? "default" : "outline"}
							onClick={() => setTestType("signin")}
							className="text-xs h-7"
						>
							Sign In
						</Button>
						<Button
							size="sm"
							variant={testType === "signup" ? "default" : "outline"}
							onClick={() => setTestType("signup")}
							className="text-xs h-7"
						>
							Sign Up
						</Button>
					</div>

					<Button
						onClick={testType === "signin" ? handleTestSignIn : handleTestSignUp}
						disabled={isLoading}
						className="w-full h-8 text-xs"
					>
						{isLoading ? "Testing..." : `Test ${testType === "signin" ? "Sign In" : "Sign Up"}`}
					</Button>

					{isAuthenticated && (
						<div className="text-xs text-green-600 bg-green-100 p-2 rounded">
							✅ Authenticated
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
} 