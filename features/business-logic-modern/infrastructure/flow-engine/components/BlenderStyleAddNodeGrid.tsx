/**
 * BLENDER-STYLE ADD NODE GRID
 * Grid layout similar to Blender's Add menu - clean, organized, space-efficient
 */

"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CATEGORIES } from "@/features/business-logic-modern/infrastructure/theming/categories";
import { 
  Plus, 
  FileText, 
  Eye, 
  Zap, 
  TestTube, 
  RotateCcw, 
  Database, 
  Brain, 
  Mail, 
  Clock, 
  Workflow,
  Wrench
} from "lucide-react";
import React, { useState, useCallback, useMemo } from "react";
import { useReactFlow } from "@xyflow/react";
import { useFlowStore } from "../stores/flowStore";
import { generateNodeId } from "../utils/nodeUtils";
import { getNodeSpecMetadata, getAllNodeSpecMetadata } from "@/features/business-logic-modern/infrastructure/node-registry/nodespec-registry";
import type { NodeCategory } from "@/features/business-logic-modern/infrastructure/theming/categories";
import type { AgenNode } from "../types/nodeData";
import { motion, AnimatePresence } from "framer-motion";

// Category icon mapping
const CATEGORY_ICONS = {
  [CATEGORIES.CREATE]: FileText,
  [CATEGORIES.VIEW]: Eye,
  [CATEGORIES.TRIGGER]: Zap,
  [CATEGORIES.TEST]: TestTube,
  [CATEGORIES.CYCLE]: RotateCcw,
  [CATEGORIES.STORE]: Database,
  [CATEGORIES.AI]: Brain,
  [CATEGORIES.EMAIL]: Mail,
  [CATEGORIES.TIME]: Clock,
  [CATEGORIES.FLOW]: Workflow,
  [CATEGORIES.TOOLS]: Wrench,
} as const;

// Category colors (more subtle for grid)
const CATEGORY_COLORS = {
  [CATEGORIES.CREATE]: "text-blue-500 bg-blue-50 hover:bg-blue-100 border-blue-200",
  [CATEGORIES.VIEW]: "text-green-500 bg-green-50 hover:bg-green-100 border-green-200", 
  [CATEGORIES.TRIGGER]: "text-yellow-500 bg-yellow-50 hover:bg-yellow-100 border-yellow-200",
  [CATEGORIES.TEST]: "text-purple-500 bg-purple-50 hover:bg-purple-100 border-purple-200",
  [CATEGORIES.CYCLE]: "text-orange-500 bg-orange-50 hover:bg-orange-100 border-orange-200",
  [CATEGORIES.STORE]: "text-gray-500 bg-gray-50 hover:bg-gray-100 border-gray-200",
  [CATEGORIES.AI]: "text-pink-500 bg-pink-50 hover:bg-pink-100 border-pink-200",
  [CATEGORIES.EMAIL]: "text-red-500 bg-red-50 hover:bg-red-100 border-red-200",
  [CATEGORIES.TIME]: "text-indigo-500 bg-indigo-50 hover:bg-indigo-100 border-indigo-200",
  [CATEGORIES.FLOW]: "text-cyan-500 bg-cyan-50 hover:bg-cyan-100 border-cyan-200",
  [CATEGORIES.TOOLS]: "text-teal-500 bg-teal-50 hover:bg-teal-100 border-teal-200",
} as const;

// Dark mode colors
const CATEGORY_COLORS_DARK = {
  [CATEGORIES.CREATE]: "dark:text-blue-400 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 dark:border-blue-800",
  [CATEGORIES.VIEW]: "dark:text-green-400 dark:bg-green-950/50 dark:hover:bg-green-900/50 dark:border-green-800", 
  [CATEGORIES.TRIGGER]: "dark:text-yellow-400 dark:bg-yellow-950/50 dark:hover:bg-yellow-900/50 dark:border-yellow-800",
  [CATEGORIES.TEST]: "dark:text-purple-400 dark:bg-purple-950/50 dark:hover:bg-purple-900/50 dark:border-purple-800",
  [CATEGORIES.CYCLE]: "dark:text-orange-400 dark:bg-orange-950/50 dark:hover:bg-orange-900/50 dark:border-orange-800",
  [CATEGORIES.STORE]: "dark:text-gray-400 dark:bg-gray-950/50 dark:hover:bg-gray-900/50 dark:border-gray-800",
  [CATEGORIES.AI]: "dark:text-pink-400 dark:bg-pink-950/50 dark:hover:bg-pink-900/50 dark:border-pink-800",
  [CATEGORIES.EMAIL]: "dark:text-red-400 dark:bg-red-950/50 dark:hover:bg-red-900/50 dark:border-red-800",
  [CATEGORIES.TIME]: "dark:text-indigo-400 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 dark:border-indigo-800",
  [CATEGORIES.FLOW]: "dark:text-cyan-400 dark:bg-cyan-950/50 dark:hover:bg-cyan-900/50 dark:border-cyan-800",
  [CATEGORIES.TOOLS]: "dark:text-teal-400 dark:bg-teal-950/50 dark:hover:bg-teal-900/50 dark:border-teal-800",
} as const;

// Category friendly names
const CATEGORY_NAMES = {
  [CATEGORIES.CREATE]: "Create",
  [CATEGORIES.VIEW]: "View", 
  [CATEGORIES.TRIGGER]: "Trigger",
  [CATEGORIES.TEST]: "Test",
  [CATEGORIES.CYCLE]: "Loop",
  [CATEGORIES.STORE]: "Storage",
  [CATEGORIES.AI]: "AI",
  [CATEGORIES.EMAIL]: "Email",
  [CATEGORIES.TIME]: "Time",
  [CATEGORIES.FLOW]: "Flow",
  [CATEGORIES.TOOLS]: "Tools",
} as const;

interface BlenderStyleAddNodeGridProps {
  className?: string;
  position?: { x: number; y: number };
  onNodeCreated?: (nodeType: string, nodeId: string) => void;
}

export const BlenderStyleAddNodeGrid: React.FC<BlenderStyleAddNodeGridProps> = ({
  className = "",
  position,
  onNodeCreated,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<NodeCategory | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<NodeCategory | null>(null);
  
  const { screenToFlowPosition } = useReactFlow();
  const { addNode } = useFlowStore();

  // Available nodes by category
  const nodesByCategory = useMemo(() => {
    const categories: Record<NodeCategory, Array<{ kind: string; displayName: string; description: string }>> = {
      [CATEGORIES.CREATE]: [],
      [CATEGORIES.VIEW]: [],
      [CATEGORIES.TRIGGER]: [],
      [CATEGORIES.TEST]: [],
      [CATEGORIES.CYCLE]: [],
      [CATEGORIES.STORE]: [],
      [CATEGORIES.AI]: [],
      [CATEGORIES.EMAIL]: [],
      [CATEGORIES.TIME]: [],
      [CATEGORIES.FLOW]: [],
      [CATEGORIES.TOOLS]: [],
    };

    try {
      const allNodes = getAllNodeSpecMetadata();
      
      allNodes.forEach(node => {
        const categoryKey = node.category as NodeCategory;
        if (categories[categoryKey]) {
          categories[categoryKey].push({
            kind: node.kind,
            displayName: node.displayName,
            description: node.description || `${node.displayName} node`,
          });
        }
      });
    } catch (error) {
      console.error("❌ BLENDER: Failed to load nodes:", error);
    }

    return categories;
  }, []);

  // Create node handler
  const handleCreateNode = useCallback(async (nodeKind: string) => {
    if (!position) {
      console.error("❌ BLENDER: No position provided");
      return;
    }

    try {
      const flowPosition = screenToFlowPosition(position);
      console.log(`🎯 BLENDER: Creating node ${nodeKind} at position:`, flowPosition);

      const metadata = getNodeSpecMetadata(nodeKind);
      if (!metadata) {
        console.error(`❌ BLENDER: No metadata found for node: ${nodeKind}`);
        return;
      }

      const defaultData = metadata.initialData || {};

      const newNode: AgenNode = {
        id: generateNodeId(),
        type: nodeKind,
        position: flowPosition,
        deletable: true,
        data: {
          ...defaultData,
          isActive: false,
        },
      } as AgenNode;

      console.log(`🔧 BLENDER: Created node:`, newNode);
      
      addNode(newNode);
      onNodeCreated?.(nodeKind, newNode.id);
      
      // Close grid
      setIsVisible(false);
      setSelectedCategory(null);
      setHoveredCategory(null);
      
    } catch (error) {
      console.error("❌ BLENDER: Failed to create node:", error);
    }
  }, [position, screenToFlowPosition, addNode, onNodeCreated]);

  // Filter categories with nodes
  const availableCategories = useMemo(() => {
    return Object.entries(nodesByCategory)
      .filter(([_, nodes]) => nodes.length > 0)
      .map(([category, nodes]) => ({ category: category as NodeCategory, nodes }));
  }, [nodesByCategory]);

  return (
    <div className={`relative ${className}`}>
      {/* Main trigger button */}
      {!isVisible ? (
        <Button
          variant="outline"
          size="sm"
          className="h-10 w-10 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
          onClick={() => setIsVisible(true)}
          title="Add Node (Tab)"
        >
          <Plus className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </Button>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute top-0 left-0 z-50"
            onMouseLeave={() => {
              setIsVisible(false);
              setSelectedCategory(null);
              setHoveredCategory(null);
            }}
          >
            {/* Background panel */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 min-w-[280px]">
              
              {/* Header */}
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Plus className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Node</span>
              </div>

              {/* Categories Grid - 4 columns like Blender */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {availableCategories.map(({ category, nodes }) => {
                  const IconComponent = CATEGORY_ICONS[category];
                  const lightColors = CATEGORY_COLORS[category];
                  const darkColors = CATEGORY_COLORS_DARK[category];
                  const isSelected = selectedCategory === category;
                  const isHovered = hoveredCategory === category;

                  return (
                    <Tooltip key={category} delayDuration={500}>
                      <TooltipTrigger asChild>
                        <button
                          className={`
                            relative flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-150
                            ${lightColors} ${darkColors}
                            ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                            ${isHovered ? 'scale-105' : ''}
                            hover:shadow-md
                          `}
                          onMouseEnter={() => setHoveredCategory(category)}
                          onMouseLeave={() => setHoveredCategory(null)}
                          onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                        >
                          <IconComponent className="h-5 w-5 mb-1" />
                          <span className="text-xs font-medium leading-tight text-center">
                            {CATEGORY_NAMES[category]}
                          </span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                            {nodes.length}
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="text-center">
                          <div className="font-medium">{CATEGORY_NAMES[category]} Nodes</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {nodes.length} node{nodes.length !== 1 ? 's' : ''} available
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>

              {/* Nodes list for selected category */}
              <AnimatePresence>
                {selectedCategory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-200 dark:border-gray-700 pt-3"
                  >
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      {CATEGORY_NAMES[selectedCategory]} Nodes:
                    </div>
                    <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                      {nodesByCategory[selectedCategory].map((node) => (
                        <button
                          key={node.kind}
                          onClick={() => handleCreateNode(node.kind)}
                          className="text-left p-2 rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title={node.description}
                        >
                          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {node.displayName}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 truncate text-[10px] mt-0.5">
                            {node.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default BlenderStyleAddNodeGrid;
