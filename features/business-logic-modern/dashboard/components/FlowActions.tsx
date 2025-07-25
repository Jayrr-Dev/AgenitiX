/**
 * FLOW ACTIONS - Action buttons for flow management
 *
 * • Delete flow with confirmation dialog
 * • Share flow with comprehensive access management
 * • Secure user authentication checks
 * • Responsive design with modern UI
 * • Full Convex database integration
 *
 * Keywords: flow-actions, delete, share, confirmation, authentication, responsive, convex
 */

"use client";

import { Button } from "@/components/ui/button";
import { 
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FlowShareSystem } from "./FlowShareSystem";
import type { Flow } from "../types";

interface FlowActionsProps {
	flow: Flow;
	onDelete: (flowId: string) => void;
}

export const FlowActions: React.FC<FlowActionsProps> = ({ flow, onDelete }) => {
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showShareSystem, setShowShareSystem] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	// Convex mutation
	const deleteFlow = useMutation(api.flows.deleteFlow);

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			// Use Convex to delete the flow
			await deleteFlow({ flow_id: flow.id as any });
			
			// Call the callback to update the UI immediately
			onDelete(flow.id);
			toast.success("Flow deleted successfully");
		} catch (error) {
			console.error("Failed to delete flow:", error);
			toast.error(error instanceof Error ? error.message : "Failed to delete flow");
		} finally {
			setIsDeleting(false);
			setShowDeleteDialog(false);
		}
	};

	return (
		<>
			{/* Compact Action Buttons */}
			<div className="flex items-center gap-1">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setShowShareSystem(true)}
					className="h-8 px-2 text-muted-foreground hover:text-foreground"
					title="Share flow"
				>
					<Share2 className="w-4 h-4" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setShowDeleteDialog(true)}
					className="h-8 px-2 text-muted-foreground hover:text-destructive"
					title="Delete flow"
				>
					<Trash2 className="w-4 h-4" />
				</Button>
			</div>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Flow</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete "{flow.name}"? This action cannot be undone and will remove all associated data including shares and access requests.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeleting ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Comprehensive Share System */}
			<FlowShareSystem
				flow={flow}
				isOpen={showShareSystem}
				onClose={() => setShowShareSystem(false)}
			/>
		</>
	);
}; 