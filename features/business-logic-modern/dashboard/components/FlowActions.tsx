/**
 * FLOW ACTIONS COMPONENT - Action buttons for individual flow cards
 *
 * • Delete flow with confirmation dialog
 * • Share flow with external users
 * • Edit flow metadata (name, description)
 * • Responsive dropdown menu for mobile
 * • Proper error handling and user feedback
 *
 * Keywords: flow-actions, delete-flow, share-flow, dropdown, responsive
 */

"use client";

import { useAuthContext } from "@/components/auth/AuthProvider";
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
import { Button } from "@/components/ui/button";
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
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Edit3, Share2, Trash2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import type { Flow } from "../types";
import { FlowShareSystem } from "./FlowShareSystem";

interface FlowActionsProps {
	flow: Flow;
	onDelete: (flowId: string) => void;
	onUpdate?: (
		flowId: string,
		updates: { name?: string; description?: string; is_private?: boolean }
	) => void;
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
	const { user, isAuthenticated } = useAuthContext();

	// Convex mutations
	const deleteFlow = useMutation(api.flows.deleteFlow);
	const updateFlow = useMutation(api.flows.updateFlow);

	const handleDelete = async () => {
		if (!isAuthenticated || !user?.id) {
			toast.error("Authentication required - please sign in again");
			return;
		}

		setIsDeleting(true);
		try {
			// Use Convex to delete the flow
			await deleteFlow({
				flow_id: flow.id as Id<"flows">,
				user_id: user.id,
			});

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
		if (!isAuthenticated || !user?.id) {
			toast.error("Authentication required - please sign in again");
			return;
		}

		setIsUpdating(true);
		try {
			// Use Convex to update the flow
			await updateFlow({
				flow_id: flow.id as Id<"flows">,
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
					<Share2 className="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={handleEditOpen}
					className="h-8 px-2 text-muted-foreground hover:text-foreground"
					title="Edit flow"
				>
					<Edit3 className="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setShowDeleteDialog(true)}
					className="h-8 px-2 text-muted-foreground hover:text-destructive"
					title="Delete flow"
				>
					<Trash2 className="h-4 w-4" />
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
							<div className="text-right text-muted-foreground text-xs">
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
							<div className="text-right text-muted-foreground text-xs">
								{editDescription.length}/200 characters
							</div>
						</div>
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label htmlFor="privacy">Privacy</Label>
								<div className="text-muted-foreground text-sm">
									{editIsPrivate ? "Only you can see this flow" : "Anyone can see this flow"}
								</div>
							</div>
							<Switch
								id="privacy"
								checked={editIsPrivate}
								onCheckedChange={(checked) => setEditIsPrivate(checked)}
								disabled={isUpdating}
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
						<Button type="button" onClick={handleEdit} disabled={isUpdating || !editName.trim()}>
							{isUpdating ? "Saving..." : "Save Changes"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete your flow and remove its
							data from our servers.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
							{isDeleting ? "Deleting..." : "Delete Flow"}
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
