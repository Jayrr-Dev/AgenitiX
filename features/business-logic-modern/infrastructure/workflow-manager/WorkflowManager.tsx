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

import { Download, Settings, Play, Square, ArrowLeft, Lock, Globe, Cloud, CloudOff, Loader2 } from "lucide-react";
import { useFlowStore } from "../flow-engine/stores/flowStore";
import { useFlowMetadataOptional } from "../flow-engine/contexts/FlowMetadataContext";
import { useComponentClasses, useComponentButtonClasses } from "../theming/components";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useAutoSaveCanvas } from "../flow-engine/hooks/useAutoSaveCanvas";
import { useLoadCanvas } from "../flow-engine/hooks/useLoadCanvas";

interface WorkflowManagerProps {
	className?: string;
}

const WorkflowManager: React.FC<WorkflowManagerProps> = ({ className = "" }) => {
	const { nodes, edges } = useFlowStore();
	const { flow } = useFlowMetadataOptional() || { flow: null };
	const router = useRouter();

	// Auto-save and load canvas state
	const autoSave = useAutoSaveCanvas({
		debounceMs: 2000, // Save after 2 seconds of inactivity
		enabled: true,
		showNotifications: false // Keep it subtle
	});
	const loadCanvas = useLoadCanvas();

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
					className={`${buttonClasses} w-10 h-10 p-0 flex items-center justify-center mr-3 cursor-pointer`}
					title="Return to Dashboard"
				>
					<ArrowLeft className="w-6 h-6" />
				</button>
				<div className="flex flex-col">
					<div className="flex items-center gap-2 relative">
						<h2 className="text-xl font-semibold text-foreground">
							{flow?.name || "Untitled Workflow"}
						</h2>

						{/* Auto-save Status Indicator - Absolute positioned to not affect layout */}
						{flow?.canEdit && (
							<div
								className="absolute -left-4 top-1/2 -translate-y-1/2 flex items-center cursor-help"
								title={
									autoSave.isSaving
										? "Saving changes..."
										: autoSave.isEnabled && autoSave.lastSaved
											? `Last saved at ${autoSave.lastSaved.toLocaleTimeString()}`
											: autoSave.isEnabled
												? "Auto-save enabled"
												: "Auto-save disabled"
								}
							>
								{autoSave.isSaving ? (
									<div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_4px_rgba(59,130,246,0.6)]"></div>
								) : autoSave.isEnabled ? (
									<div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.6)]"></div>
								) : (
									<div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_4px_rgba(249,115,22,0.6)]"></div>
								)}
							</div>
						)}

						{flow && (
							<Badge
								variant={flow.is_private ? "secondary" : "default"}
								className={`text-xs flex items-center scale-90 gap-1 ${flow.is_private
									? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
									: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
									}`}
							>
								{flow.is_private ? (
									<>
										<Lock className="w-3 h-3" />
										Private
									</>
								) : (
									<>
										<Globe className="w-3 h-3" />
										Public
									</>
								)}
							</Badge>
						)}
						{flow && !flow.isOwner && (
							<Badge variant="outline" className="text-xs">
								{flow.userPermission === "view" ? "View Only" :
									flow.userPermission === "edit" ? "Can Edit" : "Admin"}
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
						{flow && !flow.canEdit && (
							<>
								<span>•</span>
								<span className="text-amber-600">Read Only</span>
							</>
						)}
					</div>
				</div>
			</div>

			{/* Center Section - Workflow Actions */}
			<div className="flex items-center gap-2">

				<button
					className={`${buttonClasses} w-10 h-10 p-0 flex items-center justify-center cursor-pointer`}
					title="Export Workflow"
					onClick={() => {
						// TODO: Implement export functionality
						console.log("Export workflow");
					}}
				>
					<Download className="w-5 h-5" />
				</button>

				<button
					className={`${buttonClasses} w-10 h-10 p-0 flex items-center justify-center cursor-pointer`}
					title="Run Workflow"
					onClick={() => {
						// TODO: Implement run functionality
						console.log("Run workflow");
					}}
				>
					<Play className="w-5 h-5" />
				</button>

				<button
					className={`${buttonClasses} w-10 h-10 p-0 flex items-center justify-center cursor-pointer`}
					title="Stop Workflow"
					onClick={() => {
						// TODO: Implement stop functionality
						console.log("Stop workflow");
					}}
				>
					<Square className="w-5 h-5" />
				</button>
			</div>

			{/* Right Section - Description & Settings */}
			<div className="flex items-center gap-3">
				{/* {flow?.description && (
					<span className="text-sm text-muted-foreground max-w-xs truncate">
						{flow.description}
					</span>
				)} */}
				<button
					className={`${buttonClasses} w-10 h-10 p-0 flex items-center justify-center cursor-pointer`}
					title="Workflow Settings"
					onClick={() => {
						// TODO: Implement settings functionality
						console.log("Open settings");
					}}
				>
					<Settings className="w-5 h-5" />
				</button>
			</div>
		</div>
	);
};

export default WorkflowManager; 