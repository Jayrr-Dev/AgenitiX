'use client';

import React from 'react';
import { useAnubis } from './AnubisProvider';
import { useAnubisProtection, ProtectedComponent, AnubisUtils } from '@/hooks/useAnubisProtection';

// EXAMPLE COMPONENT SHOWING ANUBIS USAGE
export function AnubisExample() {
  const { isEnabled, toggleProtection } = useAnubis();
  const { isProtected, protectCurrentRoute, unprotectCurrentRoute } = useAnubisProtection({
    autoProtect: false // Don't auto-protect this example page
  });

  // PROTECT ADMIN ROUTES EXAMPLE
  const protectAdminRoutes = () => {
    AnubisUtils.protectRoutes(AnubisUtils.patterns.admin, toggleProtection);
  };

  // PROTECT E-COMMERCE ROUTES EXAMPLE
  const protectEcommerceRoutes = () => {
    AnubisUtils.protectRoutes(AnubisUtils.patterns.ecommerce, toggleProtection);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          🐺 Anubis Protection Examples
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CURRENT STATUS */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Current Status
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Global Protection:</span>
                <span className={`font-medium ${isEnabled ? 'text-green-600' : 'text-red-600'}`}>
                  {isEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Current Route:</span>
                <span className={`font-medium ${isProtected ? 'text-green-600' : 'text-gray-600'}`}>
                  {isProtected ? 'Protected' : 'Unprotected'}
                </span>
              </div>
            </div>
          </div>

          {/* MANUAL CONTROLS */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Manual Controls
            </h3>
            <div className="space-y-2">
              <button
                onClick={protectCurrentRoute}
                disabled={isProtected}
                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-sm font-medium transition-colors"
              >
                Protect This Page
              </button>
              <button
                onClick={unprotectCurrentRoute}
                disabled={!isProtected}
                className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded text-sm font-medium transition-colors"
              >
                Unprotect This Page
              </button>
            </div>
          </div>
        </div>

        {/* BULK PROTECTION EXAMPLES */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Bulk Protection Examples
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={protectAdminRoutes}
              className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              🔒 Protect Admin Routes
              <div className="text-xs opacity-80 mt-1">
                /admin, /dashboard, etc.
              </div>
            </button>
            <button
              onClick={protectEcommerceRoutes}
              className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              🛒 Protect E-commerce Routes
              <div className="text-xs opacity-80 mt-1">
                /checkout, /cart, /orders
              </div>
            </button>
          </div>
        </div>

        {/* PROTECTED COMPONENT EXAMPLE */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Protected Component Example
          </h3>
          <ProtectedComponent
            options={{ autoProtect: false }}
            fallback={
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  🔒 This content is only visible when the route is protected.
                </p>
              </div>
            }
          >
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                ✅ This content is visible because the route is protected!
              </p>
            </div>
          </ProtectedComponent>
        </div>

        {/* CODE EXAMPLES */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Code Examples
          </h3>
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-green-400 text-sm">
{`// Hook Usage
import { useAnubisProtection } from '@/hooks/useAnubisProtection';

function MyComponent() {
  const { isProtected, protectCurrentRoute } = useAnubisProtection();
  
  return (
    <button onClick={protectCurrentRoute}>
      {isProtected ? 'Protected' : 'Protect This Page'}
    </button>
  );
}`}
              </pre>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-green-400 text-sm">
{`// HOC Usage
import { withAnubisProtection } from '@/hooks/useAnubisProtection';

const ProtectedPage = withAnubisProtection(MyPage, {
  autoProtect: true,
  description: 'Admin dashboard protection'
});`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 