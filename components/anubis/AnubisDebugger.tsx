"use client";

import { CustomLogo } from "@/branding/custom-logo";
import React, { useState, useEffect } from "react";
import { useAnubis } from "./AnubisProvider";

// AGENITIX DEBUG COMPONENT
export function AnubisDebugger() {
	const { isEnabled, isProtected, currentRoute } = useAnubis();

	// ALL STATE HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL RETURNS
	const [showUI, setShowUI] = useState(false);
	const [isVisible, setIsVisible] = useState(false);
	const [serverStatus, setServerStatus] = useState<"checking" | "enabled" | "disabled">("checking");

	// ALL EFFECT HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL RETURNS
	useEffect(() => {
		const saved = localStorage.getItem("anubis-ui-enabled");
		setShowUI(saved === "true");
	}, []);

	// CHECK SERVER-SIDE STATUS
	useEffect(() => {
		const checkServerStatus = async () => {
			try {
				const response = await fetch("/api/anubis/status");
				if (response.ok) {
					const data = await response.json();
					setServerStatus(data.enabled ? "enabled" : "disabled");
				} else {
					setServerStatus("disabled");
				}
			} catch (error) {
				setServerStatus("disabled");
			}
		};

		checkServerStatus();
	}, []);

	// NOW WE CAN HAVE CONDITIONAL RETURNS
	if (!showUI) return null;

	// TOGGLE VISIBILITY
	const toggleVisibility = () => setIsVisible(!isVisible);

	// TRIGGER TEST CHALLENGE
	const triggerTestChallenge = () => {
		// Clear auth cookie to force challenge
		document.cookie = "anubis-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
		window.location.reload();
	};

	if (!isVisible) {
		return (
			<button
				onClick={toggleVisibility}
				className="fixed top-4 right-4 px-3 py-2 rounded-lg text-sm font-medium shadow-lg z-50 flex items-center gap-2 border border-transparent bg-fill-border hover:animate-fill-transparency backdrop-blur-lg text-foreground transition-all duration-300"
				title="Show AgenitiX Debug Info"
			>
				<CustomLogo size={16} />
				Debug
			</button>
		);
	}

	return (
		<div className="fixed top-4 right-4 w-80 bg-background border border-transparent bg-fill-border rounded-lg shadow-xl z-50 backdrop-blur-lg">
			<div className="p-4">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-2">
						<CustomLogo size={20} />
						<h3 className="font-brand font-semibold text-foreground">AgenitiX Debug</h3>
					</div>
					<button
						onClick={toggleVisibility}
						className="text-muted-foreground hover:text-foreground transition-colors"
						title="Hide Debug Info"
					>
						✕
					</button>
				</div>

				<div className="space-y-4">
					{/* CLIENT STATUS */}
					<div className="border-b border-border pb-3">
						<h4 className="font-ui font-semibold text-secondary mb-2">Client Status</h4>
						<div className="space-y-1">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Enabled:</span>
								<span className={isEnabled ? "text-secondary" : "text-red-400"}>
									{isEnabled ? "✅ Yes" : "❌ No"}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Protected:</span>
								<span className={isProtected ? "text-secondary" : "text-yellow-400"}>
									{isProtected ? "🛡️ Yes" : "🔓 No"}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Route:</span>
								<span className="text-foreground text-xs">{currentRoute}</span>
							</div>
						</div>
					</div>

					{/* SERVER STATUS */}
					<div className="border-b border-border pb-3">
						<h4 className="font-ui font-semibold text-secondary mb-2">Server Status</h4>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Server:</span>
							<span
								className={
									serverStatus === "enabled"
										? "text-secondary"
										: serverStatus === "disabled"
											? "text-red-400"
											: "text-yellow-400"
								}
							>
								{serverStatus === "enabled"
									? "✅ Enabled"
									: serverStatus === "disabled"
										? "❌ Disabled"
										: "⏳ Checking..."}
							</span>
						</div>
					</div>

					{/* ENVIRONMENT INFO */}
					<div className="border-b border-border pb-3">
						<h4 className="font-ui font-semibold text-secondary mb-2">Environment</h4>
						<div className="space-y-1">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Mode:</span>
								<span className="text-foreground">{process.env.NODE_ENV || "development"}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Cookies:</span>
								<span className="text-foreground">
									{document.cookie.includes("anubis-auth") ? "🍪 Has Auth" : "🚫 No Auth"}
								</span>
							</div>
						</div>
					</div>

					{/* ACTIONS */}
					<div>
						<h4 className="font-ui font-semibold text-secondary mb-2">Actions</h4>
						<button
							onClick={triggerTestChallenge}
							className="w-full px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
						>
							🧪 Trigger Test Challenge
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
