/**
 * SIDEBAR VARIANT SELECTOR COMPONENT - Node variant selection interface
 *
 * • Dropdown selector for choosing different node variants
 * • Integrated with semantic token system for consistent theming
 * • Accessible with proper keyboard navigation and screen reader support
 * • Smooth transitions and hover states for better UX
 * • Supports custom styling and responsive design
 *
 * Keywords: variant-selector, dropdown, semantic-tokens, accessibility, responsive
 */

import React from 'react';

interface SidebarVariantSelectorProps {
  variants: string[];
  selectedVariant: string;
  onVariantChange: (variant: string) => void;
  className?: string;
}

export const SidebarVariantSelector: React.FC<SidebarVariantSelectorProps> = ({
  variants,
  selectedVariant,
  onVariantChange,
  className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      <label className="text-infra-sidebar-text-secondary text-xs font-medium mb-2 block">
        Variant
      </label>
      <select
        value={selectedVariant}
        onChange={(e) => onVariantChange(e.target.value)}
        className="bg-infra-sidebar border-infra-sidebar text-infra-sidebar-text hover:bg-infra-sidebar-hover focus:bg-infra-sidebar-hover focus:border-infra-sidebar-border-hover focus:ring-2 focus:ring-primary w-full rounded border px-3 py-2 text-sm transition-colors appearance-none cursor-pointer"
      >
        {variants.map((variant) => (
          <option 
            key={variant} 
            value={variant}
            className="bg-infra-sidebar text-infra-sidebar-text"
          >
            {variant}
          </option>
        ))}
      </select>
      
      {/* Custom dropdown arrow */}
      <div className="absolute right-3 top-8 pointer-events-none">
        <svg 
          className="text-infra-sidebar-text-secondary w-4 h-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 9l-7 7-7-7" 
          />
        </svg>
      </div>
    </div>
  );
}; 