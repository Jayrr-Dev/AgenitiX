import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NodeDisplayContextType {
  showNodeIds: boolean;
  setShowNodeIds: (show: boolean) => void;
}

const NodeDisplayContext = createContext<NodeDisplayContextType | undefined>(undefined);

export const useNodeDisplay = () => {
  const context = useContext(NodeDisplayContext);
  if (context === undefined) {
    throw new Error('useNodeDisplay must be used within a NodeDisplayProvider');
  }
  return context;
};

interface NodeDisplayProviderProps {
  children: ReactNode;
}

export const NodeDisplayProvider: React.FC<NodeDisplayProviderProps> = ({ children }) => {
  const [showNodeIds, setShowNodeIds] = useState(false); // Default to hiding IDs

  return (
    <NodeDisplayContext.Provider value={{ showNodeIds, setShowNodeIds }}>
      {children}
    </NodeDisplayContext.Provider>
  );
}; 