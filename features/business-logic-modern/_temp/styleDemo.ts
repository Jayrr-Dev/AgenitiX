// ============================================================================
// NODE STYLE DEMO - How to Use Centralized Styling
// ============================================================================

import {
  useNodeStyleStore,
  applyStylePreset,
  STYLE_PRESETS,
} from "../infrastructure/theming/stores/nodeStyleStore";

// ============================================================================
// EXAMPLE: How to change ALL node styles globally
// ============================================================================

// 1. Get the store instance
const styleStore = useNodeStyleStore.getState();

// 2. Update specific style aspects globally
export const demonstrateGlobalStyling = () => {
  // Make ALL hover effects more dramatic
  styleStore.updateHoverStyle({
    glow: "shadow-[0_0_6px_2px_rgba(255,255,255,0.5)]",
    scale: "scale-[1.01]",
  });

  // Make ALL activation effects more subtle
  styleStore.updateActivationStyle({
    glow: "shadow-[0_0_4px_1px_rgba(34,197,94,0.6)]",
    scale: "scale-[1.01]",
  });

  // Make ALL error effects more prominent
  styleStore.updateErrorStyle({
    glow: "shadow-[0_0_12px_4px_rgba(239,68,68,0.9)]",
    scale: "scale-[1.05]",
  });

  // Change selection glow to blue instead of white
  styleStore.updateSelectionStyle({
    glow: "shadow-[0_0_8px_2px_rgba(59,130,246,0.8)]",
  });

  // Speed up ALL transitions
  styleStore.updateBaseStyle({
    transition: "transition-all duration-100",
  });
};

// ============================================================================
// EXAMPLE: Apply preset styles
// ============================================================================

export const demonstratePresets = () => {
  // Apply subtle styling across all nodes
  applyStylePreset("subtle");

  // Or apply dramatic styling
  // applyStylePreset('dramatic')

  // Or apply minimal styling
  // applyStylePreset('minimal')
};

// ============================================================================
// EXAMPLE: Theme-based styling
// ============================================================================

export const applyDarkTheme = () => {
  styleStore.updateHoverStyle({
    glow: "shadow-[0_0_4px_1px_rgba(255,255,255,0.4)]",
  });

  styleStore.updateActivationStyle({
    glow: "shadow-[0_0_6px_2px_rgba(34,197,94,0.7)]",
  });

  styleStore.updateErrorStyle({
    glow: "shadow-[0_0_6px_2px_rgba(239,68,68,0.7)]",
  });
};

export const applyLightTheme = () => {
  styleStore.updateHoverStyle({
    glow: "shadow-[0_0_2px_0px_rgba(0,0,0,0.2)]",
  });

  styleStore.updateActivationStyle({
    glow: "shadow-[0_0_4px_1px_rgba(34,197,94,0.6)]",
  });

  styleStore.updateErrorStyle({
    glow: "shadow-[0_0_4px_1px_rgba(239,68,68,0.6)]",
  });
};

// ============================================================================
// EXAMPLE: Accessibility-focused styling
// ============================================================================

export const applyHighContrastMode = () => {
  styleStore.updateHoverStyle({
    glow: "shadow-[0_0_4px_2px_rgba(255,255,255,0.8)]",
  });

  styleStore.updateActivationStyle({
    glow: "shadow-[0_0_8px_3px_rgba(34,197,94,1)]",
    scale: "scale-[1.05]",
  });

  styleStore.updateErrorStyle({
    glow: "shadow-[0_0_8px_3px_rgba(239,68,68,1)]",
    scale: "scale-[1.05]",
  });

  styleStore.updateSelectionStyle({
    glow: "shadow-[0_0_6px_3px_rgba(255,255,255,1)]",
  });
};

// ============================================================================
// EXAMPLE: Performance-focused styling (no animations/effects)
// ============================================================================

export const applyPerformanceMode = () => {
  styleStore.updateHoverStyle({
    glow: "",
    scale: "",
  });

  styleStore.updateActivationStyle({
    glow: "",
    scale: "",
    border: "border-green-500",
  });

  styleStore.updateErrorStyle({
    glow: "",
    scale: "",
    border: "border-red-500",
  });

  styleStore.updateBaseStyle({
    transition: "transition-none",
  });
};

// ============================================================================
// EXAMPLE: Reset everything to defaults
// ============================================================================

export const resetToDefaults = () => {
  styleStore.resetToDefaults();
};

// ============================================================================
// EXAMPLE: Custom brand styling
// ============================================================================

export const applyBrandStyling = () => {
  // Use your brand colors
  styleStore.updateActivationStyle({
    glow: "shadow-[0_0_8px_2px_rgba(124,58,237,0.8)]", // Purple brand color
    border: "border-purple-300/60 dark:border-purple-400/50",
    buttonTheme: {
      border: "border-purple-400",
      hover: "hover:bg-purple-100 dark:hover:bg-purple-900",
    },
  });

  styleStore.updateSelectionStyle({
    glow: "shadow-[0_0_6px_2px_rgba(124,58,237,0.6)]", // Purple selection
  });
};

// ============================================================================
// USAGE IN COMPONENTS
// ============================================================================

/*
// In your main app or settings component:

import {
  demonstrateGlobalStyling,
  applyStylePreset,
  applyDarkTheme,
  resetToDefaults
} from './stores/styleDemo'

// Change all nodes at once:
const handleStyleChange = (styleType: string) => {
  switch(styleType) {
    case 'dramatic':
      applyStylePreset('dramatic')
      break
    case 'subtle':
      applyStylePreset('subtle')
      break
    case 'dark':
      applyDarkTheme()
      break
    case 'reset':
      resetToDefaults()
      break
    default:
      demonstrateGlobalStyling()
  }
}

// In your UI:
<select onChange={(e) => handleStyleChange(e.target.value)}>
  <option value="default">Default Styling</option>
  <option value="subtle">Subtle Effects</option>
  <option value="dramatic">Dramatic Effects</option>
  <option value="dark">Dark Theme</option>
  <option value="reset">Reset to Defaults</option>
</select>
*/
