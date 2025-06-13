/**
 * SEARCH BAR COMPONENT - Node search interface for sidebar
 *
 * • Search input with real-time filtering capabilities
 * • Integrated with semantic token system for consistent theming
 * • Accessible with proper keyboard navigation and screen reader support
 * • Clear button and search icon for better UX
 * • Responsive design with proper focus states
 *
 * Keywords: search-bar, filter, semantic-tokens, accessibility, responsive
 */

import React, { useState, useCallback } from "react";
import { Search, X } from "lucide-react";
import { HoveredStencil } from "../StencilInfoPanel";
import { getAllNodeMetadata } from "../../node-registry/nodespec-registry";
import type { NodeMetadata } from "../../node-registry/types";
import { StencilGrid } from "../StencilGrid";

interface SearchBarProps {
  onNativeDragStart: (
    e: React.DragEvent<HTMLDivElement>,
    nodeType: string
  ) => void;
  onDoubleClickCreate: (nodeType: string) => void;
  setHovered: (s: HoveredStencil | null) => void;
  isVisible: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onNativeDragStart,
  onDoubleClickCreate,
  setHovered,
  isVisible,
  onClose,
  onSearch,
  placeholder = "Search nodes...",
  className = "",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);

  // KEY REPEAT PREVENTION - Prevent spam node creation
  const lastKeyPressRef = React.useRef<{ key: string; timestamp: number } | null>(
    null
  );
  const KEY_REPEAT_COOLDOWN = 150; // 150ms cooldown between same key presses

  // KEYBOARD SHORTCUT MAPPING - QWERTY grid positions to keys
  const getKeyboardShortcut = (index: number): string => {
    const gridKeyMap: Record<number, string> = {
      // Row 1: qwert (positions 0-4)
      0: "Q",
      1: "W",
      2: "E",
      3: "R",
      4: "T",
      // Row 2: asdfg (positions 5-9)
      5: "A",
      6: "S",
      7: "D",
      8: "F",
      9: "G",
      // Row 3: zxcvb (positions 10-14)
      10: "Z",
      11: "X",
      12: "C",
      13: "V",
      14: "B",
    };
    return gridKeyMap[index] || "";
  };

  // Create searchable stencils from all available nodes
  const allStencils = React.useMemo(() => {
    const nodeMetadata = getAllNodeMetadata();
    return nodeMetadata.map((node: NodeMetadata, index: number) => ({
      id: `search-${node.nodeType.toLowerCase()}-${index}`,
      nodeType: node.nodeType,
      label: node.displayName,
      description: node.description,
    }));
  }, []);

  // Filter stencils based on search query
  const filteredStencils = React.useMemo(() => {
    if (!searchQuery.trim()) return allStencils;

    const query = searchQuery.toLowerCase();
    return allStencils.filter(
      (stencil: { id: string; nodeType: string; label: string; description: string }) =>
        stencil.label.toLowerCase().includes(query) ||
        stencil.description.toLowerCase().includes(query) ||
        stencil.nodeType.toLowerCase().includes(query)
    );
  }, [searchQuery, allStencils]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);
      onSearch(value);
    },
    [onSearch]
  );

  const handleClear = useCallback(() => {
    setSearchQuery("");
    onSearch("");
  }, [onSearch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        handleClear();
      }
    },
    [handleClear]
  );

  // KEYBOARD EVENT HANDLING - Enter to exit, QWERTY shortcuts for results
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle events when search is visible
      if (!isVisible) return;

      // PREVENT KEY REPEAT SPAM - Block browser key repeat events (EXCEPT Alt+Q for fast deletion)
      if (e.repeat) {
        const nodeCreationKeys = [
          "q",
          "w",
          "e",
          "r",
          "t",
          "a",
          "s",
          "d",
          "f",
          "g",
          "z",
          "x",
          "c",
          "v",
          "b",
        ];

        // Allow Alt+Q repeats for fast text deletion
        const isAltQBackspace = e.altKey && e.key.toLowerCase() === "q";

        if (
          nodeCreationKeys.includes(e.key.toLowerCase()) &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.altKey &&
          !e.shiftKey &&
          !isAltQBackspace
        ) {
          e.preventDefault();
          return;
        }
      }

      // PREVENT RAPID KEY SPAM - Throttle same key presses (EXCEPT Alt+Q for fast deletion)
      const currentTime = Date.now();
      const currentKey = e.key.toLowerCase();
      const lastKeyPress = lastKeyPressRef.current;

      // Allow Alt+Q to bypass throttling for fast text deletion
      const isAltQBackspace = e.altKey && currentKey === "q";

      if (
        !isAltQBackspace &&
        lastKeyPress &&
        lastKeyPress.key === currentKey &&
        currentTime - lastKeyPress.timestamp < KEY_REPEAT_COOLDOWN
      ) {
        e.preventDefault();
        return;
      }

      // Only update throttling timestamp for non-Alt+Q keys
      if (!isAltQBackspace) {
        lastKeyPressRef.current = { key: currentKey, timestamp: currentTime };
      }

      // ESCAPE KEY - Close search completely (works even when typing)
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation(); // Prevent event from bubbling to SidebarTabs
        handleClear();
        return;
      }

      // ALT+C - Close search completely (works even when typing)
      if (e.altKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        e.stopPropagation(); // Prevent event from bubbling to SidebarTabs
        handleClear();
        return;
      }

      // Check if user is typing in the input field
      const isTypingInInput = document.activeElement === inputRef.current;

      // Also check if user is typing in ANY input field (text nodes, etc.)
      const activeElement = document.activeElement;
      const isTypingInAnyInput =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.getAttribute("contenteditable") === "true" ||
          (activeElement as HTMLElement).contentEditable === "true");

      if (isTypingInInput) {
        // ENTER KEY - Exit search and return focus to main area
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation(); // Prevent event from bubbling to SidebarTabs
          inputRef.current?.blur();
          setIsInputFocused(false);
          // Don't close search immediately, allow user to use shortcuts on results
          return;
        }

        // ALT+Q - Enhanced backspace when typing (ergonomic text editing)
        if (e.altKey && e.key.toLowerCase() === "q") {
          e.preventDefault();
          e.stopPropagation(); // Prevent event from bubbling to SidebarTabs
          const input = inputRef.current;
          if (input) {
            const start = input.selectionStart || 0;
            const end = input.selectionEnd || 0;

            // If there's a selection, delete the selected text
            if (start !== end) {
              const newValue =
                searchQuery.slice(0, start) + searchQuery.slice(end);
              setSearchQuery(newValue);
              // Immediate cursor positioning for fast deletion
              requestAnimationFrame(() => {
                if (input) {
                  input.setSelectionRange(start, start);
                }
              });
              return;
            }

            // If cursor is at the beginning, do nothing
            if (start === 0) return;

            // Alt+Ctrl+Q - Delete from cursor to beginning of line
            if (e.ctrlKey) {
              const newValue = searchQuery.slice(start);
              setSearchQuery(newValue);
              // Immediate cursor positioning for fast deletion
              requestAnimationFrame(() => {
                if (input) {
                  input.setSelectionRange(0, 0);
                }
              });
              return;
            }

            // Alt+Shift+Q - Delete entire word
            if (e.shiftKey) {
              const beforeCursor = searchQuery.slice(0, start);
              const afterCursor = searchQuery.slice(start);

              // Find the start of the current word by looking backwards
              let wordStart = beforeCursor.length;

              // Skip trailing whitespace
              while (wordStart > 0 && /\s/.test(beforeCursor[wordStart - 1])) {
                wordStart--;
              }

              // Find the start of the word (non-whitespace to whitespace boundary)
              while (wordStart > 0 && !/\s/.test(beforeCursor[wordStart - 1])) {
                wordStart--;
              }

              const newValue = beforeCursor.slice(0, wordStart) + afterCursor;
              setSearchQuery(newValue);
              // Immediate cursor positioning for fast deletion
              requestAnimationFrame(() => {
                if (input) {
                  input.setSelectionRange(wordStart, wordStart);
                }
              });
              return;
            }

            // Alt+Q - Delete single character (standard behavior)
            const newValue =
              searchQuery.slice(0, start - 1) + searchQuery.slice(start);
            setSearchQuery(newValue);
            // Immediate cursor positioning for fast deletion
            requestAnimationFrame(() => {
              if (input) {
                input.setSelectionRange(start - 1, start - 1);
              }
            });
          }
          return;
        }

        // ALT+W - Enter when typing (ergonomic text editing)
        if (e.altKey && e.key.toLowerCase() === "w") {
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
      if (e.key === "6") {
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
          q: 0,
          w: 1,
          e: 2,
          r: 3,
          t: 4,
          // Row 2: asdfg (positions 5-9)
          a: 5,
          s: 6,
          d: 7,
          f: 8,
          g: 9,
          // Row 3: zxcvb (positions 10-14)
          z: 10,
          x: 11,
          c: 12,
          v: 13,
          b: 14,
        };

        if (gridKeyMap.hasOwnProperty(currentKey)) {
          e.preventDefault();
          e.stopPropagation(); // Prevent event from bubbling to SidebarTabs

          const position = gridKeyMap[currentKey];

          // Check if there's a node at this position in filtered results
          if (position < filteredStencils.length) {
            const stencil = filteredStencils[position];
            onDoubleClickCreate(stencil.nodeType);
            console.log(
              `Created node from search results: ${stencil.label} (${currentKey.toUpperCase()})`
            );
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, filteredStencils, onDoubleClickCreate, handleClear]);

  // Focus management when search becomes visible
  React.useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
      setIsInputFocused(true);
    }
  }, [isVisible]);

  const inputRef = React.useRef<HTMLInputElement>(null);

  if (!isVisible) return null;

  return (
    <div className={`absolute inset-0 ${className}`}>
      {/* Search Header */}
      <div className="flex items-center gap-2 px-4 py-1 border-b">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <Search className="text-infra-sidebar-text-secondary w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            onKeyDown={handleKeyDown}
            className="bg-infra-sidebar border-infra-sidebar text-infra-sidebar-text placeholder:text-infra-sidebar-text-secondary hover:bg-infra-sidebar-hover focus:bg-infra-sidebar-hover focus:border-infra-sidebar-border-hover focus:ring-2 focus:ring-primary w-full rounded border pl-10 pr-10 py-2 text-sm transition-colors"
            autoFocus
            ref={inputRef}
          />
          {searchQuery && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-infra-sidebar-text-secondary hover:text-infra-sidebar-text transition-colors"
              aria-label="Clear search"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={handleClear}
          className="p-2 text-infra-sidebar-text hover:bg-infra-sidebar-hover rounded transition-colors"
          title="Close search (Alt+C or Escape)"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto p-3 ">
        {searchQuery.trim() && (
          <div className="mb-3">
            <div className="text-infra-sidebar-text-secondary text-xs">
              {filteredStencils.length} result
              {filteredStencils.length !== 1 ? "s" : ""} for "{searchQuery}"
            </div>
            {filteredStencils.length > 0 && !isInputFocused && (
              <div className="text-infra-sidebar-text-primary text-xs mt-1">
                💡 Press Q, W, E, R, T, A, S, D, F, G, Z, X, C, V, B to create
                nodes • Press 6 to return to input
              </div>
            )}
            {isInputFocused && (
              <div className="text-infra-sidebar-text-secondary text-xs mt-1">
                💡 Alt+Q = backspace • Alt+Shift+Q = delete word • Alt+Ctrl+Q =
                delete to start • Alt+W = enter
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
          <div className="text-center text-infra-sidebar-text mt-8">
            <Search className="h-12 w-12 mx-auto mb-4 text-infra-sidebar-text" />
            <p className="text-lg font-medium text-infra-sidebar-text">No nodes found</p>
            <p className="text-sm text-infra-sidebar-text">Try searching with different keywords</p>
          </div>
        ) : (
          <div className="text-center text-infra-sidebar-text mt-8">
            <Search className="h-12 w-12 mx-auto mb-4 text-infra-sidebar-text" />
            <p className="text-lg font-medium text-infra-sidebar-text">Search all nodes</p>
            <p className="text-sm mb-4 text-infra-sidebar-text">
              Type to find nodes by name or description
            </p>
            <div className="text-xs text-infra-sidebar-text max-w-xs mx-auto">
              <p>
                💡 <strong>Quick workflow:</strong>
              </p>
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
};
