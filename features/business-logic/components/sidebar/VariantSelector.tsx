import React, { useState, useEffect } from 'react';
import { SidebarVariant, VARIANT_NAMES } from './types';
import { FaBolt, FaVideo, FaLink, FaRobot, FaBox } from 'react-icons/fa';

interface VariantSelectorProps {
  variant: SidebarVariant;
  onVariantChange: (variant: SidebarVariant) => void;
  isHidden: boolean;
}

export function VariantSelector({ 
  variant, 
  onVariantChange, 
  isHidden 
}: VariantSelectorProps) {
  const variants: SidebarVariant[] = ['a', 'b', 'c', 'd', 'e'];
  const [hoveredVariant, setHoveredVariant] = useState<SidebarVariant | null>(null);
  const [showSwitchText, setShowSwitchText] = useState<SidebarVariant | null>(null);

  // Show text briefly when variant changes
  useEffect(() => {
    setShowSwitchText(variant);
    const timer = setTimeout(() => {
      setShowSwitchText(null);
    }, 1500); // Show for 1.5 seconds

    return () => clearTimeout(timer);
  }, [variant]);

  if (isHidden) return null;

  const displayText = hoveredVariant || showSwitchText;

  // Helper function to render the correct icon for each variant
  const renderIcon = (v: SidebarVariant) => {
    switch (v) {
      case 'a': return <FaBolt className="w-4 h-4" />; // Main
      case 'b': return <FaVideo className="w-4 h-4" />; // Media
      case 'c': return <FaLink className="w-4 h-4" />; // Integration
      case 'd': return <FaRobot className="w-4 h-4" />; // Automation
      case 'e': return <FaBox className="w-4 h-4" />; // Misc
      default: return null;
    }
  };

  return (
    <div className="absolute bottom-72 right-2 z-40">
      <div className="flex gap-2 flex-row w-[450px]">
        {/* Floating Text - Half width */}
        <div className="w-1/2 flex justify-center">
          {displayText && (
            <div className=" text-white text-shadow-lg  font-extralight  px-2 py-1 ml-10 rounded whitespace-nowrap pointer-events-none tracking-widest">
              {VARIANT_NAMES[displayText]}
            </div>
          )}
        </div>
        
        {/* Variant Buttons - Half width */}
        <div className="w-1/2 flex gap-2 justify-end">
          {variants.map((v) => (
            <button
              key={v}
              onClick={() => onVariantChange(v)}
              onMouseEnter={() => setHoveredVariant(v)}
              onMouseLeave={() => setHoveredVariant(null)}
              className={`rounded h-8 w-8 py-1 text-sm transition-colors flex items-center justify-center ${
                variant === v 
                ? 'bg-white text-black hover:bg-gray-100'
                : 'bg-black text-white hover:bg-gray-700' 
              }`}
            >
              {renderIcon(v)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 