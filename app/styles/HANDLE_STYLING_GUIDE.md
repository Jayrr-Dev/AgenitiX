/\*\*

- HANDLE STYLING GUIDE - Unified theming system for ReactFlow handles
-
- • Semantic token-based styling for consistent light/dark mode support
- • Type-specific colors and icons for visual data type distinction
- • Connection state awareness (connected, source, target)
- • Automatic positioning and spacing for multiple handles
- • Centralized configuration through tokens.json
-
- Keywords: handle-theming, reactflow-handles, semantic-tokens, type-safety, connection-visual-feedback
  \*/

# Handle Styling Guide - Unified Theming System

## 🎯 Overview

The handle system has been unified with the AgenitiX theming system to provide consistent, maintainable styling across all ReactFlow handles. This guide explains how to work with the new semantic token-based approach.

## 📍 Architecture

### **Token-Based Styling**

```
tokens.json → gen-tokens.ts → _generated_tokens.css (400 tokens)
                            ↓
            Handle Components: TypeSafeHandle.tsx
                            ↓
                ✅ Automatic light/dark mode switching
                ✅ Type-specific visual indicators
                ✅ Connection state awareness
                ✅ Consistent positioning and spacing
```

### **Key Components**

- **`tokens.json`** - Source of truth for handle colors and styling
- **`TypeSafeHandle.tsx`** - Main handle component with unified theming
- **`_generated_tokens.css`** - Generated CSS variables (400 total tokens)

## 🎨 Handle Token System

### **Background Colors**

```css
/* Light Theme */
--core-handle-bg-connected: 0 0% 0% / 0.5 /* Connected handles */
  --core-handle-bg-source: 0 0% 0% / 0.5 /* Source handles */
  --core-handle-bg-target: 0 0% 100% / 0.1 /* Target handles */ /* Dark Theme */
  --core-handle-bg-connected: 0 0% 100% / 0.3 /* Connected handles */
  --core-handle-bg-source: 0 0% 100% / 0.3 /* Source handles */
  --core-handle-bg-target: 0 0% 0% / 0.2 /* Target handles */;
```

### **Border & Shadow**

```css
/* Light Theme */
--core-handle-border: 0 0% 70% /* Default border */
  --core-handle-border-hover: 0 0% 60% /* Hover border */
  --core-handle-shadow: 0 0 0.5px 0.5px /* Shadow template */ /* Dark Theme */
  --core-handle-border: 0 0% 40% /* Default border */
  --core-handle-border-hover: 0 0% 50% /* Hover border */;
```

### **Text Colors**

```css
/* Light Theme */
--core-handle-text: 0 0% 15% /* Handle text/icons */ /* Dark Theme */
  --core-handle-text: 0 0% 85% /* Handle text/icons */;
```

## 🔧 Type-Specific Styling

### **Data Type Colors & Icons (Unified Token System)**

```typescript
const UNIFIED_TYPE_DISPLAY = {
  string: { icon: "T", tokenKey: "string" }, // Blue - semantic token
  number: { icon: "#", tokenKey: "number" }, // Orange - semantic token
  boolean: { icon: "✓", tokenKey: "boolean" }, // Green - semantic token
  object: { icon: "{}", tokenKey: "object" }, // Purple - semantic token
  array: { icon: "[]", tokenKey: "array" }, // Pink - semantic token
  any: { icon: "?", tokenKey: "any" }, // Gray - semantic token
  json: { icon: "J", tokenKey: "json" }, // Purple - semantic token
};
```

### **Type Code Mapping (Unified Token System)**

```typescript
const ULTIMATE_TYPE_MAP = {
  s: { tokenKey: "string", label: "string" }, // Blue via token
  n: { tokenKey: "number", label: "number" }, // Orange via token
  b: { tokenKey: "boolean", label: "boolean" }, // Green via token
  j: { tokenKey: "json", label: "json" }, // Purple via token
  a: { tokenKey: "array", label: "array" }, // Pink via token
  x: { tokenKey: "any", label: "any" }, // Gray via token
  V: { tokenKey: "vibe", label: "Vibe" }, // Purple via token
};
```

### **Type-Specific Token Colors**

| Type    | Light Theme          | Dark Theme           | Icon | Token Variable                      |
| ------- | -------------------- | -------------------- | ---- | ----------------------------------- |
| String  | Blue (214 100% 50%)  | Blue (214 100% 60%)  | T    | `--core-handle-types-string-color`  |
| Number  | Orange (25 100% 50%) | Orange (25 100% 60%) | #    | `--core-handle-types-number-color`  |
| Boolean | Green (142 76% 36%)  | Green (142 76% 46%)  | ✓    | `--core-handle-types-boolean-color` |
| Object  | Purple (262 83% 58%) | Purple (262 83% 68%) | {}   | `--core-handle-types-object-color`  |
| Array   | Pink (322 84% 60%)   | Pink (322 84% 70%)   | []   | `--core-handle-types-array-color`   |
| JSON    | Purple (262 83% 58%) | Purple (262 83% 68%) | J    | `--core-handle-types-json-color`    |
| Any     | Gray (0 0% 42%)      | Gray (0 0% 52%)      | ?    | `--core-handle-types-any-color`     |
| Vibe    | Purple (262 83% 58%) | Purple (262 83% 68%) | V    | `--core-handle-types-vibe-color`    |

## 🎯 Visual States

### **Connection States**

- **🔗 Connected**: Darker background, indicates active data flow
- **📤 Source**: Medium opacity, ready to output data
- **📥 Target**: Light background, ready to receive data

### **Interaction States**

- **🎯 Hover**: Slightly darker borders for feedback
- **✅ Valid Connection**: Green connection preview
- **❌ Invalid Connection**: Red connection preview + toast notification

## 🛠️ Configuration

### **Updating Handle Colors**

1. **Edit `tokens.json`**:

   ```json
   "handle": {
     "bg-connected": "0 0% 0% / 0.5",
     "bg-source": "0 0% 0% / 0.5",
     "bg-target": "0 0% 100% / 0.1",
     // ... other handle tokens
   }
   ```

2. **Regenerate tokens**:

   ```bash
   pnpm run generate:tokens
   ```

3. **Changes apply automatically** to all handles across the system

### **Handle Positioning Constants**

```typescript
const HANDLE_SIZE_PX = 10; // Handle size
const HANDLE_POSITION_OFFSET = 7.5; // Distance from node edge
const HANDLE_SPACING = 7.5; // Space between handles
```

## 🚀 Usage Examples

### **Basic Handle Usage**

```tsx
import TypeSafeHandle from "@/components/nodes/handles/TypeSafeHandle";

// In your node component
<TypeSafeHandle
  type="source"
  position="right"
  id="output"
  dataType="string"
  nodeId={nodeId}
/>;
```

### **Multiple Handles**

```tsx
// Automatic spacing for multiple handles on same side
{
  handles.map((handle, index) => (
    <TypeSafeHandle
      key={handle.id}
      type={handle.type}
      position={handle.position}
      id={handle.id}
      dataType={handle.dataType}
      nodeId={nodeId}
      handleIndex={index}
      totalHandlesOnSide={handlesOnThisSide.length}
    />
  ));
}
```

### **Custom Type Codes**

```tsx
// Using short type codes for efficiency
<TypeSafeHandle
  type="target"
  position="left"
  id="input"
  code="s|n" // Accepts string OR number
  nodeId={nodeId}
/>
```

## 🎨 Customization

### **Adding New Data Types**

1. **Add tokens to `tokens.json`**:

   ```json
   "handle": {
     // ... existing handle tokens
     "types": {
       // ... existing type tokens
       "myType": {
         "color": "15 100% 50%",
         "color-dark": "15 100% 60%"
       }
     }
   }
   ```

2. **Update `UNIFIED_TYPE_DISPLAY`** in `TypeSafeHandle.tsx`:

   ```typescript
   const UNIFIED_TYPE_DISPLAY = {
     // ... existing types
     myType: { icon: "M", tokenKey: "myType" },
   };
   ```

3. **Update `ULTIMATE_TYPE_MAP`**:

   ```typescript
   const ULTIMATE_TYPE_MAP = {
     // ... existing types
     m: { tokenKey: "myType", label: "myType" },
   };
   ```

4. **Add type descriptions**:

   ```typescript
   const TYPE_DESCRIPTIONS = {
     // ... existing descriptions
     m: "MyType - Custom data type description",
   };
   ```

5. **Regenerate tokens**:
   ```bash
   pnpm run generate:tokens
   ```

### **Modifying Handle Appearance**

```typescript
// In UNIFIED_HANDLE_STYLES
const UNIFIED_HANDLE_STYLES = {
  base: "flex items-center justify-center rounded-sm text-[6px] font-semibold uppercase select-none z-30",

  // Modify backgrounds to use different tokens
  backgrounds: {
    connected: "hsl(var(--core-handle-bg-connected))",
    source: "hsl(var(--core-handle-bg-source))",
    target: "hsl(var(--core-handle-bg-target))",
  },

  // Adjust border styling
  border: {
    width: 0,
    shadow: "var(--core-handle-shadow)",
  },
};
```

## 🔍 Debugging

### **Handle Visibility Issues**

- Check if handles are hidden by CSS: `[&_.react-flow__handle]:!opacity-0`
- Verify `pointerEvents: "all"` is set for interaction
- Ensure proper z-index with `z-30` class

### **Connection Problems**

- Verify `isValidConnection` function is working
- Check handle IDs include type information: `"handle-id__string|number"`
- Test type compatibility with union types

### **Styling Issues**

- Confirm tokens were regenerated after changes
- Check browser dev tools for CSS variable values
- Verify semantic token names match generated CSS

## 📊 Benefits

**✅ Unified Theming**: All handles use the same token system as nodes and UI components
**✅ Automatic Dark Mode**: Handles switch themes automatically with the app
**✅ Type Safety**: Visual indicators prevent incompatible connections
**✅ Maintainable**: Single source of truth in `tokens.json`
**✅ Accessible**: Tooltips and visual feedback for all handle states
**✅ Performance**: Hardware-accelerated CSS with minimal re-renders

## 🎯 Quick Reference

```typescript
// Handle token structure
"handle": {
  "bg-connected": "0 0% 0% / 0.5",      // Connected state background
  "bg-source": "0 0% 0% / 0.5",         // Source handle background
  "bg-target": "0 0% 100% / 0.1",       // Target handle background
  "border": "0 0% 70%",                 // Default border color
  "border-hover": "0 0% 60%",           // Hover border color
  "text": "0 0% 15%",                   // Text/icon color
  "shadow": "0 0 0.5px 0.5px",          // Shadow template
  // Dark theme variants with -dark suffix
  "types": {                            // Type-specific colors
    "string": {
      "color": "214 100% 50%",          // String type color (light)
      "color-dark": "214 100% 60%"      // String type color (dark)
    },
    "number": {
      "color": "25 100% 50%",           // Number type color (light)
      "color-dark": "25 100% 60%"       // Number type color (dark)
    },
    // ... other type colors
  }
}
```

---

**🔗 Happy connecting!** The unified handle system provides consistent, type-safe visual feedback for all data connections in AgenitiX.
