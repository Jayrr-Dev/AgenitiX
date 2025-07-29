"use client";

import { useEffect, useState } from "react";

// SIMPLE ANUBIS UI TOGGLE
export function AnubisToggle() {
	const [showAnubisUI, setShowAnubisUI] = useState(false);

	// LOAD STATE FROM LOCALSTORAGE
	useEffect(() => {
		const saved = localStorage.getItem("anubis-ui-enabled");
		if (saved !== null) {
			setShowAnubisUI(saved === "true");
		}
	}, []);

	// TOGGLE AND SAVE STATE
	const handleToggle = () => {
		const newState = !showAnubisUI;
		setShowAnubisUI(newState);
		localStorage.setItem("anubis-ui-enabled", newState.toString());

		// TRIGGER PAGE RELOAD TO APPLY CHANGES
		window.location.reload();
	};

	return (
		<div className="fixed top-4 left-4 z-50 rounded-lg border border-border bg-background/90 p-3 shadow-lg backdrop-blur-sm">
			<div className="flex items-center gap-3">
				<span className="font-medium text-foreground text-sm">Anubis UI:</span>
				<button
					type="button"
					onClick={handleToggle}
					className={`rounded px-3 py-1 font-medium text-sm transition-colors ${
						showAnubisUI ? "bg-green-500 text-white" : "bg-red-500 text-white"
					}`}
				>
					{showAnubisUI ? "true" : "false"}
				</button>
			</div>
		</div>
	);
}

// HOOK TO CHECK IF ANUBIS UI SHOULD BE SHOWN
export function useAnubisUIEnabled() {
	const [enabled, setEnabled] = useState(false);

	useEffect(() => {
		const saved = localStorage.getItem("anubis-ui-enabled");
		setEnabled(saved === "true");
	}, []);

	return enabled;
}
