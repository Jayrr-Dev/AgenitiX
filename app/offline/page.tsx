"use client";

export default function OfflinePage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<div className="mx-auto max-w-md p-8 text-center">
				<div className="mb-8">
					<svg
						className="mx-auto mb-4 h-24 w-24 text-gray-400"
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

				<h1 className="mb-4 font-bold text-2xl text-foreground">You're Offline</h1>

				<p className="mb-6 text-muted-foreground">
					It looks like you've lost your internet connection. Don't worry, you can still use the
					flow editor with your cached data.
				</p>

				<div className="space-y-4">
					<button
						onClick={() => window.location.reload()}
						className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
					>
						Try Again
					</button>

					<button
						onClick={() => window.history.back()}
						className="w-full rounded-md border border-border px-4 py-2 text-foreground transition-colors hover:bg-accent"
					>
						Go Back
					</button>
				</div>

				<div className="mt-8 rounded-lg bg-accent p-4">
					<h3 className="mb-2 font-semibold text-sm">Offline Features Available:</h3>
					<ul className="space-y-1 text-muted-foreground text-sm">
						<li>• View and edit cached flows</li>
						<li>• Create new nodes and connections</li>
						<li>• Changes will sync when online</li>
					</ul>
				</div>
			</div>
		</div>
	);
}
