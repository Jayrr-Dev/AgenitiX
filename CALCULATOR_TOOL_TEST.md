# Calculator Tool Testing Guide

## 🧮 Quick Test Setup

### 1. Create the Flow
1. **Add aiTools node** → Enable "Calculator" checkbox
2. **Add aiAgent node** → Connect aiTools output to aiAgent tools-input (bottom)
3. **Add text input** → Connect to aiAgent text-input (top)

### 2. Test Calculations

Try these inputs to test the calculator tool:

#### ✅ Basic Math
- `"What is 15 + 25?"`
- `"Calculate 100 - 37"`
- `"Multiply 8 by 12"`
- `"Divide 144 by 12"`

#### ✅ Complex Expressions
- `"What's (10 + 5) * 3?"`
- `"Calculate 100 / (5 + 5)"`
- `"Solve -5 + 3.14 * 2"`
- `"What is 2 + 3 * 4 - 1?"`

#### ✅ Real-World Questions
- `"If I have $100 and spend $23.50, how much is left?"`
- `"What's 15% of 200?"`
- `"Calculate the area of a rectangle 12 by 8"`

### 3. Expected Behavior

**✅ What Should Happen:**
1. AI recognizes math questions automatically
2. Calls calculator tool with the expression
3. Returns both the calculation and result
4. Integrates the answer naturally into response

**Example Flow:**
```
Input: "What's 25 * 4 + 10?"
AI Process:
1. 🧠 Detects math question
2. 🛠️ Calls calculator("25 * 4 + 10")
3. 📊 Tool returns: "25 * 4 + 10 = 110"
4. 💬 AI responds: "The result is 110"
```

### 4. Error Testing

Try these to test error handling:
- `"Calculate abc + 123"` → Should handle invalid characters
- `"What's 10 / 0?"` → Should handle division by zero
- `"Calculate 5 + )"` → Should handle syntax errors

### 5. Verification

**✅ Success Indicators:**
- Calculator checkbox shows "Enabled" when checked
- aiAgent receives tools configuration
- AI automatically uses calculator for math questions
- Results are accurate and properly formatted
- Errors are handled gracefully

**❌ Troubleshooting:**
- If no calculation happens: Check tools connection
- If wrong results: Verify calculator logic
- If errors: Check console for tool execution logs

## 🎯 Test Results Expected

The calculator tool should handle:
- ✅ Addition: `2 + 3 = 5`
- ✅ Subtraction: `10 - 4 = 6`  
- ✅ Multiplication: `7 * 8 = 56`
- ✅ Division: `15 / 3 = 5`
- ✅ Parentheses: `(2 + 3) * 4 = 20`
- ✅ Decimals: `3.14 * 2 = 6.28`
- ✅ Negatives: `-5 + 3 = -2`
- ✅ Order of operations: `2 + 3 * 4 = 14`

This demonstrates the full AI tools framework working with one complete, safe implementation!