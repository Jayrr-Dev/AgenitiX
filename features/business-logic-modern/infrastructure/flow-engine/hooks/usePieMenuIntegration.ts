/**
 * USE PIE MENU INTEGRATION HOOK - Complete pie menu integration for flow editor
 *
 * • Integrates pie menu with flow editor keyboard shortcuts
 * • Provides context-aware actions based on current selection
 * • Handles mouse position tracking for menu positioning
 * • Connects pie menu to flow store operations
 * • Optimized performance with proper memoization
 *
 * Keywords: pie-menu-integration, flow-editor, context-aware, mouse-tracking, performance
 */

import { usePieMenu, usePieMenuTrigger } from "@/components/ui/pie-menu";
import { useReactFlow } from "@xyflow/react";
import { useCallback, useEffect, useRef } from "react";
import { usePieMenuActions } from "./usePieMenuActions";

export interface UsePieMenuIntegrationOptions {
  /** Whether the pie menu is enabled */
  enabled?: boolean;
  /** Include debug actions in development */
  includeDebugActions?: boolean;
}

/**
 * Hook that provides complete pie menu integration for the flow editor
 * Returns handlers for keyboard activation and mouse tracking
 */
export function usePieMenuIntegration(
  options: UsePieMenuIntegrationOptions = {}
) {
  const { enabled = true, includeDebugActions = false } = options;

  const { triggerPieMenu } = usePieMenuTrigger();
  const { hidePieMenu, isVisible } = usePieMenu();
  const { screenToFlowPosition } = useReactFlow();

  // Track mouse position for pie menu activation, basically remember last cursor position
  const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const flowPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Get context-aware actions, basically actions change based on selection
  const { actions } = usePieMenuActions({
    mousePosition: flowPositionRef.current,
    includeDebugActions,
  });

  // Track mouse movement for position-based menu activation
  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Store the raw screen coordinates for pie menu positioning
      mousePositionRef.current = { x: e.clientX, y: e.clientY };

      try {
        // Convert to flow position for context-aware actions
        const flowPosition = screenToFlowPosition({
          x: e.clientX,
          y: e.clientY,
        });
        flowPositionRef.current = flowPosition;
      } catch (error) {
        // Fallback if flow position conversion fails
        const fallbackPosition = { x: e.clientX, y: e.clientY };
        flowPositionRef.current = fallbackPosition;
      }
    };

    // Use passive event listener for performance, basically don't block scrolling
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [enabled, screenToFlowPosition]);

  // Handle keyboard activation (G key), basically show menu at cursor
  const handleKeyboardActivation = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      e.preventDefault();

      if (isVisible) {
        // If menu is visible, hide it
        hidePieMenu();
      } else {
        // If menu is hidden, show it at cursor
        const mockMouseEvent = {
          clientX: mousePositionRef.current.x,
          clientY: mousePositionRef.current.y,
        } as MouseEvent;

        triggerPieMenu(mockMouseEvent, actions);
      }
    },
    [enabled, triggerPieMenu, actions, hidePieMenu, isVisible]
  );

  // Handle right-click activation (optional), basically alternative activation method
  const handleRightClickActivation = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled) return;

      e.preventDefault();
      e.stopPropagation();

      triggerPieMenu(e.nativeEvent, actions);
    },
    [enabled, triggerPieMenu, actions]
  );

  // Force hide menu (for cleanup), basically emergency escape
  const forceHideMenu = useCallback(() => {
    hidePieMenu();
  }, [hidePieMenu]);

  return {
    handleKeyboardActivation,
    handleRightClickActivation,
    forceHideMenu,
    isEnabled: enabled,
    currentActions: actions,
    mousePosition: mousePositionRef.current,
    flowPosition: flowPositionRef.current,
  };
}
