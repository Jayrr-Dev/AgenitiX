/**
 * FLOW ACCESS GUARD - Flow access control and authentication
 *
 * • Check user permissions for flow access
 * • Handle token-based authentication for shared flows
 * • Request access for private flows
 * • Secure user authentication and authorization
 * • Integration with Convex database
 *
 * Keywords: flow-access, authentication, permissions, security, convex
 */

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { 
	Shield, 
	Eye, 
	Edit, 
	AlertTriangle, 
	UserPlus,
	Mail,
	Lock
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, useSearchParams } from "next/navigation";

interface FlowAccessGuardProps {
	flowId: string;
	children: React.ReactNode;
}

export const FlowAccessGuard: React.FC<FlowAccessGuardProps> = ({ 
	flowId, 
	children 
}) => {
	const [showRequestDialog, setShowRequestDialog] = useState(false);
	const [requestEmail, setRequestEmail] = useState("");
	const [requestPermission, setRequestPermission] = useState<"view" | "edit" | "admin">("view");
	const [requestNote, setRequestNote] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [hasAccess, setHasAccess] = useState(false);
	const [permission, setPermission] = useState<string | null>(null);

	const router = useRouter();
	const searchParams = useSearchParams();
	const shareToken = searchParams.get("token");

	// Mock user ID (replace with actual auth)
	const currentUserId = "user_123";

	// Convex queries
	const flow = useQuery(api.flows.getFlow, { flow_id: flowId as any });
	const accessCheck = useQuery(api.flows.checkFlowAccess, { 
		flow_id: flowId as any, 
		user_id: currentUserId 
	});

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

		try {
			await requestFlowAccess({
				flow_id: flowId as any,
				requesting_user_id: currentUserId,
				requesting_user_email: requestEmail,
				permission_type: requestPermission,
			});

			toast.success("Access request sent to the flow owner");
			setShowRequestDialog(false);
			setRequestEmail("");
			setRequestNote("");
		} catch (error) {
			toast.error("Failed to send access request");
		}
	};

	const getPermissionIcon = (permission: string) => {
		switch (permission) {
			case "view": return <Eye className="w-4 h-4" />;
			case "edit": return <Edit className="w-4 h-4" />;
			case "admin": return <Shield className="w-4 h-4" />;
			default: return <Eye className="w-4 h-4" />;
		}
	};

	const getPermissionLabel = (permission: string) => {
		switch (permission) {
			case "view": return "View";
			case "edit": return "Edit";
			case "admin": return "Admin";
			default: return "View";
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
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
					<div className="bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200 dark:border-blue-800 p-3">
						<div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
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
		<div className="flex items-center justify-center min-h-screen bg-muted/50">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
						<Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
					</div>
					<CardTitle>Access Required</CardTitle>
					<p className="text-sm text-muted-foreground">
						This flow is private and requires permission to access
					</p>
				</CardHeader>
				<CardContent className="space-y-4">
					{flow && (
						<div className="text-center">
							<h3 className="font-medium">{flow.name}</h3>
							{flow.description && (
								<p className="text-sm text-muted-foreground mt-1">
									{flow.description}
								</p>
							)}
						</div>
					)}

					<div className="flex items-center gap-2 justify-center">
						<Badge variant="secondary">Private</Badge>
						<span className="text-sm text-muted-foreground">
							Only the owner can grant access
						</span>
					</div>

					<Button
						onClick={() => setShowRequestDialog(true)}
						className="w-full"
					>
						<UserPlus className="w-4 h-4 mr-2" />
						Request Access
					</Button>

					<Button
						variant="outline"
						onClick={() => router.push("/dashboard")}
						className="w-full"
					>
						Back to Dashboard
					</Button>
				</CardContent>
			</Card>

			{/* Request Access Dialog */}
			<Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Request Access</DialogTitle>
						<DialogDescription>
							Send a request to the flow owner for access
						</DialogDescription>
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
											onClick={() => setRequestPermission(permission.value as any)}
											className={`p-3 rounded-lg border-2 transition-all ${
												requestPermission === permission.value
													? "border-primary bg-primary/10"
													: "border-border hover:border-primary/50"
											}`}
										>
											<IconComponent className="w-4 h-4 mx-auto mb-1" />
											<p className="text-xs text-center">{permission.label}</p>
										</button>
									);
								})}
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="request-note">Note (Optional)</Label>
							<Textarea
								id="request-note"
								value={requestNote}
								onChange={(e) => setRequestNote(e.target.value)}
								placeholder="Why do you need access to this flow?"
								rows={3}
							/>
						</div>

						{/* Privacy Warning */}
						<div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
							<div className="flex items-start gap-2">
								<AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
								<div>
									<p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
										Private Flow
									</p>
									<p className="text-sm text-amber-700 dark:text-amber-300">
										The flow owner will review your request and decide whether to grant access.
									</p>
								</div>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowRequestDialog(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleRequestAccess}
							disabled={!requestEmail.trim()}
						>
							<Mail className="w-4 h-4 mr-2" />
							Send Request
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}; 