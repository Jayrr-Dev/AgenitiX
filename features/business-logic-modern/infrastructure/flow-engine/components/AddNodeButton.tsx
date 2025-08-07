/**
 * ADD NODE BUTTON - Enhanced node creation with category-based dropdown menus
 *
 * • Transforms from simple "+" button to category icons on hover
 * • Shows dropdown menus with available nodes for each category
 * • Maintains consistent UI/UX with existing design system
 * • Integrates with existing node creation system
 * • Keyboard shortcuts support (Tab key activation)
 *
 * Keywords: add-node, categories, dropdown, hover, node-creation
 */

"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { getNodeSpecMetadata, hasNodeSpec, nodeSpecs, getAllNodeSpecMetadata } from "@/features/business-logic-modern/infrastructure/node-registry/nodespec-registry";
import type { NodeCategory } from "@/features/business-logic-modern/infrastructure/theming/categories";
import type { AgenNode } from "../types/nodeData";

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

// Category colors for visual distinction
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

interface AddNodeButtonProps {
    className?: string;
    position?: { x: number; y: number };
    onNodeCreated?: (nodeType: string, nodeId: string) => void;
}

interface NodeInfo {
    kind: string;
    displayName: string;
    category: NodeCategory;
    description?: string;
}

export const AddNodeButton: React.FC<AddNodeButtonProps> = ({
    className = "",
    position,
    onNodeCreated,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [activeCategory, setActiveCategory] = useState<NodeCategory | null>(null);

    const { screenToFlowPosition } = useReactFlow();
    const { addNode } = useFlowStore();

    // Get available nodes grouped by category from the registry (AUTOMATIC)
    const nodesByCategory = useMemo(() => {
        const categories: Record<NodeCategory, NodeInfo[]> = {
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

        // Get ALL registered nodes from the node registry automatically
        try {
            const allNodes = getAllNodeSpecMetadata();
            
            allNodes.forEach(node => {
                const categoryKey = node.category as NodeCategory;
                if (categories[categoryKey]) {
                    categories[categoryKey].push({
                        kind: node.kind,
                        displayName: node.displayName,
                        category: categoryKey,
                        description: node.description || `${node.displayName} node`,
                    });
                }
            });

            // console.log('🔄 Auto-loaded nodes by category:', categories);

        } catch (error) {
            console.error("Failed to load nodes from registry:", error);
        }

        return categories;
    }, []);

    // Handle node creation
    const handleCreateNode = useCallback((nodeKind: string) => {
        try {
            console.log(`🎯 Creating node: ${nodeKind}`);

            // Calculate position (use provided position or center of screen)
            const targetPosition = position || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
            const flowPosition = screenToFlowPosition(targetPosition);

            console.log(`📍 Position:`, { targetPosition, flowPosition });

            // Get node metadata from registry
            const metadata = getNodeSpecMetadata(nodeKind);
            console.log(`📋 Metadata for ${nodeKind}:`, metadata);

            // Create new node using ONLY the metadata from the registry (same as library)
            if (!metadata || !metadata.initialData) {
                console.error(`❌ No metadata or initialData found for node: ${nodeKind}`);
                console.error('Available metadata:', metadata);
                console.error('Registry has node?', hasNodeSpec(nodeKind));
                console.error('All available nodes:', Object.keys(nodeSpecs));
                throw new Error(`Node type "${nodeKind}" is not properly registered in the node registry`);
            }

            // Debug: Log what we're actually using
            console.log(`✅ Creating node ${nodeKind} with metadata:`, {
                kind: metadata.kind,
                hasInitialData: !!metadata.initialData,
                initialDataKeys: Object.keys(metadata.initialData || {}),
                initialDataSample: JSON.stringify(metadata.initialData, null, 2).substring(0, 500) + '...'
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

            console.log(`🔧 Created node object:`, newNode);

            // Add node to store
            console.log(`📦 About to add node to store:`, newNode);
            console.log(`🏪 Store addNode function:`, addNode);

            addNode(newNode);

            console.log(`✅ Node added to store successfully`);

            // Verify node was added by checking store state
            const currentNodes = useFlowStore.getState().nodes;
            console.log(`📊 Current nodes in store:`, currentNodes.length);
            console.log(`🔍 Last added node:`, currentNodes[currentNodes.length - 1]);

            // Callback for success
            onNodeCreated?.(nodeKind, newNode.id);

            // Reset UI state
            setActiveCategory(null);
            setIsHovered(false);

        } catch (error) {
            console.error("❌ Failed to create node:", error);
            console.error("Error details:", {
                nodeKind,
                position,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
        }
    }, [position, screenToFlowPosition, addNode, onNodeCreated]);

    // Get categories that have nodes
    const availableCategories = useMemo(() => {
        return Object.entries(nodesByCategory)
            .filter(([_, nodes]) => nodes.length > 0)
            .map(([category]) => category as NodeCategory);
    }, [nodesByCategory]);

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
                // Default "+" button
                <Button
                    variant="outline"
                    size="sm"
                    className="h-10 w-10 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                    title="Add Node (Tab)"
                >
                    <Plus className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </Button>
            ) : (
                // Category buttons
                <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    {availableCategories.map((category) => {
                        const IconComponent = CATEGORY_ICONS[category];
                        const colorClass = CATEGORY_COLORS[category];
                        const nodes = nodesByCategory[category];

                        return (
                            <DropdownMenu key={category} open={activeCategory === category}>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`h-8 w-8 p-0 ${colorClass} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                                        onMouseEnter={() => setActiveCategory(category)}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            console.log(`🎯 Category clicked: ${category}`);
                                            setActiveCategory(activeCategory === category ? null : category);
                                        }}
                                        title={`${category} nodes`}
                                    >
                                        <IconComponent className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                    side="bottom"
                                    align="center"
                                    className="w-56 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                    onInteractOutside={() => setActiveCategory(null)}
                                >
                                    <DropdownMenuLabel className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        {category} Nodes
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />

                                    {nodes.map((node) => (
                                        <DropdownMenuItem
                                            key={node.kind}
                                            onSelect={(e) => {
                                                e.preventDefault();
                                                console.log(`🖱️ Selected node: ${node.kind}`);
                                                handleCreateNode(node.kind);
                                            }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                console.log(`🖱️ Clicked node (backup): ${node.kind}`);
                                                handleCreateNode(node.kind);
                                            }}
                                            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700"
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                    {node.displayName}
                                                </span>
                                                {node.description && (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        {node.description}
                                                    </span>
                                                )}
                                            </div>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AddNodeButton;