'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, Loader2 } from 'lucide-react';

// Extend ServiceWorkerRegistration to include sync
interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync: {
    register(tag: string): Promise<void>;
  };
}

export default function PWAStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      
      // Hide status after 3 seconds
      setTimeout(() => setShowStatus(false), 3000);
      
      // Trigger sync when coming back online
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration) => {
          const syncRegistration = registration as ServiceWorkerRegistrationWithSync;
          return syncRegistration.sync.register('save-flow-data');
        }).catch((error) => {
          console.error('Background sync registration failed:', error);
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_START') {
          setIsSyncing(true);
        } else if (event.data.type === 'SYNC_COMPLETE') {
          setIsSyncing(false);
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't show status if online and not syncing
  if (isOnline && !isSyncing && !showStatus) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`
        flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300
        ${isOnline 
          ? 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
          : 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
        }
      `}>
        {isSyncing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Syncing...</span>
          </>
        ) : isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            <span>Online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>Offline</span>
          </>
        )}
      </div>
    </div>
  );
} 