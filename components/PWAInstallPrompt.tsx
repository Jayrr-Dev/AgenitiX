"use client";

import { useInstallAppFlag } from "@/hooks/useInstallAppFlag";
import { Download, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";

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
		const isInWebAppiOS = (window.navigator as { standalone?: boolean }).standalone === true;

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
		if (!deferredPrompt) {
			return;
		}

		try {
			await deferredPrompt.prompt();
			const { outcome } = await deferredPrompt.userChoice;

			if (outcome === "accepted") {
			} else {
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
	if (
		!isFeatureEnabled ||
		isLoading ||
		isInstalled ||
		!showPrompt ||
		sessionStorage.getItem("pwa-prompt-dismissed")
	) {
		return null;
	}

	return (
		<div className="fixed right-4 bottom-4 left-4 z-50 md:right-4 md:left-auto md:w-80">
			<div className="rounded-lg border border-border bg-background p-4 shadow-lg">
				<div className="mb-3 flex items-start justify-between">
					<div className="flex items-center gap-2">
						<Smartphone className="h-5 w-5 text-primary" />
						<h3 className="font-semibold text-sm">Install App</h3>
					</div>
					<button
						type="button"
						onClick={handleDismiss}
						className="text-muted-foreground transition-colors hover:text-foreground"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				<p className="mb-4 text-muted-foreground text-sm">
					Install AgenitiX Flow Editor for a better experience with offline access and faster
					loading.
				</p>

				<div className="flex gap-2">
					<button
						type="button"
						onClick={handleInstallClick}
						className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
					>
						<Download className="h-4 w-4" />
						Install
					</button>
					<button
						type="button"
						onClick={handleDismiss}
						className="px-3 py-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
					>
						Not now
					</button>
				</div>
			</div>
		</div>
	);
}
