/**
 * NETWORK SERVER ACTION API ROUTE
 *
 * Handles external API requests for enhanced server actions
 * Secure server-side execution with proper error handling
 * Supports all HTTP methods and custom headers
 *
 * Keywords: api-route, network-requests, server-actions, http-client, external-apis
 */

import { NextRequest, NextResponse } from 'next/server';
import type { NetworkRequest } from '@/features/business-logic-modern/infrastructure/node-core/serverActions/serverActionRegistry';

export async function POST(request: NextRequest) {
	try {
		const networkRequest: NetworkRequest = await request.json();
		
		// Validate request
		if (!networkRequest.url || !networkRequest.method) {
			return NextResponse.json(
				{ error: 'Invalid network request' },
				{ status: 400 }
			);
		}

		// Validate URL
		try {
			new URL(networkRequest.url);
		} catch {
			return NextResponse.json(
				{ error: 'Invalid URL' },
				{ status: 400 }
			);
		}

		// Execute the network request
		const result = await executeNetworkRequest(networkRequest);
		
		return NextResponse.json({ success: true, data: result });
	} catch (error) {
		console.error('Network server action error:', error);
		return NextResponse.json(
			{ error: 'Network request failed', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
}

async function executeNetworkRequest(request: NetworkRequest) {
	const { url, method, headers = {}, body } = request;

	// Prepare fetch options
	const fetchOptions: RequestInit = {
		method,
		headers: {
			'Content-Type': 'application/json',
			...headers,
		},
	};

	// Add body for POST, PUT, PATCH requests
	if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
		fetchOptions.body = JSON.stringify(body);
	}

	// Execute the request
	const response = await fetch(url, fetchOptions);
	
	if (!response.ok) {
		throw new Error(`HTTP ${response.status}: ${response.statusText}`);
	}

	// Try to parse JSON response, fallback to text
	let data: unknown;
	try {
		data = await response.json();
	} catch {
		data = await response.text();
	}

	return {
		status: response.status,
		statusText: response.statusText,
		headers: Object.fromEntries(response.headers.entries()),
		data,
	};
} 