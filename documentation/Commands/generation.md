# Generation Commands

## Overview

This category contains 29 commands related to generation operations.

## 📋 Commands


### build

Build application for production

**Script:** `pnpm run generate:handle-types && next build`

**Dependencies:** run




**Examples:**
```bash
pnpm build
```
```bash
pnpm build # Build for production
```


**Integration Points:**
- Next.js Framework






### prebuild

Execute prebuild command

**Script:** `pnpm generate:tokens`

**Dependencies:** generate




**Examples:**
```bash
pnpm prebuild
```
```bash
pnpm prebuild # Build for production
```








### generate:handle-types

Generate TypeScript handle type definitions

**Script:** `node scripts/gen-handle-types.js`

**Dependencies:** node




**Examples:**
```bash
pnpm generate:handle-types
```








### generate:tokens

Generate CSS design tokens

**Script:** `npx ts-node --project tsconfig.node.json scripts/gen-tokens.ts`

**Dependencies:** ts-node, node


**Parameters:**
- **project** (`string`) - Required - TypeScript project configuration file


**Examples:**
```bash
pnpm generate:tokens
```
```bash
pnpm generate:tokens --project tsconfig.node.json
```


**Integration Points:**
- TypeScript Compilation


**Input Files:**
- `scripts/gen-tokens.ts`




### generate:docs

Generate documentation tokens

**Script:** `npx ts-node --project tsconfig.node.json scripts/gen-docs-tokens.ts`

**Dependencies:** ts-node, node


**Parameters:**
- **project** (`string`) - Required - TypeScript project configuration file


**Examples:**
```bash
pnpm generate:docs
```
```bash
pnpm generate:docs --project tsconfig.node.json
```


**Integration Points:**
- TypeScript Compilation




**Output Files:**
- `documentation/tokens-preview.html`


### generate:node-docs

Generate node documentation

**Script:** `npx ts-node --project tsconfig.node.json scripts/generate-node-docs.ts`

**Dependencies:** ts-node, node


**Parameters:**
- **project** (`string`) - Required - TypeScript project configuration file


**Examples:**
```bash
pnpm generate:node-docs
```
```bash
pnpm generate:node-docs --project tsconfig.node.json
```


**Integration Points:**
- TypeScript Compilation


**Input Files:**
- `features/business-logic-modern/node-domain/`


**Output Files:**
- `documentation/nodes/`


### generate:nodes-overview

Generate nodes overview documentation

**Script:** `npx ts-node --project tsconfig.node.json scripts/generate-nodes-overview.ts`

**Dependencies:** ts-node, node


**Parameters:**
- **project** (`string`) - Required - TypeScript project configuration file


**Examples:**
```bash
pnpm generate:nodes-overview
```
```bash
pnpm generate:nodes-overview --project tsconfig.node.json
```


**Integration Points:**
- TypeScript Compilation






### generate:handle-docs

Generate handle system documentation

**Script:** `npx ts-node --project tsconfig.node.json scripts/generate-handle-docs.ts`

**Dependencies:** ts-node, node


**Parameters:**
- **project** (`string`) - Required - TypeScript project configuration file


**Examples:**
```bash
pnpm generate:handle-docs
```
```bash
pnpm generate:handle-docs --project tsconfig.node.json
```


**Integration Points:**
- TypeScript Compilation


**Input Files:**
- `types/handle-types-manifest.d.ts`


**Output Files:**
- `documentation/handles/`


### generate:ui-overview

Generate UI components overview

**Script:** `npx ts-node --project tsconfig.node.json scripts/generate-ui-overview.ts`

**Dependencies:** ts-node, node


**Parameters:**
- **project** (`string`) - Required - TypeScript project configuration file


**Examples:**
```bash
pnpm generate:ui-overview
```
```bash
pnpm generate:ui-overview --project tsconfig.node.json
```


**Integration Points:**
- TypeScript Compilation






### regenerate:ui-docs

Regenerate UI documentation

**Script:** `npx ts-node --project tsconfig.node.json scripts/regenerate-ui-docs.ts`

**Dependencies:** ts-node, node


**Parameters:**
- **project** (`string`) - Required - TypeScript project configuration file


**Examples:**
```bash
pnpm regenerate:ui-docs
```
```bash
pnpm regenerate:ui-docs --project tsconfig.node.json
```


**Integration Points:**
- TypeScript Compilation






### generate:infrastructure-overview

Generate infrastructure documentation

**Script:** `npx ts-node --project tsconfig.node.json scripts/generate-infrastructure-overview.ts`

**Dependencies:** ts-node, node


**Parameters:**
- **project** (`string`) - Required - TypeScript project configuration file


**Examples:**
```bash
pnpm generate:infrastructure-overview
```
```bash
pnpm generate:infrastructure-overview --project tsconfig.node.json
```


**Integration Points:**
- TypeScript Compilation






### generate:theming-overview

Generate theming documentation

**Script:** `npx ts-node --project tsconfig.node.json scripts/generate-theming-overview.ts`

**Dependencies:** ts-node, node


**Parameters:**
- **project** (`string`) - Required - TypeScript project configuration file


**Examples:**
```bash
pnpm generate:theming-overview
```
```bash
pnpm generate:theming-overview --project tsconfig.node.json
```


**Integration Points:**
- TypeScript Compilation






### generate:nodespec-docs

Generate NodeSpec and Scaffold documentation

**Script:** `npx ts-node --project tsconfig.node.json scripts/generate-nodespec-docs.ts`

**Dependencies:** ts-node, node


**Parameters:**
- **project** (`string`) - Required - TypeScript project configuration file


**Examples:**
```bash
pnpm generate:nodespec-docs
```
```bash
pnpm generate:nodespec-docs --project tsconfig.node.json
```


**Integration Points:**
- TypeScript Compilation


**Input Files:**
- `features/business-logic-modern/infrastructure/node-core/NodeSpec.ts`
- `features/business-logic-modern/infrastructure/node-core/withNodeScaffold.tsx`


**Output Files:**
- `documentation/NodeCore/`


### generate:command-docs

Execute generate:command-docs command

**Script:** `npx ts-node --project tsconfig.node.json scripts/generate-command-docs.ts`

**Dependencies:** ts-node, node


**Parameters:**
- **project** (`string`) - Required - TypeScript project configuration file


**Examples:**
```bash
pnpm generate:command-docs
```
```bash
pnpm generate:command-docs --project tsconfig.node.json
```


**Integration Points:**
- TypeScript Compilation






### check:token-drift

Check for token generation drift

**Script:** `git diff --exit-code app/styles/_generated_tokens.css`




**Parameters:**
- **exitCode** (`boolean`) - Optional - Exit with code on validation failure (default: false)


**Examples:**
```bash
pnpm check:token-drift
```


**Integration Points:**
- Git Version Control




**Output Files:**
- `app/styles/_generated_tokens.css`


### postinstall

Run post-installation tasks

**Script:** `pnpm generate:docs`

**Dependencies:** generate




**Examples:**
```bash
pnpm postinstall
```








### node scripts/gen-docs-tokens.ts

Execute gen-docs-tokens script

**Script:** `node scripts/gen-docs-tokens.ts`

**Dependencies:** node:fs, node:path




**Examples:**
```bash
node scripts/gen-docs-tokens.ts
```
```bash
npx ts-node --project tsconfig.node.json scripts/gen-docs-tokens.ts
```


**Integration Points:**
- Documentation System
- Design Tokens
- Theming System






### node scripts/gen-handle-types.js

Execute gen-handle-types script

**Script:** `node scripts/gen-handle-types.js`

**Dependencies:** node:fs, node:path




**Examples:**
```bash
node scripts/gen-handle-types.js
```
```bash
npx ts-node --project tsconfig.node.json scripts/gen-handle-types.js
```


**Integration Points:**
- Handle System


**Input Files:**
- `utf8`




### node scripts/gen-tokens.ts

Code-gen: Generate CSS custom properties from `tokens.json`.

**Script:** `node scripts/gen-tokens.ts`

**Dependencies:** node:fs, node:path, ts-node




**Examples:**
```bash
node scripts/gen-tokens.ts
```
```bash
npx ts-node --project tsconfig.node.json scripts/gen-tokens.ts
```


**Integration Points:**
- Design Tokens
- Theming System






### node scripts/generate-command-docs.ts

COMMAND DOCUMENTATION GENERATOR - Auto-generated from actual scripts and commands

**Script:** `node scripts/generate-command-docs.ts`

**Dependencies:** typescript, node:fs, node:path, ts-node




**Examples:**
```bash
node scripts/generate-command-docs.ts
```
```bash
npx ts-node --project tsconfig.node.json scripts/generate-command-docs.ts
```


**Integration Points:**
- Documentation System
- Design Tokens
- Node System
- Handle System
- Theming System


**Input Files:**
- `utf-8`
- `utf-8`
- `utf-8`


**Output Files:**
- `index.html`


### node scripts/generate-handle-docs.ts

HANDLE SYSTEM DOCUMENTATION GENERATOR - Comprehensive handle system analysis

**Script:** `node scripts/generate-handle-docs.ts`

**Dependencies:** typescript, node:fs, node:path




**Examples:**
```bash
node scripts/generate-handle-docs.ts
```
```bash
npx ts-node --project tsconfig.node.json scripts/generate-handle-docs.ts
```


**Integration Points:**
- Documentation System
- Node System
- Handle System


**Input Files:**
- `utf8`




### node scripts/generate-infrastructure-overview.ts

Infrastructure Overview Generator

**Script:** `node scripts/generate-infrastructure-overview.ts`

**Dependencies:** node:fs, node:path




**Examples:**
```bash
node scripts/generate-infrastructure-overview.ts
```
```bash
npx ts-node --project tsconfig.node.json scripts/generate-infrastructure-overview.ts
```


**Integration Points:**
- Documentation System
- Design Tokens
- Node System
- Theming System






### node scripts/generate-node-docs.ts

NODE DOCUMENTATION GENERATOR - Enhanced with Infrastructure Integration

**Script:** `node scripts/generate-node-docs.ts`

**Dependencies:** typescript, node:fs, node:path




**Examples:**
```bash
node scripts/generate-node-docs.ts
```
```bash
npx ts-node --project tsconfig.node.json scripts/generate-node-docs.ts
```


**Integration Points:**
- Documentation System
- Design Tokens
- Node System
- Handle System
- Theming System


**Input Files:**
- `utf-8`
- `utf-8`
- `utf-8`
- `utf-8`
- `utf-8`
- `utf8`


**Output Files:**
- `0 Bytes`


### node scripts/generate-nodes-overview.ts

NODES OVERVIEW GENERATOR - Creates comprehensive overview of all available nodes

**Script:** `node scripts/generate-nodes-overview.ts`

**Dependencies:** node:fs, node:path




**Examples:**
```bash
node scripts/generate-nodes-overview.ts
```
```bash
npx ts-node --project tsconfig.node.json scripts/generate-nodes-overview.ts
```


**Integration Points:**
- Documentation System
- Design Tokens
- Node System
- Theming System


**Input Files:**
- `utf8`


**Output Files:**
- `overview.html`


### node scripts/generate-nodespec-docs.ts

NODESPEC & SCAFFOLD DOCUMENTATION GENERATOR - Auto-generated from actual code

**Script:** `node scripts/generate-nodespec-docs.ts`

**Dependencies:** typescript, node:fs, node:path




**Examples:**
```bash
node scripts/generate-nodespec-docs.ts
```
```bash
npx ts-node --project tsconfig.node.json scripts/generate-nodespec-docs.ts
```


**Integration Points:**
- Documentation System
- Node System


**Input Files:**
- `utf-8`
- `utf-8`
- `utf-8`


**Output Files:**
- `NodeSpec.html`
- `documentation/NodeCore`
- `withNodeScaffold.html`


### node scripts/generate-theming-overview.ts

Route: scripts/generate-theming-overview.ts

**Script:** `node scripts/generate-theming-overview.ts`

**Dependencies:** node:fs, node:path




**Examples:**
```bash
node scripts/generate-theming-overview.ts
```
```bash
npx ts-node --project tsconfig.node.json scripts/generate-theming-overview.ts
```


**Integration Points:**
- Documentation System
- Design Tokens
- Node System
- Theming System






### node scripts/generate-ui-overview.ts

UI Overview Generator

**Script:** `node scripts/generate-ui-overview.ts`

**Dependencies:** node:fs, node:path




**Examples:**
```bash
node scripts/generate-ui-overview.ts
```
```bash
npx ts-node --project tsconfig.node.json scripts/generate-ui-overview.ts
```


**Integration Points:**
- Documentation System






### node scripts/git-version.js

GIT-INTEGRATED VERSION DETECTOR

**Script:** `node scripts/git-version.js`

**Dependencies:** node:fs, node:path




**Examples:**
```bash
node scripts/git-version.js
```
```bash
npx ts-node --project tsconfig.node.json scripts/git-version.js
```




**Input Files:**
- `utf8`
- `utf8`
- `utf8`
- `utf8`
- `utf8`
- `utf8`
- `utf8`
- `utf8`
- `utf8`


**Output Files:**
- `package.json`


### node scripts/regenerate-ui-docs.ts

UI Documentation Regenerator

**Script:** `node scripts/regenerate-ui-docs.ts`






**Examples:**
```bash
node scripts/regenerate-ui-docs.ts
```
```bash
npx ts-node --project tsconfig.node.json scripts/regenerate-ui-docs.ts
```


**Integration Points:**
- Documentation System






---

*This documentation is auto-generated from the actual source code.*
