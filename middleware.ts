// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { decodeJWT } from './utils/auth-utils';

// Define protected route patterns and required roles
const protectedRoutes = [
  { pattern: '/admin', requiredRole: 'admin' },
  { pattern: '/dashboard', requiredRole: 'user' },
  { pattern: '/settings', requiredRole: 'user' }
];

export async function middleware(request: NextRequest) {
  // Create a response to modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Check if this is a protected route
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.find(route => 
    pathname.startsWith(route.pattern)
  );

  if (isProtectedRoute) {
    try {
      // Get the user's session
      const { data: { session } } = await supabase.auth.getSession();

      // Not authenticated, redirect to sign-in
      if (!session) {
        return NextResponse.redirect(new URL('/', request.url));
      }

      // Decode the JWT to get user role
      const decodedToken = decodeJWT(session.access_token);
      const userRole = decodedToken.role;

      // Check if user has required role
      const requiredRole = isProtectedRoute.requiredRole;
      if (userRole !== requiredRole && !(userRole === 'admin' && requiredRole === 'user')) {
        // Redirect to unauthorized page if role doesn't match
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    } catch (error) {
      console.error('Error in auth middleware:', error);
      // Redirect to sign-in on any auth error
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Add protected routes to the matcher
    '/admin/:path*', 
    '/dashboard/:path*',
    '/settings/:path*',
    // Exclude static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};