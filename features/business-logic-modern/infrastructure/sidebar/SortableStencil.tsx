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
import { useCallback, useRef, useState } from "react";

import { renderLucideIcon } from "@/features/business-logic-modern/infrastructure/node-core/iconUtils";
import type { HoveredStencil } from "./StencilInfoPanel";
import type { NodeStencil } from "./types";

/**
 * Formats node label with proper capitalization
 * Converts "createText" to "Create Text"
 */
function formatNodeLabel(label: string): string {
	// Handle camelCase to Title Case conversion
	return label
		.replace(/([A-Z])/g, ' $1') // Add space before capital letters
		.replace(/^./, str => str.toUpperCase()) // Capitalize first letter
		.trim(); // Remove leading/trailing spaces
}

interface SortableStencilProps {
	stencil: NodeStencil;
	onNativeDragStart: (e: React.DragEvent<HTMLDivElement>, nodeType: string) => void;
	onDoubleClickCreate: (nodeType: string) => void;
	setHovered: (s: HoveredStencil | null) => void;
	onRemove?: (stencilId: string) => void;
	showRemoveButton?: boolean;
	keyboardShortcut?: string;
}

export const SortableStencil: React.FC<SortableStencilProps> = ({
	stencil,
	onNativeDragStart,
	onDoubleClickCreate,
	setHovered,
	onRemove,
	showRemoveButton = false,
	keyboardShortcut,
}) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: stencil.id,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	// Touch handling state
	const touchStartTime = useRef(0);
	const touchStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
	const lastTapTime = useRef<number>(0);
	const isTouchDragging = useRef<boolean>(false);

	const handleKeyFocus = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (["Enter", " "].includes(e.key)) {
			setHovered(stencil);
		}
	};

	// Touch event handlers
	const handleTouchStart = useCallback(
		(e: React.TouchEvent) => {
			console.log("Touch start on stencil:", stencil.label);
			const touch = e.touches[0];
			touchStartTime.current = Date.now();
			touchStartPos.current = { x: touch.clientX, y: touch.clientY };
			isTouchDragging.current = false;

			// Check for double tap
			const now = Date.now();
			const timeSinceLastTap = now - lastTapTime.current;
			if (timeSinceLastTap < 400 && timeSinceLastTap > 50) {
				// 400ms double tap threshold, min 50ms to avoid accidental
				console.log("Double tap detected, creating node:", stencil.nodeType);
				e.preventDefault();
				e.stopPropagation();
				onDoubleClickCreate(stencil.nodeType);
				return;
			}
			lastTapTime.current = now;

			// Add visual feedback for touch start
			const target = e.currentTarget as HTMLElement;
			target.style.transform = "scale(0.95)";
			target.style.transition = "transform 0.1s ease";
		},
		[stencil.nodeType, stencil.label, onDoubleClickCreate]
	);

	const handleTouchMove = useCallback(
		(e: React.TouchEvent) => {
			const touch = e.touches[0];
			const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
			const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
			const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

			// If moved more than 10px, consider it a drag
			if (distance > 10 && !isTouchDragging.current) {
				console.log("Touch drag started for:", stencil.label);
				isTouchDragging.current = true;
				e.preventDefault();

				// Start touch drag simulation
				startTouchDrag(touch, e.currentTarget);
			}
		},
		[stencil.nodeType, stencil.label]
	);

	const startTouchDrag = useCallback(
		(touch: React.Touch, element: EventTarget) => {
			console.log("Starting touch drag simulation for:", stencil.label);
			// Create a visual drag preview
			const dragPreview = document.createElement("div");
			dragPreview.textContent = stencil.label;
			dragPreview.className =
				"fixed z-50 pointer-events-none bg-node-create text-node-create-text px-2 py-1 rounded text-xs";
			dragPreview.style.left = `${touch.clientX - 35}px`;
			dragPreview.style.top = `${touch.clientY - 15}px`;
			document.body.appendChild(dragPreview);

			// Track touch movement
			const handleTouchMoveGlobal = (e: TouchEvent) => {
				const currentTouch = e.touches[0];
				if (currentTouch && dragPreview) {
					dragPreview.style.left = `${currentTouch.clientX - 35}px`;
					dragPreview.style.top = `${currentTouch.clientY - 15}px`;
				}
			};

			// Handle touch end (drop)
			const handleTouchEndGlobal = (e: TouchEvent) => {
				e.preventDefault();
				console.log("Touch drag ended");

				// Remove the drag preview
				if (dragPreview && dragPreview.parentNode) {
					dragPreview.parentNode.removeChild(dragPreview);
				}

				// Find the drop target
				const lastTouch = e.changedTouches[0];
				const dropTarget = document.elementFromPoint(lastTouch.clientX, lastTouch.clientY);

				// Check if we're dropping on the ReactFlow canvas
				const flowCanvas = dropTarget?.closest(".react-flow");
				if (flowCanvas) {
					console.log("Dropping on ReactFlow canvas, creating node:", stencil.nodeType);
					// Create a synthetic drop event
					const syntheticDropEvent = new DragEvent("drop", {
						bubbles: true,
						cancelable: true,
						clientX: lastTouch.clientX,
						clientY: lastTouch.clientY,
					});

					// Create a DataTransfer object and set the node type
					Object.defineProperty(syntheticDropEvent, "dataTransfer", {
						value: {
							getData: (format: string) => {
								if (format === "application/reactflow") {
									return stencil.nodeType;
								}
								return "";
							},
							setData: () => {},
							effectAllowed: "move",
							dropEffect: "move",
						},
						writable: false,
					});

					// Dispatch the drop event on the flow canvas
					flowCanvas.dispatchEvent(syntheticDropEvent);
				} else {
					console.log("Touch drag ended outside ReactFlow canvas");
				}

				// Clean up event listeners
				document.removeEventListener("touchmove", handleTouchMoveGlobal);
				document.removeEventListener("touchend", handleTouchEndGlobal);

				isTouchDragging.current = false;
			};

			// Add global event listeners
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
			const touchDuration = Date.now() - touchStartTime.current;

			// Reset visual feedback
			const target = e.currentTarget as HTMLElement;
			target.style.transform = "";
			target.style.transition = "";

			// If it was a short touch and not a drag, treat as a tap
			if (!isTouchDragging.current && touchDuration < 200) {
				// Single tap - show hover state briefly
				setHovered(stencil);
				setTimeout(() => setHovered(null), 1000);
			}

			isTouchDragging.current = false;
		},
		[stencil, setHovered]
	);

	return (
		<div
			ref={setNodeRef}
			style={style}
			className="relative flex h-[70px] w-[70px] select-none items-center justify-center rounded border-2 bg-[var(--infra-sidebar-bg)] border-[var(--infra-sidebar-border)] text-[var(--infra-sidebar-text)] hover:bg-[var(--infra-sidebar-bg-hover)] transition-colors group cursor-pointer"
			title={keyboardShortcut ? `${stencil.label} (${keyboardShortcut})` : stencil.label}
			onDoubleClick={() => onDoubleClickCreate(stencil.nodeType)}
			onMouseEnter={() => setHovered(stencil)}
			onMouseLeave={() => setHovered(null)}
			onFocus={() => setHovered(stencil)}
			onBlur={() => setHovered(null)}
			onKeyDown={handleKeyFocus}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
			tabIndex={0}
		>
			<button
				{...attributes}
				{...listeners}
				type="button"
				title="Re-order"
				className="absolute left-1 top-1 h-3 w-3 cursor-grab text-[8px] text-[var(--infra-sidebar-text-secondary)] active:cursor-grabbing"
				draggable={false}
			>
				⦿
			</button>

			{showRemoveButton && onRemove && (
				<button
					type="button"
					title="Remove from custom section"
					onClick={(e) => {
						e.stopPropagation();
						onRemove(stencil.id);
					}}
					className="absolute right-1 top-1 h-3 w-3 cursor-pointer text-[12px] text-destructive hover:text-destructive/80
                      rounded-full flex items-center justify-center
                     opacity-0 group-hover:opacity-100 transition-opacity"
				>
					x
				</button>
			)}

			<div
				draggable
				onDragStart={(e) => onNativeDragStart(e, stencil.nodeType)}
				className="flex h-full w-full flex-col items-center justify-center text-center text-xs font-medium"
			>
				{renderLucideIcon(stencil.icon, "", 24)}
				<div className="mt-1 text-[10px] text-[var(--infra-sidebar-text-secondary)] leading-tight">
					{formatNodeLabel(stencil.label)}
				</div>
			</div>
		</div>
	);
};

SortableStencil.displayName = "SortableStencil";
