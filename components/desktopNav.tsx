import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
  } from "@/components/ui/navigation-menu"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function DesktopNav() {
    return (
      <NavigationMenu>
        <NavigationMenuList className="flex flex-row gap-1 flex-wrap">
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
  