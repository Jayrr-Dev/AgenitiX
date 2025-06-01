# Node Styling Guide

A simple guide for updating node styles and managing categories in the visual flow editor.

---

## 📖 Table of Contents

1. [Quick Reference](#quick-reference)
2. [Updating Node Styles](#updating-node-styles)
3. [Adding New Categories](#adding-new-categories)
4. [Category Color Management](#category-color-management)

---

## 🚀 Quick Reference

### Enable Category Theming
```typescript
import { applyUserColorScheme } from '../stores/categoryThemeDemo'
applyUserColorScheme() // Applies: Create=Blue, Logic=Purple, Trigger=Orange, etc.
```

### Change All Nodes in a Category
```typescript
import { changeCategoryColor } from '../stores/categoryThemeDemo'
changeCategoryColor('create', 'green')  // All Create nodes → Green
changeCategoryColor('logic', 'purple')  // All Logic nodes → Purple
```

### Disable Category Theming (All Blue)
```typescript
import { disableCategoryTheming } from '../stores/nodeStyleStore'
disableCategoryTheming() // Reverts all nodes to blue
```

---

## 🎨 Updating Node Styles

### Step 1: Update Global Effects (Hover, Glow, etc.)

```typescript
import { useNodeStyleStore } from '../stores/nodeStyleStore'

const store = useNodeStyleStore.getState()

// Change hover effect for ALL nodes
store.updateHoverStyle({
  glow: 'shadow-[0_0_6px_2px_rgba(255,255,255,0.5)]'
})

// Change activation glow for ALL nodes
store.updateActivationStyle({
  glow: 'shadow-[0_0_12px_4px_rgba(34,197,94,0.9)]'
})

// Change error glow for ALL nodes
store.updateErrorStyle({
  glow: 'shadow-[0_0_12px_4px_rgba(239,68,68,0.9)]'
})
```

### Step 2: Apply Style Presets

```typescript
import { applyStylePreset } from '../stores/nodeStyleStore'

applyStylePreset('subtle')    // Subtle effects
applyStylePreset('dramatic')  // Strong effects  
applyStylePreset('minimal')   // Minimal effects
```

### Step 3: Update Individual Node Component

For a specific node component (e.g., CreateText):

```typescript
// In your node component
import { 
  useNodeCategoryBaseClasses,
  useNodeCategoryButtonTheme,
  useNodeCategoryTextTheme,
  useNodeStyleClasses
} from '../stores/nodeStyleStore'

const YourNode = ({ id, data, selected }) => {
  // Get category-aware styling
  const categoryBase = useNodeCategoryBaseClasses('yourNodeType')
  const categoryButton = useNodeCategoryButtonTheme('yourNodeType', !!error, isActive)
  const categoryText = useNodeCategoryTextTheme('yourNodeType', !!error)
  const styleClasses = useNodeStyleClasses(!!selected, !!error, isActive)

  return (
    <div className={`${categoryBase.background} ${categoryBase.border} ${styleClasses}`}>
      <button className={categoryButton}>Toggle</button>
      <div className={categoryText.primary}>Your Content</div>
    </div>
  )
}
```

---

## 📁 Adding New Categories

### Step 1: Define the New Category

Edit `stores/nodeStyleStore.ts`:

```typescript
// Add your new category to the type
export type NodeCategory = 'create' | 'logic' | 'trigger' | 'test' | 'turn' | 'count' | 'delay' | 'edit' | 'cycle' | 'transform' // ← Add here

// Add nodes to the new category
export const NODE_CATEGORY_MAPPING: Record<string, NodeCategory> = {
  // ... existing mappings ...
  
  // Transform category (new)
  'transformData': 'transform',
  'transformJson': 'transform',
  'transformArray': 'transform',
}
```

### Step 2: Define Category Theme Colors

Add the theme in the same file:

```typescript
export const CATEGORY_THEMES: Record<NodeCategory, CategoryTheme> = {
  // ... existing themes ...
  
  transform: {
    background: { light: 'bg-emerald-50', dark: 'bg-emerald-900' },
    border: { light: 'border-emerald-300', dark: 'border-emerald-800' },
    text: {
      primary: { light: 'text-emerald-900', dark: 'text-emerald-100' },
      secondary: { light: 'text-emerald-800', dark: 'text-emerald-200' }
    },
    button: {
      border: 'border-emerald-300 dark:border-emerald-800',
      hover: { light: 'hover:bg-emerald-200', dark: 'hover:bg-emerald-800' }
    }
  }
}
```

### Step 3: Update Demo Functions (Optional)

Edit `stores/categoryThemeDemo.ts`:

```typescript
// Add to available categories list
const categories: NodeCategory[] = ['create', 'logic', 'trigger', 'test', 'turn', 'count', 'delay', 'edit', 'cycle', 'transform'] // ← Add here

// Add preset function (optional)
export const makeAllTransformNodesEmerald = () => {
  applyCategoryTheme('transform', {
    background: { light: 'bg-emerald-50', dark: 'bg-emerald-900' },
    border: { light: 'border-emerald-300', dark: 'border-emerald-800' },
    text: {
      primary: { light: 'text-emerald-900', dark: 'text-emerald-100' },
      secondary: { light: 'text-emerald-800', dark: 'text-emerald-200' }
    }
  })
}
```

### Step 4: Use in Your Nodes

```typescript
// In your new transform node components
const categoryBase = useNodeCategoryBaseClasses('transformData') // ← Use your node type
const categoryButton = useNodeCategoryButtonTheme('transformData', !!error, isActive)
const categoryText = useNodeCategoryTextTheme('transformData', !!error)
```

---

## 🎨 Category Color Management

### Change All Nodes in a Category

```typescript
import { changeCategoryColor } from '../stores/categoryThemeDemo'

// Change all Create nodes to emerald
changeCategoryColor('create', 'emerald')

// Change all Logic nodes to violet  
changeCategoryColor('logic', 'violet')

// Change all Transform nodes to teal
changeCategoryColor('transform', 'teal')
```

### Available Colors

```typescript
export const AVAILABLE_COLORS = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan',
  'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
  'slate', 'gray', 'zinc', 'neutral', 'stone'
]
```

### Batch Change Multiple Categories

```typescript
import { applyCustomCategoryColors } from '../stores/nodeStyleStore'

applyCustomCategoryColors({
  create: { color: 'blue' },
  logic: { color: 'purple' },
  trigger: { color: 'orange' },
  transform: { color: 'emerald' }, // ← Your new category
  test: { color: 'gray' }
})
```

### Check Which Nodes Are in Each Category

```typescript
import { getNodesInCategory } from '../stores/nodeStyleStore'

const createNodes = getNodesInCategory('create')
console.log('Create nodes:', createNodes) // ['createText']

const transformNodes = getNodesInCategory('transform')  
console.log('Transform nodes:', transformNodes) // ['transformData', 'transformJson', 'transformArray']
```

---

## 🔧 Common Tasks

### Task: Make All Create Nodes Green
```typescript
changeCategoryColor('create', 'green')
```

### Task: Make All Logic Nodes Purple  
```typescript
changeCategoryColor('logic', 'purple')
```

### Task: Disable All Category Colors (Back to Blue)
```typescript
import { disableCategoryTheming } from '../stores/nodeStyleStore'
disableCategoryTheming()
```

### Task: Enable Your Default Color Scheme
```typescript
import { applyUserColorScheme } from '../stores/categoryThemeDemo'
applyUserColorScheme()
```

### Task: Add Custom Category for "API" Nodes
1. Add `'api'` to NodeCategory type
2. Map your API nodes: `'fetchApi': 'api', 'postApi': 'api'`
3. Define theme with yellow colors
4. Use `changeCategoryColor('api', 'yellow')` to apply

---

## ✅ Quick Checklist

**To Update Global Styling:**
- [ ] Use `useNodeStyleStore().updateHoverStyle()`
- [ ] Use `useNodeStyleStore().updateActivationStyle()`
- [ ] Use `useNodeStyleStore().updateErrorStyle()`

**To Add New Category:**
- [ ] Add to `NodeCategory` type
- [ ] Add nodes to `NODE_CATEGORY_MAPPING`  
- [ ] Add theme to `CATEGORY_THEMES`
- [ ] Use category hooks in your node components

**To Change Category Colors:**
- [ ] Use `changeCategoryColor(category, color)`
- [ ] Or use `applyCustomCategoryColors()` for batch changes

That's it! The system will automatically apply colors to all nodes in each category. 