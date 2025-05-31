'use client';

import React, { useState, useEffect } from 'react';
import { useAnubis } from './AnubisProvider';
import type { RouteProtectionConfig } from '@/types/anubis';

// ANUBIS CONTROL PANEL COMPONENT
export function AnubisControlPanel() {
  const { isEnabled, currentRoute, toggleProtection, updateConfig, getRouteConfig } = useAnubis();
  const [isOpen, setIsOpen] = useState(false);
  const [newRoutePath, setNewRoutePath] = useState('');
  const [protectedRoutes, setProtectedRoutes] = useState<RouteProtectionConfig[]>([]);
  const [globalEnabled, setGlobalEnabled] = useState(isEnabled);
  
  // LOAD PROTECTED ROUTES
  useEffect(() => {
    const loadRoutes = () => {
      try {
        const savedRoutes = localStorage.getItem('anubis-protected-routes');
        if (savedRoutes) {
          const routes = JSON.parse(savedRoutes) as RouteProtectionConfig[];
          setProtectedRoutes(routes);
        }
      } catch (error) {
        console.error('Failed to load routes:', error);
      }
    };
    
    loadRoutes();
    setGlobalEnabled(isEnabled);
  }, [isEnabled]);
  
  // TOGGLE GLOBAL ANUBIS
  const handleGlobalToggle = () => {
    const newEnabled = !globalEnabled;
    setGlobalEnabled(newEnabled);
    updateConfig({ enabled: newEnabled });
  };
  
  // ADD NEW PROTECTED ROUTE
  const handleAddRoute = () => {
    if (!newRoutePath.trim()) return;
    
    const path = newRoutePath.startsWith('/') ? newRoutePath : `/${newRoutePath}`;
    toggleProtection(path, true);
    
    // UPDATE LOCAL STATE
    const newRoute: RouteProtectionConfig = {
      path,
      enabled: true,
      description: `Protected route: ${path}`
    };
    
    setProtectedRoutes(prev => [...prev.filter(r => r.path !== path), newRoute]);
    setNewRoutePath('');
  };
  
  // TOGGLE ROUTE PROTECTION
  const handleRouteToggle = (path: string, enabled: boolean) => {
    toggleProtection(path, enabled);
    setProtectedRoutes(prev => 
      prev.map(route => 
        route.path === path ? { ...route, enabled } : route
      )
    );
  };
  
  // REMOVE ROUTE
  const handleRemoveRoute = (path: string) => {
    toggleProtection(path, false);
    setProtectedRoutes(prev => prev.filter(route => route.path !== path));
    
    // REMOVE FROM LOCAL STORAGE
    try {
      const savedRoutes = localStorage.getItem('anubis-protected-routes');
      if (savedRoutes) {
        const routes = JSON.parse(savedRoutes) as RouteProtectionConfig[];
        const filteredRoutes = routes.filter(route => route.path !== path);
        localStorage.setItem('anubis-protected-routes', JSON.stringify(filteredRoutes));
      }
    } catch (error) {
      console.error('Failed to remove route:', error);
    }
  };
  
  // PROTECT CURRENT ROUTE
  const handleProtectCurrentRoute = () => {
    toggleProtection(currentRoute, true);
    
    const newRoute: RouteProtectionConfig = {
      path: currentRoute,
      enabled: true,
      description: `Protected route: ${currentRoute}`
    };
    
    setProtectedRoutes(prev => [...prev.filter(r => r.path !== currentRoute), newRoute]);
  };
  
  // CHECK IF CURRENT ROUTE IS PROTECTED
  const isCurrentRouteProtected = protectedRoutes.some(
    route => route.path === currentRoute && route.enabled
  );
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
        title="Open Anubis Control Panel"
      >
        🐺
      </button>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🐺</span>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Anubis Control Panel
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage bot protection settings
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>
        
        {/* GLOBAL SETTINGS */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Global Settings
          </h3>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable Anubis Protection
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Globally enable or disable bot protection
              </p>
            </div>
            <button
              onClick={handleGlobalToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                globalEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  globalEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
        
        {/* CURRENT ROUTE */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Current Route
          </h3>
          
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div>
              <code className="text-sm font-mono text-gray-900 dark:text-white">
                {currentRoute}
              </code>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {isCurrentRouteProtected ? 'Protected' : 'Unprotected'}
              </p>
            </div>
            <button
              onClick={handleProtectCurrentRoute}
              disabled={isCurrentRouteProtected}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isCurrentRouteProtected
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isCurrentRouteProtected ? 'Protected' : 'Protect This Route'}
            </button>
          </div>
        </div>
        
        {/* ADD NEW ROUTE */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Add Protected Route
          </h3>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={newRoutePath}
              onChange={(e) => setNewRoutePath(e.target.value)}
              placeholder="/path/to/protect"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && handleAddRoute()}
            />
            <button
              onClick={handleAddRoute}
              disabled={!newRoutePath.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
            >
              Add Route
            </button>
          </div>
        </div>
        
        {/* PROTECTED ROUTES LIST */}
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Protected Routes ({protectedRoutes.length})
          </h3>
          
          {protectedRoutes.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No protected routes configured. Add routes above to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {protectedRoutes.map((route) => (
                <div
                  key={route.path}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
                >
                  <div className="flex-1">
                    <code className="text-sm font-mono text-gray-900 dark:text-white">
                      {route.path}
                    </code>
                    {route.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {route.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRouteToggle(route.path, !route.enabled)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        route.enabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          route.enabled ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    
                    <button
                      onClick={() => handleRemoveRoute(route.path)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1"
                      title="Remove route"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* FOOTER */}
        <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-b-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Anubis protection uses proof-of-work challenges to verify legitimate users and block automated bots.
            Protected routes will require visitors to solve a computational challenge before accessing the content.
          </p>
        </div>
      </div>
    </div>
  );
} 