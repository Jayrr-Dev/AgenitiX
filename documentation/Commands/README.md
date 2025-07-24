# Command Documentation

## Overview

This section contains **auto-generated documentation** for all commands, scripts, and generators in the project. All documentation is automatically generated from the actual source code and updated when commands change.

## 📊 Auto-Generated Analysis

- **Total Commands**: 45
- **Package Scripts**: 29
- **Plop Generators**: 2
- **Categories**: 7
- **Last Updated**: 7/23/2025, 7:51:23 PM

## 🎯 Command Categories


### Development
2 commands

- **[dev](#dev)** - Start development server with hot reload
- **[start](#start)** - Start production server


### Utilities
2 commands

- **[gen-registry](#gen-registry)** - Execute gen-registry command
- **[ci:tokens](#ci-tokens)** - Run token validation in CI


### Generation
29 commands

- **[build](#build)** - Build application for production
- **[prebuild](#prebuild)** - Execute prebuild command
- **[generate:handle-types](#generate-handle-types)** - Generate TypeScript handle type definitions
- **[generate:tokens](#generate-tokens)** - Generate CSS design tokens
- **[generate:docs](#generate-docs)** - Generate documentation tokens
- **[generate:node-docs](#generate-node-docs)** - Generate node documentation
- **[generate:nodes-overview](#generate-nodes-overview)** - Generate nodes overview documentation
- **[generate:handle-docs](#generate-handle-docs)** - Generate handle system documentation
- **[generate:ui-overview](#generate-ui-overview)** - Generate UI components overview
- **[regenerate:ui-docs](#regenerate-ui-docs)** - Regenerate UI documentation
- **[generate:infrastructure-overview](#generate-infrastructure-overview)** - Generate infrastructure documentation
- **[generate:theming-overview](#generate-theming-overview)** - Generate theming documentation
- **[generate:nodespec-docs](#generate-nodespec-docs)** - Generate NodeSpec and Scaffold documentation
- **[generate:command-docs](#generate-command-docs)** - Execute generate:command-docs command
- **[check:token-drift](#check-token-drift)** - Check for token generation drift
- **[postinstall](#postinstall)** - Run post-installation tasks
- **[node scripts/gen-docs-tokens.ts](#node-scripts-gen-docs-tokens-ts)** - Execute gen-docs-tokens script
- **[node scripts/gen-handle-types.js](#node-scripts-gen-handle-types-js)** - Execute gen-handle-types script
- **[node scripts/gen-tokens.ts](#node-scripts-gen-tokens-ts)** - Code-gen: Generate CSS custom properties from `tokens.json`.
- **[node scripts/generate-command-docs.ts](#node-scripts-generate-command-docs-ts)** - COMMAND DOCUMENTATION GENERATOR - Auto-generated from actual scripts and commands
- **[node scripts/generate-handle-docs.ts](#node-scripts-generate-handle-docs-ts)** - HANDLE SYSTEM DOCUMENTATION GENERATOR - Comprehensive handle system analysis
- **[node scripts/generate-infrastructure-overview.ts](#node-scripts-generate-infrastructure-overview-ts)** - Infrastructure Overview Generator
- **[node scripts/generate-node-docs.ts](#node-scripts-generate-node-docs-ts)** - NODE DOCUMENTATION GENERATOR - Enhanced with Infrastructure Integration
- **[node scripts/generate-nodes-overview.ts](#node-scripts-generate-nodes-overview-ts)** - NODES OVERVIEW GENERATOR - Creates comprehensive overview of all available nodes
- **[node scripts/generate-nodespec-docs.ts](#node-scripts-generate-nodespec-docs-ts)** - NODESPEC & SCAFFOLD DOCUMENTATION GENERATOR - Auto-generated from actual code
- **[node scripts/generate-theming-overview.ts](#node-scripts-generate-theming-overview-ts)** - Route: scripts/generate-theming-overview.ts
- **[node scripts/generate-ui-overview.ts](#node-scripts-generate-ui-overview-ts)** - UI Overview Generator
- **[node scripts/git-version.js](#node-scripts-git-version-js)** - GIT-INTEGRATED VERSION DETECTOR
- **[node scripts/regenerate-ui-docs.ts](#node-scripts-regenerate-ui-docs-ts)** - UI Documentation Regenerator


### Quality Assurance
3 commands

- **[lint](#lint)** - Run linting checks on codebase
- **[lint:fix](#lint-fix)** - Fix linting issues automatically
- **[format](#format)** - Format code using Biome


### Scaffolding
4 commands

- **[plop](#plop)** - Run Plop scaffolding tool
- **[new:node](#new-node)** - Create a new node using Plop
- **[plop node](#plop-node)** - Create a new node using the NodeSpec architecture
- **[plop delete-node](#plop-delete-node)** - Comprehensively delete an existing node and clean up all associated files


### Migration
1 commands

- **[migrate:nodes](#migrate-nodes)** - Migrate all nodes to latest schema


### Validation
4 commands

- **[validate:tokens](#validate-tokens)** - Validate design tokens
- **[validate:colors](#validate-colors)** - Validate primitive color tokens
- **[validate:adapter](#validate-adapter)** - Validate adapter logic
- **[node scripts/validate-adapter-logic.js](#node-scripts-validate-adapter-logic-js)** - VALIDATE ADAPTER LOGIC - Ensures NodeInspectorAdapter uses comprehensive approach


## 📋 Detailed Command Reference


### dev

Start development server with hot reload

**Script:** `next dev`

**Category:** Development






**Examples:**
```bash
pnpm dev
```
```bash
pnpm dev # Start development server
```


**Integration Points:**
- Next.js Framework






### gen-registry

Execute gen-registry command

**Script:** `node scripts/gen-registry.js`

**Category:** Utilities

**Dependencies:** node




**Examples:**
```bash
pnpm gen-registry
```








### build

Build application for production

**Script:** `pnpm run generate:handle-types && next build`

**Category:** Generation

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

**Category:** Generation

**Dependencies:** generate




**Examples:**
```bash
pnpm prebuild
```
```bash
pnpm prebuild # Build for production
```








### start

Start production server

**Script:** `next start`

**Category:** Development






**Examples:**
```bash
pnpm start
```


**Integration Points:**
- Next.js Framework






### lint

Run linting checks on codebase

**Script:** `biome lint .`

**Category:** Quality Assurance






**Examples:**
```bash
pnpm lint
```


**Integration Points:**
- Biome Linting






### lint:fix

Fix linting issues automatically

**Script:** `biome check --write .`

**Category:** Quality Assurance




**Parameters:**
- **write** (`boolean`) - Optional - Write changes to files (default: false)


**Examples:**
```bash
pnpm lint:fix
```
```bash
pnpm lint:fix --write
```


**Integration Points:**
- Biome Linting






### format

Format code using Biome

**Script:** `biome format --write .`

**Category:** Quality Assurance




**Parameters:**
- **write** (`boolean`) - Optional - Write changes to files (default: false)


**Examples:**
```bash
pnpm format
```
```bash
pnpm format --write
```


**Integration Points:**
- Biome Linting






### plop

Run Plop scaffolding tool

**Script:** `plop`

**Category:** Scaffolding






**Examples:**
```bash
pnpm plop
```


**Integration Points:**
- Plop Scaffolding






### new:node

Create a new node using Plop

**Script:** `plop node`

**Category:** Scaffolding

**Dependencies:** node




**Examples:**
```bash
pnpm new:node
```


**Integration Points:**
- Plop Scaffolding






### migrate:nodes

Migrate all nodes to latest schema

**Script:** `npx ts-node --project tsconfig.node.json tooling/migration-scripts/migrate-all-nodes.ts`

**Category:** Migration

**Dependencies:** ts-node, node


**Parameters:**
- **project** (`string`) - Required - TypeScript project configuration file


**Examples:**
```bash
pnpm migrate:nodes
```
```bash
pnpm migrate:nodes --project tsconfig.node.json
```


**Integration Points:**
- TypeScript Compilation






### generate:handle-types

Generate TypeScript handle type definitions

**Script:** `node scripts/gen-handle-types.js`

**Category:** Generation

**Dependencies:** node




**Examples:**
```bash
pnpm generate:handle-types
```








### generate:tokens

Generate CSS design tokens

**Script:** `npx ts-node --project tsconfig.node.json scripts/gen-tokens.ts`

**Category:** Generation

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

**Category:** Generation

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

**Category:** Generation

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

**Category:** Generation

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

**Category:** Generation

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

**Category:** Generation

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

**Category:** Generation

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

**Category:** Generation

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

**Category:** Generation

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

**Category:** Generation

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

**Category:** Generation

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

**Category:** Generation




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


### validate:tokens

Validate design tokens

**Script:** `node scripts/theming/validate-tokens.js`

**Category:** Validation

**Dependencies:** node




**Examples:**
```bash
pnpm validate:tokens
```








### ci:tokens

Run token validation in CI

**Script:** `pnpm validate:tokens`

**Category:** Utilities

**Dependencies:** validate




**Examples:**
```bash
pnpm ci:tokens
```








### validate:colors

Validate primitive color tokens

**Script:** `node scripts/theming/validate-primitive-colors.js`

**Category:** Validation

**Dependencies:** node




**Examples:**
```bash
pnpm validate:colors
```








### validate:adapter

Validate adapter logic

**Script:** `node scripts/validate-adapter-logic.js`

**Category:** Validation

**Dependencies:** node




**Examples:**
```bash
pnpm validate:adapter
```








### postinstall

Run post-installation tasks

**Script:** `pnpm generate:docs`

**Category:** Generation

**Dependencies:** generate




**Examples:**
```bash
pnpm postinstall
```








### plop node

Create a new node using the NodeSpec architecture

**Script:** `plop node`

**Category:** Scaffolding

**Dependencies:** plop




**Examples:**
```bash
pnpm plop node
```
```bash
npx plop node
```


**Integration Points:**
- Plop Scaffolding
- File Generation
- Template System


**Input Files:**
- `plopfile.js`
- `tooling/dev-scripts/plop-templates/`




### plop delete-node

Comprehensively delete an existing node and clean up all associated files

**Script:** `plop delete-node`

**Category:** Scaffolding

**Dependencies:** plop




**Examples:**
```bash
pnpm plop delete-node
```
```bash
npx plop delete-node
```


**Integration Points:**
- Plop Scaffolding
- File Generation
- Template System


**Input Files:**
- `plopfile.js`
- `tooling/dev-scripts/plop-templates/`




### node scripts/gen-docs-tokens.ts

Execute gen-docs-tokens script

**Script:** `node scripts/gen-docs-tokens.ts`

**Category:** Generation

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

**Category:** Generation

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

**Category:** Generation

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

**Category:** Generation

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

**Category:** Generation

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

**Category:** Generation

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

**Category:** Generation

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

**Category:** Generation

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

**Category:** Generation

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

**Category:** Generation

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

**Category:** Generation

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

**Category:** Generation

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

**Category:** Generation






**Examples:**
```bash
node scripts/regenerate-ui-docs.ts
```
```bash
npx ts-node --project tsconfig.node.json scripts/regenerate-ui-docs.ts
```


**Integration Points:**
- Documentation System






### node scripts/validate-adapter-logic.js

VALIDATE ADAPTER LOGIC - Ensures NodeInspectorAdapter uses comprehensive approach

**Script:** `node scripts/validate-adapter-logic.js`

**Category:** Validation

**Dependencies:** node:fs, node:path




**Examples:**
```bash
node scripts/validate-adapter-logic.js
```
```bash
npx ts-node --project tsconfig.node.json scripts/validate-adapter-logic.js
```




**Input Files:**
- `utf8`




## 🔗 Integration Points

This documentation is automatically generated from:
- **Package.json Scripts** - All npm/pnpm scripts
- **Plop Generators** - Scaffolding and generation commands
- **Custom Scripts** - TypeScript and JavaScript scripts in scripts/
- **Last Analysis**: 7/23/2025, 7:51:23 PM

---

*This documentation is auto-generated from the actual source code. Any changes to scripts or commands will be reflected in the next generation.*
