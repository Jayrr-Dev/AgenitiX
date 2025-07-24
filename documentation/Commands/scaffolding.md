# Scaffolding Commands

## Overview

This category contains 4 commands related to scaffolding operations.

## 📋 Commands


### plop

Run Plop scaffolding tool

**Script:** `plop`






**Examples:**
```bash
pnpm plop
```


**Integration Points:**
- Plop Scaffolding






### new:node

Create a new node using Plop

**Script:** `plop node`

**Dependencies:** node




**Examples:**
```bash
pnpm new:node
```


**Integration Points:**
- Plop Scaffolding






### plop node

Create a new node using the NodeSpec architecture

**Script:** `plop node`

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




---

*This documentation is auto-generated from the actual source code.*
