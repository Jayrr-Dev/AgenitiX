"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

interface DevAuthHelperProps {
	onAuthenticate: (token: string) => void;
}

export const DevAuthHelper = ({ onAuthenticate }: DevAuthHelperProps) => {
	const [isLoading, setIsLoading] = useState(false);

	// Only show in development
	if (process.env.NODE_ENV === "production") {
		return null;
	}

	const handleDevAuth = () => {
		setIsLoading(true);
		// Use the session token from the setup script
		const devToken = "dev_session_jd7bvyrc83wrykgb68y42vz5817md7je_1753479786106";

		// Store in localStorage
		localStorage.setItem("agenitix_auth_token", devToken);

		// Trigger authentication
		onAuthenticate(devToken);

		setIsLoading(false);
	};

	return (
		<Card className="mx-auto mt-8 max-w-md border-yellow-200 bg-yellow-50">
			<CardHeader>
				<CardTitle className="text-yellow-800">Development Mode</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-sm text-yellow-700">Quick authentication for development testing</p>
				<Button
					onClick={handleDevAuth}
					disabled={isLoading}
					variant="outline"
					className="w-full border-yellow-300 text-yellow-800 hover:bg-yellow-100"
				>
					{isLoading ? "Authenticating..." : "Sign in as Test User"}
				</Button>
				<p className="text-xs text-yellow-600">Email: test@example.com</p>
			</CardContent>
		</Card>
	);
};
