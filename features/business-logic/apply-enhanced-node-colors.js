// ============================================================================
// APPLY ENHANCED NODE COLORS - Perfect Color Scheme
// ============================================================================

// Run this in your browser console after importing the store functions:

/*
import { 
  applyCategoryTheme, 
  enableCategoryTheming 
} from './stores/nodeStyleStore';

// Enable category theming
enableCategoryTheming();

// Apply perfect colors for enhanced nodes:

// 1. TRIGGER NODES = VIOLET (perfect for toggles and triggers)
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
});

// 2. CREATE NODES = EMERALD (fresh for creation)
applyCategoryTheme('create', {
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
});

// 3. VIEW NODES = SLATE (neutral for viewing)
applyCategoryTheme('view', {
  background: { light: 'bg-slate-50', dark: 'bg-slate-900' },
  border: { light: 'border-slate-300', dark: 'border-slate-800' },
  text: {
    primary: { light: 'text-slate-900', dark: 'text-slate-100' },
    secondary: { light: 'text-slate-700', dark: 'text-slate-300' }
  },
  button: {
    border: 'border-slate-300 dark:border-slate-800',
    hover: { light: 'hover:bg-slate-200', dark: 'hover:bg-slate-700' }
  }
});

// 4. CYCLE NODES = EMERALD (matching the pulse/timing theme)
applyCategoryTheme('cycle', {
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
});

console.log('🎨 Applied enhanced node color scheme:');
console.log('- Trigger nodes (TriggerToggleEnhanced): Violet');
console.log('- Create nodes (CreateTextEnhanced): Emerald');
console.log('- View nodes (ViewOutputEnhanced): Slate');
console.log('- Cycle nodes (CyclePulseEnhanced): Emerald');
*/

// ============================================================================
// QUICK ONE-LINER FUNCTIONS
// ============================================================================

// Copy and paste these into console for instant results:

// Violet triggers:
// applyCategoryTheme('trigger', { background: { light: 'bg-violet-50', dark: 'bg-violet-900' }, border: { light: 'border-violet-300', dark: 'border-violet-800' }, text: { primary: { light: 'text-violet-900', dark: 'text-violet-100' }, secondary: { light: 'text-violet-800', dark: 'text-violet-200' } }, button: { border: 'border-violet-300 dark:border-violet-800', hover: { light: 'hover:bg-violet-200', dark: 'hover:bg-violet-800' } } })

// Emerald create:
// applyCategoryTheme('create', { background: { light: 'bg-emerald-50', dark: 'bg-emerald-900' }, border: { light: 'border-emerald-300', dark: 'border-emerald-800' }, text: { primary: { light: 'text-emerald-900', dark: 'text-emerald-100' }, secondary: { light: 'text-emerald-800', dark: 'text-emerald-200' } }, button: { border: 'border-emerald-300 dark:border-emerald-800', hover: { light: 'hover:bg-emerald-200', dark: 'hover:bg-emerald-800' } } })

// Slate view:
// applyCategoryTheme('view', { background: { light: 'bg-slate-50', dark: 'bg-slate-900' }, border: { light: 'border-slate-300', dark: 'border-slate-800' }, text: { primary: { light: 'text-slate-900', dark: 'text-slate-100' }, secondary: { light: 'text-slate-700', dark: 'text-slate-300' } }, button: { border: 'border-slate-300 dark:border-slate-800', hover: { light: 'hover:bg-slate-200', dark: 'hover:bg-slate-700' } } })

console.log('📋 Enhanced Node Color Scheme ready to apply!'); 