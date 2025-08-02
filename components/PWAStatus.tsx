"use client";

import { Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Loading } from "@/components/Loading";

// Extend ServiceWorkerRegistration to include sync
interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
	sync: {
		register(tag: string): Promise<void>;
	};
}

export default function PWAStatus() {
	const [isOnline, setIsOnline] = useState(true);
	const [isSyncing, setIsSyncing] = useState(false);
	const [showStatus, setShowStatus] = useState(false);

	useEffect(() => {
		// Set initial online status
		setIsOnline(navigator.onLine);

		const handleOnline = () => {
			setIsOnline(true);
			setShowStatus(true);

			// Hide status after 3 seconds
			setTimeout(() => setShowStatus(false), 3000);

			// Trigger sync when coming back online
			if ("serviceWorker" in navigator && "sync" in window.ServiceWorkerRegistration.prototype) {
				navigator.serviceWorker.ready
					.then((registration) => {
						const syncRegistration = registration as ServiceWorkerRegistrationWithSync;
						return syncRegistration.sync.register("save-flow-data");
					})
					.catch((error) => {
						console.error("Background sync registration failed:", error);
					});
			}
		};

		const handleOffline = () => {
			setIsOnline(false);
			setShowStatus(true);
		};

		// Listen for online/offline events
		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		// Listen for service worker messages
		if ("serviceWorker" in navigator) {
			navigator.serviceWorker.addEventListener("message", (event) => {
				if (event.data.type === "SYNC_START") {
					setIsSyncing(true);
				} else if (event.data.type === "SYNC_COMPLETE") {
					setIsSyncing(false);
				}
			});
		}

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	// Don't show status if online and not syncing
	if (isOnline && !isSyncing && !showStatus) {
		return null;
	}

	return (
		<div className="fixed top-4 right-4 z-50">
			<div
				className={`flex items-center gap-2 rounded-md px-3 py-2 font-medium text-sm transition-all duration-300 ${
					isOnline
						? "border border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
						: "border border-red-200 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
				}
      `}
			>
				{isSyncing ? (
					<>
						<Loading showText={false} size="w-4 h-4" className="p-0" />
						<span>Syncing...</span>
					</>
				) : isOnline ? (
					<>
						<Wifi className="h-4 w-4" />
						<span>Online</span>
					</>
				) : (
					<>
						<WifiOff className="h-4 w-4" />
						<span>Offline</span>
					</>
				)}
			</div>
		</div>
	);
}
