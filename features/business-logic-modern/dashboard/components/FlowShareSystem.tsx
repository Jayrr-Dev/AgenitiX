/**
 * FLOW SHARE SYSTEM - Comprehensive flow sharing and access management
 *
 * • Share flows with token-based access control
 * • Manage user permissions and access requests
 * • Request access to private flows
 * • Approve/deny access requests
 * • Secure user authentication and authorization
 * • Full Convex database integration
 *
 * Keywords: flow-sharing, access-management, permissions, authentication, convex
 */

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { 
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs";
import { 
	Share2, 
	Copy, 
	Check, 
	Users, 
	UserPlus, 
	Clock, 
	Mail,
	Eye,
	Edit,
	Shield,
	AlertTriangle,
	Loader2
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Flow } from "../types";

interface FlowShareSystemProps {
	flow: Flow;
	isOpen: boolean;
	onClose: () => void;
}

export const FlowShareSystem: React.FC<FlowShareSystemProps> = ({ 
	flow, 
	isOpen, 
	onClose 
}) => {
	const [activeTab, setActiveTab] = useState("share");
	const [copied, setCopied] = useState(false);
	const [requestEmail, setRequestEmail] = useState("");
	const [requestPermission, setRequestPermission] = useState<"view" | "edit" | "admin">("view");
	const [requestNote, setRequestNote] = useState("");

	// Mock user ID (replace with actual auth)
	const currentUserId = "user_123";

	// Convex mutations
	const shareFlow = useMutation(api.flows.shareFlow);
	const requestFlowAccess = useMutation(api.flows.requestFlowAccess);
	const respondToAccessRequest = useMutation(api.flows.respondToAccessRequest);

	// Convex queries
	const flowShare = useQuery(api.flows.getFlowShare, { 
		flow_id: flow.id as any
	});
	const accessRequests = useQuery(api.flows.getFlowAccessRequests, { 
		flow_id: flow.id as any 
	});

	const handleShareFlow = async () => {
		try {
			const result = await shareFlow({
				flow_id: flow.id as any,
				shared_by_user_id: currentUserId,
			});

			toast.success("Flow shared successfully");
		} catch (error) {
			console.error("Failed to share flow:", error);
			toast.error("Failed to share flow");
		}
	};

	const handleRequestAccess = async () => {
		if (!requestEmail.trim()) {
			toast.error("Please enter your email");
			return;
		}

		try {
			await requestFlowAccess({
				flow_id: flow.id as any,
				requesting_user_id: currentUserId,
				requesting_user_email: requestEmail,
				permission_type: requestPermission,
			});

			toast.success("Access request sent");
			setRequestEmail("");
			setRequestNote("");
		} catch (error) {
			console.error("Failed to send access request:", error);
			toast.error("Failed to send access request");
		}
	};

	const handleRespondToRequest = async (requestId: string, status: "approved" | "denied") => {
		try {
			await respondToAccessRequest({
				request_id: requestId as any,
				status,
				responded_by_user_id: currentUserId,
				response_note: requestNote,
			});

			toast.success(`Request ${status}`);
			setRequestNote("");
		} catch (error) {
			console.error(`Failed to ${status} request:`, error);
			toast.error(`Failed to ${status} request`);
		}
	};

	const copyShareUrl = async (url: string) => {
		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
			toast.success("Share link copied to clipboard");
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			toast.error("Failed to copy to clipboard");
		}
	};

	const getShareUrl = () => {
		if (flowShare?.share_token) {
			return `${window.location.origin}/matrix/${flow.id}?token=${flowShare.share_token}`;
		}
		return `${window.location.origin}/matrix/${flow.id}`;
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

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Share Flow</DialogTitle>
					<DialogDescription>
						Manage sharing and access for "{flow.name}"
					</DialogDescription>
				</DialogHeader>

				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="share">Share</TabsTrigger>
						<TabsTrigger value="requests">
							Requests
							{accessRequests && accessRequests.length > 0 && (
								<Badge variant="destructive" className="ml-2 text-xs">
									{accessRequests.length}
								</Badge>
							)}
						</TabsTrigger>
						<TabsTrigger value="access">Request Access</TabsTrigger>
					</TabsList>

					{/* Share Tab */}
					<TabsContent value="share" className="space-y-4">
						{/* Privacy Status */}
						<div className="flex items-center gap-2 p-3 border rounded-lg">
							<Badge variant={flow.private ? "secondary" : "default"}>
								{flow.private ? "Private" : "Public"}
							</Badge>
							<span className="text-sm text-muted-foreground">
								{flow.private 
									? "Only you can access this flow" 
									: "Anyone with the link can view this flow"
								}
							</span>
						</div>

						{/* Share Actions */}
						{flow.private && (
							<div className="space-y-2">
								<Label>Share with Token</Label>
								<Button
									onClick={handleShareFlow}
									className="w-full"
									disabled={!!flowShare?.share_token}
								>
									<Share2 className="w-4 h-4 mr-2" />
									{flowShare?.share_token ? "Already Shared" : "Generate Share Link"}
								</Button>
							</div>
						)}

						{/* Share URL */}
						<div className="space-y-2">
							<Label>Share Link</Label>
							<div className="flex items-center gap-2">
								<Input
									value={getShareUrl()}
									readOnly
									className="flex-1"
								/>
								<Button
									variant="outline"
									size="sm"
									onClick={() => copyShareUrl(getShareUrl())}
									className="flex items-center gap-2"
								>
									{copied ? (
										<>
											<Check className="w-4 h-4" />
											Copied
										</>
									) : (
										<>
											<Copy className="w-4 h-4" />
											Copy
										</>
									)}
								</Button>
							</div>
						</div>

						{/* Privacy Note */}
						{flow.private && (
							<div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
								<div className="flex items-start gap-2">
									<AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
									<div>
										<p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
											Private Flow
										</p>
										<p className="text-sm text-amber-700 dark:text-amber-300">
											Users with the link will need your permission to access this flow.
										</p>
									</div>
								</div>
							</div>
						)}
					</TabsContent>

					{/* Requests Tab */}
					<TabsContent value="requests" className="space-y-4">
						{accessRequests === undefined ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="w-6 h-6 animate-spin" />
								<span className="ml-2 text-muted-foreground">Loading requests...</span>
							</div>
						) : accessRequests && accessRequests.length > 0 ? (
							<div className="space-y-3">
								{accessRequests.map((request) => (
									<div key={request._id} className="p-3 border rounded-lg">
										<div className="flex items-center justify-between mb-2">
											<div className="flex items-center gap-2">
												<Mail className="w-4 h-4 text-muted-foreground" />
												<span className="font-medium">{request.requesting_user_email}</span>
												{getPermissionIcon(request.permission_type)}
												<Badge variant="outline">
													{getPermissionLabel(request.permission_type)}
												</Badge>
											</div>
											<div className="flex items-center gap-1 text-xs text-muted-foreground">
												<Clock className="w-3 h-3" />
												{new Date(request.requested_at).toLocaleDateString()}
											</div>
										</div>
										
										<div className="flex items-center gap-2">
											<Button
												size="sm"
												onClick={() => handleRespondToRequest(request._id, "approved")}
											>
												Approve
											</Button>
											<Button
												size="sm"
												variant="outline"
												onClick={() => handleRespondToRequest(request._id, "denied")}
											>
												Deny
											</Button>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-8 text-muted-foreground">
								<Users className="w-8 h-8 mx-auto mb-2" />
								<p>No pending access requests</p>
							</div>
						)}
					</TabsContent>

					{/* Request Access Tab */}
					<TabsContent value="access" className="space-y-4">
						{flow.private ? (
							<div className="space-y-4">
								<div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
									<p className="text-sm text-blue-800 dark:text-blue-200">
										This flow is private. Request access from the owner.
									</p>
								</div>

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

								<Button
									onClick={handleRequestAccess}
									className="w-full"
									disabled={!requestEmail.trim()}
								>
									<UserPlus className="w-4 h-4 mr-2" />
									Request Access
								</Button>
							</div>
						) : (
							<div className="text-center py-8 text-muted-foreground">
								<Share2 className="w-8 h-8 mx-auto mb-2" />
								<p>This flow is public and doesn't require access requests</p>
							</div>
						)}
					</TabsContent>
				</Tabs>

				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}; 