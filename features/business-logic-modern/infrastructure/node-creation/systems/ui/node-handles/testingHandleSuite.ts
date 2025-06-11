/**
 * TYPESAFE HANDLE TEST SUITE - Comprehensive testing utilities
 *
 * • Unit tests for type validation and compatibility
 * • Integration tests for registry access and error handling
 * • Performance tests for connection validation
 * • Visual testing helpers for browser debugging
 * • Automated regression test detection
 *
 * Keywords: testing, validation, performance, regression, debugging
 */

// ===== TEST INTERFACES =====

interface TestResult {
  passed: boolean;
  testName: string;
  error?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  totalDuration: number;
}

// ===== CORE TESTING FUNCTIONS =====

/**
 * Test registry access safety
 */
export function testRegistryAccess(): TestSuite {
  const suite: TestSuite = {
    name: "Registry Access Tests",
    tests: [],
    passed: 0,
    failed: 0,
    totalDuration: 0,
  };

  const nodeTypes = [
    "createText",
    "viewOutput",
    "triggerOnToggle",
    "testError",
    "invalidType",
  ];

  nodeTypes.forEach((nodeType) => {
    const start = performance.now();

    try {
      // Test the enhanced registry function
      const { getNodeHandlesFromRegistry } = require("./TypesafeHandle");
      const result = getNodeHandlesFromRegistry(nodeType);

      const duration = performance.now() - start;
      suite.totalDuration += duration;

      if (nodeType === "invalidType") {
        // Should handle invalid types gracefully
        if (result.error && result.handles.length === 0) {
          suite.tests.push({
            passed: true,
            testName: `Registry handles invalid type: ${nodeType}`,
            duration,
            metadata: { nodeType, handlesCount: result.handles.length },
          });
          suite.passed++;
        } else {
          suite.tests.push({
            passed: false,
            testName: `Registry should handle invalid type: ${nodeType}`,
            error: "Expected error for invalid type",
            duration,
          });
          suite.failed++;
        }
      } else {
        // Valid types should return handles or graceful fallback
        if (Array.isArray(result.handles)) {
          suite.tests.push({
            passed: true,
            testName: `Registry access: ${nodeType}`,
            duration,
            metadata: { nodeType, handlesCount: result.handles.length },
          });
          suite.passed++;
        } else {
          suite.tests.push({
            passed: false,
            testName: `Registry access: ${nodeType}`,
            error: "Expected array of handles",
            duration,
          });
          suite.failed++;
        }
      }
    } catch (error) {
      const duration = performance.now() - start;
      suite.totalDuration += duration;

      suite.tests.push({
        passed: false,
        testName: `Registry access: ${nodeType}`,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });
      suite.failed++;
    }
  });

  return suite;
}

/**
 * Test type compatibility logic
 */
export function testTypeCompatibility(): TestSuite {
  const suite: TestSuite = {
    name: "Type Compatibility Tests",
    tests: [],
    passed: 0,
    failed: 0,
    totalDuration: 0,
  };

  // Test cases: [source, target, expectedResult, testName]
  const testCases: [string, string, boolean, string][] = [
    ["s", "s", true, "String to String"],
    ["s", "{}", true, "String to JSON"],
    ["{}", "s", true, "JSON to String"],
    ["n", "f", true, "Number to Float"],
    ["f", "n", true, "Float to Number"],
    ["a", "{}", true, "Array to JSON"],
    ["{}", "a", true, "JSON to Array"],
    ["x", "s", true, "Any to String"],
    ["s", "x", true, "String to Any"],
    ["s", "n", false, "String to Number (incompatible)"],
    ["b", "n", false, "Boolean to Number (incompatible)"],
    ["∅", "s", false, "Null to String (incompatible)"],
  ];

  testCases.forEach(([source, target, expected, testName]) => {
    const start = performance.now();

    try {
      const { checkTypeCompatibilityEnhanced } = require("./TypesafeHandle");
      const result = checkTypeCompatibilityEnhanced(source, target);
      const duration = performance.now() - start;
      suite.totalDuration += duration;

      if (result.isCompatible === expected) {
        suite.tests.push({
          passed: true,
          testName,
          duration,
          metadata: {
            source,
            target,
            result: result.isCompatible,
            reason: result.reason,
            confidence: result.confidence,
          },
        });
        suite.passed++;
      } else {
        suite.tests.push({
          passed: false,
          testName,
          error: `Expected ${expected}, got ${result.isCompatible}: ${result.reason}`,
          duration,
        });
        suite.failed++;
      }
    } catch (error) {
      const duration = performance.now() - start;
      suite.totalDuration += duration;

      suite.tests.push({
        passed: false,
        testName,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });
      suite.failed++;
    }
  });

  return suite;
}

/**
 * Test runtime type validation
 */
export function testRuntimeValidation(): TestSuite {
  const suite: TestSuite = {
    name: "Runtime Validation Tests",
    tests: [],
    passed: 0,
    failed: 0,
    totalDuration: 0,
  };

  // Test cases: [value, type, expectedValid, testName]
  const testCases: [any, string, boolean, string][] = [
    ["hello", "s", true, "Valid string"],
    [42, "n", true, "Valid number"],
    [true, "b", true, "Valid boolean"],
    [{}, "{}", true, "Valid JSON object"],
    [[], "a", true, "Valid array"],
    [null, "∅", true, "Valid null"],
    [undefined, "u", true, "Valid undefined"],
    ["hello", "n", false, "String as number"],
    [42, "s", false, "Number as string"],
    [[], "{}", false, "Array as JSON object"],
    [null, "s", false, "Null as string"],
  ];

  testCases.forEach(([value, type, expected, testName]) => {
    const start = performance.now();

    try {
      const { validateRuntimeType } = require("./TypesafeHandle");
      const result = validateRuntimeType(value, type);
      const duration = performance.now() - start;
      suite.totalDuration += duration;

      if (result.isValid === expected) {
        suite.tests.push({
          passed: true,
          testName,
          duration,
          metadata: {
            value: typeof value === "object" ? JSON.stringify(value) : value,
            type,
            result: result.isValid,
            actualType: result.actualType,
            error: result.error,
          },
        });
        suite.passed++;
      } else {
        suite.tests.push({
          passed: false,
          testName,
          error: `Expected ${expected}, got ${result.isValid}: ${result.error}`,
          duration,
        });
        suite.failed++;
      }
    } catch (error) {
      const duration = performance.now() - start;
      suite.totalDuration += duration;

      suite.tests.push({
        passed: false,
        testName,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });
      suite.failed++;
    }
  });

  return suite;
}

/**
 * Performance stress test
 */
export function testPerformance(): TestSuite {
  const suite: TestSuite = {
    name: "Performance Tests",
    tests: [],
    passed: 0,
    failed: 0,
    totalDuration: 0,
  };

  const iterations = 1000;
  const acceptableTimePerOp = 1; // 1ms per operation

  // Test registry access performance
  const registryStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    try {
      const { getNodeHandlesFromRegistry } = require("./TypesafeHandle");
      getNodeHandlesFromRegistry("createText");
    } catch (error) {
      // Expected for some cases
    }
  }
  const registryDuration = performance.now() - registryStart;
  const registryAvgTime = registryDuration / iterations;

  suite.tests.push({
    passed: registryAvgTime < acceptableTimePerOp,
    testName: `Registry Access Performance (${iterations} ops)`,
    duration: registryDuration,
    metadata: {
      avgTimePerOp: registryAvgTime,
      acceptableTime: acceptableTimePerOp,
      totalOps: iterations,
    },
  });

  if (registryAvgTime < acceptableTimePerOp) {
    suite.passed++;
  } else {
    suite.failed++;
  }

  suite.totalDuration += registryDuration;

  // Test type compatibility performance
  const compatStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    try {
      const { checkTypeCompatibilityEnhanced } = require("./TypesafeHandle");
      checkTypeCompatibilityEnhanced("s", "{}");
    } catch (error) {
      // Expected for some cases
    }
  }
  const compatDuration = performance.now() - compatStart;
  const compatAvgTime = compatDuration / iterations;

  suite.tests.push({
    passed: compatAvgTime < acceptableTimePerOp,
    testName: `Type Compatibility Performance (${iterations} ops)`,
    duration: compatDuration,
    metadata: {
      avgTimePerOp: compatAvgTime,
      acceptableTime: acceptableTimePerOp,
      totalOps: iterations,
    },
  });

  if (compatAvgTime < acceptableTimePerOp) {
    suite.passed++;
  } else {
    suite.failed++;
  }

  suite.totalDuration += compatDuration;

  return suite;
}

/**
 * Run all tests and generate report
 */
export function runAllTests(): {
  suites: TestSuite[];
  summary: {
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
    totalDuration: number;
    successRate: number;
  };
} {
  console.group("🧪 TypeSafe Handle Test Suite");

  const suites = [
    testRegistryAccess(),
    testTypeCompatibility(),
    testRuntimeValidation(),
    testPerformance(),
  ];

  const summary = {
    totalTests: suites.reduce((sum, suite) => sum + suite.tests.length, 0),
    totalPassed: suites.reduce((sum, suite) => sum + suite.passed, 0),
    totalFailed: suites.reduce((sum, suite) => sum + suite.failed, 0),
    totalDuration: suites.reduce((sum, suite) => sum + suite.totalDuration, 0),
    successRate: 0,
  };

  summary.successRate =
    summary.totalTests > 0
      ? (summary.totalPassed / summary.totalTests) * 100
      : 0;

  // Log results
  suites.forEach((suite) => {
    console.group(`📋 ${suite.name}`);
    console.log(`✅ Passed: ${suite.passed}`);
    console.log(`❌ Failed: ${suite.failed}`);
    console.log(`⏱️ Duration: ${suite.totalDuration.toFixed(2)}ms`);

    suite.tests.forEach((test) => {
      if (test.passed) {
        console.log(`  ✅ ${test.testName} (${test.duration?.toFixed(2)}ms)`);
      } else {
        console.error(`  ❌ ${test.testName}: ${test.error}`);
      }
    });

    console.groupEnd();
  });

  console.group("📊 Summary");
  console.log(`Total Tests: ${summary.totalTests}`);
  console.log(`Passed: ${summary.totalPassed}`);
  console.log(`Failed: ${summary.totalFailed}`);
  console.log(`Success Rate: ${summary.successRate.toFixed(1)}%`);
  console.log(`Total Duration: ${summary.totalDuration.toFixed(2)}ms`);
  console.groupEnd();

  console.groupEnd();

  return { suites, summary };
}

// ===== BROWSER CONSOLE HELPERS =====

// Make test functions available globally for browser console
if (typeof window !== "undefined") {
  (window as any).testTypeSafeHandles = runAllTests;
  (window as any).testHandleRegistry = testRegistryAccess;
  (window as any).testTypeCompat = testTypeCompatibility;
  (window as any).testRuntimeValidation = testRuntimeValidation;
  (window as any).testHandlePerformance = testPerformance;
}
