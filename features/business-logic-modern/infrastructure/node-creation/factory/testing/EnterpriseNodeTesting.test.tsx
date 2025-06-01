// ============================================================================
// ENTERPRISE NODE TESTING FRAMEWORK
// ============================================================================

import { render, screen, fireEvent } from '@testing-library/react';
import { registerNode, getAllNodes, getNodeTypes, getSidebarItems } from '../core/BulletproofNodeBase';
import type { EnterpriseNodeConfig } from '../core/BulletproofNodeBase';

// ============================================================================
// TESTING UTILITIES
// ============================================================================

/**
 * PURE FUNCTION TESTER
 * Tests validation and computation functions in isolation
 */
export function testPureFunctions<T extends Record<string, any>>(
  config: EnterpriseNodeConfig<T>,
  testCases: {
    validation?: Array<{
      name: string;
      data: T;
      expectedError: string | null;
    }>;
    computation?: Array<{
      name: string;
      data: T;
      inputs: Record<string, any>;
      expectedOutput: Partial<T>;
    }>;
  }
) {
  describe(`${config.displayName} Pure Functions`, () => {
    // VALIDATION TESTS
    if (config.validate && testCases.validation) {
      describe('Validation', () => {
        testCases.validation.forEach(({ name, data, expectedError }) => {
          test(name, () => {
            const result = config.validate!(data);
            expect(result).toBe(expectedError);
          });
        });
      });
    }

    // COMPUTATION TESTS  
    if (config.compute && testCases.computation) {
      describe('Computation', () => {
        testCases.computation.forEach(({ name, data, inputs, expectedOutput }) => {
          test(name, () => {
            const result = config.compute!(data, inputs);
            expect(result).toEqual(expectedOutput);
          });
        });
      });
    }
  });
}

/**
 * COMPONENT TESTER
 * Tests rendering behavior without side effects
 */
export function testNodeComponent<T extends Record<string, any>>(
  config: EnterpriseNodeConfig<T>,
  testCases: Array<{
    name: string;
    props: {
      data: T;
      isExpanded: boolean;
      error?: string;
    };
    assertions: (container: HTMLElement) => void;
  }>
) {
  describe(`${config.displayName} Component`, () => {
    testCases.forEach(({ name, props, assertions }) => {
      test(name, () => {
        const mockUpdate = jest.fn();
        const mockToggle = jest.fn();
        
        const { container } = render(
          <div>
            {config.renderNode({
              ...props,
              onUpdate: mockUpdate,
              onToggle: mockToggle
            })}
          </div>
        );
        
        assertions(container);
      });
    });
  });
}

/**
 * INTEGRATION TESTER
 * Tests registration and auto-discovery
 */
export function testNodeIntegration<T extends Record<string, any>>(
  config: EnterpriseNodeConfig<T>
) {
  describe(`${config.displayName} Integration`, () => {
    beforeAll(() => {
      registerNode(config);
    });

    test('registers in node types', () => {
      const nodeTypes = getNodeTypes();
      expect(nodeTypes[config.nodeType]).toBeDefined();
    });

    test('appears in sidebar items', () => {
      const sidebarItems = getSidebarItems();
      const item = sidebarItems.find(item => item.type === config.nodeType);
      expect(item).toBeDefined();
      expect(item?.label).toBe(config.displayName);
      expect(item?.category).toBe(config.category);
    });

    test('has valid default data', () => {
      expect(config.defaultData).toBeDefined();
      expect(typeof config.defaultData).toBe('object');
    });

    test('validation function is pure', () => {
      if (config.validate) {
        const data1 = { ...config.defaultData };
        const data2 = { ...config.defaultData };
        
        const result1 = config.validate(data1);
        const result2 = config.validate(data2);
        
        // Same input should produce same output (pure function)
        expect(result1).toBe(result2);
        
        // Original data should not be modified
        expect(data1).toEqual(config.defaultData);
        expect(data2).toEqual(config.defaultData);
      }
    });

    test('compute function is pure', () => {
      if (config.compute) {
        const data1 = { ...config.defaultData };
        const data2 = { ...config.defaultData };
        const inputs = {};
        
        const result1 = config.compute(data1, inputs);
        const result2 = config.compute(data2, inputs);
        
        // Same input should produce same output (pure function)
        expect(result1).toEqual(result2);
        
        // Original data should not be modified
        expect(data1).toEqual(config.defaultData);
        expect(data2).toEqual(config.defaultData);
      }
    });
  });
}

// ============================================================================
// EXAMPLE: CREATE TEXT ENTERPRISE TESTS
// ============================================================================

// Import the CreateText template we created
// import { createTextConfig } from '../templates/CreateTextTemplate';

/*
// Example usage:
describe('CreateText Enterprise Node', () => {
  // Test pure functions
  testPureFunctions(createTextConfig, {
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
  });

  // Test component rendering
  testNodeComponent(createTextConfig, [
    {
      name: 'renders collapsed view',
      props: {
        data: { text: 'hello', output: 'hello', isEnabled: true, maxLength: 1000 },
        isExpanded: false
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
        isExpanded: true
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
        error: 'Test error'
      },
      assertions: (container) => {
        expect(container.textContent).toContain('Test error');
        expect(container.querySelector('.bg-red-50')).toBeTruthy();
      }
    }
  ]);

  // Test integration
  testNodeIntegration(createTextConfig);
});
*/

// ============================================================================
// PERFORMANCE TESTING
// ============================================================================

/**
 * PERFORMANCE BENCHMARKS
 * Tests that nodes perform well at enterprise scale
 */
export function testNodePerformance<T extends Record<string, any>>(
  config: EnterpriseNodeConfig<T>,
  benchmarks: {
    maxValidationTime?: number; // ms
    maxComputationTime?: number; // ms
    maxRenderTime?: number; // ms
  } = {}
) {
  describe(`${config.displayName} Performance`, () => {
    const {
      maxValidationTime = 1,
      maxComputationTime = 1,
      maxRenderTime = 5
    } = benchmarks;

    test('validation performance', () => {
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

    test('computation performance', () => {
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

    test('render performance', () => {
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
              onUpdate: mockUpdate,
              onToggle: mockToggle
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
// BULK TESTING FOR 1000+ NODES
// ============================================================================

/**
 * BULK NODE TESTING
 * Verifies the system works with enterprise scale (1000+ nodes)
 */
export function testEnterpriseScale() {
  describe('Enterprise Scale Testing', () => {
    test('handles 1000+ registered nodes', () => {
      const initialCount = Object.keys(getAllNodes()).length;
      
      // Register 1000 test nodes
      for (let i = 0; i < 1000; i++) {
        const testConfig: EnterpriseNodeConfig<{ id: number }> = {
          nodeType: `testNode${i}`,
          displayName: `Test Node ${i}`,
          category: 'data',
          defaultData: { id: i },
          renderNode: ({ data }) => <div>Test {data.id}</div>
        };
        
        registerNode(testConfig);
      }
      
      const finalCount = Object.keys(getAllNodes()).length;
      expect(finalCount - initialCount).toBe(1000);
    });

    test('auto-discovery scales well', () => {
      const start = performance.now();
      
      // These should be fast even with 1000+ nodes
      const nodeTypes = getNodeTypes();
      const sidebarItems = getSidebarItems();
      
      const end = performance.now();
      
      expect(Object.keys(nodeTypes).length).toBeGreaterThan(1000);
      expect(sidebarItems.length).toBeGreaterThan(1000);
      expect(end - start).toBeLessThan(10); // Should take less than 10ms
    });
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  testPureFunctions,
  testNodeComponent,
  testNodeIntegration,
  testNodePerformance,
  testEnterpriseScale
}; 