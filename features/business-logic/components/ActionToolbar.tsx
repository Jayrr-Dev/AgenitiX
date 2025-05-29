'use client'

import React, { useState, useEffect } from 'react'
import { RotateCcw, RotateCw, History, Maximize, Minimize, X } from 'lucide-react'
import { useUndoRedo } from './UndoRedoContext'
import { useVibeModeStore } from '../stores/vibeModeStore'

interface ActionToolbarProps {
  showHistoryPanel: boolean
  onToggleHistory: () => void
  className?: string
}

const ActionToolbar: React.FC<ActionToolbarProps> = ({
  showHistoryPanel,
  onToggleHistory,
  className = ''
}) => {
  const { undo, redo, getHistory } = useUndoRedo()
  const { canUndo, canRedo } = getHistory()
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Vibe Mode state
  const { isVibeModeActive, toggleVibeMode } = useVibeModeStore()

  // Check fullscreen state on mount and listen for changes
  useEffect(() => {
    const checkFullscreen = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    checkFullscreen()
    document.addEventListener('fullscreenchange', checkFullscreen)
    return () => document.removeEventListener('fullscreenchange', checkFullscreen)
  }, [])

  // Keyboard shortcut for fullscreen (F11)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault()
        toggleFullscreen()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error)
    }
  }

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
      
      <button
        onClick={toggleFullscreen}
        className={`p-2 rounded transition-colors ${
          isFullscreen 
            ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400'
        }`}
        title={isFullscreen ? "Exit Fullscreen (F11)" : "Enter Fullscreen (F11)"}
      >
        {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
      </button>
      
      <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />
      
      <button
        onClick={toggleVibeMode}
        className={`p-2 rounded transition-colors ${
          isVibeModeActive 
            ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 ring-2 ring-purple-300 dark:ring-purple-700' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400'
        }`}
        title={isVibeModeActive ? "Exit Vibe Mode" : "Enter Vibe Mode"}
      >
        <X className={`w-4 h-4 ${isVibeModeActive ? 'animate-pulse' : ''}`} />
      </button>
    </div>
  )
}

export default ActionToolbar 