"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, Shield, User } from "lucide-react";
import { useState } from "react";
import { useAuthContext } from "./AuthProvider";

export const UserDropdown = () => {
	const { user, signOut } = useAuthContext();
	const [isLoading, setIsLoading] = useState(false);

	if (!user) {
		return null;
	}

	const handleSignOut = async () => {
		setIsLoading(true);
		try {
			await signOut();
		} catch (error) {
			console.error("Sign out error:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild={true}>
				<Button variant="ghost" className="relative h-8 w-8 rounded-full">
					<Avatar className="h-8 w-8">
						<AvatarImage src={user.avatar_url} alt={user.name} />
						<AvatarFallback>{getInitials(user.name)}</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56" align="end" forceMount={true}>
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col space-y-1">
						<p className="font-medium text-sm leading-none">{user.name}</p>
						<p className="text-muted-foreground text-xs leading-none">{user.email}</p>
						{user.company && (
							<p className="text-muted-foreground text-xs leading-none">{user.company}</p>
						)}
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem>
					<User className="mr-2 h-4 w-4" />
					<span>Profile</span>
				</DropdownMenuItem>
				<DropdownMenuItem>
					<Settings className="mr-2 h-4 w-4" />
					<span>Settings</span>
				</DropdownMenuItem>
				<DropdownMenuItem>
					<Shield className="mr-2 h-4 w-4" />
					<span>Security</span>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={handleSignOut} disabled={isLoading}>
					<LogOut className="mr-2 h-4 w-4" />
					<span>{isLoading ? "Signing out..." : "Sign out"}</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
