/**
 * ACTION TOOLBAR - Main toolbar for workflow editor actions
 *
 * • Provides undo/redo buttons with keyboard shortcut support
 * • History panel toggle for viewing action timeline
 * • Fullscreen mode toggle (browser environments only)
 * • Theme switcher for light/dark/system mode selection
 * • Environment detection for desktop vs browser features
 * • Now uses centralized component theming system
 *
 * Keywords: toolbar, undo-redo, history, fullscreen, shortcuts, theming, theme-switcher
 */

"use client";

import {
  History,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useUndoRedo } from "./UndoRedoContext";
import { useComponentClasses, useComponentButtonClasses } from "../theming/components";
import { ThemeSwitcher } from "@/components/theme-switcher";

interface ActionToolbarProps {
  showHistoryPanel: boolean;
  onToggleHistory: () => void;
  className?: string;
}

const ActionToolbar: React.FC<ActionToolbarProps> = ({
  showHistoryPanel,
  onToggleHistory,
  className = "",
}) => {
  const { undo, redo, getHistory } = useUndoRedo();
  const { canUndo, canRedo } = getHistory();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBrowserEnvironment, setIsBrowserEnvironment] = useState(false);

  // Get themed classes
  const containerClasses = useComponentClasses('actionToolbar', 'default', `flex items-center gap-1 p-1 ${className}`);
  const buttonClasses = useComponentButtonClasses('actionToolbar', 'ghost', 'sm');
  const activeButtonClasses = useComponentButtonClasses('actionToolbar', 'primary', 'sm');

  // Detect if running in browser vs desktop/Electron app
  useEffect(() => {
    const detectBrowserEnvironment = () => {
      // Check if we're in a browser environment (not Electron/desktop app)
      const isElectron =
        (typeof window !== "undefined" &&
          (window as any).electronAPI !== undefined) ||
        typeof (window as any).require !== "undefined" ||
        (typeof process !== "undefined" && process.versions?.electron);

      const isTauri =
        typeof window !== "undefined" &&
        (window as any).__TAURI__ !== undefined;

      const isDesktopApp = isElectron || isTauri;

      // Only show fullscreen in browsers (not desktop apps)
      setIsBrowserEnvironment(!isDesktopApp);
    };

    detectBrowserEnvironment();
  }, []);

  // Check fullscreen state on mount and listen for changes (only in browser)
  useEffect(() => {
    if (!isBrowserEnvironment) return;

    const checkFullscreen = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    checkFullscreen();
    document.addEventListener("fullscreenchange", checkFullscreen);
    return () =>
      document.removeEventListener("fullscreenchange", checkFullscreen);
  }, [isBrowserEnvironment]);

  // Keyboard shortcut for fullscreen (F11) - only in browser
  useEffect(() => {
    if (!isBrowserEnvironment) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F11") {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isBrowserEnvironment]);

  const toggleFullscreen = async () => {
    if (!isBrowserEnvironment) return;

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  };

  return (
    <div className={containerClasses}>
      <button
        onClick={() => undo()}
        disabled={!canUndo}
        className={buttonClasses}
        title="Undo (Ctrl+Z)"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      <button
        onClick={() => redo()}
        disabled={!canRedo}
        className={buttonClasses}
        title="Redo (Ctrl+Y)"
      >
        <RotateCw className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />

      <button
        onClick={onToggleHistory}
        className={showHistoryPanel ? activeButtonClasses : buttonClasses}
        title="Toggle History Panel (Ctrl+H)"
      >
        <History className="w-4 h-4" />
      </button>

      {/* FULLSCREEN BUTTON - Only show in browser environments */}
      {isBrowserEnvironment && (
        <>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />

  {/* THEME SWITCHER */}
  {/* <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" /> */}
      
      <div className="flex items-center">
        <ThemeSwitcher />
      </div>

          <button
            onClick={toggleFullscreen}
            className={isFullscreen ? activeButtonClasses : buttonClasses}
            title={
              isFullscreen ? "Exit Fullscreen (F11)" : "Enter Fullscreen (F11)"
            }
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </button>
        </>
      )}

    
    </div>
  );
};

export default ActionToolbar;
