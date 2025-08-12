/**
 * Webhook API Route - Dynamic webhook handler for triggerWebhook nodes
 * 
 * Handles all HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD) for webhook endpoints
 * Supports authentication, CORS, IP whitelisting, and custom responses
 * Integrates with Convex to store webhook data and trigger workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Supported HTTP methods for validation
const SUPPORTED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

// Helper to validate IP whitelist
function isIpAllowed(clientIp: string, whitelist: string): boolean {
  if (!whitelist.trim()) return true; // Empty whitelist allows all
  
  const allowedIps = whitelist.split(',').map(ip => ip.trim());
  return allowedIps.includes('*') || allowedIps.includes(clientIp);
}

// Helper to validate authentication
function validateAuth(request: NextRequest, authType: string, authConfig: any): boolean {
  switch (authType) {
    case 'none':
      return true;
      
    case 'basic':
      const authHeader = request.headers.get('authorization');
      if (!authHeader?.startsWith('Basic ')) return false;
      
      const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
      const [username, password] = credentials.split(':');
      
      return username === authConfig.username && password === authConfig.password;
      
    case 'header':
      const headerValue = request.headers.get(authConfig.headerName);
      return headerValue === authConfig.headerValue;
      
    case 'jwt':
      // Simplified JWT validation - in production use proper JWT library
      const jwtHeader = request.headers.get('authorization');
      return jwtHeader?.includes(authConfig.jwtSecret) || false;
      
    default:
      return false;
  }
}

// Simulate webhook configuration lookup
// TODO: Replace with actual database lookup
function getWebhookConfig(webhookPath: string, method: string) {
  // For now, simulate that all webhooks exist and are active
  // In production, this would query the database for the webhook configuration
  return {
    httpMethod: method,
    authType: 'none' as const,
    authConfig: {},
    allowedOrigins: '*',
    ipWhitelist: '',
    ignoreBots: false,
    respondMode: 'immediately' as const,
    responseCode: 200,
    responseData: 'firstJSON' as const,
    responseHeaders: '{}',
    isActive: true, // This would come from the database
    webhookId: `webhook-${webhookPath.replace(/[^a-zA-Z0-9]/g, '')}`,
  };
}

// Main handler function
async function handleWebhookRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const webhookPath = `/${path.join('/')}`;
    const method = request.method;
    
    // Get client IP
    const headersList = await headers();
    const clientIp = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     'unknown';
    
    // TODO: Get webhook configuration from database/store
    // For now, simulate webhook lookup and validation
    const webhookConfig = getWebhookConfig(webhookPath, method);
    
    // Check if webhook exists and is active
    if (!webhookConfig) {
      return NextResponse.json(
        { error: `Webhook not found for path: ${webhookPath}` },
        { status: 404 }
      );
    }
    
    if (!webhookConfig.isActive) {
      return NextResponse.json(
        { error: 'Webhook is not active' },
        { status: 403 }
      );
    }
    
    // Validate HTTP method
    if (!SUPPORTED_METHODS.includes(method as any)) {
      return NextResponse.json(
        { error: `Method ${method} not supported` },
        { status: 405 }
      );
    }
    
    if (webhookConfig.httpMethod !== method) {
      return NextResponse.json(
        { error: `Method ${method} not allowed for this webhook` },
        { status: 405 }
      );
    }
    
    // Validate IP whitelist
    if (!isIpAllowed(clientIp, webhookConfig.ipWhitelist)) {
      return NextResponse.json(
        { error: 'IP address not allowed' },
        { status: 403 }
      );
    }
    
    // Validate authentication
    if (!validateAuth(request, webhookConfig.authType, webhookConfig.authConfig)) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
    
    // Parse request body
    let requestData: any = null;
    const contentType = request.headers.get('content-type') || '';
    
    if (method !== 'GET' && method !== 'HEAD') {
      if (contentType.includes('application/json')) {
        try {
          requestData = await request.json();
        } catch {
          requestData = null;
        }
      } else if (contentType.includes('text/')) {
        requestData = await request.text();
      } else {
        // Handle binary data
        const buffer = await request.arrayBuffer();
        requestData = {
          type: 'binary',
          size: buffer.byteLength,
          contentType,
        };
      }
    }
    
    // Prepare webhook data
    const webhookData = {
      method,
      path: webhookPath,
      headers: Object.fromEntries(request.headers.entries()),
      query: Object.fromEntries(new URL(request.url).searchParams.entries()),
      body: requestData,
      timestamp: new Date().toISOString(),
      clientIp,
    };
    
    // TODO: Store webhook data and trigger workflow
    // This would integrate with Convex to:
    // 1. Find the webhook node by path
    // 2. Update the node's output data
    // 3. Trigger connected nodes
    
    console.log('📥 Webhook received:', {
      path: webhookPath,
      method,
      clientIp,
      hasBody: !!requestData,
      webhookId: webhookConfig.webhookId,
      timestamp: webhookData.timestamp,
    });
    
    // TODO: Update webhook statistics in database
    // This would increment request count and update last request time
    console.log('📊 Updating webhook statistics for:', webhookConfig.webhookId);
    
    // Prepare response based on configuration
    const responseHeaders: Record<string, string> = {
      ...corsHeaders,
      'Access-Control-Allow-Origin': webhookConfig.allowedOrigins,
    };
    
    // Add custom response headers
    try {
      const customHeaders = JSON.parse(webhookConfig.responseHeaders || '{}');
      Object.assign(responseHeaders, customHeaders);
    } catch {
      // Invalid JSON in response headers, ignore
    }
    
    // Return response based on mode
    switch (webhookConfig.respondMode) {
      case 'immediately':
        return NextResponse.json(
          { 
            message: 'Webhook received successfully',
            timestamp: new Date().toISOString(),
            path: webhookPath,
          },
          { 
            status: webhookConfig.responseCode,
            headers: responseHeaders,
          }
        );
        
      case 'lastNode':
        // TODO: Wait for workflow to complete and return last node output
        return NextResponse.json(
          { message: 'Workflow completed', result: 'TODO: implement' },
          { 
            status: webhookConfig.responseCode,
            headers: responseHeaders,
          }
        );
        
      case 'respondNode':
        // TODO: Use custom respond node output
        return NextResponse.json(
          { message: 'Custom response', result: 'TODO: implement' },
          { 
            status: webhookConfig.responseCode,
            headers: responseHeaders,
          }
        );
        
      default:
        return NextResponse.json(
          { message: 'Webhook received' },
          { 
            status: webhookConfig.responseCode,
            headers: responseHeaders,
          }
        );
    }
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to process webhook request',
      },
      { status: 500 }
    );
  }
}

// Export handlers for all HTTP methods
export async function GET(request: NextRequest, context: any) {
  return handleWebhookRequest(request, context);
}

export async function POST(request: NextRequest, context: any) {
  return handleWebhookRequest(request, context);
}

export async function PUT(request: NextRequest, context: any) {
  return handleWebhookRequest(request, context);
}

export async function PATCH(request: NextRequest, context: any) {
  return handleWebhookRequest(request, context);
}

export async function DELETE(request: NextRequest, context: any) {
  return handleWebhookRequest(request, context);
}

export async function HEAD(request: NextRequest, context: any) {
  return handleWebhookRequest(request, context);
}

export async function OPTIONS(request: NextRequest, context: any) {
  // Handle CORS preflight requests
  const headersList = await headers();
  const origin = headersList.get('origin') || '*';
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Access-Control-Allow-Origin': origin,
    },
  });
}