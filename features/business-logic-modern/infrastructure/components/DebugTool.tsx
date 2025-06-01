/**
 * DEBUG TOOL - Development utility for clearing application state
 *
 * • Fixed position button for clearing localStorage data
 * • Confirmation dialog to prevent accidental data loss
 * • Page reload after clearing to reset application state
 * • Development-focused utility for testing and debugging
 * • Simple one-click solution for state reset during development
 *
 * Keywords: debug, localStorage, clear-data, development, reset, utility
 */

"use client";

import React from "react";

/* -------------------------------------------------------------------------- */
/*  TYPES                                                                     */
/* -------------------------------------------------------------------------- */
interface DebugToolProps {
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*  COMPONENT                                                                 */
/* -------------------------------------------------------------------------- */
const DebugTool: React.FC<DebugToolProps> = ({ className = "" }) => {
  // HANDLERS
  const handleClearLocalStorage = () => {
    if (
      window.confirm("Are you sure you want to clear all local storage data?")
    ) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // RENDER
  return (
    <div
      className={`fixed top-4 left-[50%] -translate-x-1/2 z-50 ${className}`}
    >
      <button
        onClick={handleClearLocalStorage}
        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md shadow-lg transition-colors"
        title="Clear all local storage data"
      >
        Clear Local Storage
      </button>
    </div>
  );
};

export default DebugTool;
