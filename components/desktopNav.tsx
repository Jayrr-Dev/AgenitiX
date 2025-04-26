import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
  } from "@/components/ui/navigation-menu"
import Link from "next/link"
import { cn } from "@/lib/utils"
import LogoutButton from "@/features/auth/components/logoutButton"

export function DesktopNav({userRole, session}: { userRole: string | null, session: any}) {
    return (
      <NavigationMenu>

        {/* If user is not logged in, show the navigation menu */}
        {userRole == null && (
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
                   )}
                   
        {userRole !== null && (
            <NavigationMenuList className="flex flex-row flex-wrap">
                
                <NavigationMenuItem>
                <Link href="./employee_dashboard" legacyBehavior passHref>  
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>Employee Dashboard</NavigationMenuLink>
                    </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <Link href="./timesheet" legacyBehavior passHref>
                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>Timesheet</NavigationMenuLink>
                    </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <Link href="./vacations" legacyBehavior passHref>
                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>Vacations</NavigationMenuLink>
                    </Link>
                </NavigationMenuItem>
                <NavigationMenuItem> 
                    <LogoutButton />
                </NavigationMenuItem>
            </NavigationMenuList>
        )}
      </NavigationMenu>
    )
  }
  