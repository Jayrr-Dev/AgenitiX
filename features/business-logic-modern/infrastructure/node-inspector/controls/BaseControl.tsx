/**
 * BASE CONTROL COMPONENTS - Foundational UI controls for node property editing
 *
 * • Provides reusable base components for building node-specific controls
 * • Includes status badges, action buttons, and input field foundations
 * • Implements consistent styling and interaction patterns with registry-enhanced theming
 * • Supports theming and accessibility features across all controls
 * • Serves as building blocks for complex node control interfaces
 * • Enhanced with registry integration for category-based styling and consistency
 *
 * Keywords: base-controls, reusable, styling, accessibility, theming, building-blocks, registry-integration
 */

import React, { useMemo } from "react";

// REGISTRY INTEGRATION - Import for enhanced theming
import type { NodeType } from "../../flow-engine/types/nodeData";
import { getNodeMetadata } from "../../node-registry/nodespec-registry";

// PROPER TYPES IMPORT - Use the correct BaseControlProps from types
import type { BaseControlProps } from "../types";

// ============================================================================
// ENHANCED COMPONENT INTERFACES
// ============================================================================

interface ControlWrapperProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  nodeType?: string; // Optional for registry-enhanced styling
}

interface StatusBadgeProps {
  status: boolean;
  trueLabel?: string;
  falseLabel?: string;
  trueColor?: string;
  falseColor?: string;
  nodeType?: string; // Optional for registry-enhanced styling
}

interface ActionButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  className?: string;
  nodeType?: string; // Optional for registry-enhanced styling
}

// ============================================================================
// REGISTRY-ENHANCED THEMING HELPERS
// ============================================================================

/**
 * GET CATEGORY-BASED THEME
 * Returns theme colors based on node category from registry
 */
function getCategoryTheme(nodeType?: string): {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
} {
  const metadata = nodeType ? getNodeMetadata(nodeType as NodeType) : null;
  
  // Default theme
  const defaultTheme = {
    primary: "blue",
    secondary: "gray",
    accent: "indigo",
    success: "green",
    warning: "yellow",
    danger: "red",
  };

  if (!metadata) {
    return defaultTheme;
  }

  // Category-based theming (handle both uppercase and lowercase)
  const category = metadata.category.toLowerCase();
  switch (category) {
    case "create":
      return {
        primary: "green",
        secondary: "emerald",
        accent: "teal",
        success: "green",
        warning: "yellow",
        danger: "red",
      };
    case "view":
      return {
        primary: "blue",
        secondary: "sky",
        accent: "cyan",
        success: "green",
        warning: "yellow",
        danger: "red",
      };
    case "trigger":
      return {
        primary: "purple",
        secondary: "violet",
        accent: "fuchsia",
        success: "green",
        warning: "yellow",
        danger: "red",
      };
    case "test":
      return {
        primary: "yellow",
        secondary: "amber",
        accent: "orange",
        success: "green",
        warning: "yellow",
        danger: "red",
      };
    case "cycle":
      return {
        primary: "cyan",
        secondary: "teal",
        accent: "blue",
        success: "green",
        warning: "yellow",
        danger: "red",
      };
    default:
      return {
        primary: "gray",
        secondary: "slate",
        accent: "zinc",
        success: "green",
        warning: "yellow",
        danger: "red",
      };
  }
}

// ============================================================================
// ENHANCED BASE CONTROL COMPONENTS
// ============================================================================

/**
 * BASE CONTROL WRAPPER
 * Enhanced with registry-based theming
 */
export const BaseControl: React.FC<ControlWrapperProps> = ({
  children,
  title,
  className = "",
  nodeType,
}) => {
  const theme = useMemo(() => getCategoryTheme(nodeType), [nodeType]);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {title && (
        <h4
          className={`text-xs font-medium text-${theme.primary}-700 dark:text-${theme.primary}-300 mb-2 border-b border-${theme.primary}-200 dark:border-${theme.primary}-700 pb-1`}
        >
          {title}
        </h4>
      )}
      <div className="space-y-2">{children}</div>
    </div>
  );
};

/**
 * STATUS BADGE
 * Enhanced with registry-based theming
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  trueLabel = "TRUE",
  falseLabel = "FALSE",
  trueColor,
  falseColor,
  nodeType,
}) => {
  const theme = useMemo(() => getCategoryTheme(nodeType), [nodeType]);

  // Use custom colors if provided, otherwise use theme-based colors
  const defaultTrueColor = `bg-${theme.success}-100 text-${theme.success}-700 dark:bg-${theme.success}-900 dark:text-${theme.success}-300`;
  const defaultFalseColor = `bg-${theme.danger}-100 text-${theme.danger}-700 dark:bg-${theme.danger}-900 dark:text-${theme.danger}-300`;

  return (
    <span
      className={`text-xs px-2 py-1 rounded font-medium ${
        status ? trueColor || defaultTrueColor : falseColor || defaultFalseColor
      }`}
    >
      {status ? trueLabel : falseLabel}
    </span>
  );
};

/**
 * ACTION BUTTON
 * Enhanced with registry-based theming
 */
export const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  children,
  variant = "primary",
  disabled = false,
  className = "",
  nodeType,
}) => {
  const theme = useMemo(() => getCategoryTheme(nodeType), [nodeType]);
  const baseClasses =
    "text-xs px-3 py-1.5 rounded transition-colors font-medium";

  // Dynamic variant classes based on theme
  const variantClasses = useMemo(
    () => ({
      primary: `bg-${theme.primary}-100 text-${theme.primary}-700 hover:bg-${theme.primary}-200 dark:bg-${theme.primary}-900 dark:text-${theme.primary}-300 dark:hover:bg-${theme.primary}-800`,
      secondary: `bg-${theme.secondary}-100 text-${theme.secondary}-700 hover:bg-${theme.secondary}-200 dark:bg-${theme.secondary}-700 dark:text-${theme.secondary}-300 dark:hover:bg-${theme.secondary}-600`,
      danger: `bg-${theme.danger}-100 text-${theme.danger}-700 hover:bg-${theme.danger}-200 dark:bg-${theme.danger}-900 dark:text-${theme.danger}-300 dark:hover:bg-${theme.danger}-800`,
    }),
    [theme]
  );

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    if (!disabled) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${className}`}
    >
      {children}
    </button>
  );
};

// ============================================================================
// ENHANCED INPUT COMPONENTS
// ============================================================================

/**
 * REGISTRY-ENHANCED INPUT
 * Base input with theme-based styling
 */
interface EnhancedInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  nodeType?: string;
  type?: "text" | "number" | "email" | "password";
}

export const EnhancedInput: React.FC<EnhancedInputProps> = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  className = "",
  nodeType,
  type = "text",
}) => {
  const theme = useMemo(() => getCategoryTheme(nodeType), [nodeType]);

  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`
        text-xs px-2 py-1.5 rounded border
        bg-white dark:bg-gray-800
        text-gray-900 dark:text-gray-100
        border-${theme.primary}-200 dark:border-${theme.primary}-700
        focus:outline-none focus:ring-2 focus:ring-${theme.primary}-500 focus:border-${theme.primary}-500
        placeholder-gray-400 dark:placeholder-gray-500
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
    />
  );
};

/**
 * REGISTRY-ENHANCED TEXTAREA
 * Base textarea with theme-based styling
 */
interface EnhancedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  nodeType?: string;
  rows?: number;
}

export const EnhancedTextarea: React.FC<EnhancedTextareaProps> = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  className = "",
  nodeType,
  rows = 3,
}) => {
  const theme = useMemo(() => getCategoryTheme(nodeType), [nodeType]);

  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      className={`
        text-xs px-2 py-1.5 rounded border resize-none
        bg-white dark:bg-gray-800
        text-gray-900 dark:text-gray-100
        border-${theme.primary}-200 dark:border-${theme.primary}-700
        focus:outline-none focus:ring-2 focus:ring-${theme.primary}-500 focus:border-${theme.primary}-500
        placeholder-gray-400 dark:placeholder-gray-500
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
    />
  );
};

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

/**
 * CONTROL GROUP
 * Groups related controls with consistent spacing
 */
interface ControlGroupProps {
  title?: string;
  children: React.ReactNode;
  nodeType?: string;
  className?: string;
}

export const ControlGroup: React.FC<ControlGroupProps> = ({
  title,
  children,
  nodeType,
  className = "",
}) => {
  const theme = useMemo(() => getCategoryTheme(nodeType), [nodeType]);

  return (
    <div className={`space-y-2 ${className}`}>
      {title && (
        <div
          className={`text-xs font-semibold text-${theme.primary}-600 dark:text-${theme.primary}-400 uppercase tracking-wide`}
        >
          {title}
        </div>
      )}
      <div className="space-y-2 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
        {children}
      </div>
    </div>
  );
};

/**
 * REGISTRY DEBUG BADGE
 * Shows registry integration status (development only)
 */
interface RegistryDebugBadgeProps {
  nodeType?: string;
}

export const RegistryDebugBadge: React.FC<RegistryDebugBadgeProps> = ({
  nodeType,
}) => {
  if (process.env.NODE_ENV !== "development" || !nodeType) {
    return null;
  }

  const metadata = getNodeMetadata(nodeType as NodeType);

  return (
    <div className="mt-2 text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
      <span>🔧</span>
      <span>Registry: ✅</span>
      {metadata && <span>• Category: {metadata.category}</span>}
    </div>
  );
};

// Re-export the BaseControlProps type for convenience
export type { BaseControlProps };
