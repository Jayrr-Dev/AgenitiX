import React from "react";

interface NodeBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const NodeBody: React.FC<NodeBodyProps> = ({ children, className }) => {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  );
}; 