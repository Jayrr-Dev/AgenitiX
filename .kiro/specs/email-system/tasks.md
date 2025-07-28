# Email System Implementation Plan

## Overview

This implementation plan breaks down the email system development into discrete, manageable coding tasks. Each task builds incrementally on previous work and focuses on specific code implementation that can be executed by a coding agent.

## Implementation Tasks

- [x] 1. Set up email domain structure and core interfaces



  - Create directory structure: `features/business-logic-modern/node-domain/email/`
  - Define TypeScript interfaces for email providers and configurations
  - Create base email node infrastructure files
  - _Requirements: 1.1, 2.4, 4.1_



- [ ] 2. Implement Convex database schema for email accounts
  - Add `email_accounts` table to `convex/schema.ts`
  - Create indexes for user_id, provider, and email lookups


  - Implement data validation rules for email account storage


  - _Requirements: 2.1, 2.4, 5.2_

- [ ] 3. Create email account Convex server functions
  - [x] 3.1 Implement `storeEmailAccount` mutation

    - Write function to securely store encrypted email credentials
    - Add user session validation and authorization checks
    - Implement credential encryption before database storage
    - _Requirements: 2.1, 2.2, 2.4_


  - [ ] 3.2 Implement `getEmailAccounts` query
    - Write function to retrieve user's email accounts (without sensitive data)
    - Add filtering and sorting for account listings
    - Implement proper error handling for database queries
    - _Requirements: 5.1, 5.2, 7.2_


  - [ ] 3.3 Implement `validateEmailConnection` mutation
    - Write function to test email account connectivity
    - Add provider-specific validation logic

    - Implement connection status updates and error reporting
    - _Requirements: 3.1, 3.4, 6.1_

  - [ ] 3.4 Implement `deleteEmailAccount` mutation
    - Write function to securely remove email account and credentials
    - Add cascade deletion for related email data
    - Implement audit logging for account deletion
    - _Requirements: 2.2, 6.4_

- [x] 4. Create email provider registry system


  - [x] 4.1 Implement base provider interface

    - Define TypeScript interface for email providers
    - Create abstract base class for provider implementations
    - Write provider registration and discovery system
    - _Requirements: 4.1, 4.2, 4.4_


  - [ ] 4.2 Implement Gmail provider
    - Write Gmail-specific configuration and validation logic
    - Implement OAuth2 scope definitions and API endpoints
    - Add Gmail connection testing with proper error handling
    - _Requirements: 1.2, 4.1, 6.1_


  - [ ] 4.3 Implement Outlook provider
    - Write Outlook-specific configuration and validation logic
    - Implement Microsoft OAuth2 integration
    - Add Outlook connection testing with proper error handling

    - _Requirements: 1.3, 4.1, 6.1_

  - [x] 4.4 Implement IMAP/SMTP provider


    - Write manual configuration fields and validation


    - Implement IMAP/SMTP connection testing
    - Add support for common email providers' settings
    - _Requirements: 1.4, 4.4, 6.5_

- [x] 5. Create OAuth2 authentication API routes

  - [ ] 5.1 Implement Gmail OAuth2 handler
    - Create API route: `app/api/auth/email/gmail/route.ts`
    - Write OAuth2 authorization URL generation
    - Implement callback handling and token exchange
    - Add error handling for OAuth2 failures
    - _Requirements: 1.2, 2.1, 6.1_


  - [ ] 5.2 Implement Outlook OAuth2 handler
    - Create API route: `app/api/auth/email/outlook/route.ts`
    - Write Microsoft OAuth2 integration

    - Implement callback handling and token storage


    - Add error handling for Microsoft API failures
    - _Requirements: 1.3, 2.1, 6.1_

  - [x] 5.3 Implement OAuth2 callback processing

    - Create shared callback processing logic
    - Write token validation and storage functions
    - Implement redirect handling after successful authentication
    - Add CSRF protection with state parameter validation
    - _Requirements: 2.1, 6.1, 6.2_


- [ ] 6. Implement emailAccount node component
  - [ ] 6.1 Create node data schema and validation
    - Write Zod schema for emailAccount node data
    - Implement data validation and type safety
    - Create initial data structure and defaults
    - _Requirements: 1.1, 4.1, 6.5_


  - [ ] 6.2 Implement node UI structure
    - Create collapsed and expanded view layouts
    - Write provider selection dropdown component
    - Implement configuration form fields for each provider

    - Add visual status indicators and connection state display
    - _Requirements: 1.1, 3.2, 3.3, 5.1_


  - [ ] 6.3 Implement authentication flow integration
    - Write OAuth2 authentication trigger functions
    - Implement popup/redirect handling for OAuth2 flows
    - Add manual credential input and validation
    - Create connection testing functionality


    - _Requirements: 1.2, 1.3, 1.4, 3.4_

  - [x] 6.4 Implement connection status management

    - Write real-time connection status updates


    - Implement periodic connection validation
    - Add error state handling and user feedback
    - Create retry mechanisms for failed connections
    - _Requirements: 3.1, 3.3, 3.5, 6.1, 6.3_


- [ ] 7. Create node specification and registration
  - [ ] 7.1 Implement emailAccount NodeSpec
    - Write complete NodeSpec definition with handles
    - Define inspector controls and field configurations
    - Implement dynamic sizing and theming

    - Add node metadata and documentation

    - _Requirements: 1.1, 7.1, 7.2_

  - [ ] 7.2 Register emailAccount in node system
    - Add emailAccount to `useDynamicNodeTypes` hook
    - Register in `nodespec-registry.ts`
    - Export from `node-domain/index.ts`

    - Update node category and sidebar placement
    - _Requirements: 7.1, 7.2_

- [ ] 8. Implement credential encryption and security
  - [x] 8.1 Create credential encryption utilities

    - Write encryption/decryption functions for sensitive data

    - Implement secure key management for encryption
    - Add credential validation and sanitization
    - Create secure credential storage format
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 8.2 Implement session-based access control

    - Write user session validation for email operations
    - Add authorization checks for credential access
    - Implement credential isolation between users
    - Create audit logging for security events
    - _Requirements: 2.3, 2.4, 2.5_



- [ ] 9. Create error handling and user feedback system
  - [ ] 9.1 Implement comprehensive error types
    - Define TypeScript error types for all failure scenarios
    - Write error classification and categorization logic
    - Implement error message localization and user-friendly text
    - Create error recovery suggestion system

    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ] 9.2 Implement user feedback and notifications
    - Write toast notification system for email operations
    - Implement progress indicators for long-running operations


    - Add success confirmations and status updates

    - Create troubleshooting guidance display
    - _Requirements: 6.1, 6.6, 3.1, 3.3_

- [ ] 10. Create integration layer for other email nodes
  - [ ] 10.1 Implement account discovery system
    - Write functions for other nodes to query available accounts

    - Implement account selection components for email nodes
    - Add account status propagation to dependent nodes
    - Create account change notification system
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 10.2 Implement account sharing and context
    - Write React context for email account management
    - Implement account provider for workflow-wide access
    - Add account validation for email operations
    - Create account dependency tracking system
    - _Requirements: 7.2, 7.3, 7.4, 7.5_

- [ ] 11. Write comprehensive tests
  - [ ] 11.1 Create unit tests for core functions
    - Write tests for provider registration and validation
    - Test credential encryption and decryption functions
    - Implement connection validation testing with mocks
    - Add error handling and edge case testing
    - _Requirements: All requirements validation_

  - [ ] 11.2 Create integration tests
    - Write end-to-end OAuth2 flow testing
    - Test Convex database operations and data integrity
    - Implement node integration testing with other email nodes
    - Add UI interaction testing for configuration flows
    - _Requirements: All requirements validation_

- [ ] 12. Final integration and polish
  - [ ] 12.1 Implement final UI polish and user experience
    - Add loading states and smooth transitions
    - Implement responsive design for different screen sizes
    - Add keyboard navigation and accessibility features
    - Create comprehensive help text and tooltips
    - _Requirements: 1.6, 3.1, 5.1, 6.6_

  - [ ] 12.2 Create documentation and examples
    - Write comprehensive node documentation
    - Create example workflows using emailAccount
    - Add troubleshooting guide for common issues
    - Implement inline help and guidance system
    - _Requirements: 6.6, 7.5_