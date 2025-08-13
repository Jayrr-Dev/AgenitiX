import { DndContext, type DragEndEvent, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import type React from "react";
import { memo, useCallback, useMemo } from "react";
import { SortableStencil } from "./SortableStencil";
import type { HoveredStencil } from "./StencilInfoPanel";
import { useDragSensors } from "./hooks/useDragSensors";
import type { NodeStencil } from "./types";

// Pre-defined grid styles for performance, basically prevent className recreation
const GRID_STYLES =
  "flex flex-wrap justify-evenly gap-2.5 sm:mx-auto sm:grid sm:grid-cols-5 sm:grid-rows-2 sm:justify-items-center";

interface StencilGridProps {
  stencils: NodeStencil[];
  setStencils: (s: NodeStencil[]) => void;
  onNativeDragStart: (
    e: React.DragEvent<HTMLDivElement>,
    nodeType: string
  ) => void;
  onDoubleClickCreate: (nodeType: string) => void;
  setHovered: (s: HoveredStencil | null) => void;
  onRemoveStencil?: (stencilId: string) => void;
  showRemoveButtons?: boolean;
  getKeyboardShortcut?: (index: number) => string;
  isReadOnly?: boolean;
}

// Pre-computed keyboard shortcut mapping for better performance, basically avoid object recreation
const GRID_KEYBOARD_MAP: Record<number, string> = {
  // Row 1: qwert (positions 0-4)
  0: "Q",
  1: "W",
  2: "E",
  3: "R",
  4: "T",
  // Row 2: asdfg (positions 5-9)
  5: "A",
  6: "S",
  7: "D",
  8: "F",
  9: "G",
  // Row 3: zxcvb (positions 10-14)
  10: "Z",
  11: "X",
  12: "C",
  13: "V",
  14: "B",
} as const;

const StencilGridComponent = ({
  stencils,
  setStencils,
  onNativeDragStart,
  onDoubleClickCreate,
  setHovered,
  onRemoveStencil,
  showRemoveButtons = false,
  getKeyboardShortcut,
  isReadOnly = false,
}: StencilGridProps) => {
  const sensors = useDragSensors();

  // Optimized IDs computation with stable reference, basically prevent array recreation when stencils unchanged
  const ids = useMemo(() => stencils.map((s) => s.id), [stencils]);

  // Memoized fallback keyboard shortcut function, basically prevent function recreation
  const fallbackKeyboardShortcut = useCallback((index: number): string => {
    return GRID_KEYBOARD_MAP[index] || "";
  }, []);

  // Optimized drag end handler with better memoization, basically prevent handler recreation
  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      const { active, over } = e;
      if (!over || active.id === over.id) {
        return;
      }

      // Use Map for O(1) lookup instead of findIndex O(n), basically faster position finding
      const idToIndexMap = new Map(stencils.map((s, i) => [s.id, i]));
      const oldIdx = idToIndexMap.get(active.id as string);
      const newIdx = idToIndexMap.get(over.id as string);

      if (oldIdx !== undefined && newIdx !== undefined) {
        setStencils(arrayMove(stencils, oldIdx, newIdx));
      }
    },
    [stencils, setStencils]
  );

  // Memoized stencil elements to prevent unnecessary re-renders, basically stable component references
  const stencilElements = useMemo(
    () =>
      stencils.map((stencil, index) => (
        <SortableStencil
          key={stencil.id}
          stencil={stencil}
          onNativeDragStart={onNativeDragStart}
          onDoubleClickCreate={onDoubleClickCreate}
          setHovered={setHovered}
          onRemove={onRemoveStencil}
          showRemoveButton={showRemoveButtons}
          keyboardShortcut={
            getKeyboardShortcut?.(index) || fallbackKeyboardShortcut(index)
          }
          isReadOnly={isReadOnly}
        />
      )),
    [
      stencils,
      onNativeDragStart,
      onDoubleClickCreate,
      setHovered,
      onRemoveStencil,
      showRemoveButtons,
      getKeyboardShortcut,
      fallbackKeyboardShortcut,
      isReadOnly,
    ]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className={GRID_STYLES}>{stencilElements}</div>
      </SortableContext>
    </DndContext>
  );
};

// Export memoized component with custom comparison for better performance
export const StencilGrid = memo(StencilGridComponent, (prev, next) => {
  // Only re-render if stencils array or key props change, basically prevent unnecessary re-renders
  return (
    prev.stencils === next.stencils &&
    prev.setStencils === next.setStencils &&
    prev.onNativeDragStart === next.onNativeDragStart &&
    prev.onDoubleClickCreate === next.onDoubleClickCreate &&
    prev.setHovered === next.setHovered &&
    prev.onRemoveStencil === next.onRemoveStencil &&
    prev.showRemoveButtons === next.showRemoveButtons &&
    prev.getKeyboardShortcut === next.getKeyboardShortcut &&
    prev.isReadOnly === next.isReadOnly
  );
});
