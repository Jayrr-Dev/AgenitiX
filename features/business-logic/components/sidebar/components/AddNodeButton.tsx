import React from 'react';

interface AddNodeButtonProps {
  onClick: () => void;
}

export function AddNodeButton({ onClick }: AddNodeButtonProps) {
  return (
    <button
      onClick={onClick}
      className="h-[70px] w-[70px] p-3 border-2 border-dashed border-gray-300 dark:border-zinc-600 
                 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 
                 hover:bg-blue-50 dark:hover:bg-blue-950/20
                 transition-all duration-200 group
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      type="button"
    >
      <div className="flex flex-col items-center justify-center gap-1 text-gray-500 dark:text-gray-400 
                      group-hover:text-blue-600 dark:group-hover:text-blue-400">
        <div className="w-6 h-6 rounded-full border border-current flex items-center justify-center
                        group-hover:scale-110 transition-transform">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <div className="text-[10px] font-medium text-center leading-tight">
          Add
        </div>
      </div>
    </button>
  );
} 