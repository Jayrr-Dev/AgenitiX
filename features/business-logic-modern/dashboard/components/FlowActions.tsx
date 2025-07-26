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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Share2, Edit3 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FlowShareSystem } from "./FlowShareSystem";
import type { Flow } from "../types";
import { useAuthContext } from "@/components/auth/AuthProvider";

interface FlowActionsProps {
	flow: Flow;
	onDelete: (flowId: string) => void;
	onUpdate?: (flowId: string, updates: { name?: string; description?: string; is_private?: boolean }) => void;
}

export const FlowActions: React.FC<FlowActionsProps> = ({ flow, onDelete, onUpdate }) => {
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showShareSystem, setShowShareSystem] = useState(false);
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);

	// Edit form state
	const [editName, setEditName] = useState(flow.name);
	const [editDescription, setEditDescription] = useState(flow.description || "");
	const [editIsPrivate, setEditIsPrivate] = useState(flow.private);

	// Auth context
	const { user } = useAuthContext();

	// Convex mutations
	const deleteFlow = useMutation(api.flows.deleteFlow);
	const updateFlow = useMutation(api.flows.updateFlow);

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

	const handleEdit = async () => {
		if (!user?.id) {
			toast.error("Authentication required");
			return;
		}

		setIsUpdating(true);
		try {
			// Use Convex to update the flow
			await updateFlow({
				flow_id: flow.id as any,
				user_id: user.id,
				name: editName.trim(),
				description: editDescription.trim() || undefined,
				is_private: editIsPrivate,
			});
			
			// Call the callback to update the UI immediately
			if (onUpdate) {
				onUpdate(flow.id, {
					name: editName.trim(),
					description: editDescription.trim() || undefined,
					is_private: editIsPrivate,
				});
			}
			
			toast.success("Flow updated successfully");
			setShowEditDialog(false);
		} catch (error) {
			console.error("Failed to update flow:", error);
			toast.error(error instanceof Error ? error.message : "Failed to update flow");
		} finally {
			setIsUpdating(false);
		}
	};

	const handleEditOpen = () => {
		// Reset form state when opening
		setEditName(flow.name);
		setEditDescription(flow.description || "");
		setEditIsPrivate(flow.private);
		setShowEditDialog(true);
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
					onClick={handleEditOpen}
					className="h-8 px-2 text-muted-foreground hover:text-foreground"
					title="Edit flow"
				>
					<Edit3 className="w-4 h-4" />
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

			{/* Edit Flow Dialog */}
			<Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Edit Flow</DialogTitle>
						<DialogDescription>
							Update your flow's name, description, and privacy settings.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								value={editName}
								onChange={(e) => setEditName(e.target.value)}
								placeholder="Enter flow name"
								disabled={isUpdating}
								maxLength={12}
							/>
							<div className="text-xs text-muted-foreground text-right">
								{editName.length}/12 characters
							</div>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								value={editDescription}
								onChange={(e) => setEditDescription(e.target.value)}
								placeholder="Enter flow description (optional)"
								disabled={isUpdating}
								rows={3}
								maxLength={200}
							/>
							<div className="text-xs text-muted-foreground text-right">
								{editDescription.length}/200 characters
							</div>
						</div>
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label htmlFor="privacy">Privacy</Label>
								<div className="text-sm text-muted-foreground">
									{editIsPrivate ? "Only you can see this flow" : "Anyone can see this flow"}
								</div>
							</div>
							<Switch
								id="privacy"
								checked={!editIsPrivate}
								onCheckedChange={(checked: boolean) => setEditIsPrivate(!checked)}
								disabled={isUpdating}
								className={`transition-all duration-200 ${!editIsPrivate
									? "data-[state=checked]:bg-green-600"
									: "data-[state=unchecked]:bg-orange-500"
								}`}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowEditDialog(false)}
							disabled={isUpdating}
						>
							Cancel
						</Button>
						<Button
							onClick={handleEdit}
							disabled={isUpdating || !editName.trim()}
						>
							{isUpdating ? "Saving..." : "Save Changes"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

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