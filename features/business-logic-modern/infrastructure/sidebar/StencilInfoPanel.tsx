/**
 * STENCIL INFO PANEL - Hover information display for node stencils
 *
 * • Animated panel showing node information on hover
 * • Framer Motion animations for smooth fade-in/out transitions
 * • Displays node label and description with styled layout
 * • Positioned overlay with responsive design and styling
 * • Generic interface to avoid circular dependencies
 * • Enhanced with category information and icon-category relationship
 *
 * Keywords: stencil, hover-panel, animations, framer-motion, overlay, category
 */

"use client";
import { Badge } from "@/components/ui/badge";
import { getNodeSpecMetadata } from "@/features/business-logic-modern/infrastructure/node-registry/nodespec-registry";
/* -------------------------------------------------------------------------- */
/*  StencilInfoPanel – fade-in/out hover panel                                */
/* -------------------------------------------------------------------------- */
import { AnimatePresence, motion } from "framer-motion";
import type React from "react";

/**
 * Minimal stencil shape we care about.
 * Keep it generic so we avoid cross-file circular deps.
 */
export interface HoveredStencil {
  id: string;
  label: string;
  description: string;
  nodeType?: string; // Add nodeType for category lookup
}

interface StencilInfoPanelProps {
  stencil: HoveredStencil | null;
}

// Helper function to get category information
const getCategoryInfo = (nodeType?: string) => {
  if (!nodeType) return null;

  try {
    const metadata = getNodeSpecMetadata(nodeType);
    if (!metadata) return null;

    return {
      category: metadata.category,
      icon: metadata.icon,
    };
  } catch (error) {
    console.warn(`Failed to get category info for ${nodeType}:`, error);
    return null;
  }
};

export const StencilInfoPanel: React.FC<StencilInfoPanelProps> = ({
  stencil,
}) => {
  const categoryInfo = getCategoryInfo(stencil?.nodeType);

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
          className="mb-2 px-3 py-2 text-xs leading-snug absolute top-0 right-[50%] translate-x-1/2 border -translate-y-full w-[450px] h-auto bg-[var(--infra-sidebar-bg)] border-[var(--infra-sidebar-border)] text-[var(--infra-sidebar-text)] rounded-lg shadow-lg"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium text-[var(--infra-sidebar-text)]">
                {stencil.label}
              </div>
              {categoryInfo && (
                <Badge variant="outline" className="text-xs">
                  {categoryInfo.category}
                </Badge>
              )}
            </div>
            <div className="text-[var(--infra-sidebar-text-secondary)]">
              {stencil.description}
            </div>
            {categoryInfo && (
              <div className="text-[var(--infra-sidebar-text-secondary)] text-xs">
                <span className="font-medium">Category:</span> This node belongs
                to the{" "}
                <span className="font-medium text-[var(--infra-sidebar-text)]">
                  {categoryInfo.category}
                </span>{" "}
                category based on its icon.
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
