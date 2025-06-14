import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFlowStore } from "../flow-engine/stores/flowStore";
import { NodeSearchModal } from "./components/NodeSearchModal";
import { SearchBar } from "./components/SearchBar";
import { SidebarTabContent } from "./components/SidebarTabContent";
import { VARIANT_CONFIG } from "./constants";
import { HoveredStencil, StencilInfoPanel } from "./StencilInfoPanel";
import { NodeStencil, SidebarVariant } from "./types";
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
}

export function SidebarTabs({
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
  onToggle,
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
    const fallbackVariants: SidebarVariant[] = ["A", "B", "C", "D", "E"];
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

  // SIMPLIFIED KEY REPEAT PREVENTION
  const keyThrottleRef = useRef<Map<string, number>>(new Map());
  const KEY_REPEAT_COOLDOWN = 150; // 150ms cooldown between same key presses

  // Get flow store for node deletion
  const { selectedNodeId, removeNode } = useFlowStore();

  // Get existing node types in custom section to prevent duplicates
  const existingCustomNodeTypes = useMemo(
    () => customNodes.map((node) => node.nodeType),
    [customNodes]
  );

  // IMPROVED DRAG START HANDLER
  const handleNativeDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, nodeType: string) => {
      console.log("Drag start:", nodeType);
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
      // PREVENT BROWSER KEY REPEAT for node creation keys (except Alt+Q)
      if (e.repeat) {
        const nodeCreationKeys = [
          "q",
          "w",
          "e",
          "r",
          "t",
          "a",
          "s",
          "d",
          "f",
          "g",
          "z",
          "x",
          "c",
          "v",
          "b",
        ];
        const isAltQBackspace = e.altKey && e.key.toLowerCase() === "q";

        if (
          nodeCreationKeys.includes(e.key.toLowerCase()) &&
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

      if (!isAltQBackspace && isKeyThrottled(currentKey)) {
        e.preventDefault();
        return;
      }

      // Check if user is typing in an input field
      const activeElement = document.activeElement;
      const isTyping =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.getAttribute("contenteditable") === "true");

      // If typing, only allow system shortcuts
      if (isTyping && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        return;
      }

      // Variant switching shortcuts (Alt+1-5)
      if (e.altKey && e.key >= "1" && e.key <= "5") {
        e.preventDefault();
        const variantMap: Record<string, SidebarVariant> = {
          "1": "A",
          "2": "B",
          "3": "C",
          "4": "D",
          "5": "E",
        };
        const targetVariant = variantMap[e.key];
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
          const tabIndex = parseInt(e.key) - 1;
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

      // Node grid shortcuts
      const isCustomTab = variant === "E" && activeTab === "custom";

      if (isCustomTab) {
        // Custom tab: q = add node, w-b for positions
        if (currentKey === "q") {
          e.preventDefault();
          setIsSearchModalOpen(true);
          return;
        }

        const customGridKeyMap: Record<string, number> = {
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
        };

        const position = customGridKeyMap[currentKey];
        if (position !== undefined && position < customNodes.length) {
          e.preventDefault();
          onDoubleClickCreate(customNodes[position].nodeType);
        }
      } else {
        // Regular tabs: full QWERTY grid
        const gridKeyMap: Record<string, number> = {
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
        };

        const position = gridKeyMap[currentKey];
        if (position !== undefined) {
          const currentStencils = currentStencilsRef.current[activeTab] || [];
          if (position < currentStencils.length) {
            e.preventDefault();
            onDoubleClickCreate(currentStencils[position].nodeType);
          }
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

  if (isHidden) return null;

  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <aside className="absolute bottom-4 right-4 z-30 h-[200px] sm:h-[280px] w-full sm:w-[400px] lg:w-[450px] pl-3 sm:pl-6 pr-3 sm:pr-5 pt-2 rounded-lg bg-infra-sidebar border border-infra-sidebar shadow-lg transition-all duration-300 ease-in-out">
        <StencilInfoPanel stencil={uiState.hovered} />

        <TabsList className="bg-infra-sidebar items-stretch justify-between w-full gap-1 border-0 border-infra-sidebar">
          {tabs.map(({ key, label }, index) => {
            const shortcutNumber = index + 1;

            return (
              <TabsTrigger
                key={key}
                value={key}
                title={`${label} (${shortcutNumber})`}
                className="text-infra-sidebar hover:bg-infra-sidebar-hover hover:border-infra-sidebar-hover data-[state=active]:bg-infra-sidebar-active data-[state=active]:text-infra-sidebar transition-colors rounded px-3 py-2 border border-transparent"
              >
                {label}
              </TabsTrigger>
            );
          })}

          {/* Search Button */}
          <button
            onClick={() => setIsSearchVisible(true)}
            className="p-2 mr-1 rounded hover:bg-infra-sidebar-hover hover:border-infra-sidebar-hover text-infra-sidebar flex items-center gap-1 border border-transparent transition-colors"
            title="Search all nodes (6)"
          >
            <Search className="h-4 w-4 text-infra-sidebar" />
            {/* <span className="hidden sm:inline">Search</span> */}
            {/* <span className="hidden lg:inline text-xs text-infra-sidebar-secondary">⌘K</span> */}
          </button>
        </TabsList>

        <div className="max-h-[150px] sm:max-h-[230px] overflow-y-auto scrollbar pb-2 border-0 bg-infra-sidebar">
          {tabs.map(({ key }) => {
            const isCustomTab = variant === "E" && key === "custom";

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
                onStencilsChange={!isCustomTab ? updateTabStencils : undefined}
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
          existingNodes={existingCustomNodeTypes}
        />
      </aside>
    </Tabs>
  );
}
