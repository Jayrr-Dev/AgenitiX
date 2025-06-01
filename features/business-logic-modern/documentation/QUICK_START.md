# Quick Start Guide - Modern System

## 🚀 5-Minute Setup for New Developers

### Step 1: Understand the Structure (30 seconds)
```
📦 business-logic-modern/
├── 🏢 domains/          ← Your business logic goes here
├── 🏗️ infrastructure/   ← Shared services (UI, engine, etc.)
└── 📚 documentation/    ← Help files (you're reading one!)
```

### Step 2: Know the Key Files (1 minute)
1. **Main Editor**: `infrastructure/flow-engine/flow-editor/FlowEditor.tsx`
2. **Node Registry**: `infrastructure/registries/modern/EnhancedNodeRegistry.ts`
3. **Components**: `infrastructure/components/modern/components/`

### Step 3: First Task - Add a Simple Node (3 minutes)

---

## 🎯 Common Tasks with Examples

### Task 1: Add a New Node

**1. Create the node component:**
```typescript
// domains/content-creation/nodes/MyNewTextNode.tsx
import React from 'react';

interface MyNewTextNodeProps {
  data: {
    text: string;
    isActive: boolean;
  };
  id: string;
}

export default function MyNewTextNode({ data, id }: MyNewTextNodeProps) {
  return (
    <div className="bg-white border-2 border-blue-500 rounded p-2">
      <div className="font-bold">My New Text Node</div>
      <div>{data.text || 'Enter text...'}</div>
    </div>
  );
}
```

**2. Register the node:**
```typescript
// infrastructure/registries/modern/EnhancedNodeRegistry.ts

// Add import at top
import MyNewTextNode from '../../../domains/content-creation/nodes/MyNewTextNode';

// Add to getNodeTypes function
export const getNodeTypes = (): Record<string, React.ComponentType<any>> => {
  return {
    // ... existing nodes
    myNewTextNode: MyNewTextNode,  // ← Add this line
  };
};
```

**3. Done!** Your node will appear in the editor automatically.

---

### Task 2: Add a Reusable UI Component

**1. Create the component:**
```typescript
// infrastructure/components/modern/components/CustomButton.tsx
import React from 'react';

interface CustomButtonProps {
  text: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export default function CustomButton({ text, onClick, variant = 'primary' }: CustomButtonProps) {
  const baseStyles = "px-4 py-2 rounded font-medium transition-colors";
  const variantStyles = {
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300"
  };
  
  return (
    <button 
      className={`${baseStyles} ${variantStyles[variant]}`}
      onClick={onClick}
    >
      {text}
    </button>
  );
}
```

**2. Use it anywhere:**
```typescript
import CustomButton from '../../../infrastructure/components/modern/components/CustomButton';

// In your component
<CustomButton 
  text="Click me!" 
  onClick={() => console.log('Clicked!')}
  variant="primary"
/>
```

---

### Task 3: Modify Theme/Colors

**Edit this file:**
```typescript
// infrastructure/theming/modern/styles/colors.ts (if it exists)
// Or add styles to existing theme files

export const customColors = {
  nodeBackground: '#f8fafc',
  nodeBorder: '#e2e8f0',
  accent: '#3b82f6',
  // ... other colors
};
```

---

## 🔍 Debugging Tips

### Node not appearing in editor?
1. ✅ Check if registered in `EnhancedNodeRegistry.ts`
2. ✅ Check import path is correct
3. ✅ Check for TypeScript errors

### Import errors?
1. ✅ Use relative paths: `../../../`
2. ✅ Check file exists at that path
3. ✅ Check spelling and case sensitivity

### Styling not working?
1. ✅ Check Tailwind classes are valid
2. ✅ Check theme files in `infrastructure/theming/`
3. ✅ Inspect element in browser dev tools

---

## 📁 File Templates

### New Node Template:
```typescript
import React from 'react';

interface [NodeName]Props {
  data: {
    // Define your data structure
    value?: string;
    isActive: boolean;
  };
  id: string;
}

export default function [NodeName]({ data, id }: [NodeName]Props) {
  return (
    <div className="bg-white border-2 border-gray-300 rounded p-3">
      <div className="font-semibold text-sm text-gray-700">
        [Node Display Name]
      </div>
      <div className="mt-2">
        {/* Your node content here */}
        {data.value || 'Default content'}
      </div>
    </div>
  );
}
```

### New Component Template:
```typescript
import React from 'react';

interface [ComponentName]Props {
  // Define your props
  children?: React.ReactNode;
}

export default function [ComponentName]({ children }: [ComponentName]Props) {
  return (
    <div className="[your-styles]">
      {children}
    </div>
  );
}
```

---

## 🎯 Navigation Shortcuts

### VS Code Tips:
- `Ctrl+P` → Type filename to jump quickly
- `Ctrl+Shift+F` → Search across all files
- `Ctrl+Click` → Go to definition

### Common Paths to Bookmark:
- `domains/` ← Most of your work happens here
- `infrastructure/registries/modern/EnhancedNodeRegistry.ts` ← Register new nodes
- `infrastructure/components/modern/components/` ← Shared UI components

---

## 🆘 When You're Stuck

### 1. Check Existing Examples
Look at similar files in the same directory:
- Need a node? Check other files in `domains/[same-domain]/nodes/`
- Need a component? Check other files in `infrastructure/components/modern/components/`

### 2. Follow the Pattern
- Same file structure
- Same naming conventions  
- Same import paths

### 3. Common Solutions
| Problem | Solution |
|---------|----------|
| "Module not found" | Check relative path: `../../../` |
| "Node not in sidebar" | Register in `EnhancedNodeRegistry.ts` |
| "Styles not working" | Check Tailwind classes, add to theme files |
| "TypeScript errors" | Add proper interfaces, check prop types |

---

## ✅ Checklist for New Features

**Adding a new node:**
- [ ] Created node component in correct domain
- [ ] Added to `EnhancedNodeRegistry.ts`
- [ ] Tested in browser
- [ ] Added proper TypeScript types

**Adding a new component:**
- [ ] Created in `infrastructure/components/modern/components/`
- [ ] Added proper props interface
- [ ] Used consistent styling
- [ ] Tested reusability

**Modifying existing code:**
- [ ] Maintained existing patterns
- [ ] Updated related documentation
- [ ] Tested changes don't break other features

---

🎉 **You're ready to start building!** The system is designed to be intuitive once you understand the basic pattern: domains for business logic, infrastructure for shared services. 