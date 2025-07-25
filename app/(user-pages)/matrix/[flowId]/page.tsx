/**
 * FLOW EDITOR PAGE - Individual flow editing interface
 *
 * • Loads flow data from Convex database
 * • Renders the FlowEditor component for visual editing
 * • Handles flow not found scenarios
 * • Full-screen editor interface
 * • Real-time flow data integration
 *
 * Keywords: flow-editor, convex, database, visual-editor, full-screen
 */

"use client";

import FlowEditor from "@/features/business-logic-modern/infrastructure/flow-engine/FlowEditor";
import { Loading } from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { use } from "react";

// TYPES
type PageProps = {
	params: Promise<{
		flowId: string;
	}>;
};

/**
 * Client component that loads a Flow by ID from Convex database.
 * @param params - Contains the flowId from the URL
 */
export default function FlowPage({ params }: PageProps) {
	const { flowId } = use(params);
	const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();

	// Fetch flow data from Convex with proper access control
	const flow = useQuery(
		api.flows.getFlowSecure,
		flowId && user?.id ? { 
			flow_id: flowId as any,
			user_id: user.id
		} : "skip"
	);

	// Loading states
	if (authLoading || flow === undefined) {
		return (
			<div className="h-screen w-screen flex items-center justify-center bg-background">
				<Loading />
			</div>
		);
	}

	// Authentication check
	if (!isAuthenticated || !user) {
		return (
			<div className="h-screen w-screen flex items-center justify-center bg-background">
				<div className="text-center max-w-md mx-auto px-4">
					<AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
					<h2 className="text-2xl font-bold text-foreground mb-2">Authentication Required</h2>
					<p className="text-muted-foreground mb-6">
						Please sign in to access this flow
					</p>
					<Link href="/sign-in">
						<Button>Sign In</Button>
					</Link>
				</div>
			</div>
		);
	}

	// Flow not found or access denied
	if (flow === null) {
		return (
			<div className="h-screen w-screen flex items-center justify-center bg-background">
				<div className="text-center max-w-md mx-auto px-4">
					<AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
					<h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
					<p className="text-muted-foreground mb-6">
						The flow you're looking for doesn't exist or you don't have permission to access it.
					</p>
					<div className="flex gap-3 justify-center">
						<Link href="/dashboard">
							<Button variant="outline" className="gap-2">
								<ArrowLeft className="w-4 h-4" />
								My Flows
							</Button>
						</Link>
						<Link href="/explore">
							<Button className="gap-2">
								Explore Public Flows
							</Button>
						</Link>
					</div>
				</div>
			</div>
		);
	}

	// Render the flow editor with header
	return (
		<div
			className="h-[100vh] w-[100vw] flex flex-col"
			style={{ height: "100vh", width: "100vw", overflow: "hidden" }}
		>
			{/* Flow Header */}
			<div className="flex items-center justify-between px-4 py-2 bg-background border-b border-border">
				<div className="flex items-center gap-3">
					<Link href="/dashboard">
						<Button variant="ghost" size="sm" className="gap-2">
							<ArrowLeft className="w-4 h-4" />
							Back
						</Button>
					</Link>
					<div className="h-4 w-px bg-border" />
					<div className="flex items-center gap-2">
						<h1 className="font-semibold text-foreground">{flow.name}</h1>
						<Badge 
							variant={flow.is_private ? "secondary" : "default"}
							className={`text-xs ${
								flow.is_private 
									? "bg-orange-100 text-orange-700 border-orange-200" 
									: "bg-green-100 text-green-700 border-green-200"
							}`}
						>
							{flow.is_private ? "Private" : "Public"}
						</Badge>
						{!flow.isOwner && (
							<Badge variant="outline" className="text-xs">
								{flow.userPermission === "view" ? "View Only" : 
								 flow.userPermission === "edit" ? "Can Edit" : "Admin"}
							</Badge>
						)}
					</div>
				</div>
				
				<div className="flex items-center gap-2">
					{flow.description && (
						<span className="text-sm text-muted-foreground max-w-xs truncate">
							{flow.description}
						</span>
					)}
					{!flow.canEdit && (
						<Badge variant="outline" className="text-xs text-muted-foreground">
							Read Only
						</Badge>
					)}
				</div>
			</div>

			{/* Flow Editor */}
			<div className="flex-1 overflow-hidden">
				<FlowEditor />
			</div>
		</div>
	);
}
