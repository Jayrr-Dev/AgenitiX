"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import Image from "next/image"

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
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Image 
              src="/logo.png" 
              alt="logo" 
              width={scrolled ? 100 : 150} 
              height={scrolled ? 100 : 150}
              className="transition-all duration-300" 
            />
            <div className={cn(
              "flex flex-col transition-all duration-300",
              scrolled ? "scale-90 origin-left" : ""
            )}>
              <span className="hidden font-bold sm:inline-block text-xl logoText">Utilitek Solutions</span>
              <span className={cn(
                "text-sm text-gray-500 transition-opacity duration-300",
                scrolled ? "opacity-0 h-0" : "opacity-100"
              )}>Our expertise is your success</span>
            </div>
          </Link>
        </div>
        
        {/* Mobile Logo */}
        <div className="flex items-center md:hidden">
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/logo.png" alt="logo" width={80} height={80} className="h-10 w-auto" />
            <span className="font-bold text-sm">UTILITEK</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <MobileNav />
          </div>

          {/* Desktop Navigation */}
          <DesktopNav />
        </div>
      </div>
    </header>
  )
}

function DesktopNav() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <Link href="/about" legacyBehavior passHref>
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>About Us</NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link href="/expertise" legacyBehavior passHref>
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>Expertise</NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link href="/projects" legacyBehavior passHref>
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>Projects</NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link href="/contact" legacyBehavior passHref>
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>Contact</NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link href="/careers" legacyBehavior passHref>
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>Careers</NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" className="px-0 text-base md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <MobileLink href="/" className="flex items-center" onOpenChange={() => {}}>
          <Image src="/logo.png" alt="logo" width={100} height={100} className="h-12 w-auto mr-2" />
          <span className="font-bold">UTILITEK SOLUTIONS</span>
        </MobileLink>
        <div className="flex flex-col space-y-4 pt-6">
          <MobileLink href="/docs" onOpenChange={() => {}}>
            About Us
          </MobileLink>
          <MobileLink href="/components" onOpenChange={() => {}}>
            Expertise
          </MobileLink>
          <MobileLink href="/examples" onOpenChange={() => {}}>
            Projects
          </MobileLink>
          <MobileLink href="/about" onOpenChange={() => {}}>
            Contact
          </MobileLink>
          <MobileLink href="/about" onOpenChange={() => {}}>
            Careers
          </MobileLink>
        </div>
      </SheetContent>
    </Sheet>
  )
}

interface ListItemProps extends React.ComponentPropsWithoutRef<"a"> {
  title: string
  href: string
  children?: React.ReactNode
}

const ListItem = React.forwardRef<HTMLAnchorElement, ListItemProps>(
  ({ className, title, children, href, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            href={href}
            className={cn(
              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
              className,
            )}
            {...props}
          >
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</p>
          </a>
        </NavigationMenuLink>
      </li>
    )
  },
)
ListItem.displayName = "ListItem"

interface MobileLinkProps extends React.ComponentPropsWithoutRef<"a"> {
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  href: string
}

function MobileLink({ href, onOpenChange, className, children, ...props }: MobileLinkProps) {
  const router = React.useCallback(() => {
    if (onOpenChange) {
      onOpenChange(false)
    }
  }, [onOpenChange])

  return (
    <Link
      href={href}
      onClick={router}
      className={cn("text-foreground/70 transition-colors hover:text-foreground text-base", className)}
      {...props}
    >
      {children}
    </Link>
  )
}