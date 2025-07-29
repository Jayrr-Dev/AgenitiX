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
import { Cog, LogOut, User } from "lucide-react";
import { useState } from "react";
import { useAuthContext } from "./AuthProvider";
import { ProfileModal } from "@/features/business-logic-modern/dashboard/components/ProfileModal";

export const UserDropdown = () => {
	const { user, signOut } = useAuthContext();
	const [isLoading, setIsLoading] = useState(false);
	const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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
				<Button type="button" variant="ghost" className="relative h-8 w-8 rounded-full border-2 border-transparent hover:border-primary/20 transition-all">
					<Avatar className="h-8 w-8">
						<AvatarImage src={user.avatar_url} alt={user.name} />
						<AvatarFallback>{getInitials(user.name)}</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56" align="end" forceMount={true}>
				<div className="flex items-center gap-2 p-2">
					<Avatar className="h-10 w-10">
						<AvatarImage src={user.avatar_url} alt={user.name} />
						<AvatarFallback>{getInitials(user.name)}</AvatarFallback>
					</Avatar>
					<div className="flex flex-col space-y-0.5">
						<p className="font-medium text-sm">{user.name}</p>
						<p className="text-muted-foreground text-xs truncate max-w-[180px]">{user.email}</p>
					</div>
				</div>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => setIsProfileModalOpen(true)}>
					<User className="mr-2 h-4 w-4" />
					<span>Manage account</span>
				</DropdownMenuItem>
				<DropdownMenuItem>
					<Cog className="mr-2 h-4 w-4" />
					<span>Settings</span>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={handleSignOut} disabled={isLoading}>
					<LogOut className="mr-2 h-4 w-4" />
					<span>{isLoading ? "Signing out..." : "Sign out"}</span>
				</DropdownMenuItem>
				<div className="p-2 pt-0">
					<div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
						<div className="flex justify-between items-center">
							<span>Secured by</span>
							<span className="font-medium">clerk</span>
						</div>
						<div className="text-[10px] mt-1 text-orange-500">Development mode</div>
					</div>
				</div>
			</DropdownMenuContent>
			
			{/* Profile Modal */}
			<ProfileModal 
				isOpen={isProfileModalOpen}
				onClose={() => setIsProfileModalOpen(false)}
			/>
		</DropdownMenu>
	);
};
