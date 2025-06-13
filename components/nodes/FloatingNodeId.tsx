/**
 * FLOATING NODE ID COMPONENT - Displays node ID with copy functionality
 *
 * • Shows node ID in a floating overlay with copy-to-clipboard functionality
 * • Provides visual feedback for copy operations with toast notifications
 * • Supports keyboard shortcuts for quick copying and dismissal
 * • Integrates with node theming system for consistent styling
 * • Auto-hides after successful copy or on outside click
 *
 * Keywords: node-id, floating-overlay, copy-clipboard, keyboard-shortcuts, theming
 */

"use client";

import React, { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";

interface FloatingNodeIdProps {
  nodeId: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export const FloatingNodeId: React.FC<FloatingNodeIdProps> = ({
  nodeId,
  position,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(nodeId);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Failed to copy node ID:", error);
    }
  }, [nodeId, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleCopy();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [handleCopy, onClose]
  );

  return (
    <div
      className="fixed z-50 pointer-events-auto"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="bg-info border-info rounded-lg shadow-lg p-3 min-w-48">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="text-xs text-info-text font-medium mb-1">
              Node ID
            </div>
            <div className="font-mono text-sm text-info-text-secondary break-all">
              {nodeId}
            </div>
          </div>
          <button
            onClick={handleCopy}
            onKeyDown={handleKeyDown}
            className="p-2 hover:bg-info-hover rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            title={copied ? "Copied!" : "Copy to clipboard"}
          >
            {copied ? (
              <Check className="w-4 h-4 text-success" />
            ) : (
              <Copy className="w-4 h-4 text-info-text-secondary" />
            )}
          </button>
        </div>
        {copied && (
          <div className="mt-2 text-xs text-success font-medium">
            Copied to clipboard!
          </div>
        )}
      </div>
    </div>
  );
}; 