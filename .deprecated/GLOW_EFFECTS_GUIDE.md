/\*\*

- GLOW EFFECTS GUIDE - Configuration and customization for node selection glow effects
-
- • Quick browser console utilities for real-time glow adjustments
- • Code-based configuration in nodeStyleStore.ts
- • Built-in presets (subtle, normal, strong, colored variants)
- • Custom glow creation with blur, spread, color, and opacity controls
- • Performance considerations and troubleshooting tips
-
- Keywords: glow-effects, node-selection, visual-feedback, tailwind-shadows, real-time-adjustment
  \*/

# Node Glow Effects - Configuration Guide

## 🎯 Overview

This guide explains how to find and adjust the white glow effect that appears when nodes are selected. The glow system is designed to be maintainable and easy to customize.

## 📍 Where to Find Glow Settings

### **Main Configuration File**

```
features/business-logic-modern/infrastructure/theming/stores/nodeStyleStore.ts
```

Look for the `GLOW_EFFECTS` constant at the top of the file - this is where all glow effects are defined.

### **Utility Functions**

```
features/business-logic-modern/infrastructure/theming/utils/glowEffects.ts
```

Contains helper functions for easy glow adjustments.

## ⚡ Quick Adjustments

### **1. Browser Console (Fastest)**

Open browser console and use the built-in utilities:

```javascript
// Make selection glow stronger
glowUtils.setStrong();

// Use different colors
glowUtils.setBlue();
glowUtils.setGreen();
glowUtils.setRed();

// Make it more subtle
glowUtils.setSubtle();

// Create custom glow (blur, spread, color, opacity)
glowUtils.setCustom(12, 3, "255,0,255", 0.9); // Purple glow

// Test all presets automatically
glowUtils.testAll();
```

### **2. Code Changes**

Edit the `GLOW_EFFECTS` object in `nodeStyleStore.ts`:

```typescript
const GLOW_EFFECTS = {
  // Current selection glow (enhanced from original)
  selection: "shadow-[0_0_8px_2px_rgba(255,255,255,0.8)]",

  // Make it stronger:
  // selection: "shadow-[0_0_12px_3px_rgba(255,255,255,1.0)]",

  // Make it more subtle:
  // selection: "shadow-[0_0_4px_1px_rgba(255,255,255,0.6)]",

  // Change color to blue:
  // selection: "shadow-[0_0_8px_2px_rgba(59,130,246,0.8)]",
};
```

## 🎨 Glow Format Explanation

The glow uses Tailwind's shadow format:

```
shadow-[offsetX_offsetY_blurRadius_spreadRadius_rgba(r,g,b,opacity)]
```

- **offsetX/Y**: Shadow position (usually `0_0` for centered glow)
- **blurRadius**: How soft/spread the glow is (higher = more diffuse)
- **spreadRadius**: How far the glow extends (higher = larger glow)
- **rgba**: Color with transparency

### **Examples:**

```typescript
// Subtle white glow
"shadow-[0_0_4px_1px_rgba(255,255,255,0.4)]";

// Strong white glow
"shadow-[0_0_12px_3px_rgba(255,255,255,1.0)]";

// Blue glow
"shadow-[0_0_8px_2px_rgba(59,130,246,0.8)]";

// Purple glow
"shadow-[0_0_10px_3px_rgba(128,0,128,0.9)]";
```

## 🔧 Available Presets

The system includes several built-in presets:

```typescript
GLOW_PRESETS = {
  subtle: "shadow-[0_0_4px_1px_rgba(255,255,255,0.4)]",
  normal: "shadow-[0_0_8px_2px_rgba(255,255,255,0.8)]",
  strong: "shadow-[0_0_12px_3px_rgba(255,255,255,1.0)]",
  blue: "shadow-[0_0_8px_2px_rgba(59,130,246,0.8)]",
  green: "shadow-[0_0_8px_2px_rgba(34,197,94,0.8)]",
  red: "shadow-[0_0_8px_2px_rgba(239,68,68,0.8)]",
};
```

## 🛠️ Programmatic Usage

### **In React Components:**

```typescript
import {
  setStrongSelectionGlow,
  setCustomSelectionGlow,
} from "@/path/to/glowEffects";

// Use preset
setStrongSelectionGlow();

// Create custom
setCustomSelectionGlow(10, 3, "255,0,255", 0.9);
```

### **Using the Store Directly:**

```typescript
import { useNodeStyleStore } from "@/path/to/nodeStyleStore";

// Use preset
useNodeStyleStore.getState().setSelectionGlow("strong");

// Use custom string
useNodeStyleStore
  .getState()
  .setSelectionGlow("shadow-[0_0_15px_4px_rgba(255,255,255,1.0)]");
```

## 🎯 Current Enhancement

The selection glow has been enhanced from the original:

- **Before**: `shadow-[0_0_4px_1px_rgba(255,255,255,0.6)]`
- **After**: `shadow-[0_0_8px_2px_rgba(255,255,255,0.8)]`

This provides a more prominent white glow that's easier to see when nodes are selected.

## 🧪 Testing Different Effects

1. **Browser Console Method** (Recommended):

   ```javascript
   glowUtils.testAll(); // Cycles through all presets
   ```

2. **Manual Testing**:

   - Select a node in the flow editor
   - Open browser console
   - Try different glow utilities
   - See changes in real-time

3. **Code Testing**:
   - Modify `GLOW_EFFECTS.selection` in the store
   - Save the file
   - Select a node to see the new effect

## 📝 Notes

- Changes take effect immediately when using browser console utilities
- Code changes require a file save and may need a browser refresh
- The glow system works with both light and dark themes
- All glow effects are hardware-accelerated CSS shadows for smooth performance

## 🔍 Troubleshooting

**Glow not visible?**

- Check if the node is actually selected
- Try a stronger preset: `glowUtils.setStrong()`
- Ensure contrast with your background

**Want different colors?**

- Use color presets: `glowUtils.setBlue()`
- Create custom colors: `glowUtils.setCustom(8, 2, "your,rgb,values", 0.8)`

**Performance issues?**

- Reduce blur radius and spread radius
- Lower opacity values
- Use simpler glow effects

## 🚀 Quick Reference Commands

```javascript
// Browser Console Quick Commands
glowUtils.setSubtle(); // Soft glow
glowUtils.setStrong(); // Prominent glow
glowUtils.setBlue(); // Blue selection glow
glowUtils.setGreen(); // Green selection glow
glowUtils.setRed(); // Red selection glow
glowUtils.testAll(); // Cycle through all presets
glowUtils.setCustom(blur, spread, "r,g,b", opacity); // Custom glow
```

---

**🎨 Happy glowing!** This system provides both quick console adjustments and permanent code changes for perfect node selection feedback.
