import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Use authTables but override with custom schema, basically integrating Convex Auth with existing naming
  ...authTables,

  // Authentication Domain - Custom users table with existing naming scheme
  users: defineTable({
    // Standard Convex Auth fields
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),

    // Custom fields matching existing auth_users schema
    avatar_url: v.optional(v.string()),
    email_verified: v.optional(v.boolean()),
    created_at: v.optional(v.number()),
    updated_at: v.optional(v.number()),
    last_login: v.optional(v.number()),
    is_active: v.optional(v.boolean()),
    // Profile information
    company: v.optional(v.string()),
    role: v.optional(v.string()),
    timezone: v.optional(v.string()),
    // Reference to Convex Auth user
    convex_user_id: v.optional(v.string()),
    // Magic Link fields
    magic_link_token: v.optional(v.string()),
    magic_link_expires: v.optional(v.number()),
    login_attempts: v.optional(v.number()),
    last_login_attempt: v.optional(v.number()),

    // Open Source Community Fields
    contribution_metadata: v.optional(
      v.object({
        is_contributor: v.boolean(),
        contribution_count: v.number(),
        first_contribution_at: v.optional(v.number()),
        last_contribution_at: v.optional(v.number()),
        contribution_types: v.array(v.string()),
      })
    ),
    open_source_user: v.optional(v.boolean()),
  }).index("email", ["email"]),

  // Email Domain
  email_accounts: defineTable({
    user_id: v.id("users"),
    provider: v.union(
      v.literal("gmail"),
      v.literal("outlook"),
      v.literal("yahoo"),
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
    user_id: v.id("users"),
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
    user_id: v.id("users"),
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

  // Email Reply Domain
  email_reply_templates: defineTable({
    user_id: v.id("users"),
    name: v.string(),
    category: v.string(),
    subject_template: v.string(),
    content_template: v.string(),
    variables: v.array(v.string()), // Template variables like {sender_name}
    description: v.optional(v.string()),
    is_active: v.boolean(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user_id", ["user_id"])
    .index("by_category", ["category"])
    .index("by_is_active", ["is_active"])
    .index("by_user_and_category", ["user_id", "category"]),

  email_reply_logs: defineTable({
    user_id: v.id("users"),
    account_id: v.id("email_accounts"),
    original_email_id: v.string(), // ID from email provider
    reply_strategy: v.union(
      v.literal("auto"),
      v.literal("template"),
      v.literal("ai-generated"),
      v.literal("hybrid")
    ),
    reply_content: v.string(),
    reply_subject: v.string(),
    recipients: v.object({
      to: v.array(v.string()),
      cc: v.array(v.string()),
    }),
    confidence: v.number(), // AI confidence score 0-1
    processing_time: v.number(), // milliseconds
    tokens_used: v.optional(v.number()), // AI tokens consumed
    template_id: v.optional(v.string()),
    ai_model: v.optional(v.string()),
    status: v.union(
      v.literal("generated"),
      v.literal("sent"),
      v.literal("failed")
    ),
    error_message: v.optional(v.string()),
    created_at: v.number(),
  })
    .index("by_user_id", ["user_id"])
    .index("by_account_id", ["account_id"])
    .index("by_reply_strategy", ["reply_strategy"])
    .index("by_status", ["status"])
    .index("by_created_at", ["created_at"])
    .index("by_user_and_strategy", ["user_id", "reply_strategy"]),

  flow_nodes: defineTable({
    user_id: v.id("users"),
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
    user_id: v.id("users"),
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
    user_id: v.id("users"),
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
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system")
    ),
    content: v.string(),
    model: v.optional(v.string()),
    provider: v.optional(v.string()),
    usage: v.optional(
      v.object({
        promptTokens: v.number(),
        completionTokens: v.number(),
        totalTokens: v.number(),
      })
    ),
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
    user_id: v.id("users"), // Use Convex Auth users table for OAuth compatibility
    // Canvas state (stored as blob to reduce bandwidth)
    nodes: v.optional(v.any()), // React Flow nodes array (legacy/fallback)
    edges: v.optional(v.any()), // React Flow edges array (legacy/fallback)
    canvas_storage_id: v.optional(v.id("_storage")),
    canvas_storage_size: v.optional(v.number()),
    canvas_checksum: v.optional(v.string()),
    canvas_updated_at: v.optional(v.string()), // Last canvas save timestamp
    created_at: v.string(),
    updated_at: v.string(),

    // Open Source Community Fields
    open_source_metadata: v.optional(
      v.object({
        is_community_template: v.boolean(),
        contribution_status: v.union(
          v.literal("private"),
          v.literal("public"),
          v.literal("featured"),
          v.literal("archived")
        ),
        license: v.string(),
        tags: v.array(v.string()),
        created_for_open_source: v.boolean(),
      })
    ),
  })
    .index("by_user_id", ["user_id"])
    .index("by_created_at", ["created_at"])
    .index("by_is_private", ["is_private"])
    .index("by_user_and_privacy", ["user_id", "is_private"]),

  // FLOW SHARING TABLES
  flow_shares: defineTable({
    flow_id: v.id("flows"),
    shared_by_user_id: v.id("users"), // Use Convex Auth users table for OAuth compatibility
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
    user_id: v.id("users"), // Use Convex Auth users table for OAuth compatibility
    permission_type: v.union(
      v.literal("view"),
      v.literal("edit"),
      v.literal("admin")
    ),
    granted_at: v.string(),
    granted_by_user_id: v.id("users"), // Use Convex Auth users table for OAuth compatibility
  })
    .index("by_flow_id", ["flow_id"])
    .index("by_share_id", ["share_id"])
    .index("by_user_id", ["user_id"])
    .index("by_flow_and_user", ["flow_id", "user_id"]),

  // FLOW ACCESS REQUESTS
  flow_access_requests: defineTable({
    flow_id: v.id("flows"),
    requesting_user_id: v.id("users"), // Use Convex Auth users table for OAuth compatibility
    requesting_user_email: v.string(),
    permission_type: v.union(
      v.literal("view"),
      v.literal("edit"),
      v.literal("admin")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("denied")
    ),
    requested_at: v.string(),
    responded_at: v.optional(v.string()),
    responded_by_user_id: v.optional(v.id("users")), // Use Convex Auth users table for OAuth compatibility
    response_note: v.optional(v.string()),
  })
    .index("by_flow_id", ["flow_id"])
    .index("by_requesting_user_id", ["requesting_user_id"])
    .index("by_status", ["status"])
    .index("by_flow_and_status", ["flow_id", "status"]),

  // FLOW UPVOTES - User upvotes for public flows
  flow_upvotes: defineTable({
    flow_id: v.id("flows"),
    user_id: v.id("users"), // Use Convex Auth users table for OAuth compatibility
    created_at: v.string(),
  })
    .index("by_flow_id", ["flow_id"])
    .index("by_user_id", ["user_id"])
    .index("by_flow_and_user", ["flow_id", "user_id"]),

  // FLOW HISTORY - History graph storage for undo/redo functionality
  flow_histories: defineTable({
    flow_id: v.id("flows"),
    user_id: v.id("users"), // Use Convex Auth users table for OAuth compatibility
    // When small, we inline the graph in the document. When large, we store in Convex Storage
    history_graph: v.optional(v.any()), // Serialized HistoryGraph object (inline, small)
    // Storage fallback for large graphs
    storage_id: v.optional(v.id("_storage")),
    storage_size: v.optional(v.number()), // Bytes of the blob in storage
    is_external_storage: v.optional(v.boolean()), // If true, use storage blob instead of inline
    storage_method: v.optional(v.string()), // "inline" | "chunked" | "blob"
    // Reliability metadata
    version: v.optional(v.number()), // Monotonic version for two-phase writes
    checksum: v.optional(v.string()), // Simple checksum of serialized graph
    total_chunks: v.optional(v.number()), // Number of chunks when chunked
    compressed_size: v.optional(v.number()), // Kept for backwards compatibility/monitoring
    is_dragging: v.optional(v.boolean()), // Whether this save was during a drag operation
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_flow_id", ["flow_id"])
    .index("by_user_id", ["user_id"])
    .index("by_flow_and_user", ["flow_id", "user_id"])
    .index("by_created_at", ["created_at"]),

  // FLOW HISTORY LARGE DATA CHUNKS - Chunked storage for large history graphs
  flow_history_chunks: defineTable({
    history_id: v.id("flow_histories"),
    chunk_index: v.number(),
    chunk_data: v.string(), // JSON string chunk
    chunk_size: v.number(),
    // Versioning for two-phase writes
    chunk_version: v.optional(v.number()),
    chunk_checksum: v.optional(v.string()),
    created_at: v.number(),
  })
    .index("by_history_id", ["history_id"])
    .index("by_history_id_and_index", ["history_id", "chunk_index"])
    .index("by_history_id_and_version", ["history_id", "chunk_version"]),

  // FLOW NODE DOCUMENTS - External storage references for large node content
  flow_node_documents: defineTable({
    flow_id: v.id("flows"),
    user_id: v.id("users"),
    node_id: v.string(),
    storage_id: v.id("_storage"),
    storage_size: v.number(),
    content_type: v.optional(v.string()),
    preview_text: v.string(),
    checksum: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_flow_id", ["flow_id"])
    .index("by_user_id", ["user_id"])
    .index("by_flow_and_node", ["flow_id", "node_id"])
    .index("by_user_and_node", ["user_id", "node_id"]),

  // FLOW OPS LOG - Ordered operations per flow for scalable history
  flow_ops: defineTable({
    flow_id: v.id("flows"),
    user_id: v.id("users"),
    command_id: v.string(),
    version: v.number(), // server-assigned increasing
    ops: v.array(v.any()), // compact operations
    created_at: v.number(),
  })
    .index("by_flow_and_version", ["flow_id", "version"])
    .index("by_flow_and_user", ["flow_id", "user_id"])
    .index("by_user_id", ["user_id"]),

  // FLOW SNAPSHOTS - Periodic compaction to bound ops replay cost
  flow_snapshots: defineTable({
    flow_id: v.id("flows"),
    version: v.number(),
    snapshot: v.any(),
    created_at: v.number(),
  })
    .index("by_flow_id", ["flow_id"])
    .index("by_flow_and_version", ["flow_id", "version"]),

  // TRIGGER DOMAIN - Durable time-based schedules managed by Convex scheduler
  trigger_time_schedules: defineTable({
    user_id: v.id("users"),
    node_id: v.string(),
    flow_id: v.optional(v.string()),
    schedule_type: v.union(
      v.literal("interval"),
      v.literal("daily"),
      v.literal("once")
    ),
    interval_minutes: v.optional(v.number()),
    start_time: v.optional(v.string()), // HH:MM (24h)
    is_enabled: v.boolean(),
    last_triggered: v.optional(v.number()),
    next_trigger_at: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user_id", ["user_id"])
    .index("by_node_id", ["node_id"])
    .index("by_next_trigger_at", ["next_trigger_at"]),

  // EMAIL API USAGE TRACKING - Provider/method limits and per-user daily usage
  // Tables follow domain prefixing and snake_case naming
  email_api_limits: defineTable({
    // Row kind: "provider" for provider-level caps, "method" for individual API methods
    kind: v.union(v.literal("provider"), v.literal("method")),
    provider: v.string(), // e.g., "gmail"
    method: v.optional(v.string()), // present when kind === "method"
    // Method-level fields
    quota_unit: v.optional(v.number()), // units per call for the method
    // Provider-level caps (units)
    daily_quota_max_units: v.optional(v.number()),
    per_user_per_minute_units: v.optional(v.number()),
    per_project_per_minute_units: v.optional(v.number()),
    per_user_per_100_seconds_units: v.optional(v.number()),
    // Metadata
    is_active: v.optional(v.boolean()),
    updated_at: v.number(),
    created_at: v.number(),
  })
    .index("by_provider_and_kind", ["provider", "kind"]) // list provider-level caps
    .index("by_provider_and_method", ["provider", "method"]) // find a specific method
    .index("by_provider_and_updated_at", ["provider", "updated_at"]),

  email_api_usages: defineTable({
    user_id: v.id("users"),
    provider: v.string(), // e.g., "gmail"
    method: v.string(),
    date_key: v.string(), // YYYY-MM-DD
    unit_count: v.number(), // total units consumed that day for this method
    request_count: v.number(), // number of calls
    last_request_at: v.number(),
    // Optional windowing hints to enable simple per-minute checks without a separate table
    minute_window_start: v.optional(v.number()), // epoch ms (start of minute)
    minute_unit_count: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user_and_date", ["user_id", "date_key"]) // aggregate per user per day
    .index("by_user_date_provider_method", [
      "user_id",
      "date_key",
      "provider",
      "method",
    ]) // fast lookup
    .index("by_provider_and_date", ["provider", "date_key"]) // aggregate per provider per day
    .index("by_user_and_updated_at", ["user_id", "updated_at"]),

  // AI API USAGE TRACKING - LLM provider/model limits and per-user token usage
  ai_api_limits: defineTable({
    kind: v.union(v.literal("provider"), v.literal("model")),
    provider: v.string(), // e.g., "openai" | "anthropic" | "google" | "custom"
    model: v.optional(v.string()), // present when kind === "model"
    // Provider/model caps in tokens
    tokens_per_user_per_minute: v.optional(v.number()),
    tokens_per_project_per_minute: v.optional(v.number()),
    tokens_per_user_per_day: v.optional(v.number()),
    request_max_tokens: v.optional(v.number()),
    // Metadata
    is_active: v.optional(v.boolean()),
    updated_at: v.number(),
    created_at: v.number(),
  })
    .index("by_provider_and_kind", ["provider", "kind"]) // list provider-level caps
    .index("by_provider_and_model", ["provider", "model"]) // find a specific model
    .index("by_provider_and_updated_at", ["provider", "updated_at"]),

  ai_api_usages: defineTable({
    user_id: v.id("users"),
    provider: v.string(),
    model: v.string(),
    date_key: v.string(), // YYYY-MM-DD
    // Token counters
    prompt_token_count: v.number(),
    completion_token_count: v.number(),
    total_token_count: v.number(),
    request_count: v.number(),
    last_request_at: v.number(),
    // Minute window to enforce per-minute caps without separate table
    minute_window_start: v.optional(v.number()),
    minute_token_count: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user_and_date", ["user_id", "date_key"]) // aggregate per user per day
    .index("by_user_date_provider_model", [
      "user_id",
      "date_key",
      "provider",
      "model",
    ]) // fast lookup
    .index("by_provider_and_date", ["provider", "date_key"]) // aggregate per provider per day
    .index("by_user_and_updated_at", ["user_id", "updated_at"]),

  // OPEN SOURCE DOMAIN - Tables for open source community features
  open_source_metadata: defineTable({
    project_name: v.string(),
    license: v.string(),
    version: v.string(),
    open_source_since: v.number(),
    github_url: v.string(),
    documentation_url: v.string(),
    community_features_enabled: v.boolean(),
    contribution_tracking_enabled: v.boolean(),
    created_at: v.number(),
    updated_at: v.number(),
  }),

  feature_flags: defineTable({
    flag_name: v.string(),
    description: v.string(),
    enabled: v.boolean(),
    created_at: v.number(),
    updated_at: v.number(),
  }).index("by_flag_name", ["flag_name"]),

  migrations: defineTable({
    version: v.string(),
    name: v.string(),
    description: v.string(),
    applied_at: v.number(),
    changes: v.array(v.string()),
  })
    .index("by_version", ["version"])
    .index("by_name", ["name"]),
});
