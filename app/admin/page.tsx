"use client";

import { useAuthContext } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserDropdown } from "@/components/auth/UserDropdown";
import React from "react";

const AdminContent = () => {
	const { user } = useAuthContext();

	return (
		<div className="min-h-screen bg-background">
			{/* Header with user info */}
			<header className="bg-white border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center">
							<h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
						</div>
						<div className="flex items-center space-x-4">
							<span className="text-sm text-gray-600">Admin: {user?.name}</span>
							<UserDropdown />
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-4xl mx-auto p-8">
				{/* HEADER */}
				<div className="mb-8">
					<h2 className="text-3xl font-bold text-foreground mb-2">System Overview</h2>
					<p className="text-muted-foreground">
						This page is protected by AgenitiX authentication and optimistic verification
					</p>
				</div>

				{/* VERIFICATION STATUS */}
				<div className="bg-card border border-border rounded-lg p-6 mb-8">
					<h2 className="text-xl font-semibold text-foreground mb-4">🛡️ Protection Status</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
							<div className="text-green-500 font-medium">✅ Verified</div>
							<div className="text-sm text-muted-foreground mt-1">
								Background verification completed
							</div>
						</div>
						<div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
							<div className="text-blue-500 font-medium">⚡ Optimistic</div>
							<div className="text-sm text-muted-foreground mt-1">Immediate access granted</div>
						</div>
						<div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
							<div className="text-purple-500 font-medium">🔒 Secure</div>
							<div className="text-sm text-muted-foreground mt-1">Bot protection active</div>
						</div>
					</div>
				</div>

				{/* ADMIN CONTENT */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* SYSTEM STATS */}
					<div className="bg-card border border-border rounded-lg p-6">
						<h3 className="text-lg font-semibold text-foreground mb-4">System Statistics</h3>
						<div className="space-y-3">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Total Requests</span>
								<span className="text-foreground font-medium">1,234,567</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Blocked Bots</span>
								<span className="text-red-500 font-medium">45,678</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Success Rate</span>
								<span className="text-green-500 font-medium">96.3%</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Avg Response Time</span>
								<span className="text-blue-500 font-medium">23ms</span>
							</div>
						</div>
					</div>

					{/* RECENT ACTIVITY */}
					<div className="bg-card border border-border rounded-lg p-6">
						<h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
						<div className="space-y-3">
							<div className="flex items-center gap-3">
								<div className="w-2 h-2 rounded-full bg-green-500"></div>
								<span className="text-sm text-muted-foreground">User verified successfully</span>
								<span className="text-xs text-muted-foreground ml-auto">2s ago</span>
							</div>
							<div className="flex items-center gap-3">
								<div className="w-2 h-2 rounded-full bg-red-500"></div>
								<span className="text-sm text-muted-foreground">Bot attempt blocked</span>
								<span className="text-xs text-muted-foreground ml-auto">15s ago</span>
							</div>
							<div className="flex items-center gap-3">
								<div className="w-2 h-2 rounded-full bg-blue-500"></div>
								<span className="text-sm text-muted-foreground">Challenge completed</span>
								<span className="text-xs text-muted-foreground ml-auto">1m ago</span>
							</div>
							<div className="flex items-center gap-3">
								<div className="w-2 h-2 rounded-full bg-yellow-500"></div>
								<span className="text-sm text-muted-foreground">Suspicious activity detected</span>
								<span className="text-xs text-muted-foreground ml-auto">3m ago</span>
							</div>
						</div>
					</div>
				</div>

				{/* OPTIMISTIC VERIFICATION INFO */}
				<div className="mt-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6">
					<h3 className="text-lg font-semibold text-foreground mb-2">
						🚀 Optimistic Verification Active
					</h3>
					<p className="text-muted-foreground mb-4">
						You gained immediate access to this protected page while verification ran in the
						background. This provides the best user experience while maintaining security.
					</p>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
						<div>
							<div className="text-foreground font-medium">Grace Period</div>
							<div className="text-muted-foreground">30 seconds</div>
						</div>
						<div>
							<div className="text-foreground font-medium">Verification Time</div>
							<div className="text-muted-foreground">~2-5 seconds</div>
						</div>
						<div>
							<div className="text-foreground font-medium">Success Rate</div>
							<div className="text-muted-foreground">99.9%</div>
						</div>
					</div>
				</div>

				{/* TEST ACTIONS */}
				<div className="mt-8 bg-card border border-border rounded-lg p-6">
					<h3 className="text-lg font-semibold text-foreground mb-4">Test Actions</h3>
					<div className="flex flex-wrap gap-3">
						<button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
							Refresh Page
						</button>
						<button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
							Test API Call
						</button>
						<button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors">
							Clear Session
						</button>
						<button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors">
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
