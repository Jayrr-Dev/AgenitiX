/**
 * CREATE FLOW MODAL - Modal for creating new automation workflows
 *
 * • Form with name, description, icon, and privacy settings
 * • Real-time validation and error handling
 * • Secure user authentication integration
 * • Responsive design with modern UI components
 * • Full Convex database integration
 *
 * Keywords: modal, form, flow-creation, validation, authentication, responsive, convex
 */

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
	Dialog, 
	DialogContent, 
	DialogDescription, 
	DialogFooter, 
	DialogHeader, 
	DialogTitle 
} from "@/components/ui/dialog";
import { 
	// General & Automation
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
	Lock,
	Eye,
	// Business & Finance
	TrendingUp,
	DollarSign,
	CreditCard,
	PieChart,
	BarChart3,
	Calculator,
	Briefcase,
	Building,
	// Communication & Social
	Phone,
	Video,
	Mic,
	Share2,
	Send,
	Bell,
	Heart,
	Star,
	// Data & Analytics
	FileText,
	FolderOpen,
	Download,
	Upload,
	Search,
	Filter,
	Archive,
	// Technology & Development
	Terminal,
	GitBranch,
	Cpu,
	HardDrive,
	Wifi,
	Monitor,
	Cloud,
	// Creative & Media
	Image,
	Camera,
	Palette,
	Music,
	Play,
	Pause,
	Volume2,
	Edit,
	// Tools & Utilities
	Wrench,
	Hammer,
	Scissors,
	Paperclip,
	Calendar,
	Clock,
	Timer,
	// Navigation & Movement
	ArrowRight,
	ArrowUp,
	ArrowDown,
	Navigation,
	MapPin,
	Route,
	Compass,
	// General
	CheckCircle,
	Info
} from "lucide-react";
import { useState } from "react";
import type { CreateFlowRequest } from "../types";

// ICON OPTIONS ORGANIZED BY CATEGORIES - Exactly 8 categories with 8 icons each
const ICON_CATEGORIES = {
	popular: {
		label: "Popular",
		icons: [
			{ value: "zap", label: "Lightning", icon: Zap },
			{ value: "bot", label: "Bot", icon: Bot },
			{ value: "mail", label: "Mail", icon: Mail },
			{ value: "database", label: "Database", icon: Database },
			{ value: "settings", label: "Settings", icon: Settings },
			{ value: "users", label: "Users", icon: Users },
			{ value: "activity", label: "Activity", icon: Activity },
			{ value: "globe", label: "Globe", icon: Globe },
		]
	},
	business: {
		label: "Business",
		icons: [
			{ value: "trendingUp", label: "Trending", icon: TrendingUp },
			{ value: "dollarSign", label: "Dollar", icon: DollarSign },
			{ value: "creditCard", label: "Payment", icon: CreditCard },
			{ value: "pieChart", label: "Pie Chart", icon: PieChart },
			{ value: "barChart3", label: "Bar Chart", icon: BarChart3 },
			{ value: "calculator", label: "Calculator", icon: Calculator },
			{ value: "briefcase", label: "Briefcase", icon: Briefcase },
			{ value: "building", label: "Building", icon: Building },
		]
	},
	communication: {
		label: "Social",
		icons: [
			{ value: "message", label: "Message", icon: MessageSquare },
			{ value: "phone", label: "Phone", icon: Phone },
			{ value: "video", label: "Video", icon: Video },
			{ value: "share2", label: "Share", icon: Share2 },
			{ value: "send", label: "Send", icon: Send },
			{ value: "bell", label: "Bell", icon: Bell },
			{ value: "heart", label: "Heart", icon: Heart },
			{ value: "star", label: "Star", icon: Star },
		]
	},
	data: {
		label: "Data",
		icons: [
			{ value: "fileText", label: "File", icon: FileText },
			{ value: "folderOpen", label: "Folder", icon: FolderOpen },
			{ value: "download", label: "Download", icon: Download },
			{ value: "upload", label: "Upload", icon: Upload },
			{ value: "search", label: "Search", icon: Search },
			{ value: "filter", label: "Filter", icon: Filter },
			{ value: "archive", label: "Archive", icon: Archive },
			{ value: "checkCircle", label: "Check", icon: CheckCircle },
		]
	},
	technology: {
		label: "Tech",
		icons: [
			{ value: "code", label: "Code", icon: Code },
			{ value: "terminal", label: "Terminal", icon: Terminal },
			{ value: "gitBranch", label: "Git", icon: GitBranch },
			{ value: "cpu", label: "CPU", icon: Cpu },
			{ value: "hardDrive", label: "Storage", icon: HardDrive },
			{ value: "wifi", label: "WiFi", icon: Wifi },
			{ value: "cloud", label: "Cloud", icon: Cloud },
			{ value: "monitor", label: "Monitor", icon: Monitor },
		]
	},
	tools: {
		label: "Tools",
		icons: [
			{ value: "wrench", label: "Wrench", icon: Wrench },
			{ value: "hammer", label: "Hammer", icon: Hammer },
			{ value: "scissors", label: "Scissors", icon: Scissors },
			{ value: "edit", label: "Edit", icon: Edit },
			{ value: "calendar", label: "Calendar", icon: Calendar },
			{ value: "clock", label: "Clock", icon: Clock },
			{ value: "timer", label: "Timer", icon: Timer },
			{ value: "paperclip", label: "Clip", icon: Paperclip },
		]
	},
	media: {
		label: "Media",
		icons: [
			{ value: "image", label: "Image", icon: Image },
			{ value: "camera", label: "Camera", icon: Camera },
			{ value: "palette", label: "Palette", icon: Palette },
			{ value: "music", label: "Music", icon: Music },
			{ value: "play", label: "Play", icon: Play },
			{ value: "pause", label: "Pause", icon: Pause },
			{ value: "volume2", label: "Volume", icon: Volume2 },
			{ value: "mic", label: "Mic", icon: Mic },
		]
	},
	navigation: {
		label: "Navigate",
		icons: [
			{ value: "navigation", label: "Navigation", icon: Navigation },
			{ value: "mapPin", label: "Location", icon: MapPin },
			{ value: "route", label: "Route", icon: Route },
			{ value: "compass", label: "Compass", icon: Compass },
			{ value: "arrowRight", label: "Arrow Right", icon: ArrowRight },
			{ value: "arrowUp", label: "Arrow Up", icon: ArrowUp },
			{ value: "arrowDown", label: "Arrow Down", icon: ArrowDown },
			{ value: "info", label: "Info", icon: Info },
		]
	}
};

interface CreateFlowModalProps {
	isOpen: boolean;
	onClose: () => void;
	onFlowCreated: (flowData: {
		name: string;
		description?: string;
		icon?: string;
		private: boolean;
	}) => Promise<void>;
}

export const CreateFlowModal: React.FC<CreateFlowModalProps> = ({
	isOpen,
	onClose,
	onFlowCreated,
}) => {
	const [formData, setFormData] = useState<CreateFlowRequest>({
		name: "",
		description: "",
		icon: "zap",
		private: true,
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [activeIconTab, setActiveIconTab] = useState("popular");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError(null);

		try {
			// Pass the form data to the parent component
			await onFlowCreated({
				name: formData.name,
				description: formData.description,
				icon: formData.icon,
				private: formData.private,
			});

			// Only close and reset if successful
			onClose();
			setFormData({
				name: "",
				description: "",
				icon: "zap",
				private: true,
			});
		} catch (err) {
			console.error("Error creating flow:", err);
			setError(err instanceof Error ? err.message : "Failed to create flow. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleInputChange = (field: keyof CreateFlowRequest, value: string | boolean) => {
		setFormData(prev => ({
			...prev,
			[field]: value,
		}));
		// Clear error when user starts typing
		if (error) setError(null);
	};



	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Create New Flow</DialogTitle>
					<DialogDescription>
						Set up your new automation workflow with a name, description, and privacy settings.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Name Field */}
					<div className="space-y-2">
						<Label htmlFor="name">Flow Name *</Label>
						<Input
							id="name"
							value={formData.name}
							onChange={(e) => handleInputChange("name", e.target.value)}
							placeholder="Enter flow name..."
							required
							minLength={1}
							maxLength={12}
							disabled={isSubmitting}
						/>
						<div className="text-xs text-muted-foreground text-right">
							{formData.name.length}/12 characters
						</div>
					</div>

					{/* Description Field */}
					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							value={formData.description}
							onChange={(e) => handleInputChange("description", e.target.value)}
							placeholder="Describe what this flow does..."
							rows={3}
							maxLength={200}
							disabled={isSubmitting}
						/>
						<div className="text-xs text-muted-foreground text-right">
							{formData.description.length}/200 characters
						</div>
					</div>

					{/* Icon Selection */}
					<div className="space-y-3">
						<Label>Flow Icon</Label>
						<Tabs value={activeIconTab} onValueChange={setActiveIconTab} className="w-full">
							<TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 h-auto p-1">
								{Object.entries(ICON_CATEGORIES).map(([key, category]) => (
									<TabsTrigger 
										key={key} 
										value={key}
										className="text-xs px-1.5 py-2 h-auto font-medium"
									>
										{category.label}
									</TabsTrigger>
								))}
							</TabsList>
							
							{Object.entries(ICON_CATEGORIES).map(([key, category]) => (
								<TabsContent key={key} value={key} className="mt-4">
									<div className="grid grid-cols-4 grid-rows-2 gap-3 p-1">
										{category.icons.map((option) => {
											const IconComponent = option.icon;
											const isSelected = formData.icon === option.value;
											
											return (
												<button
													key={option.value}
													type="button"
													onClick={() => handleInputChange("icon", option.value)}
													disabled={isSubmitting}
													className={`group relative p-3 rounded-xl border-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 hover:shadow-lg ${
														isSelected
															? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20"
															: "border-border hover:border-primary/50 hover:bg-primary/5"
													}`}
													title={option.label}
												>
													<IconComponent className={`w-6 h-6 mx-auto transition-colors ${
														isSelected ? "text-primary" : "text-foreground group-hover:text-primary"
													}`} />
													<p className={`text-xs mt-2 text-center truncate transition-colors ${
														isSelected ? "text-primary font-medium" : "text-muted-foreground group-hover:text-foreground"
													}`}>
														{option.label}
													</p>
												</button>
											);
										})}
									</div>
								</TabsContent>
							))}
						</Tabs>
					</div>

					{/* Privacy Settings */}
					<div className="space-y-3">
						<Label>Privacy Settings</Label>
						<Card className={`border-2 transition-all duration-200 hover:shadow-md ${
							formData.private 
								? "border-orange-200 bg-orange-50/30 hover:border-orange-300" 
								: "border-green-200 bg-green-50/30 hover:border-green-300"
						}`}>
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div className="space-y-2">
										<div className="flex items-center gap-3">
											<div className={`p-1.5 rounded-full transition-colors ${
												formData.private 
													? "bg-orange-100 text-orange-600" 
													: "bg-green-100 text-green-600"
											}`}>
												{formData.private ? (
													<Lock className="w-3 h-3" />
												) : (
													<Eye className="w-3 h-3" />
												)}
											</div>
											<span className="font-semibold text-base">
												{formData.private ? "Private Flow" : "Public Flow"}
											</span>
											<Badge 
												variant={formData.private ? "secondary" : "default"} 
												className={`text-xs ${
													formData.private 
														? "bg-orange-100 text-orange-800 border-orange-200" 
														: "bg-green-100 text-green-800 border-green-200"
												}`}
											>
												{formData.private ? "Only you" : "Everyone"}
											</Badge>
										</div>
										<p className="text-sm text-muted-foreground leading-relaxed">
											{formData.private
												? "This flow will only be visible to you and cannot be shared with others"
												: "This flow will be visible to everyone and can be shared publicly"}
										</p>
									</div>
									<div className="flex flex-col items-center gap-2">
										<Switch
											checked={!formData.private}
											onCheckedChange={(checked) => handleInputChange("private", !checked)}
											disabled={isSubmitting}
											className={`transition-all duration-200 ${
												!formData.private 
													? "data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600" 
													: "data-[state=unchecked]:bg-orange-500 data-[state=unchecked]:border-orange-500"
											}`}
										/>
										<span className={`text-xs font-medium transition-colors ${
											formData.private 
												? "text-orange-600" 
												: "text-green-600"
										}`}>
											{formData.private ? "Private" : "Public"}
										</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Error Display */}
					{error && (
						<div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
							<p className="text-sm text-destructive">{error}</p>
						</div>
					)}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting || !formData.name.trim()}
						>
							{isSubmitting ? "Creating..." : "Create Flow"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}; 