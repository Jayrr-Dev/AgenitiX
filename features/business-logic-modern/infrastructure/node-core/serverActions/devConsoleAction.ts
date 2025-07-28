/**
 * DEV CONSOLE SERVER ACTION - Enhanced with server-side capabilities
 *
 * Demonstrates both legacy and enhanced server action capabilities:
 * • Legacy: Console logging for node mount events
 * • Enhanced: Database operations, network requests, file operations
 * • UI state updates via callbacks
 * • Error handling and success notifications
 *
 * In React 18 Strict-Mode this will fire twice; we de-duplicate via a Set.
 */

import {
	type DatabaseOperation,
	type FileOperation,
	type NetworkRequest,
	type ServerActionContext,
	executeDatabaseOperation,
	executeFileOperation,
	executeNetworkRequest,
	registerServerAction,
} from "./serverActionRegistry";

const seen = new Set<string>();

const logAction = async (ctx: ServerActionContext) => {
	const { nodeId, nodeKind, data, onStateUpdate, onError, onSuccess } = ctx;
	const key = `${nodeId}-mounted`;

	if (seen.has(key)) {
		return;
	}
	seen.add(key);

	try {
		// Enhanced capabilities demonstration
		// 1. Database Operation Example
		const dbOperation: DatabaseOperation = {
			type: "query",
			table: "nodes",
			operation: "getNodeById",
			params: { nodeId },
		};

		const dbResult = await executeDatabaseOperation(dbOperation);

		// 2. Network Request Example
		const networkRequest: NetworkRequest = {
			url: "https://api.github.com/users/octocat",
			method: "GET",
			headers: {
				"User-Agent": "Agenitix-2-Server-Action",
			},
		};

		const networkResult = await executeNetworkRequest(networkRequest);

		// 3. File Operation Example
		const fileOperation: FileOperation = {
			type: "write",
			path: `/tmp/node-${nodeId}-log.json`,
			content: JSON.stringify(
				{
					nodeId,
					nodeKind,
					timestamp: new Date().toISOString(),
					data: data,
				},
				null,
				2
			),
		};

		const fileResult = await executeFileOperation(fileOperation);

		// 4. UI State Update Example
		onStateUpdate?.({
			lastServerAction: new Date().toISOString(),
			serverActionStatus: "completed",
			results: {
				database: dbResult,
				network: networkResult,
				file: fileResult,
			},
		});

		// 5. Success Notification
		onSuccess?.({
			message: "Enhanced server action completed successfully",
			nodeId,
			nodeKind,
			operations: ["database", "network", "file"],
		});
	} catch (error) {
		console.error("❌ [ENHANCED] Server action failed:", error);
		onError?.(error as Error);
	}
};

registerServerAction(logAction);
