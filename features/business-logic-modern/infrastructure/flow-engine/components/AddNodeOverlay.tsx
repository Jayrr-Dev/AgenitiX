/**
 * ADD NODE OVERLAY - Floating add node interface triggered by Tab key
 *
 * • Shows enhanced add node button at cursor position when Tab is pressed
 * • Integrates with pie menu system for seamless UX
 * • Handles positioning and visibility state
 * • Auto-hides when clicking outside or pressing Escape
 *
 * Keywords: add-node-overlay, tab-trigger, floating-ui, cursor-position
 */

"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import AddNodeButton from "./AddNodeButton";
import SimpleAddNodeButton from "./SimpleAddNodeButton";

interface AddNodeOverlayProps {
  className?: string;
}

interface ShowAddNodeMenuEvent extends CustomEvent {
  detail: {
    position: { x: number; y: number };
  };
}

export const AddNodeOverlay: React.FC<AddNodeOverlayProps> = ({
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  // Handle show add node menu event
  const handleShowAddNodeMenu = useCallback((event: ShowAddNodeMenuEvent) => {
    console.log('🎯 AddNodeOverlay: Received show-add-node-menu event at PIE MENU CENTER', event.detail);
    const { position: pieMenuCenter } = event.detail;
    
    // Validate that we received a valid position
    if (!pieMenuCenter || typeof pieMenuCenter.x !== 'number' || typeof pieMenuCenter.y !== 'number') {
      console.error('❌ AddNodeOverlay: Invalid position received', pieMenuCenter);
      return;
    }
    
    // Center the button exactly on the pie menu center
    const buttonSize = 40; // Approximate button size
    
    const centeredX = pieMenuCenter.x - buttonSize / 2;
    const centeredY = pieMenuCenter.y - buttonSize / 2;
    
    // Additional validation: ensure position is within reasonable bounds
    const isReasonablePosition = 
      centeredX >= -100 && centeredX <= window.innerWidth + 100 &&
      centeredY >= -100 && centeredY <= window.innerHeight + 100;
    
    if (!isReasonablePosition) {
      console.warn('⚠️ AddNodeOverlay: Position seems unreasonable, using center fallback', {
        received: { x: centeredX, y: centeredY },
        windowSize: { width: window.innerWidth, height: window.innerHeight }
      });
      
      // Use screen center as fallback
      setPosition({
        x: window.innerWidth / 2 - buttonSize / 2,
        y: window.innerHeight / 2 - buttonSize / 2,
      });
    } else {
      setPosition({
        x: centeredX,
        y: centeredY,
      });
    }
    
    setIsVisible(true);
    console.log('✅ AddNodeOverlay: Positioned at', { x: centeredX, y: centeredY, isReasonable: isReasonablePosition });
  }, []);

  // Handle hide overlay
  const handleHideOverlay = useCallback(() => {
    setIsVisible(false);
  }, []);

  // Handle click outside
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
      handleHideOverlay();
    }
  }, [handleHideOverlay]);

  // Handle escape key
  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      handleHideOverlay();
    }
  }, [handleHideOverlay]);

  // Handle node creation
  const handleNodeCreated = useCallback((nodeType: string, nodeId: string) => {
    console.log(`Created node: ${nodeType} (${nodeId})`);
    handleHideOverlay();
  }, [handleHideOverlay]);

  // Set up show-add-node-menu event listener (always active)
  useEffect(() => {
    const handleShowEvent = (event: Event) => {
      handleShowAddNodeMenu(event as ShowAddNodeMenuEvent);
    };

    console.log('🔧 AddNodeOverlay: Registering show-add-node-menu event listener');
    window.addEventListener('show-add-node-menu', handleShowEvent);

    return () => {
      window.removeEventListener('show-add-node-menu', handleShowEvent);
    };
  }, [handleShowAddNodeMenu]);

  // Set up click outside and escape key listeners (only when visible)
  useEffect(() => {
    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isVisible, handleClickOutside, handleEscapeKey]);

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  // Render overlay using portal
  return createPortal(
    <div
      ref={overlayRef}
      className={`fixed z-[9999] pointer-events-auto ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <SimpleAddNodeButton
        position={position}
        onNodeCreated={handleNodeCreated}
        className="animate-in fade-in-0 zoom-in-95 duration-200 ease-out"
      />
    </div>,
    document.body
  );
};

export default AddNodeOverlay;