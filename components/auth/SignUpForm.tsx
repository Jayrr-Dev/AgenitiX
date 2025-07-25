"use client";

import { useState } from "react";
import { useAuthContext } from "./AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SignUpFormProps {
	onToggleMode?: () => void;
}

export const SignUpForm = ({ onToggleMode }: SignUpFormProps) => {
	const { signUp } = useAuthContext();
	const [formData, setFormData] = useState({
		email: "",
		name: "",
		company: "",
		role: "",
	});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			await signUp({
				email: formData.email,
				name: formData.name,
				company: formData.company || undefined,
				role: formData.role || undefined,
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Sign up failed");
		} finally {
			setIsLoading(false);
		}
	};

	const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData(prev => ({ ...prev, [field]: e.target.value }));
	};

	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle>Create Account</CardTitle>
				<CardDescription>
					Join AgenitiX to start building powerful automation workflows.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">Full Name</Label>
						<Input
							id="name"
							type="text"
							placeholder="Enter your full name"
							value={formData.name}
							onChange={handleChange("name")}
							required
							disabled={isLoading}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="Enter your email"
							value={formData.email}
							onChange={handleChange("email")}
							required
							disabled={isLoading}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="company">Company (Optional)</Label>
						<Input
							id="company"
							type="text"
							placeholder="Your company name"
							value={formData.company}
							onChange={handleChange("company")}
							disabled={isLoading}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="role">Role (Optional)</Label>
						<Input
							id="role"
							type="text"
							placeholder="Your role or title"
							value={formData.role}
							onChange={handleChange("role")}
							disabled={isLoading}
						/>
					</div>

					{error && (
						<div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
							{error}
						</div>
					)}

					<Button type="submit" className="w-full" disabled={isLoading}>
						{isLoading ? "Creating account..." : "Create Account"}
					</Button>

					{onToggleMode && (
						<div className="text-center">
							<button
								type="button"
								onClick={onToggleMode}
								className="text-sm text-blue-600 hover:text-blue-800 underline"
							>
								Already have an account? Sign in
							</button>
						</div>
					)}
				</form>
			</CardContent>
		</Card>
	);
};