"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { ThemeSwitcher } from "./theme-switcher"
import { LogomarkLight } from "@/branding/logomark-svg"
import { useTheme } from "next-themes";
import MainDesktopNav from "./DesktopNav"
import MobileNav from "./MobileNav"

export default function MainNavBar() {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    }
    // Add scroll event listener
    window.addEventListener("scroll", handleScroll);
    // Remove event listener on cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  const { theme } = useTheme();
  // Render the navigation bar with responsive behavior based on scroll position
  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60 transition-all duration-300",
      scrolled ? "h-16" : "md:h-28 h-16"
    )}>
      <div className={cn(
        "container flex items-center h-full",
        scrolled ? "py-2" : "py-4"
      )}>
        {/* LOGO SECTION */}
        <div className="flex items-center w-full">
          <Link href="/" className="mr-6 flex items-center justify-start min-w-[250px] cursor-pointer">
            <LogomarkLight 
              className={cn(
                "transition-all duration-300",
                scrolled ? "scale-90 origin-left" : ""
              )} 
            />
            <div className={cn(
              "flex flex-col transition-all duration-300",
              scrolled ? "scale-90 origin-left" : ""
            )}>
              <span className="font-bold block sm:hidden lg:block text-2xl lg:text-xl logoText whitespace-nowrap sm:whitespace-normal ml-4">
                AgenitiX
              </span>
            </div>
          </Link>
          <div className=" md:hidden w-full flex items-center justify-end ">
              <MobileNav />
          </div>
        </div>
        
          {/* NAVIGATION SECTION */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end ">
            <div className="hidden md:block w-full flex-1 md:w-auto md:flex-none flex-row gap-1 flex-wrap">
              <MainDesktopNav />
            </div>
        </div>
          
          {/* THEME SWITCHER */}
          <div className="ml-2">
            <ThemeSwitcher />
          </div>
      </div>
    </header>
  )
}
