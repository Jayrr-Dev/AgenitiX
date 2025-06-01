# 🚀 Automated Stress Testing Suite

## 📋 Overview

The Ultra-Fast Propagation Stress Tester is a comprehensive automated testing utility designed to validate the performance, memory usage, and reliability of your node system under various load conditions.

## 🎯 Features

- **6 Predefined Test Scenarios** - From light load to extreme stress
- **Real-time Memory Monitoring** - Tracks memory usage patterns
- **Performance Metrics** - Response times and operations per second
- **Automated Network Generation** - Creates complex test topologies
- **Memory Leak Detection** - Long-running tests to identify leaks
- **Comprehensive Reporting** - Detailed results with pass/fail analysis

## 🧪 Test Scenarios

| Test Name | Nodes | Duration | Purpose |
|-----------|-------|----------|---------|
| **Light Load Test** | 10 | 30s | Basic functionality validation |
| **Medium Network Test** | 25 | 60s | Moderate load with complex connections |
| **Heavy Load Test** | 50 | 90s | High load with rapid operations |
| **Extreme Stress Test** | 100+ | 2min | Maximum load testing |
| **Memory Leak Detection** | 30 | 5min | Long-running leak detection |
| **Rapid Operations Test** | 20 | 60s | Fast add/remove/trigger cycles |

## 🏗️ Integration

### 1. Add to Your Component

```tsx
import { StressTester } from './nodes/factory/StressTester';

// In your main app or development panel
<StressTester />
```

### 2. Development Mode Only

```tsx
// Only show in development
{process.env.NODE_ENV === 'development' && <StressTester />}
```

### 3. As Modal/Panel

```tsx
// Add to your dev tools panel
const [showStressTester, setShowStressTester] = useState(false);

{showStressTester && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <StressTester />
      <button onClick={() => setShowStressTester(false)}>Close</button>
    </div>
  </div>
)}
```

## 📊 Reading Test Results

### Status Indicators
- ✅ **Pass**: All metrics within acceptable ranges
- ⚠️ **Warning**: Some metrics exceeded thresholds but not critical
- ❌ **Fail**: Critical issues detected or test crashed

### Key Metrics
- **Memory Increase**: Total memory growth during test
- **Response Time**: Average time for operations to complete
- **Ops/sec**: Operations processed per second
- **Peak Memory**: Highest memory usage reached

### Performance Benchmarks
| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| **Memory per Node** | <5MB | 5-10MB | >10MB |
| **Response Time** | <50ms | 50-100ms | >100ms |
| **Memory Growth** | Linear | Plateau | Growing |

## 🔍 Test Operations

### Network Generation
- **Simple**: Linear chains (Text → Uppercase → View)
- **Medium**: Multiple parallel chains
- **Complex**: Cross-connected networks
- **Extreme**: High-density interconnected graphs

### Rapid Operations
- Random text updates
- Node state toggles
- Activation/deactivation cycles
- Concurrent modifications

## 📈 Monitoring Console Output

The stress tester provides detailed console logging:

```
[StressTest] Starting Heavy Load Test...
[StressTest] Initial memory: 316.2 MB
[StressTest] Generated 50 nodes and 45 connections
[StressTest] Starting rapid operations for 90 seconds...
[StressTest] Heavy Load Test completed: PASS
[StressTest] Memory: 316.2 → 398.7 MB (+82.5)
[StressTest] Performance: 12.3ms avg, 45.2 ops/sec
```

## 🚨 Interpreting Warnings

### Memory Warnings
- **High memory usage**: More than 10MB per node
- **Memory not releasing**: Potential memory leaks
- **Continuous growth**: Unbounded memory consumption

### Performance Warnings
- **Slow response time**: Average >100ms
- **Low ops/sec**: Poor throughput
- **Increasing latency**: Performance degradation over time

## 🛠️ Customization

### Adding Custom Tests

```tsx
const CUSTOM_TEST: StressTestConfig = {
  name: 'My Custom Test',
  description: 'Custom scenario description',
  nodeCount: 75,
  connectionComplexity: 'complex',
  duration: 120,
  rapidOperations: true,
  memoryTracking: true,
};

// Add to STRESS_TEST_SCENARIOS array
```

### Custom Node Types

Modify `createTestNode` to support your custom node types:

```tsx
const createTestNode = (type: 'myCustomNode' | 'createText' | ..., position, data) => {
  // Add custom node creation logic
};
```

## 🎯 Best Practices

### Regular Testing
- Run stress tests after major changes
- Include in CI/CD pipeline for critical builds
- Monitor memory trends over time

### Performance Baselines
- Establish baseline metrics for your application
- Set up automated alerts for regressions
- Track improvements after optimizations

### Test Environment
- Run on production-like hardware
- Clear browser cache before testing
- Close other applications to reduce interference

## 📋 Checklist for Healthy System

✅ Light Load Test passes consistently
✅ Memory growth is linear with node count
✅ No memory leaks in long-running tests
✅ Response times under 50ms average
✅ System handles 100+ nodes gracefully
✅ Rapid operations don't cause crashes
✅ Memory returns to baseline after cleanup

## 🔧 Troubleshooting

### Common Issues

**High Memory Usage**
- Check for event listener leaks
- Verify proper cleanup in useEffect
- Review cache management

**Slow Performance** 
- Profile React reconciliation
- Check for unnecessary re-renders
- Optimize expensive calculations

**Test Failures**
- Check browser console for errors
- Verify node types are properly registered
- Ensure flow store is properly initialized

## 🏆 Success Metrics

Your system is performing excellently if:
- All stress tests pass consistently
- Memory usage scales linearly
- Response times stay under 50ms
- No memory leaks detected
- Handles 100+ nodes smoothly

## 🚀 Next Steps

1. **Integrate** the stress tester into your development workflow
2. **Establish** performance baselines
3. **Monitor** metrics over time
4. **Optimize** based on test results
5. **Automate** testing in your CI/CD pipeline

Happy stress testing! 🧪✨ 