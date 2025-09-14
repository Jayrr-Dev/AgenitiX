"use client";
/**
Route: app/providers/setupPieMenuContextMenuClient.tsx
 * SETUP PIE MENU CONTEXT MENU CLIENT - Replace browser right-click with pie menu
 *
 * • Globally disables the native context menu and opens the app pie menu instead
 * • Uses portal rendering and precise cursor positioning from `components/ui/pie-menu`
 * • Safe to mount once at the app root; cleans up listeners on unmount
 *
 * Keywords: contextmenu, pie-menu, global-handler, portal, shadcn
 */

import {
  type PieMenuAction,
  usePieMenuTrigger,
} from "@/components/ui/pie-menu";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";

// ------------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------------

const DEFAULT_PIE_MENU_ACTIONS: ReadonlyArray<PieMenuAction> = [
  {
    id: "add",
    label: "Add",
    icon: "Plus",
    action: () => {}, // Trigger add flow, basically placeholder action
    shortcut: "A",
  },
  {
    id: "duplicate",
    label: "Duplicate",
    icon: "Layers",
    action: () => {}, // Duplicate selection, basically placeholder action
    shortcut: "D",
  },
  {
    id: "move",
    label: "Move",
    icon: "Move",
    action: () => {}, // Move tool, basically placeholder action
    shortcut: "M",
  },
  {
    id: "history",
    label: "History",
    icon: "History",
    action: () => {}, // Open history, basically placeholder action
  },
  {
    id: "preview",
    label: "Preview",
    icon: "Eye",
    action: () => {}, // Toggle preview, basically placeholder action
    shortcut: "P",
  },
  {
    id: "run",
    label: "Run",
    icon: "Play",
    action: () => {}, // Run workflow, basically placeholder action
    shortcut: "R",
  },
  {
    id: "settings",
    label: "Settings",
    icon: "Settings",
    action: () => {}, // Open settings, basically placeholder action
  },
  {
    id: "delete",
    label: "Delete",
    icon: "Trash2",
    action: () => {}, // Delete selection, basically placeholder action
    shortcut: "Del",
  },
] as const;

// ------------------------------------------------------------------------------------
// Component
// ------------------------------------------------------------------------------------

/**
 * Mounts a single global `contextmenu` listener that prevents the browser menu
 * and triggers the pie menu at the cursor position.
 * Only enabled on matrix URLs (/matrix/[flowId]).
 */
export function SetupPieMenuContextMenuClient() {
  const { triggerPieMenu } = usePieMenuTrigger();
  const pathname = usePathname();

  const actions = useMemo(() => DEFAULT_PIE_MENU_ACTIONS.slice(), []);

  // Check if current path is a matrix URL
  const isMatrixUrl = useMemo(() => {
    return pathname.startsWith("/matrix/") && pathname !== "/matrix";
  }, [pathname]);

  const handleContextMenu = useCallback(
    (event: MouseEvent) => {
      // Only enable pie menu on matrix URLs
      if (!isMatrixUrl) {
        return; // Allow native browser context menu on non-matrix pages
      }

      // Allow native menu on text inputs/content editable, basically preserve standard UX
      const target = event.target as Element | null;
      if (target) {
        const isEditable =
          target.closest(
            "input, textarea, [contenteditable='true'], [contenteditable='']"
          ) !== null;
        if (isEditable) {
          return;
        }
      }

      // Prevent the native browser context menu, basically intercept right-click
      event.preventDefault();
      event.stopPropagation();

      // Open the pie menu at the cursor with default actions
      triggerPieMenu(event, actions);
    },
    [triggerPieMenu, actions, isMatrixUrl]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Capture phase to reliably block the native menu before other handlers
    window.addEventListener("contextmenu", handleContextMenu, {
      capture: true,
      passive: false,
    });
    return () => {
      window.removeEventListener("contextmenu", handleContextMenu, true);
    };
  }, [handleContextMenu]);

  return null;
}
