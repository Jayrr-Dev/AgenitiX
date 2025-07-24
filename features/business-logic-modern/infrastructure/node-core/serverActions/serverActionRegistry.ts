/**
 * SERVER ACTION REGISTRY - Enhanced async callbacks executed on node mount.
 *
 * • Legacy support for simple client-side actions
 * • Enhanced support for true server-side operations
 * • Database operations via Convex/Supabase
 * • Network requests to external APIs
 * • File system operations
 * • UI state updates via callbacks
 * • React Query integration for caching
 *
 * Keywords: server-actions, database-operations, network-requests, state-management, react-query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface ServerActionContext {
	nodeId: string;
	nodeKind: string;
	data: Record<string, unknown>;
	// Enhanced capabilities
	onStateUpdate?: (updates: Record<string, unknown>) => void;
	onError?: (error: Error) => void;
	onSuccess?: (result: unknown) => void;
	// React Query integration
	queryClient?: ReturnType<typeof useQueryClient>;
}

export type ServerAction = (ctx: ServerActionContext) => void | Promise<void>;

const actions: ServerAction[] = [];

export const registerServerAction = (fn: ServerAction) => actions.push(fn);

export const runServerActions = async (ctx: ServerActionContext) => {
	try {
		await Promise.all(actions.map((fn) => fn(ctx)));
	} catch (error) {
		ctx.onError?.(error as Error);
	}
};

// ============================================================================
// REACT QUERY INTEGRATION
// ============================================================================

/**
 * Hook for server actions with React Query caching
 */
export const useServerActionQuery = <T>(
	queryKey: string[],
	queryFn: () => Promise<T>,
	options?: {
		enabled?: boolean;
		staleTime?: number;
		cacheTime?: number;
	}
) => {
	return useQuery({
		queryKey: ['server-action', ...queryKey],
		queryFn,
		enabled: options?.enabled ?? true,
		staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
		gcTime: options?.cacheTime ?? 10 * 60 * 1000, // 10 minutes
	});
};

/**
 * Hook for server actions with React Query mutations
 */
export const useServerActionMutation = <TData, TVariables>(
	mutationFn: (variables: TVariables) => Promise<TData>,
	options?: {
		onSuccess?: (data: TData, variables: TVariables) => void;
		onError?: (error: Error, variables: TVariables) => void;
	}
) => {
	return useMutation({
		mutationFn,
		onSuccess: options?.onSuccess,
		onError: options?.onError,
	});
};

// ============================================================================
// ENHANCED SERVER ACTION TYPES
// ============================================================================

export interface DatabaseOperation {
	type: 'query' | 'mutation' | 'action';
	table: string;
	operation: string;
	params?: Record<string, unknown>;
}

export interface NetworkRequest {
	url: string;
	method: 'GET' | 'POST' | 'PUT' | 'DELETE';
	headers?: Record<string, string>;
	body?: unknown;
}

export interface FileOperation {
	type: 'read' | 'write' | 'delete';
	path: string;
	content?: string;
}

// ============================================================================
// ENHANCED API ROUTE HANDLERS WITH CACHING
// ============================================================================

export const executeDatabaseOperation = async (operation: DatabaseOperation) => {
	const response = await fetch('/api/server-actions/database', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(operation),
	});
	
	if (!response.ok) {
		throw new Error(`Database operation failed: ${response.statusText}`);
	}
	
	return response.json();
};

export const executeNetworkRequest = async (request: NetworkRequest) => {
	const response = await fetch('/api/server-actions/network', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(request),
	});
	
	if (!response.ok) {
		throw new Error(`Network request failed: ${response.statusText}`);
	}
	
	return response.json();
};

export const executeFileOperation = async (operation: FileOperation) => {
	const response = await fetch('/api/server-actions/files', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(operation),
	});
	
	if (!response.ok) {
		throw new Error(`File operation failed: ${response.statusText}`);
	}
	
	return response.json();
};

// ============================================================================
// CACHED OPERATIONS
// ============================================================================

/**
 * Cached database query with React Query
 */
export const useCachedDatabaseQuery = (
	nodeId: string,
	operation: DatabaseOperation,
	options?: {
		enabled?: boolean;
		staleTime?: number;
	}
) => {
	return useServerActionQuery(
		['database', nodeId, operation.table, operation.operation],
		() => executeDatabaseOperation(operation),
		{
			enabled: options?.enabled ?? true,
			staleTime: options?.staleTime ?? 2 * 60 * 1000, // 2 minutes for DB queries
		}
	);
};

/**
 * Cached network request with React Query
 */
export const useCachedNetworkRequest = (
	nodeId: string,
	request: NetworkRequest,
	options?: {
		enabled?: boolean;
		staleTime?: number;
	}
) => {
	return useServerActionQuery(
		['network', nodeId, request.url, request.method],
		() => executeNetworkRequest(request),
		{
			enabled: options?.enabled ?? true,
			staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes for network requests
		}
	);
};
