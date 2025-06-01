import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import React, { useCallback, useMemo } from "react";
import { HoveredStencil } from "../components/StencilInfoPanel";
import { SortableStencil } from "./SortableStencil";
import { useDragSensors } from "./hooks/useDragSensors";
import { NodeStencil } from "./types";

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
}

export function StencilGrid({
  stencils,
  setStencils,
  onNativeDragStart,
  onDoubleClickCreate,
  setHovered,
  onRemoveStencil,
  showRemoveButtons = false,
  getKeyboardShortcut,
}: StencilGridProps) {
  const sensors = useDragSensors();
  const ids = useMemo(() => stencils.map((s) => s.id), [stencils]);

  // KEYBOARD SHORTCUT MAPPING - QWERTY grid positions to keys
  const fallbackKeyboardShortcut = useCallback((index: number): string => {
    const gridKeyMap: Record<number, string> = {
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
    };
    return gridKeyMap[index] || "";
  }, []);

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      const { active, over } = e;
      if (!over || active.id === over.id) return;

      const oldIdx = stencils.findIndex((s) => s.id === active.id);
      const newIdx = stencils.findIndex((s) => s.id === over.id);
      setStencils(arrayMove(stencils, oldIdx, newIdx));
    },
    [stencils, setStencils]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className="flex flex-wrap justify-evenly gap-2 sm:grid sm:grid-cols-5 sm:grid-rows-2 sm:justify-items-center sm:mx-auto">
          {stencils.map((stencil, index) => (
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
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
