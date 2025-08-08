/**
 * PIE MENU – perfectly centered radial menu with circular labels (TypeScript)
 *
 * • Pixel-perfect center under the mouse (container & math use the same snapped center)
 * • Immune to ancestor transforms (renders via Portal to <body>)
 * • Action buttons: pure polar layout (no magic offsets), pixel-snapped
 * • Labels: one global label-center radius (perfect circle) + pixel-snapped top/left
 */

"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Copy,
  Eye,
  History,
  Layers,
  Move,
  Play,
  Plus,
  RotateCcw,
  RotateCw,
  Settings,
  Square,
  Trash2,
} from "lucide-react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

// ------------------------------------------------------------------------------------
// Types
// ------------------------------------------------------------------------------------

export interface PieMenuAction {
  id: string;
  label: string;
  icon: React.ReactNode | string;
  action: () => void;
  shortcut?: string;
  disabled?: boolean;
  // Sub-menu support for expandable actions
  subMenu?: {
    items: PieMenuSubItem[];
    onHover?: () => void;
    onLeave?: () => void;
  };
}

export interface PieMenuSubItem {
  id: string;
  label: string;
  icon?: React.ReactNode | string;
  action: () => void;
  category?: string;
}

export interface PieMenuPosition {
  x: number;
  y: number;
}

interface PieMenuContextType {
  isVisible: boolean;
  position: PieMenuPosition;
  selectedIndex: number;
  actions: PieMenuAction[];
  showPieMenu: (position: PieMenuPosition, actions: PieMenuAction[]) => void;
  hidePieMenu: () => void;
  setSelectedIndex: (index: number) => void;
  executeAction: (index: number) => void;
  // Sub-menu support
  activeSubMenu: string | null;
  subMenuItems: PieMenuSubItem[];
  showSubMenu: (actionId: string, items: PieMenuSubItem[]) => void;
  hideSubMenu: () => void;
}

// ------------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------------

const PIE_MENU_RADIUS = 75; // button ring radius, basically distance from center to buttons
const PIE_MENU_SIZE = 44; // button diameter, basically size of action buttons
const SELECTION_THRESHOLD = 30; // deadzone, basically minimum distance for selection
const CONTAINER_SIZE = 300; // container dimensions, basically menu boundary size
const CENTER_OFFSET = CONTAINER_SIZE / 2; // container center offset, basically half of container
const ANIMATION_DURATION = 0.12; // animation timing, basically transition speed (faster)

const LABEL_GAP = 12; // ring → label inner-edge gap, basically spacing between buttons and labels
const LABEL_CLEARANCE = 6; // extra global breathing room, basically additional label spacing

const DEBUG = false; // Disable debugging for production

// Theme-aware styling constants, basically consistent design tokens
const THEME_STYLES = {
  // Shadow variations, basically different shadow intensities
  SHADOW_SM: "shadow-sm",
  SHADOW_MD: "shadow-md",
  SHADOW_LG: "shadow-lg",
  SHADOW_XL: "shadow-xl",
  // Border styles, basically consistent border appearances
  BORDER_DEFAULT: "border border-border",
  BORDER_PRIMARY: "border-2 border-primary",
  BORDER_ACCENT: "border border-primary/30",
  // Background styles, basically consistent background appearances
  BG_CARD: "bg-card/95 backdrop-blur-sm",
  BG_OVERLAY: "bg-black/5 backdrop-blur-[1px]",
  // Animation styles, basically consistent transition timings
  TRANSITION_DEFAULT: "transition-all duration-120 ease-in-out",
  TRANSITION_FAST: "transition-all duration-100 ease-in-out",
  TRANSITION_COLORS: "transition-colors duration-100",
  // Z-index layers, basically stacking order for portal elements
  Z_OVERLAY: "z-[40]",
  Z_MENU: "z-[50]",
  Z_DEBUG: "z-[60]",
  Z_DEBUG_PANEL: "z-[70]",
  // Responsive sizing, basically adaptive dimensions for different screens
  RESPONSIVE_CONTAINER: "w-[300px] h-[300px] sm:w-[320px] sm:h-[320px]",
  RESPONSIVE_BUTTON: "h-11 w-11 sm:h-12 sm:w-12",
} as const;

const DEBUG_COLORS = {
  CENTRAL_INDICATOR: "border-green-500",
  SELECTION_INDICATOR: "border-purple-500",
  ACTION_BUTTON: "border-orange-500",
  ACTION_LABEL: "border-yellow-500",
  BACKGROUND_OVERLAY: "border-red-500",
  MAIN_CONTAINER: "border-blue-500",
  DEBUG_DOT_RED: "bg-red-500",
  DEBUG_DOT_BLUE: "bg-blue-500",
  DEBUG_DOT_GREEN: "bg-green-500",
  DEBUG_DOT_PURPLE: "bg-purple-500",
} as const;

// ------------------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------------------

function renderIcon(icon: PieMenuAction["icon"]): React.ReactNode {
  if (typeof icon === "string") {
    const iconMap: Record<
      string,
      React.ComponentType<{ className?: string }>
    > = {
      Copy,
      Trash2,
      Plus,
      RotateCcw,
      RotateCw,
      Eye,
      Settings,
      Play,
      Square,
      History,
      Move,
      Layers,
    };
    const Icon = iconMap[icon];
    return Icon ? <Icon className="h-4 w-4" /> : null;
  }
  return icon;
}

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

// ------------------------------------------------------------------------------------
// Context + Provider
// ------------------------------------------------------------------------------------

const PieMenuContext = createContext<PieMenuContextType | null>(null);

export function usePieMenu(): PieMenuContextType {
  const ctx = useContext(PieMenuContext);
  if (!ctx) throw new Error("usePieMenu must be used within PieMenuProvider");
  return ctx;
}

export function PieMenuProvider({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [position, setPosition] = useState<PieMenuPosition>({ x: 0, y: 0 });
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [actions, setActions] = useState<PieMenuAction[]>([]);
  // Sub-menu state
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const [subMenuItems, setSubMenuItems] = useState<PieMenuSubItem[]>([]);

  const showPieMenu = useCallback(
    (pos: PieMenuPosition, menu: PieMenuAction[]) => {
      setPosition(pos);
      setActions(menu);
      setSelectedIndex(-1);
      setIsVisible(true);
    },
    []
  );

  const hidePieMenu = useCallback(() => {
    setIsVisible(false);
    setSelectedIndex(-1);
    setActions([]);
  }, []);

  const executeAction = useCallback(
    (index: number) => {
      if (index >= 0 && index < actions.length && !actions[index].disabled) {
        actions[index].action();
        hidePieMenu();
      }
    },
    [actions, hidePieMenu]
  );

  // Sub-menu functions
  const showSubMenu = useCallback((actionId: string, items: PieMenuSubItem[]) => {
    setActiveSubMenu(actionId);
    setSubMenuItems(items);
  }, []);

  const hideSubMenu = useCallback(() => {
    setActiveSubMenu(null);
    setSubMenuItems([]);
  }, []);

  const value = useMemo<PieMenuContextType>(
    () => ({
      isVisible,
      position,
      selectedIndex,
      actions,
      showPieMenu,
      hidePieMenu,
      setSelectedIndex,
      executeAction,
      // Sub-menu properties
      activeSubMenu,
      subMenuItems,
      showSubMenu,
      hideSubMenu,
    }),
    [
      isVisible,
      position,
      selectedIndex,
      actions,
      showPieMenu,
      hidePieMenu,
      executeAction,
      activeSubMenu,
      subMenuItems,
      showSubMenu,
      hideSubMenu,
    ]
  );

  return (
    <PieMenuContext.Provider value={value}>
      {children}
      <PieMenuRendererPortal />
    </PieMenuContext.Provider>
  );
}

// ------------------------------------------------------------------------------------
// Debug UI (optional)
// ------------------------------------------------------------------------------------

function DebugDot(props: {
  color: string;
  position: { x: number; y: number };
  title: string;
  ariaLabel: string;
}) {
  if (!DEBUG) return null;
  const { color, position, title, ariaLabel } = props;
  return (
    <div
      className={cn(
        // Position and size styling, basically debug dot placement and dimensions
        "fixed h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full",
        THEME_STYLES.Z_DEBUG,
        // Visual styling, basically debug dot appearance with high visibility
        "border-2 border-white ring-1 ring-black/20",
        THEME_STYLES.SHADOW_LG,
        // Animation styling, basically smooth debug dot transitions
        THEME_STYLES.TRANSITION_FAST,
        color
      )}
      style={{ left: position.x, top: position.y }}
      title={title}
      aria-label={ariaLabel}
    />
  );
}

function DebugDots({
  position,
  selectedIndex,
  actionPositions,
  selectionCenter, // ⬅︎ SNAPPED CENTER for debugging
  mousePosition, // ⬅︎ Add mouse position for angle debugging
  actions, // ⬅︎ Add actions for label debugging
}: {
  position: PieMenuPosition;
  selectedIndex: number;
  actionPositions: Array<{ x: number; y: number }>;
  selectionCenter: { x: number; y: number };
  mousePosition?: { x: number; y: number };
  actions?: PieMenuAction[];
}) {
  // Calculate debug info, basically show current selection state
  const debugInfo = mousePosition
    ? {
        mouseDistance: Math.hypot(
          mousePosition.x - selectionCenter.x,
          mousePosition.y - selectionCenter.y
        ),
        angle:
          Math.atan2(
            mousePosition.y - selectionCenter.y,
            mousePosition.x - selectionCenter.x
          ) +
          Math.PI / 2,
        rotatedAngle:
          Math.atan2(
            mousePosition.y - selectionCenter.y,
            mousePosition.x - selectionCenter.x
          ) +
          Math.PI / 2 +
          Math.PI / 12, // Add 15° rotation
        isInDeadzone:
          Math.hypot(
            mousePosition.x - selectionCenter.x,
            mousePosition.y - selectionCenter.y
          ) < SELECTION_THRESHOLD,
      }
    : null;
  return (
    <>
      <DebugDot
        color={DEBUG_COLORS.DEBUG_DOT_RED}
        position={{ x: position.x, y: position.y }}
        title="raw cursor center (unsnapped)"
        ariaLabel="cursor"
      />
      <DebugDot
        color={DEBUG_COLORS.DEBUG_DOT_BLUE}
        position={{
          x: selectionCenter.x - CENTER_OFFSET,
          y: selectionCenter.y - CENTER_OFFSET,
        }}
        title="container top-left (snapped)"
        ariaLabel="top-left"
      />
      <DebugDot
        color={DEBUG_COLORS.DEBUG_DOT_GREEN}
        position={{ x: selectionCenter.x, y: selectionCenter.y }}
        title="selection/render center (snapped)"
        ariaLabel="center"
      />
      {selectedIndex >= 0 && actionPositions[selectedIndex] && (
        <DebugDot
          color={DEBUG_COLORS.DEBUG_DOT_PURPLE}
          position={{
            x: selectionCenter.x + actionPositions[selectedIndex].x,
            y: selectionCenter.y + actionPositions[selectedIndex].y,
          }}
          title={`selected action: ${actions?.[selectedIndex]?.label ?? "Unknown"}`}
          ariaLabel="selected"
        />
      )}

      {/* Debug selection area visualization, basically show deadzone and angle calculations */}
      {DEBUG && mousePosition && (
        <>
          {/* Deadzone circle, basically shows the selection threshold */}
          <div
            className="fixed border-2 border-red-400 border-dashed rounded-full pointer-events-none"
            style={{
              left: selectionCenter.x - SELECTION_THRESHOLD,
              top: selectionCenter.y - SELECTION_THRESHOLD,
              width: SELECTION_THRESHOLD * 2,
              height: SELECTION_THRESHOLD * 2,
              zIndex: 55,
            }}
            title={`Deadzone (${SELECTION_THRESHOLD}px radius)`}
          />

          {/* Mouse position indicator, basically shows current mouse relative to center */}
          <div
            className="fixed w-2 h-2 bg-yellow-400 rounded-full pointer-events-none"
            style={{
              left: mousePosition.x - 4,
              top: mousePosition.y - 4,
              zIndex: 56,
            }}
            title="Current mouse position"
          />

          {/* Line from center to mouse, basically shows the angle calculation */}
          <svg
            className="fixed pointer-events-none"
            style={{
              left: 0,
              top: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 54,
            }}
          >
            <line
              x1={selectionCenter.x}
              y1={selectionCenter.y}
              x2={mousePosition.x}
              y2={mousePosition.y}
              stroke="rgba(255, 255, 0, 0.6)"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
          </svg>
        </>
      )}

      {/* Debug info panel, basically show current selection state and calculations */}
      {DEBUG && debugInfo && (
        <div
          className={cn(
            "fixed top-4 right-4 bg-black/80 text-white p-3 rounded-md text-xs font-mono",
            "border border-white/20 shadow-lg",
            THEME_STYLES.Z_DEBUG_PANEL
          )}
        >
          <div className="space-y-1">
            <div>
              Mouse: ({mousePosition?.x}, {mousePosition?.y})
            </div>
            <div>
              Center: ({selectionCenter.x}, {selectionCenter.y})
            </div>
            <div>Distance: {debugInfo.mouseDistance.toFixed(1)}px</div>
            <div>Angle: {((debugInfo.angle * 180) / Math.PI).toFixed(1)}°</div>
            <div>
              Rotated: {((debugInfo.rotatedAngle * 180) / Math.PI).toFixed(1)}°
            </div>
            <div>Deadzone: {debugInfo.isInDeadzone ? "YES" : "NO"}</div>
            <div>
              Selected:{" "}
              {selectedIndex >= 0 ? actions?.[selectedIndex]?.label : "None"}
            </div>
            <div>Actions: {actions?.length || 0}</div>
          </div>
        </div>
      )}
    </>
  );
}

// ------------------------------------------------------------------------------------
// UI Subcomponents
// ------------------------------------------------------------------------------------

function CentralIndicator(props: {
  selectedIndex: number;
  actions: PieMenuAction[];
  executeAction: (index: number) => void;
}) {
  const { selectedIndex, actions, executeAction } = props;
  return (
    <motion.button
      type="button"
      className={cn(
        // Position and size styling, basically center placement and dimensions
        "absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full",
        // Base appearance styling, basically border and background
        THEME_STYLES.BORDER_PRIMARY,
        "bg-background outline-none",
        THEME_STYLES.SHADOW_LG,
        // Interactive states styling, basically hover and focus effects
        "hover:scale-110 hover:border-primary/50 focus:ring-2 focus:ring-primary/60",
        THEME_STYLES.TRANSITION_DEFAULT,
        DEBUG && DEBUG_COLORS.CENTRAL_INDICATOR
      )}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.05, duration: 0.1 }}
      onClick={(e) => {
        e.stopPropagation();
        if (actions.length > 0)
          executeAction(selectedIndex >= 0 ? selectedIndex : 0);
      }}
      title="Exit"
      aria-label="Exit"
    />
  );
}

function SelectionIndicator(props: {
  selectedIndex: number;
  actionPositions: Array<{ x: number; y: number }>;
  actions: PieMenuAction[];
}) {
  const { selectedIndex, actionPositions, actions } = props;
  if (selectedIndex < 0) return null;
  const pos = actionPositions[selectedIndex];
  return (
    <AnimatePresence>
      <motion.div
        className={cn(
          // Position and size styling, basically selection ring placement and dimensions
          "absolute h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full",
          // Visual styling, basically selection indicator appearance
          "bg-primary/20",
          THEME_STYLES.BORDER_PRIMARY,
          THEME_STYLES.SHADOW_LG,
          "ring-2 ring-primary/30 ring-offset-1",
          DEBUG && DEBUG_COLORS.SELECTION_INDICATOR
        )}
        style={{
          left: Math.round(CENTER_OFFSET + pos.x),
          top: Math.round(CENTER_OFFSET + pos.y),
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1.2, opacity: 0.8 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ duration: 0.1 }}
        aria-label={`Selected: ${actions[selectedIndex]?.label ?? "Unknown action"}`}
      />
    </AnimatePresence>
  );
}

function ActionButton(props: {
  action: PieMenuAction;
  position: { x: number; y: number };
  index: number;
  isSelected: boolean;
  executeAction: (index: number) => void;
  showSubMenu: (actionId: string, items: PieMenuSubItem[]) => void;
  hideSubMenu: () => void;
}) {
  const { action, position, index, isSelected, executeAction, showSubMenu, hideSubMenu } = props;
  const left = Math.round(CENTER_OFFSET + position.x);
  const top = Math.round(CENTER_OFFSET + position.y);

  // Handle hover for sub-menu
  const handleMouseEnter = useCallback(() => {
    if (action.subMenu) {
      showSubMenu(action.id, action.subMenu.items);
      action.subMenu.onHover?.();
    }
  }, [action, showSubMenu]);

  const handleMouseLeave = useCallback(() => {
    if (action.subMenu) {
      // Don't hide immediately, let the sub-menu handle it
      action.subMenu.onLeave?.();
    }
  }, [action]);

  return (
    <motion.button
      type="button"
      className={cn(
        // Position and layout styling, basically button placement and flex setup
        "absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full",
        THEME_STYLES.RESPONSIVE_BUTTON,
        // Base styling, basically shadow and outline
        THEME_STYLES.SHADOW_MD,
        "outline-none",
        THEME_STYLES.TRANSITION_FAST,
        // Selected state styling, basically primary appearance when active
        isSelected
          ? cn(
              "bg-primary text-primary-foreground",
              THEME_STYLES.SHADOW_LG,
              THEME_STYLES.BORDER_PRIMARY
            )
          : cn(
              // Unselected state styling, basically default appearance
              THEME_STYLES.BORDER_DEFAULT,
              "bg-background text-foreground",
              // Hover effects styling, basically interactive feedback
              "hover:scale-110 hover:bg-accent hover:shadow-xl",
              THEME_STYLES.BORDER_ACCENT.replace("border", "hover:border")
            ),
        // Disabled state styling, basically reduced interaction when disabled
        action.disabled && "cursor-not-allowed opacity-50 hover:scale-100",
        DEBUG && DEBUG_COLORS.ACTION_BUTTON
      )}
      style={{ left, top }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        delay: index * 0.03,
        duration: 0.15,
        type: "spring",
        stiffness: 500,
        damping: 30,
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!action.disabled) {
          // If it has a sub-menu, don't execute immediately
          if (action.subMenu) {
            // Toggle sub-menu or execute default action
            return;
          }
          executeAction(index);
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="menuitem"
      aria-label={`${action.label}${action.shortcut ? ` (${action.shortcut})` : ""}`}
      aria-disabled={action.disabled}
      aria-haspopup={action.subMenu ? "menu" : undefined}
    >
      <span
        className={cn(
          THEME_STYLES.TRANSITION_COLORS,
          isSelected ? "text-primary-foreground" : "text-foreground"
        )}
      >
        {renderIcon(action.icon)}
      </span>
    </motion.button>
  );
}

// ------------------------------------------------------------------------------------
// Sub-Menu Panel – lateral expandable panels for node categories
// ------------------------------------------------------------------------------------

function SubMenuPanel(props: {
  items: PieMenuSubItem[];
  position: PieMenuPosition;
  onItemClick: (item: PieMenuSubItem) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const { items, position, onItemClick, onMouseEnter, onMouseLeave } = props;

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const groups: Record<string, PieMenuSubItem[]> = {};
    items.forEach(item => {
      const category = item.category || 'Other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
    });
    return groups;
  }, [items]);

  // Position the panel to the right of the pie menu
  const panelStyle = {
    left: position.x + 120, // Offset from pie menu center
    top: position.y - 100,  // Center vertically relative to pie menu
  };

  return (
    <motion.div
      className="absolute z-50 bg-background border border-border rounded-lg shadow-xl p-3 min-w-[200px] max-w-[300px]"
      style={panelStyle}
      initial={{ opacity: 0, scale: 0.9, x: -20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9, x: -20 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {Object.entries(itemsByCategory).map(([category, categoryItems]) => (
        <div key={category} className="mb-3 last:mb-0">
          {/* Category Header */}
          <div className="text-xs font-medium text-muted-foreground mb-2 px-1">
            {category}
          </div>
          
          {/* Items Grid */}
          <div className="grid grid-cols-2 gap-1">
            {categoryItems.map((item) => (
              <motion.button
                key={item.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-accent hover:text-accent-foreground text-left text-xs transition-colors"
                onClick={() => onItemClick(item)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {item.icon && (
                  <span className="flex-shrink-0 w-4 h-4">
                    {renderIcon(item.icon)}
                  </span>
                )}
                <span className="truncate">{item.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
}

// ------------------------------------------------------------------------------------
// Labels – global circular radius + pixel snapping
// ------------------------------------------------------------------------------------

type LabelMeasureFn = (index: number, size: { w: number; h: number }) => void;

function ActionLabel(props: {
  index: number;
  action: PieMenuAction;
  ux: number; // unit radial x
  uy: number; // unit radial y
  labelCenterR: number; // global center radius for all labels
  isSelected: boolean;
  onMeasure: LabelMeasureFn;
}) {
  const { index, action, ux, uy, labelCenterR, isSelected, onMeasure } = props;
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const report = () => {
      const r = el.getBoundingClientRect();
      const next = { w: r.width, h: r.height };
      setSize((p) => (p.w === next.w && p.h === next.h ? p : next));
      onMeasure(index, next);
    };
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [index, onMeasure]);

  const cx = CENTER_OFFSET + ux * labelCenterR;
  const cy = CENTER_OFFSET + uy * labelCenterR;
  const left = Math.round(cx - size.w / 2);
  const top = Math.round(cy - size.h / 2);

  return (
    <motion.div
      ref={ref}
      className={cn(
        // Position and layout styling, basically label placement and text layout
        "absolute select-none whitespace-nowrap pointer-events-none",
        // Visual styling, basically label appearance with card design
        "rounded-md px-2 py-1 text-sm font-medium ring-1 ring-black/5",
        THEME_STYLES.BG_CARD,
        THEME_STYLES.SHADOW_LG,
        // Text color styling, basically text appearance based on selection
        isSelected
          ? cn("text-foreground bg-card", THEME_STYLES.BORDER_ACCENT)
          : cn("text-muted-foreground", THEME_STYLES.BORDER_DEFAULT),
        // Animation styling, basically smooth transitions
        THEME_STYLES.TRANSITION_DEFAULT,
        DEBUG && DEBUG_COLORS.ACTION_LABEL
      )}
      style={{ left, top }} // no translate; exact pixel placement
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.15 + index * 0.01, duration: 0.1 }}
      aria-label={`Label for ${action.label}`}
    >
      <span
        className={cn(
          THEME_STYLES.TRANSITION_COLORS,
          isSelected ? "text-foreground" : "text-foreground/80"
        )}
      >
        {action.label}
      </span>
      {action.shortcut && (
        <span
          className={cn(
            "ml-2 text-xs",
            THEME_STYLES.TRANSITION_COLORS,
            isSelected ? "text-muted-foreground" : "text-muted-foreground/60"
          )}
        >
          {action.shortcut}
        </span>
      )}
    </motion.div>
  );
}

// ------------------------------------------------------------------------------------
// Main Renderer (Portal)
// ------------------------------------------------------------------------------------

function BackgroundOverlay({
  onClick,
}: {
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className={cn(
        // Position and interaction styling, basically overlay placement and click handling
        "fixed inset-0 cursor-pointer",
        THEME_STYLES.Z_OVERLAY,
        // Visual styling, basically transparent background with subtle blur
        THEME_STYLES.BG_OVERLAY,
        // Animation styling, basically smooth overlay appearance
        THEME_STYLES.TRANSITION_DEFAULT,
        DEBUG && DEBUG_COLORS.BACKGROUND_OVERLAY
      )}
      onClick={onClick}
      aria-label="Click outside to dismiss pie menu"
    />
  );
}

function PieMenuRendererPortal() {
  const {
    isVisible,
    position,
    selectedIndex,
    actions,
    setSelectedIndex,
    executeAction,
    hidePieMenu,
    // Sub-menu properties
    activeSubMenu,
    subMenuItems,
    showSubMenu,
    hideSubMenu,
  } = usePieMenu();

  // Track mouse position for debugging, basically store current mouse coordinates
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Polar vectors for buttons (and radial unit vectors for labels).
  const actionVectors = useMemo(() => {
    if (!actions.length)
      return [] as Array<{ x: number; y: number; ux: number; uy: number }>;
    return actions.map((_, i) => {
      const angle = (i * 2 * Math.PI) / actions.length - Math.PI / 2; // start at 12 o'clock
      const ux = Math.cos(angle);
      const uy = Math.sin(angle);
      return { x: ux * PIE_MENU_RADIUS, y: uy * PIE_MENU_RADIUS, ux, uy };
    });
  }, [actions.length]);

  // Track measured label sizes.
  const [labelSizes, setLabelSizes] = useState<
    Record<number, { w: number; h: number }>
  >({});
  const onMeasure = useCallback<LabelMeasureFn>((i, s) => {
    setLabelSizes((prev) => {
      const p = prev[i];
      if (p && p.w === s.w && p.h === s.h) return prev;
      return { ...prev, [i]: s };
    });
  }, []);

  // One global center radius for all labels, so centers lie on a perfect circle.
  const labelCenterR = useMemo(() => {
    const baseInner = PIE_MENU_RADIUS + PIE_MENU_SIZE / 2 + LABEL_GAP;
    let needed = baseInner;
    for (let i = 0; i < actionVectors.length; i++) {
      const size = labelSizes[i];
      if (!size) continue;
      const { ux, uy } = actionVectors[i];
      const projectedHalf =
        Math.abs(ux) * (size.w / 2) + Math.abs(uy) * (size.h / 2);
      needed = Math.max(needed, baseInner + projectedHalf);
    }
    return Math.round(needed + LABEL_CLEARANCE);
  }, [actionVectors, labelSizes]);

  // ⬇︎ SNAPPED CENTER — use the same snapped center for rendering AND hit-testing
  const snapped = useMemo(() => {
    const left = Math.round(position.x - CENTER_OFFSET);
    const top = Math.round(position.y - CENTER_OFFSET);
    const centerX = left + CENTER_OFFSET;
    const centerY = top + CENTER_OFFSET;
    return { left, top, centerX, centerY };
  }, [position.x, position.y]);

  // Selection based on angle around the SNAPPED center.
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isVisible || actions.length === 0) return;

      // Update mouse position for debugging, basically track current mouse coordinates
      setMousePosition({ x: e.clientX, y: e.clientY });

      // Calculate distance from center, basically mouse position relative to menu center
      const dx = e.clientX - snapped.centerX; // ⬅︎ use snapped center
      const dy = e.clientY - snapped.centerY; // ⬅︎ use snapped center
      const dist = Math.hypot(dx, dy);

      // Debug logging for selection logic, basically track selection calculations
      // Removed console.log for production

      // Check if mouse is in deadzone, basically too close to center for selection
      if (dist < SELECTION_THRESHOLD) {
        setSelectedIndex(-1);
        return;
      }

      // Calculate angle from center, basically convert mouse position to polar coordinates
      const raw = Math.atan2(dy, dx) + Math.PI / 2; // rotate so 0 is at top
      const angle = raw < 0 ? raw + 2 * Math.PI : raw;
      // Rotate clockwise by 15 degrees (π/12 radians), basically shift selection by 15°
      const rotatedAngle = angle + Math.PI / 12;
      const wedge = (2 * Math.PI) / actions.length;
      const calculatedIndex = Math.floor(rotatedAngle / wedge) % actions.length;

      // Debug logging for angle calculations, basically track angle-based selection
      // Removed console.log for production

      setSelectedIndex(calculatedIndex);
    },
    [
      isVisible,
      actions.length,
      snapped.centerX,
      snapped.centerY,
      setSelectedIndex,
      selectedIndex, // Add selectedIndex for debug comparison
    ]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (selectedIndex >= 0) executeAction(selectedIndex);
      else hidePieMenu();
    },
    [selectedIndex, executeAction, hidePieMenu]
  );

  useEffect(() => {
    if (!isVisible) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        ev.preventDefault();
        hidePieMenu();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isVisible, hidePieMenu]);

  if (!isVisible) return null;

  const menu = (
    <>
      <BackgroundOverlay onClick={handleClick} />
      <DebugDots
        position={position}
        selectedIndex={selectedIndex}
        actionPositions={actionVectors.map(({ x, y }) => ({ x, y }))}
        selectionCenter={{ x: snapped.centerX, y: snapped.centerY }} // ⬅︎ show snapped center
        mousePosition={mousePosition || undefined}
        actions={actions}
      />

      {/* Container uses SNAPPED left/top so its mathematical center == snapped.centerX/Y */}
      <motion.div
        className={cn(
          // Position and interaction styling, basically container placement and mouse handling
          "fixed pointer-events-auto",
          THEME_STYLES.Z_MENU,
          // Visual styling, basically container appearance with subtle effects
          THEME_STYLES.SHADOW_XL.replace("shadow", "drop-shadow"),
          DEBUG && DEBUG_COLORS.MAIN_CONTAINER
        )}
        style={{
          left: snapped.left, // ⬅︎ snapped
          top: snapped.top, // ⬅︎ snapped
          width: CONTAINER_SIZE,
          height: CONTAINER_SIZE,
        }}
        onMouseMove={handleMouseMove}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: ANIMATION_DURATION }}
        role="menu"
        aria-label="Pie menu"
      >
        <CentralIndicator
          selectedIndex={selectedIndex}
          actions={actions}
          executeAction={executeAction}
        />

        <SelectionIndicator
          selectedIndex={selectedIndex}
          actionPositions={actionVectors.map(({ x, y }) => ({ x, y }))}
          actions={actions}
        />

        {/* Buttons */}
        {actionVectors.map((pos, i) => (
          <ActionButton
            key={actions[i].id}
            action={actions[i]}
            position={{ x: pos.x, y: pos.y }}
            index={i}
            isSelected={selectedIndex === i}
            executeAction={executeAction}
            showSubMenu={showSubMenu}
            hideSubMenu={hideSubMenu}
          />
        ))}

        {/* Labels (centers all on same circle) */}
        {actionVectors.map(({ ux, uy }, i) => (
          <ActionLabel
            key={`label-${actions[i].id}`}
            index={i}
            action={actions[i]}
            ux={ux}
            uy={uy}
            labelCenterR={labelCenterR}
            isSelected={selectedIndex === i}
            onMeasure={onMeasure}
          />
        ))}

        {/* Sub-Menu Panel */}
        <AnimatePresence>
          {activeSubMenu && subMenuItems.length > 0 && (
            <SubMenuPanel
              items={subMenuItems}
              position={position}
              onItemClick={(item) => {
                item.action();
                hidePieMenu();
              }}
              onMouseEnter={() => {
                // Keep sub-menu open when hovering over it
              }}
              onMouseLeave={() => {
                // Hide sub-menu when leaving
                hideSubMenu();
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );

  return typeof window !== "undefined" && document?.body
    ? createPortal(menu, document.body)
    : null;
}

// ------------------------------------------------------------------------------------
// Trigger hook
// ------------------------------------------------------------------------------------

export function usePieMenuTrigger() {
  const { showPieMenu } = usePieMenu();
  const triggerPieMenu = useCallback(
    (e: React.MouseEvent | MouseEvent, actions: PieMenuAction[]) => {
      showPieMenu({ x: e.clientX, y: e.clientY }, actions);
    },
    [showPieMenu]
  );
  return { triggerPieMenu };
}
