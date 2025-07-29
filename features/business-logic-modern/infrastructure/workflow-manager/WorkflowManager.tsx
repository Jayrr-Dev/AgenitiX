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

import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Globe, Lock, Play, Settings, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFlowMetadataOptional } from "../flow-engine/contexts/flow-metadata-context";
import { useAutoSaveCanvas } from "../flow-engine/hooks/useAutoSaveCanvas";
import { useLoadCanvas } from "../flow-engine/hooks/useLoadCanvas";
import { useFlowStore } from "../flow-engine/stores/flowStore";
import { useComponentButtonClasses, useComponentClasses } from "../theming/components";

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
		showNotifications: false, // Keep it subtle
	});
	const _loadCanvas = useLoadCanvas();

	// Get themed classes
	const containerClasses = useComponentClasses(
		"workflowManager",
		"default",
		`flex items-center justify-between gap-4 p-3 rounded-lg shadow-sm border ${className}`
	);
	const buttonClasses = useComponentButtonClasses("workflowManager", "ghost", "sm");
	const _primaryButtonClasses = useComponentButtonClasses("workflowManager", "primary", "sm");

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
					className={`${buttonClasses} mr-3 flex h-10 w-10 cursor-pointer items-center justify-center p-0`}
					title="Return to Dashboard"
				>
					<ArrowLeft className="h-6 w-6" />
				</button>
				<div className="flex flex-col">
					<div className="relative flex items-center gap-2">
						<h2 className="font-semibold text-foreground text-xl">
							{flow?.name || "Untitled Workflow"}
						</h2>

						{/* Auto-save Status Indicator - Absolute positioned to not affect layout */}
						{flow?.canEdit && (
							<div
								className="-left-4 -translate-y-1/2 absolute top-1/2 flex cursor-help items-center"
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
									<div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.6)]" />
								) : autoSave.isEnabled ? (
									<div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.6)]" />
								) : (
									<div className="h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_4px_rgba(249,115,22,0.6)]" />
								)}
							</div>
						)}

						{flow && (
							<Badge
								variant={flow.is_private ? "secondary" : "default"}
								className={`flex scale-90 items-center gap-1 text-xs ${
									flow.is_private
										? "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
										: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
								}`}
							>
								{flow.is_private ? (
									<>
										<Lock className="h-3 w-3" />
										Private
									</>
								) : (
									<>
										<Globe className="h-3 w-3" />
										Public
									</>
								)}
							</Badge>
						)}
						{flow && !flow.isOwner && (
							<Badge variant="outline" className="text-xs">
								{flow.userPermission === "view"
									? "View Only"
									: flow.userPermission === "edit"
										? "Can Edit"
										: "Admin"}
							</Badge>
						)}
					</div>
					<div className="flex items-center gap-2 text-muted-foreground text-xs">
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
					className={`${buttonClasses} flex h-10 w-10 cursor-pointer items-center justify-center p-0`}
					title="Export Workflow"
					onClick={() => {}}
				>
					<Download className="h-5 w-5" />
				</button>

				<button
					className={`${buttonClasses} flex h-10 w-10 cursor-pointer items-center justify-center p-0`}
					title="Run Workflow"
					onClick={() => {}}
				>
					<Play className="h-5 w-5" />
				</button>

				<button
					className={`${buttonClasses} flex h-10 w-10 cursor-pointer items-center justify-center p-0`}
					title="Stop Workflow"
					onClick={() => {}}
				>
					<Square className="h-5 w-5" />
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
					className={`${buttonClasses} flex h-10 w-10 cursor-pointer items-center justify-center p-0`}
					title="Workflow Settings"
					onClick={() => {}}
				>
					<Settings className="h-5 w-5" />
				</button>
			</div>
		</div>
	);
};

export default WorkflowManager;
