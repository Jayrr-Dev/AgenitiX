/**
 * HANDLE TEST UTILITIES - Enhanced browser console testing tools
 *
 * • Provides quick browser console functions to test handle system
 * • Diagnoses registry loading and handle configuration issues
 * • Tests node creation and handle rendering pipeline
 * • Now includes connection testing and React Flow integration
 *
 * Keywords: handle-testing, console-debugging, registry-diagnosis, connection-testing
 */

// ============================================================================
// BROWSER CONSOLE TEST FUNCTIONS
// ============================================================================

/**
 * TEST HANDLE REGISTRY LOADING
 * Quick test from browser console
 */
function testHandleRegistry() {
  console.group("🧪 TESTING HANDLE REGISTRY");

  const nodeTypes = [
    "createText",
    "viewOutput",
    "triggerOnToggle",
    "testError",
  ];

  nodeTypes.forEach((nodeType) => {
    try {
      // Test dynamic import of registry
      const {
        getNodeHandles,
      } = require("../../../registries/json-node-registry/unifiedRegistry");
      const handles = getNodeHandles(nodeType) || [];

      console.log(`✅ ${nodeType}: ${handles.length} handles`, handles);

      // Check handle types
      const inputs = handles.filter((h: any) => h.type === "target");
      const outputs = handles.filter((h: any) => h.type === "source");
      console.log(`   • Inputs: ${inputs.length}, Outputs: ${outputs.length}`);
    } catch (error) {
      console.error(`❌ ${nodeType}: Failed to load`, error);
    }
  });

  console.groupEnd();
}

/**
 * TEST NODE CREATION
 * Test if nodes are being created with handles
 */
function testNodeCreation() {
  console.group("🧪 TESTING NODE CREATION");

  // Try to find existing nodes in the DOM
  const nodeElements = document.querySelectorAll("[data-id]");
  console.log(`Found ${nodeElements.length} nodes in DOM`);

  nodeElements.forEach((element, index) => {
    const nodeId = element.getAttribute("data-id");
    const handles = element.querySelectorAll("[data-handleid]");
    const inputs = element.querySelectorAll(
      "[data-handleid][data-handlepos='left']"
    );
    const outputs = element.querySelectorAll(
      "[data-handleid][data-handlepos='right']"
    );

    console.log(
      `Node ${index + 1} (${nodeId}): ${handles.length} handles total (${inputs.length} inputs, ${outputs.length} outputs)`
    );

    // Log handle details
    handles.forEach((handle) => {
      const handleId = handle.getAttribute("data-handleid");
      const handlePos = handle.getAttribute("data-handlepos");
      const handleType = handle.getAttribute("data-handletype");
      console.log(`   • Handle: ${handleId} (${handleType}, ${handlePos})`);
    });
  });

  console.groupEnd();
}

/**
 * TEST REACT FLOW CONNECTIONS
 * Test connection capabilities between nodes
 */
function testConnections() {
  console.group("🧪 TESTING REACT FLOW CONNECTIONS");

  // Check if React Flow store is available
  if ((window as any).ReactFlow) {
    const nodes = (window as any).ReactFlow.getNodes();
    const edges = (window as any).ReactFlow.getEdges();

    console.log(`📊 Flow State: ${nodes.length} nodes, ${edges.length} edges`);

    // Check for connection errors
    edges.forEach((edge: any) => {
      console.log(
        `🔗 Edge: ${edge.source}[${edge.sourceHandle}] → ${edge.target}[${edge.targetHandle}]`
      );
    });
  } else {
    console.warn(
      "❌ React Flow not accessible - try from browser console on business-logic page"
    );
  }

  console.groupEnd();
}

/**
 * COMPREHENSIVE HANDLE DIAGNOSIS
 * Full diagnostic test with enhanced connection testing
 */
function diagnoseHandles() {
  console.log("🔍 COMPREHENSIVE HANDLE DIAGNOSIS");
  console.log("================================");

  testHandleRegistry();
  testNodeCreation();
  testConnections();

  console.log("✅ Diagnosis complete");
  console.log(
    "📝 If handles show 0 everywhere, the registry integration has failed"
  );
  console.log(
    "📝 If registry shows handles but DOM shows 0, the rendering pipeline has failed"
  );
  console.log(
    "📝 If handles exist but connections fail, check React Flow edge errors"
  );
}

/**
 * QUICK CONNECTION TEST
 * Test if specific node types can connect
 */
function testConnectionCompatibility() {
  console.group("🔗 CONNECTION COMPATIBILITY TEST");

  const testCases = [
    {
      source: "createText",
      sourceHandle: "output",
      target: "viewOutput",
      targetHandle: "input",
    },
    {
      source: "createText",
      sourceHandle: "output",
      target: "viewOutput",
      targetHandle: "json",
    },
    {
      source: "triggerOnToggle",
      sourceHandle: "output",
      target: "createText",
      targetHandle: "trigger",
    },
  ];

  testCases.forEach((test) => {
    console.log(
      `Testing: ${test.source}[${test.sourceHandle}] → ${test.target}[${test.targetHandle}]`
    );
    // This would require actual React Flow integration to test properly
  });

  console.log("💡 To test connections manually:");
  console.log("1. Create nodes in the UI");
  console.log("2. Try to connect them");
  console.log("3. Check browser console for React Flow errors");

  console.groupEnd();
}

/**
 * TEST CONNECTION VALIDATION
 * Test the connection validation system manually
 */
function testConnectionValidation() {
  console.group("🧪 TESTING CONNECTION VALIDATION");

  try {
    // Test the flow-level validation directly
    const {
      validateConnection,
    } = require("../../../../../flow-engine/utils/connectionUtils");

    const testConnection = {
      source: "test-source",
      target: "test-target",
      sourceHandle: "output",
      targetHandle: "input",
    };

    console.log("Testing flow-level validation...");
    const flowValid = validateConnection(testConnection);
    console.log("Flow validation result:", flowValid);

    // Test registry access
    console.log("Testing registry access...");
    const {
      getNodeHandles,
    } = require("../../../registries/json-node-registry/unifiedRegistry");
    const createTextHandles = getNodeHandles("createText");
    const viewOutputHandles = getNodeHandles("viewOutput");

    console.log("createText handles:", createTextHandles);
    console.log("viewOutput handles:", viewOutputHandles);

    if (createTextHandles && viewOutputHandles) {
      const sourceHandle = createTextHandles.find(
        (h: any) => h.id === "output"
      );
      const targetHandle = viewOutputHandles.find((h: any) => h.id === "input");

      console.log("Source handle config:", sourceHandle);
      console.log("Target handle config:", targetHandle);

      if (sourceHandle && targetHandle) {
        console.log(
          `Connection test: ${sourceHandle.dataType} → ${targetHandle.dataType}`
        );

        // Test compatibility
        if (sourceHandle.dataType === "s" && targetHandle.dataType === "x") {
          console.log("✅ This should be compatible: string → any");
        }
      }
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }

  console.groupEnd();
}

/**
 * TEST V2U NODE ENTERPRISE INTEGRATION
 * Test if V2U nodes are properly integrated with NodeFactory.tsx enterprise system
 */
function testV2UNodeResolution() {
  console.group("🧪 TESTING V2U NODE ENTERPRISE INTEGRATION");

  const v2uNodeTypes = [
    { nodeType: "createTextV2U", system: "Enterprise Factory" },
    { nodeType: "viewOutputV2U", system: "defineNode" },
    { nodeType: "triggerOnToggleV2U", system: "defineNode" },
    { nodeType: "testErrorV2U", system: "defineNode" },
  ];

  v2uNodeTypes.forEach(({ nodeType, system }) => {
    try {
      // Test unified registry resolution
      const {
        getEnhancedNodeRegistration,
      } = require("../../../registries/json-node-registry/unifiedRegistry");
      const registration = getEnhancedNodeRegistration(nodeType);

      if (registration && registration.component) {
        console.log(
          `✅ ${nodeType} (${system}): Component resolved successfully`
        );
        console.log(`   • Category: ${registration.category}`);
        console.log(`   • Display Name: ${registration.displayName}`);
        console.log(`   • Has Component: ${!!registration.component}`);
        console.log(`   • Handles: ${registration.handles?.length || 0}`);

        // Check if it's using enterprise factory features
        const componentName =
          registration.component.displayName || registration.component.name;
        if (componentName && componentName.includes("Enterprise")) {
          console.log(`   🏭 ENTERPRISE STYLING: Yes`);
          console.log(`   📏 STANDARDIZED SIZES: Yes (via convertV2UNodeSize)`);
        } else {
          console.log(`   🏭 ENTERPRISE STYLING: No (basic defineNode)`);
          console.log(`   📏 STANDARDIZED SIZES: No`);
        }
      } else {
        console.error(`❌ ${nodeType}: Component NOT resolved`);
        console.log(`   • Registration: ${!!registration}`);
        console.log(`   • Component: ${!!registration?.component}`);
      }

      // Test factory creation
      const { unifiedFactory } = require("../../core/UnifiedIntegration");
      const testNode = unifiedFactory.createNode(nodeType, { x: 100, y: 100 });

      if (testNode) {
        console.log(`✅ ${nodeType}: Factory creation successful`);
        console.log(`   • Node ID: ${testNode.id}`);
        console.log(`   • Node Type: ${testNode.type}`);
        console.log(`   • Has Data: ${!!testNode.data}`);
      } else {
        console.error(`❌ ${nodeType}: Factory creation FAILED`);
      }
    } catch (error) {
      console.error(`❌ ${nodeType}: Resolution error`, error);
    }
  });

  console.groupEnd();
  console.log("🚀 BRIDGE SOLUTION ACTIVE:");
  console.log(
    "   • V2U nodes (ending in 'V2U') automatically get enterprise styling"
  );
  console.log(
    "   • Enhanced defineNode() wraps components with NodeFactory.tsx features"
  );
  console.log(
    "   • Standardized sizes via convertV2UNodeSize() from sizes.ts constants"
  );
  console.log(
    "   • Maintains V2U architecture while delivering immediate styling"
  );
  console.log(
    "💡 CreateTextV2U should show 'ENTERPRISE STYLING: Yes' + 'STANDARDIZED SIZES: Yes'!"
  );
}

// Make functions available globally for console use
if (typeof window !== "undefined") {
  (window as any).testHandleRegistry = testHandleRegistry;
  (window as any).testNodeCreation = testNodeCreation;
  (window as any).testConnections = testConnections;
  (window as any).diagnoseHandles = diagnoseHandles;
  (window as any).testConnectionCompatibility = testConnectionCompatibility;
  (window as any).testConnectionValidation = testConnectionValidation;
  (window as any).testV2UNodeResolution = testV2UNodeResolution;

  // Debug logging removed for cleaner console - functions still available for manual testing
}

export {
  diagnoseHandles,
  testConnectionCompatibility,
  testConnections,
  testHandleRegistry,
  testNodeCreation,
  testV2UNodeResolution,
};
