'use client';

import React, { useState, useEffect } from 'react';
import { useAnubis } from './AnubisProvider';

// ANUBIS DEBUG COMPONENT
export function AnubisDebugger() {
  const { isEnabled, isProtected, currentRoute } = useAnubis();
  const [isVisible, setIsVisible] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'enabled' | 'disabled'>('checking');

  // CHECK SERVER-SIDE STATUS
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch('/api/anubis/status');
        if (response.ok) {
          const data = await response.json();
          setServerStatus(data.enabled ? 'enabled' : 'disabled');
        } else {
          setServerStatus('disabled');
        }
      } catch (error) {
        setServerStatus('disabled');
      }
    };

    checkServerStatus();
  }, []);

  // TOGGLE VISIBILITY
  const toggleVisibility = () => setIsVisible(!isVisible);

  // TRIGGER TEST CHALLENGE
  const triggerTestChallenge = () => {
    // Clear auth cookie to force challenge
    document.cookie = "anubis-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.reload();
  };

  if (!isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        className="fixed top-4 right-4 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg z-50"
        title="Show Anubis Debug Info"
      >
        🐺 Debug
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 bg-black text-white p-4 rounded-lg shadow-xl z-50 max-w-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg">🐺 Anubis Debug</h3>
        <button
          onClick={toggleVisibility}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-sm">
        {/* CLIENT STATUS */}
        <div className="border-b border-gray-600 pb-2">
          <h4 className="font-semibold text-blue-400">Client Status</h4>
          <div className="flex justify-between">
            <span>Enabled:</span>
            <span className={isEnabled ? 'text-green-400' : 'text-red-400'}>
              {isEnabled ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Protected:</span>
            <span className={isProtected ? 'text-green-400' : 'text-yellow-400'}>
              {isProtected ? '🛡️ Yes' : '🔓 No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Route:</span>
            <span className="text-gray-300 font-mono text-xs">{currentRoute}</span>
          </div>
        </div>

        {/* SERVER STATUS */}
        <div className="border-b border-gray-600 pb-2">
          <h4 className="font-semibold text-blue-400">Server Status</h4>
          <div className="flex justify-between">
            <span>Server:</span>
            <span className={
              serverStatus === 'enabled' ? 'text-green-400' : 
              serverStatus === 'disabled' ? 'text-red-400' : 'text-yellow-400'
            }>
              {serverStatus === 'enabled' ? '✅ Enabled' : 
               serverStatus === 'disabled' ? '❌ Disabled' : '⏳ Checking...'}
            </span>
          </div>
        </div>

        {/* ENVIRONMENT INFO */}
        <div className="border-b border-gray-600 pb-2">
          <h4 className="font-semibold text-blue-400">Environment</h4>
          <div className="flex justify-between">
            <span>Mode:</span>
            <span className="text-gray-300">{process.env.NODE_ENV || 'development'}</span>
          </div>
          <div className="flex justify-between">
            <span>Cookies:</span>
            <span className="text-gray-300">
              {document.cookie.includes('anubis-auth') ? '🍪 Has Auth' : '🚫 No Auth'}
            </span>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="pt-2">
          <h4 className="font-semibold text-blue-400 mb-2">Actions</h4>
          <div className="space-y-2">
            <button
              onClick={triggerTestChallenge}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-xs"
            >
              🧪 Test Challenge
            </button>
            <button
              onClick={() => window.open('/api/anubis/challenge', '_blank')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
            >
              👀 View Challenge Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 