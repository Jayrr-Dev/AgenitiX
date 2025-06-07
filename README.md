# Legacy Node Registry System

> ⚠️ **LEGACY SYSTEM**: This is the old hardcoded registry system. For new development, use `../yaml-node-registry/`

This directory contains the legacy node registry system that uses hardcoded TypeScript files. It's maintained for backward compatibility while we transition to the new YAML-based system.

## What's Here

- **`nodeRegistry.ts`** (60KB) - Massive hardcoded node registry
- **`inspectorRegistry.ts`** - Legacy inspector controls
- **`category.ts`** - Hardcoded category definitions
- **`inspector.ts`** - Legacy inspector system
- **`node.ts`** - Legacy node system
- **`compatibility/`** - Backward compatibility layers
- **`migration/`** - Migration utilities
- **`backups/`** - Backup files

## Migration Path

1. **Current State**: Legacy system still in use
2. **Transition**: Both systems run in parallel
3. **Future**: Legacy system will be deprecated
4. **End State**: Only YAML system remains

## For New Development

**Don't add new nodes here!** Instead, use the modern YAML-based system:

```bash
cd ../yaml-node-registry/
# Create your node with YAML configuration
# See ../yaml-node-registry/README.md for full instructions
```

## Legacy API

If you need to use the old APIs:

```typescript
import { MODERN_NODE_REGISTRY } from "@node-registry/nodeRegistry";
import { NODE_INSPECTOR_REGISTRY } from "@node-registry/inspectorRegistry";
```

---

> **Migrate to**: `../yaml-node-registry/` for modern, maintainable node development.
