import React, { createContext, useCallback, useContext, useState } from "react";

// Context for managing Visual Node Builder state and visibility
interface VisualNodeBuilderContextType {
  isVisible: boolean;
  showBuilder: () => void;
  hideBuilder: () => void;
  toggleBuilder: () => void;
}

const VisualNodeBuilderContext =
  createContext<VisualNodeBuilderContextType | null>(null);

export const useVisualNodeBuilder = () => {
  const context = useContext(VisualNodeBuilderContext);
  if (!context) {
    throw new Error(
      "useVisualNodeBuilder must be used within a VisualNodeBuilderProvider"
    );
  }
  return context;
};

interface VisualNodeBuilderProviderProps {
  children: React.ReactNode;
}

export const VisualNodeBuilderProvider: React.FC<
  VisualNodeBuilderProviderProps
> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);

  const showBuilder = useCallback(() => {
    setIsVisible(true);
  }, []);

  const hideBuilder = useCallback(() => {
    setIsVisible(false);
  }, []);

  const toggleBuilder = useCallback(() => {
    setIsVisible((prev) => !prev);
  }, []);

  const value = {
    isVisible,
    showBuilder,
    hideBuilder,
    toggleBuilder,
  };

  return (
    <VisualNodeBuilderContext.Provider value={value}>
      {children}
    </VisualNodeBuilderContext.Provider>
  );
};
