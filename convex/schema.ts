import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	// Authentication Domain
	auth_users: defineTable({
		email: v.string(),
		name: v.string(),
		avatar_url: v.optional(v.string()),
		email_verified: v.boolean(),
		created_at: v.number(),
		updated_at: v.number(),
		last_login: v.optional(v.number()),
		is_active: v.boolean(),
		// Profile information
		company: v.optional(v.string()),
		role: v.optional(v.string()),
		timezone: v.optional(v.string()),
		// Magic Link fields
		magic_link_token: v.optional(v.string()),
		magic_link_expires: v.optional(v.number()),
		login_attempts: v.optional(v.number()),
		last_login_attempt: v.optional(v.number()),
	})
		.index("by_email", ["email"])
		.index("by_created_at", ["created_at"])
		.index("by_is_active", ["is_active"])
		.index("by_magic_link_token", ["magic_link_token"]),

	auth_sessions: defineTable({
		user_id: v.id("auth_users"),
		token_hash: v.string(),
		expires_at: v.number(),
		created_at: v.number(),
		ip_address: v.optional(v.string()),
		user_agent: v.optional(v.string()),
		is_active: v.boolean(),
	})
		.index("by_user_id", ["user_id"])
		.index("by_token_hash", ["token_hash"])
		.index("by_expires_at", ["expires_at"])
		.index("by_is_active", ["is_active"]),

	// Email Domain
	email_templates: defineTable({
		user_id: v.id("auth_users"),
		name: v.string(),
		subject: v.string(),
		html_content: v.string(),
		text_content: v.optional(v.string()),
		variables: v.array(v.string()), // Template variables like {{name}}
		category: v.optional(v.string()),
		is_active: v.boolean(),
		created_at: v.number(),
		updated_at: v.number(),
	})
		.index("by_user_id", ["user_id"])
		.index("by_category", ["category"])
		.index("by_is_active", ["is_active"]),

	email_logs: defineTable({
		user_id: v.id("auth_users"),
		template_id: v.optional(v.id("email_templates")),
		to_email: v.string(),
		from_email: v.string(),
		subject: v.string(),
		status: v.union(
			v.literal("queued"),
			v.literal("sending"),
			v.literal("sent"),
			v.literal("delivered"),
			v.literal("failed"),
			v.literal("bounced")
		),
		provider: v.optional(v.string()), // gmail, outlook, etc.
		external_id: v.optional(v.string()), // Provider's message ID
		error_message: v.optional(v.string()),
		sent_at: v.optional(v.number()),
		delivered_at: v.optional(v.number()),
		opened_at: v.optional(v.number()),
		clicked_at: v.optional(v.number()),
		created_at: v.number(),
	})
		.index("by_user_id", ["user_id"])
		.index("by_status", ["status"])
		.index("by_to_email", ["to_email"])
		.index("by_created_at", ["created_at"]),

	// Workflow Domain
	workflow_runs: defineTable({
		user_id: v.id("auth_users"),
		workflow_name: v.string(),
		status: v.union(
			v.literal("running"),
			v.literal("completed"),
			v.literal("failed"),
			v.literal("cancelled")
		),
		nodes_executed: v.number(),
		total_nodes: v.number(),
		started_at: v.number(),
		completed_at: v.optional(v.number()),
		error_message: v.optional(v.string()),
		execution_data: v.optional(v.any()), // Workflow state and results
	})
		.index("by_user_id", ["user_id"])
		.index("by_status", ["status"])
		.index("by_started_at", ["started_at"]),

	flow_nodes: defineTable({
		user_id: v.id("auth_users"),
		workflow_id: v.optional(v.string()), // Reference to workflow
		node_type: v.string(), // createText, viewCsv, etc.
		node_data: v.any(), // Node configuration and state
		position_x: v.number(),
		position_y: v.number(),
		is_active: v.boolean(),
		created_at: v.number(),
		updated_at: v.number(),
	})
		.index("by_user_id", ["user_id"])
		.index("by_workflow_id", ["workflow_id"])
		.index("by_node_type", ["node_type"]),

	// AI Domain (for future implementation)
	ai_prompts: defineTable({
		user_id: v.id("auth_users"),
		name: v.string(),
		prompt_text: v.string(),
		model: v.string(), // gpt-4, claude-3, etc.
		temperature: v.optional(v.number()),
		max_tokens: v.optional(v.number()),
		category: v.optional(v.string()),
		is_active: v.boolean(),
		created_at: v.number(),
		updated_at: v.number(),
	})
		.index("by_user_id", ["user_id"])
		.index("by_model", ["model"])
		.index("by_category", ["category"]),
});