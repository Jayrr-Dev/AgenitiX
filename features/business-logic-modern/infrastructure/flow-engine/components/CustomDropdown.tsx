/**
 * CUSTOM DROPDOWN - Simple dropdown without complex menu components
 */

"use client";

import React, { useState, useRef, useEffect } from "react";

interface DropdownItem {
  key: string;
  label: string;
  description?: string;
  onClick: () => void;
}

interface CustomDropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  trigger,
  items,
  isOpen,
  onClose,
  className = "",
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {trigger}
      
      {isOpen && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {items.map((item) => (
              <button
                key={item.key}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log(`🖱️ Custom dropdown clicked: ${item.key}`);
                  item.onClick();
                  onClose();
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {item.label}
                  </span>
                  {item.description && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {item.description}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;