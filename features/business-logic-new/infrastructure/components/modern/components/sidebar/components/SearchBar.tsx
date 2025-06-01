import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // KEY REPEAT PREVENTION - Prevent spam node creation
  const lastKeyPressRef = useRef<{ key: string; timestamp: number } | null>(null);
  const KEY_REPEAT_COOLDOWN = 150; // 150ms cooldown between same key presses

  // KEYBOARD SHORTCUT MAPPING - QWERTY grid positions to keys
  const getKeyboardShortcut = (index: number): string => {
    const gridKeyMap: Record<number, string> = {
      // Row 1: qwert (positions 0-4)
      0: 'Q', 1: 'W', 2: 'E', 3: 'R', 4: 'T',
      // Row 2: asdfg (positions 5-9)
      5: 'A', 6: 'S', 7: 'D', 8: 'F', 9: 'G',
      // Row 3: zxcvb (positions 10-14)
      10: 'Z', 11: 'X', 12: 'C', 13: 'V', 14: 'B',
    };
    return gridKeyMap[index] || '';
  };

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

  // KEYBOARD EVENT HANDLING - Enter to exit, QWERTY shortcuts for results
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle events when search is visible
      if (!isVisible) return;

      // PREVENT KEY REPEAT SPAM - Block browser key repeat events
      if (e.repeat) {
        const nodeCreationKeys = ['q', 'w', 'e', 'r', 't', 'a', 's', 'd', 'f', 'g', 'z', 'x', 'c', 'v', 'b'];
        if (nodeCreationKeys.includes(e.key.toLowerCase()) && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
          e.preventDefault();
          return;
        }
      }

      // PREVENT RAPID KEY SPAM - Throttle same key presses
      const currentTime = Date.now();
      const currentKey = e.key.toLowerCase();
      const lastKeyPress = lastKeyPressRef.current;

      if (lastKeyPress && lastKeyPress.key === currentKey && (currentTime - lastKeyPress.timestamp) < KEY_REPEAT_COOLDOWN) {
        e.preventDefault();
        return;
      }

      lastKeyPressRef.current = { key: currentKey, timestamp: currentTime };

      // ESCAPE KEY - Close search completely (works even when typing)
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation(); // Prevent event from bubbling to SidebarTabs
        handleClose();
        return;
      }

      // ALT+C - Close search completely (works even when typing)
      if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        e.stopPropagation(); // Prevent event from bubbling to SidebarTabs
        handleClose();
        return;
      }

      // Check if user is typing in the input field
      const isTypingInInput = document.activeElement === inputRef.current;
      
      // Also check if user is typing in ANY input field (text nodes, etc.)
      const activeElement = document.activeElement;
      const isTypingInAnyInput = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.getAttribute('contenteditable') === 'true' ||
        (activeElement as HTMLElement).contentEditable === 'true'
      );

      if (isTypingInInput) {
        // ENTER KEY - Exit search and return focus to main area
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation(); // Prevent event from bubbling to SidebarTabs
          inputRef.current?.blur();
          setIsInputFocused(false);
          // Don't close search immediately, allow user to use shortcuts on results
          return;
        }

        // ALT+Q - Backspace when typing (ergonomic text editing)
        if (e.altKey && e.key.toLowerCase() === 'q') {
          e.preventDefault();
          e.stopPropagation(); // Prevent event from bubbling to SidebarTabs
          const input = inputRef.current;
          if (input) {
            const cursorPos = input.selectionStart || 0;
            if (cursorPos > 0) {
              const newValue = searchQuery.slice(0, cursorPos - 1) + searchQuery.slice(cursorPos);
              setSearchQuery(newValue);
              // Restore cursor position after state update
              setTimeout(() => {
                if (input) {
                  input.setSelectionRange(cursorPos - 1, cursorPos - 1);
                }
              }, 0);
            }
          }
          return;
        }

        // ALT+W - Enter when typing (ergonomic text editing)
        if (e.altKey && e.key.toLowerCase() === 'w') {
          e.preventDefault();
          e.stopPropagation(); // Prevent event from bubbling to SidebarTabs
          inputRef.current?.blur();
          setIsInputFocused(false);
          // Don't close search immediately, allow user to use shortcuts on results
          return;
        }

        // When typing in input, only allow input-related keys and our Alt shortcuts
        return;
      }

      // "6" KEY - Return focus to input field (when not already focused)
      if (e.key === '6') {
        // Don't execute if user is typing in any other input field
        if (isTypingInAnyInput && !isTypingInInput) {
          return; // Let the other input field handle the typing
        }
        
        e.preventDefault();
        e.stopPropagation(); // Prevent event from bubbling to SidebarTabs
        if (inputRef.current) {
          inputRef.current.focus();
          setIsInputFocused(true);
        }
        return;
      }

      // QWERTY SHORTCUTS - Create nodes from search results (when not typing in input)
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        // Don't execute shortcuts if user is typing in ANY input field
        if (isTypingInAnyInput) {
          return; // Let the input field handle the typing naturally
        }
        
        const gridKeyMap: Record<string, number> = {
          // Row 1: qwert (positions 0-4)
          'q': 0, 'w': 1, 'e': 2, 'r': 3, 't': 4,
          // Row 2: asdfg (positions 5-9)
          'a': 5, 's': 6, 'd': 7, 'f': 8, 'g': 9,
          // Row 3: zxcvb (positions 10-14)
          'z': 10, 'x': 11, 'c': 12, 'v': 13, 'b': 14,
        };

        if (gridKeyMap.hasOwnProperty(currentKey)) {
          e.preventDefault();
          e.stopPropagation(); // Prevent event from bubbling to SidebarTabs
          
          const position = gridKeyMap[currentKey];
          
          // Check if there's a node at this position in filtered results
          if (position < filteredStencils.length) {
            const stencil = filteredStencils[position];
            onDoubleClickCreate(stencil.nodeType);
            console.log(`Created node from search results: ${stencil.label} (${currentKey.toUpperCase()})`);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, filteredStencils, onDoubleClickCreate, handleClose]);

  // Focus management when search becomes visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
      setIsInputFocused(true);
    }
  }, [isVisible]);

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
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            className="w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
            ref={inputRef}
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
          title="Close search (Alt+C or Escape)"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto p-3">
        {searchQuery.trim() && (
          <div className="mb-3">
            <div className="text-sm text-gray-600">
              {filteredStencils.length} result{filteredStencils.length !== 1 ? 's' : ''} for "{searchQuery}"
            </div>
            {filteredStencils.length > 0 && !isInputFocused && (
              <div className="text-xs text-blue-600 mt-1">
                💡 Press Q, W, E, R, T, A, S, D, F, G, Z, X, C, V, B to create nodes • Press 6 to return to input
              </div>
            )}
            {isInputFocused && (
              <div className="text-xs text-gray-500 mt-1">
                💡 Press Alt+Q = backspace • Alt+W = enter
              </div>
            )}
          </div>
        )}
        
        {filteredStencils.length > 0 ? (
          <StencilGrid
            stencils={filteredStencils}
            setStencils={() => {}} // Read-only for search results
            onNativeDragStart={onNativeDragStart}
            onDoubleClickCreate={onDoubleClickCreate}
            setHovered={setHovered}
            getKeyboardShortcut={getKeyboardShortcut}
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
            <p className="text-sm mb-4">Type to find nodes by name or description</p>
            <div className="text-xs text-gray-400 max-w-xs mx-auto">
              <p>💡 <strong>Quick workflow:</strong></p>
              <p>1. Type to search (Alt+Q=⌫, Alt+W=↵)</p>
              <p>2. Press Enter to exit input</p>
              <p>3. Use Q,W,E,R,T... to create nodes</p>
              <p>4. Press 6 to return to input typing</p>
              <p>5. Press Alt+C or Escape to close</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 