/**
 * ENTERPRISE NODE TESTING - Comprehensive test suite for factory nodes
 *
 * • Provides comprehensive testing framework for enterprise node functionality
 * • Implements unit tests for node creation, state management, and processing
 * • Supports integration testing for factory systems and safety layers
 * • Features performance testing and memory leak detection
 * • Validates enterprise-grade reliability and error handling
 *
 * Keywords: enterprise-testing, unit-tests, integration-tests, performance-testing,
 * memory-leak-detection, reliability, bulletproof-testing, validation
 */

// ============================================================================
// ENTERPRISE NODE TESTING FRAMEWORK
// ============================================================================

import { render } from "@testing-library/react";
import type { EnterpriseNodeConfig } from "../core/BulletproofNodeBase";
import {
  getAllNodes,
  getNodeTypes,
  getSidebarItems,
  registerNode,
} from "../core/BulletproofNodeBase";

// ============================================================================
// TYPE DEFINITIONS FOR TESTING FRAMEWORK
// ============================================================================

/**
 * VALIDATION TEST CASE DEFINITION
 */
interface ValidationTestCase<T> {
  name: string;
  data: T;
  expectedError: string | null;
}

/**
 * COMPUTATION TEST CASE DEFINITION
 */
interface ComputationTestCase<T> {
  name: string;
  data: T;
  inputs: Record<string, any>;
  expectedOutput: Partial<T>;
}

/**
 * COMPONENT TEST CASE DEFINITION
 */
interface ComponentTestCase<T> {
  name: string;
  props: {
    data: T;
    isExpanded: boolean;
    isActive?: boolean;
    error?: string;
  };
  assertions: (container: HTMLElement) => void;
}

/**
 * PERFORMANCE BENCHMARK CONFIGURATION
 */
interface PerformanceBenchmarks {
  maxValidationTime?: number; // ms
  maxComputationTime?: number; // ms
  maxRenderTime?: number; // ms
}

/**
 * TEST CASES CONFIGURATION
 */
interface TestCasesConfig<T> {
  validation?: ValidationTestCase<T>[];
  computation?: ComputationTestCase<T>[];
}

// ============================================================================
// PURE FUNCTION TESTING UTILITIES
// ============================================================================

/**
 * PURE FUNCTION TESTER
 * Tests validation and computation functions in isolation
 */
function createPureFunctionTests<T extends Record<string, any>>(
  config: EnterpriseNodeConfig<T>,
  testCases: TestCasesConfig<T>
) {
  describe(`${config.displayName} Pure Functions`, () => {
    // VALIDATION TESTS
    if (
      config.validate &&
      testCases.validation &&
      testCases.validation.length > 0
    ) {
      describe("Validation", () => {
        testCases.validation!.forEach(({ name, data, expectedError }) => {
          test(name, () => {
            const result = config.validate!(data);
            expect(result).toBe(expectedError);
          });
        });
      });
    }

    // COMPUTATION TESTS
    if (
      config.compute &&
      testCases.computation &&
      testCases.computation.length > 0
    ) {
      describe("Computation", () => {
        testCases.computation!.forEach(
          ({ name, data, inputs, expectedOutput }) => {
            test(name, () => {
              const result = config.compute!(data, inputs);
              expect(result).toEqual(expectedOutput);
            });
          }
        );
      });
    }
  });
}

// ============================================================================
// COMPONENT TESTING UTILITIES
// ============================================================================

/**
 * COMPONENT TESTER
 * Tests rendering behavior without side effects
 */
function createComponentTests<T extends Record<string, any>>(
  config: EnterpriseNodeConfig<T>,
  testCases: ComponentTestCase<T>[]
) {
  describe(`${config.displayName} Component`, () => {
    testCases.forEach(({ name, props, assertions }) => {
      test(name, () => {
        const mockUpdate = jest.fn();
        const mockToggle = jest.fn();

        // ENSURE ALL REQUIRED PROPS ARE PROVIDED
        const renderProps = {
          data: props.data,
          isExpanded: props.isExpanded,
          isActive: props.isActive ?? false, // DEFAULT TO FALSE IF NOT PROVIDED
          onUpdate: mockUpdate,
          onToggle: mockToggle,
          ...(props.error && { error: props.error }), // ONLY ADD ERROR IF PROVIDED
        };

        const { container } = render(
          <div>{config.renderNode(renderProps)}</div>
        );

        assertions(container);
      });
    });
  });
}

// ============================================================================
// INTEGRATION TESTING UTILITIES
// ============================================================================

/**
 * INTEGRATION TESTER
 * Tests registration and auto-discovery
 */
function createIntegrationTests<T extends Record<string, any>>(
  config: EnterpriseNodeConfig<T>
) {
  describe(`${config.displayName} Integration`, () => {
    beforeAll(() => {
      registerNode(config);
    });

    // NODE TYPE REGISTRATION TEST
    test("registers in node types", () => {
      const nodeTypes = getNodeTypes();
      expect(nodeTypes[config.nodeType]).toBeDefined();
    });

    // SIDEBAR INTEGRATION TEST
    test("appears in sidebar items", () => {
      const sidebarItems = getSidebarItems();
      const item = sidebarItems.find((item) => item.type === config.nodeType);

      expect(item).toBeDefined();
      expect(item?.label).toBe(config.displayName);
      expect(item?.category).toBe(config.category);
    });

    // DEFAULT DATA VALIDATION TEST
    test("has valid default data", () => {
      expect(config.defaultData).toBeDefined();
      expect(typeof config.defaultData).toBe("object");
    });

    // VALIDATION FUNCTION PURITY TEST
    test("validation function is pure", () => {
      if (config.validate) {
        const data1 = { ...config.defaultData };
        const data2 = { ...config.defaultData };

        const result1 = config.validate(data1);
        const result2 = config.validate(data2);

        // SAME INPUT SHOULD PRODUCE SAME OUTPUT (PURE FUNCTION)
        expect(result1).toBe(result2);

        // ORIGINAL DATA SHOULD NOT BE MODIFIED
        expect(data1).toEqual(config.defaultData);
        expect(data2).toEqual(config.defaultData);
      }
    });

    // COMPUTATION FUNCTION PURITY TEST
    test("compute function is pure", () => {
      if (config.compute) {
        const data1 = { ...config.defaultData };
        const data2 = { ...config.defaultData };
        const inputs = {};

        const result1 = config.compute(data1, inputs);
        const result2 = config.compute(data2, inputs);

        // SAME INPUT SHOULD PRODUCE SAME OUTPUT (PURE FUNCTION)
        expect(result1).toEqual(result2);

        // ORIGINAL DATA SHOULD NOT BE MODIFIED
        expect(data1).toEqual(config.defaultData);
        expect(data2).toEqual(config.defaultData);
      }
    });
  });
}

// ============================================================================
// PERFORMANCE TESTING UTILITIES
// ============================================================================

/**
 * PERFORMANCE BENCHMARKS
 * Tests that nodes perform well at enterprise scale
 */
function createPerformanceTests<T extends Record<string, any>>(
  config: EnterpriseNodeConfig<T>,
  benchmarks: PerformanceBenchmarks = {}
) {
  describe(`${config.displayName} Performance`, () => {
    // PERFORMANCE BENCHMARK DEFAULTS
    const {
      maxValidationTime = 1,
      maxComputationTime = 1,
      maxRenderTime = 5,
    } = benchmarks;

    // VALIDATION PERFORMANCE TEST
    test("validation performance", () => {
      if (!config.validate) return;

      const data = config.defaultData;
      const iterations = 1000;

      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        config.validate(data);
      }
      const end = performance.now();

      const avgTime = (end - start) / iterations;
      expect(avgTime).toBeLessThan(maxValidationTime);
    });

    // COMPUTATION PERFORMANCE TEST
    test("computation performance", () => {
      if (!config.compute) return;

      const data = config.defaultData;
      const inputs = {};
      const iterations = 1000;

      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        config.compute(data, inputs);
      }
      const end = performance.now();

      const avgTime = (end - start) / iterations;
      expect(avgTime).toBeLessThan(maxComputationTime);
    });

    // RENDER PERFORMANCE TEST
    test("render performance", () => {
      const mockUpdate = jest.fn();
      const mockToggle = jest.fn();
      const iterations = 100;

      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        render(
          <div>
            {config.renderNode({
              data: config.defaultData,
              isExpanded: false,
              isActive: false, // REQUIRED PROPERTY ADDED
              onUpdate: mockUpdate,
              onToggle: mockToggle,
            })}
          </div>
        );
      }
      const end = performance.now();

      const avgTime = (end - start) / iterations;
      expect(avgTime).toBeLessThan(maxRenderTime);
    });
  });
}

// ============================================================================
// ENTERPRISE SCALE TESTING
// ============================================================================

/**
 * BULK NODE TESTING
 * Verifies the system works with enterprise scale (1000+ nodes)
 */
function createEnterpriseScaleTests() {
  describe("Enterprise Scale Testing", () => {
    // LARGE SCALE REGISTRATION TEST
    test("handles 1000+ registered nodes", () => {
      const initialCount = Object.keys(getAllNodes()).length;

      // REGISTER 1000 TEST NODES
      for (let i = 0; i < 1000; i++) {
        const testConfig: EnterpriseNodeConfig<{ id: number }> = {
          nodeType: `testNode${i}`,
          displayName: `Test Node ${i}`,
          category: "data",
          defaultData: { id: i },
          renderNode: ({ data }) => <div>Test {data.id}</div>,
        };

        registerNode(testConfig);
      }

      const finalCount = Object.keys(getAllNodes()).length;
      expect(finalCount - initialCount).toBe(1000);
    });

    // AUTO-DISCOVERY PERFORMANCE TEST
    test("auto-discovery scales well", () => {
      const start = performance.now();

      // THESE SHOULD BE FAST EVEN WITH 1000+ NODES
      const nodeTypes = getNodeTypes();
      const sidebarItems = getSidebarItems();

      const end = performance.now();

      expect(Object.keys(nodeTypes).length).toBeGreaterThan(1000);
      expect(sidebarItems.length).toBeGreaterThan(1000);
      expect(end - start).toBeLessThan(10); // SHOULD TAKE LESS THAN 10MS
    });
  });
}

// ============================================================================
// MAIN TESTING FUNCTIONS - PUBLIC API
// ============================================================================

/**
 * COMPLETE NODE TEST SUITE
 * Runs all tests for a given node configuration
 */
export function testEnterpriseNode<T extends Record<string, any>>(
  config: EnterpriseNodeConfig<T>,
  options: {
    testCases?: TestCasesConfig<T>;
    componentTests?: ComponentTestCase<T>[];
    performanceBenchmarks?: PerformanceBenchmarks;
    skipIntegration?: boolean;
    skipPerformance?: boolean;
  } = {}
) {
  const {
    testCases = {},
    componentTests = [],
    performanceBenchmarks = {},
    skipIntegration = false,
    skipPerformance = false,
  } = options;

  describe(`Enterprise Node: ${config.displayName}`, () => {
    // PURE FUNCTION TESTS
    if (testCases.validation || testCases.computation) {
      createPureFunctionTests(config, testCases);
    }

    // COMPONENT TESTS
    if (componentTests.length > 0) {
      createComponentTests(config, componentTests);
    }

    // INTEGRATION TESTS
    if (!skipIntegration) {
      createIntegrationTests(config);
    }

    // PERFORMANCE TESTS
    if (!skipPerformance) {
      createPerformanceTests(config, performanceBenchmarks);
    }
  });
}

/**
 * ENTERPRISE SCALE TESTING SUITE
 */
export function testEnterpriseScale() {
  createEnterpriseScaleTests();
}

// ============================================================================
// INDIVIDUAL TEST CREATORS - FOR GRANULAR CONTROL
// ============================================================================

export const testPureFunctions = createPureFunctionTests;
export const testNodeComponent = createComponentTests;
export const testNodeIntegration = createIntegrationTests;
export const testNodePerformance = createPerformanceTests;

// ============================================================================
// EXAMPLE USAGE TEMPLATE
// ============================================================================

/*
// EXAMPLE: Complete test suite for a CreateText node
describe('CreateText Enterprise Node', () => {
  testEnterpriseNode(createTextConfig, {
    testCases: {
      validation: [
        {
          name: 'accepts valid text',
          data: { text: 'hello', output: '', isEnabled: true, maxLength: 1000 },
          expectedError: null
        },
        {
          name: 'rejects text too long',
          data: { text: 'a'.repeat(1001), output: '', isEnabled: true, maxLength: 1000 },
          expectedError: 'Text too long (1001/1000)'
        }
      ],
      computation: [
        {
          name: 'outputs text when enabled and triggered',
          data: { text: 'hello', output: '', isEnabled: true, maxLength: 1000 },
          inputs: { trigger: true },
          expectedOutput: { output: 'hello' }
        },
        {
          name: 'outputs empty when disabled',
          data: { text: 'hello', output: '', isEnabled: false, maxLength: 1000 },
          inputs: { trigger: true },
          expectedOutput: { output: '' }
        }
      ]
    },
    componentTests: [
      {
        name: 'renders collapsed view',
        props: {
          data: { text: 'hello', output: 'hello', isEnabled: true, maxLength: 1000 },
          isExpanded: false,
          isActive: true
        },
        assertions: (container) => {
          expect(container.textContent).toContain('hello');
          expect(container.querySelector('textarea')).toBeNull();
        }
      },
      {
        name: 'renders expanded view',
        props: {
          data: { text: 'hello', output: 'hello', isEnabled: true, maxLength: 1000 },
          isExpanded: true,
          isActive: true
        },
        assertions: (container) => {
          expect(container.querySelector('textarea')).toBeTruthy();
          expect(container.textContent).toContain('Create Text');
        }
      },
      {
        name: 'renders error state',
        props: {
          data: { text: 'hello', output: 'hello', isEnabled: true, maxLength: 1000 },
          isExpanded: false,
          isActive: false,
          error: 'Test error'
        },
        assertions: (container) => {
          expect(container.textContent).toContain('Test error');
          expect(container.querySelector('.bg-red-50')).toBeTruthy();
        }
      }
    ],
    performanceBenchmarks: {
      maxValidationTime: 0.5,
      maxComputationTime: 0.5,
      maxRenderTime: 3
    }
  });
});

// ENTERPRISE SCALE TESTING
testEnterpriseScale();
*/
