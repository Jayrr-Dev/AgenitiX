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
function isIpAllowed(clientIp: string, whitelist: string | undefined): boolean {
    if (!whitelist || !whitelist.trim()) return true; // Empty whitelist allows all

    const allowedIps = whitelist.split(',').map(ip => ip.trim());
    return allowedIps.includes('*') || allowedIps.includes(clientIp);
}

// Helper to validate authentication
function validateAuth(request: NextRequest, authType: string, authConfig: any): boolean {
    switch (authType) {
        case 'none':
            return true;

        case 'basic':
            if (!authConfig || !authConfig.username || !authConfig.password) return false;
            
            const authHeader = request.headers.get('authorization');
            if (!authHeader?.startsWith('Basic ')) return false;

            const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
            const [username, password] = credentials.split(':');

            return username === authConfig.username && password === authConfig.password;

        case 'header':
            if (!authConfig || !authConfig.headerName || !authConfig.headerValue) return false;
            
            const headerValue = request.headers.get(authConfig.headerName);
            return headerValue === authConfig.headerValue;

        case 'jwt':
            if (!authConfig || !authConfig.jwtSecret) return false;
            
            // Simplified JWT validation - in production use proper JWT library
            const jwtHeader = request.headers.get('authorization');
            return jwtHeader?.includes(authConfig.jwtSecret) || false;

        default:
            return false;
    }
}

// In-memory storage for webhook data (temporary solution)
const webhookDataStorage = new Map<string, any>();

// In-memory storage for active webhooks (in production, use database)
const activeWebhooks = new Map<string, {
    httpMethod: string;
    authType: 'none' | 'basic' | 'header' | 'jwt';
    authConfig: any;
    allowedOrigins: string;
    ipWhitelist: string;
    ignoreBots: boolean;
    respondMode: 'immediately' | 'lastNode' | 'respondNode';
    responseCode: number;
    responseData: 'allEntries' | 'firstJSON' | 'firstBinary' | 'noBody';
    responseHeaders: string;
    isActive: boolean;
    webhookId: string;
    nodeId?: string;
    requestCount: number;
    lastRequestTime: number | null;
}>();

// Get webhook configuration - ONLY returns if webhook is registered and active
function getWebhookConfig(webhookPath: string, method: string) {
    const key = `${method}:${webhookPath}`;
    const config = activeWebhooks.get(key);

    console.log(`🔍 Looking for webhook: ${key}`);
    console.log(`📋 Active webhooks:`, Array.from(activeWebhooks.keys()));

    if (!config) {
        console.log(`❌ Webhook not found: ${key}`);
        return null; // Webhook not registered
    }

    if (!config.isActive) {
        console.log(`⏸️ Webhook inactive: ${key}`);
        return null; // Webhook registered but not active
    }

    console.log(`✅ Webhook found and active: ${key}`);
    return config;
}

// Register a webhook (called when node is activated)
function registerWebhook(webhookPath: string, config: any) {
    const key = `${config.httpMethod}:${webhookPath}`;
    
    // Check if there's already a webhook for this path with a different method
    const existingKeys = Array.from(activeWebhooks.keys()).filter(k => k.endsWith(`:${webhookPath}`));
    
    // Remove any existing webhooks for this path (to handle method changes)
    existingKeys.forEach(existingKey => {
        if (existingKey !== key) {
            activeWebhooks.delete(existingKey);
            console.log(`🔄 Removed old webhook: ${existingKey}`);
        }
    });
    
    activeWebhooks.set(key, {
        ...config,
        isActive: true,
        requestCount: 0,
        lastRequestTime: null,
    });
    console.log(`🔗 Webhook registered: ${key}`);
    console.log(`📋 Total active webhooks:`, activeWebhooks.size);
}

// Unregister a webhook (called when node is deactivated)
function unregisterWebhook(webhookPath: string, httpMethod: string) {
    const key = `${httpMethod}:${webhookPath}`;
    const deleted = activeWebhooks.delete(key);
    console.log(`🔗 Webhook unregistered: ${key} (success: ${deleted})`);
    console.log(`📋 Total active webhooks:`, activeWebhooks.size);
}

// Update webhook statistics
function updateWebhookStats(webhookPath: string, method: string, requestData: any) {
    const key = `${method}:${webhookPath}`;
    const config = activeWebhooks.get(key);

    if (config) {
        config.requestCount += 1;
        config.lastRequestTime = Date.now();
        activeWebhooks.set(key, config);

        console.log(`📊 Updated webhook stats for ${key}:`, {
            requestCount: config.requestCount,
            lastRequestTime: new Date(config.lastRequestTime).toISOString(),
        });
    }
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

        // Get webhook configuration - only returns if registered and active
        const webhookConfig = getWebhookConfig(webhookPath, method);

        // Check if webhook exists and is active
        if (!webhookConfig) {
            return NextResponse.json(
                {
                    error: `Webhook not found or inactive`,
                    path: webhookPath,
                    method: method,
                    message: 'This webhook endpoint is not registered or has been deactivated. Please activate the webhook node first.',
                },
                { status: 404 }
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

        // Log the actual webhook data for debugging
        console.log('📤 Webhook data to be sent to nodes:', {
            nodeId: webhookConfig.nodeId,
            webhookData: webhookData,
            requestBody: requestData,
        });

        // Store webhook data for the node (temporary solution)
        if (webhookConfig.nodeId) {
            webhookDataStorage.set(webhookConfig.nodeId, requestData);
            console.log('💾 Stored webhook data for node:', webhookConfig.nodeId);
        }

        // Update webhook statistics
        updateWebhookStats(webhookPath, method, webhookData);

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

// Handle webhook management requests (register, unregister, getStats)
async function handleWebhookManagement(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await params;
        const webhookPath = `/${path.join('/')}`;
        const url = new URL(request.url);
        const action = url.searchParams.get('action');

        console.log(`🔧 Webhook management request: ${action} for ${webhookPath}`);

        if (action === 'register') {
            const body = await request.json();
            registerWebhook(webhookPath, body.config);
            return NextResponse.json({
                success: true,
                message: 'Webhook registered successfully',
                path: webhookPath,
            });
        }

        if (action === 'unregister') {
            const body = await request.json();
            unregisterWebhook(webhookPath, body.config.httpMethod);
            return NextResponse.json({
                success: true,
                message: 'Webhook unregistered successfully',
                path: webhookPath,
            });
        }

        if (action === 'getStats') {
            const method = url.searchParams.get('method') || 'POST';
            const key = `${method}:${webhookPath}`;
            const config = activeWebhooks.get(key);

            // Get stored webhook data for this node
            const nodeData = config?.nodeId ? webhookDataStorage.get(config.nodeId) : null;

            return NextResponse.json({
                success: true,
                stats: config ? {
                    requestCount: config.requestCount,
                    lastRequestTime: config.lastRequestTime,
                    isActive: config.isActive,
                    lastRequestData: nodeData, // Include the actual webhook data
                } : null,
                path: webhookPath,
                method: method,
            });
        }

        return NextResponse.json({
            error: 'Invalid action',
            validActions: ['register', 'unregister', 'getStats'],
        }, { status: 400 });

    } catch (error) {
        console.error('❌ Webhook management error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            message: 'Failed to process management request',
        }, { status: 500 });
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
    // Check if this is a management request
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action) {
        return handleWebhookManagement(request, context);
    }

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