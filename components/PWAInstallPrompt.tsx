"use client";

import { Download, Smartphone, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useInstallAppFlag } from "@/hooks/useInstallAppFlag";

interface BeforeInstallPromptEvent extends Event {
	readonly platforms: string[];
	readonly userChoice: Promise<{
		outcome: "accepted" | "dismissed";
		platform: string;
	}>;
	prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
	const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
	const [showPrompt, setShowPrompt] = useState(false);
	const [isInstalled, setIsInstalled] = useState(false);
	const { isEnabled: isFeatureEnabled, isLoading } = useInstallAppFlag();

	useEffect(() => {
		// Don't proceed if feature is disabled or still loading
		if (!isFeatureEnabled || isLoading) {
			return;
		}

		// Check if app is already installed
		const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
		const isInWebAppiOS = (window.navigator as any).standalone === true;

		if (isStandalone || isInWebAppiOS) {
			setIsInstalled(true);
			return;
		}

		// Listen for the beforeinstallprompt event
		const handleBeforeInstallPrompt = (e: Event) => {
			e.preventDefault();
			setDeferredPrompt(e as BeforeInstallPromptEvent);

			// Show prompt after a delay (don't be too aggressive)
			setTimeout(() => {
				setShowPrompt(true);
			}, 3000);
		};

		// Listen for app installed event
		const handleAppInstalled = () => {
			setIsInstalled(true);
			setShowPrompt(false);
			setDeferredPrompt(null);
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
		window.addEventListener("appinstalled", handleAppInstalled);

		return () => {
			window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
			window.removeEventListener("appinstalled", handleAppInstalled);
		};
	}, [isFeatureEnabled, isLoading]);

	const handleInstallClick = async () => {
		if (!deferredPrompt) return;

		try {
			await deferredPrompt.prompt();
			const { outcome } = await deferredPrompt.userChoice;

			if (outcome === "accepted") {
				console.log("User accepted the install prompt");
			} else {
				console.log("User dismissed the install prompt");
			}
		} catch (error) {
			console.error("Error during installation:", error);
		}

		setDeferredPrompt(null);
		setShowPrompt(false);
	};

	const handleDismiss = () => {
		setShowPrompt(false);
		// Don't show again for this session
		sessionStorage.setItem("pwa-prompt-dismissed", "true");
	};

	// Don't show if feature is disabled, loading, already installed, or dismissed this session
	if (!isFeatureEnabled || isLoading || isInstalled || !showPrompt || sessionStorage.getItem("pwa-prompt-dismissed")) {
		return null;
	}

	return (
		<div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50">
			<div className="bg-background border border-border rounded-lg shadow-lg p-4">
				<div className="flex items-start justify-between mb-3">
					<div className="flex items-center gap-2">
						<Smartphone className="w-5 h-5 text-primary" />
						<h3 className="font-semibold text-sm">Install App</h3>
					</div>
					<button
						onClick={handleDismiss}
						className="text-muted-foreground hover:text-foreground transition-colors"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				<p className="text-sm text-muted-foreground mb-4">
					Install AgenitiX Flow Editor for a better experience with offline access and faster
					loading.
				</p>

				<div className="flex gap-2">
					<button
						onClick={handleInstallClick}
						className="flex-1 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
					>
						<Download className="w-4 h-4" />
						Install
					</button>
					<button
						onClick={handleDismiss}
						className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						Not now
					</button>
				</div>
			</div>
		</div>
	);
}
