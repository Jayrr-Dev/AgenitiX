"use client";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	ColorDebugger,
	useColorDebugger,
} from "@/features/business-logic-modern/infrastructure/theming/components/ColorDebugger";
import { Laptop, Moon, Palette, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// ============================================================================
// CONSTANTS
// ============================================================================

/** Check if we're in development mode */
const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

const ThemeSwitcher = () => {
	const [mounted, setMounted] = useState(false);
	const { theme, setTheme } = useTheme();
	const colorDebugger = useColorDebugger();

	// useEffect only runs on the client, so now we can safely show the UI
	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	const ICON_SIZE = 16;

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size={"sm"}>
						{theme === "light" ? (
							<Sun key="light" size={ICON_SIZE} className={"text-muted-foreground"} />
						) : theme === "dark" ? (
							<Moon key="dark" size={ICON_SIZE} className={"text-muted-foreground"} />
						) : (
							<Laptop key="system" size={ICON_SIZE} className={"text-muted-foreground"} />
						)}
					</Button>
				</DropdownMenuTrigger>

				<DropdownMenuContent>
					<DropdownMenuRadioGroup value={theme} onValueChange={(e) => setTheme(e)}>
						<DropdownMenuRadioItem className="flex gap-2" value="light">
							<Sun size={ICON_SIZE} className="text-muted-foreground" /> <span>Light</span>
						</DropdownMenuRadioItem>
						<DropdownMenuRadioItem className="flex gap-2" value="dark">
							<Moon size={ICON_SIZE} className="text-muted-foreground" /> <span>Dark</span>
						</DropdownMenuRadioItem>
						<DropdownMenuRadioItem className="flex gap-2" value="system">
							<Laptop size={ICON_SIZE} className="text-muted-foreground" /> <span>System</span>
						</DropdownMenuRadioItem>
					</DropdownMenuRadioGroup>

					{/* Only show Color Debugger in development */}
					{IS_DEVELOPMENT && (
						<>
							<DropdownMenuSeparator />

							<Button
								variant="ghost"
								size="sm"
								className="w-full justify-start gap-2 h-8 px-2 py-1.5"
								onClick={colorDebugger.show}
							>
								<Palette size={ICON_SIZE} className="text-muted-foreground" />
								<span>Color Debugger</span>
							</Button>
						</>
					)}
				</DropdownMenuContent>
			</DropdownMenu>

			{/* Color Debugger Modal - Only render in development */}
			{IS_DEVELOPMENT && (
				<ColorDebugger
					isVisible={colorDebugger.isVisible}
					onVisibilityChange={colorDebugger.setIsVisible}
				/>
			)}
		</>
	);
};

export { ThemeSwitcher };
