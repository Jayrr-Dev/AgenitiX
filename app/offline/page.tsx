"use client";

import React from "react";

export default function OfflinePage() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-background">
			<div className="text-center p-8 max-w-md mx-auto">
				<div className="mb-8">
					<svg
						className="w-24 h-24 mx-auto text-gray-400 mb-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={1.5}
							d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
						/>
					</svg>
				</div>

				<h1 className="text-2xl font-bold text-foreground mb-4">You're Offline</h1>

				<p className="text-muted-foreground mb-6">
					It looks like you've lost your internet connection. Don't worry, you can still use the
					flow editor with your cached data.
				</p>

				<div className="space-y-4">
					<button
						onClick={() => window.location.reload()}
						className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
					>
						Try Again
					</button>

					<button
						onClick={() => window.history.back()}
						className="w-full border border-border text-foreground px-4 py-2 rounded-md hover:bg-accent transition-colors"
					>
						Go Back
					</button>
				</div>

				<div className="mt-8 p-4 bg-accent rounded-lg">
					<h3 className="font-semibold text-sm mb-2">Offline Features Available:</h3>
					<ul className="text-sm text-muted-foreground space-y-1">
						<li>• View and edit cached flows</li>
						<li>• Create new nodes and connections</li>
						<li>• Changes will sync when online</li>
					</ul>
				</div>
			</div>
		</div>
	);
}
