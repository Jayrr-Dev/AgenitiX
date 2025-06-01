# Sidebar Component Architecture

This directory contains the refactored Sidebar component, organized using React best practices for better maintainability and readability.

## Structure

```
sidebar/
├── README.md                 # This documentation
├── index.ts                  # Main exports
├── types.ts                  # TypeScript type definitions
├── constants.ts              # Configuration and default data
├── SidebarTabs.tsx          # Main tabbed interface component
├── VariantSelector.tsx      # A/B/C variant selector
├── ToggleButton.tsx         # Show/hide toggle button
├── StencilGrid.tsx          # Grid of draggable stencils
├── SortableStencil.tsx      # Individual stencil item
└── hooks/
    ├── useSidebarState.ts   # Sidebar state management
    ├── useStencilStorage.ts # LocalStorage persistence
    └── useDragSensors.ts    # Drag and drop configuration
```

## Key Improvements

### 1. **Separation of Concerns**
- Each component has a single responsibility
- Business logic separated from UI components
- Custom hooks for reusable stateful logic

### 2. **Better Type Safety**
- Comprehensive TypeScript types in `types.ts`
- Proper generic constraints for variant/tab relationships
- Clear interface definitions for all props

### 3. **Improved Maintainability**
- Smaller, focused components are easier to test and debug
- Configuration centralized in `constants.ts`
- Clear dependency relationships

### 4. **Enhanced Readability**
- Descriptive component and function names
- Consistent code organization
- Proper JSDoc comments where needed

### 5. **Performance Optimizations**
- React.memo for expensive components
- useCallback for stable function references
- useMemo for computed values

## Usage

```tsx
import Sidebar from './Sidebar';

function App() {
  return <Sidebar className="my-sidebar" />;
}
```

## Adding New Stencils

1. Add the stencil definition to the appropriate variant in `constants.ts`
2. The component will automatically pick up the new stencil
3. No changes needed to the UI components

## Adding New Variants

1. Add the new variant type to `SidebarVariant` in `types.ts`
2. Create tab configuration in `types.ts`
3. Add default stencils in `constants.ts`
4. Update `VARIANT_CONFIG` mapping

## Testing Strategy

Each component can be tested in isolation:
- Unit tests for hooks
- Component tests for UI components
- Integration tests for the main Sidebar component 