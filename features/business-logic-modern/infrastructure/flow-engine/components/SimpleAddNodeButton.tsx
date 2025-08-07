/**
 * SIMPLE ADD NODE BUTTON - Simplified version for debugging
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
import CustomDropdown from "./CustomDropdown";

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

// Category colors
const CATEGORY_COLORS = {
  [CATEGORIES.CREATE]: "text-blue-600 hover:text-blue-700",
  [CATEGORIES.VIEW]: "text-green-600 hover:text-green-700", 
  [CATEGORIES.TRIGGER]: "text-yellow-600 hover:text-yellow-700",
  [CATEGORIES.TEST]: "text-purple-600 hover:text-purple-700",
  [CATEGORIES.CYCLE]: "text-orange-600 hover:text-orange-700",
  [CATEGORIES.STORE]: "text-gray-600 hover:text-gray-700",
  [CATEGORIES.AI]: "text-pink-600 hover:text-pink-700",
  [CATEGORIES.EMAIL]: "text-red-600 hover:text-red-700",
  [CATEGORIES.TIME]: "text-indigo-600 hover:text-indigo-700",
  [CATEGORIES.FLOW]: "text-cyan-600 hover:text-cyan-700",
  [CATEGORIES.TOOLS]: "text-teal-600 hover:text-teal-700",
} as const;

// Category friendly names for tooltips
const CATEGORY_NAMES = {
  [CATEGORIES.CREATE]: "Create Nodes",
  [CATEGORIES.VIEW]: "View Nodes", 
  [CATEGORIES.TRIGGER]: "Trigger Nodes",
  [CATEGORIES.TEST]: "Test Nodes",
  [CATEGORIES.CYCLE]: "Loop Nodes",
  [CATEGORIES.STORE]: "Storage Nodes",
  [CATEGORIES.AI]: "AI Nodes",
  [CATEGORIES.EMAIL]: "Email Nodes",
  [CATEGORIES.TIME]: "Time Nodes",
  [CATEGORIES.FLOW]: "Flow Control",
  [CATEGORIES.TOOLS]: "Tool Nodes",
} as const;

interface SimpleAddNodeButtonProps {
  className?: string;
  position?: { x: number; y: number };
  onNodeCreated?: (nodeType: string, nodeId: string) => void;
}

export const SimpleAddNodeButton: React.FC<SimpleAddNodeButtonProps> = ({
  className = "",
  position,
  onNodeCreated,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [activeCategory, setActiveCategory] = useState<NodeCategory | null>(null);
  
  const { screenToFlowPosition } = useReactFlow();
  const { addNode } = useFlowStore();

  // Available nodes by category (AUTOMATIC from registry)
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

      // console.log('🔄 SIMPLE: Auto-loaded nodes by category:', categories);
    } catch (error) {
      console.error("Failed to load nodes from registry:", error);
    }

    return categories;
  }, []);

  // Handle node creation
  const handleCreateNode = useCallback((nodeKind: string) => {
    console.log(`🎯 SIMPLE: Creating node: ${nodeKind}`);
    
    try {
      const targetPosition = position || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      const flowPosition = screenToFlowPosition(targetPosition);

      // Get metadata from registry (same as library uses)
      const metadata = getNodeSpecMetadata(nodeKind);
      
      if (!metadata || !metadata.initialData) {
        console.error(`❌ SIMPLE: No metadata found for node: ${nodeKind}`);
        throw new Error(`Node type "${nodeKind}" is not registered`);
      }

      console.log(`✅ SIMPLE: Creating node ${nodeKind} with metadata:`, {
        kind: metadata.kind,
        hasInitialData: !!metadata.initialData,
        initialDataKeys: Object.keys(metadata.initialData || {}),
      });

      // Initialize node data with defaults from spec (SAME AS LIBRARY)
      const defaultData = metadata.initialData || {};

      const newNode: AgenNode = {
        id: generateNodeId(),
        type: nodeKind,
        position: flowPosition,
        deletable: true,
        data: {
          ...defaultData,
          isActive: false, // Default state (SAME AS LIBRARY)
        },
      } as AgenNode;

      console.log(`🔧 SIMPLE: Created node:`, newNode);
      
      addNode(newNode);
      
      console.log(`✅ SIMPLE: Node added successfully`);
      
      onNodeCreated?.(nodeKind, newNode.id);
      
      // Reset UI
      setActiveCategory(null);
      setIsHovered(false);
      
    } catch (error) {
      console.error("❌ SIMPLE: Failed to create node:", error);
    }
  }, [position, screenToFlowPosition, addNode, onNodeCreated]);

  return (
    <div 
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setActiveCategory(null);
      }}
    >
      {!isHovered ? (
        <Button
          variant="outline"
          size="sm"
          className="h-10 w-10 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
          title="Add Node (Tab)"
        >
          <Plus className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </Button>
      ) : (
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          {Object.entries(nodesByCategory).map(([category, nodes]) => {
            const IconComponent = CATEGORY_ICONS[category as NodeCategory];
            const colorClass = CATEGORY_COLORS[category as NodeCategory];

            return (
              <CustomDropdown
                key={category}
                isOpen={activeCategory === category}
                onClose={() => setActiveCategory(null)}
                trigger={
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 ${colorClass} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                        onMouseEnter={() => setActiveCategory(category as NodeCategory)}
                        onClick={() => {
                          console.log(`🎯 SIMPLE: Category clicked: ${category}`);
                          setActiveCategory(activeCategory === category ? null : category as NodeCategory);
                        }}
                      >
                        <IconComponent className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="text-center">
                        <div className="font-medium">{CATEGORY_NAMES[category as NodeCategory]}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {nodes.length} node{nodes.length !== 1 ? 's' : ''} available
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                }
                items={nodes.map(node => ({
                  key: node.kind,
                  label: node.displayName,
                  description: node.description,
                  onClick: () => handleCreateNode(node.kind),
                }))}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SimpleAddNodeButton;