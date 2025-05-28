import React, { type KeyboardEvent, useRef, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { NodeStencil } from './types';
import { HoveredStencil } from '../StencilInfoPanel';

interface SortableStencilProps {
  stencil: NodeStencil;
  onNativeDragStart: (e: React.DragEvent<HTMLDivElement>, nodeType: string) => void;
  onDoubleClickCreate: (nodeType: string) => void;
  setHovered: (s: HoveredStencil | null) => void;
  onRemove?: (stencilId: string) => void;
  showRemoveButton?: boolean;
}

export const SortableStencil = React.memo<SortableStencilProps>(
  ({ stencil, onNativeDragStart, onDoubleClickCreate, setHovered, onRemove, showRemoveButton = false }) => {
    const { setNodeRef, attributes, listeners, transform, transition } =
      useSortable({ id: stencil.id });

    // Touch handling refs and state
    const touchStartTime = useRef<number>(0);
    const touchStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const lastTapTime = useRef<number>(0);
    const isDragging = useRef<boolean>(false);

    const style: React.CSSProperties = {
      transform: CSS.Translate.toString(transform),
      transition,
      touchAction: 'none',
    };

    const handleKeyFocus = (e: KeyboardEvent<HTMLDivElement>) => {
      if (['Enter', ' '].includes(e.key)) {
        setHovered(stencil);
      }
    };

    // Touch event handlers
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
      console.log('Touch start on stencil:', stencil.label);
      const touch = e.touches[0];
      touchStartTime.current = Date.now();
      touchStartPos.current = { x: touch.clientX, y: touch.clientY };
      isDragging.current = false;
      
      // Check for double tap
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTime.current;
      if (timeSinceLastTap < 400 && timeSinceLastTap > 50) { // 400ms double tap threshold, min 50ms to avoid accidental
        console.log('Double tap detected, creating node:', stencil.nodeType);
        e.preventDefault();
        e.stopPropagation();
        onDoubleClickCreate(stencil.nodeType);
        return;
      }
      lastTapTime.current = now;
      
      // Add visual feedback for touch start
      const target = e.currentTarget as HTMLElement;
      target.style.transform = 'scale(0.95)';
      target.style.transition = 'transform 0.1s ease';
    }, [stencil.nodeType, stencil.label, onDoubleClickCreate]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // If moved more than 10px, consider it a drag
      if (distance > 10 && !isDragging.current) {
        console.log('Touch drag started for:', stencil.label);
        isDragging.current = true;
        e.preventDefault();
        
        // Start touch drag simulation
        startTouchDrag(touch, e.currentTarget);
      }
    }, [stencil.nodeType, stencil.label]);

    const startTouchDrag = useCallback((touch: React.Touch, element: EventTarget) => {
      console.log('Starting touch drag simulation for:', stencil.label);
      // Create a visual drag preview
      const dragPreview = document.createElement('div');
      dragPreview.textContent = stencil.label;
      dragPreview.className = 'fixed z-50 pointer-events-none bg-blue-500 text-white px-2 py-1 rounded text-xs';
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
        console.log('Touch drag ended');
        
        // Remove the drag preview
        if (dragPreview && dragPreview.parentNode) {
          dragPreview.parentNode.removeChild(dragPreview);
        }

        // Find the drop target
        const lastTouch = e.changedTouches[0];
        const dropTarget = document.elementFromPoint(lastTouch.clientX, lastTouch.clientY);
        
        // Check if we're dropping on the ReactFlow canvas
        const flowCanvas = dropTarget?.closest('.react-flow');
        if (flowCanvas) {
          console.log('Dropping on ReactFlow canvas, creating node:', stencil.nodeType);
          // Create a synthetic drop event
          const syntheticDropEvent = new DragEvent('drop', {
            bubbles: true,
            cancelable: true,
            clientX: lastTouch.clientX,
            clientY: lastTouch.clientY,
          });

          // Create a DataTransfer object and set the node type
          Object.defineProperty(syntheticDropEvent, 'dataTransfer', {
            value: {
              getData: (format: string) => {
                if (format === 'application/reactflow') {
                  return stencil.nodeType;
                }
                return '';
              },
              setData: () => {},
              effectAllowed: 'move',
              dropEffect: 'move',
            },
            writable: false,
          });

          // Dispatch the drop event on the flow canvas
          flowCanvas.dispatchEvent(syntheticDropEvent);
        } else {
          console.log('Touch drag ended outside ReactFlow canvas');
        }

        // Clean up event listeners
        document.removeEventListener('touchmove', handleTouchMoveGlobal);
        document.removeEventListener('touchend', handleTouchEndGlobal);
        
        isDragging.current = false;
      };

      // Add global event listeners
      document.addEventListener('touchmove', handleTouchMoveGlobal, { passive: false });
      document.addEventListener('touchend', handleTouchEndGlobal, { passive: false });
    }, [stencil.nodeType, stencil.label]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
      const touchDuration = Date.now() - touchStartTime.current;
      
      // Reset visual feedback
      const target = e.currentTarget as HTMLElement;
      target.style.transform = '';
      target.style.transition = '';
      
      // If it was a short touch and not a drag, treat as a tap
      if (!isDragging.current && touchDuration < 200) {
        // Single tap - show hover state briefly
        setHovered(stencil);
        setTimeout(() => setHovered(null), 1000);
      }
      
      isDragging.current = false;
    }, [stencil, setHovered]);

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="relative flex h-[70px] w-[70px] select-none items-center justify-center rounded border bg-background text-xs hover:bg-stone-900 group"
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
          className="absolute left-1 top-1 h-3 w-3 cursor-grab text-[8px] text-gray-500 active:cursor-grabbing"
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
            className="absolute right-1 top-1 h-3 w-3 cursor-pointer text-[12px] text-red-500 hover:text-red-700 
                        rounded-full flex items-center justify-center
                       opacity-0 group-hover:opacity-100 transition-opacity"
          >
            x
          </button>
        )}

        <div
          draggable
          onDragStart={(e) => onNativeDragStart(e, stencil.nodeType)}
          className="flex h-full w-full items-center justify-center text-center"
        >
          {stencil.label}
        </div>
      </div>
    );
  },
);

SortableStencil.displayName = 'SortableStencil'; 