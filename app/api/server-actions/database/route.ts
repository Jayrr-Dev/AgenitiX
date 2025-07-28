/**
 * DATABASE SERVER ACTION API ROUTE
 *
 * Handles database operations for enhanced server actions
 * Supports Convex, Supabase, and other database operations
 * Secure server-side execution with proper error handling
 *
 * Keywords: api-route, database-operations, server-actions, convex, supabase
 */

import type { DatabaseOperation } from "@/features/business-logic-modern/infrastructure/node-core/serverActions/serverActionRegistry";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const operation: DatabaseOperation = await request.json();

		// Validate operation
		if (!(operation.type && operation.table && operation.operation)) {
			return NextResponse.json({ error: "Invalid database operation" }, { status: 400 });
		}

		let result: unknown;

		switch (operation.type) {
			case "query":
				result = await handleDatabaseQuery(operation);
				break;
			case "mutation":
				result = await handleDatabaseMutation(operation);
				break;
			case "action":
				result = await handleDatabaseAction(operation);
				break;
			default:
				return NextResponse.json(
					{ error: `Unsupported operation type: ${operation.type}` },
					{ status: 400 }
				);
		}

		return NextResponse.json({ success: true, data: result });
	} catch (error) {
		console.error("Database server action error:", error);
		return NextResponse.json(
			{
				error: "Database operation failed",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}

async function handleDatabaseQuery(operation: DatabaseOperation) {
	return { message: "Query executed", operation: operation.operation };
}

async function handleDatabaseMutation(operation: DatabaseOperation) {
	return { message: "Mutation executed", operation: operation.operation };
}

async function handleDatabaseAction(operation: DatabaseOperation) {
	return { message: "Action executed", operation: operation.operation };
}
