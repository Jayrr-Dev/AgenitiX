"use client";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import React, { useEffect, useState, useMemo, useCallback } from "react";

// Top-level constants for better performance, basically prevent recreation on every render
const ICON_SIZE = 16;
const ICON_CLASSES = "text-muted-foreground";
const MENU_ITEM_CLASSES = "flex gap-2";

// Pre-computed theme options for stable references, basically avoid object recreation
const THEME_OPTIONS = [
	{ value: "light", label: "Light", Icon: Sun },
	{ value: "dark", label: "Dark", Icon: Moon },
	{ value: "system", label: "System", Icon: Laptop },
] as const;

const ThemeSwitcher = () => {
	const [mounted, setMounted] = useState(false);
	const { theme, setTheme } = useTheme();

	// useEffect only runs on the client, so now we can safely show the UI
	useEffect(() => {
		setMounted(true);
	}, []);

	// Memoized theme change handler, basically prevent function recreation
	const handleThemeChange = useCallback((newTheme: string) => {
		setTheme(newTheme);
	}, [setTheme]);

	// Memoized current theme icon, basically prevent icon component recreation
	const currentThemeIcon = useMemo(() => {
		if (!mounted) return null;
		
		const themeOption = THEME_OPTIONS.find(option => option.value === theme);
		if (!themeOption) return <Laptop key="system" size={ICON_SIZE} className={ICON_CLASSES} />;
		
		const { Icon, value } = themeOption;
		return <Icon key={value} size={ICON_SIZE} className={ICON_CLASSES} />;
	}, [mounted, theme]);

	// Early return for SSR, basically avoid hydration issues
	if (!mounted) {
		return (
			<Button type="button" variant="ghost" size="sm" disabled>
				<Laptop size={ICON_SIZE} className={ICON_CLASSES} />
			</Button>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button type="button" className="p-1.5 ml-0.5 rounded-full">
					{currentThemeIcon}
				</button>
			</DropdownMenuTrigger>

			<DropdownMenuContent>
				<DropdownMenuRadioGroup value={theme} onValueChange={handleThemeChange}>
					{THEME_OPTIONS.map(({ value, label, Icon }) => (
						<DropdownMenuRadioItem 
							key={value}
							className={MENU_ITEM_CLASSES} 
							value={value}
						>
							<Icon size={ICON_SIZE} className={ICON_CLASSES} />
							<span>{label}</span>
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

// Memoize the ThemeSwitcher to prevent unnecessary re-renders, basically improves performance
const ThemeSwitcherMemo = React.memo(ThemeSwitcher);
ThemeSwitcherMemo.displayName = "ThemeSwitcher";

export { ThemeSwitcherMemo as ThemeSwitcher };
