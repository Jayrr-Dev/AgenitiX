/**
 * STENCIL INFO PANEL COMPONENT - Node stencil information display
 *
 * • Displays detailed information about hovered node stencils
 * • Shows node type, description, and keyboard shortcuts
 * • Integrated with semantic token system for consistent theming
 * • Responsive layout with proper spacing and typography
 * • Accessible with proper focus management and screen reader support
 *
 * Keywords: stencil-info, node-details, semantic-tokens, accessibility, responsive
 */

"use client";
/* -------------------------------------------------------------------------- */
/*  StencilInfoPanel – fade-in/out hover panel                                */
/* -------------------------------------------------------------------------- */
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { NodeStencil } from "./types";

export type HoveredStencil = NodeStencil;

interface StencilInfoPanelProps {
  hoveredStencil?: HoveredStencil | null;
  stencil?: HoveredStencil | null;
  keyboardShortcuts?: Record<string, string>;
}

export const StencilInfoPanel: React.FC<StencilInfoPanelProps> = ({
  hoveredStencil,
  stencil,
  keyboardShortcuts = {},
}) => {
  const activeStencil = hoveredStencil || stencil;
  
  if (!activeStencil) {
    return (
      <div className="bg-infra-sidebar border-infra-sidebar text-infra-sidebar-text-secondary rounded border p-4 text-center text-sm">
        Hover over a node stencil to see details
      </div>
    );
  }

  const shortcut = keyboardShortcuts[activeStencil.nodeType];

  return (
    <div className="bg-infra-sidebar border-infra-sidebar text-infra-sidebar-text rounded border p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-infra-sidebar-text font-semibold text-sm">
          {activeStencil.label}
        </h3>
        {shortcut && (
          <span className="bg-infra-sidebar-hover text-infra-sidebar-text-secondary rounded px-2 py-1 text-xs font-mono">
            {shortcut}
          </span>
        )}
      </div>
      
      <p className="text-infra-sidebar-text-secondary text-xs leading-relaxed mb-2">
        Type: <span className="text-infra-sidebar-text font-medium">{activeStencil.nodeType}</span>
      </p>
      
      {activeStencil.description && (
        <p className="text-infra-sidebar-text-secondary text-xs leading-relaxed">
          {activeStencil.description}
        </p>
      )}
      
      <div className="border-infra-sidebar-border mt-3 pt-2 border-t">
        <p className="text-infra-sidebar-text-secondary text-xs">
          Double-click or drag to canvas to create
        </p>
      </div>
    </div>
  );
};
