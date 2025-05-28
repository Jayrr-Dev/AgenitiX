import React, { type KeyboardEvent } from 'react';
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

    const style: React.CSSProperties = {
      transform: CSS.Translate.toString(transform),
      transition,
    };

    const handleKeyFocus = (e: KeyboardEvent<HTMLDivElement>) => {
      if (['Enter', ' '].includes(e.key)) {
        setHovered(stencil);
      }
    };

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