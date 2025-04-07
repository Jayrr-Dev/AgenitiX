// components/UserRoleInitializer.jsx
"use client"

import { useEffect } from 'react';
import { useUserStore } from '@/store/userStore';
import { getUserRole } from '@/utils/auth-utils';
export function UserRoleInitializer(userRole: string) {
  const setUserRole = useUserStore((state) => state.setUserRole);
  
  useEffect(() => {
    const fetchRole = async () => {
      try {
        const role = await getUserRole(userRole);
        setUserRole(role);
      } catch (error) {
        console.error("Failed to fetch user role:", error);
        setUserRole(null);
      }
    };
    
    fetchRole();
  }, [setUserRole]);
  
  return null; // This component doesn't render anything
}