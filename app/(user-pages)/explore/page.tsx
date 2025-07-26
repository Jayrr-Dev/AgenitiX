/**
 * EXPLORE PAGE - Discover public flows from the community
 *
 * • Browse public flows from other users
 * • Search and filter public flows
 * • View flow details and access public flows
 * • Secure access control for public flows
 * • Responsive design with modern UI
 *
 * Keywords: explore, public-flows, discovery, community, search, access-control
 */

"use client";

import { Loading } from "@/components/Loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
	Activity, 
	Bot, 
	Code, 
	Database, 
	Globe, 
	Mail, 
	MessageSquare, 
	Settings, 
	Users, 
	Zap,
	Search,
	Eye,
	ExternalLink,
	Calendar,
	User
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthContext } from "@/components/auth/AuthProvider";

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

const ExplorePage = () => {
	const [searchQuery, setSearchQuery] = useState("");
	const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();

	// Fetch public flows
	const publicFlows = useQuery(
		api.flows.getPublicFlows,
		user?.id ? { user_id: user.id, limit: 50 } : { limit: 50 }
	);

	// Loading state
	if (authLoading || publicFlows === undefined) {
		return <Loading />;
	}

	// Filter flows based on search
	const filteredFlows = publicFlows.filter(flow => {
		if (!searchQuery) return true;
		return flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			   (flow.description && flow.description.toLowerCase().includes(searchQuery.toLowerCase()));
	});

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
				{/* Header */}
				<div className="mb-8">
					<div className="flex flex-col gap-6">
						<div className="flex items-center justify-between">
							<div>
								<h1 className="text-3xl font-bold text-foreground mb-2">Explore Flows</h1>
								<p className="text-muted-foreground">
									Discover public automation workflows from the community
								</p>
							</div>
							<Link href="/dashboard">
								<Button variant="outline">My Flows</Button>
							</Link>
						</div>

						{/* Search */}
						<div className="flex items-center gap-4 max-w-md">
							<div className="relative flex-1">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
								<Input
									placeholder="Search public flows..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-10"
								/>
							</div>
							<div className="text-sm text-muted-foreground">
								{filteredFlows.length} flows
							</div>
						</div>
					</div>
				</div>

				{/* Flows Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{filteredFlows.map((flow) => (
						<Card key={flow._id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-3">
										<div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
											{getIconComponent(flow.icon || "zap")}
										</div>
										<div className="flex-1 min-w-0">
											<h3 className="font-semibold text-lg truncate text-foreground">
												{flow.name}
											</h3>
											<div className="flex items-center gap-2 mt-1">
												<Badge 
													variant="default"
													className="text-xs bg-green-100 text-green-700 border-green-200"
												>
													<Eye className="w-3 h-3 mr-1" />
													Public
												</Badge>
											</div>
										</div>
									</div>
								</div>
							</CardHeader>

							<CardContent className="space-y-4">
								{/* Description */}
								{flow.description && (
									<p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
										{flow.description}
									</p>
								)}

								{/* Metadata */}
								<div className="flex items-center gap-4 text-xs text-muted-foreground">
									<div className="flex items-center gap-1">
										<Calendar className="w-3 h-3" />
										{formatDate(flow.updated_at)}
									</div>
									<div className="flex items-center gap-1">
										<User className="w-3 h-3" />
										Creator
									</div>
								</div>

								<Separator />

								{/* Actions */}
								<div className="flex items-center justify-between">
									<div className="text-xs text-muted-foreground">
										View only access
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

				{/* Empty States */}
				{publicFlows.length === 0 ? (
					<div className="text-center py-16">
						<div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
							<Globe className="w-12 h-12 text-muted-foreground" />
						</div>
						<h3 className="text-2xl font-semibold text-foreground mb-3">
							No public flows yet
						</h3>
						<p className="text-muted-foreground mb-8 max-w-md mx-auto">
							Be the first to share a public flow with the community!
						</p>
						<Link href="/dashboard">
							<Button>Create a Flow</Button>
						</Link>
					</div>
				) : filteredFlows.length === 0 ? (
					<div className="text-center py-16">
						<div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
							<Search className="w-12 h-12 text-muted-foreground" />
						</div>
						<h3 className="text-xl font-semibold text-foreground mb-3">
							No flows found
						</h3>
						<p className="text-muted-foreground mb-6 max-w-md mx-auto">
							No public flows match "{searchQuery}". Try adjusting your search terms.
						</p>
						<Button 
							variant="outline"
							onClick={() => setSearchQuery("")}
						>
							Clear Search
						</Button>
					</div>
				) : null}
			</div>
		</div>
	);
};

export default ExplorePage;