'use client'

import React from 'react'
import { RotateCcw, RotateCw, History } from 'lucide-react'
import { useUndoRedo } from './UndoRedoContext'

interface UndoRedoToolbarProps {
  showHistoryPanel: boolean
  onToggleHistory: () => void
  className?: string
}

const UndoRedoToolbar: React.FC<UndoRedoToolbarProps> = ({
  showHistoryPanel,
  onToggleHistory,
  className = ''
}) => {
  const { undo, redo, getHistory } = useUndoRedo()
  const { canUndo, canRedo } = getHistory()

  return (
    <div className={`flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-1 ${className}`}>
      <button
        onClick={undo}
        disabled={!canUndo}
        className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Undo (Ctrl+Z)"
      >
        <RotateCcw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </button>
      
      <button
        onClick={redo}
        disabled={!canRedo}
        className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Redo (Ctrl+Y)"
      >
        <RotateCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </button>
      
      <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />
      
      <button
        onClick={onToggleHistory}
        className={`p-2 rounded transition-colors ${
          showHistoryPanel 
            ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400'
        }`}
        title="Toggle History Panel (Ctrl+H)"
      >
        <History className="w-4 h-4" />
      </button>
    </div>
  )
}

export default UndoRedoToolbar 