import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";

const navItemStyle =
	"bg-green border-b-1 rounded-none p-2 border-transparent bg-fill-border hover:animate-fill-transparency font-thin text-xl";

export default function MainDesktopNav() {
	return (
		<NavigationMenu>
			<NavigationMenuList className="flex flex-row flex-wrap gap-4">
				<NavigationMenuItem>
					<Link href="/" className={navItemStyle}>
						Home
					</Link>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<Link href="/dashboard" className={cn(navItemStyle)}>
						Dashboard
					</Link>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	);
}
