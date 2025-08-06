/**
 * STARTER TEMPLATE CHECKER - Tool to inspect and validate starter templates
 *
 * • Check if user has starter templates
 * • Display template details and node/edge counts  
 * • Identify missing or empty templates
 * • Provides quick overview of template health
 *
 * Keywords: starter-templates, validation, diagnostics, admin
 */

"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface StarterTemplateCheckerProps {
	userId?: string;
}

export const StarterTemplateChecker = ({ userId }: StarterTemplateCheckerProps) => {
	const templateStatus = useQuery(
		api.flows.checkStarterTemplateStatus,
		userId ? { user_id: userId } : "skip"
	);

	if (!userId) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Starter Template Status</CardTitle>
					<CardDescription>User ID required to check templates</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	if (templateStatus === undefined) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Starter Template Status</CardTitle>
					<CardDescription>Loading template information...</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	if (templateStatus.error) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Starter Template Status</CardTitle>
					<CardDescription>Error checking templates</CardDescription>
				</CardHeader>
				<CardContent>
					<Alert className="border-red-500">
						<AlertDescription>
							<strong>Error:</strong> {templateStatus.error}
						</AlertDescription>
					</Alert>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Starter Template Status</CardTitle>
				<CardDescription>Overview of user's starter templates</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Summary */}
				<div className="grid grid-cols-2 gap-4">
					<div className="p-3 rounded-lg border bg-muted/50">
						<div className="text-sm font-medium text-muted-foreground">Total Flows</div>
						<div className="text-2xl font-bold">{templateStatus.totalFlows}</div>
					</div>
					<div className="p-3 rounded-lg border bg-muted/50">
						<div className="text-sm font-medium text-muted-foreground">Starter Templates</div>
						<div className="text-2xl font-bold">{templateStatus.starterTemplateCount}</div>
					</div>
				</div>

				{/* Status */}
				<Alert className={templateStatus.hasStarterTemplates ? "border-green-500" : "border-yellow-500"}>
					<AlertDescription>
						<strong>Status:</strong> {templateStatus.hasStarterTemplates 
							? "✅ User has starter templates" 
							: "⚠️ User missing starter templates"
						}
					</AlertDescription>
				</Alert>

				{/* Missing Templates */}
				{templateStatus.missingTemplates.length > 0 && (
					<div>
						<h4 className="font-medium mb-2">Missing Templates:</h4>
						<div className="flex flex-wrap gap-2">
							{templateStatus.missingTemplates.map((templateName) => (
								<Badge key={templateName} variant="destructive">
									{templateName}
								</Badge>
							))}
						</div>
					</div>
				)}

				{/* Existing Templates */}
				{templateStatus.starterTemplates.length > 0 && (
					<div>
						<h4 className="font-medium mb-2">Existing Templates:</h4>
						<div className="space-y-2">
							{templateStatus.starterTemplates.map((template) => (
								<div key={template.id} className="p-3 rounded-lg border bg-muted/20">
									<div className="flex items-center justify-between mb-1">
										<span className="font-medium">{template.name}</span>
										<div className="flex gap-2">
											<Badge variant={template.nodeCount > 0 ? "default" : "secondary"}>
												{template.nodeCount} nodes
											</Badge>
											<Badge variant={template.edgeCount > 0 ? "default" : "secondary"}>
												{template.edgeCount} edges
											</Badge>
										</div>
									</div>
									{template.description && (
										<p className="text-sm text-muted-foreground">{template.description}</p>
									)}
									{template.nodeCount === 0 && (
										<p className="text-xs text-red-600 mt-1">⚠️ Template has no nodes - may be empty</p>
									)}
								</div>
							))}
						</div>
					</div>
				)}

				{/* User ID for debugging */}
				<div className="text-xs text-muted-foreground pt-2 border-t">
					<strong>User ID:</strong> {userId}
				</div>
			</CardContent>
		</Card>
	);
};