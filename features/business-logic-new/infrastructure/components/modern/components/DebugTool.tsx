'use client'

import React from 'react'

/* -------------------------------------------------------------------------- */
/*  TYPES                                                                     */
/* -------------------------------------------------------------------------- */
interface DebugToolProps {
  className?: string
}

/* -------------------------------------------------------------------------- */
/*  COMPONENT                                                                 */
/* -------------------------------------------------------------------------- */
const DebugTool: React.FC<DebugToolProps> = ({ className = '' }) => {
  // HANDLERS
  const handleClearLocalStorage = () => {
    if (window.confirm('Are you sure you want to clear all local storage data?')) {
      localStorage.clear()
      window.location.reload()
    }
  }

  // RENDER
  return (
    <div className={`fixed top-4 left-[50%] -translate-x-1/2 z-50 ${className}`}>
      <button
        onClick={handleClearLocalStorage}
        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md shadow-lg transition-colors"
        title="Clear all local storage data"
      >
        Clear Local Storage
      </button>
    </div>
  )
}

export default DebugTool
