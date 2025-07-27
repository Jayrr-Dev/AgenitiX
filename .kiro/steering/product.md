# Product Overview

AgenitiX is a visual flow automation platform competing with Flowise AI, providing a superior node-based editor for creating and managing automation workflows. The platform offers enhanced architecture and capabilities beyond existing solutions like n8n and Flowise.

## Core Features

- **Visual Flow Editor**: Advanced node-based workflow creation with React Flow canvas
- **Node Domain Architecture**: Extensible system with 5 categories (Create, View, Trigger, Test, Cycle)
- **NodeSpec System**: Type-safe node definitions with automatic scaffolding and validation
- **Server Actions**: Backend operations for database interactions and external API calls
- **Credential Management**: Secure storage and management of API keys and authentication
- **PWA Support**: Progressive Web App with offline capabilities and mobile optimization
- **Anubis Protection**: Built-in security system for bot protection and risk management
- **Auto-documentation**: Comprehensive documentation system that auto-generates from source code

## Visual Dependency Flow

```
Authentication ──┐
                 ├──→ Email Features ──→ Analytics ──→ Dashboard
Storage Systems ──┘                                      │
                                                         ▼
AI Model ──→ AI Tools ──→ AI Manager ──→ AI Agents ──→ viewGraph
                                                         │
Flow Controls ──────────────────────────────────────────┘
```

## Development Architecture Dependencies

- **Foundation Layer**: Authentication + Storage Systems enable all user features
- **Email Layer**: Email Features depend on Authentication + Storage
- **Analytics Layer**: Email Analytics depend on Email Features
- **AI Layer**: AI development can run parallel with Email Analytics
- **Dashboard Layer**: Final integration point for all systems
- **Flow Controls**: Independent system that connects to final dashboard

## Current Development Focus (Week 1 Must-Haves)

### Critical Dependencies (Non-Negotiable)
- **Authentication System** ✅ COMPLETED - Magic link auth with session management
- **Storage System** ✅ COMPLETED - Full Convex schema with all domains
- **Email Account Integration** 🎯 NEXT PRIORITY - Connect email providers

### Email Logic Implementation
- **Email Receiving Logic**: 
  - Problem Receiving: How nodes can read emails, trigger events, store data
  - Problem Auto Reply: Auto-reply functionality with templates
  - Problem 3rd Party Apps and Calendar: Integration with external services
- **Email Sending Logic**:
  - Problem Templates: Create email templates with nodes
  - Problem Sending: Send emails via nodes with scheduling
  - Problem Bulk Send: Mass email capabilities with data linking
  - Problem Data Link: Connect external data to emails

### Email Analytics & Error Handling
- **Problem Analytics**: Track email performance and engagement
- **Problem Error Handle**: Handle errors and failed emails with retry logic

### Parallel Development Opportunities
- **Storage Types**: Can build all storage simultaneously
- **Advanced Email**: Template/Brand/Analytics independent development
- **AI Development**: Can parallel with Email Analytics
- **Documentation**: Start early, build throughout

## Target Users

- Digital agencies and consultants
- Business automation specialists
- Workflow designers and architects
- Teams requiring visual process automation

## Key Value Propositions

- Professional-grade workflow automation platform
- Enterprise-ready with security and telemetry
- Extensible architecture for custom node development
- Modern web technologies with excellent developer experience