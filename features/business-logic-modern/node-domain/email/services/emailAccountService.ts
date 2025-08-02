/**
 * Email Account Service - Account validation and connection management
 *
 * • Validates email account connections and status
 * • Provides account selection and filtering utilities
 * • Handles account switching and error recovery
 * • Integrates with Convex backend for account data
 *
 * Keywords: email-account, validation, connection, service
 */

import type { EmailAccountConfig, EmailProviderType } from '../types';

export interface EmailAccountOption {
    value: string;
    label: string;
    provider: EmailProviderType;
    email: string;
    isActive: boolean;
    isConnected: boolean;
    lastValidated?: number;
}

export interface AccountValidationResult {
    isValid: boolean;
    isConnected: boolean;
    error?: string;
    lastChecked: number;
}

/**
 * Email Account Service for managing account selection and validation
 */
export class EmailAccountService {
    private static validationCache = new Map<string, AccountValidationResult>();
    private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    /**
     * Transform Convex email accounts to selection options
     */
    static transformAccountsToOptions(accounts: any[]): EmailAccountOption[] {
        if (!accounts || !Array.isArray(accounts)) return [];

        return accounts.map(account => ({
            value: account._id,
            label: `${account.email} (${account.provider})`,
            provider: account.provider as EmailProviderType,
            email: account.email,
            isActive: account.is_active,
            isConnected: account.is_active && !account.last_error,
            lastValidated: account.last_validated,
        }));
    }

    /**
     * Filter accounts by active status and connection
     */
    static filterActiveAccounts(accounts: EmailAccountOption[]): EmailAccountOption[] {
        return accounts.filter(account => account.isActive);
    }

    /**
     * Get account by ID from options list
     */
    static getAccountById(accounts: EmailAccountOption[], accountId: string): EmailAccountOption | null {
        return accounts.find(account => account.value === accountId) || null;
    }

    /**
     * Validate account connection (with caching)
     */
    static async validateAccountConnection(accountId: string): Promise<AccountValidationResult> {
        // Check cache first
        const cached = this.validationCache.get(accountId);
        if (cached && (Date.now() - cached.lastChecked) < this.CACHE_DURATION) {
            return cached;
        }

        // Perform validation (placeholder - would integrate with actual validation)
        const result: AccountValidationResult = {
            isValid: true,
            isConnected: true,
            lastChecked: Date.now(),
        };

        // Cache result
        this.validationCache.set(accountId, result);
        return result;
    }

    /**
     * Clear validation cache for account
     */
    static clearValidationCache(accountId?: string): void {
        if (accountId) {
            this.validationCache.delete(accountId);
        } else {
            this.validationCache.clear();
        }
    }

    /**
     * Get connection status display text
     */
    static getConnectionStatusText(account: EmailAccountOption | null): string {
        if (!account) return "No account selected";
        if (!account.isActive) return "Account inactive";
        if (!account.isConnected) return "Connection error";
        return "Connected";
    }

    /**
     * Get connection status color class
     */
    static getConnectionStatusColor(account: EmailAccountOption | null): string {
        if (!account || !account.isActive) return "text-gray-500";
        if (!account.isConnected) return "text-red-600";
        return "text-green-600";
    }

    /**
     * Validate email address format
     */
    static validateEmailAddress(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    }

    /**
     * Parse and validate recipient list
     */
    static parseRecipients(recipientString: string): { valid: string[]; invalid: string[] } {
        const emails = recipientString
            .split(',')
            .map(email => email.trim())
            .filter(Boolean);

        const valid: string[] = [];
        const invalid: string[] = [];

        emails.forEach(email => {
            if (this.validateEmailAddress(email)) {
                valid.push(email);
            } else {
                invalid.push(email);
            }
        });

        return { valid, invalid };
    }

    /**
     * Get account selection validation errors
     */
    static validateAccountSelection(
        accountId: string,
        accounts: EmailAccountOption[]
    ): string[] {
        const errors: string[] = [];

        if (!accountId) {
            errors.push("Please select an email account");
            return errors;
        }

        const account = this.getAccountById(accounts, accountId);
        if (!account) {
            errors.push("Selected account not found");
            return errors;
        }

        if (!account.isActive) {
            errors.push("Selected account is inactive");
        }

        if (!account.isConnected) {
            errors.push("Selected account has connection issues");
        }

        return errors;
    }

    /**
     * Get recommended account for auto-selection
     */
    static getRecommendedAccount(accounts: EmailAccountOption[]): EmailAccountOption | null {
        // Prefer active, connected accounts
        const activeConnected = accounts.filter(acc => acc.isActive && acc.isConnected);
        if (activeConnected.length > 0) {
            // Return most recently validated
            return activeConnected.sort((a, b) => (b.lastValidated || 0) - (a.lastValidated || 0))[0];
        }

        // Fallback to any active account
        const active = accounts.filter(acc => acc.isActive);
        return active.length > 0 ? active[0] : null;
    }
}