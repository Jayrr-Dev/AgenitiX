import React from 'react';

interface ToggleButtonProps {
  isHidden: boolean;
  onToggle: () => void;
}

export function ToggleButton({ isHidden, onToggle }: ToggleButtonProps) {
  return (
    <button 
      onClick={onToggle} 
      className="absolute bottom-0.5 right-1 z-40 cursor-pointer"
      aria-label={isHidden ? 'Show sidebar' : 'Hide sidebar'}
    >
      {isHidden ? '⦾' : '⦿'}
    </button>
  );
} 