# Quality Assurance Commands

## Overview

This category contains 3 commands related to quality assurance operations.

## 📋 Commands


### lint

Run linting checks on codebase

**Script:** `biome lint .`






**Examples:**
```bash
pnpm lint
```


**Integration Points:**
- Biome Linting






### lint:fix

Fix linting issues automatically

**Script:** `biome check --write .`




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






---

*This documentation is auto-generated from the actual source code.*
