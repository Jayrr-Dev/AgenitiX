import React from 'react';
import { NodeError } from '../types';

interface ErrorLogProps {
  errors: NodeError[];
  onClearErrors?: () => void;
}

export const ErrorLog: React.FC<ErrorLogProps> = ({ errors, onClearErrors }) => {
  return (
    <div className="text-xs space-y-1">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-gray-700 dark:text-gray-300">Errors:</div>
        {errors.length > 0 && onClearErrors && (
          <button
            onClick={onClearErrors}
            className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            Clear
          </button>
        )}
      </div>
      <div className="bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-2 border max-h-20 overflow-y-auto scrollbar *:scrollbar-thumb-gray-400 *:scrollbar-track-transparent *:scrollbar-arrow-hidden">
        {errors.length === 0 ? (
          <span className="text-gray-400 italic">No errors</span>
        ) : (
          <div className="space-y-1">
            {errors.slice(-5).map((error, index) => (
              <div key={`${error.timestamp}-${index}`} className="text-xs">
                <div className="flex items-center gap-1">
                  <span className={`w-1 h-1 rounded-full ${
                    error.type === 'error' ? 'bg-red-500' : 
                    error.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <span className="text-gray-500 text-[10px]">
                    {new Date(error.timestamp).toLocaleTimeString()}
                  </span>
                  {error.source && (
                    <span className="text-gray-400 text-[10px]">({error.source})</span>
                  )}
                </div>
                <div className={`font-mono break-all ${
                  error.type === 'error' ? 'text-red-600 dark:text-red-400' : 
                  error.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' : 
                  'text-blue-600 dark:text-blue-400'
                }`}>
                  {error.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 