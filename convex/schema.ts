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
	email_accounts: defineTable({
		user_id: v.id("auth_users"),
		provider: v.union(
			v.literal("gmail"),
			v.literal("outlook"),
			v.literal("imap"),
			v.literal("smtp")
		),
		email: v.string(),
		display_name: v.optional(v.string()),
		encrypted_credentials: v.string(), // JSON string of encrypted EmailAccountConfig
		is_active: v.boolean(),
		last_validated: v.optional(v.number()),
		connection_status: v.union(
			v.literal("disconnected"),
			v.literal("connecting"),
			v.literal("connected"),
			v.literal("error")
		),
		last_error: v.optional(v.string()), // JSON string of last EmailError
		created_at: v.number(),
		updated_at: v.number(),
	})
		.index("by_user_id", ["user_id"])
		.index("by_provider", ["provider"])
		.index("by_email", ["email"])
		.index("by_user_and_provider", ["user_id", "provider"])
		.index("by_is_active", ["is_active"])
		.index("by_connection_status", ["connection_status"]),

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
		account_id: v.optional(v.id("email_accounts")), // Reference to email account used
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
		.index("by_account_id", ["account_id"])
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

	// AI Domain
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

	// AI Agent Domain (for Convex AI Agent integration)
	ai_agent_threads: defineTable({
		user_id: v.id("auth_users"),
		title: v.optional(v.string()),
		summary: v.optional(v.string()),
		status: v.optional(v.string()),
		created_at: v.number(),
		updated_at: v.number(),
	})
		.index("by_user_id", ["user_id"])
		.index("by_created_at", ["created_at"]),

	ai_agent_messages: defineTable({
		thread_id: v.id("ai_agent_threads"),
		role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
		content: v.string(),
		model: v.optional(v.string()),
		provider: v.optional(v.string()),
		usage: v.optional(v.object({
			promptTokens: v.number(),
			completionTokens: v.number(),
			totalTokens: v.number(),
		})),
		created_at: v.number(),
	})
		.index("by_thread_id", ["thread_id"])
		.index("by_created_at", ["created_at"]),

	// FLOW TABLES
	flows: defineTable({
		name: v.string(),
		description: v.optional(v.string()),
		icon: v.optional(v.string()),
		is_private: v.boolean(),
		user_id: v.id("auth_users"),
		// Canvas state
		nodes: v.optional(v.any()), // React Flow nodes array
		edges: v.optional(v.any()), // React Flow edges array
		canvas_updated_at: v.optional(v.string()), // Last canvas save timestamp
		created_at: v.string(),
		updated_at: v.string(),
	})
		.index("by_user_id", ["user_id"])
		.index("by_created_at", ["created_at"])
		.index("by_is_private", ["is_private"])
		.index("by_user_and_privacy", ["user_id", "is_private"]),

	// FLOW SHARING TABLES
	flow_shares: defineTable({
		flow_id: v.id("flows"),
		shared_by_user_id: v.id("auth_users"),
		share_token: v.string(),
		is_active: v.boolean(),
		expires_at: v.optional(v.string()),
		created_at: v.string(),
	})
		.index("by_flow_id", ["flow_id"])
		.index("by_share_token", ["share_token"])
		.index("by_shared_by_user_id", ["shared_by_user_id"]),

	flow_share_permissions: defineTable({
		flow_id: v.id("flows"),
		share_id: v.id("flow_shares"),
		user_id: v.id("auth_users"),
		permission_type: v.union(v.literal("view"), v.literal("edit"), v.literal("admin")),
		granted_at: v.string(),
		granted_by_user_id: v.id("auth_users"),
	})
		.index("by_flow_id", ["flow_id"])
		.index("by_share_id", ["share_id"])
		.index("by_user_id", ["user_id"])
		.index("by_flow_and_user", ["flow_id", "user_id"]),

	// FLOW ACCESS REQUESTS
	flow_access_requests: defineTable({
		flow_id: v.id("flows"),
		requesting_user_id: v.id("auth_users"),
		requesting_user_email: v.string(),
		permission_type: v.union(v.literal("view"), v.literal("edit"), v.literal("admin")),
		status: v.union(v.literal("pending"), v.literal("approved"), v.literal("denied")),
		requested_at: v.string(),
		responded_at: v.optional(v.string()),
		responded_by_user_id: v.optional(v.id("auth_users")),
		response_note: v.optional(v.string()),
	})
		.index("by_flow_id", ["flow_id"])
		.index("by_requesting_user_id", ["requesting_user_id"])
		.index("by_status", ["status"])
		.index("by_flow_and_status", ["flow_id", "status"]),

	// FLOW UPVOTES - User upvotes for public flows
	flow_upvotes: defineTable({
		flow_id: v.id("flows"),
		user_id: v.id("auth_users"),
		created_at: v.string(),
	})
		.index("by_flow_id", ["flow_id"])
		.index("by_user_id", ["user_id"])
		.index("by_flow_and_user", ["flow_id", "user_id"]),
});
