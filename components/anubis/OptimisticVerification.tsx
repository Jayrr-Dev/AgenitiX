'use client';

import React, { useEffect, useState, useRef } from 'react';

// ADAPTIVE OPTIMISTIC VERIFICATION COMPONENT
export function OptimisticVerification() {
  // ALL STATE HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL RETURNS
  const [showUI, setShowUI] = useState(false);
  
  // ALL EFFECT HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL RETURNS
  useEffect(() => {
    const saved = localStorage.getItem('anubis-ui-enabled');
    setShowUI(saved === 'true');
  }, []);
  
  // NOW WE CAN HAVE CONDITIONAL RETURNS
  if (!showUI) return null;
  
  // HIDDEN FOR NOW - UNCOMMENT TO SHOW VERIFICATION STATUS
  return null;
}

// ADAPTIVE VERIFICATION PROVIDER
export function OptimisticVerificationProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <OptimisticVerification />
    </>
  );
} 