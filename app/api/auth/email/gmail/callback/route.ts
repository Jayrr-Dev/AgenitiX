/**
 * Gmail OAuth2 Callback Handler
 * 
 * Handles the OAuth2 callback from Google after user authorization.
 * Exchanges authorization code for access tokens.
 */

import { NextRequest, NextResponse } from 'next/server';
import { gmailProvider } from '@/features/business-logic-modern/node-domain/email/providers/gmail';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth2 errors
    if (error) {
      const errorDescription = searchParams.get('error_description') || 'OAuth2 authorization failed';
      
      // Redirect to frontend with error
      const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const redirectUrl = new URL('/dashboard', frontendUrl);
      redirectUrl.searchParams.set('auth_error', error);
      redirectUrl.searchParams.set('auth_error_description', errorDescription);
      redirectUrl.searchParams.set('provider', 'gmail');
      
      return NextResponse.redirect(redirectUrl);
    }

    // Validate authorization code
    if (!code) {
      const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const redirectUrl = new URL('/dashboard', frontendUrl);
      redirectUrl.searchParams.set('auth_error', 'missing_code');
      redirectUrl.searchParams.set('auth_error_description', 'Authorization code not received');
      redirectUrl.searchParams.set('provider', 'gmail');
      
      return NextResponse.redirect(redirectUrl);
    }

    // Exchange code for tokens
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/email/gmail/callback`;
    const tokens = await gmailProvider.exchangeCodeForTokens!(code, redirectUri);

    // Validate the connection to get user info
    const connectionResult = await gmailProvider.validateConnection({
      provider: 'gmail',
      email: '', // Will be filled from profile
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiry: Date.now() + (tokens.expiresIn * 1000),
    });

    if (!connectionResult.success) {
      const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const redirectUrl = new URL('/dashboard', frontendUrl);
      redirectUrl.searchParams.set('auth_error', 'validation_failed');
      redirectUrl.searchParams.set('auth_error_description', connectionResult.error.message);
      redirectUrl.searchParams.set('provider', 'gmail');
      
      return NextResponse.redirect(redirectUrl);
    }

    // Success - redirect to frontend with tokens and account info
    const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const redirectUrl = new URL('/dashboard', frontendUrl);
    
    // Encode the data as URL parameters (in production, use secure session storage)
    const authData = {
      provider: 'gmail',
      email: connectionResult.accountInfo?.email,
      displayName: connectionResult.accountInfo?.displayName,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiry: Date.now() + (tokens.expiresIn * 1000),
      state,
    };

    // In production, store this securely and use a session token instead
    redirectUrl.searchParams.set('auth_success', 'true');
    redirectUrl.searchParams.set('auth_data', btoa(JSON.stringify(authData)));
    
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Gmail OAuth2 callback error:', error);
    
    // Redirect to frontend with error
    const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const redirectUrl = new URL('/dashboard', frontendUrl);
    redirectUrl.searchParams.set('auth_error', 'callback_error');
    redirectUrl.searchParams.set('auth_error_description', error instanceof Error ? error.message : 'Unknown error');
    redirectUrl.searchParams.set('provider', 'gmail');
    
    return NextResponse.redirect(redirectUrl);
  }
}