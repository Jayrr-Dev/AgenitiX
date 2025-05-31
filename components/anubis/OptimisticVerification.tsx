'use client';

import React, { useEffect, useState, useRef } from 'react';

// ADAPTIVE OPTIMISTIC VERIFICATION COMPONENT
export function OptimisticVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<any>(null);
  const [riskLevel, setRiskLevel] = useState<string>('MODERATE');
  const [riskScore, setRiskScore] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<number>(4);
  const [requiresInteraction, setRequiresInteraction] = useState<boolean>(false);
  const [isOptimisticMode, setIsOptimisticMode] = useState<boolean>(true);
  const verificationRef = useRef<boolean>(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // CHECK FOR ADAPTIVE VERIFICATION HEADERS
  useEffect(() => {
    const checkAdaptiveHeaders = () => {
      // Check if we're in an adaptive verification session
      const isOptimistic = document.querySelector('meta[name="x-anubis-optimistic"]')?.getAttribute('content') === 'true';
      const sessionHeader = document.querySelector('meta[name="x-anubis-session"]')?.getAttribute('content');
      const challengeHeader = document.querySelector('meta[name="x-anubis-challenge"]')?.getAttribute('content');
      const remainingHeader = document.querySelector('meta[name="x-anubis-remaining"]')?.getAttribute('content');
      const riskLevelHeader = document.querySelector('meta[name="x-anubis-risk-level"]')?.getAttribute('content');
      const riskScoreHeader = document.querySelector('meta[name="x-anubis-risk-score"]')?.getAttribute('content');
      const difficultyHeader = document.querySelector('meta[name="x-anubis-difficulty"]')?.getAttribute('content');
      const interactionHeader = document.querySelector('meta[name="x-anubis-requires-interaction"]')?.getAttribute('content');

      if (isOptimistic && sessionHeader && challengeHeader && remainingHeader) {
        setIsVerifying(true);
        setSessionId(sessionHeader);
        setChallenge(JSON.parse(challengeHeader));
        setTimeRemaining(parseInt(remainingHeader));
        setRiskLevel(riskLevelHeader || 'MODERATE');
        setRiskScore(parseInt(riskScoreHeader || '0'));
        setDifficulty(parseInt(difficultyHeader || '4'));
        setRequiresInteraction(interactionHeader === 'true');
        setIsOptimisticMode(true);
        
        // Start adaptive background verification
        startAdaptiveVerification(sessionHeader, JSON.parse(challengeHeader));
      } else if (riskLevelHeader && ['ELEVATED', 'HIGH', 'DANGEROUS'].includes(riskLevelHeader)) {
        // Show non-optimistic status for Level 3+
        setRiskLevel(riskLevelHeader);
        setRiskScore(parseInt(riskScoreHeader || '0'));
        setDifficulty(parseInt(difficultyHeader || '4'));
        setRequiresInteraction(interactionHeader === 'true');
        setIsOptimisticMode(false);
        setIsVerifying(true); // Show status but no background verification
      }
    };

    // Check on mount
    checkAdaptiveHeaders();

    // Also check for headers in HTTP responses
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      const riskLevelData = response.headers.get('X-Anubis-Risk-Level');
      const riskScoreData = response.headers.get('X-Anubis-Risk-Score');
      const difficultyData = response.headers.get('X-Anubis-Difficulty');
      const interactionData = response.headers.get('X-Anubis-Requires-Interaction');
      
      if (response.headers.get('X-Anubis-Optimistic') === 'true') {
        const session = response.headers.get('X-Anubis-Session');
        const challengeData = response.headers.get('X-Anubis-Challenge');
        const remaining = response.headers.get('X-Anubis-Remaining');
        
        if (session && challengeData && remaining && !verificationRef.current) {
          setIsVerifying(true);
          setSessionId(session);
          setChallenge(JSON.parse(challengeData));
          setTimeRemaining(parseInt(remaining));
          setRiskLevel(riskLevelData || 'MODERATE');
          setRiskScore(parseInt(riskScoreData || '0'));
          setDifficulty(parseInt(difficultyData || '4'));
          setRequiresInteraction(interactionData === 'true');
          setIsOptimisticMode(true);
          
          startAdaptiveVerification(session, JSON.parse(challengeData));
        }
      } else if (riskLevelData && ['ELEVATED', 'HIGH', 'DANGEROUS'].includes(riskLevelData)) {
        // Show non-optimistic status for Level 3+
        setRiskLevel(riskLevelData);
        setRiskScore(parseInt(riskScoreData || '0'));
        setDifficulty(parseInt(difficultyData || '4'));
        setRequiresInteraction(interactionData === 'true');
        setIsOptimisticMode(false);
        setIsVerifying(true);
      }
      
      return response;
    };

    return () => {
      window.fetch = originalFetch;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // START ADAPTIVE BACKGROUND VERIFICATION
  const startAdaptiveVerification = async (sessionId: string, challengeData: any) => {
    if (verificationRef.current) return; // Already verifying
    
    verificationRef.current = true;
    
    try {
      // Start countdown timer
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1000) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);

      // Solve challenge with adaptive difficulty
      const solution = await solveAdaptiveChallenge(challengeData);
      
      if (solution) {
        // Submit verification
        const response = await fetch('/api/anubis/optimistic-verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            solution,
            challenge: challengeData
          })
        });

        if (response.ok) {
          // Verification successful
          setIsVerifying(false);
          verificationRef.current = false;
          
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        } else {
          // Verification failed - user will be redirected on next request
          console.warn('Adaptive verification failed');
        }
      }
    } catch (error) {
      console.error('Adaptive verification error:', error);
      verificationRef.current = false;
    }
  };

  // SOLVE CHALLENGE WITH ADAPTIVE DIFFICULTY
  const solveAdaptiveChallenge = async (challengeData: any): Promise<any> => {
    const { challenge, difficulty } = challengeData;
    const target = '0'.repeat(difficulty);
    let nonce = 0;
    
    // Adaptive batch size based on difficulty
    const batchSize = Math.max(50, 1000 - (difficulty * 50));
    
    return new Promise((resolve) => {
      const solve = async () => {
        for (let i = 0; i < batchSize; i++) {
          const input = challenge + nonce;
          const hash = await sha256(input);
          
          if (hash.startsWith(target)) {
            resolve({
              nonce,
              hash,
              challenge,
              difficulty
            });
            return;
          }
          
          nonce++;
        }
        
        // Continue in next tick to avoid blocking UI (adaptive delay)
        const delay = difficulty > 8 ? 20 : difficulty > 4 ? 10 : 1;
        setTimeout(solve, delay);
      };
      
      solve();
    });
  };

  // SHA256 HASH FUNCTION
  const sha256 = async (message: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // GET RISK LEVEL COLOR
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'text-green-500';
      case 'MODERATE': return 'text-blue-500';
      case 'ELEVATED': return 'text-yellow-500';
      case 'HIGH': return 'text-red-500';
      case 'DANGEROUS': return 'text-red-700';
      default: return 'text-blue-500';
    }
  };

  // GET DIFFICULTY DESCRIPTION
  const getDifficultyDescription = (diff: number) => {
    if (diff <= 2) return 'Very Easy';
    if (diff <= 3) return 'Easy';
    if (diff <= 4) return 'Medium';
    if (diff <= 6) return 'Hard';
    if (diff <= 8) return 'Maximum';
    return 'Extreme';
  };

  // GET ESTIMATED TIME
  const getEstimatedTime = (diff: number) => {
    if (diff <= 2) return '~0.1s';
    if (diff <= 3) return '~0.5s';
    if (diff <= 4) return '~1-2s';
    if (diff <= 6) return '~5-15s';
    if (diff <= 8) return '~30-120s';
    return '~5+ min';
  };

  // RENDER ADAPTIVE VERIFICATION STATUS
  if (!isVerifying) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg text-xs z-50 max-w-sm">
      {/* HEADER */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${isOptimisticMode ? 'animate-pulse bg-blue-500' : 'bg-red-500'}`}></div>
        <span className="font-medium text-foreground">
          {isOptimisticMode ? 'Adaptive Verification' : 'Security Challenge'}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full bg-opacity-20 ${getRiskColor(riskLevel)}`}>
          {riskLevel}
        </span>
      </div>
      
      {/* PROGRESS BAR (ONLY FOR OPTIMISTIC MODE) */}
      {isOptimisticMode && (
        <div className="w-full bg-muted rounded-full h-2 mb-3">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
            style={{ 
              width: `${Math.max(0, (timeRemaining / (difficulty <= 4 ? 30000 : 15000)) * 100)}%` 
            }}
          ></div>
        </div>
      )}
      
      {/* STATUS INFO */}
      <div className="space-y-2 text-xs">
        {isOptimisticMode && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time Remaining:</span>
            <span className="text-foreground font-medium">{Math.ceil(timeRemaining / 1000)}s</span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">Risk Score:</span>
          <span className={`font-medium ${getRiskColor(riskLevel)}`}>{riskScore}/100</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">Difficulty:</span>
          <span className="text-foreground font-medium">
            {getDifficultyDescription(difficulty)} ({difficulty}) - {getEstimatedTime(difficulty)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">Mode:</span>
          <span className={`font-medium ${isOptimisticMode ? 'text-blue-500' : 'text-red-500'}`}>
            {isOptimisticMode ? 'Optimistic' : 'Immediate'}
          </span>
        </div>
        
        {requiresInteraction && (
          <div className="flex items-center gap-1 text-yellow-500">
            <span>⚠️</span>
            <span>Enhanced security active</span>
          </div>
        )}
      </div>
      
      {/* ADAPTIVE MESSAGING */}
      <div className="mt-3 pt-2 border-t border-border">
        <p className="text-muted-foreground text-xs">
          {riskLevel === 'LOW' && 'Trusted user - minimal verification'}
          {riskLevel === 'MODERATE' && 'Standard verification in progress'}
          {riskLevel === 'ELEVATED' && '⚠️ Immediate verification required'}
          {riskLevel === 'HIGH' && '🚨 High-security challenge active'}
          {riskLevel === 'DANGEROUS' && '🔒 Maximum security protocols engaged'}
        </p>
      </div>
    </div>
  );
}

// ADAPTIVE VERIFICATION PROVIDER
export function OptimisticVerificationProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <OptimisticVerification />
    </>
  );
} 