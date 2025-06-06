// API ENDPOINTS FOR ANUBIS BROWSER CLIENT
// These endpoints handle challenge generation and verification for the client-side protection

import { Request, Response } from 'express';
import Anubis from '@agenitix/anubis';

// Initialize Anubis instance
const anubis = new Anubis({
  enabled: true,
  difficulty: 4,
  jwtSecret: process.env.ANUBIS_JWT_SECRET || 'your-secret-key',
  // Add your routes and configuration
});

// CHALLENGE GENERATION ENDPOINT
// POST /api/anubis/challenge
export async function generateChallenge(req: Request, res: Response) {
  try {
    const { fingerprint, difficulty, timestamp } = req.body;
    
    if (!fingerprint) {
      return res.status(400).json({ error: 'Fingerprint is required' });
    }

    console.log('🎯 Generating challenge for fingerprint:', fingerprint);

    // Extract request metadata
    const requestMetadata = {
      ip: getClientIP(req),
      userAgent: req.get('User-Agent') || '',
      acceptLanguage: req.get('Accept-Language') || 'en-US'
    };

    // Perform risk assessment
    const { riskLevel, config } = await anubis.analyzeRequest({
      ip: requestMetadata.ip,
      userAgent: requestMetadata.userAgent,
      headers: req.headers as Record<string, string>,
      timestamp: timestamp || Date.now()
    });

    console.log(`📊 Risk assessment: ${riskLevel.name} (Level ${riskLevel.level})`);

    // Check rate limiting
    const rateLimitResult = anubis.checkRateLimit(requestMetadata, riskLevel.name);
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      });
    }

    // Create challenge with appropriate difficulty
    const challengeDifficulty = difficulty || config.challengeDifficulty;
    const challenge = anubis.createChallenge(requestMetadata, challengeDifficulty);

    // Store challenge temporarily (in production, use Redis or database)
    // This is needed to verify the solution later
    storeChallenge(challenge.challenge, {
      fingerprint,
      riskLevel: riskLevel.name,
      timestamp: challenge.timestamp,
      difficulty: challengeDifficulty,
      ip: requestMetadata.ip,
      userAgent: requestMetadata.userAgent
    });

    console.log(`✅ Challenge generated with difficulty ${challengeDifficulty}`);

    res.json({
      challenge: challenge.challenge,
      difficulty: challengeDifficulty,
      timestamp: challenge.timestamp,
      clientFingerprint: challenge.clientFingerprint,
      riskLevel: riskLevel.name,
      optimistic: config.optimisticEnabled
    });

  } catch (error) {
    console.error('❌ Error generating challenge:', error);
    res.status(500).json({ error: 'Failed to generate challenge' });
  }
}

// CHALLENGE VERIFICATION ENDPOINT
// POST /api/anubis/verify
export async function verifyChallenge(req: Request, res: Response) {
  try {
    const { nonce, hash, challenge, timestamp } = req.body;
    
    if (!nonce || !hash || !challenge || !timestamp) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('🔍 Verifying challenge solution...');

    // Retrieve stored challenge data
    const storedChallenge = getStoredChallenge(challenge);
    if (!storedChallenge) {
      return res.status(400).json({ error: 'Invalid or expired challenge' });
    }

    // Validate proof of work
    const isValid = await anubis.validateProofOfWork({
      nonce,
      hash,
      challenge,
      timestamp
    }, storedChallenge.difficulty);

    if (!isValid) {
      console.log('❌ Invalid proof of work solution');
      return res.status(400).json({ error: 'Invalid proof of work' });
    }

    console.log('✅ Proof of work verified successfully');

    // Generate JWT token for verified user
    const requestMetadata = {
      ip: getClientIP(req),
      userAgent: req.get('User-Agent') || ''
    };

    const fingerprint = `${requestMetadata.userAgent}|${requestMetadata.ip}`;
    const now = Math.floor(Date.now() / 1000);
    
    // Token valid for different durations based on risk level
    const tokenDurations = {
      'LOW': 7 * 24 * 60 * 60,       // 7 days
      'MODERATE': 3 * 24 * 60 * 60,  // 3 days
      'ELEVATED': 24 * 60 * 60,      // 1 day
      'HIGH': 6 * 60 * 60,           // 6 hours
      'DANGEROUS': 1 * 60 * 60       // 1 hour
    };

    const tokenDuration = tokenDurations[storedChallenge.riskLevel as keyof typeof tokenDurations] || 24 * 60 * 60;
    
    const payload = {
      fingerprint,
      exp: now + tokenDuration,
      iat: now,
      difficulty: storedChallenge.difficulty,
      riskLevel: storedChallenge.riskLevel
    };

    const token = await anubis.signToken(payload);

    // Set cookie for server-side middleware access
    res.cookie('anubis-auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenDuration * 1000,
      path: '/'
    });

    // Clean up stored challenge
    removeStoredChallenge(challenge);

    console.log(`🎉 User verified successfully with ${storedChallenge.riskLevel} risk level`);

    res.json({ 
      success: true, 
      token,
      riskLevel: storedChallenge.riskLevel,
      expiresIn: tokenDuration
    });

  } catch (error) {
    console.error('❌ Error verifying challenge:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
}

// STATUS CHECK ENDPOINT
// GET /api/anubis/status
export async function checkStatus(req: Request, res: Response) {
  try {
    // Check if user has valid token
    const authCookie = req.cookies?.['anubis-auth'];
    
    if (authCookie) {
      const payload = await anubis.verifyToken(authCookie);
      if (payload && payload.exp > Math.floor(Date.now() / 1000)) {
        return res.json({
          protected: true,
          riskLevel: payload.riskLevel || 'UNKNOWN',
          expiresAt: payload.exp,
          timeRemaining: payload.exp - Math.floor(Date.now() / 1000)
        });
      }
    }

    // No valid token, perform risk assessment
    const requestMetadata = {
      ip: getClientIP(req),
      userAgent: req.get('User-Agent') || '',
      headers: req.headers as Record<string, string>,
      timestamp: Date.now()
    };

    const { riskLevel, config } = await anubis.analyzeRequest(requestMetadata);

    res.json({
      protected: false,
      riskLevel: riskLevel.name,
      challengeRequired: !config.optimisticEnabled,
      optimistic: config.optimisticEnabled,
      difficulty: config.challengeDifficulty
    });

  } catch (error) {
    console.error('❌ Error checking status:', error);
    res.status(500).json({ error: 'Status check failed' });
  }
}

// UTILITY FUNCTIONS

function getClientIP(req: Request): string {
  const forwarded = req.get('x-forwarded-for');
  const realIP = req.get('x-real-ip');
  const cfConnectingIP = req.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  return req.ip || req.connection?.remoteAddress || '127.0.0.1';
}

// SIMPLE IN-MEMORY STORAGE (Use Redis in production)
const challengeStore = new Map<string, any>();

function storeChallenge(challengeId: string, data: any): void {
  challengeStore.set(challengeId, {
    ...data,
    createdAt: Date.now()
  });
  
  // Clean up expired challenges (older than 10 minutes)
  setTimeout(() => {
    challengeStore.delete(challengeId);
  }, 10 * 60 * 1000);
}

function getStoredChallenge(challengeId: string): any {
  const stored = challengeStore.get(challengeId);
  
  if (!stored) return null;
  
  // Check if challenge is expired (10 minutes)
  if (Date.now() - stored.createdAt > 10 * 60 * 1000) {
    challengeStore.delete(challengeId);
    return null;
  }
  
  return stored;
}

function removeStoredChallenge(challengeId: string): void {
  challengeStore.delete(challengeId);
}

// EXPORT ROUTER SETUP FUNCTION FOR EXPRESS
export function setupAnubisRoutes(app: any) {
  app.post('/api/anubis/challenge', generateChallenge);
  app.post('/api/anubis/verify', verifyChallenge);
  app.get('/api/anubis/status', checkStatus);
  
  console.log('🛡️ Anubis API routes configured:');
  console.log('   POST /api/anubis/challenge - Generate challenge');
  console.log('   POST /api/anubis/verify - Verify solution');
  console.log('   GET /api/anubis/status - Check protection status');
}

// Note: For Next.js API routes, create separate files:
// - pages/api/anubis/challenge.ts exports generateChallenge as POST
// - pages/api/anubis/verify.ts exports verifyChallenge as POST  
// - pages/api/anubis/status.ts exports checkStatus as GET 