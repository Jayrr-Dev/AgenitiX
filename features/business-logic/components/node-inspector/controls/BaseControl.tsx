import React from 'react';

interface BaseControlProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const BaseControl: React.FC<BaseControlProps> = ({ 
  children, 
  title, 
  className = '' 
}) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {title && (
        <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          {title}
        </h4>
      )}
      {children}
    </div>
  );
};

interface StatusBadgeProps {
  status: boolean;
  trueLabel?: string;
  falseLabel?: string;
  trueColor?: string;
  falseColor?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  trueLabel = 'TRUE',
  falseLabel = 'FALSE',
  trueColor = 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  falseColor = 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
}) => {
  return (
    <span className={`text-xs px-2 py-1 rounded ${status ? trueColor : falseColor}`}>
      {status ? trueLabel : falseLabel}
    </span>
  );
};

interface ActionButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  children,
  variant = 'primary',
  disabled = false,
  className = ''
}) => {
  const baseClasses = 'text-xs px-2 py-1 rounded transition-colors';
  
  const variantClasses = {
    primary: 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
    danger: 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
}; 