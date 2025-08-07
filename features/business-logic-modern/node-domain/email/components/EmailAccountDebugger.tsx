/**
 * Route: features/business-logic-modern/node-domain/email/components/EmailAccountDebugger.tsx
 * EMAIL ACCOUNT DEBUGGER - Visual debugging interface for email authentication flow
 *
 * • Real-time OAuth flow state tracking and visualization
 * • Token exchange process monitoring with detailed steps
 * • Convex storage state display with error detection
 * • Collapsible interface with step-by-step breakdown
 * • Error highlighting and recovery suggestions
 *
 * Keywords: email-debugger, oauth-flow, token-exchange, state-tracking, visual-debugging
 */

import { memo, useState, useCallback, useEffect } from "react";
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Clock, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Debug state types
interface OAuthFlowState {
  step: 'idle' | 'initiating' | 'redirecting' | 'callback' | 'token_exchange' | 'user_info' | 'storage' | 'complete' | 'error';
  timestamp: number;
  data?: any;
  error?: string;
}

interface TokenExchangeState {
  hasAuthCode: boolean;
  codeLength?: number;
  hasState?: boolean;
  exchangeStarted?: number;
  exchangeCompleted?: number;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
}

interface UserInfoState {
  fetchStarted?: number;
  fetchCompleted?: number;
  email?: string;
  displayName?: string;
  provider?: string;
  error?: string;
}

interface ConvexStorageState {
  mutationStarted?: number;
  mutationCompleted?: number;
  accountId?: string;
  encryptedCredentials?: boolean;
  userId?: string;
  error?: string;
}

interface DebuggerState {
  isExpanded: boolean;
  oauthFlow: OAuthFlowState;
  tokenExchange: TokenExchangeState;
  userInfo: UserInfoState;
  convexStorage: ConvexStorageState;
  showSensitiveData: boolean;
}

// Styling constants
const DEBUGGER_STYLES = {
  container: "border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 shadow-xl backdrop-blur-sm",
  header: "flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-200 dark:border-gray-700",
  content: "p-4 pt-3 space-y-3 max-h-96 overflow-y-auto nowheel",
  step: "flex items-start gap-2 p-2 rounded-md border text-[10px]",
  stepSuccess: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
  stepError: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950", 
  stepPending: "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950",
  stepIdle: "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800",
  dataContainer: "mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-mono overflow-hidden",
  hiddenData: "blur-sm select-none",
} as const;

interface EmailAccountDebuggerProps {
  nodeData: any;
  isEnabled: boolean;
  className?: string;
}

export const EmailAccountDebugger = memo(({
  nodeData,
  isEnabled,
  className = ""
}: EmailAccountDebuggerProps) => {
  // Component state
  const [debugState, setDebugState] = useState<DebuggerState>({
    isExpanded: false,
    oauthFlow: { step: 'idle', timestamp: Date.now() },
    tokenExchange: { hasAuthCode: false },
    userInfo: {},
    convexStorage: {},
    showSensitiveData: false,
  });

  // Listen for OAuth messages and custom debug events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_SUCCESS') {
        try {
          const authData = JSON.parse(atob(event.data.authData));
          setDebugState(prev => ({
            ...prev,
            oauthFlow: { step: 'complete', timestamp: Date.now() },
            tokenExchange: {
              ...prev.tokenExchange,
              accessToken: authData.accessToken,
              refreshToken: authData.refreshToken,
              exchangeCompleted: Date.now()
            },
            userInfo: {
              ...prev.userInfo,
              email: authData.email,
              displayName: authData.displayName,
              provider: authData.provider,
              fetchCompleted: Date.now()
            }
          }));
        } catch (error) {
          console.error('Failed to parse OAuth success data:', error);
        }
      } else if (event.data?.type === 'OAUTH_ERROR') {
        setDebugState(prev => ({
          ...prev,
          oauthFlow: { step: 'error', timestamp: Date.now(), error: event.data.error }
        }));
      }
    };

    const handleCustomDebugEvent = (event: CustomEvent) => {
      const { detail } = event;
      if (detail.type === 'OAUTH_INITIATED') {
        setDebugState(prev => ({
          ...prev,
          oauthFlow: { step: 'initiating', timestamp: detail.timestamp }
        }));
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('email-debug', handleCustomDebugEvent as EventListener);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('email-debug', handleCustomDebugEvent as EventListener);
    };
  }, []);

  // Update debug state based on nodeData changes
  useEffect(() => {
    if (nodeData.isAuthenticating) {
      setDebugState(prev => ({
        ...prev,
        oauthFlow: { step: 'initiating', timestamp: Date.now() }
      }));
    }

    if (nodeData.connectionStatus === 'connected') {
      setDebugState(prev => ({
        ...prev,
        oauthFlow: { step: 'complete', timestamp: Date.now() },
        convexStorage: {
          ...prev.convexStorage,
          accountId: nodeData.accountId,
          mutationCompleted: Date.now()
        }
      }));
    }

    if (nodeData.lastError) {
      setDebugState(prev => ({
        ...prev,
        oauthFlow: { step: 'error', timestamp: Date.now(), error: nodeData.lastError }
      }));
    }
  }, [nodeData.isAuthenticating, nodeData.connectionStatus, nodeData.lastError, nodeData.accountId]);

  // Toggle expansion
  const toggleExpanded = useCallback(() => {
    setDebugState(prev => ({ ...prev, isExpanded: !prev.isExpanded }));
  }, []);

  // Toggle sensitive data visibility
  const toggleSensitiveData = useCallback(() => {
    setDebugState(prev => ({ ...prev, showSensitiveData: !prev.showSensitiveData }));
  }, []);

  // Get step status icon
  const getStepIcon = (step: string, currentStep: string, hasError: boolean) => {
    if (hasError && step === currentStep) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    if (step === currentStep) {
      return <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />;
    }
    if (getStepIndex(step) < getStepIndex(currentStep)) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
  };

  // Get step index for comparison
  const getStepIndex = (step: string) => {
    const steps = ['idle', 'initiating', 'redirecting', 'callback', 'token_exchange', 'user_info', 'storage', 'complete'];
    return steps.indexOf(step);
  };

  // Get step styling
  const getStepStyling = (step: string, currentStep: string, hasError: boolean) => {
    if (hasError && step === currentStep) return DEBUGGER_STYLES.stepError;
    if (step === currentStep) return DEBUGGER_STYLES.stepPending;
    if (getStepIndex(step) < getStepIndex(currentStep)) return DEBUGGER_STYLES.stepSuccess;
    return DEBUGGER_STYLES.stepIdle;
  };

  // Format sensitive data display
  const formatSensitiveData = (data: any, label: string) => {
    if (!data) return null;
    
    const displayData = debugState.showSensitiveData ? data : '••••••••••••';
    
    return (
      <div className="flex items-center gap-2">
        <span className="text-gray-600 dark:text-gray-400">{label}:</span>
        <span className={`font-mono ${debugState.showSensitiveData ? '' : DEBUGGER_STYLES.hiddenData}`}>
          {typeof data === 'string' ? data.substring(0, 20) + '...' : JSON.stringify(data).substring(0, 30) + '...'}
        </span>
      </div>
    );
  };

  const hasError = debugState.oauthFlow.step === 'error';
  const currentStep = debugState.oauthFlow.step;

  return (
    <div className={`${DEBUGGER_STYLES.container} ${className}`}>
      {/* Header */}
      <div className={DEBUGGER_STYLES.header} onClick={toggleExpanded}>
        <div className="flex items-center gap-2">
          {debugState.isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <span className="font-medium text-[10px]">OAuth Flow Debugger</span>
          {hasError && <AlertTriangle className="w-4 h-4 text-red-500" />}
        </div>
        
        <div className="flex items-center gap-1">
          <Badge 
            variant={hasError ? "destructive" : currentStep === 'complete' ? "default" : "secondary"}
            className="text-[10px] px-2 py-0"
          >
            {currentStep.replace('_', ' ').toUpperCase()}
          </Badge>
          {isEnabled && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleSensitiveData();
              }}
            >
              {debugState.showSensitiveData ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </Button>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {debugState.isExpanded && (
        <div className={DEBUGGER_STYLES.content}>
          {/* OAuth Flow Steps */}
          <div className="space-y-3">
            <h4 className="font-medium text-[10px] text-gray-700 dark:text-gray-300">OAuth Flow Steps</h4>

            {/* Step 1: Initiation */}
            <div className={`${DEBUGGER_STYLES.step} ${getStepStyling('initiating', currentStep, hasError)}`}>
              <div className="flex-shrink-0">
                {getStepIcon('initiating', currentStep, hasError)}
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-medium">1. OAuth Initiation</h5>
                <p className="text-[10px] text-gray-600 dark:text-gray-400">
                  Build authorization URL and redirect to provider
                </p>
                {nodeData.provider && (
                  <div className={DEBUGGER_STYLES.dataContainer}>
                    <div>Provider: {nodeData.provider}</div>
                    <div>Redirect URI: {debugState.showSensitiveData ? 'configured' : '••••••••'}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Callback */}
            <div className={`${DEBUGGER_STYLES.step} ${getStepStyling('callback', currentStep, hasError)}`}>
              <div className="flex-shrink-0">
                {getStepIcon('callback', currentStep, hasError)}
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-medium">2. Provider Callback</h5>
                <p className="text-[10px] text-gray-600 dark:text-gray-400">
                  Receive authorization code from provider
                </p>
                {debugState.tokenExchange.hasAuthCode && (
                  <div className={DEBUGGER_STYLES.dataContainer}>
                    <div>Auth Code: {debugState.showSensitiveData ? 'received' : '••••••••'}</div>
                    {debugState.tokenExchange.codeLength && (
                      <div>Code Length: {debugState.tokenExchange.codeLength}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Token Exchange */}
            <div className={`${DEBUGGER_STYLES.step} ${getStepStyling('token_exchange', currentStep, hasError)}`}>
              <div className="flex-shrink-0">
                {getStepIcon('token_exchange', currentStep, hasError)}
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-medium">3. Token Exchange</h5>
                <p className="text-[10px] text-gray-600 dark:text-gray-400">
                  Exchange authorization code for access/refresh tokens
                </p>
                {(debugState.tokenExchange.accessToken || debugState.tokenExchange.error) && (
                  <div className={DEBUGGER_STYLES.dataContainer}>
                    {debugState.tokenExchange.accessToken && formatSensitiveData(debugState.tokenExchange.accessToken, 'Access Token')}
                    {debugState.tokenExchange.refreshToken && formatSensitiveData(debugState.tokenExchange.refreshToken, 'Refresh Token')}
                    {debugState.tokenExchange.expiresIn && (
                      <div>Expires In: {debugState.tokenExchange.expiresIn}s</div>
                    )}
                    {debugState.tokenExchange.error && (
                      <div className="text-red-600">Error: {debugState.tokenExchange.error}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Step 4: User Info */}
            <div className={`${DEBUGGER_STYLES.step} ${getStepStyling('user_info', currentStep, hasError)}`}>
              <div className="flex-shrink-0">
                {getStepIcon('user_info', currentStep, hasError)}
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-medium">4. User Information</h5>
                <p className="text-[10px] text-gray-600 dark:text-gray-400">
                  Fetch user profile from provider API
                </p>
                {(debugState.userInfo.email || nodeData.email) && (
                  <div className={DEBUGGER_STYLES.dataContainer}>
                    <div>Email: {nodeData.email || debugState.userInfo.email}</div>
                    <div>Display Name: {nodeData.displayName || debugState.userInfo.displayName || 'Not provided'}</div>
                    {debugState.userInfo.error && (
                      <div className="text-red-600">Error: {debugState.userInfo.error}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Step 5: Convex Storage */}
            <div className={`${DEBUGGER_STYLES.step} ${getStepStyling('storage', currentStep, hasError)}`}>
              <div className="flex-shrink-0">
                {getStepIcon('storage', currentStep, hasError)}
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-medium">5. Convex Storage</h5>
                <p className="text-[10px] text-gray-600 dark:text-gray-400">
                  Store encrypted credentials in database via upsertEmailAccount
                </p>
                {(nodeData.accountId || debugState.convexStorage.accountId) && (
                  <div className={DEBUGGER_STYLES.dataContainer}>
                    <div>Account ID: {nodeData.accountId || debugState.convexStorage.accountId}</div>
                    <div>Encrypted: {debugState.convexStorage.encryptedCredentials ? 'Yes' : 'In Progress'}</div>
                    <div>Connection Status: {nodeData.connectionStatus}</div>
                    {debugState.convexStorage.error && (
                      <div className="text-red-600">Error: {debugState.convexStorage.error}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Current State Summary */}
          <div className="space-y-2">
            <h4 className="font-medium text-[10px] text-gray-700 dark:text-gray-300">Current State</h4>
            <div className="grid grid-cols-2 gap-4 text-[10px]">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Provider:</span> {nodeData.provider || 'None'}
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Status:</span> {nodeData.connectionStatus || 'disconnected'}
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Configured:</span> {nodeData.isConfigured ? 'Yes' : 'No'}
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Connected:</span> {nodeData.isConnected ? 'Yes' : 'No'}
              </div>
              {nodeData.lastValidated && (
                <div className="col-span-2">
                  <span className="text-gray-600 dark:text-gray-400">Last Validated:</span> {new Date(nodeData.lastValidated).toLocaleString()}
                </div>
              )}
              {nodeData.lastError && (
                <div className="col-span-2">
                  <span className="text-red-600">Last Error:</span> {nodeData.lastError}
                </div>
              )}
            </div>
          </div>

          {/* Debug Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDebugState(prev => ({
                ...prev,
                oauthFlow: { step: 'idle', timestamp: Date.now() },
                tokenExchange: { hasAuthCode: false },
                userInfo: {},
                convexStorage: {}
              }))}
            >
              Reset Debug State
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => console.log('Email Account Debug State:', { nodeData, debugState })}
            >
              Log to Console
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

EmailAccountDebugger.displayName = "EmailAccountDebugger";
