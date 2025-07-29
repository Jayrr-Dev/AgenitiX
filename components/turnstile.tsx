/**
 * TURNSTILE COMPONENT - Cloudflare Turnstile CAPTCHA integration
 *
 * • Loads and manages Cloudflare Turnstile widget
 * • Handles widget lifecycle (render, remove, cleanup)
 * • Provides proper TypeScript types for Turnstile API
 * • Responsive theme support based on system/user preference
 * • Automatic cleanup on component unmount
 *
 * Keywords: captcha, turnstile, cloudflare, security, typescript
 */

import { useEffect, useRef } from "react";

interface TurnstileWidget {
	render: (
		container: HTMLElement,
		options: {
			sitekey: string;
			callback: (token: string) => void;
			theme: "light" | "dark" | "auto";
			size?: "compact" | "normal";
		}
	) => string;
	remove: (widgetId: string) => void;
}

declare global {
	interface Window {
		turnstile?: TurnstileWidget;
	}
}

interface TurnstileProps {
	siteKey: string;
	onVerify: (token: string) => void;
	theme?: "light" | "dark" | "auto";
}

export default function Turnstile({ siteKey, onVerify, theme = "auto" }: TurnstileProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const widgetIdRef = useRef<string | null>(null);

	useEffect(() => {
		// Load the turnstile script if it's not already loaded
		if (!window.turnstile) {
			const script = document.createElement("script");
			script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
			script.async = true;
			script.defer = true;
			document.head.appendChild(script);
		}

		const handleRender = () => {
			if (!(containerRef.current && window.turnstile)) {
				return;
			}

			// If a widget was already rendered, remove it first instead of resetting
			if (widgetIdRef.current) {
				try {
					window.turnstile.remove(widgetIdRef.current);
				} catch (error) {
					console.error("Error removing Turnstile widget:", error);
				}
			}

			// Render new widget
			widgetIdRef.current = window.turnstile.render(containerRef.current, {
				sitekey: siteKey,
				callback: (token: string) => {
					onVerify(token);
				},
				theme: theme,
				size: "normal", // Default size, can be overridden by props if needed
			});
		};

		// Check if turnstile is already loaded
		if (window.turnstile) {
			handleRender();
		} else {
			// Otherwise wait for it to load
			const checkTurnstile = setInterval(() => {
				if (window.turnstile) {
					clearInterval(checkTurnstile);
					handleRender();
				}
			}, 100);

			return () => clearInterval(checkTurnstile);
		}

		return () => {
			if (widgetIdRef.current && window.turnstile) {
				try {
					window.turnstile.remove(widgetIdRef.current);
				} catch (error) {
					console.error("Error removing Turnstile widget on cleanup:", error);
				}
			}
		};
	}, [siteKey, theme, onVerify]);

	return <div ref={containerRef} className="mt-4" />;
}
