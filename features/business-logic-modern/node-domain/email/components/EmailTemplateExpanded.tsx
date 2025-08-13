"use client";
/**
 * Route: features/business-logic-modern/node-domain/email/components/EmailTemplateExpanded.tsx
 * EMAIL TEMPLATE – Minimalist expanded view for template management
 *
 * • Clean, focused interface for template editing and management
 * • Consistent styling with EmailMessageExpanded
 * • Template-specific controls: name, category, subject, variables
 * • Designer integration button and preview functionality
 * • Simplified prop handling and state management
 *
 * Keywords: email-template, expanded, minimalist, clean-design, template-management
 */

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Palette, 
  Save, 
  Eye, 
  AlertCircle, 
  CheckCircle,
  Clock,
  FileText,
  Download,
  Search,
  Filter,
  Calendar,
  FolderOpen
} from "lucide-react";
import type { EmailTemplateData } from "../emailTemplate.node";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { STARTER_TEMPLATES, searchStarterTemplates, getStarterTemplatesByCategory } from "../data/starterTemplates";

// Minimalist container styles matching EmailMessageExpanded
const EXPANDED_STYLES = {
  container: "flex flex-col h-full bg-background border border-border rounded-lg",
  header: "pl-2",
  content: "flex-1 flex flex-col min-h-0 border-border p-2",
  footer: "p-3 border-t border-border bg-muted/30",
  disabled: "opacity-75 pointer-events-none",
  // Form element styles matching email components
  label: "text-[10px] text-muted-foreground flex items-center",
  input: "h-6 text-[10px]",
  textarea: "text-[10px] resize-none",
  select: "min-h-6.5 text-[10px] min-w-[107px] max-w-[107px]",
  button: "h-6 text-[10px]",
  helperText: "text-[10px] text-muted-foreground",
} as const;

const TEMPLATE_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "welcome", label: "Welcome" },
  { value: "notification", label: "Notification" },
  { value: "marketing", label: "Marketing" },
  { value: "transactional", label: "Transactional" },
  { value: "support", label: "Support" },
  { value: "newsletter", label: "Newsletter" },
  { value: "custom", label: "Custom" },
];

export interface EmailTemplateExpandedProps {
  nodeId: string;
  nodeData: EmailTemplateData;
  isEnabled: boolean;
  /** Whether the current template configuration is ready for saving */
  canSave?: boolean;
  onTemplateNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCategoryChange: (category: string) => void;
  onSubjectChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onOpenDesigner: () => void;
  onSaveTemplate: () => void;
  /** Load template data into the current node */
  onLoadTemplate?: (template: {
    name: string;
    subject: string;
    htmlContent: string;
    textContent: string;
    variables: string[];
    category: string;
  }) => void;
}

export const EmailTemplateExpanded = React.memo(
  function EmailTemplateExpanded(props: EmailTemplateExpandedProps) {
    const {
      nodeId,
      nodeData,
      isEnabled,
      canSave,
      onTemplateNameChange,
      onCategoryChange,
      onSubjectChange,
      onDescriptionChange,

      onOpenDesigner,
      onSaveTemplate,
      onLoadTemplate,
    } = props;

    const {
      templateName,
      category,
      subject,
      templateDescription,
      variables,
      isSaving,
      lastError,
      lastSaved,
      isActive,
      editorData,
      htmlContent,
      textContent,
      previewData,
    } = nodeData;

    // Status indicators
    const hasContent = Boolean(templateName?.trim() || subject?.trim() || templateDescription?.trim());
    const hasDesignContent = Boolean(editorData && Object.keys(editorData).length > 0);
    const hasTemplateContent = Boolean(htmlContent?.trim() || hasDesignContent);
    const canSaveTemplate = Boolean(isEnabled && templateName?.trim() && !isSaving);

    // Local state for template loading
    const [searchTerm, setSearchTerm] = React.useState("");
    const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
    const [selectedTab, setSelectedTab] = React.useState<"starter" | "saved">("starter");

    // Fetch user templates and categories
    const savedTemplates = useQuery(api.emailTemplates.getUserEmailTemplates, {
      search: searchTerm || undefined,
      category: selectedCategory === "all" ? undefined : selectedCategory,
    });

    const templateCategories = useQuery(api.emailTemplates.getUserTemplateCategories, {});

    // Filter starter templates based on search and category
    const filteredStarterTemplates = React.useMemo(() => {
      let templates = STARTER_TEMPLATES;
      
      // Apply search filter
      if (searchTerm) {
        templates = searchStarterTemplates(searchTerm);
      }
      
      // Apply category filter
      if (selectedCategory !== "all") {
        templates = templates.filter(template => template.category === selectedCategory);
      }
      
      return templates;
    }, [searchTerm, selectedCategory]);

    // Get all categories including starter template categories
    const allCategories = React.useMemo(() => {
      const starterCategories = getStarterTemplatesByCategory();
      const userCategories = templateCategories || [];
      
      const categoryMap = new Map();
      
      // Add starter template categories
      Object.entries(starterCategories).forEach(([category, templates]) => {
        categoryMap.set(category, (categoryMap.get(category) || 0) + templates.length);
      });
      
      // Add user template categories
      userCategories.forEach(cat => {
        categoryMap.set(cat.category, (categoryMap.get(cat.category) || 0) + cat.count);
      });
      
      return Array.from(categoryMap.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);
    }, [templateCategories]);

    // Handle template loading
    const handleLoadTemplate = React.useCallback((template: {
      name: string;
      subject: string;
      htmlContent: string;
      textContent: string;
      variables: string[];
      category: string;
    }) => {
      if (onLoadTemplate) {
        onLoadTemplate(template);
      }
    }, [onLoadTemplate]);

    return (
      <div
        className={`${EXPANDED_STYLES.container} ${isEnabled ? "" : EXPANDED_STYLES.disabled}`}
      >
        {/* Header */}
        <div className={EXPANDED_STYLES.header}>
          {/* <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-[10px] font-medium">Email Template</span>
              {isActive && hasContent && (
                <Badge variant="outline" className="text-[10px]">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              )}
              {isSaving && (
                <Badge variant="secondary" className="text-[10px]">
                  <Clock className="w-3 h-3 mr-1" />
                  Saving...
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {lastSaved && (
                <span className={EXPANDED_STYLES.helperText}>
                  Saved {new Date(lastSaved).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div> */}
          <Separator className="my-1" />
        </div>

        {/* Content */}
        <div className={EXPANDED_STYLES.content}>
          <Tabs variant="node" defaultValue="template" className="flex-1 flex flex-col">
            <TabsList variant="node" className="grid grid-cols-3 w-full">
              <TabsTrigger variant="node" value="template" className="text-[10px]">Template</TabsTrigger>
              <TabsTrigger variant="node" value="design" className="text-[10px]">Design</TabsTrigger>
              <TabsTrigger variant="node" value="load" className="text-[10px]">Load</TabsTrigger>
            </TabsList>

            {/* Template Tab */}
            <TabsContent variant="node" value="template" className="flex-1 space-y-1">
              <div className="grid grid-cols-2 gap-1">
                <div className="space-y-1">
                  <Label htmlFor={`template-name-${nodeId}`} className={EXPANDED_STYLES.label}>Template Name</Label>
                  <div className="border border-border rounded-md">
                  <Input
                    variant="node"
                    id={`template-name-${nodeId}`}
                    placeholder="Enter Name"
                    value={templateName || ""}
                    onChange={onTemplateNameChange}
                    disabled={!isEnabled}
                    className={EXPANDED_STYLES.input}
                  />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`template-category-${nodeId}`} className={EXPANDED_STYLES.label}>Category</Label>
                  <Select
                    value={category || "general"}
                    onValueChange={onCategoryChange}
                    disabled={!isEnabled}
                  >
                    <SelectTrigger id={`template-category-${nodeId}`} className={EXPANDED_STYLES.select}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-background w-16">
                      {TEMPLATE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value} className="text-[10px] ">
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1 ">
                <Label htmlFor={`template-subject-${nodeId}`} className={EXPANDED_STYLES.label}>Subject Line</Label>
                <div className="border border-border rounded-md">
                <Input
                  variant="node"
                  id={`template-subject-${nodeId}`}
                  placeholder="Email subject with {{variables}}"
                  value={subject || ""}
                  onChange={onSubjectChange}
                  disabled={!isEnabled}
                    className={EXPANDED_STYLES.input}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor={`template-description-${nodeId}`} className={EXPANDED_STYLES.label}>Description</Label>
                <Textarea
                  variant="node"
                  id={`template-description-${nodeId}`}
                  placeholder="Template description and usage notes"
                  value={templateDescription || ""}
                  onChange={onDescriptionChange}
                  disabled={!isEnabled}
                  rows={3}
                  className={EXPANDED_STYLES.textarea}
                />
              </div>

              {variables && variables.length > 0 && (
                <div className="space-y-1">
                  <Label className={EXPANDED_STYLES.label}>Variables</Label>
                  <div className="flex flex-wrap gap-2">
                    {variables.map((variable, index) => (
                      <Badge key={index} variant="secondary" className="text-[10px]">
                        {`{{${variable.name}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Design Tab */}
            <TabsContent value="design" className="flex-1 space-y-4">
              <div className="flex flex-col  justify-between">
                <div className="mb-1">
                  <h3 className="text-[10px]  font-medium">Email Designer</h3>
                  <p className={EXPANDED_STYLES.helperText}>
                    Create and edit email templates with MJML
                  </p>
                </div>
                <Button
                  onClick={onOpenDesigner}
                  disabled={!isEnabled}
                  size="sm"
                  className={`gap-2 ${EXPANDED_STYLES.button} w-full `}
                >
                  <Palette className="w-3 h-3" />
                  {hasDesignContent ? "Edit Design" : "Create Design"}
                </Button>
              </div>

              {hasDesignContent && (
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-2 text-[10px]">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Design content created</span>
                  </div>
                  <p className={`${EXPANDED_STYLES.helperText} mt-1`}>
                    Click "Edit Design" to modify your email template
                  </p>
                </div>
              )}

              {!hasDesignContent && (
                <div className="p-4 bg-muted/30 rounded-lg border border-dashed">
                  <div className="text-center space-y-2">
                    <Palette className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground">
                      No design content yet
                    </p>
                    <p className={EXPANDED_STYLES.helperText}>
                      Click "Create Design" to start building your email template
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Load Templates Tab */}
            <TabsContent value="load" className="flex-1 flex flex-col space-y-2">
              {/* Search and Filter Header */}
              <div className="space-y-2">
                <div className="flex flex-col justify-between">
                  <div>
                    <h3 className="text-[10px] font-medium">Load Template</h3>
                    <p className={EXPANDED_STYLES.helperText}>
                      Choose from starter templates or your saved templates
                    </p>
                  </div>
                </div>

                {/* Template Type Tabs */}
                <div className="flex items-center gap-1 bg-muted/30 rounded p-1">
                  <button
                    onClick={() => setSelectedTab("starter")}
                    className={`flex-1 px-2 py-1 text-[10px] rounded transition-colors ${
                      selectedTab === "starter"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Starter Templates ({filteredStarterTemplates.length})
                  </button>
                  <button
                    onClick={() => setSelectedTab("saved")}
                    className={`flex-1 px-2 py-1 text-[10px] rounded transition-colors ${
                      selectedTab === "saved"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    My Templates ({savedTemplates?.length || 0})
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-2 top-1.5 w-3 h-3 text-muted-foreground" />
                  <Input
                    variant="node"
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-6 h-6 text-[10px]"
                  />
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-3 h-3 text-muted-foreground" />
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="h-6 text-[10px] w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      <SelectItem value="all" className="text-[10px]">
                        All ({allCategories.reduce((sum, cat) => sum + cat.count, 0)})
                      </SelectItem>
                      {allCategories.map((cat) => (
                        <SelectItem key={cat.category} value={cat.category} className="text-[10px]">
                          {cat.category} ({cat.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Templates List */}
              <div className="flex-1 overflow-auto space-y-1">
                {selectedTab === "starter" ? (
                  /* Starter Templates */
                  filteredStarterTemplates.length === 0 ? (
                    <div className="text-center py-6">
                      <FolderOpen className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                        No Starter Templates Found
                      </h4>
                      <p className="text-[10px] text-muted-foreground">
                        Try adjusting your search or filter
                      </p>
                    </div>
                  ) : (
                    filteredStarterTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="p-2 border border-border rounded bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                        onClick={() => handleLoadTemplate({
                          name: template.name,
                          subject: template.subject,
                          htmlContent: template.htmlContent,
                          textContent: template.textContent,
                          variables: template.variables,
                          category: template.category,
                        })}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1 min-w-0">
                            <h5 className="text-[10px] font-medium truncate">
                              {template.name}
                            </h5>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {template.subject}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary" className="text-[9px] px-1 py-0">
                              {template.category}
                            </Badge>
                            <Badge variant="outline" className="text-[8px] px-1 py-0">
                              Starter
                            </Badge>
                          </div>
                        </div>
                        <p className="text-[9px] text-muted-foreground mb-2 line-clamp-2">
                          {template.description}
                        </p>
                        <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                          <div className="flex items-center gap-1">
                            {template.tags.slice(0, 2).map((tag, index) => (
                              <span key={index} className="bg-muted/40 px-1 py-0.5 rounded text-[8px]">
                                {tag}
                              </span>
                            ))}
                            {template.tags.length > 2 && (
                              <span className="text-[8px]">+{template.tags.length - 2}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            <span>Load</span>
                          </div>
                        </div>
                        {template.variables.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {template.variables.slice(0, 3).map((variable, index) => (
                              <Badge key={index} variant="outline" className="text-[8px] px-1 py-0">
                                {variable}
                              </Badge>
                            ))}
                            {template.variables.length > 3 && (
                              <Badge variant="outline" className="text-[8px] px-1 py-0">
                                +{template.variables.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )
                ) : (
                  /* Saved Templates */
                  savedTemplates === undefined ? (
                    <div className="text-center py-4">
                      <Clock className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                      <p className="text-[10px] text-muted-foreground">Loading templates...</p>
                    </div>
                  ) : savedTemplates.length === 0 ? (
                    <div className="text-center py-6">
                      <FolderOpen className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                        No Saved Templates Found
                      </h4>
                      <p className="text-[10px] text-muted-foreground">
                        {searchTerm || selectedCategory !== "all" 
                          ? "Try adjusting your search or filter" 
                          : "Save your first template to see it here"
                        }
                      </p>
                    </div>
                  ) : (
                    savedTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="p-2 border border-border rounded bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                        onClick={() => handleLoadTemplate({
                          name: template.name,
                          subject: template.subject,
                          htmlContent: template.htmlContent,
                          textContent: template.textContent,
                          variables: template.variables,
                          category: template.category,
                        })}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1 min-w-0">
                            <h5 className="text-[10px] font-medium truncate">
                              {template.name}
                            </h5>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {template.subject}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-2">
                            {template.category}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(template.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            <span>Load</span>
                          </div>
                        </div>
                        {template.variables.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {template.variables.slice(0, 2).map((variable, index) => (
                              <Badge key={index} variant="outline" className="text-[8px] px-1 py-0">
                                {variable}
                              </Badge>
                            ))}
                            {template.variables.length > 2 && (
                              <Badge variant="outline" className="text-[8px] px-1 py-0">
                                +{template.variables.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className={EXPANDED_STYLES.footer}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {lastError && (
                <div className="flex items-center gap-1 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span className={EXPANDED_STYLES.helperText}>{lastError}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={onSaveTemplate}
                disabled={!canSaveTemplate}
                size="sm"
                className={`gap-2 ${EXPANDED_STYLES.button}`}
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Template"}
              </Button>
            </div>
          </div>
        </div>


      </div>
    );
  },
  (prev, next) => {
    // Compare primitive props
    if (
      prev.isEnabled !== next.isEnabled ||
      prev.canSave !== next.canSave
    ) {
      return false;
    }

    // Compare essential nodeData fields for template
    const keys: (keyof EmailTemplateData)[] = [
      "templateName",
      "category",
      "subject",
      "templateDescription",
      "showPreview",
      "isSaving",
      "lastError",
      "lastSaved",
      "isActive",
      "editorData",
    ];

    return keys.every((key) => prev.nodeData[key] === next.nodeData[key]);
  }
);

export default EmailTemplateExpanded;
