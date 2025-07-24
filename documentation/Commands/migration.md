# Migration Commands

## Overview

This category contains 1 commands related to migration operations.

## 📋 Commands


### migrate:nodes

Migrate all nodes to latest schema

**Script:** `npx ts-node --project tsconfig.node.json tooling/migration-scripts/migrate-all-nodes.ts`

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






---

*This documentation is auto-generated from the actual source code.*
