/**
 * ValueDisplay Component - Professional data visualization for TIME nodes
 * 
 * Intelligently displays any data type with appropriate formatting, styling,
 * and interactive features for maximum professional appeal.
 */

import React, { memo, useState } from 'react';
import { renderLucideIcon } from '@/features/business-logic-modern/infrastructure/node-core/utils/iconUtils';
import { 
  detectDataType, 
  formatValueForDisplay, 
  formatValueCompact, 
  formatValueDetailed,
  getTypeDisplayName,
  type DataType 
} from '../utils';

interface ValueDisplayProps {
  value: any;
  label?: string;
  compact?: boolean;
  showType?: boolean;
  className?: string;
  maxLength?: number;
}

/**
 * Professional value display component with type awareness
 */
export const ValueDisplay = memo<ValueDisplayProps>(({ 
  value, 
  label, 
  compact = false, 
  showType = false,
  className = '',
  maxLength 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const dataType = detectDataType(value);
  const typeDisplayName = getTypeDisplayName(dataType);
  
  // Format the value based on display mode
  const formattedValue = compact 
    ? formatValueCompact(value)
    : formatValueForDisplay(value, maxLength);
  
  const detailedValue = formatValueDetailed(value);
  const canExpand = formattedValue !== detailedValue && !compact;
  
  // Get appropriate icon for data type
  const getTypeIcon = (type: DataType): string => {
    switch (type) {
      case 'string': return 'LuType';
      case 'number': return 'LuHash';
      case 'boolean': return 'LuCheck';
      case 'array': return 'LuBrackets';
      case 'object': return 'LuBraces';
      case 'date': return 'LuCalendar';
      case 'function': return 'LuCode';
      case 'null':
      case 'undefined':
      default: return 'LuCircle';
    }
  };
  
  // Get appropriate styling for data type
  const getTypeStyles = (type: DataType): string => {
    switch (type) {
      case 'string': return 'text-blue-600 dark:text-blue-400';
      case 'number': return 'text-orange-600 dark:text-orange-400';
      case 'boolean': return 'text-green-600 dark:text-green-400';
      case 'array': return 'text-purple-600 dark:text-purple-400';
      case 'object': return 'text-indigo-600 dark:text-indigo-400';
      case 'date': return 'text-teal-600 dark:text-teal-400';
      case 'function': return 'text-yellow-600 dark:text-yellow-400';
      case 'null': return 'text-slate-500 dark:text-slate-400';
      case 'undefined': return 'text-slate-400 dark:text-slate-500';
      default: return 'text-slate-600 dark:text-slate-300';
    }
  };
  
  const typeStyles = getTypeStyles(dataType);
  const typeIcon = getTypeIcon(dataType);
  
  return (
    <div className={`value-display ${className}`}>
      {/* Label and Type Header */}
      {(label || showType) && (
        <div className="flex items-center justify-between mb-1">
          {label && (
            <span className="text-[8px] font-medium text-slate-600 dark:text-slate-400">
              {label}
            </span>
          )}
          {showType && (
            <div className="flex items-center gap-1">
              {renderLucideIcon(typeIcon, `${typeStyles} opacity-70`, 8)}
              <span className={`text-[7px] font-medium ${typeStyles}`}>
                {typeDisplayName}
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Value Display */}
      <div className="relative">
        <div 
          className={`
            font-mono text-[8px] leading-tight
            ${typeStyles}
            ${canExpand ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded px-1 py-0.5 transition-colors' : ''}
          `}
          onClick={canExpand ? () => setIsExpanded(!isExpanded) : undefined}
          title={canExpand ? 'Click to expand/collapse' : undefined}
        >
          {isExpanded ? detailedValue : formattedValue}
        </div>
        
        {/* Expand/Collapse Indicator */}
        {canExpand && (
          <div className="absolute -right-1 -top-1">
            {renderLucideIcon(
              isExpanded ? 'LuChevronUp' : 'LuChevronDown', 
              'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300', 
              8
            )}
          </div>
        )}
      </div>
    </div>
  );
});

ValueDisplay.displayName = 'ValueDisplay';

/**
 * Compact value display for collapsed nodes
 */
export const ValueDisplayCompact = memo<{ value: any; className?: string }>(({ 
  value, 
  className = '' 
}) => {
  const dataType = detectDataType(value);
  const formattedValue = formatValueCompact(value);
  const typeStyles = detectDataType(value) === 'string' 
    ? 'text-blue-600 dark:text-blue-400'
    : detectDataType(value) === 'number'
    ? 'text-orange-600 dark:text-orange-400'
    : detectDataType(value) === 'boolean'
    ? 'text-green-600 dark:text-green-400'
    : 'text-slate-600 dark:text-slate-300';
  
  return (
    <div className={`font-mono text-[8px] ${typeStyles} ${className}`}>
      {formattedValue}
    </div>
  );
});

ValueDisplayCompact.displayName = 'ValueDisplayCompact';

/**
 * Status value display with professional styling
 */
export const StatusValueDisplay = memo<{
  label: string;
  value: any;
  status?: 'success' | 'warning' | 'error' | 'info';
  className?: string;
}>(({ label, value, status = 'info', className = '' }) => {
  const formattedValue = formatValueCompact(value);
  
  const statusStyles = {
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    error: 'text-red-600 dark:text-red-400',
    info: 'text-cyan-600 dark:text-cyan-400'
  };
  
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <span className="text-[8px] font-medium text-slate-500 dark:text-slate-400">
        {label}:
      </span>
      <span className={`text-[8px] font-semibold font-mono ${statusStyles[status]}`}>
        {formattedValue}
      </span>
    </div>
  );
});

StatusValueDisplay.displayName = 'StatusValueDisplay';