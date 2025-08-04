import { TabsContent } from "@/components/ui/tabs";
import { DndContext, type DragEndEvent, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import React, { memo, useCallback, useMemo } from "react";
import { SortableStencil } from "../SortableStencil";
import { StencilGrid } from "../StencilGrid";
import type { HoveredStencil } from "../StencilInfoPanel";
import { VARIANT_CONFIG } from "../constants";
import { useDragSensors } from "../hooks/useDragSensors";
import { useFilteredNodes } from "../hooks/useFilteredNodes";
import { useStencilStorage } from "../hooks/useStencilStorage";
import type { NodeStencil, SidebarVariant, TabKey } from "../types";
import { AddNodeButton } from "./AddNodeButton";

interface TabContentProps {
  variant: SidebarVariant;
  tabKey: string;
  onNativeDragStart: (
    e: React.DragEvent<HTMLDivElement>,
    nodeType: string
  ) => void;
  onDoubleClickCreate: (nodeType: string) => void;
  setHovered: (s: HoveredStencil | null) => void;
  // Custom tab props
  isCustomTab?: boolean;
  customNodes?: NodeStencil[];
  onAddCustomNode?: () => void;
  onRemoveCustomNode?: (nodeId: string) => void;
  onReorderCustomNodes?: (newOrder: NodeStencil[]) => void;
  // Callback to notify parent of stencil changes
  onStencilsChange?: (tabKey: string, stencils: NodeStencil[]) => void;
  isReadOnly?: boolean;
}

const SidebarTabContentComponent: React.FC<TabContentProps> = ({
  variant,
  tabKey,
  onNativeDragStart,
  onDoubleClickCreate,
  setHovered,
  isCustomTab = false,
  customNodes = [],
  onAddCustomNode,
  onRemoveCustomNode,
  onReorderCustomNodes,
  onStencilsChange,
  isReadOnly = false,
}) => {
  // Memoized variant config lookup to prevent recalculation on every render
  const variantConfig = useMemo(() => {
    const normalizedVariant = variant.toUpperCase() as SidebarVariant;
    return VARIANT_CONFIG[normalizedVariant];
  }, [variant]);

  const stencilsConfig = variantConfig?.stencils;
  const sensors = useDragSensors();

  // Memoized keyboard shortcut mapping - prevents object recreation on every render
  const keyboardShortcutMaps = useMemo(() => {
    const customGridKeyMap: Record<number, string> = {
      // Row 1: wert (positions 0-3, shifted from qwer)
      0: "W",
      1: "E",
      2: "R",
      3: "T",
      // Row 2: asdfg (positions 4-8, shifted from asdg)
      4: "A",
      5: "S",
      6: "D",
      7: "F",
      8: "G",
      // Row 3: zxcvb (positions 9-13, shifted from zxcv)
      9: "Z",
      10: "X",
      11: "C",
      12: "V",
      13: "B",
    };

    const regularGridKeyMap: Record<number, string> = {
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

    return { custom: customGridKeyMap, regular: regularGridKeyMap };
  }, []);

  // KEYBOARD SHORTCUT MAPPING - Optimized to use pre-computed maps
  const getKeyboardShortcut = useCallback(
    (index: number): string => {
      const keyMap = isCustomTab
        ? keyboardShortcutMaps.custom
        : keyboardShortcutMaps.regular;
      return keyMap[index] || "";
    },
    [isCustomTab, keyboardShortcutMaps]
  );

  // Memoized default stencils to prevent function recreation on every render
  const getDefaultStencils = useCallback((): NodeStencil[] => {
    if (isCustomTab) {
      return [];
    }

    // Safely access the stencils with proper type checking
    if (!stencilsConfig) {
      console.warn(`No stencils config found for variant '${variant}'`);
      return [];
    }

    const tabStencils = stencilsConfig[tabKey as keyof typeof stencilsConfig];
    if (!Array.isArray(tabStencils)) {
      console.warn(
        `No stencils found for tab '${tabKey}' in variant '${variant}'`
      );
      return [];
    }

    return tabStencils;
  }, [isCustomTab, stencilsConfig, tabKey, variant]);

  // Conditionally use stencil storage for better performance, basically avoid unnecessary hook calls
  const stencilStorageResult = useStencilStorage(
    variant,
    tabKey as TabKey<typeof variant>,
    getDefaultStencils()
  );
  const [stencils, setStencils] = isCustomTab
    ? [[], () => {}]
    : stencilStorageResult;

  // Use filtered nodes hook to respect feature flags
  const { nodes: filteredNodes } = useFilteredNodes();

  // Memoized filtered node types for efficient comparison, basically O(1) lookups for feature flags
  const filteredNodeTypes = useMemo(() => {
    return new Set(filteredNodes.map((node) => node.kind));
  }, [filteredNodes]);

  // Highly optimized stencil filtering with minimal allocations, basically prevent unnecessary operations
  const filteredStencils = useMemo(() => {
    // Early returns for performance, basically avoid all processing when possible
    if (isCustomTab || !stencils.length || !filteredNodeTypes.size) {
      return [];
    }

    // Pre-allocate array for better memory performance, basically reduce allocations
    const result: typeof stencils = [];

    // Use faster iteration pattern with direct property access, basically optimize inner loop
    for (let i = 0, len = stencils.length; i < len; i++) {
      const stencil = stencils[i];
      if (filteredNodeTypes.has(stencil.nodeType)) {
        result[result.length] = stencil; // Faster than push()
      }
    }

    return result;
  }, [stencils, filteredNodeTypes, isCustomTab]);

  // Notify parent of stencil changes for keyboard shortcuts (use filtered stencils)
  React.useEffect(() => {
    if (!isCustomTab && onStencilsChange) {
      onStencilsChange(tabKey, filteredStencils);
    }
  }, [filteredStencils, tabKey, onStencilsChange, isCustomTab]);

  // Optimized drag end handler with Map-based lookups, basically faster index finding
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (
        !over ||
        active.id === over.id ||
        !isCustomTab ||
        !onReorderCustomNodes
      ) {
        return;
      }

      // Use Map for O(1) lookup instead of findIndex O(n), basically faster performance
      const idToIndexMap = new Map(
        customNodes.map((node, index) => [node.id, index])
      );
      const oldIndex = idToIndexMap.get(active.id as string);
      const newIndex = idToIndexMap.get(over.id as string);

      if (oldIndex !== undefined && newIndex !== undefined) {
        const newOrder = arrayMove(customNodes, oldIndex, newIndex);
        onReorderCustomNodes(newOrder);
      }
    },
    [isCustomTab, onReorderCustomNodes, customNodes]
  );

  // Memoized node IDs for drag and drop performance, basically prevent array recreation
  const nodeIds = useMemo(
    () => customNodes.map((node) => node.id),
    [customNodes]
  );

  if (isCustomTab) {
    return (
      <TabsContent value={tabKey}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={nodeIds} strategy={rectSortingStrategy}>
            <div className="flex flex-wrap justify-evenly gap-2 bg-[var(--infra-sidebar-bg)] sm:mx-auto sm:grid sm:grid-cols-5 sm:grid-rows-2 sm:justify-items-center">
              {/* Add Node Button as first item in grid */}
              <div className="flex items-center justify-center">
                <AddNodeButton
                  onClick={
                    isReadOnly ? () => {} : onAddCustomNode || (() => {})
                  }
                  title={isReadOnly ? "Read-only mode" : "Add Node (Q)"}
                  disabled={isReadOnly}
                />
              </div>

              {/* Custom nodes - now sortable */}
              {customNodes.map((stencil, index) => (
                <SortableStencil
                  key={stencil.id}
                  stencil={stencil}
                  onNativeDragStart={onNativeDragStart}
                  onDoubleClickCreate={onDoubleClickCreate}
                  setHovered={setHovered}
                  onRemove={onRemoveCustomNode}
                  showRemoveButton={true}
                  keyboardShortcut={getKeyboardShortcut(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </TabsContent>
    );
  }

  return (
    <TabsContent value={tabKey}>
      <StencilGrid
        stencils={filteredStencils}
        setStencils={setStencils}
        onNativeDragStart={onNativeDragStart}
        onDoubleClickCreate={onDoubleClickCreate}
        setHovered={setHovered}
        getKeyboardShortcut={getKeyboardShortcut}
        isReadOnly={isReadOnly}
      />
    </TabsContent>
  );
};

// Export memoized component for better performance, basically prevent unnecessary re-renders
export const SidebarTabContent = memo(
  SidebarTabContentComponent,
  (prev, next) => {
    // Custom comparison for optimal re-render control, basically precise change detection
    return (
      prev.variant === next.variant &&
      prev.tabKey === next.tabKey &&
      prev.isCustomTab === next.isCustomTab &&
      prev.onNativeDragStart === next.onNativeDragStart &&
      prev.onDoubleClickCreate === next.onDoubleClickCreate &&
      prev.setHovered === next.setHovered &&
      prev.onAddCustomNode === next.onAddCustomNode &&
      prev.onRemoveCustomNode === next.onRemoveCustomNode &&
      prev.onReorderCustomNodes === next.onReorderCustomNodes &&
      prev.onStencilsChange === next.onStencilsChange &&
      prev.isReadOnly === next.isReadOnly &&
      // Deep compare custom nodes array for changes
      prev.customNodes === next.customNodes
    );
  }
);
