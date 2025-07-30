"use client";

import { CustomLogo } from "@/branding/custom-logo";
import { useEffect, useState } from "react";
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
			} catch (_error) {
				setServerStatus("disabled");
			}
		};

		checkServerStatus();
	}, []);

	// NOW WE CAN HAVE CONDITIONAL RETURNS
	if (!showUI) {
		return null;
	}

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
				type="button"
				onClick={toggleVisibility}
				className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-transparent bg-fill-border px-3 py-2 font-medium text-foreground text-sm shadow-lg backdrop-blur-lg transition-all duration-300 hover:animate-fill-transparency"
				title="Show AgenitiX Debug Info"
			>
				<CustomLogo size={16} />
				Debug
			</button>
		);
	}

	return (
		<div className="fixed top-4 right-4 z-50 w-80 rounded-lg border border-transparent bg-background bg-fill-border shadow-xl backdrop-blur-lg">
			<div className="p-4">
				<div className="mb-4 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<CustomLogo size={20} />
						<h3 className="font-brand font-semibold text-foreground">AgenitiX Debug</h3>
					</div>
					<button
						type="button"
						onClick={toggleVisibility}
						className="text-muted-foreground transition-colors hover:text-foreground"
						title="Hide Debug Info"
					>
						✕
					</button>
				</div>

				<div className="space-y-4">
					{/* CLIENT STATUS */}
					<div className="border-border border-b pb-3">
						<h4 className="mb-2 font-semibold font-ui text-secondary">Client Status</h4>
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
					<div className="border-border border-b pb-3">
						<h4 className="mb-2 font-semibold font-ui text-secondary">Server Status</h4>
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
					<div className="border-border border-b pb-3">
						<h4 className="mb-2 font-semibold font-ui text-secondary">Environment</h4>
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
						<h4 className="mb-2 font-semibold font-ui text-secondary">Actions</h4>
						<button
							type="button"
							onClick={triggerTestChallenge}
							className="w-full rounded-lg bg-secondary px-3 py-2 font-medium text-secondary-foreground text-sm transition-colors hover:bg-secondary/80"
						>
							🧪 Trigger Test Challenge
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
