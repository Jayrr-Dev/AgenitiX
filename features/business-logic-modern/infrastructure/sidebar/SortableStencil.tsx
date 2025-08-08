/**
 * SORTABLE STENCIL - Drag-and-drop enabled node stencil with enhanced UX
 *
 * • Drag-and-drop reordering with visual feedback and accessibility
 * • Touch-friendly interactions with proper gesture handling
 * • Keyboard navigation with focus management and shortcuts
 * • Visual feedback for hover, focus, and active states
 * • Registry-enhanced with Ant Design icons from react-icons/ai
 * • Responsive design with proper touch and mouse event handling
 *
 * Keywords: sortable, stencil, drag-drop, touch, accessibility, keyboard, icons
 */

"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type React from "react";
import { memo, useCallback, useMemo, useRef } from "react";

import { LucideIcon } from "@/features/business-logic-modern/infrastructure/node-core/iconUtils";
import { getNodeSpecMetadata } from "@/features/business-logic-modern/infrastructure/node-registry/nodespec-registry";
import type { HoveredStencil } from "./StencilInfoPanel";
import type { NodeStencil } from "./types";

// Constants for better performance and maintainability
const TOUCH_THRESHOLD = 10; // Minimum pixels to consider as drag, basically the drag sensitivity
const DOUBLE_TAP_THRESHOLD_MIN = 50; // Minimum time between taps, basically the fastest double tap
const DOUBLE_TAP_THRESHOLD_MAX = 400; // Maximum time between taps, basically the slowest double tap
const SINGLE_TAP_DURATION = 200; // Maximum duration for single tap, basically the tap speed limit
const HOVER_DISPLAY_DURATION = 1000; // Duration to show hover state on touch, basically the info display time
const ICON_SIZE = 24; // Icon size constant, basically the icon dimensions
const SCALE_TRANSFORM = "scale(0.95)"; // Touch feedback scale, basically the press effect
const SCALE_TRANSITION = "transform 0.1s ease"; // Touch transition timing, basically the animation speed

// Visual feedback constants for drag preview
const DRAG_PREVIEW_OFFSET_X = 35; // Horizontal offset for drag preview, basically the cursor position adjustment
const DRAG_PREVIEW_OFFSET_Y = 15; // Vertical offset for drag preview, basically the cursor position adjustment

/**
 * Formats node label with proper capitalization.
 * [Explanation], basically converts camelCase/PascalCase to Title Case without breaking acronyms (e.g., JSON)
 */
const formatNodeLabel = (label: string): string => {
  const raw = (label ?? "").trim();
  if (raw === "") return "";

  // If the label already contains whitespace, respect authoring and return as-is
  // [Explanation], basically keep intentional spacing like "Create JSON"
  if (/\s/.test(raw)) {
    return raw;
  }

  // Insert space between lower-to-upper transitions: "createJson" -> "create Json"
  // And between acronym-to-word boundaries: "JSONData" -> "JSON Data"
  // [Explanation], basically add spaces only at semantic boundaries
  const withBoundaries = raw
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2");

  // Capitalize first character for title look
  // [Explanation], basically ensure leading capital without altering the rest
  return withBoundaries.charAt(0).toUpperCase() + withBoundaries.slice(1);
};

/**
 * Category-based fallback icon mapping, basically provides default icons when stencil icon is missing
 */
const CATEGORY_ICON_MAP: Record<string, string> = {
  create: "LuPlus",
  view: "LuEye",
  trigger: "LuZap",
  test: "LuTestTube",
  cycle: "LuRefreshCw",
  store: "LuDatabase",
  ai: "LuBot",
  time: "LuClock",
  flow: "LuGitBranch",
  email: "LuMail",
} as const;

/**
 * Get category-based fallback icon for stencils, basically provides appropriate icons when stencil.icon is not available
 */
const getCategoryFallbackIcon = (category?: string): string => {
  if (!category) {
    return "LuCircle";
  }
  return CATEGORY_ICON_MAP[category.toLowerCase()] || "LuCircle";
};

interface SortableStencilProps {
  stencil: NodeStencil;
  onNativeDragStart: (
    e: React.DragEvent<HTMLDivElement>,
    nodeType: string
  ) => void;
  onDoubleClickCreate: (nodeType: string) => void;
  setHovered: (s: HoveredStencil | null) => void;
  onRemove?: (stencilId: string) => void;
  showRemoveButton?: boolean;
  keyboardShortcut?: string;
  isReadOnly?: boolean;
}

interface TouchState {
  startTime: number;
  startPos: { x: number; y: number };
  lastTapTime: number;
  isDragging: boolean;
}

const SortableStencilComponent: React.FC<SortableStencilProps> = ({
  stencil,
  onNativeDragStart,
  onDoubleClickCreate,
  setHovered,
  onRemove,
  showRemoveButton = false,
  keyboardShortcut,
  isReadOnly = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: stencil.id,
  });

  // Memoized style object to prevent recreation on every render
  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }),
    [transform, transition, isDragging]
  );

  // Consolidated touch state for better performance
  const touchState = useRef<TouchState>({
    startTime: 0,
    startPos: { x: 0, y: 0 },
    lastTapTime: 0,
    isDragging: false,
  });

  // Memoized hover state object to prevent recreation
  const hoveredState = useMemo(
    () => ({
      id: stencil.id,
      label: stencil.label,
      description: stencil.description,
      nodeType: stencil.nodeType,
    }),
    [stencil.id, stencil.label, stencil.description, stencil.nodeType]
  );

  // Optimized icon name computation with stable memoization, basically prevent unnecessary re-computation
  const iconName = useMemo(() => {
    const registryIcon = getNodeSpecMetadata(stencil.nodeType)?.icon;
    const finalIconName =
      stencil.icon || registryIcon || getCategoryFallbackIcon(stencil.category);

    // Debug logging in development only when icon is missing
    if (
      process.env.NODE_ENV === "development" &&
      !stencil.icon &&
      !registryIcon
    ) {
      console.warn(
        `⚠️ No icon found for stencil: ${stencil.label} (${stencil.nodeType}), using fallback: ${finalIconName}`
      );
    }

    return finalIconName;
  }, [stencil.nodeType, stencil.icon, stencil.category]);

  // Memoized formatted label with proper dependency
  const formattedLabel = useMemo(
    () => formatNodeLabel(stencil.label),
    [stencil.label]
  );

  // Memoized title computation
  const titleText = useMemo(
    () =>
      keyboardShortcut
        ? `${stencil.label} (${keyboardShortcut})`
        : stencil.label,
    [stencil.label, keyboardShortcut]
  );

  // Optimized event handlers with better memoization
  const handleKeyFocus = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (["Enter", " "].includes(e.key)) {
        setHovered(hoveredState);
      }
    },
    [setHovered, hoveredState]
  );

  const handleDoubleClick = useCallback(() => {
    // Prevent node creation in read-only mode, basically for public flows accessed from explore
    if (isReadOnly) {
      return;
    }
    onDoubleClickCreate(stencil.nodeType);
  }, [onDoubleClickCreate, stencil.nodeType, isReadOnly]);

  const handleMouseEnter = useCallback(() => {
    setHovered(hoveredState);
  }, [setHovered, hoveredState]);

  const handleMouseLeave = useCallback(() => {
    setHovered(null);
  }, [setHovered]);

  const handleFocus = useCallback(() => {
    setHovered(hoveredState);
  }, [setHovered, hoveredState]);

  const handleBlur = useCallback(() => {
    setHovered(null);
  }, [setHovered]);

  // Optimized touch event handlers with consolidated state
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      const now = Date.now();

      // Update touch state efficiently
      touchState.current.startTime = now;
      touchState.current.startPos = { x: touch.clientX, y: touch.clientY };
      touchState.current.isDragging = false;

      // Check for double tap with constants
      const timeSinceLastTap = now - touchState.current.lastTapTime;
      if (
        timeSinceLastTap < DOUBLE_TAP_THRESHOLD_MAX &&
        timeSinceLastTap > DOUBLE_TAP_THRESHOLD_MIN
      ) {
        e.preventDefault();
        e.stopPropagation();
        // Prevent node creation in read-only mode, basically for public flows accessed from explore
        if (!isReadOnly) {
          onDoubleClickCreate(stencil.nodeType);
        }
        return;
      }
      touchState.current.lastTapTime = now;

      // Add visual feedback for touch start using constants
      const target = e.currentTarget as HTMLElement;
      target.style.transform = SCALE_TRANSFORM;
      target.style.transition = SCALE_TRANSITION;
    },
    [onDoubleClickCreate, stencil.nodeType, isReadOnly]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchState.current.startPos.x);
      const deltaY = Math.abs(touch.clientY - touchState.current.startPos.y);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Use constant for threshold and check consolidated state
      if (distance > TOUCH_THRESHOLD && !touchState.current.isDragging) {
        touchState.current.isDragging = true;
        e.preventDefault();

        // Start touch drag simulation
        startTouchDrag(touch, e.currentTarget);
      }
    },
    [stencil.nodeType, stencil.label]
  );

  const startTouchDrag = useCallback(
    (touch: React.Touch, _element: EventTarget) => {
      // Create optimized drag preview with constants
      const dragPreview = document.createElement("div");
      dragPreview.textContent = stencil.label;
      dragPreview.className =
        "fixed z-50 pointer-events-none bg-node-create text-node-create-text px-2 py-1 rounded text-xs";
      dragPreview.style.left = `${touch.clientX - DRAG_PREVIEW_OFFSET_X}px`;
      dragPreview.style.top = `${touch.clientY - DRAG_PREVIEW_OFFSET_Y}px`;
      document.body.appendChild(dragPreview);

      // Optimized touch movement handler with null checks
      const handleTouchMoveGlobal = (e: TouchEvent) => {
        const currentTouch = e.touches[0];
        if (currentTouch && dragPreview.parentNode) {
          dragPreview.style.left = `${currentTouch.clientX - DRAG_PREVIEW_OFFSET_X}px`;
          dragPreview.style.top = `${currentTouch.clientY - DRAG_PREVIEW_OFFSET_Y}px`;
        }
      };

      // Optimized cleanup function
      const cleanup = () => {
        if (dragPreview.parentNode) {
          dragPreview.parentNode.removeChild(dragPreview);
        }
        document.removeEventListener("touchmove", handleTouchMoveGlobal);
        document.removeEventListener("touchend", handleTouchEndGlobal);
        touchState.current.isDragging = false;
      };

      // Handle touch end (drop) with better error handling
      const handleTouchEndGlobal = (e: TouchEvent) => {
        e.preventDefault();

        try {
          // Find the drop target
          const lastTouch = e.changedTouches[0];
          if (!lastTouch) {
            cleanup();
            return;
          }

          const dropTarget = document.elementFromPoint(
            lastTouch.clientX,
            lastTouch.clientY
          );
          const flowCanvas = dropTarget?.closest(".react-flow");

          if (flowCanvas) {
            // Create optimized synthetic drop event
            const syntheticDropEvent = new DragEvent("drop", {
              bubbles: true,
              cancelable: true,
              clientX: lastTouch.clientX,
              clientY: lastTouch.clientY,
            });

            // Create minimal DataTransfer object
            Object.defineProperty(syntheticDropEvent, "dataTransfer", {
              value: {
                getData: (format: string) =>
                  format === "application/reactflow" ? stencil.nodeType : "",
                setData: () => {},
                effectAllowed: "move",
                dropEffect: "move",
              },
              writable: false,
            });

            // Dispatch the drop event
            flowCanvas.dispatchEvent(syntheticDropEvent);
          }
        } catch (error) {
          console.warn("Touch drag cleanup error:", error);
        } finally {
          cleanup();
        }
      };

      // Add global event listeners with proper options
      document.addEventListener("touchmove", handleTouchMoveGlobal, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEndGlobal, {
        passive: false,
      });
    },
    [stencil.nodeType, stencil.label]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const touchDuration = Date.now() - touchState.current.startTime;

      // Reset visual feedback efficiently
      const target = e.currentTarget as HTMLElement;
      target.style.transform = "";
      target.style.transition = "";

      // Use constant for duration check and consolidated state
      if (
        !touchState.current.isDragging &&
        touchDuration < SINGLE_TAP_DURATION
      ) {
        // Single tap - show hover state briefly using memoized state
        setHovered(hoveredState);
        setTimeout(() => setHovered(null), HOVER_DISPLAY_DURATION);
      }

      touchState.current.isDragging = false;
    },
    [hoveredState, setHovered]
  );

  // Memoized drag start handler
  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      onNativeDragStart(e, stencil.nodeType);
    },
    [onNativeDragStart, stencil.nodeType]
  );

  // Memoized remove handler
  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove?.(stencil.id);
    },
    [onRemove, stencil.id]
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex h-[70px] w-[70px] cursor-pointer select-none items-center justify-center rounded border-2 border-[var(--infra-sidebar-border)] bg-[var(--infra-sidebar-bg)] text-[var(--infra-sidebar-text)] transition-colors hover:bg-[var(--infra-sidebar-bg-hover)]"
      title={titleText}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyFocus}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        title="Re-order"
        className="absolute top-1 left-1 h-3 w-3 cursor-grab text-[8px] text-[var(--infra-sidebar-text-secondary)] active:cursor-grabbing"
        draggable={false}
      >
        ⦿
      </button>

      {showRemoveButton && onRemove && (
        <button
          type="button"
          title="Remove from custom section"
          onClick={handleRemove}
          className="absolute top-1 right-1 flex h-3 w-3 cursor-pointer items-center justify-center rounded-full text-[12px] text-destructive opacity-0 transition-opacity hover:text-destructive/80 group-hover:opacity-100"
        >
          x
        </button>
      )}

      <div
        draggable={true}
        onDragStart={handleDragStart}
        className="flex h-full w-full flex-col items-center justify-center text-center font-medium text-xs"
      >
        <LucideIcon name={iconName} size={ICON_SIZE} />
        <div className="mt-1 text-[10px] text-[var(--infra-sidebar-text-secondary)] leading-tight">
          {formattedLabel}
        </div>
      </div>
    </div>
  );
};

// Memoized component for better performance with shallow comparison
export const SortableStencil = memo(
  SortableStencilComponent,
  (prevProps, nextProps) => {
    // Custom comparison for better performance, basically only re-render if essential props change
    return (
      prevProps.stencil.id === nextProps.stencil.id &&
      prevProps.stencil.label === nextProps.stencil.label &&
      prevProps.stencil.nodeType === nextProps.stencil.nodeType &&
      prevProps.stencil.icon === nextProps.stencil.icon &&
      prevProps.stencil.category === nextProps.stencil.category &&
      prevProps.stencil.description === nextProps.stencil.description &&
      prevProps.showRemoveButton === nextProps.showRemoveButton &&
      prevProps.keyboardShortcut === nextProps.keyboardShortcut &&
      prevProps.onNativeDragStart === nextProps.onNativeDragStart &&
      prevProps.onDoubleClickCreate === nextProps.onDoubleClickCreate &&
      prevProps.setHovered === nextProps.setHovered &&
      prevProps.onRemove === nextProps.onRemove &&
      prevProps.isReadOnly === nextProps.isReadOnly
    );
  }
);

SortableStencil.displayName = "SortableStencil";
