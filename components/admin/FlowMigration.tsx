/**
 * FLOW MIGRATION COMPONENT - Admin tool for migrating flow user_id references
 *
 * • Diagnose problematic flow records with auth_users IDs
 * • Execute migration to convert auth_users IDs to users table IDs
 * • Provides detailed logging and error reporting
 * • Only visible in development or for admin users
 *
 * Keywords: migration, flows, auth_users, users, admin
 */

"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

export const FlowMigration = () => {
	const [migrationResult, setMigrationResult] = useState<any>(null);
	const [starterTemplateResult, setStarterTemplateResult] = useState<any>(null);
	const [isRunning, setIsRunning] = useState(false);
	const [isCreatingTemplates, setIsCreatingTemplates] = useState(false);
	const [debugResult, setDebugResult] = useState<any>(null);
	
	const migrateFlowUserIds = useMutation(api.flows.migrateFlowUserIds);
	const getStarterTemplatesForUser = useMutation(api.flows.getStarterTemplatesForUser);
	const debugProblematicFlow = useQuery(
		api.flows.debugProblematicFlow,
		{ flow_id: "kd73v3k892v9mzrt6wke809v4x7n54g4" } // The problematic flow ID from error
	);

	const handleMigration = async () => {
		if (isRunning) return;
		
		setIsRunning(true);
		try {
			console.log("🔧 Starting flow user_id migration...");
			const result = await migrateFlowUserIds();
			setMigrationResult(result);
			console.log("✅ Migration completed:", result);
		} catch (error) {
			console.error("❌ Migration failed:", error);
			setMigrationResult({
				success: false,
				error: error instanceof Error ? error.message : "Unknown error"
			});
		} finally {
			setIsRunning(false);
		}
	};

	const handleDebugCheck = () => {
		setDebugResult(debugProblematicFlow);
	};

	const handleCreateStarterTemplates = async () => {
		if (isCreatingTemplates) return;
		
		setIsCreatingTemplates(true);
		try {
			// Get user ID from the auth system - we'll use a placeholder for now
			// In a real implementation, you'd get this from the current user context
			const userId = "your-user-id-here"; // Replace with actual user ID
			
			console.log("🚀 Creating starter templates...");
			const result = await getStarterTemplatesForUser({ user_id: userId as any });
			setStarterTemplateResult(result);
			console.log("✅ Starter templates created:", result);
		} catch (error) {
			console.error("❌ Failed to create starter templates:", error);
			setStarterTemplateResult({
				success: false,
				error: error instanceof Error ? error.message : "Unknown error"
			});
		} finally {
			setIsCreatingTemplates(false);
		}
	};

	return (
		<Card className="w-full max-w-4xl mx-auto">
			<CardHeader>
				<CardTitle>Flow Migration Tool</CardTitle>
				<CardDescription>
					Fix flows with auth_users IDs to use users table IDs
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Debug Section */}
				<div>
					<h3 className="text-lg font-semibold mb-3">🔍 Debug Problematic Flow</h3>
					<div className="flex gap-3 mb-3">
						<Button 
							onClick={handleDebugCheck}
							variant="outline"
						>
							Check Flow kd73v3k892v9mzrt6wke809v4x7n54g4
						</Button>
					</div>
					
					{debugProblematicFlow && (
						<Alert className="mt-3">
							<AlertDescription>
								<pre className="text-sm whitespace-pre-wrap">
									{JSON.stringify(debugProblematicFlow, null, 2)}
								</pre>
							</AlertDescription>
						</Alert>
					)}
				</div>

				<Separator />

				{/* Starter Templates Section */}
				<div>
					<h3 className="text-lg font-semibold mb-3">🚀 Create Starter Templates</h3>
					<p className="text-sm text-muted-foreground mb-4">
						Create the default starter templates for a user account.
					</p>
					
					<Button 
						onClick={handleCreateStarterTemplates}
						disabled={isCreatingTemplates}
						variant="outline"
						className="mb-4"
					>
						{isCreatingTemplates ? "Creating Templates..." : "Create Starter Templates"}
					</Button>

					{starterTemplateResult && (
						<Alert className={starterTemplateResult.success ? "border-green-500" : "border-red-500"}>
							<AlertDescription>
								<div className="space-y-2">
									<div className="font-medium">
										{starterTemplateResult.success ? "✅ Templates Created" : "❌ Template Creation Failed"}
									</div>
									<div className="text-sm">
										<p><strong>Message:</strong> {starterTemplateResult.message}</p>
										{starterTemplateResult.templateCount && (
											<p><strong>Templates Created:</strong> {starterTemplateResult.templateCount}</p>
										)}
									</div>
									{starterTemplateResult.error && (
										<p className="text-red-600 text-sm">{starterTemplateResult.error}</p>
									)}
								</div>
							</AlertDescription>
						</Alert>
					)}
				</div>

				<Separator />

				{/* Migration Section */}
				<div>
					<h3 className="text-lg font-semibold mb-3">🔧 Run Migration</h3>
					<p className="text-sm text-muted-foreground mb-4">
						This will update all flow records to use the correct user_id references from the users table.
					</p>
					
					<Button 
						onClick={handleMigration}
						disabled={isRunning}
						className="mb-4"
					>
						{isRunning ? "Running Migration..." : "Run Flow Migration"}
					</Button>

					{migrationResult && (
						<Alert className={migrationResult.success ? "border-green-500" : "border-red-500"}>
							<AlertDescription>
								<div className="space-y-2">
									<div className="font-medium">
										{migrationResult.success ? "✅ Migration Completed" : "❌ Migration Failed"}
									</div>
									<div className="text-sm">
										<p><strong>Total Flows:</strong> {migrationResult.totalFlows}</p>
										<p><strong>Migrated:</strong> {migrationResult.migratedCount}</p>
										<p><strong>Errors:</strong> {migrationResult.errorCount}</p>
										{migrationResult.mappingStats && (
											<div className="mt-2">
												<p><strong>Mapping Stats:</strong></p>
												<p>• Auth Users: {migrationResult.mappingStats.totalAuthUsers}</p>
												<p>• Users: {migrationResult.mappingStats.totalUsers}</p>
												<p>• Mappings Found: {migrationResult.mappingStats.mappingsFound}</p>
											</div>
										)}
									</div>
									{migrationResult.errors && migrationResult.errors.length > 0 && (
										<div className="mt-3">
											<p className="font-medium text-red-600">Errors:</p>
											<ul className="text-sm text-red-600 list-disc list-inside">
												{migrationResult.errors.map((error: string, index: number) => (
													<li key={index}>{error}</li>
												))}
											</ul>
										</div>
									)}
									{migrationResult.error && (
										<p className="text-red-600 text-sm">{migrationResult.error}</p>
									)}
								</div>
							</AlertDescription>
						</Alert>
					)}
				</div>

				<Separator />

				{/* Instructions */}
				<div>
					<h3 className="text-lg font-semibold mb-3">📋 Instructions</h3>
					<div className="text-sm text-muted-foreground space-y-2">
						<p>1. First run the debug check to see the problematic flow details</p>
						<p>2. Run the migration to fix all flows with incorrect user_id references</p>
						<p>3. The migration will map auth_users IDs to users table IDs using:</p>
						<ul className="list-disc list-inside ml-4 space-y-1">
							<li>Cross-references in the users table (auth_user_id field)</li>
							<li>Cross-references in the auth_users table (convex_user_id field)</li>
							<li>Email matching as fallback</li>
						</ul>
						<p>4. After successful migration, refresh your dashboard to see if the error is resolved</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};