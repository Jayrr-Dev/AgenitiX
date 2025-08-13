# Logic Domain

Primitive boolean logic gate nodes for digital logic operations.

## Overview

The Logic domain provides fundamental boolean logic gates that form the building blocks of digital logic circuits. All logic nodes are primitive (60x60px) and designed for high-performance boolean operations.

## Available Nodes

### logicAnd
- **Function**: Boolean AND gate
- **Logic**: Outputs `true` when ALL inputs are `true`
- **Truth Table**: Only `true` when all inputs are `true`
- **Use Case**: Conditional logic requiring all conditions to be met

### logicOr
- **Function**: Boolean OR gate  
- **Logic**: Outputs `true` when ANY input is `true`
- **Truth Table**: `true` when at least one input is `true`
- **Use Case**: Conditional logic requiring any condition to be met

### logicNot
- **Function**: Boolean NOT gate (inverter)
- **Logic**: Inverts the input (`true` → `false`, `false` → `true`)
- **Truth Table**: Opposite of input
- **Use Case**: Signal inversion, negative logic

### logicXor
- **Function**: Boolean XOR gate (exclusive OR)
- **Logic**: Outputs `true` when an ODD number of inputs are `true`
- **Truth Table**: `true` when inputs differ
- **Use Case**: Difference detection, toggle operations

### logicXnor
- **Function**: Boolean XNOR gate (exclusive NOR)
- **Logic**: Outputs `true` when an EVEN number of inputs are `true`
- **Truth Table**: `true` when inputs are the same
- **Use Case**: Equality detection, synchronization

## Technical Specifications

### Node Size
- **Collapsed**: 60x60px (PRIMITIVE)
- **Expanded**: 60x60px (PRIMITIVE)
- **Category**: LOGIC

### Handles
- **Input**: Left side, Boolean type, accepts multiple connections
- **Output**: Right side, Boolean type, single connection

### Data Priority
Logic nodes read input data in this priority order:
1. `output` - Primary output from source nodes
2. `store` - Stored values from store nodes
3. `booleanValue` - Direct boolean values

### Performance
- **Real-time**: Logic computation happens on every input change
- **Optimized**: Uses memoized callbacks and refs for performance
- **Debounced**: Output propagation prevents unnecessary updates

## Usage Examples

### Basic AND Gate
```
[Input A] ──┐
            ├── [AND] ── [Output]
[Input B] ──┘
```

### Complex Logic Chain
```
[A] ──┐
      ├── [AND] ──┐
[B] ──┘          ├── [OR] ── [Result]
                 │
[C] ── [NOT] ────┘
```

### XOR Toggle
```
[State] ──┐
          ├── [XOR] ── [New State]
[Toggle] ─┘
```

## Integration

### With Store Nodes
```
[storeLocal] ── [logicAnd] ── [viewBoolean]
```

### With Trigger Nodes
```
[triggerPulse] ── [logicNot] ── [conditionalFlow]
```

### With Test Nodes
```
[testCondition] ── [logicOr] ── [testResult]
```

## Best Practices

1. **Chain Logic**: Combine multiple gates for complex logic
2. **Use NOT**: Invert signals when needed for negative logic
3. **XOR for Toggles**: Use XOR gates for toggle operations
4. **AND for Conditions**: Use AND when all conditions must be true
5. **OR for Alternatives**: Use OR when any condition can trigger

## Error Handling

- **No Inputs**: Returns `null` when no valid inputs connected
- **Invalid Data**: Filters out non-boolean values automatically
- **Disabled State**: Returns `null` when node is disabled
- **Type Safety**: Strict boolean type checking and conversion

## Performance Notes

- Logic gates are highly optimized for real-time operation
- Use `useCallback` and `useRef` for performance
- Minimal re-renders through proper memoization
- Efficient edge traversal and data extraction

## Future Enhancements

- **Multi-bit Logic**: Support for bit arrays
- **Timing Logic**: Add propagation delay simulation
- **Visual Truth Tables**: Interactive truth table display
- **Logic Analyzer**: Built-in logic state visualization