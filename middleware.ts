// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { loadAnubisConfig, getRouteProtectionManager } from '@/lib/anubis/config';
import { AnubisJWT, AnubisCrypto } from '@/lib/anubis/crypto';
import { RiskEngine, RiskMonitor } from '@/lib/anubis/risk-engine';

// ROUTES THAT REQUIRE ANUBIS PROTECTION
const PROTECTED_ROUTES = [
  '/admin',
  '/dashboard',
  '/api/protected',
  // Add more routes as needed
];

// ROUTES THAT SHOULD BE EXCLUDED FROM PROTECTION
const EXCLUDED_ROUTES = [
  '/api/anubis',
  '/_next',
  '/favicon.ico',
  '/manifest.json',
  '/logo-mark.png'
];

// ADAPTIVE ANUBIS MIDDLEWARE
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log('Incoming request to:', pathname);
  
  // SKIP EXCLUDED ROUTES
  if (EXCLUDED_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // CHECK IF ROUTE NEEDS PROTECTION
  const needsProtection = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  
  if (!needsProtection) {
    return NextResponse.next();
  }

  // EXTRACT REQUEST METADATA FOR RISK ANALYSIS
  const requestMetadata = {
    ip: getClientIP(request),
    userAgent: request.headers.get('user-agent') || '',
    headers: Object.fromEntries(request.headers.entries()),
    sessionHistory: await getSessionHistory(request),
    timestamp: Date.now()
  };

  // PERFORM RISK ANALYSIS
  const { riskLevel, config, factors } = await RiskEngine.analyzeRequest(requestMetadata);
  
  // TRACK RISK FOR MONITORING
  RiskMonitor.trackRisk(requestMetadata.ip, riskLevel);
  
  console.log(`Risk Assessment: ${riskLevel.name} (Level ${riskLevel.level}) - Score: ${riskLevel.score}`);
  
  // GET VERIFICATION STATUS
  const authCookie = request.cookies.get('anubis-auth');
  const sessionCookie = request.cookies.get('anubis-session');
  const failuresCookie = request.cookies.get('anubis-failures');
  
  const failures = failuresCookie ? parseInt(failuresCookie.value) : 0;
  const now = Date.now();
  
  // BLOCK IF TOO MANY FAILURES (ADAPTIVE THRESHOLD)
  if (failures >= config.maxFailures) {
    return redirectToChallenge(request, config.challengeDifficulty);
  }
  
  // CHECK EXISTING VERIFICATION
  if (authCookie?.value) {
    try {
      const authData = JSON.parse(authCookie.value);
      const sessionAge = now - authData.timestamp;
      
      // VALID VERIFICATION - ALLOW ACCESS
      if (sessionAge < config.sessionTimeout) {
        const response = NextResponse.next();
        // ADD RISK LEVEL HEADERS FOR DEBUGGING
        response.headers.set('X-Anubis-Risk-Level', riskLevel.name);
        response.headers.set('X-Anubis-Risk-Score', riskLevel.score.toString());
        return response;
      }
    } catch (error) {
      // Invalid auth cookie - continue with adaptive flow
    }
  }
  
  // ADAPTIVE VERIFICATION FLOW
  if (config.optimisticEnabled) {
    // CHECK IF BACKGROUND VERIFICATION IS IN PROGRESS
    if (sessionCookie?.value) {
      try {
        const sessionData = JSON.parse(sessionCookie.value);
        const sessionAge = now - sessionData.startTime;
        
        // STILL WITHIN GRACE PERIOD - ALLOW ACCESS
        if (sessionAge < config.gracePeriod) {
          const response = NextResponse.next();
          
          // ADD ADAPTIVE VERIFICATION HEADERS
          response.headers.set('X-Anubis-Optimistic', 'true');
          response.headers.set('X-Anubis-Session', sessionData.sessionId);
          response.headers.set('X-Anubis-Remaining', String(config.gracePeriod - sessionAge));
          response.headers.set('X-Anubis-Risk-Level', riskLevel.name);
          response.headers.set('X-Anubis-Risk-Score', riskLevel.score.toString());
          response.headers.set('X-Anubis-Difficulty', config.challengeDifficulty.toString());
          
          return response;
        } else {
          // GRACE PERIOD EXPIRED - CHECK VERIFICATION STATUS
          if (!sessionData.verified) {
            // VERIFICATION FAILED - INCREMENT FAILURES AND BLOCK
            const response = redirectToChallenge(request, config.challengeDifficulty);
            response.cookies.set('anubis-failures', String(failures + 1), {
              maxAge: 3600, // 1 hour
              httpOnly: true,
              secure: true,
              sameSite: 'strict'
            });
            return response;
          }
        }
      } catch (error) {
        // Invalid session cookie - start new adaptive flow
      }
    }
    
    // START NEW ADAPTIVE OPTIMISTIC SESSION
    const sessionId = generateSessionId();
    const sessionData = {
      sessionId,
      startTime: now,
      verified: false,
      challenge: generateChallenge(config.challengeDifficulty),
      riskLevel: riskLevel.level,
      riskFactors: factors
    };
    
    const response = NextResponse.next();
    
    // SET ADAPTIVE SESSION COOKIE
    response.cookies.set('anubis-session', JSON.stringify(sessionData), {
      maxAge: config.gracePeriod / 1000,
      httpOnly: true,
      secure: true,
      sameSite: 'strict'
    });
    
    // ADD HEADERS FOR ADAPTIVE BACKGROUND VERIFICATION
    response.headers.set('X-Anubis-Optimistic', 'true');
    response.headers.set('X-Anubis-Session', sessionId);
    response.headers.set('X-Anubis-Challenge', JSON.stringify(sessionData.challenge));
    response.headers.set('X-Anubis-Remaining', String(config.gracePeriod));
    response.headers.set('X-Anubis-Risk-Level', riskLevel.name);
    response.headers.set('X-Anubis-Risk-Score', riskLevel.score.toString());
    response.headers.set('X-Anubis-Difficulty', config.challengeDifficulty.toString());
    response.headers.set('X-Anubis-Requires-Interaction', config.requiresInteraction.toString());
    
    return response;
  }
  
  // BLOCKING MODE OR HIGH RISK - IMMEDIATE CHALLENGE
  return redirectToChallenge(request, config.challengeDifficulty);
}

// HELPER FUNCTIONS
function redirectToChallenge(request: NextRequest, difficulty: number = 4) {
  const challengeUrl = new URL('/api/anubis/challenge', request.url);
  challengeUrl.searchParams.set('returnTo', request.url);
  challengeUrl.searchParams.set('difficulty', difficulty.toString());
  return NextResponse.redirect(challengeUrl);
}

function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function generateChallenge(difficulty: number = 4) {
  const challenge = Math.random().toString(36).substring(2);
  return {
    challenge,
    difficulty,
    timestamp: Date.now()
  };
}

// GET SESSION HISTORY FOR RISK ANALYSIS
async function getSessionHistory(request: NextRequest): Promise<any> {
  const failuresCookie = request.cookies.get('anubis-failures');
  const sessionCookie = request.cookies.get('anubis-session');
  
  let history = {
    failures: failuresCookie ? parseInt(failuresCookie.value) : 0,
    challenges: 0,
    lastActivity: Date.now()
  };
  
  if (sessionCookie?.value) {
    try {
      const sessionData = JSON.parse(sessionCookie.value);
      history.challenges = sessionData.challengeCount || 0;
      history.lastActivity = sessionData.startTime || Date.now();
    } catch (error) {
      // Invalid session data
    }
  }
  
  return history;
}

// EXTRACT CLIENT IP ADDRESS
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  return '127.0.0.1'; // FALLBACK IP
}

// CHECK IF USER AGENT IS ALLOWED (SEARCH BOTS)
function isAllowedUserAgent(userAgent: string | undefined, allowedAgents: string[]): boolean {
  if (!userAgent) return false;
  
  return allowedAgents.some(allowed => 
    userAgent.toLowerCase().includes(allowed.toLowerCase())
  );
}

// Middleware config
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/anubis (Anubis API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/anubis|_next/static|_next/image|favicon.ico).*)',
  ],
};
