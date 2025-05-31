import { NextRequest, NextResponse } from 'next/server';
import { loadAnubisConfig } from '@/lib/anubis/config';
import { AnubisCrypto, AnubisJWT } from '@/lib/anubis/crypto';
import type { AnubisChallengeResponse } from '@/types/anubis';

// ANUBIS CHALLENGE API ENDPOINTS
export async function GET(request: NextRequest) {
  try {
    const config = loadAnubisConfig();
    const { searchParams } = new URL(request.url);
    const returnTo = searchParams.get('return_to') || '/';
    
    // EXTRACT REQUEST METADATA
    const requestMetadata = {
      userAgent: request.headers.get('user-agent') || undefined,
      acceptLanguage: request.headers.get('accept-language') || undefined,
      ip: getClientIP(request)
    };
    
    // GENERATE CHALLENGE
    const challenge = AnubisCrypto.createChallenge(requestMetadata, config.difficulty);
    
    // RETURN CHALLENGE PAGE HTML
    const challengePageHTML = generateChallengePageHTML(challenge, returnTo);
    
    return new NextResponse(challengePageHTML, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('Challenge generation error:', error);
    return NextResponse.json({ error: 'Challenge generation failed' }, { status: 500 });
  }
}

// HANDLE PROOF OF WORK SUBMISSION
export async function POST(request: NextRequest) {
  try {
    const config = loadAnubisConfig();
    const body = await request.json() as AnubisChallengeResponse;
    
    // VALIDATE PROOF OF WORK
    const isValid = await AnubisCrypto.validateProofOfWork(body, config.difficulty);
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid proof of work' }, { status: 400 });
    }
    
    // EXTRACT REQUEST METADATA FOR JWT
    const requestMetadata = {
      userAgent: request.headers.get('user-agent') || undefined,
      acceptLanguage: request.headers.get('accept-language') || undefined,
      ip: getClientIP(request)
    };
    
    // GENERATE JWT TOKEN
    const fingerprint = AnubisCrypto.generateFingerprint(requestMetadata);
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      fingerprint,
      exp: now + (7 * 24 * 60 * 60), // 7 DAYS
      iat: now,
      difficulty: config.difficulty
    };
    
    const token = await AnubisJWT.sign(payload, config.jwtSecret);
    
    // SET COOKIE AND RETURN SUCCESS
    const response = NextResponse.json({ success: true });
    response.cookies.set('anubis-auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 DAYS
      domain: config.cookieDomain
    });
    
    return response;
    
  } catch (error) {
    console.error('Proof of work validation error:', error);
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
  }
}

// EXTRACT CLIENT IP HELPER
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  return '127.0.0.1';
}

// GENERATE CHALLENGE PAGE HTML
function generateChallengePageHTML(challenge: any, returnTo: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Anubis Protection - Verifying Your Browser</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 500px;
            width: 90%;
            text-align: center;
        }
        .logo {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        h1 {
            color: #333;
            margin-bottom: 1rem;
            font-size: 1.5rem;
        }
        .description {
            color: #666;
            margin-bottom: 2rem;
            line-height: 1.6;
        }
        .progress {
            background: #f0f0f0;
            border-radius: 20px;
            height: 8px;
            margin: 1rem 0;
            overflow: hidden;
        }
        .progress-bar {
            background: linear-gradient(90deg, #667eea, #764ba2);
            height: 100%;
            width: 0%;
            transition: width 0.3s ease;
        }
        .status {
            color: #666;
            font-size: 0.9rem;
            margin: 1rem 0;
        }
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 1rem auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .error {
            color: #e74c3c;
            background: #fdf2f2;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🐺</div>
        <h1>Anubis Protection</h1>
        <div class="description">
            We're verifying that you're a real person and not a bot. 
            This process helps protect our website from automated traffic.
        </div>
        
        <div class="progress">
            <div class="progress-bar" id="progressBar"></div>
        </div>
        
        <div class="spinner" id="spinner"></div>
        <div class="status" id="status">Initializing challenge...</div>
        <div class="error" id="error"></div>
    </div>

    <script>
        // ANUBIS PROOF OF WORK CHALLENGE
        const challenge = ${JSON.stringify(challenge)};
        const returnTo = ${JSON.stringify(returnTo)};
        
        let nonce = 0;
        let startTime = Date.now();
        
        // UPDATE STATUS AND PROGRESS
        function updateStatus(message, progress = 0) {
            document.getElementById('status').textContent = message;
            document.getElementById('progressBar').style.width = progress + '%';
        }
        
        // SHOW ERROR
        function showError(message) {
            document.getElementById('error').textContent = message;
            document.getElementById('error').style.display = 'block';
            document.getElementById('spinner').style.display = 'none';
        }
        
        // SHA256 HASH FUNCTION
        async function sha256(input) {
            const encoder = new TextEncoder();
            const data = encoder.encode(input);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }
        
        // SOLVE PROOF OF WORK
        async function solveChallenge() {
            const requiredPrefix = '0'.repeat(challenge.difficulty);
            const maxIterations = 1000000; // PREVENT INFINITE LOOPS
            
            updateStatus('Solving challenge...', 10);
            
            for (let i = 0; i < maxIterations; i++) {
                const input = challenge.challenge + nonce;
                const hash = await sha256(input);
                
                // UPDATE PROGRESS PERIODICALLY
                if (i % 1000 === 0) {
                    const progress = Math.min(90, 10 + (i / maxIterations) * 80);
                    updateStatus(\`Computing... (attempt \${i.toLocaleString()})\`, progress);
                    
                    // YIELD TO BROWSER
                    await new Promise(resolve => setTimeout(resolve, 1));
                }
                
                // CHECK IF SOLUTION FOUND
                if (hash.startsWith(requiredPrefix)) {
                    updateStatus('Solution found! Verifying...', 95);
                    
                    // SUBMIT SOLUTION
                    try {
                        const response = await fetch('/api/anubis/challenge', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                nonce: nonce,
                                hash: hash,
                                challenge: challenge.challenge,
                                timestamp: challenge.timestamp
                            })
                        });
                        
                        if (response.ok) {
                            updateStatus('Verification complete!', 100);
                            setTimeout(() => {
                                window.location.href = returnTo;
                            }, 1000);
                        } else {
                            showError('Verification failed. Please try again.');
                        }
                    } catch (error) {
                        showError('Network error. Please check your connection.');
                    }
                    
                    return;
                }
                
                nonce++;
            }
            
            showError('Challenge timeout. Please refresh the page to try again.');
        }
        
        // START CHALLENGE
        setTimeout(() => {
            solveChallenge().catch(error => {
                console.error('Challenge error:', error);
                showError('An error occurred. Please refresh the page.');
            });
        }, 1000);
    </script>
</body>
</html>`;
} 