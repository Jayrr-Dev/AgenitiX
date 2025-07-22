"use client";

import { ADAPTIVE_CONFIGS, RISK_LEVELS } from "@/lib/anubis/risk-engine";
import React, { useState, useEffect } from "react";

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

	// CHECK IF UI IS ENABLED
	const [showUI, setShowUI] = useState(false);
	useEffect(() => {
		const saved = localStorage.getItem("anubis-ui-enabled");
		setShowUI(saved === "true");
	}, []);

	// SIMULATE REAL-TIME METRICS (replace with actual API calls)
	useEffect(() => {
		const interval = setInterval(() => {
			setMetrics((prev) => ({
				totalRequests: prev.totalRequests + Math.floor(Math.random() * 10),
				blockedRequests: prev.blockedRequests + Math.floor(Math.random() * 2),
				optimisticSessions: prev.optimisticSessions + Math.floor(Math.random() * 5),
				averageRiskScore: Math.floor(Math.random() * 100),
				threatTrend: ["increasing", "decreasing", "stable"][Math.floor(Math.random() * 3)] as any,
			}));
		}, 5000);

		return () => clearInterval(interval);
	}, []);

	if (!showUI) return null;

	// TOGGLE DASHBOARD VISIBILITY
	const toggleDashboard = () => setIsVisible(!isVisible);

	const currentRisk = RISK_LEVELS[currentRiskLevel];
	const currentConfig = ADAPTIVE_CONFIGS[currentRiskLevel];

	if (!isVisible) {
		return (
			<button
				onClick={toggleDashboard}
				className="fixed top-4 right-20 bg-background/90 backdrop-blur-sm border border-border rounded-lg p-2 shadow-lg z-50 hover:bg-background/95 transition-colors"
				title="Open Risk Dashboard"
			>
				<div className="flex items-center gap-2">
					<div
						className="w-3 h-3 rounded-full animate-pulse"
						style={{ backgroundColor: currentRisk.color }}
					></div>
					<span className="text-xs font-medium">Risk: {currentRisk.name}</span>
				</div>
			</button>
		);
	}

	return (
		<div className="fixed top-4 right-4 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-xl z-50 w-96 max-h-[80vh] overflow-y-auto">
			{/* HEADER */}
			<div className="flex items-center justify-between p-4 border-b border-border">
				<h3 className="font-semibold text-foreground">Adaptive Risk Dashboard</h3>
				<button
					onClick={toggleDashboard}
					className="text-muted-foreground hover:text-foreground transition-colors"
				>
					✕
				</button>
			</div>

			{/* CURRENT RISK LEVEL */}
			<div className="p-4 border-b border-border">
				<div className="flex items-center gap-3 mb-3">
					<div
						className="w-4 h-4 rounded-full"
						style={{ backgroundColor: currentRisk.color }}
					></div>
					<div>
						<div className="font-medium text-foreground">Risk Level: {currentRisk.name}</div>
						<div className="text-xs text-muted-foreground">{currentRisk.description}</div>
					</div>
				</div>

				{/* RISK LEVEL SELECTOR */}
				<div className="space-y-2">
					<label className="text-xs text-muted-foreground">Simulate Risk Level:</label>
					<div className="grid grid-cols-5 gap-1">
						{Object.values(RISK_LEVELS).map((risk) => (
							<button
								key={risk.level}
								onClick={() => setCurrentRiskLevel(risk.level)}
								className={`p-2 rounded text-xs font-medium transition-colors ${
									currentRiskLevel === risk.level
										? "bg-foreground text-background"
										: "bg-muted hover:bg-muted/80 text-muted-foreground"
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
			<div className="p-4 border-b border-border">
				<h4 className="font-medium text-foreground mb-3">Current Configuration</h4>
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
						<span className="text-foreground font-medium">{currentConfig.gracePeriod / 1000}s</span>
					</div>

					<div className="flex justify-between">
						<span className="text-muted-foreground">Challenge Difficulty:</span>
						<span className="text-foreground font-medium">
							{currentConfig.challengeDifficulty}/12
						</span>
					</div>

					<div className="flex justify-between">
						<span className="text-muted-foreground">Max Failures:</span>
						<span className="text-foreground font-medium">{currentConfig.maxFailures}</span>
					</div>

					<div className="flex justify-between">
						<span className="text-muted-foreground">Session Timeout:</span>
						<span className="text-foreground font-medium">
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
			<div className="p-4 border-b border-border">
				<h4 className="font-medium text-foreground mb-3">Real-Time Metrics</h4>
				<div className="space-y-2 text-xs">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Total Requests:</span>
						<span className="text-foreground font-medium">
							{metrics.totalRequests.toLocaleString()}
						</span>
					</div>

					<div className="flex justify-between">
						<span className="text-muted-foreground">Blocked Requests:</span>
						<span className="text-red-500 font-medium">
							{metrics.blockedRequests.toLocaleString()}
						</span>
					</div>

					<div className="flex justify-between">
						<span className="text-muted-foreground">Optimistic Sessions:</span>
						<span className="text-blue-500 font-medium">
							{metrics.optimisticSessions.toLocaleString()}
						</span>
					</div>

					<div className="flex justify-between">
						<span className="text-muted-foreground">Avg Risk Score:</span>
						<span className="text-foreground font-medium">{metrics.averageRiskScore}/100</span>
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
				<h4 className="font-medium text-foreground mb-3">Risk Level Comparison</h4>
				<div className="space-y-2">
					{Object.values(RISK_LEVELS).map((risk) => {
						const config = ADAPTIVE_CONFIGS[risk.level];
						const isActive = currentRiskLevel === risk.level;

						return (
							<div
								key={risk.level}
								className={`p-2 rounded border transition-colors ${
									isActive ? "border-foreground bg-muted/50" : "border-border"
								}`}
							>
								<div className="flex items-center gap-2 mb-1">
									<div
										className="w-2 h-2 rounded-full"
										style={{ backgroundColor: risk.color }}
									></div>
									<span className="text-xs font-medium text-foreground">
										Level {risk.level}: {risk.name}
									</span>
								</div>

								<div className="text-xs text-muted-foreground grid grid-cols-3 gap-2">
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
			<div className="p-4 border-t border-border bg-muted/20">
				<div className="text-xs text-muted-foreground text-center">
					Adaptive security adjusts in real-time based on threat assessment
				</div>
			</div>
		</div>
	);
}

// RISK LEVEL INDICATOR (MINIMAL VERSION)
export function RiskIndicator() {
	const [currentRiskLevel, setCurrentRiskLevel] = useState(2);
	const currentRisk = RISK_LEVELS[currentRiskLevel];

	return (
		<div className="flex items-center gap-2 text-xs">
			<div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentRisk.color }}></div>
			<span className="text-muted-foreground">Risk: {currentRisk.name}</span>
		</div>
	);
}
