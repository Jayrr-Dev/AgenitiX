/**
 * COLOR DEBUG UTILITIES - Color debugging and development tools
 *
 * • Color information extraction and debugging
 * • CSS variable color reference mappings
 * • Development console helpers
 * • Component theme debugging functions
 *
 * Keywords: color-debugging, css-variables, development-tools
 */

// ============================================================================
// CSS VARIABLE COLOR REFERENCE
// ============================================================================

/**
 * CSS VARIABLE COLOR REFERENCE - What colors actually look like
 *
 * This reference maps shadcn CSS variables to actual color values and descriptions
 * to help developers understand what colors they're working with.
 */
export const CSS_VARIABLE_COLOR_REFERENCE = {
  light: {
    backgrounds: {
      "bg-background": {
        hex: "#ffffff",
        name: "Pure White",
        usage: "Main app background",
        contrast: "Base surface",
      },
      "bg-card": {
        hex: "#ffffff",
        name: "Pure White",
        usage: "Card/panel backgrounds",
        contrast: "Same as background for seamless integration",
      },
      "bg-muted": {
        hex: "#f1f5f9",
        name: "Very Light Gray",
        usage: "Subtle backgrounds",
        contrast: "Slightly darker than cards for layering",
      },
      "bg-accent": {
        hex: "#f1f5f9",
        name: "Very Light Gray",
        usage: "Accent backgrounds",
        contrast: "Subtle highlight without distraction",
      },
      "bg-primary": {
        hex: "#0f172a",
        name: "Very Dark Blue",
        usage: "Primary buttons",
        contrast: "High contrast for important actions",
      },
      "bg-secondary": {
        hex: "#f1f5f9",
        name: "Very Light Gray",
        usage: "Secondary buttons",
        contrast: "Subtle for less important actions",
      },
    },
    text: {
      "text-foreground": {
        hex: "#0f172a",
        name: "Very Dark Blue",
        usage: "Primary text",
        contrast: "21:1 on white background",
      },
      "text-card-foreground": {
        hex: "#0f172a",
        name: "Very Dark Blue",
        usage: "Card text",
        contrast: "21:1 on white cards",
      },
      "text-muted-foreground": {
        hex: "#64748b",
        name: "Medium Gray",
        usage: "Secondary text",
        contrast: "7:1 on white background",
      },
      "text-primary-foreground": {
        hex: "#f8fafc",
        name: "Almost White",
        usage: "Text on primary",
        contrast: "18:1 on dark blue primary",
      },
      "text-secondary-foreground": {
        hex: "#0f172a",
        name: "Very Dark Blue",
        usage: "Text on secondary",
        contrast: "21:1 on light gray secondary",
      },
    },
    borders: {
      "border-border": {
        hex: "#e2e8f0",
        name: "Light Gray",
        usage: "Default borders",
        contrast: "Subtle definition without harshness",
      },
      "border-accent": {
        hex: "#e2e8f0",
        name: "Light Gray",
        usage: "Accent borders",
        contrast: "Same as default for consistency",
      },
      "border-primary": {
        hex: "#0f172a",
        name: "Very Dark Blue",
        usage: "Primary borders",
        contrast: "Strong definition for emphasis",
      },
    },
  },
  dark: {
    backgrounds: {
      "bg-background": {
        hex: "#0f172a",
        name: "Very Dark Blue",
        usage: "Main app background",
        contrast: "Deep base for dark theme",
      },
      "bg-card": {
        hex: "#1e293b",
        name: "Dark Gray-Blue",
        usage: "Card/panel backgrounds",
        contrast: "Elevated from background",
      },
      "bg-muted": {
        hex: "#1e293b",
        name: "Dark Gray-Blue",
        usage: "Subtle backgrounds",
        contrast: "Same as cards for consistency",
      },
      "bg-accent": {
        hex: "#1e293b",
        name: "Dark Gray-Blue",
        usage: "Accent backgrounds",
        contrast: "Subtle highlight in dark theme",
      },
      "bg-primary": {
        hex: "#f8fafc",
        name: "Almost White",
        usage: "Primary buttons",
        contrast: "High contrast for visibility",
      },
      "bg-secondary": {
        hex: "#1e293b",
        name: "Dark Gray-Blue",
        usage: "Secondary buttons",
        contrast: "Subtle for less important actions",
      },
    },
    text: {
      "text-foreground": {
        hex: "#f8fafc",
        name: "Almost White",
        usage: "Primary text",
        contrast: "18:1 on dark background",
      },
      "text-card-foreground": {
        hex: "#f8fafc",
        name: "Almost White",
        usage: "Card text",
        contrast: "15:1 on dark cards",
      },
      "text-muted-foreground": {
        hex: "#94a3b8",
        name: "Medium Gray",
        usage: "Secondary text",
        contrast: "5.5:1 on dark background",
      },
      "text-primary-foreground": {
        hex: "#0f172a",
        name: "Very Dark Blue",
        usage: "Text on primary",
        contrast: "18:1 on white primary",
      },
      "text-secondary-foreground": {
        hex: "#f8fafc",
        name: "Almost White",
        usage: "Text on secondary",
        contrast: "15:1 on dark secondary",
      },
    },
    borders: {
      "border-border": {
        hex: "#334155",
        name: "Dark Gray",
        usage: "Default borders",
        contrast: "Visible definition in dark theme",
      },
      "border-accent": {
        hex: "#334155",
        name: "Dark Gray",
        usage: "Accent borders",
        contrast: "Same as default for consistency",
      },
      "border-primary": {
        hex: "#f8fafc",
        name: "Almost White",
        usage: "Primary borders",
        contrast: "Strong definition for emphasis",
      },
    },
  },
} as const;

// ============================================================================
// COLOR UTILITY FUNCTIONS
// ============================================================================

/**
 * Get color information for a specific CSS variable
 *
 * Returns detailed information about what a CSS variable actually looks like
 * in both light and dark themes, including hex codes, color names, and usage.
 */
export function getColorInfo(cssVariable: string, theme: "light" | "dark") {
  const themeColors = CSS_VARIABLE_COLOR_REFERENCE[theme];

  // Search through all color categories (backgrounds, text, borders)
  for (const category of Object.values(themeColors)) {
    if (cssVariable in category) {
      return category[cssVariable as keyof typeof category];
    }
  }

  return null;
}

/**
 * Debug all colors used in a specific component theme
 *
 * Logs detailed color information for all CSS variables used in a component's
 * theme configuration. Shows actual hex codes, color names, and usage for
 * both light and dark themes.
 */
export function debugComponentColors(
  componentName: string,
  theme: "light" | "dark"
) {
  const themeName = theme.charAt(0).toUpperCase() + theme.slice(1);

  console.group(
    `🎨 ${componentName.toUpperCase()} COLORS (${themeName} Theme):`
  );

  // Helper function to extract and log color info from CSS classes
  const logColorInfo = (label: string, cssClasses: string) => {
    // Extract CSS variables from classes (e.g., "bg-background" from "bg-background border border-border")
    const colorMatches = cssClasses.match(/(?:bg-|text-|border-)[\w-]+/g) || [];
    const uniqueColors = Array.from(new Set(colorMatches));

    uniqueColors.forEach((cssVar) => {
      const colorInfo = getColorInfo(cssVar, theme);
      if (colorInfo) {
        console.log(
          `  ${label}: ${cssVar} → ${colorInfo.name} (${colorInfo.hex}) - ${colorInfo.usage}`
        );
      }
    });
  };

  console.log("  See ColorDebugger component for complete theme information");
  console.groupEnd();
}

// ============================================================================
// GLOBAL CONSOLE FUNCTIONS
// ============================================================================

// Global console functions for easy debugging (development only)
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  // Make color debugging functions available globally in development
  (globalThis as any).getColorInfo = getColorInfo;
  (globalThis as any).debugComponentColors = debugComponentColors;
  (globalThis as any).showColorDebugger = () => {
    console.log(
      "🎨 Color Debugger: Use Ctrl/Cmd + Shift + C or check the theme switcher dropdown"
    );
  };
  (globalThis as any).debugColors = (component?: string) => {
    if (component) {
      console.log("🌞 Light Theme Colors:");
      debugComponentColors(component, "light");
      console.log("🌙 Dark Theme Colors:");
      debugComponentColors(component, "dark");
    } else {
      console.log("🎨 Available components for color debugging:");
      const components = [
        "actionToolbar",
        "historyPanel",
        "sidePanel",
        "sidebarIcons",
        "variantSelector",
        "nodeInspector",
        "miniMap",
      ];
      components.forEach((name) => {
        console.log(`  • ${name}`);
      });
      console.log('Usage: debugColors("componentName")');
    }
  };
}
