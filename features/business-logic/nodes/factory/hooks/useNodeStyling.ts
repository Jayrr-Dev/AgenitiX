import { useMemo } from 'react';
import { 
  useNodeStyleClasses, 
  useNodeButtonTheme, 
  useNodeTextTheme,
  useNodeCategoryBaseClasses,
  useNodeCategoryButtonTheme,
  useNodeCategoryTextTheme,
} from '../../../stores/nodeStyleStore';
import { ERROR_INJECTION_SUPPORTED_NODES } from '../constants';

// TYPES
interface ErrorState {
  supportsErrorInjection: boolean;
  hasVibeError: boolean;
  finalErrorForStyling: string | null;
  finalErrorType: string;
}

interface ThemeObject {
  primary: string;
  secondary: string;
  border: string;
  focus: string;
}

interface NodeStyling {
  nodeStyleClasses: string;
  buttonTheme: string | ThemeObject;
  textTheme: string | ThemeObject;
  categoryBaseClasses: any;
  categoryButtonTheme: string | ThemeObject;
  categoryTextTheme: string | ThemeObject;
  errorState: ErrorState;
}

/**
 * USE NODE STYLING
 * Consolidated styling and theming logic
 * Enhanced with proper TypeScript support
 * 
 * @param nodeType - Node type identifier
 * @param selected - Whether node is selected
 * @param error - Current error state
 * @param isActive - Whether node is active
 * @returns Complete styling object
 */
export function useNodeStyling(
  nodeType: string,
  selected: boolean,
  error: string | null,
  isActive: boolean
): NodeStyling {
  // ERROR STATE CALCULATION
  const errorState: ErrorState = useMemo(() => {
    const supportsErrorInjection = ERROR_INJECTION_SUPPORTED_NODES.includes(
      nodeType as any
    );
    const hasVibeError = supportsErrorInjection && false; // TODO: Get from data
    const vibeErrorType = 'error'; // TODO: Get from data
    const finalErrorForStyling = error || (hasVibeError ? 'Error state active' : null);
    const finalErrorType = error ? 'local' : vibeErrorType;
    
    return { 
      supportsErrorInjection, 
      hasVibeError, 
      finalErrorForStyling, 
      finalErrorType 
    };
  }, [nodeType, error]);

  // BASE STYLING HOOKS
  const nodeStyleClasses = useNodeStyleClasses(
    !!selected, 
    !!errorState.finalErrorForStyling, 
    isActive
  );
  
  const buttonTheme = useNodeButtonTheme(
    !!errorState.finalErrorForStyling, 
    isActive
  );
  
  const textTheme = useNodeTextTheme(!!errorState.finalErrorForStyling);
  
  // CATEGORY-SPECIFIC STYLING HOOKS
  const categoryBaseClasses = useNodeCategoryBaseClasses(nodeType);
  
  const categoryButtonTheme = useNodeCategoryButtonTheme(
    nodeType, 
    !!errorState.finalErrorForStyling, 
    isActive
  );
  
  const categoryTextTheme = useNodeCategoryTextTheme(
    nodeType, 
    !!errorState.finalErrorForStyling
  );

  return {
    nodeStyleClasses,
    buttonTheme,
    textTheme,
    categoryBaseClasses,
    categoryButtonTheme,
    categoryTextTheme,
    errorState
  };
} 