# 🌟 Glow System Documentation

## Overview

This document provides a comprehensive guide to the **Visual Glow Feedback System** in the Agenix Visual Flow Editor. The glow system uses CSS box-shadow effects to provide real-time visual feedback about node states, creating an intuitive and responsive user experience.

---

## 🎯 Core Concept

The glow system is a **state-driven visual feedback mechanism** that uses colored glows around nodes to communicate their current operational status:

```
🟢 GREEN GLOW   = Node is actively processing meaningful data
🔴 RED GLOW     = Node has an error condition  
⚪ WHITE GLOW   = Node is selected by user
🌫️ SUBTLE GLOW = Node is being hovered over
```

---

## 🏗️ Architecture Overview

### **Centralized Style Management**

The glow system is built on a **Zustand store** that provides centralized, reactive style management:

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTIONS                        │
│              (clicks, data changes, errors)                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                NODE STATE EVALUATION                        │
│         (isActive, isError, isSelected detection)           │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                STYLE STORE (ZUSTAND)                        │
│            (Centralized glow configurations)                │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              STYLE HOOKS APPLICATION                        │
│           (useNodeStyleClasses, useNodeButtonTheme)         │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                CSS GLOW RENDERING                           │
│            (Tailwind box-shadow utilities)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Glow State Definitions

### **1. Activation Glow (Green)**
**Location**: `features/business-logic/stores/nodeStyleStore.ts`

```typescript
activation: {
  glow: 'shadow-[0_0_8px_2px_rgba(34,197,94,0.8)]',  // Green glow
  border: 'border-green-300/60 dark:border-green-400/50',
  scale: 'scale-[1.02]',  // Slight size increase
  buttonTheme: {
    border: 'border-green-400',
    hover: 'hover:bg-green-100 dark:hover:bg-green-900'
  }
}
```

**Triggers When**:
- Node has meaningful output data (`text`, `value`, `output`, `result`)
- Connected triggers allow data flow (or no triggers connected)
- Node is successfully processing data

### **2. Error Glow (Red)**

```typescript
error: {
  glow: 'shadow-[0_0_8px_2px_rgba(239,68,68,0.8)]',  // Red glow
  border: 'border-red-300/60 dark:border-red-400/50',
  scale: 'scale-[1.02]',
  buttonTheme: {
    border: 'border-red-400',
    hover: 'hover:bg-red-100 dark:hover:bg-red-900'
  },
  textTheme: {
    primary: 'text-red-900 dark:text-red-100',
    secondary: 'text-red-800 dark:text-red-200',
    border: 'border-red-300 dark:border-red-700',
    focus: 'focus:ring-red-500'
  }
}
```

**Triggers When**:
- Node encounters processing errors
- Invalid input data causes exceptions
- Vibe Mode error injection is active
- Connection validation failures

### **3. Selection Glow (White)**

```typescript
selection: {
  glow: 'shadow-[0_0_4px_1px_rgba(255,255,255,0.6)]',  // White glow
  border: 'border-blue-500',  // Optional blue border
  scale: 'scale-[1.01]'       // Subtle size increase
}
```

**Triggers When**:
- User clicks on a node
- Node is programmatically selected
- Node Inspector is focused on the node

### **4. Hover Glow (Subtle)**

```typescript
hover: {
  glow: 'shadow-[0_0_3px_0px_rgba(255,255,255,0.3)]',  // Subtle white glow
  scale: 'scale-[1.005]'  // Very slight size increase
}
```

**Triggers When**:
- Mouse cursor hovers over node
- Touch interaction on mobile devices
- Keyboard navigation focuses on node

---

## ⚡ Activation Logic Deep Dive

### **Green Glow Activation Process**
**Location**: `features/business-logic/nodes/factory/NodeFactory.tsx`

The green glow follows a **two-factor authentication** model:

#### **Factor 1: Meaningful Output Detection**

```typescript
const hasOutputData = (() => {
  const currentData = data as T;
  
  // Priority order for value extraction
  const outputValue = currentData?.text !== undefined ? currentData.text :
                     currentData?.value !== undefined ? currentData.value :
                     currentData?.output !== undefined ? currentData.output :
                     currentData?.result !== undefined ? currentData.result :
                     undefined;
  
  // Only activate if there's actual meaningful output
  return outputValue !== undefined && outputValue !== null && outputValue !== '';
})();
```

#### **Factor 2: Trigger Permission Check**

```typescript
const triggerInfo = (() => {
  // Filter for trigger connections (boolean handle 'b')
  const triggerConnections = memoizedConnections.filter(c => c.targetHandle === 'b');
  const hasTrigger = triggerConnections.length > 0;
  
  if (!hasTrigger) {
    return true; // No trigger = always allow data
  }
  
  // Get trigger value from connected trigger nodes
  const triggerSourceIds = triggerConnections.map(c => c.source);
  const triggerNodesData = memoizedNodesData.filter(node => 
    triggerSourceIds.includes(node.id)
  );
  
  const triggerValue = getSingleInputValue(triggerNodesData);
  return isTruthyValue(triggerValue);
})();
```

#### **Final Activation Decision**

```typescript
// Final isActive state: has meaningful output AND trigger allows data
const finalIsActive = hasOutputData && triggerInfo;
setIsActive(finalIsActive); // ← This triggers the GREEN GLOW
```

---

## 🎛️ Style Application System

### **Style Hook Architecture**

#### **Primary Style Hook**
```typescript
export const useNodeStyleClasses = (
  isSelected: boolean, 
  isError: boolean, 
  isActive: boolean
) => {
  const styles = useNodeStyleStore()
  
  const getStateStyles = () => {
    // Priority order (highest to lowest)
    if (isSelected) {
      return `${styles.selection.glow} ${styles.selection.border || ''} ${styles.selection.scale || ''}`
    }
    if (isError) {
      return `${styles.error.glow} ${styles.error.border} ${styles.error.scale || ''}`
    }
    if (isActive) {
      return `${styles.activation.glow} ${styles.activation.border} ${styles.activation.scale || ''}`
    }
    return `hover:${styles.hover.glow.replace('shadow-', '')} ${styles.hover.border || ''} ${styles.hover.scale || ''}`
  }
  
  return `${styles.base.transition} ${getStateStyles()}`.trim()
}
```

#### **Button Theme Hook**
```typescript
export const useNodeButtonTheme = (isError: boolean, isActive: boolean) => {
  const styles = useNodeStyleStore()
  
  if (isError) {
    return `${styles.error.buttonTheme.border} ${styles.error.buttonTheme.hover}`
  }
  if (isActive) {
    return `${styles.activation.buttonTheme.border} ${styles.activation.buttonTheme.hover}`
  }
  return 'border-blue-300 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-800'
}
```

#### **Text Theme Hook**
```typescript
export const useNodeTextTheme = (isError: boolean) => {
  const styles = useNodeStyleStore()
  
  if (isError) {
    return styles.error.textTheme
  }
  return {
    primary: 'text-gray-900 dark:text-gray-100',
    secondary: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-300 dark:border-gray-700',
    focus: 'focus:ring-blue-500'
  }
}
```

---

## 🔄 Real-Time Glow Updates

### **Data Flow Sequence**

1. **User Interaction**
   - Text input, button click, toggle switch
   - Triggers node data update

2. **Node Data Update**
   - `updateNodeData(id, newData)` called
   - Zustand store updates immediately

3. **Factory Re-evaluation**
   - `useEffect` triggers on data/connection changes
   - Meaningful output detection runs
   - Trigger permission check runs

4. **State Update**
   - `setIsActive(finalIsActive)` called
   - Local component state updates

5. **Style Hook Reaction**
   - `useNodeStyleClasses` recalculates
   - New CSS classes determined

6. **Visual Update**
   - React re-renders with new classes
   - CSS transitions animate the change
   - Glow appears/disappears smoothly

### **Performance Optimizations**

#### **Memoized Dependencies**
```typescript
// Prevent unnecessary re-evaluations
const memoizedConnections = useMemo(() => connections, [
  JSON.stringify(connections)
]);

const memoizedNodesData = useMemo(() => nodesData, [
  JSON.stringify(nodesData)
]);
```

#### **Selective Zustand Subscriptions**
```typescript
// Only subscribe to specific store slices
const updateNodeData = useFlowStore((state) => state.updateNodeData);
const selectedNodeId = useFlowStore((state) => state.selectedNodeId);
```

#### **Efficient CSS Transitions**
```typescript
base: {
  transition: 'transition-all duration-200'  // Smooth 200ms transitions
}
```

---

## 🎨 CSS Implementation Details

### **Tailwind Box-Shadow Utilities**

#### **Green Activation Glow**
```css
.shadow-[0_0_8px_2px_rgba(34,197,94,0.8)] {
  box-shadow: 0 0 8px 2px rgba(34, 197, 94, 0.8);
  /*          ↑ ↑ ↑   ↑   ↑
              x y blur spread color (green with 80% opacity) */
}
```

#### **Red Error Glow**
```css
.shadow-[0_0_8px_2px_rgba(239,68,68,0.8)] {
  box-shadow: 0 0 8px 2px rgba(239, 68, 68, 0.8);
  /*          ↑ ↑ ↑   ↑   ↑
              x y blur spread color (red with 80% opacity) */
}
```

#### **White Selection Glow**
```css
.shadow-[0_0_4px_1px_rgba(255,255,255,0.6)] {
  box-shadow: 0 0 4px 1px rgba(255, 255, 255, 0.6);
  /*          ↑ ↑ ↑   ↑   ↑
              x y blur spread color (white with 60% opacity) */
}
```

### **Additional Visual Effects**

#### **Scale Transformations**
```css
.scale-[1.02] {
  transform: scale(1.02);  /* 2% size increase */
}

.scale-[1.01] {
  transform: scale(1.01);  /* 1% size increase */
}
```

#### **Border Enhancements**
```css
.border-green-300/60 {
  border-color: rgb(134 239 172 / 0.6);  /* Green border with 60% opacity */
}

.border-red-300/60 {
  border-color: rgb(252 165 165 / 0.6);  /* Red border with 60% opacity */
}
```

---

## 🛠️ Customization System

### **Global Style Updates**

#### **Programmatic Style Changes**
```typescript
import { useNodeStyleStore } from '../stores/nodeStyleStore'

const store = useNodeStyleStore.getState()

// Make activation glow more dramatic
store.updateActivationStyle({
  glow: 'shadow-[0_0_12px_4px_rgba(34,197,94,0.9)]',
  scale: 'scale-[1.05]'
})

// Change activation color to blue
store.updateActivationStyle({
  glow: 'shadow-[0_0_8px_2px_rgba(59,130,246,0.8)]',
  border: 'border-blue-300/60 dark:border-blue-400/50'
})

// Customize error styling
store.updateErrorStyle({
  glow: 'shadow-[0_0_10px_3px_rgba(239,68,68,1.0)]',
  scale: 'scale-[1.03]'
})
```

#### **Style Presets**
```typescript
import { applyStylePreset } from '../stores/nodeStyleStore'

// Apply predefined style configurations
applyStylePreset('subtle')    // Gentle, minimal effects
applyStylePreset('dramatic')  // Strong, prominent glows  
applyStylePreset('minimal')   // Barely visible effects
```

### **Preset Configurations**

#### **Subtle Preset**
```typescript
subtle: {
  hover: { glow: 'shadow-[0_0_2px_0px_rgba(255,255,255,0.2)]' },
  activation: { glow: 'shadow-[0_0_6px_1px_rgba(34,197,94,0.6)]' },
  error: { glow: 'shadow-[0_0_6px_1px_rgba(239,68,68,0.6)]' }
}
```

#### **Dramatic Preset**
```typescript
dramatic: {
  hover: { glow: 'shadow-[0_0_6px_2px_rgba(255,255,255,0.5)]' },
  activation: { 
    glow: 'shadow-[0_0_12px_4px_rgba(34,197,94,0.9)]', 
    scale: 'scale-[1.05]' 
  },
  error: { 
    glow: 'shadow-[0_0_12px_4px_rgba(239,68,68,0.9)]', 
    scale: 'scale-[1.05]' 
  }
}
```

#### **Minimal Preset**
```typescript
minimal: {
  hover: { glow: 'shadow-[0_0_1px_0px_rgba(255,255,255,0.4)]' },
  activation: { 
    glow: 'shadow-[0_0_3px_0px_rgba(34,197,94,0.7)]', 
    scale: undefined 
  },
  error: { 
    glow: 'shadow-[0_0_3px_0px_rgba(239,68,68,0.7)]', 
    scale: undefined 
  }
}
```

---

## 🎯 Real-World Scenarios

### **Scenario 1: Text Processing Chain**

```
CreateText → TurnToUppercase → ViewOutput
    ↓              ↓              ↓
 🌫️ typing     🟢 "HELLO"     🟢 displays
```

**Flow Steps**:
1. User types "hello" in CreateText
2. CreateText has meaningful output → 🟢 Green glow
3. TurnToUppercase receives input, processes to "HELLO" → 🟢 Green glow
4. ViewOutput receives processed text → 🟢 Green glow

### **Scenario 2: Logic Gate with Triggers**

```
TriggerA ──┐
           ├─→ LogicOr → ViewOutput
TriggerB ──┘      ↓          ↓
              🟢 true     🟢 "true"
```

**Flow Steps**:
1. TriggerA activates → 🟢 Green glow (has triggered=true)
2. LogicOr receives trigger, outputs true → 🟢 Green glow
3. ViewOutput displays "true" → 🟢 Green glow

### **Scenario 3: Error Propagation**

```
CreateText → [Processing Error] → ViewOutput
    ↓              ↓                  ↓
 🟢 "hello"     🔴 ERROR           🌫️ no data
```

**Flow Steps**:
1. CreateText has valid output → 🟢 Green glow
2. Processing node encounters error → 🔴 Red glow
3. ViewOutput receives no data → 🌫️ No glow (inactive)

### **Scenario 4: Trigger Control**

```
CreateText → LogicAnd ← TriggerOff
    ↓           ↓
 🟢 "hello"  🌫️ blocked
```

**Flow Steps**:
1. CreateText has output → 🟢 Green glow
2. TriggerOff is false, blocking LogicAnd → 🌫️ No glow (trigger blocked)

---

## 🔧 Advanced Features

### **Category-Aware Styling**
**Location**: `features/business-logic/stores/nodeStyleStore.ts`

```typescript
// Different node categories can have custom glow colors
export const useNodeCategoryClasses = (
  nodeType: string,
  isSelected: boolean, 
  isError: boolean, 
  isActive: boolean
) => {
  const categoryTheme = useCategoryTheme(nodeType)
  const defaultClasses = useNodeStyleClasses(isSelected, isError, isActive)
  
  if (!categoryTheme) {
    return defaultClasses
  }
  
  // Apply category-specific colors while maintaining glow effects
  return defaultClasses
}
```

### **Vibe Mode Integration**

The glow system integrates with **Vibe Mode** for enhanced visual feedback:

```typescript
// Vibe Mode can inject error states that trigger red glows
const hasVibeError = supportsErrorInjection && (data as any)?.isErrorState === true;
const vibeErrorType = (data as any)?.errorType || 'error';

// Determine final error state for styling
const finalErrorForStyling = error || hasVibeError;
```

### **Performance Monitoring**

The glow system includes performance optimizations:

- **Memoized style calculations** prevent unnecessary re-renders
- **Efficient CSS transitions** use hardware acceleration
- **Selective state subscriptions** minimize update overhead
- **Batched style updates** reduce layout thrashing

---

## 📊 Debugging & Monitoring

### **Development Tools**

#### **Console Logging**
```typescript
console.log(`Factory ${nodeType} ${id}: Setting isActive to ${finalIsActive} 
  (hasOutput: ${hasOutputData}, triggerAllows: ${triggerInfo})`);
```

#### **Style Store DevTools**
```typescript
// Access current style configuration
const currentStyles = useNodeStyleStore.getState();
console.log('Current activation style:', currentStyles.activation);
```

#### **State Inspection**
```typescript
// Check node activation state
const isNodeActive = data?.isActive;
const hasError = !!error;
const isSelected = selectedNodeId === id;
```

### **Common Issues & Solutions**

#### **Glow Not Appearing**
1. **Check meaningful output**: Ensure node has valid `text`, `value`, `output`, or `result`
2. **Verify trigger state**: If triggers connected, ensure they're active
3. **Inspect error state**: Errors can override activation glow

#### **Wrong Glow Color**
1. **Check state priority**: Selection > Error > Active > Hover
2. **Verify style store**: Ensure correct glow configuration
3. **CSS conflicts**: Check for conflicting Tailwind classes

#### **Performance Issues**
1. **Reduce effect dependencies**: Minimize `useEffect` triggers
2. **Optimize memoization**: Use proper dependency arrays
3. **Batch updates**: Avoid rapid state changes

---

## 🚀 Future Enhancements

### **Planned Improvements**

1. **Animated Glow Pulses**: Breathing effects for active nodes
2. **Data Flow Visualization**: Animated glows along edges
3. **Custom Glow Patterns**: User-defined glow styles
4. **Accessibility Enhancements**: High contrast mode support
5. **Performance Analytics**: Glow update frequency monitoring

### **Extensibility Points**

- **Custom glow colors** for specific node types
- **Gradient glows** for complex states
- **Multi-color glows** for multiple simultaneous states
- **Glow intensity scaling** based on data volume
- **Theme-aware glow adaptation**

---

## 📚 Related Documentation

- [`DATA_FLOW_ARCHITECTURE.md`](./DATA_FLOW_ARCHITECTURE.md) - Overall system architecture
- [`VIBE_MODE_DOCUMENTATION.md`](./VIBE_MODE_DOCUMENTATION.md) - Visual feedback system
- [`ERROR_GENERATOR_DOCUMENTATION.md`](./ERROR_GENERATOR_DOCUMENTATION.md) - Error handling
- [`creating-new-nodes.md`](./node-docs/creating-new-nodes.md) - Node development guide

---

## 🤝 Contributing

When working with the glow system:

1. **Understand state priorities** (Selection > Error > Active > Hover)
2. **Use centralized style store** for consistency
3. **Test visual feedback** across different themes
4. **Consider performance impact** of style changes
5. **Document custom glow behaviors** for new node types

---

*This documentation is maintained alongside the codebase and should be updated when glow system changes are made.* 