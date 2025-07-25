"use client";

import { useState } from "react";
import { LoginForm } from "./LoginForm";
import { SignUpForm } from "./SignUpForm";

export const AuthPage = () => {
	const [mode, setMode] = useState<"login" | "signup">("login");

	const toggleMode = () => {
		setMode(prev => prev === "login" ? "signup" : "login");
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				<div className="text-center">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						AgenitiX
					</h1>
					<p className="text-gray-600">
						Visual Flow Automation Platform
					</p>
				</div>

				{mode === "login" ? (
					<LoginForm onToggleMode={toggleMode} />
				) : (
					<SignUpForm onToggleMode={toggleMode} />
				)}
			</div>
		</div>
	);
};