/**
 * DELETE ACCOUNT MODAL - Account deletion with proper warnings and confirmation
 *
 * • Comprehensive warning system about data loss
 * • Type "delete" confirmation for account deletion
 * • Cascade deletion handling through Convex backend
 * • Secure session management and immediate sign-out
 * • Clear danger zone styling for destructive action
 *
 * Keywords: account-deletion, danger-zone, confirmation, cascade-deletion, auth
 */

"use client";

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
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useAuthContext } from "./AuthProvider";

// TOP LEVEL CONSTANTS - Configuration for delete account modal
const CONFIRMATION_TEXT = "delete";
const AUTH_TOKEN_KEY = "agenitix_auth_token";

// Warning items that will be displayed to the user
const WARNING_ITEMS = [
  "All your flows and automations will be permanently deleted",
  "All connected email accounts will be removed from our system",
  "All shared flows and permissions will be revoked",
  "All uploaded files and data will be permanently erased",
  "Your account history and activity logs will be removed",
  "This action cannot be undone or reversed",
] as const;

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeleteAccountModal = ({
  isOpen,
  onClose,
}: DeleteAccountModalProps) => {
  const { user, signOut, isAuthenticated, authToken } = useAuthContext();
  const deleteAccount = useMutation(api.authFunctions.deleteAccount);
  const router = useRouter();

  const [confirmationInput, setConfirmationInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Get auth token - check both OAuth and magic link tokens, basically unified auth check
  const token = authToken || 
    (typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null);

  // Check if user typed correct confirmation text
  const isConfirmationValid =
    confirmationInput.toLowerCase().trim() === CONFIRMATION_TEXT;

  const handleDeleteAccount = async () => {
    if (!isConfirmationValid) {
      toast.error(`Please type "${CONFIRMATION_TEXT}" to confirm`);
      return;
    }

    if (!isAuthenticated || !user?.id) {
      toast.error("Authentication required - please sign in again");
      return;
    }

    try {
      setIsDeleting(true);

      // Call the deleteAccount mutation with proper confirmation
      await deleteAccount({
        token_hash: token || undefined, // Pass token if available (magic link auth)
        confirmation: CONFIRMATION_TEXT,
      });

      // Show success message
      toast.success("Account deleted successfully");

      // Sign out user and redirect to home page
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Failed to delete account:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete account";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setConfirmationInput("");
    onClose();
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950">
              <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-red-900 dark:text-red-100">
                Delete Account
              </DialogTitle>
              <DialogDescription className="text-red-700 dark:text-red-300">
                This action cannot be undone. Please read carefully.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* User Information */}
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
            <p className="font-medium text-red-900 text-sm dark:text-red-100">
              Account to be deleted:
            </p>
            <p className="mt-1 font-mono text-red-700 text-xs dark:text-red-300">
              {user.email}
            </p>
            <p className="mt-1 text-red-700 text-xs dark:text-red-300">
              {user.name}
            </p>
          </div>

          {/* Warning Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h4 className="font-semibold text-foreground">
                What will be deleted:
              </h4>
            </div>

            <ul className="space-y-2">
              {WARNING_ITEMS.map((warning) => (
                <li
                  key={warning}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>

          <Separator className="border-red-200 dark:border-red-800" />

          {/* Confirmation Input */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="confirmation" className="text-foreground">
                Type{" "}
                <span className="font-mono font-bold">
                  "{CONFIRMATION_TEXT}"
                </span>{" "}
                to confirm deletion:
              </Label>
              <Input
                id="confirmation"
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder={`Type "${CONFIRMATION_TEXT}" here`}
                className="mt-2 border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-700"
                disabled={isDeleting}
                autoComplete="off"
              />
            </div>

            {confirmationInput && !isConfirmationValid && (
              <p className="text-red-600 text-xs dark:text-red-400">
                Please type "{CONFIRMATION_TEXT}" exactly as shown
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={!isConfirmationValid || isDeleting}
            className="flex-1"
          >
            {isDeleting ? "Deleting Account..." : "Delete Account Forever"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
