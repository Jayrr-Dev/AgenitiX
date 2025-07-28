# 📘 Table Naming Convention Guide

Use this standard when creating new database tables. All table names must follow these conventions.

---

## ✅ General Rules

```
🔹 Use `snake_case` (lowercase + underscores)
🔹 Use `plural` nouns (e.g. users, email_templates)
🔹 Prefix with `domain_` for grouping by feature
🔹 Avoid abbreviations unless they're industry standard (e.g. `id`, `url`)
🔹 Avoid reserved SQL keywords (e.g. `user`, `order`)
```

---

## 📦 Format

```
<domain>_<resource_plural>
```

**Example:**
```sql
email_templates
billing_invoices
crm_contacts
```

---

## 🧩 Join Tables

Use 2 singular nouns in alphabetical order:
```
<singular_entity>_<singular_entity>
```

**Example:**
```sql
user_roles
project_users
tag_posts
```

---

## 📚 System Tables

| Suffix         | Purpose                  | Example              |
|----------------|--------------------------|----------------------|
| `_log`         | Logging events           | `email_log`          |
| `_history`     | Versioning/history       | `user_login_history` |
| `_settings`    | Config or settings       | `app_settings`       |
| `_queue`       | Background job queues    | `email_queue`        |
| `_mapping`     | Internal mapping         | `domain_mapping`     |

---

## 🔐 Special Rules

```
🛑 Don’t use camelCase
🛑 Don’t start names with numbers
✅ Use descriptive, readable names
```

---

## 🧪 Recommended Names (for your stack)

```sql
auth_users
auth_sessions
email_templates
email_logs
billing_customers
billing_invoices
flow_nodes
workflow_runs
ai_prompts
project_tasks
project_users
editor_drafts
```

---

## ✅ Summary

```
📌 Always: lowercase + underscores + plural
📌 Prefer: <domain>_<resource>
📌 Join Tables: alphabetical order + singular
📌 Use standard suffixes for system/infra tables