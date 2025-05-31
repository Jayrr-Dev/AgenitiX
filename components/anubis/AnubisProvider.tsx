'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AnubisContextType, RouteProtectionConfig, AnubisConfig } from '@/types/anubis';

// ANUBIS CONTEXT
const AnubisContext = createContext<AnubisContextType | null>(null);

// ANUBIS PROVIDER PROPS
interface AnubisProviderProps {
  children: ReactNode;
  initialConfig?: Partial<AnubisConfig>;
}

// ANUBIS PROVIDER COMPONENT
export function AnubisProvider({ children, initialConfig }: AnubisProviderProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('/');
  const [protectedRoutes, setProtectedRoutes] = useState<Map<string, RouteProtectionConfig>>(new Map());
  
  // INITIALIZE ANUBIS STATE
  useEffect(() => {
    // GET CURRENT ROUTE
    setCurrentRoute(window.location.pathname);
    
    // LOAD INITIAL CONFIGURATION
    if (initialConfig?.enabled) {
      setIsEnabled(initialConfig.enabled);
    }
    
    // LOAD PROTECTED ROUTES FROM LOCAL STORAGE
    const savedRoutes = localStorage.getItem('anubis-protected-routes');
    if (savedRoutes) {
      try {
        const routesArray = JSON.parse(savedRoutes) as RouteProtectionConfig[];
        const routesMap = new Map(routesArray.map(route => [route.path, route]));
        setProtectedRoutes(routesMap);
      } catch (error) {
        console.error('Failed to load saved routes:', error);
      }
    }
  }, [initialConfig]);
  
  // SAVE ROUTES TO LOCAL STORAGE
  const saveRoutesToStorage = (routes: Map<string, RouteProtectionConfig>) => {
    try {
      const routesArray = Array.from(routes.values());
      localStorage.setItem('anubis-protected-routes', JSON.stringify(routesArray));
    } catch (error) {
      console.error('Failed to save routes:', error);
    }
  };
  
  // TOGGLE ROUTE PROTECTION
  const toggleProtection = (path: string, enabled: boolean) => {
    setProtectedRoutes(prev => {
      const newRoutes = new Map(prev);
      const existing = newRoutes.get(path);
      
      if (existing) {
        existing.enabled = enabled;
      } else {
        newRoutes.set(path, {
          path,
          enabled,
          description: `Route protection for ${path}`
        });
      }
      
      saveRoutesToStorage(newRoutes);
      return newRoutes;
    });
  };
  
  // UPDATE ANUBIS CONFIGURATION
  const updateConfig = (config: Partial<AnubisConfig>) => {
    if (config.enabled !== undefined) {
      setIsEnabled(config.enabled);
    }
    
    // SAVE TO LOCAL STORAGE
    try {
      const savedConfig = localStorage.getItem('anubis-config') || '{}';
      const currentConfig = JSON.parse(savedConfig);
      const updatedConfig = { ...currentConfig, ...config };
      localStorage.setItem('anubis-config', JSON.stringify(updatedConfig));
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  };
  
  // GET ROUTE CONFIGURATION
  const getRouteConfig = (path: string): RouteProtectionConfig | null => {
    return protectedRoutes.get(path) || null;
  };
  
  // CHECK IF CURRENT ROUTE IS PROTECTED
  const isProtected = protectedRoutes.get(currentRoute)?.enabled || false;
  
  // CONTEXT VALUE
  const contextValue: AnubisContextType = {
    isEnabled,
    isProtected,
    currentRoute,
    toggleProtection,
    updateConfig,
    getRouteConfig
  };
  
  return (
    <AnubisContext.Provider value={contextValue}>
      {children}
    </AnubisContext.Provider>
  );
}

// ANUBIS HOOK
export function useAnubis(): AnubisContextType {
  const context = useContext(AnubisContext);
  if (!context) {
    throw new Error('useAnubis must be used within an AnubisProvider');
  }
  return context;
}

// ANUBIS STATUS COMPONENT
export function AnubisStatus() {
  const { isEnabled, isProtected, currentRoute } = useAnubis();
  
  if (!isEnabled) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-sm">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
        <span className="font-medium">Anubis Protection</span>
      </div>
      <div className="text-gray-600 dark:text-gray-400 mt-1">
        Route: {currentRoute}
      </div>
      <div className="text-gray-600 dark:text-gray-400">
        Status: {isProtected ? 'Protected' : 'Unprotected'}
      </div>
    </div>
  );
} 