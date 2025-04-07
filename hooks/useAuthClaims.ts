// hooks/useAuthClaims.ts
"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getCustomClaims, getUserRole } from '@/utils/auth-utils';

interface UseAuthClaimsReturn {
  userRole: string | null;
  claims: any | null;
  isAdmin: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
}

/**
 * Custom hook to access JWT claims from Supabase auth
 * @returns Object with user role, claims, and utility functions
 */
export function useAuthClaims(): UseAuthClaimsReturn {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [claims, setClaims] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const role = getUserRole(session);
          const customClaims = getCustomClaims(session);
          
          setUserRole(role);
          setClaims(customClaims);
          setIsAuthenticated(true);
        } else {
          setUserRole(null);
          setClaims(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error fetching auth claims:', error);
        setUserRole(null);
        setClaims(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const role = getUserRole(session);
        const customClaims = getCustomClaims(session);
        
        setUserRole(role);
        setClaims(customClaims);
        setIsAuthenticated(true);
      } else {
        setUserRole(null);
        setClaims(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  /**
   * Check if user has specific role
   */
  const hasRole = (role: string): boolean => {
    if (!userRole) return false;
    
    // Admin role has access to everything
    if (userRole === 'admin') return true;
    
    return userRole === role;
  };

  return {
    userRole,
    claims,
    isAdmin: userRole === 'admin',
    isLoading,
    isAuthenticated,
    hasRole
  };
}

export default useAuthClaims;