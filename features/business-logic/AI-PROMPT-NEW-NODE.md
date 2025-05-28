# AI Prompt for Adding New Nodes

Use this prompt when asking AI to help you create a new node for the flow editor:

---

## 🤖 AI Assistant Prompt

```
I need help creating a new node for a React Flow-based visual flow editor. Here's the context:

**System Architecture:**
- React Flow with TypeScript
- Modular node system with categories: main, media, automation, integrations, misc
- Nodes have ICON (60x60px) and EXPANDED (120x120px) states
- Handle types: s=string, n=number, b=boolean, j=JSON, a=array, x=any, etc.
- Uses Tailwind CSS for styling

**Node Requirements:**
- Node Name: [YOUR_NODE_NAME]
- Category: [main/media/automation/integrations/misc]
- Purpose: [DESCRIBE_WHAT_THE_NODE_DOES]
- Inputs: [DESCRIBE_INPUT_TYPES_AND_PURPOSES]
- Outputs: [DESCRIBE_OUTPUT_TYPES_AND_PURPOSES]
- Controls: [DESCRIBE_ANY_UI_CONTROLS_NEEDED]

**Naming Convention:**
Follow Function+Object pattern: CreateText, TurnToUppercase, EditObject, ViewOutput, etc.

**Required Implementation Steps:**
1. Create node component in nodes/[category]/[NodeName].tsx
2. Add type definitions in flow-editor/types/index.ts
3. Register configuration in flow-editor/constants/index.ts
4. Register in FlowCanvas in flow-editor/components/FlowCanvas.tsx
5. Add to sidebar in components/sidebar/constants.ts
6. Add controls in components/node-inspector/components/NodeControls.tsx

**Required Patterns:**
- useState for showUI toggle (start false)
- useEffect for logic processing
- CustomHandle components with proper dataType
- Toggle button: {showUI ? '⦿' : '⦾'}
- Responsive sizing: 60x60px icon, 120x120px expanded
- FloatingNodeId component
- Proper TypeScript interfaces
- Error handling with console.error

Please implement all 6 steps and ensure the node follows the established patterns.
```

---

## 📝 Example Usage

Copy the prompt above and fill in your specific requirements:

```
I need help creating a new node for a React Flow-based visual flow editor. Here's the context:

**Node Requirements:**
- Node Name: CalculateSum
- Category: main
- Purpose: Add two numbers together and output the result
- Inputs: Number A (number), Number B (number)
- Outputs: Sum (number)
- Controls: None needed (automatic calculation)

[Rest of prompt remains the same...]
```

---

## 🎯 Quick Reference

**Categories:**
- `main` - Core logic nodes
- `media` - Text/media processing
- `automation` - Triggers and control flow
- `integrations` - External API connections
- `misc` - Utility and helper nodes

**Handle Types:**
- `s` - String (blue)
- `n` - Number (orange)
- `b` - Boolean (green)
- `j` - JSON/Object (indigo)
- `a` - Array (pink)
- `x` - Any type (gray)

**File Locations:**
1. `nodes/[category]/[NodeName].tsx`
2. `flow-editor/types/index.ts`
3. `flow-editor/constants/index.ts`
4. `flow-editor/components/FlowCanvas.tsx`
5. `components/sidebar/constants.ts`
6. `components/node-inspector/components/NodeControls.tsx`