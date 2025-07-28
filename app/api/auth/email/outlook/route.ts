/**
 * Outlook OAuth2 Authentication Handler
 * 
 * Handles Outlook OAuth2 authorization flow initiation.
 * Redirects users to Microsoft's OAuth2 consent screen.
 */

import { NextRequest, NextResponse } from 'next/server';
import { outlookProvider } from '@/features/business-logic-modern/node-domain/email/providers/outlook';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const redirectUri = searchParams.get('redirect_uri');
    const state = searchParams.get('state');

    // Validate redirect URI
    if (!redirectUri) {
      return NextResponse.json(
        { error: 'redirect_uri parameter is required' },
        { status: 400 }
      );
    }

    // Validate that redirect URI is from our domain (security)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    if (!redirectUri.startsWith(baseUrl)) {
      return NextResponse.json(
        { error: 'Invalid redirect_uri domain' },
        { status: 400 }
      );
    }

    // Generate OAuth2 URL
    const authUrl = outlookProvider.getOAuthUrl!(redirectUri, state);

    // Return the authorization URL for client-side redirect
    return NextResponse.json({
      success: true,
      authUrl,
      provider: 'outlook',
    });

  } catch (error) {
    console.error('Outlook OAuth2 initiation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initiate Outlook OAuth2 flow',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}