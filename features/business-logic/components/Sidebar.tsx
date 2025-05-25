/* -------------------------------------------------------------------------- */
/*  Sidebar.tsx – React-Flow stencil sidebar + hover panel                    */
/* -------------------------------------------------------------------------- */
'use client';

import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  type KeyboardEvent,
} from 'react';
import { useReactFlow } from '@xyflow/react';

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

import {
  StencilInfoPanel,
  HoveredStencil,
} from './StencilInfoPanel'; // <-- adjust path

/* -------------------------------------------------------------------------- */
/*  TYPES                                                                     */
/* -------------------------------------------------------------------------- */

export interface NodeStencil {
  id: string;
  nodeType: string;
  label: string;
  description: string;
}

type SidebarVariant = 'a' | 'b' | 'c';

/* -------------------------------------------------------------------------- */
/*  TAB CONFIG & DEFAULT STENCILS                                             */
/* -------------------------------------------------------------------------- */

const TAB_CONFIG_A = [
  { key: 'main', label: 'Main' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'sales', label: 'Sales' },
  { key: 'operations', label: 'Operations' },
] as const;
type TabKeyA = (typeof TAB_CONFIG_A)[number]['key'];

const TAB_CONFIG_B = [
  { key: 'main', label: 'Main' },
  { key: 'strategy', label: 'Strategy' },
  { key: 'finance', label: 'Finance' },
  { key: 'people', label: 'People' },
] as const;
type TabKeyB = (typeof TAB_CONFIG_B)[number]['key'];

const TAB_CONFIG_C = [
  { key: 'main', label: 'Main' },
  { key: 'customers', label: 'Customers' },
  { key: 'products', label: 'Products' },
  { key: 'leads', label: 'Leads' },
] as const;
type TabKeyC = (typeof TAB_CONFIG_C)[number]['key'];

type TabKey<V extends SidebarVariant> =
  V extends 'a' ? TabKeyA :
  V extends 'b' ? TabKeyB :
  TabKeyC;

/* --------------------- sample stencil data (trim as needed) --------------- */

const DEFAULT_STENCILS_A: Record<TabKeyA, NodeStencil[]> = {
  main: [
    { id: 'a-main-1', nodeType: 'textUpdater',  label: 'Text',      description: 'Editable text input.' },
    { id: 'a-main-2', nodeType: 'textNode',     label: 'Text',      description: 'Static text display.' },
    { id: 'a-main-3', nodeType: 'uppercaseNode',label: 'Uppercase', description: 'Converts text to UPPERCASE.' },
    { id: 'a-main-4', nodeType: 'output',       label: 'Output',    description: 'Shows the final result.' },
    { id: 'a-main-5', nodeType: 'triggerOnClick', label: 'Trigger', description: 'Blocks data flow until clicked, then allows data to pass.' },
    { id: 'a-main-6', nodeType: 'triggerOnPulse', label: 'Pulse Trigger', description: 'Sends a one-shot trigger pulse when clicked.' },
    { id: 'a-main-7', nodeType: 'triggerOnPulseCycle', label: 'Pulse Cycle Trigger', description: 'Flexible pulse trigger on a cycle.' },
    { id: 'a-main-8', nodeType: 'triggerOnToggle', label: 'Toggle Trigger', description: 'Simple boolean toggle trigger.' },
  ],
  marketing : [{ id: 'a-mkt-1', nodeType: 'mkCampaign', label: 'Campaign', description: 'Marketing campaign.' }],
  sales     : [{ id: 'a-sale-1',nodeType: 'salesLead',  label: 'Lead',     description: 'Sales lead tracker.' }],
  operations: [{ id: 'a-ops-1', nodeType: 'opsTask',    label: 'Task',     description: 'Operational task.' }],
};

const DEFAULT_STENCILS_B: Record<TabKeyB, NodeStencil[]> = {
  main    : [{ id: 'b-main-1', nodeType: 'goal',       label: 'Goal',       description: 'Business goal / OKR.' }],
  strategy: [{ id: 'b-str-1',  nodeType: 'initiative', label: 'Initiative', description: 'Strategic initiative.' }],
  finance : [{ id: 'b-fin-1',  nodeType: 'cost',       label: 'Cost',       description: 'Budget / cost centre.' }],
  people  : [{ id: 'b-peo-1',  nodeType: 'talent',     label: 'Talent',     description: 'People / HR node.' }],
};

const DEFAULT_STENCILS_C: Record<TabKeyC, NodeStencil[]> = {
  main     : [{ id: 'c-main-1', nodeType: 'goal',     label: 'Goal',       description: 'Customer-centric goal.' }],
  customers: [{ id: 'c-cust-1',nodeType: 'customer', label: 'Customer',   description: 'Represents a customer.' }],
  products : [{ id: 'c-prod-1',nodeType: 'product',  label: 'Product',    description: 'Product / feature.' }],
  leads    : [{ id: 'c-lead-1',nodeType: 'lead',     label: 'Lead',       description: 'Potential lead.' }],
};

const VARIANT_CONFIG = {
  a: { tabs: TAB_CONFIG_A, defaults: DEFAULT_STENCILS_A },
  b: { tabs: TAB_CONFIG_B, defaults: DEFAULT_STENCILS_B },
  c: { tabs: TAB_CONFIG_C, defaults: DEFAULT_STENCILS_C },
} satisfies Record<SidebarVariant, {
  tabs: readonly { key: string; label: string }[];
  defaults: Record<string, NodeStencil[]>;
}>;

/* -------------------------------------------------------------------------- */
/*  HOOKS                                                                     */
/* -------------------------------------------------------------------------- */

const STORAGE_PREFIX = 'sidebar-stencil-order';

function useDragSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );
}

function useStencilStorage<
  V extends SidebarVariant,
  K extends TabKey<V>
>(variant: V, tab: K, defaults: NodeStencil[]) {
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
  onDoubleClickCreate: (nodeType: string) => void;
  setHovered: (s: HoveredStencil | null) => void;
}

const SortableStencil: React.FC<SortableStencilProps> = React.memo(
  ({ stencil, onNativeDragStart, onDoubleClickCreate, setHovered }) => {
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
        className="relative flex h-[70px] w-[70px] select-none items-center justify-center rounded border bg-background text-xs hover:bg-stone-900"
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

interface StencilGridProps {
  stencils: NodeStencil[];
  setStencils: (s: NodeStencil[]) => void;
  onNativeDragStart: (e: React.DragEvent<HTMLDivElement>, nodeType: string) => void;
  onDoubleClickCreate: (nodeType: string) => void;
  setHovered: (s: HoveredStencil | null) => void;
}

function StencilGrid({
  stencils,
  setStencils,
  onNativeDragStart,
  onDoubleClickCreate,
  setHovered,
}: StencilGridProps) {
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
        <div className="grid grid-cols-5 grid-rows-2 gap-2">
          {stencils.map((s) => (
            <SortableStencil
              key={s.id}
              stencil={s}
              onNativeDragStart={onNativeDragStart}
              onDoubleClickCreate={onDoubleClickCreate}
              setHovered={setHovered}
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
  onDoubleClickCreate: (nodeType: string) => void;
  hide: boolean;
  toggleHide: () => void;
}

function SidebarTabs<V extends SidebarVariant>({
  variant,
  activeTab,
  onTabChange,
  onDoubleClickCreate,
  hide,
  toggleHide,
}: SidebarTabsProps<V>) {
  const { tabs, defaults } = VARIANT_CONFIG[variant];
  const [hovered, setHovered] = useState<HoveredStencil | null>(null);

  const handleNativeDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, nodeType: string) => {
      e.dataTransfer.setData('application/reactflow', nodeType);
      e.dataTransfer.effectAllowed = 'move';
    },
    [],
  );

  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as TabKey<V>)}>
      <aside
        className={`absolute bottom-0 right-0 z-30 h-[225px] w-[440px] border bg-background pl-6 pr-5 pt-2 ${
          hide ? 'hidden' : ''
        }`}
      >
        {/*  Hover panel (independent component) */}
        <StencilInfoPanel stencil={hovered} />

        {/*  Tab headers  */}
        <TabsList className="bg-background">
          {tabs.map(({ key, label }) => (
            <TabsTrigger
              key={key}
              value={key}
              className="mb-2 mr-2 -translate-x-1 rounded-sm px-4 data-[state=active]:bg-white data-[state=active]:brightness-110 dark:data-[state=active]:bg-gray-700"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/*  Per-tab stencil grids  */}
        {tabs.map(({ key }) => {
          const [stencils, setStencils] = useStencilStorage(
            variant,
            key as TabKey<V>,
            defaults[key as keyof typeof defaults],
          );
          return (
            <TabsContent key={key} value={key}>
              <StencilGrid
                stencils={stencils}
                setStencils={setStencils}
                onNativeDragStart={handleNativeDragStart}
                onDoubleClickCreate={onDoubleClickCreate}
                setHovered={setHovered}
              />
            </TabsContent>
          );
        })}
      </aside>

      {/*  Hide-toggle  */}
      <button onClick={toggleHide} className="absolute bottom-0.5 right-1 z-40">
        {hide ? '⦾' : '⦿'}
      </button>
    </Tabs>
  );
}

/* -------------------------------------------------------------------------- */
/*  MAIN SIDEBAR COMPONENT                                                    */
/* -------------------------------------------------------------------------- */

export default function Sidebar({ className = '' }: { className?: string }) {
  const [hide, setHide] = useState(false);
  const toggleHide = () => setHide((h) => !h);

  const [variant, setVariant] = useState<SidebarVariant>('a');
  const [tabA, setTabA] = useState<TabKey<'a'>>('main');
  const [tabB, setTabB] = useState<TabKey<'b'>>('main');
  const [tabC, setTabC] = useState<TabKey<'c'>>('main');

  const activeTab = variant === 'a' ? tabA : variant === 'b' ? tabB : tabC;
  const setActiveTab =
    variant === 'a' ? setTabA : variant === 'b' ? setTabB : setTabC;

  const { addNodes } = useReactFlow();
  const handleCreateNode = useCallback(
    (nodeType: string) => {
      addNodes({
        id: `${nodeType}-${Date.now()}`,
        type: nodeType,
        position: { x: 100, y: 100 },
        data: {},
      });
    },
    [addNodes],
  );

  return (
    <div className={className}>
      {/*  ABC variant selector  */}
      <div className={`absolute bottom-58 right-2 z-40 flex gap-2 ${hide ? 'hidden' : ''}`}>
        {(['a', 'b', 'c'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setVariant(v)}
            className={`rounded px-3 py-1 text-sm transition-colors ${
              variant === v ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            {v.toUpperCase()}
          </button>
        ))}
      </div>

      {/*  Sidebar tabs  */}
      <SidebarTabs
        variant={variant}
        activeTab={activeTab as never}
        onTabChange={setActiveTab as never}
        onDoubleClickCreate={handleCreateNode}
        hide={hide}
        toggleHide={toggleHide}
      />
    </div>
  );
}
