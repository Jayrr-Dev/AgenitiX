"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { ThemeSwitcher } from "./theme-switcher"


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

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    // Add scroll event listener
    window.addEventListener("scroll", handleScroll);
    
    // Remove event listener on cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300",
      scrolled ? "h-16" : "md:h-28 h-16"
    )}>
      <div className={cn(
        "container flex items-center h-full",
        scrolled ? "py-2" : "py-4"
      )}>
          <div className="flex items-center w-full">
            <Link href="/" className="mr-6 flex items-center justify-start min-w-[250px] cursor-pointer">
              <Image 
                src="/logo.png" 
                alt="logo" 
                width={scrolled ? 100 : 150} 
                height={scrolled ? 100 : 150}
                className={cn(
                  "transition-all duration-300 w-auto dark:brightness-125",
                  scrolled 
                    ? "h-10 sm:h-10 md:h-12 lg:h-12 xl:h-12" 
                    : "h-12 sm:h-16 md:h-20 lg:h-24 xl:h-28"
                )} 
              />
              <div className={cn(
                "flex flex-col transition-all duration-300",
                scrolled ? "scale-90 origin-left" : ""
              )}>
              
                <span className="font-bold block sm:hidden lg:block text-2xl lg:text-3xl logoText whitespace-nowrap sm:whitespace-normal">Utilitek Solutions</span>
                <span className={cn(
                  "text-sm text-gray-500 transition-opacity duration-300 hidden lg:block",
                  scrolled ? "opacity-0 h-0" : "opacity-100"
                )}>Our expertise is your success</span>
            </div>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end ">
      
        </div>
        {/* Mobile Logo */}
        {/* <div className="flex items-center md:hidden">
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/logo.png" alt="logo" width={80} height={80} className="h-10 w-auto" />
          </Link>
        </div> */}
        <div className="ml-2">
            <ThemeSwitcher />
        </div>
      </div>
    </header>
  )
}

