'use client'

import React, { useState, useEffect } from 'react'
import { RotateCcw, RotateCw, History, Maximize, Minimize, X } from 'lucide-react'
import { useUndoRedo } from './UndoRedoContext'
import { useVibeModeStore } from '@theming/stores/vibeModeStore'

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
  const [isBrowserEnvironment, setIsBrowserEnvironment] = useState(false)
  
  // Vibe Mode state
  const { isVibeModeActive, showJsonHandles, toggleVibeMode } = useVibeModeStore()

  // Detect if running in browser vs desktop/Electron app
  useEffect(() => {
    const detectBrowserEnvironment = () => {
      // Check if we're in a browser environment (not Electron/desktop app)
      const isElectron = typeof window !== 'undefined' && 
                        (window as any).electronAPI !== undefined ||
                        typeof (window as any).require !== 'undefined' ||
                        typeof process !== 'undefined' && process.versions?.electron
      
      const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined
      
      const isDesktopApp = isElectron || isTauri
      
      // Only show fullscreen in browsers (not desktop apps)
      setIsBrowserEnvironment(!isDesktopApp)
      
      if (!isDesktopApp) {
        console.log('🌐 Browser environment detected - Fullscreen button enabled')
      } else {
        console.log('🖥️ Desktop app environment detected - Fullscreen button hidden')
      }
    }
    
    detectBrowserEnvironment()
  }, [])

  // Check fullscreen state on mount and listen for changes (only in browser)
  useEffect(() => {
    if (!isBrowserEnvironment) return
    
    const checkFullscreen = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    checkFullscreen()
    document.addEventListener('fullscreenchange', checkFullscreen)
    return () => document.removeEventListener('fullscreenchange', checkFullscreen)
  }, [isBrowserEnvironment])

  // Keyboard shortcut for fullscreen (F11) - only in browser
  useEffect(() => {
    if (!isBrowserEnvironment) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault()
        toggleFullscreen()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isBrowserEnvironment])

  const toggleFullscreen = async () => {
    if (!isBrowserEnvironment) return
    
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
      
      {/* FULLSCREEN BUTTON - Only show in browser environments */}
      {isBrowserEnvironment && (
        <>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />
          
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
        </>
      )}
      
      <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />
      
      <button
        onClick={toggleVibeMode}
        className={`p-2 rounded transition-colors ${
          showJsonHandles 
            ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 ring-2 ring-purple-300 dark:ring-purple-700' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400'
        }`}
        title={showJsonHandles ? "Hide JSON Handles (Vibe Mode)" : "Show JSON Handles (Vibe Mode)"}
      >
        <X className={`w-4 h-4 ${showJsonHandles ? 'animate-pulse' : ''}`} />
      </button>
    </div>
  )
}

export default ActionToolbar 