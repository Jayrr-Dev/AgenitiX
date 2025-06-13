/**
 * STENCIL INFO PANEL - Hover information display for node stencils
 *
 * • Animated panel showing node information on hover
 * • Framer Motion animations for smooth fade-in/out transitions
 * • Displays node label and description with styled layout
 * • Positioned overlay with responsive design and styling
 * • Generic interface to avoid circular dependencies
 *
 * Keywords: stencil, hover-panel, animations, framer-motion, overlay
 */

"use client";
/* -------------------------------------------------------------------------- */
/*  StencilInfoPanel – fade-in/out hover panel                                */
/* -------------------------------------------------------------------------- */
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { useComponentTheme } from "../theming/components";

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

export const StencilInfoPanel: React.FC<StencilInfoPanelProps> = ({
  stencil,
}) => {
  const theme = useComponentTheme('historyPanel');
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      {stencil && (
        <motion.div
          /* A different key gives us exit ➜ enter animations between stencils */
          key={stencil.id}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 0.95, y: 0 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`mb-2 px-3 py-2 text-xs leading-snug absolute top-0 right-[50%] translate-x-1/2 -translate-y-25 w-[440px] h-[95px] ${theme.background.primary} ${theme.border.default} ${theme.text.primary} ${theme.borderRadius.panel} ${theme.shadow.elevated}`}
        >
          <div className={`font-medium ${theme.text.primary}`}>{stencil.label}</div>
          <div className={`${theme.text.secondary}`}>{stencil.description}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
