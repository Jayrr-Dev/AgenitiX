'use client';
/* -------------------------------------------------------------------------- */
/*  StencilInfoPanel – fade-in/out hover panel                                */
/* -------------------------------------------------------------------------- */
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';

/**
 * Minimal stencil shape we care about.
 * Keep it generic so we avoid cross-file circular deps.
 */
export interface HoveredStencil {
  id: string;
  label: string;
  description: string;
}

interface StencilInfoPanelProps {
  stencil: HoveredStencil | null;
}

export const StencilInfoPanel: React.FC<StencilInfoPanelProps> = ({ stencil }) => {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {stencil && (
        <motion.div
          /* A different key gives us exit ➜ enter animations between stencils */
          key={stencil.id}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: .90, y: 0 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.30, ease: 'easeOut' }}
          className="mb-2 rounded-lg bg-muted px-3 py-2 text-xs leading-snug absolute top-0 right-[50%] translate-x-1/2 -translate-y-25 bg-sky-900 w-[440px] h-[95px] border border-sky-600"
        >
          <div className="font-medium">{stencil.label}</div>
          <div className="text-muted-foreground">{stencil.description}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
