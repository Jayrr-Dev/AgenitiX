/**
 * NODE DISPLAY CONTEXT - Global display settings for flow nodes
 *
 * • Provides context for controlling node display options
 * • Manages visibility of node IDs and other display features
 * • Centralized state for UI display preferences
 * • React context pattern for global display settings
 * • Used by node components for consistent display behavior
 *
 * Keywords: React-context, display-settings, node-IDs, UI-preferences, global-state
 */

import type React from "react";
import {
  type ReactNode,
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

interface NodeDisplayContextType {
  showNodeIds: boolean;
  setShowNodeIds: (show: boolean) => void;
}

const NodeDisplayContext = createContext<NodeDisplayContextType | undefined>(
  undefined
);

export const useNodeDisplay = () => {
  const context = useContext(NodeDisplayContext);
  if (context === undefined) {
    throw new Error("useNodeDisplay must be used within a NodeDisplayProvider");
  }
  return context;
};

interface NodeDisplayProviderProps {
  children: ReactNode;
}

export const NodeDisplayProvider: React.FC<NodeDisplayProviderProps> = ({
  children,
}) => {
  const [showNodeIds, setShowNodeIds] = useState(false); // Default to hiding IDs

  // Memoize context value to prevent unnecessary re-renders of consumers
  // [Explainantion] , basically avoid new object identity on every parent render
  const value = useMemo(() => ({ showNodeIds, setShowNodeIds }), [showNodeIds]);

  return (
    <NodeDisplayContext.Provider value={value}>
      {children}
    </NodeDisplayContext.Provider>
  );
};
