import { useState, useEffect } from 'react';
import { NodeStencil, SidebarVariant, TabKey } from '../types';
import { STORAGE_PREFIX } from '../constants';

export function useStencilStorage<
  V extends SidebarVariant,
  K extends TabKey<V>
>(variant: V, tab: K, defaults: NodeStencil[]) {
  const key = `${STORAGE_PREFIX}-${variant}-${tab}`;
  
  const [stencils, setStencils] = useState<NodeStencil[]>(() => {
    if (typeof window === 'undefined') return defaults;
    
    try {
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? (JSON.parse(raw) as NodeStencil[]) : undefined;
      return parsed?.length ? parsed : defaults;
    } catch {
      return defaults;
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(stencils));
    }
  }, [key, stencils]);

  return [stencils, setStencils] as const;
} 