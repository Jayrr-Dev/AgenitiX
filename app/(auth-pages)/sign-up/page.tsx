"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, ArrowRight, User, Building } from "lucide-react";
import Link from "next/link";

export default function SignUpPage() {
	const { signUp, isAuthenticated, isLoading: authLoading } = useAuthContext();
	const router = useRouter();
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		company: "",
		role: "",
	});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Redirect if already authenticated
	useEffect(() => {
		if (!authLoading && isAuthenticated) {
			router.push("/dashboard");
		}
	}, [isAuthenticated, authLoading, router]);

	// Don't render if authenticated (will redirect)
	if (authLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (isAuthenticated) {
		return null;
	}

	const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData(prev => ({ ...prev, [field]: e.target.value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			const result = await signUp({
				name: formData.name.trim(),
				email: formData.email.trim(),
				company: formData.company.trim() || undefined,
				role: formData.role.trim() || undefined,
			});
			
			// Show success message with toast
			setError(null);
			const { toast } = await import("sonner");
			toast.success("Account created!", {
				description: result.message,
				duration: 5000,
			});
			
		} catch (err) {
			const { formatAuthError } = await import("@/lib/auth-utils");
			const errorMessage = formatAuthError(err);
			setError(errorMessage);
			
			// Also show toast for better UX
			const { toast } = await import("sonner");
			toast.error("Sign up failed", {
				description: errorMessage,
				duration: 5000,
			});
		} finally {
			setIsLoading(false);
		}
	};

	const isFormValid = formData.name.trim() && formData.email.trim();

	return (
		<div className="min-h-screen flex">
			{/* Left side - Branding */}
			<div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 to-blue-700 p-12 text-white flex-col justify-between">
				<div>
					<h1 className="text-4xl font-bold mb-4">Join AgenitiX</h1>
					<p className="text-xl opacity-90">
						Start automating your workflows today
					</p>
				</div>
				
				<div className="space-y-6">
					<div className="flex items-start space-x-4">
						<div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
							<User className="w-4 h-4" />
						</div>
						<div>
							<h3 className="font-semibold">Free to Get Started</h3>
							<p className="text-sm opacity-80">
								Create your account and start building workflows immediately
							</p>
						</div>
					</div>
					
					<div className="flex items-start space-x-4">
						<div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
							<Building className="w-4 h-4" />
						</div>
						<div>
							<h3 className="font-semibold">Team Collaboration</h3>
							<p className="text-sm opacity-80">
								Invite your team members and collaborate on automation projects
							</p>
						</div>
					</div>
					
					<div className="flex items-start space-x-4">
						<div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
							<ArrowRight className="w-4 h-4" />
						</div>
						<div>
							<h3 className="font-semibold">Enterprise Ready</h3>
							<p className="text-sm opacity-80">
								Scale your automations with enterprise-grade security and reliability
							</p>
						</div>
					</div>
				</div>
				
				<div className="text-sm opacity-70">
					© 2025 AgenitiX. All rights reserved.
				</div>
			</div>

			{/* Right side - Sign up form */}
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
								Create your account
							</CardTitle>
							<CardDescription className="text-center">
								Join thousands of users automating their workflows
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit} className="space-y-4">
								<div className="grid grid-cols-1 gap-4">
									<div className="space-y-2">
										<Label htmlFor="name">Full name *</Label>
										<Input
											id="name"
											type="text"
											placeholder="Enter your full name"
											value={formData.name}
											onChange={handleChange("name")}
											required
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
											required
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
									className="w-full h-11" 
									disabled={isLoading || !isFormValid}
								>
									{isLoading ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Creating account...
										</>
									) : (
										"Create account"
									)}
								</Button>

								<div className="text-center text-sm">
									<span className="text-gray-600">Already have an account? </span>
									<Link 
										href="/sign-in" 
										className="font-medium text-blue-600 hover:text-blue-500"
									>
										Sign in
									</Link>
								</div>
							</form>
						</CardContent>
					</Card>

					{/* Additional info */}
					<div className="text-center text-xs text-gray-500">
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