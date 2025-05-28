import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { NodeStencil } from '../types';
import { AVAILABLE_NODES } from '../constants';
import { StencilGrid } from '../StencilGrid';
import { HoveredStencil } from '../../StencilInfoPanel';

interface SearchBarProps {
  onNativeDragStart: (e: React.DragEvent<HTMLDivElement>, nodeType: string) => void;
  onDoubleClickCreate: (nodeType: string) => void;
  setHovered: (s: HoveredStencil | null) => void;
  isVisible: boolean;
  onClose: () => void;
}

export function SearchBar({
  onNativeDragStart,
  onDoubleClickCreate,
  setHovered,
  isVisible,
  onClose,
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Create searchable stencils from all available nodes
  const allStencils = useMemo(() => {
    return Object.entries(AVAILABLE_NODES).map(([filename, node], index) => ({
      id: `search-${filename.toLowerCase()}-${index}`,
      nodeType: node.nodeType,
      label: node.label,
      description: node.description,
    }));
  }, []);

  // Filter stencils based on search query
  const filteredStencils = useMemo(() => {
    if (!searchQuery.trim()) return allStencils;

    const query = searchQuery.toLowerCase();
    return allStencils.filter(stencil => 
      stencil.label.toLowerCase().includes(query) ||
      stencil.description.toLowerCase().includes(query) ||
      stencil.nodeType.toLowerCase().includes(query)
    );
  }, [searchQuery, allStencils]);

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-background border rounded-lg z-40 flex flex-col">
      {/* Search Header */}
      <div className="flex items-center gap-2 p-3 border-b">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          onClick={handleClose}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto p-3">
        {searchQuery.trim() && (
          <div className="mb-3 text-sm text-gray-600">
            {filteredStencils.length} result{filteredStencils.length !== 1 ? 's' : ''} for "{searchQuery}"
          </div>
        )}
        
        {filteredStencils.length > 0 ? (
          <StencilGrid
            stencils={filteredStencils}
            setStencils={() => {}} // Read-only for search results
            onNativeDragStart={onNativeDragStart}
            onDoubleClickCreate={onDoubleClickCreate}
            setHovered={setHovered}
          />
        ) : searchQuery.trim() ? (
          <div className="text-center text-gray-500 mt-8">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No nodes found</p>
            <p className="text-sm">Try searching with different keywords</p>
          </div>
        ) : (
          <div className="text-center text-gray-500 mt-8">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Search all nodes</p>
            <p className="text-sm">Type to find nodes by name or description</p>
          </div>
        )}
      </div>
    </div>
  );
} 