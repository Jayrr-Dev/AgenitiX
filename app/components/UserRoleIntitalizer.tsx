// components/UserRoleInitializer.jsx
"use client"

import { useEffect } from 'react';
import { useUserStore } from '@/store/userStore';

export function UserRoleInitializer({userRole}: {userRole: string | null})  {
  const setUserRole = useUserStore((state) => state.setUserRole);
  
  useEffect(() => {
    const fetchRole = async () => {
      try {
        // Use a client-side method to get the role
        const role = userRole;
        if (role !== null && role !== undefined) {
            setUserRole(role);
          }      
        } catch (error) {
        console.error("Failed to fetch user role:", error);
        setUserRole(null);
      }
    };
    
    fetchRole();
  }, [setUserRole, userRole]);
  
  return null;
}