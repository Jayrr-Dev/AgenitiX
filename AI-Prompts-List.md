# AI Prompts List

This document contains ready-to-use prompts for common issues in the React Flow visual editor codebase.

## 1. Boolean Value Sticking Issue

**Problem:** 
Nodes get "stuck" on boolean values (true/false) from InputTester and don't update when InputTester selection changes.

**Context:**  
This happens when nodes use `useMemo` for value caching or rely on `extractNodeValue` function which prioritizes `triggered` property over `value` property for InputTester nodes. The issue affects text processing nodes, output nodes, and any node that processes InputTester values.

**Prompt:**  
```
Fix the boolean value sticking issue in [NodeName]. The node is getting stuck on true/false values from InputTester nodes and not updating when the InputTester selection changes. 

The fix requires:
1. Remove any `useMemo` wrappers that cache values
2. Add special handling for InputTester nodes by checking `if (node.type === 'inputTesterNode')` and using `node.data?.value` directly
3. Use `extractNodeValue(node.data)` for all other node types
4. Import `type { AgenNode }` and use it in `useNodesData<AgenNode>()`

This is the same pattern used in OutputNode, TextUppercaseNode, and TextConverterNode.
```

## 2. Node Creation Issues

**Problem:** 
New nodes don't appear in sidebar, can't be dragged, or don't function properly.

**Context:**  
Creating nodes requires following a strict 6-step registration process. Missing any step breaks the node completely.

**Prompt:**  
```
I need to create a new node called [NodeName] that [describe functionality]. Follow the mandatory 6-step node creation process:

1. Create node component in `nodes/[category]/[NodeName].tsx`
2. Add type definitions in `flow-editor/types/index.ts` 
3. Register configuration in `flow-editor/constants/index.ts`
4. Register in FlowCanvas in `flow-editor/components/FlowCanvas.tsx`
5. Add to sidebar in `components/sidebar/constants.ts`
6. Add controls in `components/node-inspector/components/NodeControls.tsx`

Use the established patterns: 60x60px ICON state, 120x120px EXPANDED state, toggle button `{showUI ? '⦿' : '⦾'}`, and proper handle types with colors.
```

## 3. ReactFlow Namespace Conflicts

**Problem:** 
Nodes show gray background or styling issues due to ReactFlow reserved nodeType names.

**Context:**  
ReactFlow has reserved nodeType names like 'input', 'output', 'default' that cause styling conflicts.

**Prompt:**  
```
Fix the ReactFlow namespace conflict for [nodeType]. The node is showing gray background or incorrect styling because '[nodeType]' is a reserved ReactFlow name.

Change the nodeType from '[conflictingName]' to '[newName]' in these files:
- `flow-editor/types/index.ts` (AgenNode union type)
- `flow-editor/constants/index.ts` (NODE_TYPE_CONFIG)
- `flow-editor/components/FlowCanvas.tsx` (nodeTypes registration)
- `components/sidebar/constants.ts` (DEFAULT_STENCILS_A)
- `components/node-inspector/constants.ts` (NODE_INSPECTOR_CONFIG)

Update all references to use the new non-conflicting name.
```

## 4. Handle Connection Issues

**Problem:** 
Nodes can't connect to each other or connections don't work properly.

**Context:**  
Handle types must match between source and target, and CustomHandle component requires proper dataType configuration.

**Prompt:**  
```
Fix the handle connection issue between [SourceNode] and [TargetNode]. 

Check:
1. Handle dataTypes match (s=string, n=number, b=boolean, x=any, etc.)
2. CustomHandle components have correct `type`, `position`, `id`, and `dataType` props
3. Source handles use `type="source"` and target handles use `type="target"`
4. Handle IDs are unique within each node
5. Connection validation logic in `connectionUtils.ts` if custom validation is needed

Use the handle color scheme: blue=string, orange=number, green=boolean, gray=any.
```

## 5. State Management Issues

**Problem:** 
Node data doesn't persist, updates don't propagate, or state gets out of sync.

**Context:**  
Nodes must use `useReactFlow().updateNodeData()` for state updates and proper dependency arrays in useEffect.

**Prompt:**  
```
Fix the state management issue in [NodeName]. The node data isn't persisting or updates aren't propagating properly.

Ensure:
1. Use `const { updateNodeData } = useReactFlow()` for all data updates
2. Call `updateNodeData(id, { property: value })` to update node data
3. Use proper dependency arrays in `useEffect` hooks
4. Don't mutate node data directly
5. Use `useNodeConnections()` and `useNodesData()` for input handling
6. Remove any `useMemo` that might cache stale values

Follow the pattern used in working nodes like TextNode or OutputNode.
```

## 6. UI Layout and Sizing Issues

**Problem:** 
Nodes don't follow the established size patterns or UI doesn't render correctly.

**Context:**  
All nodes must follow the ICON/EXPANDED pattern with specific sizes and toggle button placement.

**Prompt:**  
```
Fix the UI layout issue in [NodeName] to follow the established node conventions:

Required patterns:
- ICON state: 60x60px (or 120x60px for text-based nodes)
- EXPANDED state: 120x120px minimum
- Toggle button in top-left: `{showUI ? '⦿' : '⦾'}`
- Use `useState(false)` for showUI (start collapsed)
- Proper Tailwind classes: `w-[60px] h-[60px]` vs `w-[120px] h-[120px]`
- FloatingNodeId component for node identification
- Consistent color scheme (blue for text nodes, amber for output, etc.)
- Event handling: `nodrag` class and `stopPropagation()` for interactive elements

Reference TextNode, OutputNode, or InputTesterNode for correct patterns.
```

## 7. Type Safety Issues

**Problem:** 
TypeScript errors, missing type definitions, or runtime type errors.

**Context:**  
The codebase uses strict TypeScript with specific type patterns for nodes and data.

**Prompt:**  
```
Fix the TypeScript issues in [NodeName]:

1. Create proper interface for node data extending `Record<string, unknown>`
2. Add the node to `AgenNode` union type in `flow-editor/types/index.ts`
3. Use `NodeProps<Node<YourNodeData & Record<string, unknown>>>` for component props
4. Import `type { AgenNode }` and use in `useNodesData<AgenNode>()`
5. Ensure all node properties are properly typed
6. Use proper handle dataTypes that match the type system

The type system is strictly enforced - all properties must be defined in interfaces.
```

## 8. Performance Issues

**Problem:** 
Nodes cause lag, excessive re-renders, or memory leaks.

**Context:**  
The modular architecture requires proper React optimization patterns.

**Prompt:**  
```
Optimize the performance of [NodeName]:

1. Wrap component in `React.memo()` if it's a pure component
2. Use `useCallback()` for event handlers that are passed as props
3. Remove unnecessary `useMemo()` that might cache stale values
4. Ensure `useEffect` dependencies are minimal and correct
5. Use `React.lazy()` for code splitting if the node is complex
6. Avoid creating objects/functions in render (move outside or use useCallback)
7. Check for memory leaks in event listeners or subscriptions

Follow the patterns in optimized nodes like TextNode or OutputNode.
```

---

## Quick Reference

**Common File Locations:**
- Node components: `features/business-logic/nodes/[category]/`
- Type definitions: `features/business-logic/flow-editor/types/index.ts`
- Node registration: `features/business-logic/flow-editor/constants/index.ts`
- FlowCanvas: `features/business-logic/flow-editor/components/FlowCanvas.tsx`
- Sidebar: `features/business-logic/components/sidebar/constants.ts`
- Node inspector: `features/business-logic/components/node-inspector/`

**Handle Types:**
- `s` = string (blue)
- `n` = number (orange)  
- `b` = boolean (green)
- `x` = any (gray)
- `j` = JSON (indigo)
- `a` = array (pink)

**Essential Imports:**
```typescript
import { useReactFlow, useNodeConnections, useNodesData } from '@xyflow/react'
import type { AgenNode } from '../../FlowEditor'
import { extractNodeValue } from '../utils/nodeUtils'
``` 