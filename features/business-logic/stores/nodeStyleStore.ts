import { create } from 'zustand'

// ============================================================================
// NODE CATEGORY DEFINITIONS
// ============================================================================

export type NodeCategory = 'create' | 'logic' | 'trigger' | 'test' | 'turn' | 'count' | 'delay' | 'edit' | 'cycle'

export const NODE_CATEGORY_MAPPING: Record<string, NodeCategory> = {
  // Create category
  'createText': 'create',
  
  // Logic category  
  'logicAnd': 'logic',
  'logicOr': 'logic',
  'logicNot': 'logic',
  'logicXor': 'logic',
  'logicXnor': 'logic',
  
  // Trigger category
  'triggerOnClick': 'trigger',
  'triggerOnPulse': 'trigger',
  'triggerOnToggle': 'trigger',
  
  // Test category
  'testInput': 'test',
  
  // Turn category
  'turnToText': 'turn',
  'turnToUppercase': 'turn',
  'turnToBoolean': 'turn',
  
  // Count category
  'countInput': 'count',
  
  // Delay category
  'delayInput': 'delay',
  
  // Edit category
  'editObject': 'edit',
  'editArray': 'edit',
  
  // Cycle category
  'cyclePulse': 'cycle',
  'cycleToggle': 'cycle',
  
  // View/Output
  'viewOutput': 'test', // Categorize as test for now
}

// ============================================================================
// CATEGORY COLOR THEMES
// ============================================================================

export interface CategoryTheme {
  background: {
    light: string
    dark: string
  }
  border: {
    light: string
    dark: string
  }
  text: {
    primary: {
      light: string
      dark: string
    }
    secondary: {
      light: string
      dark: string
    }
  }
  button: {
    border: string
    hover: {
      light: string
      dark: string
    }
  }
}

export const CATEGORY_THEMES: Record<NodeCategory, CategoryTheme> = {
  create: {
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
  },
  
  logic: {
    background: { light: 'bg-purple-50', dark: 'bg-purple-900' },
    border: { light: 'border-purple-300', dark: 'border-purple-800' },
    text: {
      primary: { light: 'text-purple-900', dark: 'text-purple-100' },
      secondary: { light: 'text-purple-800', dark: 'text-purple-200' }
    },
    button: {
      border: 'border-purple-300 dark:border-purple-800',
      hover: { light: 'hover:bg-purple-200', dark: 'hover:bg-purple-800' }
    }
  },
  
  trigger: {
    background: { light: 'bg-orange-50', dark: 'bg-orange-900' },
    border: { light: 'border-orange-300', dark: 'border-orange-800' },
    text: {
      primary: { light: 'text-orange-900', dark: 'text-orange-100' },
      secondary: { light: 'text-orange-800', dark: 'text-orange-200' }
    },
    button: {
      border: 'border-orange-300 dark:border-orange-800',
      hover: { light: 'hover:bg-orange-200', dark: 'hover:bg-orange-800' }
    }
  },
  
  test: {
    background: { light: 'bg-gray-50', dark: 'bg-gray-900' },
    border: { light: 'border-gray-300', dark: 'border-gray-800' },
    text: {
      primary: { light: 'text-gray-900', dark: 'text-gray-100' },
      secondary: { light: 'text-gray-800', dark: 'text-gray-200' }
    },
    button: {
      border: 'border-gray-300 dark:border-gray-800',
      hover: { light: 'hover:bg-gray-200', dark: 'hover:bg-gray-800' }
    }
  },
  
  turn: {
    background: { light: 'bg-cyan-50', dark: 'bg-cyan-900' },
    border: { light: 'border-cyan-300', dark: 'border-cyan-800' },
    text: {
      primary: { light: 'text-cyan-900', dark: 'text-cyan-100' },
      secondary: { light: 'text-cyan-800', dark: 'text-cyan-200' }
    },
    button: {
      border: 'border-cyan-300 dark:border-cyan-800',
      hover: { light: 'hover:bg-cyan-200', dark: 'hover:bg-cyan-800' }
    }
  },
  
  count: {
    background: { light: 'bg-amber-50', dark: 'bg-amber-900' },
    border: { light: 'border-amber-300', dark: 'border-amber-800' },
    text: {
      primary: { light: 'text-amber-900', dark: 'text-amber-100' },
      secondary: { light: 'text-amber-800', dark: 'text-amber-200' }
    },
    button: {
      border: 'border-amber-300 dark:border-amber-800',
      hover: { light: 'hover:bg-amber-200', dark: 'hover:bg-amber-800' }
    }
  },
  
  delay: {
    background: { light: 'bg-red-50', dark: 'bg-red-900' },
    border: { light: 'border-red-300', dark: 'border-red-800' },
    text: {
      primary: { light: 'text-red-900', dark: 'text-red-100' },
      secondary: { light: 'text-red-800', dark: 'text-red-200' }
    },
    button: {
      border: 'border-red-300 dark:border-red-800',
      hover: { light: 'hover:bg-red-200', dark: 'hover:bg-red-800' }
    }
  },
  
  edit: {
    background: { light: 'bg-indigo-50', dark: 'bg-indigo-900' },
    border: { light: 'border-indigo-300', dark: 'border-indigo-800' },
    text: {
      primary: { light: 'text-indigo-900', dark: 'text-indigo-100' },
      secondary: { light: 'text-indigo-800', dark: 'text-indigo-200' }
    },
    button: {
      border: 'border-indigo-300 dark:border-indigo-800',
      hover: { light: 'hover:bg-indigo-200', dark: 'hover:bg-indigo-800' }
    }
  },
  
  cycle: {
    background: { light: 'bg-green-50', dark: 'bg-green-900' },
    border: { light: 'border-green-300', dark: 'border-green-800' },
    text: {
      primary: { light: 'text-green-900', dark: 'text-green-100' },
      secondary: { light: 'text-green-800', dark: 'text-green-200' }
    },
    button: {
      border: 'border-green-300 dark:border-green-800',
      hover: { light: 'hover:bg-green-200', dark: 'hover:bg-green-800' }
    }
  }
}

// ============================================================================
// NODE STYLE TYPES
// ============================================================================

export interface NodeStyleState {
  // Glow effect configurations
  hover: {
    glow: string
    border?: string
    scale?: string
  }
  selection: {
    glow: string
    border?: string
    scale?: string
  }
  activation: {
    glow: string
    border: string
    scale?: string
    buttonTheme: {
      border: string
      hover: string
    }
  }
  error: {
    glow: string
    border: string
    scale?: string
    buttonTheme: {
      border: string
      hover: string
    }
    textTheme: {
      primary: string
      secondary: string
      border: string
      focus: string
    }
  }
  // Base styling
  base: {
    transition: string
  }
  // Category theming
  categoryTheming: {
    enabled: boolean
    customOverrides: Partial<Record<NodeCategory, Partial<CategoryTheme>>>
  }
}

export interface NodeStyleActions {
  updateHoverStyle: (style: Partial<NodeStyleState['hover']>) => void
  updateSelectionStyle: (style: Partial<NodeStyleState['selection']>) => void
  updateActivationStyle: (style: Partial<NodeStyleState['activation']>) => void
  updateErrorStyle: (style: Partial<NodeStyleState['error']>) => void
  resetToDefaults: () => void
  updateBaseStyle: (style: Partial<NodeStyleState['base']>) => void
  // Category theming actions
  enableCategoryTheming: () => void
  disableCategoryTheming: () => void
  updateCategoryTheme: (category: NodeCategory, theme: Partial<CategoryTheme>) => void
  resetCategoryTheme: (category: NodeCategory) => void
  resetAllCategoryThemes: () => void
}

// ============================================================================
// DEFAULT STYLES
// ============================================================================

const defaultStyles: NodeStyleState = {
  hover: {
    glow: 'shadow-[0_0_3px_0px_rgba(255,255,255,0.3)]',
  },
  selection: {
    glow: 'shadow-[0_0_4px_1px_rgba(255,255,255,0.6)]',
  },
  activation: {
    glow: 'shadow-[0_0_8px_2px_rgba(34,197,94,0.8)]',
    border: 'border-green-300/60 dark:border-green-400/50',
    scale: 'scale-[1.02]',
    buttonTheme: {
      border: 'border-green-400',
      hover: 'hover:bg-green-100 dark:hover:bg-green-900'
    }
  },
  error: {
    glow: 'shadow-[0_0_8px_2px_rgba(239,68,68,0.8)]',
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
  },
  base: {
    transition: 'transition-all duration-200'
  },
  categoryTheming: {
    enabled: false,
    customOverrides: {}
  }
}

// ============================================================================
// ZUSTAND STORE
// ============================================================================

export const useNodeStyleStore = create<NodeStyleState & NodeStyleActions>((set) => ({
  ...defaultStyles,
  
  updateHoverStyle: (style) => set((state) => ({
    hover: { ...state.hover, ...style }
  })),
  
  updateSelectionStyle: (style) => set((state) => ({
    selection: { ...state.selection, ...style }
  })),
  
  updateActivationStyle: (style) => set((state) => ({
    activation: { ...state.activation, ...style }
  })),
  
  updateErrorStyle: (style) => set((state) => ({
    error: { ...state.error, ...style }
  })),
  
  updateBaseStyle: (style) => set((state) => ({
    base: { ...state.base, ...style }
  })),
  
  resetToDefaults: () => set(defaultStyles),
  
  enableCategoryTheming: () => set((state) => ({
    categoryTheming: { ...state.categoryTheming, enabled: true }
  })),
  
  disableCategoryTheming: () => set((state) => ({
    categoryTheming: { ...state.categoryTheming, enabled: false }
  })),
  
  updateCategoryTheme: (category, theme) => set((state) => ({
    categoryTheming: { ...state.categoryTheming, customOverrides: { ...state.categoryTheming.customOverrides, [category]: theme } }
  })),
  
  resetCategoryTheme: (category) => set((state) => ({
    categoryTheming: { ...state.categoryTheming, customOverrides: { ...state.categoryTheming.customOverrides, [category]: {} } }
  })),
  
  resetAllCategoryThemes: () => set((state) => ({
    categoryTheming: { ...state.categoryTheming, customOverrides: {} }
  }))
}))

// ============================================================================
// UTILITY HOOKS
// ============================================================================

// Hook to get the complete style class string for a node's current state
export const useNodeStyleClasses = (
  isSelected: boolean, 
  isError: boolean, 
  isActive: boolean
) => {
  const styles = useNodeStyleStore()
  
  const getStateStyles = () => {
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

// Hook to get button theme classes
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

// Hook to get text theme classes
export const useNodeTextTheme = (isError: boolean) => {
  const styles = useNodeStyleStore()
  
  if (isError) {
    return styles.error.textTheme
  }
  return {
    primary: 'text-blue-900 dark:text-blue-100',
    secondary: 'text-blue-800 dark:text-blue-200',
    border: 'border-blue-300 dark:border-blue-700',
    focus: 'focus:ring-blue-500'
  }
}

// ============================================================================
// CATEGORY-BASED UTILITY HOOKS
// ============================================================================

// Hook to get category theme for a specific node type
export const useCategoryTheme = (nodeType: string) => {
  const { categoryTheming } = useNodeStyleStore()
  
  if (!categoryTheming.enabled) {
    return null
  }
  
  const category = NODE_CATEGORY_MAPPING[nodeType]
  if (!category) {
    return null
  }
  
  const baseTheme = CATEGORY_THEMES[category]
  const customOverride = categoryTheming.customOverrides[category]
  
  return customOverride ? { ...baseTheme, ...customOverride } : baseTheme
}

// Hook to get category-aware styling classes
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
  
  // Return default styling effects (glow, scale) with category colors
  return defaultClasses
}

// Hook to get category-aware base styling (background, border, text)
export const useNodeCategoryBaseClasses = (nodeType: string) => {
  const categoryTheme = useCategoryTheme(nodeType)
  
  if (!categoryTheme) {
    return {
      background: 'bg-blue-50 dark:bg-blue-900',
      border: 'border-blue-300 dark:border-blue-800',
      textPrimary: 'text-blue-900 dark:text-blue-100',
      textSecondary: 'text-blue-800 dark:text-blue-200'
    }
  }
  
  return {
    background: `${categoryTheme.background.light} dark:${categoryTheme.background.dark}`,
    border: `${categoryTheme.border.light} dark:${categoryTheme.border.dark}`,
    textPrimary: `${categoryTheme.text.primary.light} dark:${categoryTheme.text.primary.dark}`,
    textSecondary: `${categoryTheme.text.secondary.light} dark:${categoryTheme.text.secondary.dark}`
  }
}

// Hook to get category-aware button theme
export const useNodeCategoryButtonTheme = (nodeType: string, isError: boolean, isActive: boolean) => {
  const categoryTheme = useCategoryTheme(nodeType)
  const defaultButtonTheme = useNodeButtonTheme(isError, isActive)
  
  if (!categoryTheme || isError || isActive) {
    return defaultButtonTheme
  }
  
  return `${categoryTheme.button.border} ${categoryTheme.button.hover.light} dark:${categoryTheme.button.hover.dark}`
}

// Hook to get category-aware text theme
export const useNodeCategoryTextTheme = (nodeType: string, isError: boolean) => {
  const categoryTheme = useCategoryTheme(nodeType)
  const defaultTextTheme = useNodeTextTheme(isError)
  
  if (!categoryTheme || isError) {
    return defaultTextTheme
  }
  
  return {
    primary: `${categoryTheme.text.primary.light} dark:${categoryTheme.text.primary.dark}`,
    secondary: `${categoryTheme.text.secondary.light} dark:${categoryTheme.text.secondary.dark}`,
    border: `${categoryTheme.border.light} dark:${categoryTheme.border.dark}`,
    focus: `focus:ring-${categoryTheme.border.light.split('-')[1]}-500` // Extract color from border
  }
}

// ============================================================================
// PRESET STYLE CONFIGURATIONS
// ============================================================================

export const STYLE_PRESETS = {
  subtle: {
    hover: { glow: 'shadow-[0_0_2px_0px_rgba(255,255,255,0.2)]' },
    activation: { glow: 'shadow-[0_0_6px_1px_rgba(34,197,94,0.6)]' },
    error: { glow: 'shadow-[0_0_6px_1px_rgba(239,68,68,0.6)]' }
  },
  dramatic: {
    hover: { glow: 'shadow-[0_0_6px_2px_rgba(255,255,255,0.5)]' },
    activation: { glow: 'shadow-[0_0_12px_4px_rgba(34,197,94,0.9)]', scale: 'scale-[1.05]' },
    error: { glow: 'shadow-[0_0_12px_4px_rgba(239,68,68,0.9)]', scale: 'scale-[1.05]' }
  },
  minimal: {
    hover: { glow: 'shadow-[0_0_1px_0px_rgba(255,255,255,0.4)]' },
    activation: { glow: 'shadow-[0_0_3px_0px_rgba(34,197,94,0.7)]', scale: undefined },
    error: { glow: 'shadow-[0_0_3px_0px_rgba(239,68,68,0.7)]', scale: undefined }
  }
}

// Function to apply a preset
export const applyStylePreset = (presetName: keyof typeof STYLE_PRESETS) => {
  const preset = STYLE_PRESETS[presetName]
  const store = useNodeStyleStore.getState()
  
  if (preset.hover) store.updateHoverStyle(preset.hover)
  if (preset.activation) store.updateActivationStyle(preset.activation)
  if (preset.error) store.updateErrorStyle(preset.error)
}

// ============================================================================
// CATEGORY MANAGEMENT FUNCTIONS
// ============================================================================

// Enable category theming globally
export const enableCategoryTheming = () => {
  useNodeStyleStore.getState().enableCategoryTheming()
}

// Disable category theming (revert to default blue theme)
export const disableCategoryTheming = () => {
  useNodeStyleStore.getState().disableCategoryTheming()
}

// Apply custom theme to a specific category
export const applyCategoryTheme = (category: NodeCategory, customTheme: Partial<CategoryTheme>) => {
  const store = useNodeStyleStore.getState()
  store.updateCategoryTheme(category, customTheme)
  if (!store.categoryTheming.enabled) {
    store.enableCategoryTheming()
  }
}

// Reset a category to its default theme
export const resetCategoryToDefault = (category: NodeCategory) => {
  useNodeStyleStore.getState().resetCategoryTheme(category)
}

// Apply all default category themes at once
export const applyAllCategoryDefaults = () => {
  const store = useNodeStyleStore.getState()
  store.enableCategoryTheming()
  store.resetAllCategoryThemes()
}

// Get all nodes that belong to a specific category
export const getNodesInCategory = (category: NodeCategory): string[] => {
  return Object.entries(NODE_CATEGORY_MAPPING)
    .filter(([_, nodeCategory]) => nodeCategory === category)
    .map(([nodeType, _]) => nodeType)
}

// ============================================================================
// QUICK CATEGORY THEME APPLICATIONS
// ============================================================================

// Apply the user's preferred color scheme
export const applyUserColorScheme = () => {
  const store = useNodeStyleStore.getState()
  store.enableCategoryTheming()
  
  // All categories will automatically use their default themes
  // Create = Blue (already default)
  // Logic = Purple 
  // Trigger = Orange 
  // Test = Grey 
  // Turn = Cyan (for Turn category)
  // Count = Brown (Amber)
  // Delay = Red 
  // Edit = Indigo
  // Cycle = Green
  
  console.log('Applied category color scheme:')
  console.log('- Create nodes: Blue')
  console.log('- Logic nodes: Purple') 
  console.log('- Trigger nodes: Orange')
  console.log('- Test nodes: Grey')
  console.log('- Turn nodes: Cyan')
  console.log('- Count nodes: Brown (Amber)')
  console.log('- Delay nodes: Red')
  console.log('- Edit nodes: Indigo')
  console.log('- Cycle nodes: Green')
}

// Custom category color override examples
export const makeAllCreateNodesGreen = () => {
  applyCategoryTheme('create', {
    background: { light: 'bg-green-50', dark: 'bg-green-900' },
    border: { light: 'border-green-300', dark: 'border-green-800' },
    text: {
      primary: { light: 'text-green-900', dark: 'text-green-100' },
      secondary: { light: 'text-green-800', dark: 'text-green-200' }
    }
  })
}

export const makeAllLogicNodesPink = () => {
  applyCategoryTheme('logic', {
    background: { light: 'bg-pink-50', dark: 'bg-pink-900' },
    border: { light: 'border-pink-300', dark: 'border-pink-800' },
    text: {
      primary: { light: 'text-pink-900', dark: 'text-pink-100' },
      secondary: { light: 'text-pink-800', dark: 'text-pink-200' }
    }
  })
}

// Batch apply custom colors to multiple categories
export const applyCustomCategoryColors = (categoryColors: Partial<Record<NodeCategory, { color: string }>>) => {
  const store = useNodeStyleStore.getState()
  store.enableCategoryTheming()
  
  Object.entries(categoryColors).forEach(([category, config]) => {
    if (config?.color) {
      const color = config.color
      store.updateCategoryTheme(category as NodeCategory, {
        background: { light: `bg-${color}-50`, dark: `bg-${color}-900` },
        border: { light: `border-${color}-300`, dark: `border-${color}-800` },
        text: {
          primary: { light: `text-${color}-900`, dark: `text-${color}-100` },
          secondary: { light: `text-${color}-800`, dark: `text-${color}-200` }
        },
        button: {
          border: `border-${color}-300 dark:border-${color}-800`,
          hover: { light: `hover:bg-${color}-200`, dark: `hover:bg-${color}-800` }
        }
      })
    }
  })
} 