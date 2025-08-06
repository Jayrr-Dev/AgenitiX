/**
 * Route: components/auth/AuthCollisionTester.tsx
 * AUTH COLLISION TESTING COMPONENT - Testing suite for auth collision scenarios
 *
 * • Tests auth state preservation during email OAuth flows
 * • Simulates collision scenarios and validates recovery mechanisms
 * • Provides real-time monitoring of auth state transitions
 * • Only active in development mode for safety
 *
 * Keywords: auth-testing, collision-simulation, state-validation, development-only
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "./AuthProvider";

interface AuthSnapshot {
  timestamp: string;
  isAuthenticated: boolean;
  sessionSource: string | null;
  hasAuthToken: boolean;
  jwtToken: string | null;
  refreshToken: string | null;
}

interface CollisionTestResult {
  testName: string;
  passed: boolean;
  duration: number;
  beforeState: AuthSnapshot;
  afterState: AuthSnapshot;
  error?: string;
}

export const AuthCollisionTester = () => {
  const { isAuthenticated, sessionSource, authToken, recoverAuth } = useAuthContext();
  const [isTestingEnabled, setIsTestingEnabled] = useState(false);
  const [testResults, setTestResults] = useState<CollisionTestResult[]>([]);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [currentSnapshot, setCurrentSnapshot] = useState<AuthSnapshot | null>(null);

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const captureAuthSnapshot = useCallback((): AuthSnapshot => {
    return {
      timestamp: new Date().toISOString(),
      isAuthenticated,
      sessionSource,
      hasAuthToken: !!authToken,
      jwtToken: localStorage.getItem('__convexAuthJWT_httpsveraciousparakeet120convexcloud'),
      refreshToken: localStorage.getItem('__convexAuthRefreshToken_httpsveraciousparakeet120convexcloud'),
    };
  }, [isAuthenticated, sessionSource, authToken]);

  // Update current snapshot every second when testing is enabled
  useEffect(() => {
    if (!isTestingEnabled) return;

    const interval = setInterval(() => {
      setCurrentSnapshot(captureAuthSnapshot());
    }, 1000);

    return () => clearInterval(interval);
  }, [isTestingEnabled, captureAuthSnapshot]);

  const runCollisionTest = async (testName: string, testFn: () => Promise<void>) => {
    if (isRunningTest) return;

    setIsRunningTest(true);
    const startTime = Date.now();
    const beforeState = captureAuthSnapshot();

    try {
      console.log(`🧪 Starting collision test: ${testName}`);
      await testFn();
      
      // Wait a moment for state to settle
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const afterState = captureAuthSnapshot();
      const duration = Date.now() - startTime;
      
      // Test passes if auth state is preserved
      const passed = beforeState.isAuthenticated === afterState.isAuthenticated &&
                    beforeState.sessionSource === afterState.sessionSource;

      const result: CollisionTestResult = {
        testName,
        passed,
        duration,
        beforeState,
        afterState,
      };

      if (!passed) {
        result.error = `Auth state changed: ${beforeState.sessionSource} → ${afterState.sessionSource}`;
      }

      setTestResults(prev => [...prev, result]);
      console.log(`🧪 Test ${testName} ${passed ? 'PASSED' : 'FAILED'}:`, result);

    } catch (error) {
      const afterState = captureAuthSnapshot();
      const duration = Date.now() - startTime;
      
      const result: CollisionTestResult = {
        testName,
        passed: false,
        duration,
        beforeState,
        afterState,
        error: error instanceof Error ? error.message : String(error),
      };

      setTestResults(prev => [...prev, result]);
      console.error(`🧪 Test ${testName} ERRORED:`, result);
    } finally {
      setIsRunningTest(false);
    }
  };

  const testAuthRecovery = async () => {
    await runCollisionTest("Auth Recovery", async () => {
      // Simulate auth loss by clearing tokens
      const originalJWT = localStorage.getItem('__convexAuthJWT_httpsveraciousparakeet120convexcloud');
      const originalRefresh = localStorage.getItem('__convexAuthRefreshToken_httpsveraciousparakeet120convexcloud');
      
      // Clear tokens to simulate collision
      localStorage.removeItem('__convexAuthJWT_httpsveraciousparakeet120convexcloud');
      localStorage.removeItem('__convexAuthRefreshToken_httpsveraciousparakeet120convexcloud');
      
      // Wait for auth state to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Restore tokens to test recovery
      if (originalJWT) localStorage.setItem('__convexAuthJWT_httpsveraciousparakeet120convexcloud', originalJWT);
      if (originalRefresh) localStorage.setItem('__convexAuthRefreshToken_httpsveraciousparakeet120convexcloud', originalRefresh);
      
      // Trigger recovery
      recoverAuth();
    });
  };

  const testStorageEvents = async () => {
    await runCollisionTest("Storage Event Handling", async () => {
      // Simulate storage events that might interfere with auth
      const event = new StorageEvent('storage', {
        key: '__convexAuthJWT_httpsveraciousparakeet120convexcloud',
        oldValue: 'old_token_value',
        newValue: null,
        url: window.location.href,
      });
      
      window.dispatchEvent(event);
    });
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const formatDuration = (ms: number) => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md max-h-96 overflow-auto z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">🧪 Auth Collision Tester</h3>
        <button
          onClick={() => setIsTestingEnabled(!isTestingEnabled)}
          className={`px-2 py-1 text-xs rounded ${
            isTestingEnabled 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {isTestingEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {isTestingEnabled && currentSnapshot && (
        <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
          <div className="font-medium mb-1">Current State:</div>
          <div>Auth: {currentSnapshot.isAuthenticated ? '✅' : '❌'}</div>
          <div>Source: {currentSnapshot.sessionSource || 'none'}</div>
          <div>JWT: {currentSnapshot.jwtToken ? '✅' : '❌'}</div>
        </div>
      )}

      <div className="space-y-2 mb-3">
        <button
          onClick={testAuthRecovery}
          disabled={isRunningTest || !isAuthenticated}
          className="w-full px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded disabled:bg-gray-100 disabled:text-gray-500"
        >
          Test Auth Recovery
        </button>
        
        <button
          onClick={testStorageEvents}
          disabled={isRunningTest}
          className="w-full px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded disabled:bg-gray-100 disabled:text-gray-500"
        >
          Test Storage Events
        </button>
        
        <button
          onClick={clearResults}
          className="w-full px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded"
        >
          Clear Results
        </button>
      </div>

      {isRunningTest && (
        <div className="mb-3 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
          Running test...
        </div>
      )}

      <div className="space-y-2 max-h-40 overflow-y-auto">
        {testResults.slice(-5).map((result, index) => (
          <div
            key={index}
            className={`p-2 rounded text-xs ${
              result.passed 
                ? 'bg-green-50 text-green-800' 
                : 'bg-red-50 text-red-800'
            }`}
          >
            <div className="font-medium">
              {result.passed ? '✅' : '❌'} {result.testName}
            </div>
            <div>Duration: {formatDuration(result.duration)}</div>
            {result.error && (
              <div className="text-xs opacity-75 mt-1">{result.error}</div>
            )}
          </div>
        ))}
      </div>

      {testResults.length === 0 && (
        <div className="text-xs text-gray-500 text-center">
          No test results yet
        </div>
      )}
    </div>
  );
};