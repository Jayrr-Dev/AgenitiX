/**
 * Authentication Prompt Component
 * 
 * Prompts users to sign in when authentication is required
 */

import React from 'react';
import { Mail, LogIn } from 'lucide-react';

interface AuthPromptProps {
  onSignIn?: () => void;
  message?: string;
}

export const AuthPrompt: React.FC<AuthPromptProps> = ({ 
  onSignIn, 
  message = "Please sign in to use Google Sheets integration" 
}) => {
  const handleSignIn = () => {
    if (onSignIn) {
      onSignIn();
    } else {
      // Default sign-in behavior - redirect to sign-in page
      window.location.href = '/sign-in';
    }
  };

  return (
    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
      <div className="flex items-center justify-center mb-2">
        <LogIn className="w-5 h-5 text-blue-600 mr-2" />
        <span className="text-sm font-medium text-blue-800">Authentication Required</span>
      </div>
      
      <p className="text-xs text-blue-700 mb-3">
        {message}
      </p>
      
      <button
        onClick={handleSignIn}
        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
      >
        <LogIn className="w-3 h-3 mr-1" />
        Sign In to AgenitiX
      </button>
    </div>
  );
};