"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import CookiePolicy from "./CookiePolicy";

export default function CookieConsent() {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		// Check if user has already accepted cookies
		const hasAcceptedCookies = localStorage.getItem("cookiesAccepted");
		if (!hasAcceptedCookies) {
			// Wait a short time before showing the popup for better UX
			const timer = setTimeout(() => {
				setIsVisible(true);
			}, 1500);

			return () => clearTimeout(timer);
		}
	}, []);

	const acceptCookies = () => {
		localStorage.setItem("cookiesAccepted", "true");
		setIsVisible(false);
	};

	const declineCookies = () => {
		// You can implement custom logic for declining cookies
		// For now, we'll just hide the popup
		localStorage.setItem("cookiesAccepted", "false");
		setIsVisible(false);
	};

	if (!isVisible) return null;

	return (
		<div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t shadow-lg animate-in slide-in-from-bottom-5 duration-500">
			<div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
				<div className="flex-1">
					<p className="text-sm text-foreground">
						We use cookies to enhance your browsing experience, serve personalized ads or content,
						and analyze our traffic. By clicking "Accept", you consent to our use of cookies.{" "}
						<CookiePolicy />
					</p>
				</div>
				<div className="flex items-center gap-3 shrink-0">
					<Button variant="outline" size="sm" onClick={declineCookies}>
						Decline
					</Button>
					<Button
						variant="default"
						size="sm"
						className="bg-[#f6733c] hover:bg-[#e45f2d]"
						onClick={acceptCookies}
					>
						Accept
					</Button>
					<button
						className="text-muted-foreground hover:text-foreground"
						onClick={declineCookies}
						aria-label="Close cookie consent popup"
					>
						<X size={18} />
					</button>
				</div>
			</div>
		</div>
	);
}
