// ============================================================================
// AUTOMATED STRESS TESTING SUITE
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Position } from '@xyflow/react';
import { useFlowStore } from '../../stores/flowStore';
import type { AgenNode, AgenEdge } from '../../flow-editor/types';

// ============================================================================
// STRESS TEST CONFIGURATION
// ============================================================================

interface StressTestConfig {
  name: string;
  description: string;
  nodeCount: number;
  connectionComplexity: 'simple' | 'medium' | 'complex' | 'extreme';
  duration: number; // seconds
  rapidOperations: boolean;
  memoryTracking: boolean;
}

interface TestResults {
  testName: string;
  startMemory: number;
  endMemory: number;
  peakMemory: number;
  memoryIncrease: number;
  avgResponseTime: number;
  operationsPerSecond: number;
  errorsDetected: string[];
  status: 'pass' | 'fail' | 'warning';
  details: Record<string, any>;
}

// ============================================================================
// STRESS TEST SCENARIOS
// ============================================================================

const STRESS_TEST_SCENARIOS: StressTestConfig[] = [
  {
    name: 'Light Load Test',
    description: 'Basic functionality with 10 nodes',
    nodeCount: 10,
    connectionComplexity: 'simple',
    duration: 30,
    rapidOperations: false,
    memoryTracking: true,
  },
  {
    name: 'Medium Network Test',
    description: 'Moderate load with 25 nodes and complex connections',
    nodeCount: 25,
    connectionComplexity: 'medium',
    duration: 60,
    rapidOperations: true,
    memoryTracking: true,
  },
  {
    name: 'Heavy Load Test',
    description: 'High load with 50 nodes and rapid operations',
    nodeCount: 50,
    connectionComplexity: 'complex',
    duration: 90,
    rapidOperations: true,
    memoryTracking: true,
  },
  {
    name: 'Extreme Stress Test',
    description: 'Maximum load with 100+ nodes',
    nodeCount: 100,
    connectionComplexity: 'extreme',
    duration: 120,
    rapidOperations: true,
    memoryTracking: true,
  },
  {
    name: 'Memory Leak Detection',
    description: 'Long-running test to detect memory leaks',
    nodeCount: 30,
    connectionComplexity: 'medium',
    duration: 300, // 5 minutes
    rapidOperations: false,
    memoryTracking: true,
  },
  {
    name: 'Rapid Operations Test',
    description: 'Test system under rapid add/remove/trigger operations',
    nodeCount: 20,
    connectionComplexity: 'medium',
    duration: 60,
    rapidOperations: true,
    memoryTracking: true,
  },
];

// ============================================================================
// STRESS TESTER COMPONENT
// ============================================================================

export const StressTester: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [results, setResults] = useState<TestResults[]>([]);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  
  const { nodes, edges, addNode, addEdge, updateNodeData, removeNode, removeEdge, setNodes, setEdges } = useFlowStore();
  
  // Performance tracking
  const memoryTracker = useRef<number[]>([]);
  const responseTimeTracker = useRef<number[]>([]);
  const operationCounter = useRef(0);
  const testStartTime = useRef(0);

  // ============================================================================
  // MEMORY MONITORING
  // ============================================================================

  const getMemoryUsage = (): number => {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  };

  const startMemoryTracking = useCallback(() => {
    memoryTracker.current = [];
    const interval = setInterval(() => {
      const memory = getMemoryUsage();
      if (memory > 0) {
        memoryTracker.current.push(memory);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const clearFlow = () => {
    setNodes([]);
    setEdges([]);
  };

  // ============================================================================
  // NODE GENERATION UTILITIES
  // ============================================================================

  const generateNodeId = (): string => `stress-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const createTestNode = (type: 'createText' | 'turnToUppercase' | 'viewOutput', position: { x: number; y: number }, data: any) => {
    const id = generateNodeId();
    
    let node: AgenNode;
    
    if (type === 'createText') {
      node = {
        id,
        type: 'createText',
        position,
        data: {
          text: '',
          heldText: '',
          isActive: false,
          ...data,
          isStressTest: true,
        },
      };
    } else if (type === 'turnToUppercase') {
      node = {
        id,
        type: 'turnToUppercase',
        position,
        data: {
          text: '',
          isActive: false,
          ...data,
          isStressTest: true,
        },
      };
    } else { // viewOutput
      node = {
        id,
        type: 'viewOutput',
        position,
        targetPosition: Position.Top,
        data: {
          label: 'Result',
          isActive: false,
          displayedValues: [],
          ...data,
          isStressTest: true,
        },
      };
    }
    
    addNode(node);
    return id;
  };

  const createTestConnection = (sourceId: string, targetId: string, sourceHandle = 's', targetHandle = 's') => {
    const edgeId = `stress-edge-${sourceId}-${targetId}`;
    const edge: AgenEdge = {
      id: edgeId,
      source: sourceId,
      target: targetId,
      sourceHandle,
      targetHandle,
      type: 'default',
    };
    
    addEdge(edge);
    return edgeId;
  };

  // ============================================================================
  // NETWORK TOPOLOGY GENERATORS
  // ============================================================================

  const generateSimpleNetwork = (nodeCount: number): { nodeIds: string[]; edgeIds: string[] } => {
    const nodeIds: string[] = [];
    const edgeIds: string[] = [];

    // Create linear chain: CreateText → Uppercase → ViewOutput
    for (let i = 0; i < nodeCount; i += 3) {
      const x = (i / 3) * 200;
      const y = 100;

      // Create text node
      const textId = createTestNode('createText', { x, y }, { text: `Test ${i}` });
      nodeIds.push(textId);

      if (i + 1 < nodeCount) {
        // Create uppercase node
        const upperId = createTestNode('turnToUppercase', { x: x + 150, y }, { text: '' });
        nodeIds.push(upperId);
        
        // Connect text → uppercase
        const edge1 = createTestConnection(textId, upperId);
        edgeIds.push(edge1);

        if (i + 2 < nodeCount) {
          // Create view node
          const viewId = createTestNode('viewOutput', { x: x + 300, y }, { label: 'Result' });
          nodeIds.push(viewId);
          
          // Connect uppercase → view
          const edge2 = createTestConnection(upperId, viewId);
          edgeIds.push(edge2);
        }
      }
    }

    return { nodeIds, edgeIds };
  };

  const generateComplexNetwork = (nodeCount: number): { nodeIds: string[]; edgeIds: string[] } => {
    const nodeIds: string[] = [];
    const edgeIds: string[] = [];

    // Create multiple parallel chains with cross-connections
    const chainsCount = Math.ceil(nodeCount / 6);
    
    for (let chain = 0; chain < chainsCount; chain++) {
      const baseY = chain * 150;
      
      for (let i = 0; i < 6 && nodeIds.length < nodeCount; i += 3) {
        const x = i * 100;
        
        const textId = createTestNode('createText', { x, y: baseY }, { text: `Chain${chain}-${i}` });
        nodeIds.push(textId);
        
        if (nodeIds.length < nodeCount) {
          const upperId = createTestNode('turnToUppercase', { x: x + 120, y: baseY }, { text: '' });
          nodeIds.push(upperId);
          edgeIds.push(createTestConnection(textId, upperId));
          
          if (nodeIds.length < nodeCount) {
            const viewId = createTestNode('viewOutput', { x: x + 240, y: baseY }, { label: `Result${chain}` });
            nodeIds.push(viewId);
            edgeIds.push(createTestConnection(upperId, viewId));
          }
        }
      }
    }

    // Add cross-connections for complexity
    for (let i = 0; i < Math.min(nodeIds.length - 1, 10); i++) {
      if (Math.random() > 0.7) { // 30% chance of cross-connection
        const sourceIdx = Math.floor(Math.random() * nodeIds.length);
        const targetIdx = Math.floor(Math.random() * nodeIds.length);
        
        if (sourceIdx !== targetIdx) {
          try {
            const crossEdge = createTestConnection(nodeIds[sourceIdx], nodeIds[targetIdx]);
            edgeIds.push(crossEdge);
          } catch (e) {
            // Ignore connection errors in stress test
          }
        }
      }
    }

    return { nodeIds, edgeIds };
  };

  // ============================================================================
  // STRESS TEST OPERATIONS
  // ============================================================================

  const performRapidOperations = async (nodeIds: string[], duration: number) => {
    const endTime = Date.now() + duration * 1000;
    
    while (Date.now() < endTime) {
      // Random operations
      const operation = Math.random();
      
      if (operation < 0.3) {
        // Trigger random text update
        const randomNodeId = nodeIds[Math.floor(Math.random() * nodeIds.length)];
        const startTime = performance.now();
        
        updateNodeData(randomNodeId, { 
          text: `Updated-${Date.now()}`,
          triggered: true 
        });
        
        const responseTime = performance.now() - startTime;
        responseTimeTracker.current.push(responseTime);
        operationCounter.current++;
        
      } else if (operation < 0.6) {
        // Toggle node states
        const randomNodeId = nodeIds[Math.floor(Math.random() * nodeIds.length)];
        const startTime = performance.now();
        
        updateNodeData(randomNodeId, { 
          isActive: Math.random() > 0.5 
        });
        
        const responseTime = performance.now() - startTime;
        responseTimeTracker.current.push(responseTime);
        operationCounter.current++;
        
      } else {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
      }
      
      // Yield control to avoid blocking
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  };

  // ============================================================================
  // TEST EXECUTION ENGINE
  // ============================================================================

  const runStressTest = async (config: StressTestConfig): Promise<TestResults> => {
    const log = (message: string) => {
      console.log(`[StressTest] ${message}`);
      setLogs(prev => [...prev.slice(-50), `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    log(`Starting ${config.name}...`);
    
    // Clear previous test data
    clearFlow();
    
    // Reset trackers
    memoryTracker.current = [];
    responseTimeTracker.current = [];
    operationCounter.current = 0;
    testStartTime.current = Date.now();

    // Start memory tracking
    const stopMemoryTracking = config.memoryTracking ? startMemoryTracking() : () => {};
    
    const startMemory = getMemoryUsage();
    log(`Initial memory: ${startMemory.toFixed(1)} MB`);

    try {
      // Generate test network
      const { nodeIds, edgeIds } = config.connectionComplexity === 'simple' 
        ? generateSimpleNetwork(config.nodeCount)
        : generateComplexNetwork(config.nodeCount);

      log(`Generated ${nodeIds.length} nodes and ${edgeIds.length} connections`);
      
      // Wait for stabilization
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Run operations
      if (config.rapidOperations) {
        log(`Starting rapid operations for ${config.duration} seconds...`);
        await performRapidOperations(nodeIds, config.duration);
      } else {
        log(`Running stability test for ${config.duration} seconds...`);
        await new Promise(resolve => setTimeout(resolve, config.duration * 1000));
      }
      
      // Final measurements
      const endMemory = getMemoryUsage();
      const peakMemory = Math.max(...memoryTracker.current, endMemory);
      const memoryIncrease = endMemory - startMemory;
      
      const avgResponseTime = responseTimeTracker.current.length > 0 
        ? responseTimeTracker.current.reduce((a, b) => a + b, 0) / responseTimeTracker.current.length
        : 0;
        
      const totalDuration = (Date.now() - testStartTime.current) / 1000;
      const operationsPerSecond = operationCounter.current / totalDuration;
      
      // Analyze results
      const errorsDetected: string[] = [];
      let status: 'pass' | 'fail' | 'warning' = 'pass';
      
      if (memoryIncrease > config.nodeCount * 10) { // More than 10MB per node
        errorsDetected.push(`High memory usage: ${memoryIncrease.toFixed(1)}MB increase`);
        status = 'warning';
      }
      
      if (avgResponseTime > 100) { // Slower than 100ms average
        errorsDetected.push(`Slow response time: ${avgResponseTime.toFixed(1)}ms average`);
        status = 'warning';
      }
      
      if (errorsDetected.length > 3) {
        status = 'fail';
      }

      const results: TestResults = {
        testName: config.name,
        startMemory,
        endMemory,
        peakMemory,
        memoryIncrease,
        avgResponseTime,
        operationsPerSecond,
        errorsDetected,
        status,
        details: {
          nodeCount: nodeIds.length,
          edgeCount: edgeIds.length,
          totalOperations: operationCounter.current,
          duration: totalDuration,
          memoryReadings: memoryTracker.current.length,
        },
      };
      
      log(`${config.name} completed: ${status.toUpperCase()}`);
      log(`Memory: ${startMemory.toFixed(1)} → ${endMemory.toFixed(1)} MB (+${memoryIncrease.toFixed(1)})`);
      log(`Performance: ${avgResponseTime.toFixed(1)}ms avg, ${operationsPerSecond.toFixed(1)} ops/sec`);
      
      stopMemoryTracking();
      
      // Cleanup test nodes
      setTimeout(() => {
        clearFlow();
      }, 2000);
      
      return results;
      
    } catch (error) {
      log(`Error in ${config.name}: ${error}`);
      stopMemoryTracking();
      
      return {
        testName: config.name,
        startMemory,
        endMemory: getMemoryUsage(),
        peakMemory: Math.max(...memoryTracker.current),
        memoryIncrease: 0,
        avgResponseTime: 0,
        operationsPerSecond: 0,
        errorsDetected: [`Test failed: ${error}`],
        status: 'fail',
        details: { error: String(error) },
      };
    }
  };

  // ============================================================================
  // TEST SUITE RUNNER
  // ============================================================================

  const runAllTests = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setResults([]);
    setLogs([]);
    
    const allResults: TestResults[] = [];
    
    for (let i = 0; i < STRESS_TEST_SCENARIOS.length; i++) {
      const scenario = STRESS_TEST_SCENARIOS[i];
      setCurrentTest(scenario.name);
      setProgress((i / STRESS_TEST_SCENARIOS.length) * 100);
      
      const result = await runStressTest(scenario);
      allResults.push(result);
      setResults([...allResults]);
      
      // Rest between tests
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    setCurrentTest(null);
    setProgress(100);
    setIsRunning(false);
    
    // Generate summary report
    generateSummaryReport(allResults);
  };

  const runSingleTest = async (testName: string) => {
    const scenario = STRESS_TEST_SCENARIOS.find(s => s.name === testName);
    if (!scenario || isRunning) return;
    
    setIsRunning(true);
    setCurrentTest(testName);
    setProgress(0);
    
    const result = await runStressTest(scenario);
    setResults([result]);
    
    setCurrentTest(null);
    setProgress(100);
    setIsRunning(false);
  };

  // ============================================================================
  // REPORTING
  // ============================================================================

  const generateSummaryReport = (testResults: TestResults[]) => {
    const report = {
      totalTests: testResults.length,
      passed: testResults.filter(r => r.status === 'pass').length,
      warnings: testResults.filter(r => r.status === 'warning').length,
      failed: testResults.filter(r => r.status === 'fail').length,
      avgMemoryIncrease: testResults.reduce((sum, r) => sum + r.memoryIncrease, 0) / testResults.length,
      avgResponseTime: testResults.reduce((sum, r) => sum + r.avgResponseTime, 0) / testResults.length,
      totalOperations: testResults.reduce((sum, r) => sum + (r.details.totalOperations || 0), 0),
    };
    
    console.log('🚀 Stress Test Summary Report:');
    console.log(`Tests: ${report.passed} passed, ${report.warnings} warnings, ${report.failed} failed`);
    console.log(`Memory: ${report.avgMemoryIncrease.toFixed(1)}MB average increase`);
    console.log(`Performance: ${report.avgResponseTime.toFixed(1)}ms average response time`);
    console.log(`Total operations performed: ${report.totalOperations}`);
    
    setLogs(prev => [...prev, 
      '=== SUMMARY REPORT ===',
      `Tests: ${report.passed}✅ ${report.warnings}⚠️ ${report.failed}❌`,
      `Avg Memory Increase: ${report.avgMemoryIncrease.toFixed(1)}MB`,
      `Avg Response Time: ${report.avgResponseTime.toFixed(1)}ms`,
      `Total Operations: ${report.totalOperations}`,
    ]);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="stress-tester p-6 bg-gray-900 text-white rounded-lg">
      <h2 className="text-2xl font-bold mb-4">🚀 Ultra-Fast Propagation Stress Tester</h2>
      
      {/* Controls */}
      <div className="mb-6">
        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded mr-4"
        >
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </button>
        
        <button
          onClick={() => clearFlow()}
          disabled={isRunning}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-4 py-2 rounded"
        >
          Clear Test Data
        </button>
      </div>

      {/* Individual Test Buttons */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Individual Tests:</h3>
        <div className="grid grid-cols-2 gap-2">
          {STRESS_TEST_SCENARIOS.map(scenario => (
            <button
              key={scenario.name}
              onClick={() => runSingleTest(scenario.name)}
              disabled={isRunning}
              className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 px-3 py-2 rounded text-sm text-left"
            >
              <div className="font-medium">{scenario.name}</div>
              <div className="text-xs text-gray-400">{scenario.description}</div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Progress */}
      {isRunning && (
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span>Current Test: {currentTest}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Results */}
      {results.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Test Results:</h3>
          <div className="space-y-2">
            {results.map((result, index) => (
              <div key={index} className={`p-3 rounded ${
                result.status === 'pass' ? 'bg-green-900' : 
                result.status === 'warning' ? 'bg-yellow-900' : 'bg-red-900'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="font-medium">{result.testName}</span>
                  <span className="text-sm">
                    {result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌'}
                  </span>
                </div>
                <div className="text-sm mt-1">
                  Memory: {result.memoryIncrease > 0 ? '+' : ''}{result.memoryIncrease.toFixed(1)}MB | 
                  Response: {result.avgResponseTime.toFixed(1)}ms | 
                  Ops/sec: {result.operationsPerSecond.toFixed(1)}
                </div>
                {result.errorsDetected.length > 0 && (
                  <div className="text-xs text-red-300 mt-1">
                    Issues: {result.errorsDetected.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Live Log */}
      {logs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Live Log:</h3>
          <div className="bg-black p-3 rounded font-mono text-sm h-64 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StressTester; 