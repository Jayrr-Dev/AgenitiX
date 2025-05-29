# Moving Node Files Guide

## Overview

This guide explains how to safely move node files within the business logic architecture. Moving nodes requires updating several import paths to maintain functionality.

## ⚠️ Important

Moving node files incorrectly can break the build. Always follow this complete checklist to ensure all references are updated.

## Directory Structure

Nodes are organized in the following directories under `features/business-logic/nodes/`:

```
nodes/
├── main/           # Core logic nodes (triggers, converters, logic gates)
├── automation/     # Automation nodes (count, delay, boolean conversion)
├── media/          # Media processing nodes (text conversion, formatting)
├── test/           # Testing and development nodes (TestInput, TestJson, TestError)
├── integrations/   # Third-party integration nodes
├── misc/           # Miscellaneous utility nodes
└── factory/        # Node factory system (do not move these)
```

## Moving a Node File: Complete Checklist

### 1. ✅ Update FlowCanvas Import

**File**: `features/business-logic/flow-editor/components/FlowCanvas.tsx`

```typescript
// OLD:
import TestInput from '../../nodes/main/TestInput';

// NEW:
import TestInput from '../../nodes/test/TestInput';
```

### 2. ✅ Update Sidebar Stencil Configuration 

**File**: `features/business-logic/components/sidebar/constants.ts`

Check if the node is referenced in any stencil configurations. Update import paths if necessary.

### 3. ✅ Update Flow Editor Constants (if applicable)

**File**: `features/business-logic/flow-editor/constants/index.ts`

Check if the node type has any special configurations that reference file paths.

### 4. ✅ Update Any Documentation

Update any documentation files that reference the old file path.

### 5. ✅ Clear Build Caches

After moving, always clear build caches:

```powershell
# Clear Next.js cache
Remove-Item -Path .next -Recurse -Force -ErrorAction SilentlyContinue

# Clear TypeScript build info
Remove-Item -Path tsconfig.tsbuildinfo -Force -ErrorAction SilentlyContinue
```

### 6. ✅ Test the Build

```bash
npm run build
```

## Common Move Scenarios

### Moving from `main/` to `test/`

**Example**: Moving `TestInput.tsx` from `main/` to `test/`

1. Move the file: `nodes/main/TestInput.tsx` → `nodes/test/TestInput.tsx`
2. Update FlowCanvas import:
   ```typescript
   // Change this:
   import TestInput from '../../nodes/main/TestInput';
   // To this:
   import TestInput from '../../nodes/test/TestInput';
   ```
3. Clear caches and test build

### Moving from `main/` to `automation/`

**Example**: Moving `CountInput.tsx` from `main/` to `automation/`

1. Move the file: `nodes/main/CountInput.tsx` → `nodes/automation/CountInput.tsx`
2. Update FlowCanvas import:
   ```typescript
   // Change this:
   import CountInput from '../../nodes/main/CountInput';
   // To this:
   import CountInput from '../../nodes/automation/CountInput';
   ```
3. Clear caches and test build

## Files That Import Nodes

These are the main files that import node components and may need updates:

1. **FlowCanvas.tsx** (Primary) - Contains all node imports for the React Flow registry
2. **Sidebar constants** - May reference nodes in stencil configurations
3. **Documentation files** - May have examples or references to file paths

## Troubleshooting

### Build Error: "Cannot find file"

**Error**: `Error: Failed to read source code from [old path]`

**Solution**:
1. Verify the file exists at the new location
2. Check that FlowCanvas import is updated correctly
3. Clear all build caches
4. Restart the development server

### Module Not Found Error

**Error**: `Module not found: Can't resolve '../../nodes/old/path'`

**Solution**:
1. Search the entire codebase for the old import path
2. Update all references to use the new path
3. Clear caches and rebuild

### TypeScript Errors

**Error**: Type errors after moving

**Solution**:
1. Clear TypeScript build info: `Remove-Item tsconfig.tsbuildinfo`
2. Restart TypeScript server in your IDE
3. Rebuild the project

## Search Commands

Use these commands to find all references to a node file:

### PowerShell (Windows)
```powershell
# Find all imports of a specific node
Select-String -Path "features\business-logic\**\*.tsx" -Pattern "from.*NodeName"

# Find all references to a node type
Select-String -Path "features\business-logic\**\*.ts*" -Pattern "nodeType.*nodeName"
```

### Bash (Linux/Mac)
```bash
# Find all imports of a specific node
grep -r "from.*NodeName" features/business-logic/

# Find all references to a node type  
grep -r "nodeType.*nodeName" features/business-logic/
```

## Best Practices

1. **Move Related Files Together**: If moving multiple related nodes, move them all at once
2. **Use Descriptive Directories**: Choose the directory that best represents the node's function
3. **Update Documentation**: Always update any documentation that references the old location
4. **Test Thoroughly**: Build and test the application after any moves
5. **Commit Changes Together**: Commit the file move and all import updates in a single commit

## Node Directory Guidelines

### `main/`
- Core business logic nodes
- Fundamental operations (logic gates, text processing)
- Nodes that form the backbone of most flows

### `automation/`
- Time-based operations (delays, timers)
- Data manipulation (counters, transformers)
- Process automation nodes

### `test/`
- Development and testing utilities
- Debug helpers (TestInput, TestJson, TestError)
- Nodes used primarily during development

### `media/`
- Text processing and formatting
- Content transformation
- Media-related operations

### `integrations/`
- Third-party service connections
- API integration nodes
- External system interfaces

### `misc/`
- Utility nodes that don't fit other categories
- Experimental or specialized nodes
- One-off implementations

## Emergency Recovery

If a move breaks the build and you need to quickly recover:

1. **Revert the file move** back to the original location
2. **Clear all caches** 
3. **Restart the development server**
4. **Plan the move more carefully** using this guide

## Related Documentation

- [Node Creation Guide](creating-new-nodes.md)
- [Business Logic Architecture](README.md)
- [Troubleshooting Guide](troubleshooting.md) 