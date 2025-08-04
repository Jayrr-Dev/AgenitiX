/**
 * STARTER TEMPLATES - Automated template provisioning for new users
 *
 * • Defines 3 starter templates for all new users
 * • Welcome Template: Text creation and AI interaction intro
 * • Email Automation Template: Complete email workflow setup
 * • Data Processing Template: Object creation and storage workflow
 * • Automatic provisioning during user signup
 * • Pre-configured nodes, connections, and positioning
 * • All nodes enabled by default with proper handle connections
 *
 * Keywords: templates, onboarding, automation, workflows, new-users
 */

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

// Template node positioning constants, basically layout spacing
const NODE_SPACING_X = 300;
const NODE_SPACING_Y = 200;
const START_X = 100;
const START_Y = 100;

// Template 1: Welcome & AI Introduction Template
const WELCOME_TEMPLATE_NODES = [
  {
    id: "welcome-text",
    type: "createText",
    position: { x: START_X, y: START_Y },
    data: {
      label: "Welcome Message",
      description: "Create your first text content",
      outputs: {
        text: "Welcome to Agenitix! This is your first workflow. You can edit this text and connect it to other nodes.",
      },
      isExpanded: false,
      isEnabled: true, // Enable node by default
      isActive: true, // Set as active for immediate output
    },
  },
  {
    id: "ai-assistant",
    type: "aiAgent",
    position: { x: START_X + NODE_SPACING_X, y: START_Y },
    data: {
      label: "AI Assistant",
      description: "Get help from AI assistant",
      inputs: {
        prompt: "", // Will be connected
      },
      outputs: {
        response: "",
      },
      isExpanded: false,
      isEnabled: true, // Enable node by default
      isActive: false, // Will become active when connected
    },
  },
  {
    id: "view-result",
    type: "viewText",
    position: { x: START_X + NODE_SPACING_X * 2, y: START_Y },
    data: {
      label: "View AI Response",
      description: "Display the AI assistant's response",
      inputs: {
        text: "", // Will be connected
      },
      isExpanded: false,
      isEnabled: true, // Enable node by default
      isActive: false, // Will become active when connected
    },
  },
];

const WELCOME_TEMPLATE_EDGES = [
  {
    id: "welcome-to-ai",
    source: "welcome-text",
    target: "ai-assistant",
    sourceHandle: "text",
    targetHandle: "prompt",
    type: "default",
  },
  {
    id: "ai-to-view",
    source: "ai-assistant",
    target: "view-result",
    sourceHandle: "response",
    targetHandle: "text",
    type: "default",
  },
];

// Template 2: Email Automation Template
const EMAIL_TEMPLATE_NODES = [
  {
    id: "email-account",
    type: "emailAccount",
    position: { x: START_X, y: START_Y },
    data: {
      label: "Email Account",
      description: "Configure your email account connection",
      outputs: {
        account: null,
        status: "disconnected",
      },
      isExpanded: false,
      isEnabled: true, // Enable node by default
      isActive: false, // Will become active when configured
    },
  },
  {
    id: "email-template",
    type: "emailTemplate",
    position: { x: START_X, y: START_Y + NODE_SPACING_Y },
    data: {
      label: "Email Template",
      description: "Create a reusable email template",
      outputs: {
        template: {
          subject: "Welcome to our service!",
          content:
            "Hello {{name}},\n\nWelcome to our platform! We're excited to have you on board.\n\nBest regards,\nThe Team",
          variables: ["name"],
        },
      },
      isExpanded: false,
      isEnabled: true, // Enable node by default
      isActive: true, // Set as active for immediate output
    },
  },
  {
    id: "email-creator",
    type: "emailCreator",
    position: { x: START_X + NODE_SPACING_X, y: START_Y },
    data: {
      label: "Email Creator",
      description: "Create personalized emails from template",
      inputs: {
        template: null, // Will be connected
        data: {
          name: "New User",
          email: "user@example.com",
        },
      },
      outputs: {
        email: null,
      },
      isExpanded: false,
      isEnabled: true, // Enable node by default
      isActive: false, // Will become active when connected
    },
  },
  {
    id: "email-sender",
    type: "emailSender",
    position: { x: START_X + NODE_SPACING_X * 2, y: START_Y },
    data: {
      label: "Email Sender",
      description: "Send the created email",
      inputs: {
        account: null, // Will be connected
        email: null, // Will be connected
      },
      outputs: {
        result: null,
        status: "pending",
      },
      isExpanded: false,
      isEnabled: true, // Enable node by default
      isActive: false, // Will become active when connected
    },
  },
];

const EMAIL_TEMPLATE_EDGES = [
  {
    id: "template-to-creator",
    source: "email-template",
    target: "email-creator",
    sourceHandle: "template",
    targetHandle: "template",
    type: "default",
  },
  {
    id: "account-to-sender",
    source: "email-account",
    target: "email-sender",
    sourceHandle: "account",
    targetHandle: "account",
    type: "default",
  },
  {
    id: "creator-to-sender",
    source: "email-creator",
    target: "email-sender",
    sourceHandle: "email",
    targetHandle: "email",
    type: "default",
  },
];

// Template 3: Data Processing Template
const DATA_TEMPLATE_NODES = [
  {
    id: "create-data",
    type: "createObject",
    position: { x: START_X, y: START_Y },
    data: {
      label: "Create Data Object",
      description: "Create a structured data object",
      outputs: {
        object: {
          id: 1,
          name: "Sample Data",
          value: 100,
          category: "example",
          timestamp: "2025-08-04T00:00:00.000Z",
        },
      },
      isExpanded: false,
      isEnabled: true, // Enable node by default
      isActive: true, // Set as active for immediate output
    },
  },
  {
    id: "store-local",
    type: "storeLocal",
    position: { x: START_X + NODE_SPACING_X, y: START_Y },
    data: {
      label: "Store Locally",
      description: "Store data in local storage",
      inputs: {
        data: null, // Will be connected
        key: "sample_data",
      },
      outputs: {
        stored: false,
        key: "sample_data",
      },
      isExpanded: false,
      isEnabled: true, // Enable node by default
      isActive: false, // Will become active when connected
    },
  },
  {
    id: "create-map",
    type: "createMap",
    position: { x: START_X, y: START_Y + NODE_SPACING_Y },
    data: {
      label: "Create Map",
      description: "Create a data map for processing",
      outputs: {
        map: {
          key1: "value1",
          key2: "value2",
          key3: "value3",
        },
      },
      isExpanded: false,
      isEnabled: true, // Enable node by default
      isActive: true, // Set as active for immediate output
    },
  },
  {
    id: "store-memory",
    type: "storeInMemory",
    position: { x: START_X + NODE_SPACING_X, y: START_Y + NODE_SPACING_Y },
    data: {
      label: "Store in Memory",
      description: "Store processed data in memory",
      inputs: {
        data: null, // Will be connected
        key: "processed_map",
      },
      outputs: {
        stored: false,
        key: "processed_map",
      },
      isExpanded: false,
      isEnabled: true, // Enable node by default
      isActive: false, // Will become active when connected
    },
  },
  {
    id: "view-data",
    type: "viewBoolean",
    position: { x: START_X + NODE_SPACING_X * 2, y: START_Y },
    data: {
      label: "View Storage Status",
      description: "Display whether data was stored successfully",
      inputs: {
        value: false, // Will be connected
      },
      isExpanded: false,
      isEnabled: true, // Enable node by default
      isActive: false, // Will become active when connected
    },
  },
];

const DATA_TEMPLATE_EDGES = [
  {
    id: "data-to-local",
    source: "create-data",
    target: "store-local",
    sourceHandle: "object",
    targetHandle: "data",
    type: "default",
  },
  {
    id: "map-to-memory",
    source: "create-map",
    target: "store-memory",
    sourceHandle: "map",
    targetHandle: "data",
    type: "default",
  },
  {
    id: "local-to-view",
    source: "store-local",
    target: "view-data",
    sourceHandle: "stored",
    targetHandle: "value",
    type: "default",
  },
];

// Template definitions, basically configuration for each starter template
const STARTER_TEMPLATES = [
  {
    name: "🚀 Welcome & AI Introduction",
    description: "Learn the basics with text creation and AI interaction",
    icon: "rocket",
    nodes: WELCOME_TEMPLATE_NODES,
    edges: WELCOME_TEMPLATE_EDGES,
  },
  {
    name: "📧 Email Automation Starter",
    description: "Set up your first email automation workflow",
    icon: "mail",
    nodes: EMAIL_TEMPLATE_NODES,
    edges: EMAIL_TEMPLATE_EDGES,
  },
  {
    name: "📊 Data Processing Basics",
    description: "Learn to create, process, and store data",
    icon: "database",
    nodes: DATA_TEMPLATE_NODES,
    edges: DATA_TEMPLATE_EDGES,
  },
];

/**
 * Provision starter templates for a new user
 */
export const provisionStarterTemplates = mutation({
  args: {
    user_id: v.id("auth_users"),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const templateIds: Id<"flows">[] = [];

    // Create each starter template for the user
    for (const template of STARTER_TEMPLATES) {
      try {
        const flowId = await ctx.db.insert("flows", {
          name: template.name,
          description: template.description,
          icon: template.icon,
          is_private: true, // Templates are private by default
          user_id: args.user_id,
          nodes: template.nodes,
          edges: template.edges,
          canvas_updated_at: now,
          created_at: now,
          updated_at: now,
        });

        templateIds.push(flowId);
      } catch (error) {
        console.error(`Failed to create template "${template.name}":`, error);
        // Continue creating other templates even if one fails
      }
    }

    return {
      success: true,
      templateCount: templateIds.length,
      templateIds,
    };
  },
});

/**
 * Check if user already has starter templates (to avoid duplicates)
 */
export const hasStarterTemplates = query({
  args: {
    user_id: v.id("auth_users"),
  },
  handler: async (ctx, args) => {
    const userFlows = await ctx.db
      .query("flows")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .collect();

    // Check if any flows match our starter template names
    const starterTemplateNames = STARTER_TEMPLATES.map((t) => t.name);
    const hasTemplates = userFlows.some((flow) =>
      starterTemplateNames.includes(flow.name)
    );

    return {
      hasTemplates,
      flowCount: userFlows.length,
    };
  },
});
