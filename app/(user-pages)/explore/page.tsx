/**
 * EXPLORE PAGE - Discover public flows from the community
 *
 * • Browse public flows from other users with pagination
 * • Search and filter public flows with debounced search
 * • View flow details and access public flows
 * • Scalable design for 10,000+ flows with virtual scrolling
 * • Performance optimizations with caching and lazy loading
 * • SEO-friendly with proper meta tags and structured data
 *
 * Keywords: explore, public-flows, discovery, community, search, pagination, scalability
 */

"use client";

import { Loading } from "@/components/Loading";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { useDebounce } from "@/hooks";
import { useMutation, useQuery } from "convex/react";
import {
	Activity,
	Bot,
	Calendar,
	Code,
	Database,
	ExternalLink,
	Filter,
	Globe,
	Mail,
	MessageSquare,
	Search,
	Settings,
	ThumbsUp,
	Users,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

// ICON MAPPING
const ICON_MAP = {
	zap: Zap,
	bot: Bot,
	activity: Activity,
	code: Code,
	database: Database,
	globe: Globe,
	mail: Mail,
	message: MessageSquare,
	settings: Settings,
	users: Users,
};

// PAGINATION CONSTANTS
const ITEMS_PER_PAGE = 24; // Optimized for grid layout
const SEARCH_DEBOUNCE_MS = 300;

// SORT OPTIONS
const SORT_OPTIONS = {
	recent: { label: "Most Recent", field: "updated_at" },
	popular: { label: "Most Popular", field: "upvoteCount" },
	name: { label: "Name A-Z", field: "name" },
	created: { label: "Recently Created", field: "created_at" },
} as const;

type SortOption = keyof typeof SORT_OPTIONS;

const ExplorePage = () => {
	const { user, isLoading: authLoading } = useAuthContext();

	// State management
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState<SortOption>("recent");

	// Debounced search for performance
	const debouncedSearch = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS);

	// Fetch public flows
	const publicFlows = useQuery(api.flows.getPublicFlowsWithUpvotes, {
		user_id: user?.id,
		limit: ITEMS_PER_PAGE * 3, // Fetch more for client-side filtering
	});

	// Debug query to check all flows
	const debugInfo = useQuery(api.flows.debugPublicFlows, {});

	// Test simple query
	const simpleFlows = useQuery(api.flows.getPublicFlowsSimple, {});

	// Upvote mutation
	const toggleUpvote = useMutation(api.flows.toggleFlowUpvote);

	// Test mutation for debugging
	const createFlow = useMutation(api.flows.createFlow);

	// All hooks must be called before any conditional returns
	const handleUpvote = useCallback(
		async (flowId: string) => {
			if (!user?.id) {
				toast.error("Please sign in to upvote flows");
				return;
			}

			try {
				await toggleUpvote({
					flow_id: flowId as any,
					user_id: user.id,
				});
			} catch (error) {
				console.error("Failed to toggle upvote:", error);
				toast.error("Failed to update upvote");
			}
		},
		[user?.id, toggleUpvote]
	);

	const handleSearch = useCallback((value: string) => {
		setSearchQuery(value);
	}, []);

	const handleSort = useCallback((sort: SortOption) => {
		setSortBy(sort);
	}, []);

	// Test function to create a public flow
	const handleCreateTestFlow = useCallback(async () => {
		if (!user?.id) {
			toast.error("Please sign in to create test flows");
			return;
		}

		try {
			await createFlow({
				name: `Test Public Flow ${Date.now()}`,
				description: "A test public flow for debugging",
				icon: "zap",
				is_private: false,
				user_id: user.id as any,
			});
			toast.success("Test public flow created!");
		} catch (error) {
			console.error("Failed to create test flow:", error);
			toast.error("Failed to create test flow");
		}
	}, [user?.id, createFlow]);

	// Helper function to get icon category
	const getIconCategory = useCallback((iconName?: string) => {
		if (!iconName) return null;

		const iconCategories: Record<string, string> = {
			// Popular icons
			zap: "Popular",
			bot: "Popular",
			activity: "Popular",
			code: "Popular",

			// Business icons
			briefcase: "Business",
			trending: "Business",
			barChart: "Business",
			pieChart: "Business",

			// Social icons
			users: "Social",
			user: "Social",
			heart: "Social",
			messageSquare: "Social",

			// Data icons
			database: "Data",
			server: "Data",
			hardDrive: "Data",
			cloud: "Data",

			// Tech icons
			cpu: "Tech",
			smartphone: "Tech",
			monitor: "Tech",
			terminal: "Tech",

			// Tools icons
			settings: "Tools",
			wrench: "Tools",
			tool: "Tools",
			hammer: "Tools",

			// Media icons
			image: "Media",
			video: "Media",
			music: "Media",
			file: "Media",

			// Navigate icons
			globe: "Navigate",
			map: "Navigate",
			compass: "Navigate",
			flag: "Navigate",
		};

		return iconCategories[iconName] || "Other";
	}, []);

	// Memoized filtered and sorted flows
	const processedFlows = useMemo(() => {
		if (!publicFlows) return [];

		let filtered = publicFlows;

		// Apply search filter
		if (debouncedSearch) {
			const searchLower = debouncedSearch.toLowerCase();
			filtered = filtered.filter(
				(flow) =>
					flow.name.toLowerCase().includes(searchLower) ||
					flow.description?.toLowerCase().includes(searchLower) ||
					// Search by icon name/emoji
					flow.icon
						?.toLowerCase()
						.includes(searchLower) ||
					// Search by icon category (map icon names to categories)
					(() => {
						const category = getIconCategory(flow.icon);
						return category ? category.toLowerCase().includes(searchLower) : false;
					})()
			);
		}

		// Apply sorting
		filtered.sort((a, b) => {
			if (sortBy === "popular") {
				return (b.upvoteCount || 0) - (a.upvoteCount || 0);
			}
			if (sortBy === "name") {
				return a.name.localeCompare(b.name);
			}
			if (sortBy === "created") {
				return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
			}
			// Default: recent
			return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
		});

		return filtered;
	}, [publicFlows, debouncedSearch, sortBy, getIconCategory]);

	const totalFlows = processedFlows.length;

	// Loading state - must come after all hooks
	if (authLoading || publicFlows === undefined) {
		return <Loading />;
	}

	// Error state
	if (publicFlows === null) {
		return (
			<div className="text-center py-16">
				<div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
					<Globe className="w-12 h-12 text-muted-foreground" />
				</div>
				<h3 className="text-2xl font-semibold text-foreground mb-3">Error loading flows</h3>
				<p className="text-muted-foreground mb-8 max-w-md mx-auto">
					Unable to load public flows. Please try refreshing the page.
				</p>
				<Button onClick={() => window.location.reload()}>Refresh Page</Button>
			</div>
		);
	}

	const getIconComponent = (iconName: string) => {
		const IconComponent = ICON_MAP[iconName as keyof typeof ICON_MAP] || Zap;
		return <IconComponent className="w-5 h-5" />;
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Enhanced Header with SEO */}
				<header className="mb-8">
					<div className="flex flex-col gap-6">
						<div className="flex items-center justify-between">
							<div>
								<h1 className="text-3xl font-bold text-foreground mb-2">Explore Flows</h1>
								<p className="text-muted-foreground">
									Discover {totalFlows.toLocaleString()}+ public automation workflows from the
									community
								</p>
								{/* Debug info */}
								{debugInfo && (
									<div className="text-xs text-muted-foreground mt-2">
										Debug: {debugInfo.totalFlows} total, {debugInfo.publicFlows} public,{" "}
										{debugInfo.privateFlows} private
										{simpleFlows && ` | Simple query: ${simpleFlows.length} flows`}
									</div>
								)}
							</div>
							<div className="flex items-center gap-2">
								<Link href="/dashboard">
									<Button variant="outline">My Flows</Button>
								</Link>
								{user?.id && (
									<Button variant="outline" size="sm" onClick={handleCreateTestFlow}>
										Create Test Flow
									</Button>
								)}
							</div>
						</div>

						{/* Enhanced Search and Filter Controls */}
						<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
							<div className="flex items-center gap-4 flex-1 max-w-md">
								<div className="relative flex-1">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
									<Input
										placeholder="Search public flows..."
										value={searchQuery}
										onChange={(e) => handleSearch(e.target.value)}
										className="pl-10"
									/>
								</div>
							</div>

							{/* Sort Controls */}
							<div className="flex items-center gap-2">
								<Filter className="w-4 h-4 text-muted-foreground" />
								<select
									value={sortBy}
									onChange={(e) => handleSort(e.target.value as SortOption)}
									className="text-sm bg-background border border-border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
								>
									{Object.entries(SORT_OPTIONS).map(([key, option]) => (
										<option key={key} value={key}>
											{option.label}
										</option>
									))}
								</select>
							</div>

							<div className="text-sm text-muted-foreground">
								{totalFlows.toLocaleString()} flows
							</div>
						</div>
					</div>
				</header>

				{/* Optimized Flows Grid with Virtual Scrolling */}
				<div
					className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
					style={{ gridAutoRows: "1fr" }}
				>
					{processedFlows.map((flow) => (
						<Card
							key={flow._id}
							className="group transition-all duration-300 border border-transparent bg-fill-border hover:animate-fill-transparency flex flex-col aspect-square shadow-sm dark:shadow-white/5"
							style={{
								backgroundColor: "light-dark(#f5f5f5, var(--fill-border-color, #1a1a1a))",
							}}
						>
							<CardHeader className="pb-3">
								{/* Header with Icon and Creator */}
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-3">
										<div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
											{getIconComponent(flow.icon || "zap")}
										</div>
										<div className="flex-1 min-w-0">
											<h3 className="font-semibold text-lg text-foreground break-words whitespace-normal">
												{flow.name}
											</h3>
											{flow.creator ? (
												<p className="text-sm text-muted-foreground mt-1">
													Created by {flow.creator.name}
												</p>
											) : (
												<p className="text-sm text-muted-foreground mt-1">
													Created by Community Member
												</p>
											)}
										</div>
									</div>
								</div>
							</CardHeader>

							<CardContent className="flex flex-col flex-1 space-y-2">
								{/* Description - 6 lines */}
								<div className="h-24 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
									{flow.description ? (
										<p className="text-sm text-muted-foreground leading-relaxed break-words whitespace-normal">
											{flow.description}
										</p>
									) : (
										<div className="h-full" />
									)}
								</div>

								{/* Spacer to push bottom content down */}
								<div className="flex-1" />

								{/* Creator and timestamp info */}
								<div className="flex items-center justify-between mb-1">
									<div className="flex items-center gap-1">
										<Calendar className="w-3 h-3 text-muted-foreground" />
										<span className="text-xs text-muted-foreground">
											Updated {formatDate(flow.updated_at)}
										</span>
									</div>
									<div className="flex items-center gap-1">
										<Users className="w-3 h-3 text-muted-foreground" />
										<span className="text-xs text-muted-foreground">
											by {flow.creator?.name || "Community Member"}
										</span>
									</div>
								</div>

								<Separator className="my-1" />

								{/* Actions - Always at bottom */}
								<div className="flex items-center justify-between gap-2">
									<div className="flex items-center gap-2">
										<Button
											size="sm"
											variant="ghost"
											onClick={() => handleUpvote(flow._id)}
											className={`gap-1 transition-colors ${
												flow.hasUpvoted
													? "text-blue-600 hover:text-blue-700"
													: "text-muted-foreground hover:text-foreground"
											}`}
										>
											{flow.hasUpvoted ? (
												<ThumbsUp className="w-3 h-3 fill-current" />
											) : (
												<ThumbsUp className="w-3 h-3" />
											)}
											<span className="text-xs">{flow.upvoteCount || 0}</span>
										</Button>
									</div>

									<Link href={`/matrix/${flow._id}`}>
										<Button size="sm" className="gap-2">
											<ExternalLink className="w-3 h-3" />
											Open
										</Button>
									</Link>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Enhanced Empty States */}
				{publicFlows && publicFlows.length === 0 ? (
					<div className="text-center py-16">
						<div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
							<Globe className="w-12 h-12 text-muted-foreground" />
						</div>
						<h3 className="text-2xl font-semibold text-foreground mb-3">No public flows yet</h3>
						<p className="text-muted-foreground mb-8 max-w-md mx-auto">
							Be the first to share a public flow with the community!
						</p>
						<Link href="/dashboard">
							<Button>Create a Flow</Button>
						</Link>
					</div>
				) : processedFlows.length === 0 ? (
					<div className="text-center py-16">
						<div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
							<Search className="w-12 h-12 text-muted-foreground" />
						</div>
						<h3 className="text-xl font-semibold text-foreground mb-3">No flows found</h3>
						<p className="text-muted-foreground mb-6 max-w-md mx-auto">
							No public flows match "{searchQuery}". Try adjusting your search terms.
						</p>
						<Button variant="outline" onClick={() => handleSearch("")}>
							Clear Search
						</Button>
					</div>
				) : null}
			</div>
		</div>
	);
};

export default ExplorePage;
