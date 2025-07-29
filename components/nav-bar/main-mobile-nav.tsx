import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu } from "lucide-react";
import Link from "next/link";

/**
 * main-mobile-nav.tsx - Mobile navigation component
 *
 * Dropdown menu navigation for mobile devices with hamburger menu trigger
 */

export default function MainMobileNav() {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild={true}>
				<Button
					variant="link"
					className="t px-0 text-2xl hover:border-b-2 data-[state=open]:border-[#f6733c] data-[state=open]:border-b-2 data-[state=open]:text-[#f6733c] md:hidden"
					onClick={(e) => {
						e.currentTarget.classList.add("border-b-2", "border-[#f6733c]", "text-[#f6733c]");
						setTimeout(() => {
							e.currentTarget.classList.remove("border-b-2", "border-[#f6733c]", "text-[#f6733c]");
						}, 300);
					}}
				>
					<Menu className="h-10 w-10" />
					<span className="sr-only">Toggle menu</span>
				</Button>
			</DropdownMenuTrigger>
			{/* If user is not logged in, show the navigation menu */}
			<DropdownMenuContent align="end" className="w-[85vw] px-8 text-xl">
				<DropdownMenuItem asChild={true}>
					<Link href="/" className="flex w-full items-center">
						{/* <Image src="/logo.png" alt="logo" width={24} height={24} className="h-5 w-auto mr-2" /> */}
						<span className="font-medium">Home</span>
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild={true}>
					<Link href="/dashboard" className="w-full">
						Dashboard
					</Link>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
