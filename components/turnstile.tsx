// components/turnstile.tsx
"use client";

import { useEffect, useRef } from "react";

interface TurnstileProps {
	siteKey: string;
	onVerify: (token: string) => void;
	theme?: "light" | "dark";
	size?: "compact" | "normal";
}

export default function Turnstile({
	siteKey,
	onVerify,
	theme = "light",
	size = "normal",
}: TurnstileProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const widgetIdRef = useRef<string | null>(null);

	useEffect(() => {
		// Load the turnstile script if it's not already loaded
		if (!(window as any).turnstile) {
			const script = document.createElement("script");
			script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
			script.async = true;
			script.defer = true;
			document.head.appendChild(script);
		}

		const handleRender = () => {
			if (!containerRef.current || !(window as any).turnstile) return;

			// If a widget was already rendered, remove it first instead of resetting
			if (widgetIdRef.current) {
				try {
					(window as any).turnstile.remove(widgetIdRef.current);
				} catch (error) {
					console.error("Error removing Turnstile widget:", error);
				}
			}

			// Render new widget
			widgetIdRef.current = (window as any).turnstile.render(containerRef.current, {
				sitekey: siteKey,
				callback: (token: string) => {
					onVerify(token);
				},
				theme: theme,
				size: size,
			});
		};

		// Check if turnstile is already loaded
		if ((window as any).turnstile) {
			handleRender();
		} else {
			// Otherwise wait for it to load
			const checkTurnstile = setInterval(() => {
				if ((window as any).turnstile) {
					clearInterval(checkTurnstile);
					handleRender();
				}
			}, 100);

			return () => clearInterval(checkTurnstile);
		}

		return () => {
			if (widgetIdRef.current && (window as any).turnstile) {
				try {
					(window as any).turnstile.remove(widgetIdRef.current);
				} catch (error) {
					console.error("Error removing Turnstile widget on cleanup:", error);
				}
			}
		};
	}, [siteKey, theme, size]);

	return <div ref={containerRef} className="mt-4" />;
}
