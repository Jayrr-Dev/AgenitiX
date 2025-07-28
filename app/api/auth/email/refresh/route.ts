/**
 * OAuth2 Token Refresh Handler
 * 
 * Handles refreshing expired OAuth2 access tokens using refresh tokens.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProvider } from '@/features/business-logic-modern/node-domain/email/providers';
import type { EmailProviderType } from '@/features/business-logic-modern/node-domain/email/types';
import { buildErrorResponse, buildSuccessResponse, sanitizeAuthData } from '../utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, refreshToken, accountId } = body;

    // Validate required parameters
    if (!provider || !refreshToken) {
      return buildErrorResponse('Missing required parameters: provider, refreshToken');
    }

    // Get provider instance
    const providerInstance = getProvider(provider as EmailProviderType);
    if (!providerInstance) {
      return buildErrorResponse(`Unsupported provider: ${provider}`);
    }

    // Validate that provider supports token refresh
    if (providerInstance.authType !== 'oauth2' || !providerInstance.refreshTokens) {
      return buildErrorResponse(`Provider ${provider} does not support token refresh`);
    }

    // Refresh tokens
    const newTokens = await providerInstance.refreshTokens(refreshToken);

    // Validate the new connection
    const connectionResult = await providerInstance.validateConnection({
      provider: provider as EmailProviderType,
      email: '', // Will be filled from profile
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken || refreshToken, // Some providers don't return new refresh token
      tokenExpiry: Date.now() + (newTokens.expiresIn * 1000),
    });

    if (!connectionResult.success) {
      console.error('Token refresh validation failed:', sanitizeAuthData(connectionResult.error));
      return buildErrorResponse(
        'Token refresh validation failed',
        connectionResult.error.message,
        400
      );
    }

    // Return new tokens and updated account info
    const refreshData = {
      provider,
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken || refreshToken,
      tokenExpiry: Date.now() + (newTokens.expiresIn * 1000),
      accountInfo: connectionResult.accountInfo,
      accountId,
    };

    console.log('Token refresh success:', sanitizeAuthData(refreshData));

    return buildSuccessResponse(refreshData);

  } catch (error) {
    console.error('Token refresh error:', error);
    
    // Check if it's a specific OAuth2 error
    if (error instanceof Error) {
      if (error.message.includes('invalid_grant') || error.message.includes('400')) {
        return buildErrorResponse(
          'Refresh token expired or invalid',
          'Please re-authenticate your email account',
          401
        );
      }
      
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return buildErrorResponse(
          'Authentication failed',
          'Please re-authenticate your email account',
          401
        );
      }
    }
    
    return buildErrorResponse(
      'Token refresh failed',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}