---
inclusion: always
---

# Biome Naming Convention Enforcement

## Overview

This document outlines how Biome is configured to systematically enforce AgenitiX naming conventions across the codebase. The configuration uses Biome's `useFilenamingConvention` and `useNamingConvention` rules with specific overrides for different file types and directories.

## File Naming Enforcement

### **Components** - `PascalCase.tsx`
```typescript
// ✅ Correct
FlowEditor.tsx
NodeInspector.tsx
EmailTemplate.tsx

// ❌ Incorrect (Biome will error)
flowEditor.tsx
node-inspector.tsx
email_template.tsx
```

**Biome Rule**: Applied to `components/**/*.{ts,tsx}`
```json
{
  "useFilenamingConvention": {
    "level": "error",
    "options": {
      "strictCase": true,
      "requireAscii": true,
      "filenameCases": ["PascalCase"]
    }
  }
}
```

### **Hooks** - `camelCase.ts`
```typescript
// ✅ Correct
useNodeData.ts
useWorkflowExecution.ts
useEmailTemplates.ts

// ❌ Incorrect (Biome will error)
UseNodeData.ts
use-node-data.ts
use_node_data.ts
```

**Biome Rule**: Applied to `hooks/**/*.{ts,tsx}` and `**/hooks/**/*.{ts,tsx}`

### **Utilities & Libraries** - `kebab-case.ts`
```typescript
// ✅ Correct
node-utils.ts
email-helpers.ts
workflow-validator.ts

// ❌ Incorrect (Biome will error)
nodeUtils.ts
EmailHelpers.ts
workflow_validator.ts
```

**Biome Rule**: Applied to `lib/**/*.{ts,tsx}`, `utils/**/*.{ts,tsx}`, `types/**/*.{ts,tsx}`, `constants/**/*.{ts,tsx}`

### **Node Domain Files** - `camelCase.ts`
```typescript
// ✅ Correct (Node naming convention)
createText.tsx
viewCsv.tsx
triggerToggle.tsx
testEmail.tsx
cycleTimer.tsx

// ❌ Incorrect (Biome will error)
CreateText.tsx
create-text.tsx
create_text.tsx
```

**Biome Rule**: Applied to `features/business-logic-modern/node-domain/**/*.{ts,tsx}`

### **Convex Files** - `kebab-case.ts`
```typescript
// ✅ Correct
auth-users.ts
email-templates.ts
workflow-runs.ts

// ❌ Incorrect (Biome will error)
authUsers.ts
EmailTemplates.ts
workflow_runs.ts
```

**Biome Rule**: Applied to `convex/**/*.{ts,tsx}`

### **Documentation & Steering** - `kebab-case.md`
```markdown
<!-- ✅ Correct -->
biome-naming-enforcement.md
convex-best-practices.md
typescript-best-practices.md

<!-- ❌ Incorrect (Biome will error) -->
BiomeNamingEnforcement.md
convex_best_practices.md
TypeScriptBestPractices.md
```

**Biome Rule**: Applied to `.kiro/steering/**/*.md`, `documentation/**/*.md`, `**/*.md`

## Code Naming Enforcement

### **Functions & Variables** - `camelCase`
```typescript
// ✅ Correct
const userName = "john";
function validateEmail(email: string) { }
const handleSubmit = () => { };

// ❌ Incorrect (Biome will error)
const user_name = "john";
const UserName = "john";
function ValidateEmail(email: string) { }
```

### **Types & Interfaces** - `PascalCase`
```typescript
// ✅ Correct
interface NodeData {
  id: string;
  type: string;
}

type WorkflowConfig = {
  name: string;
  nodes: NodeData[];
};

class EmailService {
  // ...
}

// ❌ Incorrect (Biome will error)
interface nodeData { }
type workflowConfig = { };
class emailService { }
```

### **Constants** - `CONSTANT_CASE`
```typescript
// ✅ Correct (Global constants)
const NODE_EXECUTION_TIMEOUT = 30000;
const MAX_WORKFLOW_NODES = 100;
const EMAIL_RATE_LIMIT = 10;

// ✅ Correct (Local constants can be camelCase)
const localConfig = { timeout: 5000 };

// ❌ Incorrect (Global constants)
const nodeExecutionTimeout = 30000;
const maxWorkflowNodes = 100;
```

### **Enum Members** - `CONSTANT_CASE`
```typescript
// ✅ Correct
enum NodeType {
  CREATE_TEXT = "createText",
  VIEW_CSV = "viewCsv",
  TRIGGER_TOGGLE = "triggerToggle",
}

// ❌ Incorrect (Biome will error)
enum NodeType {
  createText = "createText",
  viewCsv = "viewCsv",
  triggerToggle = "triggerToggle",
}
```

## Directory Structure Enforcement

### **App Router** - `kebab-case` or `PascalCase`
```
app/
├── (auth-pages)/          # ✅ kebab-case with route groups
├── flows/                 # ✅ kebab-case
├── user-settings/         # ✅ kebab-case
├── EmailTemplates/        # ✅ PascalCase (component-like)
└── api/                   # ✅ kebab-case
```

### **Test Files** - `kebab-case` or `camelCase`
```
__tests__/
├── node-utils.test.ts     # ✅ kebab-case
├── useNodeData.test.ts    # ✅ camelCase (matches hook name)
├── FlowEditor.spec.tsx    # ✅ PascalCase (matches component name)
```

## Biome Configuration Structure

The naming enforcement is implemented through a hierarchical override system:

1. **Base Rules**: Applied to all files
   - `useNamingConvention` with comprehensive conventions
   - `useFilenamingConvention` with default cases

2. **Directory-Specific Overrides**: More specific rules for different areas
   - Components: PascalCase only
   - Hooks: camelCase only
   - Utils/Lib: kebab-case only
   - Node Domain: camelCase only
   - Convex: kebab-case only

3. **Exception Overrides**: Disable rules where needed
   - Config files: Naming rules disabled
   - Generated files: Excluded from linting

## Running Naming Checks

### **Check All Files**
```bash
pnpm lint
```

### **Fix Auto-Fixable Issues**
```bash
pnpm lint:fix
```

### **Check Specific Directory**
```bash
pnpm biome check components/
pnpm biome check hooks/
pnpm biome check convex/
```

### **Format and Check**
```bash
pnpm format
pnpm lint
```

## Common Violations & Fixes

### **Component File Naming**
```bash
# ❌ Error: File should be PascalCase
components/flowEditor.tsx

# ✅ Fix: Rename to PascalCase
components/FlowEditor.tsx
```

### **Hook File Naming**
```bash
# ❌ Error: File should be camelCase
hooks/UseNodeData.ts

# ✅ Fix: Rename to camelCase
hooks/useNodeData.ts
```

### **Utility File Naming**
```bash
# ❌ Error: File should be kebab-case
lib/nodeUtils.ts

# ✅ Fix: Rename to kebab-case
lib/node-utils.ts
```

### **Variable Naming**
```typescript
// ❌ Error: Variable should be camelCase
const user_name = "john";

// ✅ Fix: Use camelCase
const userName = "john";
```

### **Type Naming**
```typescript
// ❌ Error: Interface should be PascalCase
interface nodeData {
  id: string;
}

// ✅ Fix: Use PascalCase
interface NodeData {
  id: string;
}
```

## Integration with Development Workflow

### **Pre-commit Hooks**
The naming conventions are enforced through:
- Biome linting in pre-commit hooks
- CI/CD pipeline checks
- IDE integration with Biome extension

### **IDE Configuration**
Ensure your IDE has the Biome extension installed and configured to:
- Show naming violations as errors
- Auto-fix on save where possible
- Highlight violations in real-time

### **Team Workflow**
1. **Development**: Biome catches violations during development
2. **Pre-commit**: Automated checks prevent bad commits
3. **CI/CD**: Pipeline fails if naming violations exist
4. **Code Review**: Reviewers can focus on logic, not naming

## Exceptions and Special Cases

### **Config Files**
Config files are exempt from naming conventions:
```typescript
// ✅ Allowed
next.config.ts
tailwind.config.js
biome.json
```

### **Generated Files**
Auto-generated files are excluded:
```typescript
// ✅ Excluded from linting
convex/_generated/
generated/
*.min.js
```

### **Third-party Integration**
When integrating with third-party libraries that require specific naming:
```typescript
// ✅ Use object property naming for external APIs
const apiPayload = {
  user_id: userId,        // External API requirement
  first_name: firstName,  // External API requirement
};

// ✅ Internal code still follows conventions
const userData = {
  userId: user.id,
  firstName: user.name,
};
```
## File References

- **Biome Configuration**: #[[file:biome.json]]
- **Development Standards**: #[[file:.kiro/steering/development-standards.md]]
- **Project Structure**: #[[file:.kiro/steering/structure.md]]
- **TypeScript Best Practices**: #[[file:.kiro/steering/typescript-best-practices.md]]

## External References

- [Biome Naming Convention Rules](https://biomejs.dev/linter/rules/use-naming-convention/)
- [Biome File Naming Convention](https://biomejs.dev/linter/rules/use-filenaming-convention/)
- [AgenitiX Development Standards](https://github.com/agenitix/agenitix)