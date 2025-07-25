"use client";

import { useState } from "react";
import { useAuthContext } from "./AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LoginFormProps {
	onToggleMode?: () => void;
}

export const LoginForm = ({ onToggleMode }: LoginFormProps) => {
	const { signIn } = useAuthContext();
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			const result = await signIn({ email });
			// Show success message with toast
			const { toast } = await import("sonner");
			toast.success("Magic link sent!", {
				description: result.message,
				duration: 5000,
			});
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : "Login failed";
			setError(errorMessage);
			
			// Also show toast for better UX
			const { toast } = await import("sonner");
			toast.error("Sign in failed", {
				description: errorMessage,
				duration: 5000,
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle>Welcome Back</CardTitle>
				<CardDescription>
					Sign in to your AgenitiX account to continue building workflows.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="Enter your email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							disabled={isLoading}
						/>
					</div>

					{error && (
						<div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
							{error}
						</div>
					)}

					<Button type="submit" className="w-full" disabled={isLoading}>
						{isLoading ? "Signing in..." : "Sign In"}
					</Button>

					{onToggleMode && (
						<div className="text-center">
							<button
								type="button"
								onClick={onToggleMode}
								className="text-sm text-blue-600 hover:text-blue-800 underline"
							>
								Don't have an account? Sign up
							</button>
						</div>
					)}
				</form>
			</CardContent>
		</Card>
	);
};