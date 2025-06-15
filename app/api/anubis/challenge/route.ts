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
    <title>AgenitiX Protection - Verifying Your Browser</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Work+Sans:wght@400;600&display=swap');
        
        :root {
            --background: 0 0% 6%;
            --foreground: 0 0% 98%;
            --muted: 0 0% 18%;
            --muted-foreground: 0 0% 70%;
            --secondary: 210 100% 54%;
            --border: var(--muted);
        }
        
        .light {
            --background: 0 0% 100%;
            --foreground: 222 47% 11%;
            --muted: 0 0% 96%;
            --muted-foreground: 222 10% 45%;
            --border: 220 14% 91%;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--background);
            color: var(--foreground);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: var(--background);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            text-align: center;
            box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04);
            backdrop-filter: blur(16px);
        }
        
        .logo {
            width: 64px;
            height: 64px;
            margin: 0 auto 24px;
            background: var(--secondary);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            font-weight: bold;
            color: white;
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
        }
        
        h1 {
            font-family: 'Work Sans', sans-serif;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 12px;
            color: var(--foreground);
        }
        
        .subtitle {
            color: var(--muted-foreground);
            margin-bottom: 32px;
            font-size: 16px;
            line-height: 1.5;
        }
        
        .challenge-container {
            background: hsl(var(--muted) / 0.3);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
        }
        
        .progress-container {
            margin-bottom: 20px;
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background: var(--muted);
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 12px;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #08f, #f03);
            border-radius: 4px;
            width: 0%;
            transition: width 0.3s ease;
        }
        
        .progress-text {
            font-size: 14px;
            color: var(--muted-foreground);
            margin-bottom: 8px;
        }
        
        .status {
            font-weight: 600;
            padding: 8px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 14px;
        }
        
        .status.working {
            background: rgba(34, 197, 94, 0.1);
            color: var(--secondary);
            border: 1px solid rgba(34, 197, 94, 0.2);
        }
        
        .status.completed {
            background: rgba(34, 197, 94, 0.2);
            color: var(--secondary);
            border: 1px solid rgba(34, 197, 94, 0.3);
        }
        
        .spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid var(--muted);
            border-radius: 50%;
            border-top-color: var(--secondary);
            animation: spin 1s ease-in-out infinite;
            margin-right: 8px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .footer {
            font-size: 12px;
            color: var(--muted-foreground);
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid var(--border);
        }
        
        .brand {
            font-family: 'Work Sans', sans-serif;
            font-weight: 700;
            color: var(--foreground);
        }
        
        @media (prefers-color-scheme: light) {
            :root {
                --background: 0 0% 100%;
                --foreground: 222 47% 11%;
                --muted: 0 0% 96%;
                --muted-foreground: 222 10% 45%;
                --border: 220 14% 91%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">A</div>
        <h1>AgenitiX Protection</h1>
        <p class="subtitle">
            Verifying your browser to ensure you're a legitimate user. 
            This process helps protect against automated traffic.
        </p>
        
        <div class="challenge-container">
            <div class="progress-container">
                <div class="progress-text">Verifying browser...</div>
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
            </div>
            
            <div class="status working" id="status">
                <span class="spinner"></span>
                Processing verification...
            </div>
        </div>
        
        <div class="footer">
            <span class="brand">AgenitiX</span> uses advanced verification to ensure legitimate access.
            <br>This process typically takes a few seconds to complete.
        </div>
    </div>

    <script>
        const challenge = ${JSON.stringify(challenge)};
        const returnTo = "${returnTo}";
        let startTime = Date.now();
        let nonce = 0;
        
        function updateProgress(percentage) {
            document.getElementById('progressFill').style.width = percentage + '%';
        }
        
        function updateStatus(message, isCompleted = false) {
            const statusEl = document.getElementById('status');
            statusEl.innerHTML = isCompleted 
                ? '✅ ' + message
                : '<span class="spinner"></span>' + message;
            statusEl.className = 'status ' + (isCompleted ? 'completed' : 'working');
        }
        
        function sha256(message) {
            const msgBuffer = new TextEncoder().encode(message);
            return crypto.subtle.digest('SHA-256', msgBuffer).then(hashBuffer => {
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            });
        }
        
        async function solveChallenge() {
            const target = '0'.repeat(challenge.difficulty);
            
            while (true) {
                const input = challenge.challenge + nonce;
                const hash = await sha256(input);
                
                if (hash.startsWith(target)) {
                    updateProgress(100);
                    updateStatus('Verification completed! Redirecting...', true);
                    
                    const response = await fetch('/api/anubis/challenge', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            challenge: challenge.challenge,
                            nonce: nonce,
                            hash: hash
                        })
                    });
                    
                    if (response.ok) {
                        setTimeout(() => {
                            window.location.href = returnTo;
                        }, 1000);
                    } else {
                        updateStatus('Verification failed. Please refresh to try again.');
                    }
                    break;
                }
                
                nonce++;
                
                if (nonce % 1000 === 0) {
                    const elapsed = Date.now() - startTime;
                    const rate = nonce / (elapsed / 1000);
                    const estimated = Math.pow(16, challenge.difficulty) / rate;
                    const progress = Math.min(95, (elapsed / (estimated * 1000)) * 100);
                    updateProgress(progress);
                    
                    await new Promise(resolve => setTimeout(resolve, 1));
                }
            }
        }
        
        solveChallenge();
    </script>
</body>
</html>
  `;
} 