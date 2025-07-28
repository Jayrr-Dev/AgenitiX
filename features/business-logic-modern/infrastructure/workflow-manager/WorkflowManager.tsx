/**
 * WORKFLOW MANAGER - Header component for workflow editor
 *
 * • Provides workflow management controls and information
 * • Displays current workflow name and status
 * • Contains essential workflow actions (save, export, etc.)
 * • Positioned at top-center of the workflow editor
 * • Integrates with the existing flow store for state management
 *
 * Keywords: workflow-header, workflow-management, flow-controls, top-panel
 */

"use client";

import { Save, Download, Settings, Play, Square, ArrowLeft, Lock, Eye } from "lucide-react";
import { useFlowStore } from "../flow-engine/stores/flowStore";
import { useComponentClasses, useComponentButtonClasses } from "../theming/components";
import { useRouter } from "next/navigation";
import { useFlowMetadata } from "../flow-engine/contexts/FlowContext";
import { Badge } from "@/components/ui/badge";

interface WorkflowManagerProps {
	className?: string;
}

const WorkflowManager: React.FC<WorkflowManagerProps> = ({ className = "" }) => {
	const { nodes, edges } = useFlowStore();
	const router = useRouter();
	// Use try-catch to handle cases where context might not be available
	let flowMetadata = null;
	try {
		flowMetadata = useFlowMetadata();
	} catch (error) {
		// Context not available, use fallback
		console.warn("FlowContext not available, using fallback");
	}

	// Get themed classes
	const containerClasses = useComponentClasses(
		"workflowManager",
		"default",
		`flex items-center justify-between gap-4 p-3 rounded-lg shadow-sm border ${className}`
	);
	const buttonClasses = useComponentButtonClasses("workflowManager", "ghost", "sm");
	const primaryButtonClasses = useComponentButtonClasses("workflowManager", "primary", "sm");

	// Calculate workflow stats
	const nodeCount = nodes.length;
	const edgeCount = edges.length;
	const isWorkflowEmpty = nodeCount === 0;

	const handleReturnToDashboard = () => {
		router.push("/dashboard");
	};

	return (
		<div className={containerClasses}>
			{/* Left Section - Back Button & Workflow Info */}
			<div className="flex items-center gap-3">
				<button
					onClick={handleReturnToDashboard}
					className={buttonClasses}
					title="Return to Dashboard"
				>
					<ArrowLeft className="w-4 h-4" />
				</button>
				<div className="flex flex-col">
					<div className="flex items-center gap-2">
						<h2 className="text-sm font-semibold text-foreground">
							{flowMetadata?.name || "Workflow Editor"}
						</h2>
						{flowMetadata && (
							<Badge 
								variant={flowMetadata.is_private ? "secondary" : "default"}
								className={`text-xs ${
									flowMetadata.is_private 
										? "bg-orange-100 text-orange-700 border-orange-200" 
										: "bg-green-100 text-green-700 border-green-200"
								}`}
							>
								{flowMetadata.is_private ? (
									<><Lock className="w-3 h-3 mr-1" />Private</>
								) : (
									<><Eye className="w-3 h-3 mr-1" />Public</>
								)}
							</Badge>
						)}
						{flowMetadata && !flowMetadata.isOwner && (
							<Badge variant="outline" className="text-xs">
								{flowMetadata.userPermission === "view" ? "View Only" : 
								 flowMetadata.userPermission === "edit" ? "Can Edit" : "Admin"}
							</Badge>
						)}
					</div>
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<span>{nodeCount} nodes</span>
						<span>•</span>
						<span>{edgeCount} connections</span>
						{isWorkflowEmpty && (
							<>
								<span>•</span>
								<span className="text-orange-500">Empty workflow</span>
							</>
						)}
						{flowMetadata?.description && (
							<>
								<span>•</span>
								<span className="max-w-xs truncate">{flowMetadata.description}</span>
							</>
						)}
					</div>
				</div>
			</div>

			{/* Center Section - Workflow Actions */}
			<div className="flex items-center gap-2">
				<button
					className={primaryButtonClasses}
					title="Save Workflow"
					onClick={() => {
						// TODO: Implement save functionality
						console.log("Save workflow");
					}}
				>
					<Save className="w-4 h-4" />
					<span className="ml-1 text-xs">Save</span>
				</button>

				<button
					className={buttonClasses}
					title="Export Workflow"
					onClick={() => {
						// TODO: Implement export functionality
						console.log("Export workflow");
					}}
				>
					<Download className="w-4 h-4" />
				</button>

				<button
					className={buttonClasses}
					title="Run Workflow"
					onClick={() => {
						// TODO: Implement run functionality
						console.log("Run workflow");
					}}
				>
					<Play className="w-4 h-4" />
				</button>

				<button
					className={buttonClasses}
					title="Stop Workflow"
					onClick={() => {
						// TODO: Implement stop functionality
						console.log("Stop workflow");
					}}
				>
					<Square className="w-4 h-4" />
				</button>
			</div>

			{/* Right Section - Settings */}
			<div className="flex items-center gap-2">
				<button
					className={buttonClasses}
					title="Workflow Settings"
					onClick={() => {
						// TODO: Implement settings functionality
						console.log("Open settings");
					}}
				>
					<Settings className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
};

export default WorkflowManager; 