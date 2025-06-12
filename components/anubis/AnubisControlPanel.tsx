'use client';

import React, { useState, useEffect } from 'react';
import { useAnubis } from './AnubisProvider';
import { CustomLogo } from '@/branding/custom-logo';
import type { RouteProtectionConfig } from '@/types/anubis';

// AGENITIX CONTROL PANEL COMPONENT
export function AnubisControlPanel() {
  const { isEnabled, currentRoute, toggleProtection, updateConfig, getRouteConfig } = useAnubis();
  
  // ALL STATE HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL RETURNS
  const [showUI, setShowUI] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [newRoutePath, setNewRoutePath] = useState('');
  const [protectedRoutes, setProtectedRoutes] = useState<RouteProtectionConfig[]>([]);
  const [globalEnabled, setGlobalEnabled] = useState(isEnabled);
  
  // ALL EFFECT HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL RETURNS
  useEffect(() => {
    const saved = localStorage.getItem('anubis-ui-enabled');
    setShowUI(saved === 'true');
  }, []);
  
  // LOAD PROTECTED ROUTES
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
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
  
  // NOW WE CAN HAVE CONDITIONAL RETURNS
  if (!showUI) return null;
  
  // TOGGLE GLOBAL PROTECTION
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
    if (typeof window !== 'undefined') {
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
  
  // FLOATING BUTTON WHEN CLOSED
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 p-3 rounded-full shadow-lg transition-all duration-300 border border-transparent bg-fill-border hover:animate-fill-transparency backdrop-blur-lg"
        title="Open AgenitiX-Anti-Bot Control Panel"
      >
        <CustomLogo size={24} />
      </button>
    );
  }

  // MAIN CONTROL PANEL
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-background border border-transparent bg-fill-border rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto backdrop-blur-lg">
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="border border-transparent bg-fill-border hover:animate-fill-transparency rounded-lg p-2">
              <CustomLogo size={32} />
            </div>
            <div>
              <h2 className="text-xl font-brand text-foreground">
                AgenitiX Control Panel
              </h2>
              <p className="text-sm text-muted-foreground">
                Manage bot protection settings
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg border border-transparent bg-fill-border hover:animate-fill-transparency"
          >
            ✕
          </button>
        </div>
        
        {/* GLOBAL SETTINGS */}
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-ui font-semibold text-foreground mb-4">
            Global Settings
          </h3>
          
          <div className="flex items-center justify-between p-4 rounded-lg border border-transparent bg-fill-border hover:animate-fill-transparency">
            <div>
              <label className="text-sm font-medium text-foreground">
                Enable AgenitiX Protection
              </label>
              <p className="text-xs text-muted-foreground">
                Globally enable or disable bot protection
              </p>
            </div>
            <button
              onClick={handleGlobalToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                globalEnabled 
                  ? 'bg-secondary shadow-[0_0_8px_2px_rgba(34,197,94,0.6)]' 
                  : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                  globalEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* CURRENT ROUTE */}
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-ui font-semibold text-foreground mb-4">
            Current Route
          </h3>
          
          <div className="flex items-center justify-between p-4 rounded-lg border border-transparent bg-fill-border hover:animate-fill-transparency">
            <div>
              <code className="text-sm font-mono text-foreground bg-muted px-2 py-1 rounded">
                {currentRoute}
              </code>
              <p className="text-xs text-muted-foreground mt-1">
                {isCurrentRouteProtected ? '🛡️ Protected' : '🔓 Unprotected'}
              </p>
            </div>
            <button
              onClick={handleProtectCurrentRoute}
              disabled={isCurrentRouteProtected}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 border border-transparent ${
                isCurrentRouteProtected
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-fill-border hover:animate-fill-transparency text-foreground'
              }`}
            >
              {isCurrentRouteProtected ? 'Protected' : 'Protect This Route'}
            </button>
          </div>
        </div>

        {/* ADD NEW ROUTE */}
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-ui font-semibold text-foreground mb-4">
            Add Protected Route
          </h3>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={newRoutePath}
              onChange={(e) => setNewRoutePath(e.target.value)}
              placeholder="/path/to/protect"
              className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
              onKeyPress={(e) => e.key === 'Enter' && handleAddRoute()}
            />
            <button
              onClick={handleAddRoute}
              disabled={!newRoutePath.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 border border-transparent bg-fill-border hover:animate-fill-transparency text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Route
            </button>
          </div>
        </div>

        {/* PROTECTED ROUTES LIST */}
        <div className="p-6">
          <h3 className="text-lg font-ui font-semibold text-foreground mb-4">
            Protected Routes ({protectedRoutes.length})
          </h3>
          
          {protectedRoutes.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              No protected routes configured. Add routes above to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {protectedRoutes.map((route) => (
                <div
                  key={route.path}
                  className="flex items-center justify-between p-3 rounded-lg border border-transparent bg-fill-border hover:animate-fill-transparency"
                >
                  <div className="flex-1">
                    <code className="text-sm font-mono text-foreground bg-muted px-2 py-1 rounded">
                      {route.path}
                    </code>
                    {route.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {route.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRouteToggle(route.path, !route.enabled)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 ${
                        route.enabled 
                          ? 'bg-secondary shadow-[0_0_6px_1px_rgba(34,197,94,0.5)]' 
                          : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-300 ${
                          route.enabled ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    
                    <button
                      onClick={() => handleRemoveRoute(route.path)}
                      className="p-1 rounded text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
        <div className="p-6 bg-muted/30 rounded-b-xl border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            <span className="font-brand">AgenitiX</span> protection uses advanced verification to ensure legitimate access.
            Protected routes will require visitors to complete a verification process before accessing the content.
          </p>
        </div>
      </div>
    </div>
  );
} 