// ============================================================================
// CATEGORY-BASED THEMING DEMO
// ============================================================================

import { 
  applyUserColorScheme,
  enableCategoryTheming,
  disableCategoryTheming,
  applyCategoryTheme,
  applyCustomCategoryColors,
  makeAllCreateNodesGreen,
  makeAllLogicNodesPink,
  getNodesInCategory
} from './nodeStyleStore'

import type { NodeCategory } from '../nodes/nodeRegistry';

// ============================================================================
// HOW TO USE CATEGORY-BASED THEMING
// ============================================================================

// 1. ENABLE CATEGORY THEMING AND APPLY YOUR COLOR SCHEME
export const enableYourColorScheme = () => {
  applyUserColorScheme()
  console.log('✅ Category theming enabled with your preferred colors!')
}

// 2. DISABLE CATEGORY THEMING (REVERT TO ALL BLUE)
export const revertToAllBlue = () => {
  disableCategoryTheming()
  console.log('🔵 All nodes reverted to blue theme')
}

// 3. CHANGE ALL NODES IN A CATEGORY AT ONCE
export const demonstrateCategoryChanges = () => {
  enableCategoryTheming()
  
  // Make all Create nodes green
  makeAllCreateNodesGreen()
  console.log('🟢 All Create nodes are now green!')
  
  // Make all Logic nodes pink  
  makeAllLogicNodesPink()
  console.log('🩷 All Logic nodes are now pink!')
  
  // Make all Trigger nodes yellow
  applyCategoryTheme('trigger', {
    background: { light: 'bg-yellow-50', dark: 'bg-yellow-900' },
    border: { light: 'border-yellow-300', dark: 'border-yellow-800' },
    text: {
      primary: { light: 'text-yellow-900', dark: 'text-yellow-100' },
      secondary: { light: 'text-yellow-800', dark: 'text-yellow-200' }
    }
  })
  console.log('🟡 All Trigger nodes are now yellow!')
}

// 4. BATCH CHANGE MULTIPLE CATEGORIES
export const batchChangeCategoryColors = () => {
  applyCustomCategoryColors({
    create: { color: 'emerald' },    // All Create nodes → Emerald
    logic: { color: 'violet' },      // All Logic nodes → Violet  
    trigger: { color: 'amber' },     // All Trigger nodes → Amber
    test: { color: 'slate' },        // All Test nodes → Slate
    count: { color: 'orange' },      // All Count nodes → Orange
    delay: { color: 'rose' },        // All Delay nodes → Rose
    cycle: { color: 'teal' }         // All Cycle nodes → Teal
  })
  
  console.log('🎨 Applied custom colors to all categories!')
}

// 5. CHECK WHICH NODES ARE IN EACH CATEGORY
export const showNodeCategories = () => {
  const categories: NodeCategory[] = ['create', 'logic', 'trigger', 'test', 'turn', 'count', 'delay', 'edit', 'cycle']
  
  categories.forEach(category => {
    const nodes = getNodesInCategory(category)
    console.log(`📁 ${category.toUpperCase()} category contains:`, nodes)
  })
}

// ============================================================================
// USAGE EXAMPLES FOR YOUR APP
// ============================================================================

// Example: Settings panel component
export const createThemeSettingsHandlers = () => {
  return {
    // Enable your color scheme
    enableColorScheme: () => {
      applyUserColorScheme()
    },
    
    // Disable and go back to all blue
    disableColorScheme: () => {
      disableCategoryTheming()
    },
    
    // Quick presets
    makeCreateNodesGreen: () => {
      enableCategoryTheming()
      makeAllCreateNodesGreen()
    },
    
    makeLogicNodesPurple: () => {
      enableCategoryTheming()
      applyCategoryTheme('logic', {
        background: { light: 'bg-purple-50', dark: 'bg-purple-900' },
        border: { light: 'border-purple-300', dark: 'border-purple-800' },
        text: {
          primary: { light: 'text-purple-900', dark: 'text-purple-100' },
          secondary: { light: 'text-purple-800', dark: 'text-purple-200' }
        }
      })
    },
    
    makeTriggerNodesOrange: () => {
      enableCategoryTheming()
      applyCategoryTheme('trigger', {
        background: { light: 'bg-orange-50', dark: 'bg-orange-900' },
        border: { light: 'border-orange-300', dark: 'border-orange-800' },
        text: {
          primary: { light: 'text-orange-900', dark: 'text-orange-100' },
          secondary: { light: 'text-orange-800', dark: 'text-orange-200' }
        }
      })
    }
  }
}

// ============================================================================
// AVAILABLE TAILWIND COLORS FOR CATEGORIES
// ============================================================================

export const AVAILABLE_COLORS = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan',
  'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
  'slate', 'gray', 'zinc', 'neutral', 'stone'
]

// Quick function to change a category to any Tailwind color
export const changeCategoryColor = (category: NodeCategory, color: string) => {
  if (!AVAILABLE_COLORS.includes(color)) {
    console.error(`❌ Color "${color}" not available. Use one of:`, AVAILABLE_COLORS)
    return
  }
  
  applyCustomCategoryColors({
    [category]: { color }
  })
  
  console.log(`🎨 Changed all ${category} nodes to ${color}`)
}

// ============================================================================
// REACT COMPONENT USAGE EXAMPLE
// ============================================================================

/*
// Example React component for theme settings:

import { 
  enableYourColorScheme,
  revertToAllBlue,
  changeCategoryColor,
  AVAILABLE_COLORS,
  NodeCategory
} from './stores/categoryThemeDemo'

function ThemeSettings() {
  const categories: NodeCategory[] = ['create', 'logic', 'trigger', 'test', 'turn', 'count', 'delay', 'edit', 'cycle']
  
  return (
    <div className="p-4">
      <h3 className="font-bold mb-4">Node Color Themes</h3>
      
      <div className="space-y-4">
        <div>
          <button 
            onClick={enableYourColorScheme}
            className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
          >
            Enable Category Colors
          </button>
          <button 
            onClick={revertToAllBlue}
            className="px-4 py-2 bg-gray-500 text-white rounded"
          >
            All Blue (Disable)
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {categories.map(category => (
            <div key={category} className="space-y-2">
              <label className="block text-sm font-medium capitalize">{category} Nodes:</label>
              <select 
                onChange={(e) => changeCategoryColor(category, e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Choose color...</option>
                {AVAILABLE_COLORS.map(color => (
                  <option key={color} value={color} className="capitalize">
                    {color}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ThemeSettings
*/ 