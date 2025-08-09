# Logic Nodes Testing Guide

## Quick Test Scenarios

### 1. Basic AND Gate Test
```
[viewBoolean: true] ──┐
                      ├── [logicAnd] ── [viewBoolean: result]
[viewBoolean: true] ──┘
```
**Expected**: Result should be `true`

### 2. Basic OR Gate Test
```
[viewBoolean: false] ──┐
                       ├── [logicOr] ── [viewBoolean: result]
[viewBoolean: true] ───┘
```
**Expected**: Result should be `true`

### 3. NOT Gate Test
```
[viewBoolean: true] ── [logicNot] ── [viewBoolean: result]
```
**Expected**: Result should be `false`

### 4. XOR Gate Test
```
[viewBoolean: true] ──┐
                      ├── [logicXor] ── [viewBoolean: result]
[viewBoolean: false] ─┘
```
**Expected**: Result should be `true`

### 5. XNOR Gate Test
```
[viewBoolean: true] ──┐
                      ├── [logicXnor] ── [viewBoolean: result]
[viewBoolean: true] ──┘
```
**Expected**: Result should be `true` (both inputs same)

### 6. Complex Logic Chain
```
[viewBoolean: true] ──┐
                      ├── [logicAnd] ──┐
[viewBoolean: true] ──┘               ├── [logicOr] ── [viewBoolean: result]
                                      │
[viewBoolean: false] ── [logicNot] ───┘
```
**Expected**: Result should be `true`

## Testing Checklist

- [ ] All 5 logic gates appear in node palette
- [ ] All gates are 60x60px (primitive size)
- [ ] Input handles accept boolean connections
- [ ] Output handles provide boolean values
- [ ] Visual indicators show correct state (✓, ✗, -)
- [ ] Gates respond to input changes in real-time
- [ ] Multiple inputs work correctly (except NOT)
- [ ] Disabled state works (returns null)
- [ ] Inspector shows enable/disable toggle

## Truth Tables Verification

### AND Gate
| A | B | Output |
|---|---|--------|
| 0 | 0 | 0      |
| 0 | 1 | 0      |
| 1 | 0 | 0      |
| 1 | 1 | 1      |

### OR Gate
| A | B | Output |
|---|---|--------|
| 0 | 0 | 0      |
| 0 | 1 | 1      |
| 1 | 0 | 1      |
| 1 | 1 | 1      |

### NOT Gate
| A | Output |
|---|--------|
| 0 | 1      |
| 1 | 0      |

### XOR Gate
| A | B | Output |
|---|---|--------|
| 0 | 0 | 0      |
| 0 | 1 | 1      |
| 1 | 0 | 1      |
| 1 | 1 | 0      |

### XNOR Gate
| A | B | Output |
|---|---|--------|
| 0 | 0 | 1      |
| 0 | 1 | 0      |
| 1 | 0 | 0      |
| 1 | 1 | 1      |