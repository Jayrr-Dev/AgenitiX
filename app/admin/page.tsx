"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserDropdown } from "@/components/auth/UserDropdown";
import { FlowMigration } from "@/components/admin/FlowMigration";
import { StarterTemplateChecker } from "@/components/admin/StarterTemplateChecker";

const AdminContent = () => {
	const auth = useAuth();
	const { user } = auth;

	return (
		<div className="min-h-screen bg-background">
			{/* Header with user info */}
			<header className="border-gray-200 border-b bg-white">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="flex h-16 items-center justify-between">
						<div className="flex items-center">
							<h1 className="font-semibold text-gray-900 text-xl">Admin Dashboard</h1>
						</div>
						<div className="flex items-center space-x-4">
							<span className="text-gray-600 text-sm">Admin: {user?.name}</span>
							<UserDropdown />
						</div>
					</div>
				</div>
			</header>

			<div className="mx-auto max-w-4xl p-8">
				{/* HEADER */}
				<div className="mb-8">
					<h2 className="mb-2 font-bold text-3xl text-foreground">System Overview</h2>
					<p className="text-muted-foreground">
						This page is protected by AgenitiX authentication and optimistic verification
					</p>
				</div>

				{/* VERIFICATION STATUS */}
				<div className="mb-8 rounded-lg border border-border bg-card p-6">
					<h2 className="mb-4 font-semibold text-foreground text-xl">🛡️ Protection Status</h2>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
							<div className="font-medium text-green-500">✅ Verified</div>
							<div className="mt-1 text-muted-foreground text-sm">
								Background verification completed
							</div>
						</div>
						<div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
							<div className="font-medium text-blue-500">⚡ Optimistic</div>
							<div className="mt-1 text-muted-foreground text-sm">Immediate access granted</div>
						</div>
						<div className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-4">
							<div className="font-medium text-purple-500">🔒 Secure</div>
							<div className="mt-1 text-muted-foreground text-sm">Bot protection active</div>
						</div>
					</div>
				</div>

				{/* ADMIN CONTENT */}
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					{/* SYSTEM STATS */}
					<div className="rounded-lg border border-border bg-card p-6">
						<h3 className="mb-4 font-semibold text-foreground text-lg">System Statistics</h3>
						<div className="space-y-3">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Total Requests</span>
								<span className="font-medium text-foreground">1,234,567</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Blocked Bots</span>
								<span className="font-medium text-red-500">45,678</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Success Rate</span>
								<span className="font-medium text-green-500">96.3%</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Avg Response Time</span>
								<span className="font-medium text-blue-500">23ms</span>
							</div>
						</div>
					</div>

					{/* RECENT ACTIVITY */}
					<div className="rounded-lg border border-border bg-card p-6">
						<h3 className="mb-4 font-semibold text-foreground text-lg">Recent Activity</h3>
						<div className="space-y-3">
							<div className="flex items-center gap-3">
								<div className="h-2 w-2 rounded-full bg-green-500" />
								<span className="text-muted-foreground text-sm">User verified successfully</span>
								<span className="ml-auto text-muted-foreground text-xs">2s ago</span>
							</div>
							<div className="flex items-center gap-3">
								<div className="h-2 w-2 rounded-full bg-red-500" />
								<span className="text-muted-foreground text-sm">Bot attempt blocked</span>
								<span className="ml-auto text-muted-foreground text-xs">15s ago</span>
							</div>
							<div className="flex items-center gap-3">
								<div className="h-2 w-2 rounded-full bg-blue-500" />
								<span className="text-muted-foreground text-sm">Challenge completed</span>
								<span className="ml-auto text-muted-foreground text-xs">1m ago</span>
							</div>
							<div className="flex items-center gap-3">
								<div className="h-2 w-2 rounded-full bg-yellow-500" />
								<span className="text-muted-foreground text-sm">Suspicious activity detected</span>
								<span className="ml-auto text-muted-foreground text-xs">3m ago</span>
							</div>
						</div>
					</div>
				</div>

				{/* OPTIMISTIC VERIFICATION INFO */}
				<div className="mt-8 rounded-lg border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6">
					<h3 className="mb-2 font-semibold text-foreground text-lg">
						🚀 Optimistic Verification Active
					</h3>
					<p className="mb-4 text-muted-foreground">
						You gained immediate access to this protected page while verification ran in the
						background. This provides the best user experience while maintaining security.
					</p>
					<div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
						<div>
							<div className="font-medium text-foreground">Grace Period</div>
							<div className="text-muted-foreground">30 seconds</div>
						</div>
						<div>
							<div className="font-medium text-foreground">Verification Time</div>
							<div className="text-muted-foreground">~2-5 seconds</div>
						</div>
						<div>
							<div className="font-medium text-foreground">Success Rate</div>
							<div className="text-muted-foreground">99.9%</div>
						</div>
					</div>
				</div>

				{/* USER INFO DEBUG */}
				<div className="mt-8 rounded-lg border border-border bg-card p-6">
					<h3 className="mb-4 font-semibold text-foreground text-lg">Authentication Debug</h3>
					<div className="space-y-2 text-sm">
						<p><strong>User ID:</strong> {user?.id || "Not available"}</p>
						<p><strong>Name:</strong> {user?.name || "Not available"}</p>
						<p><strong>Email:</strong> {user?.email || "Not available"}</p>
						<p><strong>Image:</strong> {user?.image || "Not available"}</p>
						
						<div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
							<strong>Authentication Status:</strong>
							<div className="mt-2 grid grid-cols-2 gap-2 text-xs">
								<div>Is Authenticated: {auth.isAuthenticated ? "✅ Yes" : "❌ No"}</div>
								<div>OAuth Active: {auth.isOAuthAuthenticated ? "✅ Yes" : "❌ No"}</div>
								<div>Auth Token: {auth.authToken ? "✅ Present" : "❌ Missing"}</div>
								<div>Magic Link Token: {localStorage.getItem("agenitix_auth_token") ? "✅ Present" : "❌ Missing"}</div>
							</div>
						</div>
						
						<div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
							<strong>Delete Permission Check:</strong>
							<div className="mt-2 text-xs">
								{auth.isAuthenticated && user?.id ? (
									<span className="text-green-600">✅ User can perform delete operations</span>
								) : (
									<span className="text-red-600">❌ Delete operations will fail - user not properly authenticated</span>
								)}
							</div>
						</div>
						
						<div className="mt-4 p-3 bg-muted/50 rounded text-xs">
							<strong>Full User Object:</strong>
							<pre className="mt-1 whitespace-pre-wrap">{JSON.stringify(user, null, 2)}</pre>
						</div>
					</div>
				</div>

				{/* STARTER TEMPLATE CHECKER */}
				<div className="mt-8">
					<StarterTemplateChecker userId={user?.id} />
				</div>

				{/* FLOW MIGRATION TOOL */}
				<div className="mt-8">
					<FlowMigration />
				</div>

				{/* TEST ACTIONS */}
				<div className="mt-8 rounded-lg border border-border bg-card p-6">
					<h3 className="mb-4 font-semibold text-foreground text-lg">Test Actions</h3>
					<div className="flex flex-wrap gap-3">
						<button
							type="button"
							onClick={() => window.location.reload()}
							className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
						>
							Refresh Page
						</button>
						<button
							type="button"
							onClick={() => {
								// Force clear all auth data and redirect
								localStorage.clear();
								sessionStorage.clear();
								document.cookie.split(";").forEach(c => {
									const eqPos = c.indexOf("=");
									const name = eqPos > -1 ? c.substr(0, eqPos) : c;
									document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
								});
								window.location.href = '/';
							}}
							className="rounded-lg bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600"
						>
							Force Sign Out
						</button>
						<button
							type="button"
							className="rounded-lg bg-purple-500 px-4 py-2 text-white transition-colors hover:bg-purple-600"
						>
							Clear Session
						</button>
						<button
							type="button"
							className="rounded-lg bg-orange-500 px-4 py-2 text-white transition-colors hover:bg-orange-600"
						>
							Force Challenge
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

// PROTECTED ADMIN PAGE
export default function AdminPage() {
	return (
		<ProtectedRoute>
			<AdminContent />
		</ProtectedRoute>
	);
}
