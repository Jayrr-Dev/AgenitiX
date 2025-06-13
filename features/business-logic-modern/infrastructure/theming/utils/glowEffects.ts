/**
 * GLOW EFFECTS UTILITIES - Semantic token-based node glow customization
 * 
 * This file provides simple functions to adjust node glow effects using
 * semantic design tokens. All glow effects now use CSS custom properties
 * defined in the @theme block for consistency and maintainability.
 * 
 * @example
 * ```typescript
 * // Make selection glow stronger (uses semantic token)
 * setStrongSelectionGlow();
 * 
 * // Use a blue glow for selection (uses semantic token)
 * setBlueSelectionGlow();
 * 
 * // Create custom glow (for advanced scenarios)
 * setCustomSelectionGlow(12, 3, "255,0,255", 0.9); // Purple glow
 * ```
 * 
 * Keywords: glow-effects, semantic-tokens, node-styling, browser-console
 */

import { useNodeStyleStore, createGlowEffect, GLOW_PRESETS } from "../stores/nodeStyleStore";

// ============================================================================
// QUICK GLOW ADJUSTMENT FUNCTIONS
// ============================================================================

/**
 * Set selection glow to subtle (less prominent)
 */
export const setSubtleSelectionGlow = () => {
  useNodeStyleStore.getState().setSelectionGlow("subtle");
  console.log("🎨 Selection glow set to subtle");
};

/**
 * Set selection glow to normal (default)
 */
export const setNormalSelectionGlow = () => {
  useNodeStyleStore.getState().setSelectionGlow("normal");
  console.log("🎨 Selection glow set to normal");
};

/**
 * Set selection glow to strong (very prominent)
 */
export const setStrongSelectionGlow = () => {
  useNodeStyleStore.getState().setSelectionGlow("strong");
  console.log("🎨 Selection glow set to strong");
};

/**
 * Set selection glow to blue
 */
export const setBlueSelectionGlow = () => {
  useNodeStyleStore.getState().setSelectionGlow("blue");
  console.log("🎨 Selection glow set to blue");
};

/**
 * Set selection glow to green
 */
export const setGreenSelectionGlow = () => {
  useNodeStyleStore.getState().setSelectionGlow("green");
  console.log("🎨 Selection glow set to green");
};

/**
 * Set selection glow to red
 */
export const setRedSelectionGlow = () => {
  useNodeStyleStore.getState().setSelectionGlow("red");
  console.log("🎨 Selection glow set to red");
};

// ============================================================================
// CUSTOM GLOW CREATION
// ============================================================================

/**
 * Create a custom selection glow with specific parameters
 * 
 * @param blurRadius - How soft/spread the glow is (default: 8)
 * @param spreadRadius - How far the glow extends (default: 2)
 * @param color - RGB color as string "r,g,b" (default: "255,255,255")
 * @param opacity - Alpha transparency 0-1 (default: 0.8)
 * 
 * @example
 * ```typescript
 * // Purple glow
 * setCustomSelectionGlow(10, 3, "128,0,128", 0.9);
 * 
 * // Bright white glow
 * setCustomSelectionGlow(15, 4, "255,255,255", 1.0);
 * ```
 */
export const setCustomSelectionGlow = (
  blurRadius: number = 8,
  spreadRadius: number = 2,
  color: string = "255,255,255",
  opacity: number = 0.8
) => {
  const customGlow = createGlowEffect(blurRadius, spreadRadius, color, opacity);
  useNodeStyleStore.getState().setSelectionGlow(customGlow);
  console.log(`🎨 Custom selection glow applied: blur=${blurRadius}, spread=${spreadRadius}, color=${color}, opacity=${opacity}`);
};

/**
 * Create a custom hover glow with specific parameters
 */
export const setCustomHoverGlow = (
  blurRadius: number = 4,
  spreadRadius: number = 1,
  color: string = "255,255,255",
  opacity: number = 0.4
) => {
  const customGlow = createGlowEffect(blurRadius, spreadRadius, color, opacity);
  useNodeStyleStore.getState().setHoverGlow(customGlow);
  console.log(`🎨 Custom hover glow applied: blur=${blurRadius}, spread=${spreadRadius}, color=${color}, opacity=${opacity}`);
};

// ============================================================================
// PRESET COLLECTIONS
// ============================================================================

/**
 * Apply a themed glow set (selection + hover)
 */
export const applyGlowTheme = (theme: "default" | "strong" | "subtle" | "colorful") => {
  switch (theme) {
    case "default":
      setNormalSelectionGlow();
      useNodeStyleStore.getState().setHoverGlow("subtle");
      break;
    case "strong":
      setStrongSelectionGlow();
      useNodeStyleStore.getState().setHoverGlow("normal");
      break;
    case "subtle":
      setSubtleSelectionGlow();
      setCustomHoverGlow(2, 0, "255,255,255", 0.2);
      break;
    case "colorful":
      setBlueSelectionGlow();
      setCustomHoverGlow(4, 1, "59,130,246", 0.3);
      break;
  }
  console.log(`🎨 Applied glow theme: ${theme}`);
};

// ============================================================================
// DEBUGGING AND TESTING
// ============================================================================

/**
 * Test all glow presets (cycles through them with delays)
 * Useful for finding the perfect glow effect
 */
export const testAllGlowPresets = async () => {
  const presets = Object.keys(GLOW_PRESETS) as Array<keyof typeof GLOW_PRESETS>;
  
  console.log("🧪 Testing all glow presets...");
  
  for (const preset of presets) {
    console.log(`🎨 Testing preset: ${preset}`);
    useNodeStyleStore.getState().setSelectionGlow(preset);
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
  }
  
  // Reset to normal
  setNormalSelectionGlow();
  console.log("🧪 Glow preset testing complete - reset to normal");
};

/**
 * Get current glow settings for debugging
 */
export const getCurrentGlowSettings = () => {
  const state = useNodeStyleStore.getState();
  return {
    selection: state.selection.glow,
    hover: state.hover.glow,
    activation: state.activation.glow,
    error: state.error.glow,
  };
};

// ============================================================================
// BROWSER CONSOLE HELPERS
// ============================================================================

// Make functions available in browser console for easy testing
if (typeof window !== "undefined") {
  (window as any).glowUtils = {
    setSubtle: setSubtleSelectionGlow,
    setNormal: setNormalSelectionGlow,
    setStrong: setStrongSelectionGlow,
    setBlue: setBlueSelectionGlow,
    setGreen: setGreenSelectionGlow,
    setRed: setRedSelectionGlow,
    setCustom: setCustomSelectionGlow,
    applyTheme: applyGlowTheme,
    testAll: testAllGlowPresets,
    getCurrent: getCurrentGlowSettings,
  };
  
  console.log("🎨 Glow utilities available in console as 'glowUtils'");
  console.log("   Try: glowUtils.setStrong() or glowUtils.setBlue()");
} 