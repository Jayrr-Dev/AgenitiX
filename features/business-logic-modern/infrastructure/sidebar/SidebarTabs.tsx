/**
 * INFRASTRUCTURE SIDEBAR TABS - Optimized tab rendering for performance
 *
 * • Renders only the active tab content to avoid mounting hidden tabs
 * • Preserves keyboard shortcuts and search overlays
 * • Uses stable top-level constants and memoization to minimize re-work
 * • Single keydown listener with refs (prevents frequent detach/attach)
 *
 * Keywords: sidebar, tabs, performance, lazy-render, shadcn, radix
 */
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import type React from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type HoveredStencil, StencilInfoPanel } from "./StencilInfoPanel";
import { NodeSearchModal } from "./components/NodeSearchModal";
import { SearchBar } from "./components/SearchBar";
import { SidebarTabContent } from "./components/SidebarTabContent";
import { VARIANT_CONFIG } from "./constants";
import type { NodeStencil, SidebarVariant } from "./types";

// Top-level constants for better performance, basically prevent recreation on every render
const KEY_REPEAT_COOLDOWN = 150; // 150ms cooldown between same key presses
const SIDEBAR_STYLES =
  "absolute right-4 bottom-4 z-30 h-[200px] w-full rounded-lg border border-[var(--infra-sidebar-border)] bg-[var(--infra-sidebar-bg)] pt-2 pr-3 pl-3 shadow-lg transition-all duration-300 ease-in-out sm:h-[280px] sm:w-[400px] sm:pr-5 sm:pl-6 lg:w-[450px]";
const TABS_LIST_STYLES =
  "scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent w-full flex-nowrap items-stretch justify-start gap-1 overflow-x-auto border-0 border-[var(--infra-sidebar-border)] bg-[var(--infra-sidebar-bg)]";
const TAB_TRIGGER_STYLES =
  "rounded border border-transparent px-3 py-2 text-[var(--infra-sidebar-text)] transition-colors hover:border-[var(--infra-sidebar-border-hover)] hover:bg-[var(--infra-sidebar-bg-hover)] data-[state=active]:bg-[var(--infra-sidebar-bg-active)] data-[state=active]:text-[var(--infra-sidebar-text)]";
const SEARCH_BUTTON_STYLES =
  "mr-1 flex items-center gap-1 rounded border border-transparent p-2 text-[var(--infra-sidebar-text)] transition-colors hover:border-[var(--infra-sidebar-border-hover)] hover:bg-[var(--infra-sidebar-bg-hover)]";
const CONTENT_AREA_STYLES =
  "scrollbar max-h-[150px] overflow-y-auto border-0 bg-[var(--infra-sidebar-bg)] pb-2 sm:max-h-[230px]";

// Pre-computed keyboard mappings for performance, basically avoid object recreation
const VARIANT_MAP: Record<string, SidebarVariant> = {
  "1": "A",
  "2": "B",
  "3": "C",
  "4": "D",
} as const;

const NODE_CREATION_KEYS = [
  "q",
  "w",
  "e",
  "r",
  "t",
  "array",
  "string",
  "d",
  "f",
  "g",
  "z",
  "any",
  "c",
  "v",
  "boolean",
] as const;

const CUSTOM_GRID_KEY_MAP: Record<string, number> = {
  w: 0,
  e: 1,
  r: 2,
  t: 3,
  a: 4,
  s: 5,
  d: 6,
  f: 7,
  g: 8,
  z: 9,
  x: 10,
  c: 11,
  v: 12,
  b: 13,
} as const;

const REGULAR_GRID_KEY_MAP: Record<string, number> = {
  q: 0,
  w: 1,
  e: 2,
  r: 3,
  t: 4,
  a: 5,
  s: 6,
  d: 7,
  f: 8,
  g: 9,
  z: 10,
  x: 11,
  c: 12,
  v: 13,
  b: 14,
} as const;
interface SidebarTabsProps {
  variant: SidebarVariant;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onDoubleClickCreate: (nodeType: string) => void;
  isHidden: boolean;
  customNodes: NodeStencil[];
  onAddCustomNode: (node: NodeStencil) => void;
  onRemoveCustomNode: (nodeId: string) => void;
  onReorderCustomNodes: (newOrder: NodeStencil[]) => void;
  onVariantChange: (variant: SidebarVariant) => void;
  onToggle: () => void;
  isReadOnly?: boolean;
}

function SidebarTabsComponent({
  variant,
  activeTab,
  onTabChange,
  onDoubleClickCreate,
  isHidden,
  customNodes,
  onAddCustomNode,
  onRemoveCustomNode,
  onReorderCustomNodes,
  onVariantChange,
  onToggle: _onToggle,
  isReadOnly = false,
}: SidebarTabsProps) {
  // IMPROVED VARIANT HANDLING - More defensive programming
  const normalizedVariant = (
    typeof variant === "string"
      ? variant.toUpperCase()
      : String(variant).toUpperCase()
  ) as SidebarVariant;
  const variantConfig = VARIANT_CONFIG[normalizedVariant];

  // ROBUST FALLBACK LOGIC - Handle multiple failure cases
  const tabs = useMemo(() => {
    if (variantConfig?.tabs) {
      return variantConfig.tabs;
    }

    console.warn(
      `Invalid variant '${variant}' (normalized to '${normalizedVariant}') - not found in VARIANT_CONFIG. Available variants:`,
      Object.keys(VARIANT_CONFIG)
    );

    // Try fallback variants in order of preference
    const fallbackVariants: SidebarVariant[] = ["A", "B", "C", "D"];
    for (const fallbackVariant of fallbackVariants) {
      const fallbackConfig = VARIANT_CONFIG[fallbackVariant];
      if (fallbackConfig?.tabs) {
        console.warn(`Using fallback variant '${fallbackVariant}'`);
        return fallbackConfig.tabs;
      }
    }

    // Ultimate fallback - empty array
    console.error(
      "No valid variant configurations found! Using empty tabs array."
    );
    return [];
  }, [variant, normalizedVariant, variantConfig]);

  // Removed theme hooks - using semantic tokens directly

  // CONSOLIDATED STATE MANAGEMENT
  const [uiState, setUiState] = useState({
    hovered: null as HoveredStencil | null,
    isSearchModalOpen: false,
    isSearchVisible: false,
  });

  // Store current stencils for keyboard shortcuts
  const currentStencilsRef = useRef<Record<string, NodeStencil[]>>({});

  // Optimized key throttling with stable reference, basically prevent Map recreation
  const keyThrottleRef = useRef<Map<string, number>>(new Map());

  // Memoized existing node types for efficient duplicate checking, basically O(1) lookups
  const existingCustomNodeTypes = useMemo(
    () => new Set(customNodes.map((node) => node.nodeType)),
    [customNodes]
  );

  // IMPROVED DRAG START HANDLER
  const handleNativeDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, nodeType: string) => {
      e.dataTransfer.setData("application/reactflow", nodeType);
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  // IMPROVED STENCIL UPDATE CALLBACK
  const updateTabStencils = useCallback(
    (tabKey: string, stencils: NodeStencil[]) => {
      currentStencilsRef.current[tabKey] = stencils;
    },
    []
  );

  // HELPER FUNCTIONS FOR UI STATE
  const setHovered = useCallback((hovered: HoveredStencil | null) => {
    setUiState((prev) => ({ ...prev, hovered }));
  }, []);

  const setIsSearchModalOpen = useCallback((isSearchModalOpen: boolean) => {
    setUiState((prev) => ({ ...prev, isSearchModalOpen }));
  }, []);

  const setIsSearchVisible = useCallback((isSearchVisible: boolean) => {
    setUiState((prev) => ({ ...prev, isSearchVisible }));
  }, []);

  // IMPROVED KEY THROTTLING LOGIC
  const isKeyThrottled = useCallback((key: string): boolean => {
    const now = Date.now();
    const lastTime = keyThrottleRef.current.get(key);

    if (lastTime && now - lastTime < KEY_REPEAT_COOLDOWN) {
      return true; // Key is throttled
    }

    keyThrottleRef.current.set(key, now);
    return false; // Key is not throttled
  }, []);

  // IMPROVED KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect if the user is typing inside an input, textarea or contenteditable element.
      const activeElement = document.activeElement as HTMLElement | null;
      const isTypingInAnyInput =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.getAttribute("contenteditable") === "true" ||
          (activeElement as HTMLElement).contentEditable === "true");
      // PREVENT BROWSER KEY REPEAT for node creation keys (except Alt+Q) - using pre-computed array
      if (e.repeat && !isTypingInAnyInput) {
        const isAltQBackspace = e.altKey && e.key.toLowerCase() === "q";

        if (
          NODE_CREATION_KEYS.includes(e.key.toLowerCase() as any) &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.altKey &&
          !e.shiftKey &&
          !isAltQBackspace
        ) {
          e.preventDefault();
          return;
        }
      }

      // SIMPLIFIED THROTTLING - Only for non-Alt+Q keys
      const currentKey = e.key.toLowerCase();
      const isAltQBackspace = e.altKey && currentKey === "q";

      if (
        !isTypingInAnyInput &&
        !isAltQBackspace &&
        isKeyThrottled(currentKey)
      ) {
        e.preventDefault();
        return;
      }

      // Check if user is typing in an input field
      const isTyping = isTypingInAnyInput;

      // If typing, only allow system shortcuts
      if (isTyping && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        return;
      }

      // Variant switching shortcuts (Alt+1-5) - using pre-computed map
      if (e.altKey && e.key >= "1" && e.key <= "5") {
        e.preventDefault();
        const targetVariant = VARIANT_MAP[e.key];
        if (targetVariant) {
          onVariantChange(targetVariant);
        }
        return;
      }

      // Tab shortcuts (1-5 for tabs, 6 for search)
      if (e.key >= "1" && e.key <= "6") {
        e.preventDefault();
        if (e.key === "6") {
          setIsSearchVisible(true);
        } else {
          const tabIndex = Number.parseInt(e.key) - 1;
          if (tabIndex < tabs.length) {
            onTabChange(tabs[tabIndex].key);
          }
        }
        return;
      }

      // Skip QWERTY shortcuts with modifiers or when search is visible
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey ||
        uiState.isSearchVisible
      ) {
        return;
      }

      // Node grid shortcuts – Regular tabs: full QWERTY grid using pre-computed map
      const position = REGULAR_GRID_KEY_MAP[currentKey];
      if (position !== undefined) {
        const currentStencils = currentStencilsRef.current[activeTab] || [];
        if (position < currentStencils.length) {
          e.preventDefault();
          onDoubleClickCreate(currentStencils[position].nodeType);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    tabs,
    onTabChange,
    variant,
    activeTab,
    customNodes,
    onDoubleClickCreate,
    onVariantChange,
    uiState.isSearchVisible,
    isKeyThrottled,
    setIsSearchModalOpen,
    setIsSearchVisible,
  ]);

  if (isHidden) {
    return null;
  }

  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <aside className={SIDEBAR_STYLES}>
        <StencilInfoPanel stencil={uiState.hovered} />

        <TabsList className={TABS_LIST_STYLES}>
          {tabs.map(({ key, label }, index) => {
            const shortcutNumber = index + 1;

            return (
              <TabsTrigger
                key={key}
                value={key}
                title={`${label} (${shortcutNumber})`}
                className={TAB_TRIGGER_STYLES}
              >
                {label}
              </TabsTrigger>
            );
          })}

          {/* Search Button */}
          <button
            type="button"
            onClick={() => setIsSearchVisible(true)}
            className={SEARCH_BUTTON_STYLES}
            title="Search (6)"
          >
            <Search className="h-4 w-4 text-[var(--infra-sidebar-text)]" />
          </button>
        </TabsList>

        <div className={CONTENT_AREA_STYLES}>
          {tabs.map(({ key }) => {
            const isCustomTab = false;

            return (
              <SidebarTabContent
                key={key}
                variant={variant}
                tabKey={key}
                onNativeDragStart={handleNativeDragStart}
                onDoubleClickCreate={onDoubleClickCreate}
                setHovered={setHovered}
                isCustomTab={isCustomTab}
                customNodes={isCustomTab ? customNodes : undefined}
                onAddCustomNode={
                  isCustomTab ? () => setIsSearchModalOpen(true) : undefined
                }
                onRemoveCustomNode={
                  isCustomTab ? onRemoveCustomNode : undefined
                }
                onReorderCustomNodes={
                  isCustomTab ? onReorderCustomNodes : undefined
                }
                onStencilsChange={isCustomTab ? undefined : updateTabStencils}
              />
            );
          })}

          {/* Search Overlay */}
          <SearchBar
            isVisible={uiState.isSearchVisible}
            onClose={() => setIsSearchVisible(false)}
            onNativeDragStart={handleNativeDragStart}
            onDoubleClickCreate={onDoubleClickCreate}
            setHovered={setHovered}
          />
        </div>

        <NodeSearchModal
          isOpen={uiState.isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          onAddNode={onAddCustomNode}
          existingNodes={Array.from(existingCustomNodeTypes)}
        />
      </aside>
    </Tabs>
  );
}

// Precise memoization to avoid unnecessary re-renders from parent updates
function areSidebarTabsEqual(
  prev: SidebarTabsProps,
  next: SidebarTabsProps
): boolean {
  if (
    prev.variant !== next.variant ||
    prev.activeTab !== next.activeTab ||
    prev.isHidden !== next.isHidden ||
    prev.isReadOnly !== next.isReadOnly
  ) {
    return false;
  }

  if (prev.customNodes.length !== next.customNodes.length) return false;
  for (let i = 0; i < prev.customNodes.length; i++) {
    const a = prev.customNodes[i];
    const b = next.customNodes[i];
    if (a.id !== b.id || a.nodeType !== b.nodeType) return false;
  }

  // Assume handlers are stable via useCallback from parent
  return true;
}

export const SidebarTabs = memo(SidebarTabsComponent, areSidebarTabsEqual);
SidebarTabs.displayName = "SidebarTabs";
