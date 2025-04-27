import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
  } from "@/components/ui/navigation-menu"
import Link from "next/link"
import { cn } from "@/lib/utils"

const navItemStyle = "border-b-1 rounded-lg p-2 border-transparent bg-fill-border hover:animate-fill-transparency font-thin text-lg"

export default function MainDesktopNav() {
    return (
      <NavigationMenu>
        <NavigationMenuList className="flex flex-row gap-1 flex-wrap">
          <NavigationMenuItem>
            <Link href="/about" legacyBehavior passHref>
              <NavigationMenuLink className={navItemStyle}>About Us</NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/expertise" legacyBehavior passHref>
              <NavigationMenuLink className={navItemStyle}>Expertise</NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/projects" legacyBehavior passHref>
              <NavigationMenuLink className={navItemStyle}>Projects</NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
         
          <NavigationMenuItem>
            <Link href="/careers" legacyBehavior passHref>
              <NavigationMenuLink className={navItemStyle}>Careers</NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
  
          <NavigationMenuItem>
            <Link href="/contact" legacyBehavior passHref>
              <NavigationMenuLink className={cn(navItemStyle)}>Contact</NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
                  
      </NavigationMenu>
    )
  }
  