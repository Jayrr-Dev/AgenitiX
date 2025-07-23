"use client";

import { LogomarkLight } from "@/branding/logomark-svg";
import MainDesktopNav from "@/components/nav-bar/MainDesktopNav";
import MainMobileNav from "@/components/nav-bar/MainMobileNav";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
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
				"sticky top-0 z-50 w-full border-b bg-fill-border opacity-95 backdrop-blur-lg supports-backdrop-filter:bg-background/60 transition-all duration-300",
				scrolled ? "h-16" : "md:h-24 h-16"
			)}
		>
			<nav id="main-nav" className="xdebug-red w-full h-full  ">
				<div
					id="scroll-effect"
					className={cn(" h-full grid grid-cols-12  w-full", scrolled ? "py-2" : "py-2")}
				>
					<div
						id="logo"
						className="xdebug-green col-span-4 md:col-span-2 self-center justify-self-center border-b border-transparent   bg-fill-border hover:animate-fill-transparency"
					>
						<a href="/" className=" flex flex-row items-center justify-center cursor-pointer ">
							<LogomarkLight
								className={cn(
									"transition-all duration-300 pl-2",
									scrolled ? "scale-90 origin-left" : ""
								)}
							/>
							<div
								className={cn(
									"flex flex-col transition-all duration-300",
									scrolled ? "scale-90 origin-left" : ""
								)}
							>
								<span className="font-bold block sm:hidden lg:block text-2xl lg:text-xl logoText whitespace-nowrap sm:whitespace-normal ml-4">
									AgenitiX
								</span>
							</div>
						</a>
					</div>
					<div
						id="desktop-nav"
						className="xdebug-blue col-span-8 self-center  hidden md:block justify-self-center"
					>
						<MainDesktopNav />
					</div>
					<div
						id="mobile-nav"
						className="xdebug-yellow md:hidden w-full flex items-center justify-end col-span-6"
					>
						<MainMobileNav />
					</div>

					<div
						id="theme-switcher"
						className="border border-transparent rounded-full  xdebug-blue col-span-2 self-center justify-self-center  bg-fill-border hover:animate-fill-transparency"
					>
						<ThemeSwitcher />
					</div>
				</div>
			</nav>
		</header>
	);
}
