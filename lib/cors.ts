/**
 * CORS Configuration for OAuth Development
 * 
 * • Handles CORS headers for OAuth API routes
 * • Supports localhost development
 * • Allows OAuth providers to communicate with your app
 * • Prevents CORS errors during OAuth flow
 */

import { NextRequest, NextResponse } from "next/server";

// CORS headers for OAuth development
export const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.NODE_ENV === "development" 
    ? "http://localhost:3000" 
    : process.env.NEXT_PUBLIC_BASE_URL || "https://your-domain.com",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": [
    "Content-Type", 
    "Authorization", 
    "X-Requested-With",
    "Accept",
    "Origin"
  ].join(", "),
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400", // 24 hours
};

// CORS middleware for OAuth routes
export function withCors(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Call the original handler
    const response = await handler(request);

    // Add CORS headers to the response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}

// Specific CORS headers for OAuth callback routes
export const oauthCorsHeaders = {
  ...corsHeaders,
  // Additional headers for OAuth security
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

// CORS configuration for different environments
export const getCorsConfig = () => {
  const isDevelopment = process.env.NODE_ENV === "development";
  
  return {
    allowedOrigins: isDevelopment 
      ? ["http://localhost:3000", "http://127.0.0.1:3000"]
      : [process.env.NEXT_PUBLIC_BASE_URL || "https://your-domain.com"],
    allowedMethods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: [
      "Content-Type", 
      "Authorization", 
      "X-Requested-With",
      "Accept",
      "Origin"
    ],
    credentials: true,
    maxAge: 86400,
  };
};
