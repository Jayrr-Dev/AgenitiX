# Vibe Handles System

## Overview

The Vibe Handles system provides enhanced debugging capabilities with opacity control. The `V` vibe system provides enhanced debugging functionality, while `{}` handles are now the standard JSON handles (replacing `j`).

## Key Changes

### 1. Handle Types

- **Regular Handles (including `{}`)**: Standard input/output handles for normal data flow
  - `{}` is now the JSON handle (replaced `j` for better intuitiveness)
  - Other handles like `s`, `n`, `b`, `o`, `a` work normally
- **Vibe Handles (`V`)**: Enhanced debugging handles with opacity control and special visibility logic

### 2. New Store Structure

The `vibeModeStore.ts` now includes:

```typescript
interface VibeModeState {
  isVibeModeActive: boolean;
  showVibeHandles: boolean; // Controls vibe handles visibility
  vibeHandleOpacity: number; // Opacity level for vibe handles when "hidden"
  // ... other methods
}
```

### 3. Opacity Instead of Complete Hiding

Vibe handles now use opacity (default: 0.0001) instead of complete hiding, which:

- Prevents connection issues when handles are brought back
- Allows for better debugging workflows
- Maintains handle connectivity during development

### 4. Vibe Handle Types

- **`V`**: General vibe handle for enhanced debugging connections

## Usage

### Store Methods

```typescript
const {
  showVibeHandles,
  vibeHandleOpacity,
  toggleVibeHandles,
  setVibeHandleOpacity,
} = useVibeModeStore();
```

### Adding Vibe Handles to Nodes

```typescript
// In node handle configuration
{
  id: "vibe",
  dataType: "V",
  position: Position.Top,
  type: "target",
}
```

### Using JSON Handles

```typescript
// Standard JSON handle (replaces j)
{
  id: "json",
  dataType: "{}",
  position: Position.Top,
  type: "target",
}
```

### Conditional Rendering

The system automatically handles vibe handle visibility and opacity:

```typescript
// For vibe handles only
shouldShowVibeHandle(
  handle,
  connections,
  allNodes,
  showVibeHandles,
  isVibeModeActive
);

// Opacity calculation for vibe handles
getVibeHandleOpacity(handle, showVibeHandles, vibeHandleOpacity);
```

## Benefits

1. **Enhanced Debugging**: Vibe handles stay partially visible for easier reconnection
2. **Clear Separation**: Vibe handles (`V`) have special behavior, regular handles (`{}`, `s`, `n`, etc.) work normally
3. **Improved UX**: No more lost connections when toggling vibe handle visibility
4. **Better Development**: Dedicated vibe system for debugging workflows
5. **More Intuitive**: `{}` is more intuitive than `j` for JSON handles

## Important Notes

- **`{}` handles are regular JSON handles**: They work like any other handle with no special vibe behavior (replaced `j`)
- **`V` is the vibe system**: Enhanced debugging handle with opacity control
- **Opacity control**: Vibe handles use opacity instead of complete hiding to prevent connection issues
