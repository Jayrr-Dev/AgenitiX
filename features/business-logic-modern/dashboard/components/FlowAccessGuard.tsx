/**
 * FLOW ACCESS GUARD - Authentication and authorization guard for flows
 *
 * • Access control for private/public flows
 * • User authentication verification
 * • Request access functionality for private flows
 * • Proper loading states and error handling
 * • Responsive design with user-friendly messaging
 *
 * Keywords: access-guard, authentication, authorization, private-flows, access-request
 */

"use client";

import { useAuthContext } from "@/components/auth/AuthProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { AlertTriangle, Edit, Eye, Lock, Mail, Shield, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { toast } from "sonner";

interface FlowAccessGuardProps {
	flowId: string;
	children: React.ReactNode;
}

export const FlowAccessGuard: React.FC<FlowAccessGuardProps> = ({ flowId, children }) => {
	const [showRequestDialog, setShowRequestDialog] = useState(false);
	const [requestEmail, setRequestEmail] = useState("");
	const [requestPermission, setRequestPermission] = useState<"view" | "edit" | "admin">("view");

	const [isLoading, setIsLoading] = useState(true);
	const [hasAccess, setHasAccess] = useState(false);
	const [permission, setPermission] = useState<string | null>(null);

	const router = useRouter();

	// Get authenticated user
	const { user } = useAuthContext();

	// Convex queries
	const flow = useQuery(api.flows.getFlow, { flow_id: flowId as Id<"flows"> });
	const accessCheck = useQuery(
		api.flows.checkFlowAccess,
		user?.id
			? {
					flow_id: flowId as Id<"flows">,
					user_id: user.id,
				}
			: "skip"
	);

	// Convex mutations
	const requestFlowAccess = useMutation(api.flows.requestFlowAccess);

	useEffect(() => {
		if (accessCheck) {
			setHasAccess(accessCheck.hasAccess);
			setPermission(accessCheck.permission);
			setIsLoading(false);
		}
	}, [accessCheck]);

	const handleRequestAccess = async () => {
		if (!requestEmail.trim()) {
			toast.error("Please enter your email");
			return;
		}

		if (!user?.id) {
			toast.error("Please sign in to request access");
			return;
		}

		try {
			await requestFlowAccess({
				flow_id: flowId as Id<"flows">,
				requesting_user_id: user.id,
				requesting_user_email: requestEmail,
				permission_type: requestPermission,
			});

			toast.success("Access request sent to the flow owner");
			setShowRequestDialog(false);
			setRequestEmail("");
		} catch (_error) {
			toast.error("Failed to send access request");
		}
	};

	const getPermissionIcon = (permission: string) => {
		switch (permission) {
			case "view":
				return <Eye className="h-4 w-4" />;
			case "edit":
				return <Edit className="h-4 w-4" />;
			case "admin":
				return <Shield className="h-4 w-4" />;
			default:
				return <Eye className="h-4 w-4" />;
		}
	};

	const getPermissionLabel = (permission: string) => {
		switch (permission) {
			case "view":
				return "View";
			case "edit":
				return "Edit";
			case "admin":
				return "Admin";
			default:
				return "View";
		}
	};

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-center">
					<div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
					<p className="text-muted-foreground">Checking access...</p>
				</div>
			</div>
		);
	}

	if (hasAccess) {
		return (
			<div>
				{/* Access Banner */}
				{permission && permission !== "admin" && (
					<div className="border-blue-200 border-b bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
						<div className="flex items-center gap-2 text-blue-800 text-sm dark:text-blue-200">
							{getPermissionIcon(permission)}
							<span>
								You have <strong>{getPermissionLabel(permission)}</strong> access to this flow
							</span>
						</div>
					</div>
				)}
				{children}
			</div>
		);
	}

	// No access - show request dialog
	return (
		<div className="flex min-h-screen items-center justify-center bg-muted/50">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
						<Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
					</div>
					<CardTitle>Access Required</CardTitle>
					<p className="text-muted-foreground text-sm">
						This flow is private and requires permission to access
					</p>
				</CardHeader>
				<CardContent className="space-y-4">
					{flow && (
						<div className="text-center">
							<h3 className="font-medium">{flow.name}</h3>
							{flow.description && (
								<p className="mt-1 text-muted-foreground text-sm">{flow.description}</p>
							)}
						</div>
					)}

					<div className="flex items-center justify-center gap-2">
						<Badge variant="secondary">Private</Badge>
						<span className="text-muted-foreground text-sm">Only the owner can grant access</span>
					</div>

					<Button onClick={() => setShowRequestDialog(true)} className="w-full">
						<UserPlus className="mr-2 h-4 w-4" />
						Request Access
					</Button>

					<Button variant="outline" onClick={() => router.push("/dashboard")} className="w-full">
						Back to Dashboard
					</Button>
				</CardContent>
			</Card>

			{/* Request Access Dialog */}
			<Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Request Access</DialogTitle>
						<DialogDescription>Send a request to the flow owner for access</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="request-email">Your Email</Label>
							<Input
								id="request-email"
								type="email"
								value={requestEmail}
								onChange={(e) => setRequestEmail(e.target.value)}
								placeholder="Enter your email address"
							/>
						</div>

						<div className="space-y-2">
							<Label>Permission Level</Label>
							<div className="grid grid-cols-3 gap-2">
								{[
									{ value: "view", label: "View", icon: Eye },
									{ value: "edit", label: "Edit", icon: Edit },
									{ value: "admin", label: "Admin", icon: Shield },
								].map((permission) => {
									const IconComponent = permission.icon;
									return (
										<button
											key={permission.value}
											type="button"
											onClick={() => setRequestPermission(permission.value as string)}
											className={`rounded-lg border-2 p-3 transition-all ${
												requestPermission === permission.value
													? "border-primary bg-primary/10"
													: "border-border hover:border-primary/50"
											}`}
										>
											<IconComponent className="mx-auto mb-1 h-4 w-4" />
											<p className="text-center text-xs">{permission.label}</p>
										</button>
									);
								})}
							</div>
						</div>

						{/* Privacy Warning */}
						<div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
							<div className="flex items-start gap-2">
								<AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-400" />
								<div>
									<p className="font-medium text-amber-800 text-sm dark:text-amber-200">
										Private Flow
									</p>
									<p className="text-amber-700 text-sm dark:text-amber-300">
										The flow owner will review your request and decide whether to grant access.
									</p>
								</div>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setShowRequestDialog(false)}>
							Cancel
						</Button>
						<Button onClick={handleRequestAccess} disabled={!requestEmail.trim()}>
							<Mail className="mr-2 h-4 w-4" />
							Send Request
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};
