"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { ThemeSwitcher } from "./theme-switcher"
import { LogomarkLight } from "@/branding/logomark-svg"
import { useTheme } from "next-themes";
import { DesktopNav } from "./DesktopNav"
import { MobileNav } from "./MobileNav"


const components: { title: string; href: string; description: string }[] = [
  {
    title: "Alert Dialog",
    href: "/docs/primitives/alert-dialog",
    description: "A modal dialog that interrupts the user with important content and expects a response.",
  },
  {
    title: "Hover Card",
    href: "/docs/primitives/hover-card",
    description: "For sighted users to preview content available behind a link.",
  },
  {
    title: "Progress",
    href: "/docs/primitives/progress",
    description: "Displays an indicator showing the completion progress of a task.",
  },
  {
    title: "Scroll-area",
    href: "/docs/primitives/scroll-area",
    description: "Visually or semantically separates content.",
  },
  {
    title: "Tabs",
    href: "/docs/primitives/tabs",
    description: "A set of layered sections of content—known as tab panels—that are displayed one at a time.",
  },
  {
    title: "Tooltip",
    href: "/docs/primitives/tooltip",
    description:
      "A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.",
  },
]

export default function Navbar() {
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
              <DesktopNav />
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
