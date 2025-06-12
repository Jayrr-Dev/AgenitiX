import React from "react";

interface NodeHeaderProps {
  title: string;
  className?: string;
}

export const NodeHeader: React.FC<NodeHeaderProps> = ({ title, className }) => {
  return (
    <div className={`p-2 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <h3 className="font-bold text-center text-sm text-gray-800 dark:text-gray-200">
        {title}
      </h3>
    </div>
  );
}; 