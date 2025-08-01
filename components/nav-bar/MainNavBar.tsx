"use client";

import { LogomarkSvg } from "@/branding/logomark-svg";
import MainDesktopNav from "@/components/nav-bar/MainDesktopNav";
import MainMobileNav from "@/components/nav-bar/main-mobile-nav";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { cn } from "@/lib/utils";
import * as React from "react";

export default function MainNavBar() {
	const [scrolled, setScrolled] = React.useState(false);
	React.useEffect(() => {
		const handleScroll = () => {
			const isScrolled = window.scrollY > 10;
			if (isScrolled !== scrolled) {
				setScrolled(isScrolled);
			}
		};
		//Add scroll event listener
		window.addEventListener("scroll", handleScroll);
		// Remove event listener on cleanup
		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, [scrolled]);
	return (
		<header
			className={cn(
				"sticky top-0 z-50 w-full border-b shadow-sm bg-white/80 dark:bg-slate-900/80 opacity-95 backdrop-blur-lg transition-all duration-300 supports-backdrop-filter:bg-background/80",
				scrolled ? "h-16" : "h-16 md:h-20"
			)}
		>
			<nav id="main-nav" className="h-full w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div
					id="scroll-effect"
					className={cn("flex items-center justify-center h-full w-full", scrolled ? "py-2" : "py-3")}
				>
					{/* Mobile navigation - only visible on small screens */}
					<div
						id="mobile-nav-container"
						className="flex w-full items-center justify-between md:hidden"
					>
						<div id="mobile-logo" className="flex-shrink-0 flex items-center">
							<a href="/" className="flex cursor-pointer items-center space-x-2">
								<LogomarkSvg className="transition-all duration-300" />
								<span className="logoText block whitespace-nowrap font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500">
									AgenitiX
								</span>
							</a>
						</div>
						<div className="flex items-center">
							<MainMobileNav />
							<div className="flex-shrink-0 ml-4 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 p-1 transition-colors duration-200">
								<ThemeSwitcher />
							</div>
						</div>
					</div>
					
					{/* Desktop navigation with conditional border */}
					<div
						id="desktop-container"
						className={cn(
							"hidden md:flex md:items-center md:justify-between transition-all duration-300",
							scrolled 
								? "max-w-[80%] px-6 py-1" 
								: "w-full"
						)}
					>
						{/* Logo */}
						<div id="desktop-logo" className="flex-shrink-0 flex items-center mr-4">
							<a href="/" className="flex cursor-pointer items-center space-x-2">
								<LogomarkSvg
									className={cn(
										"transition-all duration-300",
										scrolled ? "origin-left scale-90" : ""
									)}
								/>
								<div
									className={cn(
										"flex flex-col transition-all duration-300",
										scrolled ? "origin-left scale-90" : ""
									)}
								>
									<span className="logoText block whitespace-nowrap font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500">
										AgenitiX
									</span>
								</div>
							</a>
						</div>
						
						{/* Navigation */}
						<div className="flex-1 flex items-center justify-center">
							<MainDesktopNav scrolled={scrolled} />
						</div>
						
						{/* Theme switcher */}
						<div
							id="theme-switcher"
							className="flex-shrink-0 ml-4 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 p-1 transition-colors duration-200"
						>
							<ThemeSwitcher />
						</div>
					</div>
				</div>
			</nav>
		</header>
	);
}
