import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";

const navItemStyle =
	"bg-green border-b-1 rounded-lg p-2 border-transparent bg-fill-border hover:animate-fill-transparency font-thin text-xl";

export default function MainDesktopNav() {
	return (
		<NavigationMenu>
			<NavigationMenuList className="flex flex-row gap-4 flex-wrap">
				<NavigationMenuItem>
					<Link href="/" legacyBehavior passHref>
						<NavigationMenuLink className={navItemStyle}>Home</NavigationMenuLink>
					</Link>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<Link href="/dashboard" legacyBehavior passHref>
						<NavigationMenuLink className={cn(navItemStyle)}>Dashboard</NavigationMenuLink>
					</Link>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	);
}
