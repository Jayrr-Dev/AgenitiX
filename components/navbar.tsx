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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
            <Link href="/" className="mr-6 flex items-center justify-start min-w-[250px] ">
              <Image 
                src="/logo.png" 
                alt="logo" 
                width={scrolled ? 100 : 150} 
                height={scrolled ? 100 : 150}
                className={cn(
                  "transition-all duration-300 w-auto",
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
            <div className=" md:hidden w-full flex items-center justify-end ">
               <MobileNav />
            </div>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="hidden md:block w-full flex-1 md:w-auto md:flex-none">
            <DesktopNav />
          </div>

          

        </div>
        {/* Mobile Logo */}
        {/* <div className="flex items-center md:hidden">
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/logo.png" alt="logo" width={80} height={80} className="h-10 w-auto" />
          </Link>
        </div> */}

      
      </div>
    </header>
  )
}

function DesktopNav() {
  return (
    <NavigationMenu>
      <NavigationMenuList className="flex flex-row flex-wrap">
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
          <Link href="/careers" legacyBehavior passHref>
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>Careers</NavigationMenuLink>
          </Link>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <Link href="/contact" legacyBehavior passHref>
            <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), "text-[#f6733c] border-2 border-solid border-[#f6733c] font-medium")}>Contact</NavigationMenuLink>
          </Link>
        </NavigationMenuItem>

      </NavigationMenuList>
    </NavigationMenu>
  )
}

function MobileNav() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="link" 
          className="px-0 text-2xl md:hidden hover:border-b-2 t data-[state=open]:border-b-2 data-[state=open]:border-[#f6733c] data-[state=open]:text-[#f6733c]"
          onClick={(e) => {
            e.currentTarget.classList.add('border-b-2', 'border-[#f6733c]', 'text-[#f6733c]');
            setTimeout(() => {
              e.currentTarget.classList.remove('border-b-2', 'border-[#f6733c]', 'text-[#f6733c]');
            }, 300);
          }}
        >
          <Menu className="h-10 w-10" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[85vw] px-8 text-xl">
        <DropdownMenuItem asChild>
          <Link href="/" className="flex items-center w-full">
            {/* <Image src="/logo.png" alt="logo" width={24} height={24} className="h-5 w-auto mr-2" /> */}
            <span className="font-medium">Home</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/about" className="w-full">
            About Us
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/expertise" className="w-full">
            Expertise
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/projects" className="w-full">
            Projects
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/contact" className="w-full">
            Contact
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/careers" className="w-full">
            Careers
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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