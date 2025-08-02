import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";

const navItemStyle =
	"relative px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200";

interface MainDesktopNavProps {
	scrolled?: boolean;
}

export default function MainDesktopNav({ scrolled = false }: MainDesktopNavProps) {
	return (
		<NavigationMenu className={cn(
			"transition-all duration-300 w-full",
			scrolled ? "max-w-[66.67%] mx-auto px-4 py-1 rounded-full" : "w-full"
		)}>
			<NavigationMenuList className={cn(
				"flex flex-row items-center space-x-6 transition-all duration-300 w-full",
				scrolled ? "scale-95 justify-center" : ""
			)}>
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
