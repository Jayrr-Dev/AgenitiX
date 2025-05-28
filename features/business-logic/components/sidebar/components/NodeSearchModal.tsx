import React, { useState, useMemo } from 'react';
import { AVAILABLE_NODES } from '../constants';
import type { NodeStencil } from '../types';

interface NodeSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNode: (nodeStencil: NodeStencil) => void;
  existingNodes: string[]; // Array of nodeTypes already in custom section
}

export function NodeSearchModal({ 
  isOpen, 
  onClose, 
  onAddNode, 
  existingNodes 
}: NodeSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter available nodes based on search term and exclude already added nodes
  const filteredNodes = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    
    return Object.entries(AVAILABLE_NODES)
      .filter(([filename, node]) => {
        // Exclude nodes already in custom section
        if (existingNodes.includes(node.nodeType)) return false;
        
        // Search in filename, label, and description
        return (
          filename.toLowerCase().includes(searchLower) ||
          node.label.toLowerCase().includes(searchLower) ||
          node.description.toLowerCase().includes(searchLower) ||
          node.folder.toLowerCase().includes(searchLower)
        );
      })
      .map(([filename, node]) => ({
        filename,
        ...node
      }));
  }, [searchTerm, existingNodes]);

  const handleAddNode = (filename: string, node: { nodeType: string; label: string; description: string; folder: string }) => {
    const stencil: NodeStencil = {
      id: `custom-${filename.toLowerCase()}-${Date.now()}`,
      nodeType: node.nodeType as any, // Type assertion needed due to dynamic nature
      label: node.label,
      description: node.description
    };
    
    onAddNode(stencil);
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 w-full max-w-2xl max-h-[80vh] mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Add Node to Custom Section
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-200 dark:border-zinc-700">
          <div className="relative">
            <svg 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search nodes by name, description, or folder..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-md 
                         bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder-gray-500 dark:placeholder-gray-400"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {filteredNodes.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {searchTerm ? 'No nodes found matching your search.' : 'No available nodes to add.'}
            </div>
          ) : (
            <div className="p-2">
              {filteredNodes.map(({ filename, nodeType, label, description, folder }) => (
                <button
                  key={filename}
                  onClick={() => handleAddNode(filename, { nodeType, label, description, folder })}
                  className="w-full p-3 text-left rounded-md hover:bg-gray-50 dark:hover:bg-zinc-700 
                             transition-colors border border-transparent hover:border-gray-200 dark:hover:border-zinc-600
                             group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {label}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-zinc-700 
                                       text-gray-600 dark:text-gray-400 font-mono">
                          {folder}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-mono">
                        {filename} → {nodeType}
                      </p>
                    </div>
                    <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 rounded-b-lg">
          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <span>{filteredNodes.length} nodes available</span>
            <span>Click any node to add it to your custom section</span>
          </div>
        </div>
      </div>
    </div>
  );
} 