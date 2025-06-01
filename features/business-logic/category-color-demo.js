// ============================================================================
// CATEGORY COLOR DEMO - How to Change Node Group Background Colors
// ============================================================================

// Run these commands in your browser console to change node category colors:

// 1. ENABLE CATEGORY THEMING (if not already enabled)
// import { enableCategoryTheming } from './stores/nodeStyleStore'
// enableCategoryTheming()

// 2. QUICK PRESET FUNCTIONS (already available)
// import { 
//   makeTriggerNodesYellow, 
//   makeCreateNodesEmerald, 
//   makeViewNodesSlate,
//   applyCustomNodeColors 
// } from './stores/nodeStyleStore'

// EXAMPLES:

// Make all trigger nodes yellow
// makeTriggerNodesYellow()

// Make all create nodes emerald green  
// makeCreateNodesEmerald()

// Make all view nodes slate gray
// makeViewNodesSlate()

// Apply a nice custom color scheme
// applyCustomNodeColors()

// ============================================================================
// MANUAL COLOR CHANGES
// ============================================================================

// Change any category to any color manually:
// import { applyCategoryTheme } from './stores/nodeStyleStore'

// Example: Make trigger nodes violet (perfect for toggles)
/*
applyCategoryTheme('trigger', {
  background: { light: 'bg-violet-50', dark: 'bg-violet-900' },
  border: { light: 'border-violet-300', dark: 'border-violet-800' },
  text: {
    primary: { light: 'text-violet-900', dark: 'text-violet-100' },
    secondary: { light: 'text-violet-800', dark: 'text-violet-200' }
  },
  button: {
    border: 'border-violet-300 dark:border-violet-800',
    hover: { light: 'hover:bg-violet-200', dark: 'hover:bg-violet-800' }
  }
})
*/

// Example: Make create nodes blue
/*
applyCategoryTheme('create', {
  background: { light: 'bg-blue-50', dark: 'bg-blue-900' },
  border: { light: 'border-blue-300', dark: 'border-blue-800' },
  text: {
    primary: { light: 'text-blue-900', dark: 'text-blue-100' },
    secondary: { light: 'text-blue-800', dark: 'text-blue-200' }
  },
  button: {
    border: 'border-blue-300 dark:border-blue-800',
    hover: { light: 'hover:bg-blue-200', dark: 'hover:bg-blue-800' }
  }
})
*/

// Example: Make view nodes clean gray
/*
applyCategoryTheme('view', {
  background: { light: 'bg-gray-100', dark: 'bg-gray-800' },
  border: { light: 'border-gray-300', dark: 'border-gray-600' },
  text: {
    primary: { light: 'text-gray-900', dark: 'text-gray-100' },
    secondary: { light: 'text-gray-700', dark: 'text-gray-300' }
  },
  button: {
    border: 'border-gray-300 dark:border-gray-600',
    hover: { light: 'hover:bg-gray-200', dark: 'hover:bg-gray-700' }
  }
})
*/

// ============================================================================
// AVAILABLE COLORS
// ============================================================================

// Available Tailwind colors:
// red, orange, amber, yellow, lime, green, emerald, teal, cyan,
// sky, blue, indigo, violet, purple, fuchsia, pink, rose,
// slate, gray, zinc, neutral, stone

// ============================================================================
// BATCH CHANGES
// ============================================================================

// Use the quick color changer for multiple categories:
// import { applyCustomCategoryColors } from './stores/nodeStyleStore'

/*
applyCustomCategoryColors({
  trigger: { color: 'violet' },    // All trigger nodes = violet
  create: { color: 'blue' },       // All create nodes = blue  
  view: { color: 'gray' },         // All view nodes = gray
  logic: { color: 'purple' },      // All logic nodes = purple
  cycle: { color: 'green' }        // All cycle nodes = green
})
*/

// ============================================================================
// DISABLE THEMING
// ============================================================================

// To go back to all-blue default:
// import { disableCategoryTheming } from './stores/nodeStyleStore'
// disableCategoryTheming()

console.log('📋 Category Color Demo loaded! Check the comments for usage examples.') 