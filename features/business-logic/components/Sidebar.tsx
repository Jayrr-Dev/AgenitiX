'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

/* -------------------------------------------------------------------------- */
/*  TYPES                                                                     */
/* -------------------------------------------------------------------------- */

interface NodeStencil {
  id: string;          // unique id inside one sidebar
  nodeType: string;    // React-Flow node type
  label: string;       // rendered in the square
}

type SidebarVariant = 'a' | 'b' | 'c'

/* -------------------------------------------------------------------------- */
/*  PER-VARIANT TAB CONFIG & DEFAULT STENCILS                                 */
/* -------------------------------------------------------------------------- */

/** ✨ Tab keys & labels for Variant A (technical focus) */
const TAB_CONFIG_A = [
  { key: 'main',        label: 'Main'       },
  { key: 'marketing',   label: 'Marketing'  },
  { key: 'sales',       label: 'Sales'      },
  { key: 'operations',  label: 'Operations' },
] as const;
type TabKeyA = typeof TAB_CONFIG_A[number]['key'];

/** ✨ Tab keys & labels for Variant B (business focus) – *totally different if you like* */
const TAB_CONFIG_B = [
  { key: 'main',        label: 'Main'       },
  { key: 'strategy',    label: 'Strategy'   },
  { key: 'finance',     label: 'Finance'    },
  { key: 'people',      label: 'People'     },
] as const;
type TabKeyB = typeof TAB_CONFIG_B[number]['key'];


/** ✨ Tab keys & labels for Variant C (business focus) – *totally different if you like* */
const TAB_CONFIG_C = [
  { key: 'main',        label: 'Main'       },
  { key: 'customers',    label: 'Customers'   },
  { key: 'products',     label: 'Products'    },
  { key: 'leads',      label: 'Leads'     },
] as const;
type TabKeyC = typeof TAB_CONFIG_C[number]['key'];

/** Utility: type-safe “current tab key” for a given variant */
type TabKey<V extends SidebarVariant> = V extends 'a' ? TabKeyA : TabKeyB;

/** Default stencils – *keys must match the tab sets above* */
const DEFAULT_STENCILS_A: Record<TabKeyA, NodeStencil[]> = {
  main:       [{ id: 'a-main-1', nodeType: 'textUpdater', label: 'Text' }, { id: 'a-main-2', nodeType: 'textNode', label: 'Text' }, { id: 'a-main-3', nodeType: 'resultNode', label: 'Result' }],
  marketing:  [{ id: 'a-mkt-1',  nodeType: 'mkCampaign',  label: 'Campaign' }],
  sales:      [{ id: 'a-sale-1', nodeType: 'salesLead',   label: 'Lead' }],
  operations: [{ id: 'a-ops-1',  nodeType: 'opsTask',     label: 'Task' }],
};

const DEFAULT_STENCILS_B: Record<TabKeyB, NodeStencil[]> = {
  main:      [{ id: 'b-main-1', nodeType: 'goal',      label: 'Goal' }],
  strategy:  [{ id: 'b-str-1',  nodeType: 'initiative',label: 'Initiative' }],
  finance:   [{ id: 'b-fin-1',  nodeType: 'cost',      label: 'Cost' }],
  people:    [{ id: 'b-peo-1',  nodeType: 'talent',    label: 'Talent' }],
};

const DEFAULT_STENCILS_C: Record<TabKeyC, NodeStencil[]> = {
  main:      [{ id: 'c-main-1', nodeType: 'goal',      label: 'Goal' }],
  customers: [{ id: 'c-cust-1', nodeType: 'initiative',label: 'Initiative' }],
  products:  [{ id: 'c-prod-1', nodeType: 'cost',      label: 'Cost' }],
  leads:     [{ id: 'c-lead-1', nodeType: 'talent',    label: 'Talent' }],
};  

/** Bundle everything we need per variant in one object */
const VARIANT_CONFIG = {
  a: {
    tabs: TAB_CONFIG_A,
    defaults: DEFAULT_STENCILS_A,
  },
  b: {
    tabs: TAB_CONFIG_B,
    defaults: DEFAULT_STENCILS_B,
  },
  c: {
    tabs: TAB_CONFIG_C,
    defaults: DEFAULT_STENCILS_C,
  },
} satisfies Record<SidebarVariant, {
  tabs: readonly { key: string; label: string }[];
  defaults: Record<string, NodeStencil[]>;
}>;

/* -------------------------------------------------------------------------- */
/*  HOOKS                                                                     */
/* -------------------------------------------------------------------------- */

const STORAGE_PREFIX = 'sidebar-stencil-order';

function useDragSensors() {
  return useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
}

/** Load/save stencil order for *one* variant & tab */
function useStencilStorage<V extends SidebarVariant, K extends TabKey<V>>(
  variant: V,
  tab: K,
  defaults: NodeStencil[],
) {
  const key = `${STORAGE_PREFIX}-${variant}-${tab}`;

  const [stencils, setStencils] = useState<NodeStencil[]>(() => {
    if (typeof window === 'undefined') return defaults;
    try {
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? (JSON.parse(raw) as NodeStencil[]) : undefined;
      return parsed?.length ? parsed : defaults;
    } catch {
      return defaults;
    }
  });

  /** Persist whenever order changes */
  useEffect(() => {
    if (typeof window !== 'undefined')
      window.localStorage.setItem(key, JSON.stringify(stencils));
  }, [key, stencils]);

  return [stencils, setStencils] as const;
}

/* -------------------------------------------------------------------------- */
/*  PRIMITIVES                                                                */
/* -------------------------------------------------------------------------- */

interface SortableStencilProps {
  stencil: NodeStencil;
  onNativeDragStart: (e: React.DragEvent<HTMLDivElement>, nodeType: string) => void;
}

const SortableStencil: React.FC<SortableStencilProps> = React.memo(
  ({ stencil, onNativeDragStart }) => {
    const { setNodeRef, attributes, listeners, transform, transition } =
      useSortable({ id: stencil.id });

    const style: React.CSSProperties = {
      transform: CSS.Translate.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="relative flex h-[70px] w-[70px] select-none items-center justify-center rounded border bg-background text-xs hover:bg-stone-900 "
      >
        <button
          {...attributes}
          {...listeners}
          type="button"
          className="absolute left-1 top-1 h-3 w-3 cursor-grab text-[8px] text-gray-500 active:cursor-grabbing "
          title="Re-order"
          draggable={false}
        >
          ⦿
        </button>
        <div
          draggable
          onDragStart={(e) => onNativeDragStart(e, stencil.nodeType)}
          className="flex h-full w-full items-center justify-center text-center "
        >
          {stencil.label}
        </div>
      </div>
    );
  },
);
SortableStencil.displayName = 'SortableStencil';

interface StencilGridProps {
  stencils: NodeStencil[];
  setStencils: (s: NodeStencil[]) => void;
  onNativeDragStart: (e: React.DragEvent<HTMLDivElement>, nodeType: string) => void;
}

function StencilGrid({ stencils, setStencils, onNativeDragStart }: StencilGridProps) {
  const sensors = useDragSensors();

  const ids = useMemo(() => stencils.map((s) => s.id), [stencils]);

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      const { active, over } = e;
      if (!over || active.id === over.id) return;
      const oldIdx = stencils.findIndex((s) => s.id === active.id);
      const newIdx = stencils.findIndex((s) => s.id === over.id);
      setStencils(arrayMove(stencils, oldIdx, newIdx));
    },
    [stencils, setStencils],
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-5 grid-rows-3 gap-2">
          {stencils.map((s) => (
            <SortableStencil
              key={s.id}
              stencil={s}
              onNativeDragStart={onNativeDragStart}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

/* -------------------------------------------------------------------------- */
/*  SIDEBAR TABS                                                              */
/* -------------------------------------------------------------------------- */

interface SidebarTabsProps<V extends SidebarVariant> {
  variant: V;
  activeTab: TabKey<V>;
  onTabChange: (t: TabKey<V>) => void;
}

function SidebarTabs<V extends SidebarVariant>({
  variant,
  activeTab,
  onTabChange,
}: SidebarTabsProps<V>) {
  const { tabs, defaults } = VARIANT_CONFIG[variant];

  const handleNativeDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, nodeType: string) => {
      e.dataTransfer.setData('application/reactflow', nodeType);
      e.dataTransfer.effectAllowed = 'move';
    },
    [],
  );

  //Create a hide toggle button with an icon of a hidden eye
  const [hide, setHide] = useState(false);
  const toggleHide = () => {
    setHide(!hide);
  };    
  
  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as TabKey<V>)}>
      <aside className={`absolute bottom-0 right-0 z-30 h-[305px] w-[440px] border bg-background pl-6 pr-5 pt-2  ${hide ? 'hidden' : ''}`}>
        <TabsList className="bg-background mt-2">
          {tabs.map(({ key, label }) => (
            <TabsTrigger
              key={key}
              value={key}
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:brightness-110 rounded-sm px-4 mb-2 mr-2 -translate-x-1 "
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(({ key }) => {
          const [stencils, setStencils] = useStencilStorage(
            variant,
            key as TabKey<V>,
            defaults[key as keyof typeof defaults],
          );
          return (
            <TabsContent key={key} value={key} className="">
              <StencilGrid
                stencils={stencils}
                setStencils={setStencils}
                onNativeDragStart={handleNativeDragStart}
              />
            </TabsContent>
          );
        })}
      </aside>
      <button onClick={toggleHide} className="absolute bottom-0.5 right-1 z-40 ">
        {hide ? '⦾' : '⦿'}
      </button>
    </Tabs>
  );
}

/* -------------------------------------------------------------------------- */
/*  MAIN SIDEBAR                                                              */
/* -------------------------------------------------------------------------- */

export default function Sidebar({ className = '' }: { className?: string }) {
  const [variant, setVariant] = useState<SidebarVariant>('a');

  // each variant remembers its last-used tab
  const [tabA, setTabA] = useState<TabKey<'a'>>('main');
  const [tabB, setTabB] = useState<TabKey<'b'>>('main');
  const [tabC, setTabC] = useState<TabKey<'c'>>('main');
  const activeTab = variant === 'a' ? tabA : variant === 'b' ? tabB : tabC;
  const setActiveTab = variant === 'a' ? setTabA : variant === 'b' ? setTabB : setTabC;
  
  return (
    <div className={className}>
      {/* variant toggle */}
      <div className="absolute top-2 right-2 z-40 flex gap-2">
        {(['a', 'b', 'c'] as const).map((v) => (
          <button   
            key={v}
            onClick={() => setVariant(v)}
            className={`rounded px-3 py-1 text-sm transition-colors ${
              variant === v
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            {v.toUpperCase()}
          </button>
        ))}
      </div>

      {/* the actual tabs */}
      <SidebarTabs
        variant={variant}
        activeTab={activeTab as never}
        onTabChange={setActiveTab as never}
      />
    </div>
  );
}
