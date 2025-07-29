---
inclusion: always
---

# Biome Naming Convention Enforcement

## Overview

This document outlines how Biome is configured to enforce AgenitiX naming conventions. The current configuration uses a **simplified approach** with flexible file naming conventions while maintaining code quality through other linting rules.

## Current Biome Configuration

### File Naming Convention (Current)

**Rule**: `useFilenamingConvention` is set to **warn** level with flexible options:

```json
{
  "useFilenamingConvention": {
    "level": "warn",
    "options": {
      "strictCase": false,
      "requireAscii": true,
      "filenameCases": ["kebab-case", "PascalCase", "camelCase"]
    }
  }
}
```

### Variable Naming Convention (Current)

**Rule**: `useNamingConvention` is currently **disabled** (`"off"`)

This means Biome does not enforce specific variable, function, or type naming conventions - this is left to team standards and code review.

## Accepted File Naming Patterns

Since `strictCase: false` and multiple cases are allowed, these patterns are all acceptable:

### **Components**
```typescript
// ✅ All acceptable
FlowEditor.tsx       // PascalCase (preferred)
flow-editor.tsx      // kebab-case
flowEditor.tsx       // camelCase
```

### **Hooks**
```typescript
// ✅ All acceptable
useNodeData.ts       // camelCase (preferred)
use-node-data.ts     // kebab-case  
UseNodeData.ts       // PascalCase
```

### **Utilities & Libraries**
```typescript
// ✅ All acceptable
node-utils.ts        // kebab-case (preferred)
nodeUtils.ts         // camelCase
NodeUtils.ts         // PascalCase
```

### **Node Domain Files**
```typescript
// ✅ All acceptable
createText.tsx       // camelCase (preferred for nodes)
create-text.tsx      // kebab-case
CreateText.tsx       // PascalCase
```

### **Convex Files**
```typescript
// ✅ All acceptable
auth-users.ts        // kebab-case (preferred)
authUsers.ts         // camelCase
AuthUsers.ts         // PascalCase
```

## Configuration Overrides

### **Config Files Exception**
Config files are completely exempt from naming conventions:

```json
{
  "include": ["**/*.config.{ts,js,mjs}"],
  "linter": {
    "rules": {
      "style": {
        "useFilenamingConvention": "off",
        "useNamingConvention": "off"
      }
    }
  }
}
```

**Examples**:
```typescript
// ✅ Allowed (no restrictions)
next.config.ts
tailwind.config.js
biome.json
```

### **UI Components Exception**
Shadcn/UI components have relaxed accessibility rules:

```json
{
  "include": ["components/ui/**/*.{ts,tsx}"],
  "linter": {
    "rules": {
      "a11y": {
        "useButtonType": "off",
        "noSvgWithoutTitle": "off"
      }
    }
  }
}
```

### **Layout File Exception**
The main layout file can use `dangerouslySetInnerHTML`:

```json
{
  "include": ["app/layout.tsx"],
  "linter": {
    "rules": {
      "security": {
        "noDangerouslySetInnerHtml": "off"
      }
    }
  }
}
```

## Other Enforced Code Quality Rules

While naming conventions are relaxed, Biome enforces many other important code quality rules:

### **Style Rules (Active)**
- `useTemplate`: Prefer template literals over string concatenation
- `useConst`: Use `const` for variables that are never reassigned
- `useShorthandArrayType`: Use `T[]` instead of `Array<T>`
- `useBlockStatements`: Require braces around block statements
- `noImplicitBoolean`: Avoid implicit boolean conversions

### **Correctness Rules (Active)**
- `noUnusedVariables`: Warn about unused variables
- `noUnusedImports`: Error on unused imports
- `noUndeclaredVariables`: Error on undeclared variables
- `noConstAssign`: Error on reassigning const variables

### **Accessibility Rules (Active)**
- `useButtonType`: Require explicit button type attributes
- `useAltText`: Require alt text for images
- `useHtmlLang`: Require lang attribute on html element
- `useValidAnchor`: Ensure anchors have valid href

### **Security Rules (Active)**
- `noDangerouslySetInnerHtml`: Prevent dangerous HTML injection
- `noDangerouslySetInnerHtmlWithChildren`: Prevent conflicts with children

## Running Biome Checks

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

## Team Guidelines (Not Enforced by Biome)

While Biome allows flexibility, the team should follow these **preferred** conventions:

### **Preferred File Naming**
- **Components**: `PascalCase.tsx` (e.g., `FlowEditor.tsx`)
- **Hooks**: `camelCase.ts` (e.g., `useNodeData.ts`)
- **Utilities**: `kebab-case.ts` (e.g., `node-utils.ts`)
- **Node Domain**: `camelCase.tsx` (e.g., `createText.tsx`)
- **Convex**: `kebab-case.ts` (e.g., `auth-users.ts`)
- **Documentation**: `kebab-case.md` (e.g., `biome-naming-enforcement.md`)

### **Preferred Code Naming**
- **Variables & Functions**: `camelCase` (e.g., `userName`, `validateEmail`)
- **Types & Interfaces**: `PascalCase` (e.g., `NodeData`, `WorkflowConfig`)
- **Constants**: `CONSTANT_CASE` (e.g., `MAX_NODES`, `API_TIMEOUT`)
- **Enum Members**: `CONSTANT_CASE` (e.g., `CREATE_TEXT`, `SEND_EMAIL`)

## Ignored Files and Directories

Biome ignores these files/directories completely:

```json
[
  "node_modules/**",
  ".next/**",
  "dist/**", 
  "build/**",
  "coverage/**",
  ".vercel/**",
  "convex/_generated/**",
  "generated/**",
  "*.min.js",
  "*.min.css",
  ".github/**",
  ".husky/**", 
  "src/components/ui/**",
  "*.config.ts",
  "*.config.js",
  "*.config.mjs",
  "backups/**",
  "app/styles/_generated_tokens.css",
  "public/sw.js",
  "public/workbox-*.js"
]
```

## Benefits of Current Approach

### **Flexibility**
- Allows teams to gradually adopt naming conventions
- Doesn't block development with strict naming requirements
- Warning level alerts without breaking builds

### **Focus on Code Quality**
- Emphasizes functional correctness over naming
- Catches real bugs and security issues
- Maintains accessibility standards

### **Developer Experience**
- Reduced friction during development
- Focus on business logic rather than naming debates
- Gradual improvement through warnings

## Future Considerations

The team may choose to:

1. **Enable `useNamingConvention`** with specific rules for variables/types
2. **Increase file naming to error level** for stricter enforcement
3. **Add directory-specific overrides** for more granular control
4. **Create custom rules** for AgenitiX-specific patterns

## File References

- **Biome Configuration**: #[[file:biome.json]]
- **Development Standards**: #[[file:.kiro/steering/development-standards.md]]
- **Project Structure**: #[[file:.kiro/steering/structure.md]]
- **TypeScript Best Practices**: #[[file:.kiro/steering/typescript-best-practices.md]]

## External References

- [Biome Naming Convention Rules](https://biomejs.dev/linter/rules/use-naming-convention/)
- [Biome File Naming Convention](https://biomejs.dev/linter/rules/use-filenaming-convention/)
- [Biome Configuration Schema](https://biomejs.dev/schemas/1.9.4/schema.json)