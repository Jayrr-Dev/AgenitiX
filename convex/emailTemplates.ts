/**
 * Route: convex/emailTemplates.ts
 * EMAIL TEMPLATES CONVEX QUERIES - User template management
 *
 * • CRUD operations for email templates with user authentication
 * • Template loading, saving, and listing with filters
 * • Supports HTML content, variables, and metadata
 * • Category-based organization and search functionality
 *
 * Keywords: convex, email-templates, crud, user-auth, template-management
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Get all email templates for the current user
 */
export const getUserEmailTemplates = query({
  args: {
    category: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) return [];
    
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return [];
    }

    // Build query for user's templates
    let templatesQuery = ctx.db
      .query("email_templates")
      .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
      .filter((q) => q.eq(q.field("is_active"), true));

    // Filter by category if provided
    if (args.category) {
      templatesQuery = templatesQuery.filter((q) => 
        q.eq(q.field("category"), args.category)
      );
    }

    const templates = await templatesQuery.collect();

    // Apply text search filter if provided
    let filteredTemplates = templates;
    if (args.search) {
      const searchTerm = args.search.toLowerCase();
      filteredTemplates = templates.filter(template => 
        template.name.toLowerCase().includes(searchTerm) ||
        template.subject.toLowerCase().includes(searchTerm) ||
        (template.category && template.category.toLowerCase().includes(searchTerm))
      );
    }

    // Sort by updated_at descending (most recent first)
    filteredTemplates.sort((a, b) => b.updated_at - a.updated_at);

    return filteredTemplates.map((template) => ({
      id: template._id,
      name: template.name,
      subject: template.subject,
      htmlContent: template.html_content,
      textContent: template.text_content || "",
      variables: template.variables,
      category: template.category || "general",
      createdAt: template.created_at,
      updatedAt: template.updated_at,
    }));
  },
});

/**
 * Get template categories for the current user
 */
export const getUserTemplateCategories = query({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) return [];
    
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return [];
    }

    const templates = await ctx.db
      .query("email_templates")
      .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();

    // Extract unique categories with counts
    const categoryMap = new Map<string, number>();
    templates.forEach(template => {
      const category = template.category || "general";
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    return Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
  },
});

/**
 * Save or update an email template
 */
export const saveEmailTemplate = mutation({
  args: {
    id: v.optional(v.id("email_templates")),
    name: v.string(),
    subject: v.string(),
    htmlContent: v.string(),
    textContent: v.optional(v.string()),
    variables: v.array(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    const templateData = {
      user_id: user._id,
      name: args.name,
      subject: args.subject,
      html_content: args.htmlContent,
      text_content: args.textContent || "",
      variables: args.variables,
      category: args.category || "general",
      is_active: true,
      updated_at: now,
    };

    let templateId;
    if (args.id) {
      // Update existing template
      const existingTemplate = await ctx.db.get(args.id);
      if (!existingTemplate || existingTemplate.user_id !== user._id) {
        throw new Error("Template not found or access denied");
      }
      
      await ctx.db.patch(args.id, templateData);
      templateId = args.id;
    } else {
      // Create new template
      templateId = await ctx.db.insert("email_templates", {
        ...templateData,
        created_at: now,
      });
    }

    return {
      success: true,
      templateId,
      isUpdate: !!args.id,
    };
  },
});

/**
 * Delete an email template
 */
export const deleteEmailTemplate = mutation({
  args: {
    id: v.id("email_templates"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const template = await ctx.db.get(args.id);
    if (!template || template.user_id !== user._id) {
      throw new Error("Template not found or access denied");
    }

    // Soft delete by setting is_active to false
    await ctx.db.patch(args.id, {
      is_active: false,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get a specific template by ID
 */
export const getEmailTemplateById = query({
  args: {
    id: v.id("email_templates"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) return null;
    
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return null;
    }

    const template = await ctx.db.get(args.id);
    if (!template || template.user_id !== user._id || !template.is_active) {
      return null;
    }

    return {
      id: template._id,
      name: template.name,
      subject: template.subject,
      htmlContent: template.html_content,
      textContent: template.text_content || "",
      variables: template.variables,
      category: template.category || "general",
      createdAt: template.created_at,
      updatedAt: template.updated_at,
    };
  },
});
