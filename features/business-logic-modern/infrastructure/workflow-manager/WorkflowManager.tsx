/**
 * WORKFLOW MANAGER - High-level workflow orchestration component
 */

import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Globe, Lock, Play, Settings, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useMemo, memo } from "react";
import { useFlowMetadataOptional } from "../flow-engine/contexts/flow-metadata-context";
import { useAutoSaveCanvas } from "../flow-engine/hooks/useAutoSaveCanvas";
import { useLoadCanvas } from "../flow-engine/hooks/useLoadCanvas";
import { useFlowStore } from "../flow-engine/stores/flowStore";
import { useComponentButtonClasses, useComponentClasses } from "../theming/components";

interface WorkflowManagerProps {
	className?: string;
}

const WorkflowManagerComponent: React.FC<WorkflowManagerProps> = ({ className = "" }) => {
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

	// Get themed classes - these hooks return stable values based on theme
	const rawContainerClasses = useComponentClasses(
		"workflowManager",
		"default",
		"flex items-center justify-between gap-4 p-3 rounded-lg shadow-sm border"
	);
	
	const buttonClasses = useComponentButtonClasses("workflowManager", "ghost", "sm");
	const _primaryButtonClasses = useComponentButtonClasses("workflowManager", "primary", "sm");

	// Memoize only the final container classes that include the className prop
	const containerClasses = useMemo(
		() => `${rawContainerClasses} ${className}`,
		[rawContainerClasses, className]
	);

	// Calculate workflow stats - memoized to prevent recalculation
	const workflowStats = useMemo(() => ({
		nodeCount: nodes.length,
		edgeCount: edges.length,
		isWorkflowEmpty: nodes.length === 0,
	}), [nodes.length, edges.length]);

	// Memoized event handlers to prevent re-creation
	const handleReturnToDashboard = useCallback(() => {
		router.push("/dashboard");
	}, [router]);

	const handleExportWorkflow = useCallback(() => {
		// Implementation for export
	}, []);

	const handleRunWorkflow = useCallback(() => {
		// Implementation for run
	}, []);

	const handleStopWorkflow = useCallback(() => {
		// Implementation for stop
	}, []);

	const handleWorkflowSettings = useCallback(() => {
		// Implementation for settings
	}, []);

	// Memoized auto-save tooltip text to prevent string concatenation on every render
	const autoSaveTooltip = useMemo(() => {
		if (autoSave.isSaving) {
			return "Saving changes...";
		}
		if (autoSave.isEnabled && autoSave.lastSaved) {
			return `Last saved at ${autoSave.lastSaved.toLocaleTimeString()}`;
		}
		return autoSave.isEnabled ? "Auto-save enabled" : "Auto-save disabled";
	}, [autoSave.isSaving, autoSave.isEnabled, autoSave.lastSaved]);

	// Memoized flow badge variant and classes
	const flowBadgeProps = useMemo(() => {
		if (!flow) return null;
		
		const isPrivate = flow.is_private;
		return {
			variant: isPrivate ? "secondary" : "default",
			className: `flex scale-90 items-center gap-1 text-xs ${
				isPrivate
					? "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
					: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
			}`,
			icon: isPrivate ? Lock : Globe,
			label: isPrivate ? "Private" : "Public",
		};
	}, [flow?.is_private]);

	// Memoized permission badge
	const permissionBadge = useMemo(() => {
		if (!flow || flow.isOwner) return null;
		
		const permissionLabel = 
			flow.userPermission === "view" ? "View Only" :
			flow.userPermission === "edit" ? "Can Edit" : "Admin";
			
		return permissionLabel;
	}, [flow?.isOwner, flow?.userPermission]);

	return (
		<div className={containerClasses}>
			{/* Left Section - Back Button & Workflow Info */}
			<div className="flex items-center gap-3">
				<button
					onClick={handleReturnToDashboard}
					className={`${buttonClasses} mr-3 flex h-10 w-10 cursor-pointer items-center justify-center p-0`}
					title="Return to Dashboard"
					type="button"
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
								title={autoSaveTooltip}
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

						{flowBadgeProps && (
							<Badge
								variant={flowBadgeProps.variant as any}
								className={flowBadgeProps.className}
							>
								<flowBadgeProps.icon className="h-3 w-3" />
								{flowBadgeProps.label}
							</Badge>
						)}
						
						{permissionBadge && (
							<Badge variant="outline" className="text-xs">
								{permissionBadge}
							</Badge>
						)}
					</div>
					<div className="flex items-center gap-2 text-muted-foreground text-xs">
						<span>{workflowStats.nodeCount} nodes</span>
						<span>•</span>
						<span>{workflowStats.edgeCount} connections</span>
						{workflowStats.isWorkflowEmpty && (
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
					onClick={handleExportWorkflow}
					type="button"
				>
					<Download className="h-5 w-5" />
				</button>

				<button
					className={`${buttonClasses} flex h-10 w-10 cursor-pointer items-center justify-center p-0`}
					title="Run Workflow"
					onClick={handleRunWorkflow}
					type="button"
				>
					<Play className="h-5 w-5" />
				</button>

				<button
					className={`${buttonClasses} flex h-10 w-10 cursor-pointer items-center justify-center p-0`}
					title="Stop Workflow"
					onClick={handleStopWorkflow}
					type="button"
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
					onClick={handleWorkflowSettings}
					type="button"
				>
					<Settings className="h-5 w-5" />
				</button>
			</div>
		</div>
	);
};

// Memoized export to prevent unnecessary re-renders
const WorkflowManager = memo(WorkflowManagerComponent, (prevProps, nextProps) => {
	// Only re-render if className changes
	return prevProps.className === nextProps.className;
});

WorkflowManager.displayName = "WorkflowManager";

export default WorkflowManager;
