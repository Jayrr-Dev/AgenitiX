// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

// Basic middleware function
export function middleware(request: NextRequest) {
  // You can log requests, block paths, modify headers, etc. here
  console.log('Incoming request to:', request.nextUrl.pathname);

  // Always allow the request to continue
  return NextResponse.next();
}

// Middleware config
export const config = {
  matcher: [
    // Apply to all routes except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
