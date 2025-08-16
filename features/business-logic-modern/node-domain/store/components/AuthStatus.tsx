/**
 * Authentication Status Component
 * 
 * Simple component to display authentication status for debugging
 */

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export const AuthStatus: React.FC = () => {
  const authStatus = useQuery(api.googleSheets.checkGoogleSheetsAuth);
  const emailAccounts = useQuery(api.emailAccounts.getUserEmailAccounts);

  if (authStatus === undefined) {
    return (
      <div className="p-2 bg-yellow-100 border border-yellow-300 rounded text-sm">
        <div className="font-medium text-yellow-800">Checking authentication...</div>
      </div>
    );
  }

  return (
    <div className="p-2 bg-gray-100 border border-gray-300 rounded text-sm space-y-1">
      <div className="font-medium text-gray-800">Authentication Status</div>
      <div className="text-xs space-y-1">
        <div>
          <span className="font-medium">Authenticated:</span>{' '}
          <span className={authStatus.isAuthenticated ? 'text-green-600' : 'text-red-600'}>
            {authStatus.isAuthenticated ? 'Yes' : 'No'}
          </span>
        </div>
        <div>
          <span className="font-medium">Gmail Account:</span>{' '}
          <span className={authStatus.hasGmailAccount ? 'text-green-600' : 'text-red-600'}>
            {authStatus.hasGmailAccount ? `Yes (${authStatus.accountCount})` : 'No'}
          </span>
        </div>
        <div>
          <span className="font-medium">Email Accounts Query:</span>{' '}
          <span className={emailAccounts ? 'text-green-600' : 'text-red-600'}>
            {emailAccounts ? `${emailAccounts.length} accounts` : 'Loading/Error'}
          </span>
        </div>
        {authStatus.error && (
          <div>
            <span className="font-medium text-red-600">Error:</span>{' '}
            <span className="text-red-600">{authStatus.error}</span>
          </div>
        )}
      </div>
    </div>
  );
};