/**
 * STARTER TEMPLATES - Component for displaying and managing starter templates
 *
 * • Shows available starter templates for new users
 * • Allows adding starter templates for existing users
 * • Visual preview of template workflows
 * • One-click template installation
 * • Progress feedback during template creation
 * • Responsive card layout with descriptions
 *
 * Keywords: starter-templates, onboarding, workflow-templates, user-experience
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "convex/react";
import { Database, Mail, Rocket } from "lucide-react";
import { useState } from "react";

interface StarterTemplatesProps {
  	userId: Id<"users">;
  onTemplateCreated?: () => void;
}

// Template definitions with icons and descriptions, basically UI configuration
const TEMPLATE_CONFIGS = [
  {
    name: "🚀 Welcome & AI Introduction",
    displayName: "Welcome & AI Introduction",
    description:
      "Learn the basics with text creation and AI interaction. Perfect for getting started with workflows.",
    icon: Rocket,
    color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    iconColor: "text-blue-600",
    features: ["Text Creation", "AI Assistant", "View Components"],
  },
  {
    name: "📧 Email Automation Starter",
    displayName: "Email Automation Starter",
    description:
      "Set up your first email automation workflow. Connect accounts, create templates, and send emails.",
    icon: Mail,
    color: "bg-green-50 border-green-200 hover:bg-green-100",
    iconColor: "text-green-600",
    features: ["Email Account", "Templates", "Automation"],
  },
  {
    name: "📊 Data Processing Basics",
    displayName: "Data Processing Basics",
    description:
      "Learn to create, process, and store data. Work with objects, maps, and storage systems.",
    icon: Database,
    color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
    iconColor: "text-purple-600",
    features: ["Data Creation", "Storage", "Processing"],
  },
];

export default function StarterTemplates({
  userId,
  onTemplateCreated,
}: StarterTemplatesProps) {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);

  // Check if user has starter templates
  const templateStatus = useQuery(api.flows.checkUserHasStarterTemplates, {
    user_id: userId,
  });

  // Mutation to add starter templates for existing users
  const addStarterTemplates = useMutation(api.flows.getStarterTemplatesForUser);

  // Handle adding starter templates, basically one-click template installation
  const handleAddTemplates = async () => {
    if (!userId) return;

    setIsAdding(true);
    try {
      const result = await addStarterTemplates({ user_id: userId });

      if (result.success) {
        toast.success(`Successfully created ${result.templateCount} starter templates.`);
        onTemplateCreated?.();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Failed to add starter templates:", error);
      toast.error("Failed to add starter templates. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  // Loading state
  if (!templateStatus) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Starter Templates
          </CardTitle>
          <CardDescription>Loading template status...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // User already has templates - show existing templates
  if (templateStatus.hasTemplates) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Your Starter Templates
          </CardTitle>
          <CardDescription>
            You have {templateStatus.starterTemplateCount} starter templates
            ready to use
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {(templateStatus?.starterTemplates || []).map((template) => {
              const config = TEMPLATE_CONFIGS.find(
                (c) => c.name === template.name
              );
              if (!config) return null;

              const IconComponent = config.icon;

              return (
                <Card
                  key={template.id}
                  className={`transition-colors ${config.color}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <IconComponent
                        className={`h-5 w-5 ${config.iconColor}`}
                      />
                      <CardTitle className="text-sm">
                        {config.displayName}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Badge variant="secondary" className="text-xs">
                      Ready to use
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  // User doesn't have templates - show option to add them
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5" />
          Get Started with Templates
        </CardTitle>
        <CardDescription>
          Add these helpful workflow templates to get started quickly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template previews */}
        <div className="grid gap-4 md:grid-cols-3">
          {TEMPLATE_CONFIGS.map((template) => {
            const IconComponent = template.icon;

            return (
              <Card
                key={template.name}
                className={`transition-colors ${template.color}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <IconComponent
                      className={`h-5 w-5 ${template.iconColor}`}
                    />
                    <CardTitle className="text-sm">
                      {template.displayName}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1">
                    {template.features.map((feature) => (
                      <Badge
                        key={feature}
                        variant="outline"
                        className="text-xs"
                      >
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Add templates button */}
        <div className="flex justify-center pt-2">
          <Button
            onClick={handleAddTemplates}
            disabled={isAdding}
            size="lg"
            className="min-w-48"
          >
            {isAdding ? "Adding Templates..." : "Add All 3 Templates"}
          </Button>
        </div>

        {/* Help text */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            These templates will be added to your personal workspace and can be
            customized
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
