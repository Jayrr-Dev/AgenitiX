/**
 * COLOR DEBUGGER COMPONENT - Visual color reference tool
 *
 * This component provides a visual interface to understand what colors
 * the CSS variables actually represent in both light and dark themes.
 * Useful for development and debugging theme-related issues.
 *
 * @author Agenitix Development Team
 * @version 1.0.0
 */

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { debugComponentColors, getColorInfo } from "./colorDebugUtils";
import type { ComponentThemes } from "./componentThemeStore";
import { useComponentTheme } from "./componentThemeStore";

// ============================================================================
// CONSTANTS
// ============================================================================

/** Check if we're in development mode */
const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

/** Available component types for debugging */
const COMPONENT_TYPES: (keyof ComponentThemes)[] = [
  "actionToolbar",
  "historyPanel",
  "sidePanel",
  "sidebarIcons",
  "variantSelector",
  "nodeInspector",
  "miniMap",
];

/** CSS variables to display in the color reference */
const CSS_VARIABLES = [
  "bg-background",
  "bg-card",
  "bg-muted",
  "bg-accent",
  "bg-primary",
  "bg-secondary",
  "text-foreground",
  "text-card-foreground",
  "text-muted-foreground",
  "text-primary-foreground",
  "text-secondary-foreground",
  "border-border",
  "border-accent",
  "border-primary",
];

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props for the ColorDebugger component
 */
interface ColorDebuggerProps {
  /** Whether the debugger should be visible */
  isVisible?: boolean;
  /** Callback when debugger visibility changes */
  onVisibilityChange?: (visible: boolean) => void;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Color swatch component showing a single color
 */
const ColorSwatch: React.FC<{
  variable: string;
  theme: "light" | "dark";
}> = ({ variable, theme }) => {
  const colorInfo = getColorInfo(variable, theme);

  const handleCopy = useCallback(() => {
    navigator.clipboard
      .writeText(`var(--${variable.replace(/^(bg-|text-|border-)/, "")})`)
      .then(() => toast.success(`${variable} copied to clipboard`));
  }, [variable]);

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-3 p-2 rounded-md bg-card border border-border text-left hover:ring-2 hover:ring-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50"
      title="Click to copy CSS variable"
    >
      <span
        className="w-8 h-8 rounded border border-border shadow-sm flex-shrink-0"
        style={{ backgroundColor: colorInfo.hex }}
      />
      <span className="flex-1 min-w-0">
        <span className="block font-mono text-sm text-foreground">
          {variable}
        </span>
        <span className="block text-xs text-muted-foreground truncate">
          {colorInfo.hex} • {colorInfo.name}
        </span>
      </span>
    </button>
  );
};

/**
 * Component theme preview showing all colors used in a theme
 */
const ComponentThemePreview: React.FC<{
  componentName: keyof ComponentThemes;
}> = ({ componentName }) => {
  const theme = useComponentTheme(componentName);

  const handleDebugColors = () => {
    debugComponentColors(componentName, "light");
  };

  return (
    <div className="p-4 rounded-lg bg-card border border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-card-foreground capitalize">
          {componentName.replace(/([A-Z])/g, " $1").trim()}
        </h3>
        <button
          onClick={handleDebugColors}
          className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
        >
          Debug in Console
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 text-xs">
        <div>
          <span className="font-medium text-muted-foreground">Primary BG:</span>
          <span className="ml-2 font-mono text-foreground">
            {theme.background.primary}
          </span>
        </div>
        <div>
          <span className="font-medium text-muted-foreground">
            Primary Text:
          </span>
          <span className="ml-2 font-mono text-foreground">
            {theme.text.primary}
          </span>
        </div>
        <div>
          <span className="font-medium text-muted-foreground">Border:</span>
          <span className="ml-2 font-mono text-foreground">
            {theme.border.default}
          </span>
        </div>
        <div>
          <span className="font-medium text-muted-foreground">Hover BG:</span>
          <span className="ml-2 font-mono text-foreground">
            {theme.background.hover}
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * ColorDebugger - Visual color reference and debugging tool
 *
 * Provides a comprehensive interface for understanding CSS variable colors
 * and debugging component themes. Shows actual color values, names, and
 * usage information for both light and dark themes.
 *
 * ⚠️ DEVELOPMENT ONLY: This component only renders in development mode
 *
 * @param {ColorDebuggerProps} props - Component props
 * @returns {React.ReactElement | null} The color debugger component
 */
export const ColorDebugger: React.FC<ColorDebuggerProps> = ({
  isVisible = false,
  onVisibilityChange,
}) => {
  const [activeTab, setActiveTab] = useState<"colors" | "components">("colors");
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark">("light");
  const [search, setSearch] = useState("");
  const filteredVariables = CSS_VARIABLES.filter((v) => v.includes(search));

  // Only render in development mode
  if (!IS_DEVELOPMENT || !isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-card-foreground">
              🎨 Color Debugger{" "}
              <span className="text-xs bg-status-edge-add text-node-test-text px-2 py-1 rounded">
                DEV
              </span>
            </h2>
            <div className="flex bg-muted rounded-md p-1">
              <button
                onClick={() => setActiveTab("colors")}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  activeTab === "colors"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Color Reference
              </button>
              <button
                onClick={() => setActiveTab("components")}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  activeTab === "components"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Component Themes
              </button>
            </div>
          </div>
          <button
            onClick={() => onVisibilityChange?.(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {activeTab === "colors" && (
            <div>
              {/* Theme & Search */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm font-medium text-card-foreground">
                  Theme:
                </span>
                <div className="flex bg-muted rounded-md p-1">
                  <button
                    onClick={() => setSelectedTheme("light")}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      selectedTheme === "light"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    🌞 Light
                  </button>
                  <button
                    onClick={() => setSelectedTheme("dark")}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      selectedTheme === "dark"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    🌙 Dark
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Filter…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="ml-4 px-3 py-1 text-sm bg-background border border-border rounded placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  aria-label="Filter variables"
                />
              </div>

              {/* Color Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredVariables.map((variable) => (
                  <ColorSwatch
                    key={variable}
                    variable={variable}
                    theme={selectedTheme}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === "components" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {COMPONENT_TYPES.map((componentName) => (
                <ComponentThemePreview
                  key={componentName}
                  componentName={componentName}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Hook to control the ColorDebugger visibility
 *
 * ⚠️ DEVELOPMENT ONLY: This hook only works in development mode
 *
 * @returns {object} Object with isVisible state and toggle function
 */
export const useColorDebugger = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggle = () => {
    if (!IS_DEVELOPMENT) {
      console.warn("🎨 Color Debugger is only available in development mode");
      return;
    }
    setIsVisible(!isVisible);
  };

  const show = () => {
    if (!IS_DEVELOPMENT) {
      console.warn("🎨 Color Debugger is only available in development mode");
      return;
    }
    setIsVisible(true);
  };

  const hide = () => setIsVisible(false);

  // Add keyboard shortcut (Ctrl/Cmd + Shift + C) - only in development
  useEffect(() => {
    if (!IS_DEVELOPMENT) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key === "C"
      ) {
        event.preventDefault();
        toggle();
      }

      // ESC to close
      if (event.key === "Escape" && isVisible) {
        hide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible]);

  return {
    isVisible: IS_DEVELOPMENT ? isVisible : false,
    toggle,
    show,
    hide,
    setIsVisible: IS_DEVELOPMENT ? setIsVisible : () => {},
  };
};

/**
 * QUICK ACCESS FUNCTIONS - Global functions for easy debugging
 *
 * ⚠️ DEVELOPMENT ONLY: These functions only work in development mode
 * These functions can be called from anywhere in your app or browser console
 * for quick color debugging without needing to import components.
 */

// Make functions available globally for console debugging - only in development
if (typeof window !== "undefined" && IS_DEVELOPMENT) {
  (window as any).showColorDebugger = () => {
    // Dispatch a custom event to show the debugger
    window.dispatchEvent(new CustomEvent("show-color-debugger"));
    console.log("🎨 Color Debugger opened (Development Mode)");
  };

  (window as any).debugColors = (componentName?: string) => {
    if (componentName) {
      // Import and use the debug function
      import("./colorDebugUtils").then(({ debugComponentColors }) => {
        // This is a simplified version - in practice you'd need the actual theme
        console.log(
          `🎨 Debug colors for ${componentName} - use the visual debugger for full details`
        );
        console.log("Call showColorDebugger() to open the visual interface");
      });
    } else {
      console.log("🎨 Available debug commands (Development Mode):");
      console.log("• showColorDebugger() - Opens the visual color debugger");
      console.log(
        '• debugColors("componentName") - Debug specific component colors'
      );
      console.log(
        "• Available components: actionToolbar, historyPanel, sidePanel, sidebarIcons, variantSelector, nodeInspector, miniMap"
      );
    }
  };

  // Log that debug functions are available
  console.log(
    "🎨 Color Debugger available! Use showColorDebugger() or Ctrl+Shift+C"
  );
} else if (typeof window !== "undefined" && !IS_DEVELOPMENT) {
  // In production, provide helpful messages
  (window as any).showColorDebugger = () => {
    console.log("🎨 Color Debugger is only available in development mode");
  };

  (window as any).debugColors = () => {
    console.log("🎨 Color debugging is only available in development mode");
  };
}
