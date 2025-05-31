// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { loadAnubisConfig, getRouteProtectionManager } from '@/lib/anubis/config';
import { AnubisJWT, AnubisCrypto } from '@/lib/anubis/crypto';

// ANUBIS MIDDLEWARE INTEGRATION
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  console.log('Incoming request to:', pathname);
  
  try {
    // LOAD ANUBIS CONFIGURATION
    const config = loadAnubisConfig();
    const routeManager = getRouteProtectionManager();
    
    // SKIP ANUBIS IN DEVELOPMENT IF CONFIGURED
    if (config.bypassDevelopment && process.env.NODE_ENV === 'development') {
      return NextResponse.next();
    }
    
    // CHECK IF ROUTE NEEDS PROTECTION
    if (!routeManager.isRouteProtected(pathname)) {
      return NextResponse.next();
    }
    
    // EXTRACT REQUEST METADATA
    const requestMetadata = {
      userAgent: request.headers.get('user-agent') || undefined,
      acceptLanguage: request.headers.get('accept-language') || undefined,
      ip: getClientIP(request)
    };
    
    // CHECK FOR EXISTING VALID JWT
    const authCookie = request.cookies.get('anubis-auth');
    if (authCookie?.value) {
      const payload = await AnubisJWT.verify(authCookie.value, config.jwtSecret);
      if (payload) {
        // VALID JWT - ALLOW REQUEST
        return NextResponse.next();
      }
    }
    
    // CHECK FOR ALLOWED USER AGENTS (BOTS)
    if (isAllowedUserAgent(requestMetadata.userAgent, config.allowedUserAgents)) {
      return NextResponse.next();
    }
    
    // REDIRECT TO ANUBIS CHALLENGE PAGE
    const challengeUrl = new URL('/api/anubis/challenge', request.url);
    challengeUrl.searchParams.set('return_to', pathname);
    
    return NextResponse.redirect(challengeUrl);
    
  } catch (error) {
    console.error('Anubis middleware error:', error);
    // ON ERROR, ALLOW REQUEST TO CONTINUE
    return NextResponse.next();
  }
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
    // APPLY TO ALL ROUTES EXCEPT:
    // - Static files and assets
    // - Next.js internal routes
    // - API routes (Convex, auth, webhooks, etc.)
    // - Anubis own routes
    // - Vercel internal routes
    '/((?!_next/static|_next/image|_vercel|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};
