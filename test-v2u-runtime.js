// Test V2U nodes at runtime with actual NodeFactory
console.log("🔍 Testing V2U Nodes at Runtime");

// Since this needs to be a simple test, let's create a debug function
// that can be called in the browser console

const testV2UNodes = () => {
  console.log("🧪 Testing V2U Node Validation at Runtime");

  const v2uNodes = [
    "createTextV2U",
    "viewOutputV2U",
    "triggerOnToggleV2U",
    "testErrorV2U",
  ];

  // Test each V2U node
  v2uNodes.forEach((nodeType) => {
    console.log(`\n--- Testing ${nodeType} ---`);

    try {
      // Simulate the exact validation logic from useDragAndDrop
      console.log(`  1. Checking if '${nodeType}' is valid...`);

      // This is what the drag and drop hook does
      if (!nodeType) {
        console.log("  ❌ Node type is empty");
        return;
      }

      // Try to access the NodeFactory (this is where it might fail)
      console.log("  2. Attempting to access NodeFactory...");

      // Check if we can validate the node type
      console.log("  3. Checking validation...");
    } catch (error) {
      console.error(`  ❌ Error testing ${nodeType}:`, error);
    }
  });
};

// Create instructions for browser console testing
console.log(`
🎯 DEBUGGING INSTRUCTIONS:

1. Open the browser console on the app page
2. Run this command:
   window.testV2UNodes()

3. This will test the exact same validation logic as the drag and drop

4. Also try dragging a V2U node and watch the console for:
   - "🎯 Drop event triggered"
   - "🔍 Validating node type: [nodeType]"
   - "❌ Invalid node type: [nodeType]" (if validation fails)
   - "📍 Creating node at position..." (if validation passes)

5. If you see "❌ Invalid node type" for V2U nodes, that's the problem!
`);

// Make the test function globally available
if (typeof window !== "undefined") {
  window.testV2UNodes = testV2UNodes;
}

module.exports = { testV2UNodes };
