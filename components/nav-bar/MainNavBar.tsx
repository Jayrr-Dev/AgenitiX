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
				"sticky top-0 z-50 w-full border-b bg-fill-border opacity-95 backdrop-blur-lg transition-all duration-300 supports-backdrop-filter:bg-background/60",
				scrolled ? "h-16" : "h-16 md:h-24"
			)}
		>
			<nav id="main-nav" className="xdebug-red h-full w-full ">
				<div
					id="scroll-effect"
					className={cn(" grid h-full w-full grid-cols-12", scrolled ? "py-2" : "py-2")}
				>
					<div
						id="logo"
						className="xdebug-green col-span-4 self-center justify-self-center border-transparent border-b bg-fill-border hover:animate-fill-transparency md:col-span-2"
					>
						<a href="/" className=" flex cursor-pointer flex-row items-center justify-center ">
							<LogomarkSvg
								className={cn(
									"pl-2 transition-all duration-300",
									scrolled ? "origin-left scale-90" : ""
								)}
							/>
							<div
								className={cn(
									"flex flex-col transition-all duration-300",
									scrolled ? "origin-left scale-90" : ""
								)}
							>
								<span className="logoText ml-4 block whitespace-nowrap font-bold text-2xl sm:hidden sm:whitespace-normal lg:block lg:text-xl">
									AgenitiX
								</span>
							</div>
						</a>
					</div>
					<div
						id="desktop-nav"
						className="xdebug-blue col-span-8 hidden self-center justify-self-center md:block"
					>
						<MainDesktopNav />
					</div>
					<div
						id="mobile-nav"
						className="xdebug-yellow col-span-6 flex w-full items-center justify-end md:hidden"
					>
						<MainMobileNav />
					</div>

					<div
						id="theme-switcher"
						className="xdebug-blue col-span-2 self-center justify-self-center rounded-full border border-transparent bg-fill-border hover:animate-fill-transparency"
					>
						<ThemeSwitcher />
					</div>
				</div>
			</nav>
		</header>
	);
}
