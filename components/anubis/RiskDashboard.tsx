"use client";

import { ADAPTIVE_CONFIGS, RISK_LEVELS } from "@/lib/anubis/risk-engine";
import { useEffect, useRef, useState } from "react";

// RISK DASHBOARD COMPONENT
export function RiskDashboard() {
	const [currentRiskLevel, setCurrentRiskLevel] = useState(2);
	const [isVisible, setIsVisible] = useState(false);
	const [metrics, setMetrics] = useState({
		totalRequests: 0,
		blockedRequests: 0,
		optimisticSessions: 0,
		averageRiskScore: 0,
		threatTrend: "stable" as "increasing" | "decreasing" | "stable",
	});

	// Ref to track if dashboard is visible
	const isVisibleRef = useRef(isVisible);

	// CHECK IF UI IS ENABLED
	const [showUI, setShowUI] = useState(false);
	useEffect(() => {
		const saved = localStorage.getItem("anubis-ui-enabled");
		setShowUI(saved === "true");
	}, []);

	// SIMULATE REAL-TIME METRICS (replace with actual API calls)
	useEffect(() => {
		let isMounted = true;

		const interval = setInterval(() => {
			if (!(isMounted && isVisibleRef.current)) {
				return;
			}

			setMetrics((prev) => ({
				totalRequests: prev.totalRequests + Math.floor(Math.random() * 10),
				blockedRequests: prev.blockedRequests + Math.floor(Math.random() * 2),
				optimisticSessions: prev.optimisticSessions + Math.floor(Math.random() * 5),
				averageRiskScore: Math.floor(Math.random() * 100),
				threatTrend: ["increasing", "decreasing", "stable"][Math.floor(Math.random() * 3)] as any,
			}));
		}, 5000);

		return () => {
			isMounted = false;
			clearInterval(interval);
		};
	}, []);

	if (!showUI) {
		return null;
	}

	// TOGGLE DASHBOARD VISIBILITY
	const toggleDashboard = () => {
		const newVisibility = !isVisible;
		setIsVisible(newVisibility);
		isVisibleRef.current = newVisibility;
	};

	const currentRisk = RISK_LEVELS[currentRiskLevel];
	const currentConfig = ADAPTIVE_CONFIGS[currentRiskLevel];

	if (!isVisible) {
		return (
			<button
				onClick={toggleDashboard}
				className="fixed top-4 right-20 z-50 rounded-lg border border-border bg-background/90 p-2 shadow-lg backdrop-blur-sm transition-colors hover:bg-background/95"
				title="Open Risk Dashboard"
			>
				<div className="flex items-center gap-2">
					<div
						className="h-3 w-3 animate-pulse rounded-full"
						style={{ backgroundColor: currentRisk.color }}
					/>
					<span className="font-medium text-xs">Risk: {currentRisk.name}</span>
				</div>
			</button>
		);
	}

	return (
		<div className="fixed top-4 right-4 z-50 max-h-[80vh] w-96 overflow-y-auto rounded-lg border border-border bg-background/95 shadow-xl backdrop-blur-sm">
			{/* HEADER */}
			<div className="flex items-center justify-between border-border border-b p-4">
				<h3 className="font-semibold text-foreground">Adaptive Risk Dashboard</h3>
				<button
					onClick={toggleDashboard}
					className="text-muted-foreground transition-colors hover:text-foreground"
				>
					✕
				</button>
			</div>

			{/* CURRENT RISK LEVEL */}
			<div className="border-border border-b p-4">
				<div className="mb-3 flex items-center gap-3">
					<div className="h-4 w-4 rounded-full" style={{ backgroundColor: currentRisk.color }} />
					<div>
						<div className="font-medium text-foreground">Risk Level: {currentRisk.name}</div>
						<div className="text-muted-foreground text-xs">{currentRisk.description}</div>
					</div>
				</div>

				{/* RISK LEVEL SELECTOR */}
				<div className="space-y-2">
					<label className="text-muted-foreground text-xs">Simulate Risk Level:</label>
					<div className="grid grid-cols-5 gap-1">
						{Object.values(RISK_LEVELS).map((risk) => (
							<button
								key={risk.level}
								onClick={() => setCurrentRiskLevel(risk.level)}
								className={`rounded p-2 font-medium text-xs transition-colors ${
									currentRiskLevel === risk.level
										? "bg-foreground text-background"
										: "bg-muted text-muted-foreground hover:bg-muted/80"
								}`}
								style={{
									backgroundColor: currentRiskLevel === risk.level ? risk.color : undefined,
								}}
							>
								L{risk.level}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* ADAPTIVE CONFIGURATION */}
			<div className="border-border border-b p-4">
				<h4 className="mb-3 font-medium text-foreground">Current Configuration</h4>
				<div className="space-y-2 text-xs">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Optimistic Mode:</span>
						<span
							className={`font-medium ${currentConfig.optimisticEnabled ? "text-green-500" : "text-red-500"}`}
						>
							{currentConfig.optimisticEnabled ? "Enabled" : "Disabled"}
						</span>
					</div>

					<div className="flex justify-between">
						<span className="text-muted-foreground">Grace Period:</span>
						<span className="font-medium text-foreground">{currentConfig.gracePeriod / 1000}s</span>
					</div>

					<div className="flex justify-between">
						<span className="text-muted-foreground">Challenge Difficulty:</span>
						<span className="font-medium text-foreground">
							{currentConfig.challengeDifficulty}/12
						</span>
					</div>

					<div className="flex justify-between">
						<span className="text-muted-foreground">Max Failures:</span>
						<span className="font-medium text-foreground">{currentConfig.maxFailures}</span>
					</div>

					<div className="flex justify-between">
						<span className="text-muted-foreground">Session Timeout:</span>
						<span className="font-medium text-foreground">
							{currentConfig.sessionTimeout / 60000}m
						</span>
					</div>

					<div className="flex justify-between">
						<span className="text-muted-foreground">Requires Interaction:</span>
						<span
							className={`font-medium ${currentConfig.requiresInteraction ? "text-yellow-500" : "text-green-500"}`}
						>
							{currentConfig.requiresInteraction ? "Yes" : "No"}
						</span>
					</div>

					<div className="flex justify-between">
						<span className="text-muted-foreground">Blocking Mode:</span>
						<span
							className={`font-medium ${currentConfig.blockingMode ? "text-red-500" : "text-green-500"}`}
						>
							{currentConfig.blockingMode ? "Active" : "Inactive"}
						</span>
					</div>
				</div>
			</div>

			{/* REAL-TIME METRICS */}
			<div className="border-border border-b p-4">
				<h4 className="mb-3 font-medium text-foreground">Real-Time Metrics</h4>
				<div className="space-y-2 text-xs">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Total Requests:</span>
						<span className="font-medium text-foreground">
							{metrics.totalRequests.toLocaleString()}
						</span>
					</div>

					<div className="flex justify-between">
						<span className="text-muted-foreground">Blocked Requests:</span>
						<span className="font-medium text-red-500">
							{metrics.blockedRequests.toLocaleString()}
						</span>
					</div>

					<div className="flex justify-between">
						<span className="text-muted-foreground">Optimistic Sessions:</span>
						<span className="font-medium text-blue-500">
							{metrics.optimisticSessions.toLocaleString()}
						</span>
					</div>

					<div className="flex justify-between">
						<span className="text-muted-foreground">Avg Risk Score:</span>
						<span className="font-medium text-foreground">{metrics.averageRiskScore}/100</span>
					</div>

					<div className="flex justify-between">
						<span className="text-muted-foreground">Threat Trend:</span>
						<span
							className={`font-medium ${
								metrics.threatTrend === "increasing"
									? "text-red-500"
									: metrics.threatTrend === "decreasing"
										? "text-green-500"
										: "text-blue-500"
							}`}
						>
							{metrics.threatTrend === "increasing"
								? "↗️ Rising"
								: metrics.threatTrend === "decreasing"
									? "↘️ Falling"
									: "→ Stable"}
						</span>
					</div>
				</div>
			</div>

			{/* RISK LEVEL COMPARISON */}
			<div className="p-4">
				<h4 className="mb-3 font-medium text-foreground">Risk Level Comparison</h4>
				<div className="space-y-2">
					{Object.values(RISK_LEVELS).map((risk) => {
						const config = ADAPTIVE_CONFIGS[risk.level];
						const isActive = currentRiskLevel === risk.level;

						return (
							<div
								key={risk.level}
								className={`rounded border p-2 transition-colors ${
									isActive ? "border-foreground bg-muted/50" : "border-border"
								}`}
							>
								<div className="mb-1 flex items-center gap-2">
									<div className="h-2 w-2 rounded-full" style={{ backgroundColor: risk.color }} />
									<span className="font-medium text-foreground text-xs">
										Level {risk.level}: {risk.name}
									</span>
								</div>

								<div className="grid grid-cols-3 gap-2 text-muted-foreground text-xs">
									<div>Grace: {config.gracePeriod / 1000}s</div>
									<div>Diff: {config.challengeDifficulty}</div>
									<div>Opt: {config.optimisticEnabled ? "✅" : "❌"}</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* FOOTER */}
			<div className="border-border border-t bg-muted/20 p-4">
				<div className="text-center text-muted-foreground text-xs">
					Adaptive security adjusts in real-time based on threat assessment
				</div>
			</div>
		</div>
	);
}

// RISK LEVEL INDICATOR (MINIMAL VERSION)
export function RiskIndicator() {
	const [currentRiskLevel, _setCurrentRiskLevel] = useState(2);
	const currentRisk = RISK_LEVELS[currentRiskLevel];

	return (
		<div className="flex items-center gap-2 text-xs">
			<div className="h-2 w-2 rounded-full" style={{ backgroundColor: currentRisk.color }} />
			<span className="text-muted-foreground">Risk: {currentRisk.name}</span>
		</div>
	);
}
