/**
 * NODE SEARCH MODAL - Advanced node discovery and creation interface
 *
 * • Fuzzy search with real-time filtering and scoring
 * • Keyboard navigation with arrow keys and shortcuts
 * • Visual feedback with hover states and selection indicators
 * • Registry integration for rich node metadata display
 * • Ant Design icons from react-icons/ai for visual consistency
 * • Responsive design with proper accessibility features
 *
 * Keywords: search-modal, fuzzy-search, keyboard-navigation, registry-integration, icons
 */

"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { NodeType } from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";
import { renderLucideIcon } from "@/features/business-logic-modern/infrastructure/node-core/utils/iconUtils";
import { useDeferredValue } from "react";
import { getNodeSpecMetadata } from "@/features/business-logic-modern/infrastructure/node-registry/nodespec-registry";
import { Search, X } from "lucide-react";
import React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFilteredNodes } from "../hooks/useFilteredNodes";

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
}) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);

	// Defer heavy search calculations to avoid blocking keystroke rendering
	const MAX_RESULTS = 50; // Reduced for better performance
	const deferredQuery = useDeferredValue(searchQuery);

	// Use filtered nodes hook to respect feature flags
	const { nodes: filteredNodes } = useFilteredNodes();

	// Only compute search results when modal is open to save performance
	const searchResults = useMemo(() => {
		if (!isOpen) return []; // Early exit when modal is closed
		// Use filtered nodes instead of availableNodes to respect feature flags
		const nodesToSearch =
			filteredNodes.length > 0
				? filteredNodes
				: availableNodes
						.map((nodeType) => {
							const metadata = getNodeSpecMetadata(nodeType);
							return metadata;
						})
						.filter(Boolean);

		if (!deferredQuery.trim()) {
			// Show only first 25 nodes when no search query to reduce initial render cost
			return nodesToSearch
				.slice(0, 25) // Limit initial results
				.map((node) => {
					if (!node) {
						return null;
					}
					return {
						nodeType: node.kind as NodeType,
						displayName: node.displayName,
						category: node.category || "other",
						description: node.description,
						icon: node.icon,
						score: 1,
					};
				})
				.filter((item): item is NonNullable<typeof item> => item !== null)
				.sort((a, b) => a.displayName.localeCompare(b.displayName));
		}

		const query = deferredQuery.toLowerCase();
		const results: SearchResult[] = [];

		// Limit search scope to prevent lag with large node registries
		const searchLimit = Math.min(nodesToSearch.length, 100);
		
		for (let i = 0; i < searchLimit; i++) {
			const node = nodesToSearch[i];
			if (!node) continue;

			const displayName = node.displayName;
			const category = node.category || "other";
			const description = node.description || "";

			// Optimized fuzzy matching - avoid repeated toLowerCase calls
			let score = 0;
			const displayLower = displayName.toLowerCase();
			const categoryLower = category.toLowerCase();

			if (displayLower.includes(query)) {
				score += 10;
			}
			if (categoryLower.includes(query)) {
				score += 5;
			}
			if (description.toLowerCase().includes(query)) {
				score += 3;
			}

			if (score > 0) {
				results.push({
					nodeType: node.kind as NodeType,
					displayName,
					category,
					description,
					icon: node.icon,
					score,
				});
				
				// Early exit if we have enough results
				if (results.length >= MAX_RESULTS) break;
			}
		}

		return results.sort((a, b) => b.score - a.score);
	}, [isOpen, deferredQuery, filteredNodes, availableNodes]);

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
					setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
					break;
				case "ArrowUp":
					e.preventDefault();
					setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
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

	// Handle node selection - memoized to prevent re-renders
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
			<DialogContent className="max-h-[80vh]  max-w-2xl p-0">
				{/* Header */}
				<div className="flex items-center  gap-3  p-4">
					<Search className="h-5 w-5 text-modal-secondary" />
					<Input
						placeholder="Search for nodes..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onKeyDown={handleKeyDown}
						className="flex-1 border-0 bg-transparent text-modal focus:outline-none focus:ring-0"
						autoFocus={true}
					/>
					<button
						type="button"
						onClick={onClose}
						className="rounded p-1 text-modal-secondary hover:bg-modal-overlay hover:text-modal"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				{/* Search Results */}
				<div className="flex-1 overflow-hidden">
					{searchResults.length === 0 ? (
						<div className="flex h-32 items-center justify-center text-modal-secondary">
							{searchQuery ? "No nodes found" : "No nodes available"}
						</div>
					) : (
						<div className="max-h-96 overflow-y-auto">
							{searchResults.slice(0, MAX_RESULTS).map((result, index) => (
								<button
									key={result.nodeType}
									type="button"
									onClick={() => handleSelectNode(result.nodeType, result.displayName)}
									className={`w-full border-modal border-b p-3 text-left transition-colors hover:bg-search-hover ${
										index === selectedIndex ? "bg-search-highlight" : ""
									}`}
								>
									<div className="flex items-center gap-3">
										{result.icon && (
											<span className="flex-shrink-0 text-lg">{renderLucideIcon(result.icon)}</span>
										)}
										<div className="min-w-0 flex-1">
											<div className="font-medium text-modal">{result.displayName}</div>
											<div className="text-modal-secondary text-xs capitalize">
												{result.category}
											</div>
											{result.description && (
												<div className="mt-1 line-clamp-2 text-modal-secondary text-xs">
													{result.description}
												</div>
											)}
										</div>
										{deferredQuery && (
											<div className="rounded bg-info px-2 py-1 text-info text-xs">
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
				<div className="border-modal border-t bg-search p-3 text-search-placeholder text-xs">
					Use ↑↓ to navigate, Enter to select, Esc to close
				</div>
			</DialogContent>
		</Dialog>
	);
};
