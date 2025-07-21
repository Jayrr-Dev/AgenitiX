/**
 * NODE SEARCH MODAL - Enhanced node search and selection interface
 *
 * • Provides fuzzy search across all available node types with keyboard navigation
 * • Shows categorized results with node metadata and descriptions
 * • Supports keyboard shortcuts for quick selection and modal dismissal
 * • Integrates with node registry for accurate type information and icons
 * • Includes recent selections and favorites for improved workflow efficiency
 *
 * Keywords: node-search, modal, fuzzy-search, keyboard-navigation, node-registry
 */

"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getNodeMetadata } from "@/features/business-logic-modern/infrastructure/node-registry/nodespec-registry";
import type { NodeType } from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";
import { Search, X } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";

interface NodeSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNode?: (nodeType: NodeType) => void;
  onAddNode?: (node: any) => void;
  availableNodes?: NodeType[];
  existingNodes?: string[];
}

interface SearchResult {
  nodeType: NodeType;
  displayName: string;
  category: string;
  description?: string;
  icon?: string;
  score: number;
}

export const NodeSearchModal: React.FC<NodeSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectNode,
  onAddNode,
  availableNodes = [],
  existingNodes = [],
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Fuzzy search implementation
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      // Show all nodes when no search query
      return availableNodes
        .map((nodeType) => {
          const metadata = getNodeMetadata(nodeType);
          return {
            nodeType,
            displayName: metadata?.displayName || nodeType,
            category: metadata?.category || "other",
            description: metadata?.description,
            icon: metadata?.icon,
            score: 1,
          };
        })
        .sort((a, b) => a.displayName.localeCompare(b.displayName));
    }

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    availableNodes.forEach((nodeType) => {
      const metadata = getNodeMetadata(nodeType);
      const displayName = metadata?.displayName || nodeType;
      const category = metadata?.category || "other";
      const description = metadata?.description || "";

      // Simple fuzzy matching
      let score = 0;
      const searchText = `${displayName} ${category} ${description}`.toLowerCase();

      if (displayName.toLowerCase().includes(query)) {
        score += 10;
      }
      if (category.toLowerCase().includes(query)) {
        score += 5;
      }
      if (description.toLowerCase().includes(query)) {
        score += 3;
      }
      if (searchText.includes(query)) {
        score += 1;
      }

      if (score > 0) {
        results.push({
          nodeType,
          displayName,
          category,
          description,
          icon: metadata?.icon,
          score,
        });
      }
    });

    return results.sort((a, b) => b.score - a.score);
  }, [searchQuery, availableNodes]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < searchResults.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : searchResults.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (searchResults[selectedIndex]) {
            const result = searchResults[selectedIndex];
            if (onSelectNode) {
              onSelectNode(result.nodeType);
            } else if (onAddNode) {
              onAddNode({ nodeType: result.nodeType, label: result.displayName });
            }
            onClose();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [searchResults, selectedIndex, onSelectNode, onClose]
  );

  // Handle node selection
  const handleSelectNode = useCallback(
    (nodeType: NodeType, displayName: string) => {
      if (onSelectNode) {
        onSelectNode(nodeType);
      } else if (onAddNode) {
        onAddNode({ nodeType, label: displayName });
      }
      onClose();
    },
    [onSelectNode, onAddNode, onClose]
  );

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0 bg-modal border-modal">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-modal">
          <Search className="w-5 h-5 text-modal-secondary" />
          <Input
            placeholder="Search for nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border-0 bg-transparent text-modal focus:ring-0 focus:outline-none"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-modal-overlay rounded text-modal-secondary hover:text-modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-hidden">
          {searchResults.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-modal-secondary">
              {searchQuery ? "No nodes found" : "No nodes available"}
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {searchResults.map((result, index) => (
                <button
                  key={result.nodeType}
                  onClick={() => handleSelectNode(result.nodeType, result.displayName)}
                  className={`w-full text-left p-3 border-b border-modal hover:bg-search-hover transition-colors ${
                    index === selectedIndex ? "bg-search-highlight" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {result.icon && (
                      <span className="text-lg shrink-0">
                        {result.icon}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-modal">
                        {result.displayName}
                      </div>
                      <div className="text-xs text-modal-secondary capitalize">
                        {result.category}
                      </div>
                      {result.description && (
                        <div className="text-xs text-modal-secondary mt-1 line-clamp-2">
                          {result.description}
                        </div>
                      )}
                    </div>
                    {searchQuery && (
                      <div className="text-xs text-info px-2 py-1 bg-info rounded">
                        {result.score}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-modal bg-search text-xs text-search-placeholder">
          Use ↑↓ to navigate, Enter to select, Esc to close
        </div>
      </DialogContent>
    </Dialog>
  );
}; 