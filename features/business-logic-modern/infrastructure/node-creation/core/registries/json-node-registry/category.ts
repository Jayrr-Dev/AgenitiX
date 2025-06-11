/**
 * CATEGORY REGISTRY - Domain-specific registry for category management
 *
 * • Extends TypedRegistry with category-specific functionality
 * • Provides type-safe operations for category registrations
 * • Includes validation and helper methods for category hierarchy
 * • Supports nested categories and folder organization
 *
 * Keywords: category-registry, typed-registry, domain-specific, hierarchy
 */

import type { NodeCategory, SidebarFolder } from "../../factory/types";
import { TypedRegistry } from "./base/TypedRegistry";

// ============================================================================
// CATEGORY METADATA INTERFACE
// ============================================================================

/**
 * Category metadata registration
 */
export interface CategoryRegistration {
  category: NodeCategory;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  order: number;

  // Organization
  folder: SidebarFolder;
  parentCategory?: NodeCategory;
  isEnabled: boolean;

  // UI Configuration
  isCollapsible?: boolean;
  isCollapsedByDefault?: boolean;

  // Validation rules
  maxNodes?: number;
  allowedNodeTypes?: string[];
  restrictions?: {
    requiresAuth?: boolean;
    isPremium?: boolean;
    isExperimental?: boolean;
  };
}

// ============================================================================
// TYPED CATEGORY REGISTRY
// ============================================================================

/**
 * Domain-specific registry for category metadata management
 */
export class CategoryRegistry extends TypedRegistry<
  NodeCategory,
  CategoryRegistration
> {
  constructor() {
    super("CategoryRegistry");
  }

  // ============================================================================
  // DOMAIN-SPECIFIC METHODS
  // ============================================================================

  /**
   * Register category metadata with validation
   */
  registerCategory(registration: CategoryRegistration): void {
    // Validate registration
    const validation = this.validateCategoryRegistration(registration);
    if (!validation.isValid) {
      throw new Error(
        `Invalid category registration for ${registration.category}: ${validation.errors.join(", ")}`
      );
    }

    this.set(registration.category, registration);

    // Debug logging removed for cleaner console
  }

  /**
   * Get category metadata
   */
  getCategoryMetadata(
    category: NodeCategory
  ): CategoryRegistration | undefined {
    return this.get(category);
  }

  /**
   * Get categories by folder
   */
  getCategoriesByFolder(folder: SidebarFolder): CategoryRegistration[] {
    return this.filter((registration) => registration.folder === folder)
      .map(([, registration]) => registration)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Get enabled categories
   */
  getEnabledCategories(): CategoryRegistration[] {
    return this.filter((registration) => registration.isEnabled)
      .map(([, registration]) => registration)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Get child categories
   */
  getChildCategories(parentCategory: NodeCategory): CategoryRegistration[] {
    return this.filter(
      (registration) => registration.parentCategory === parentCategory
    )
      .map(([, registration]) => registration)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Get root categories (without parent)
   */
  getRootCategories(): CategoryRegistration[] {
    return this.filter((registration) => !registration.parentCategory)
      .map(([, registration]) => registration)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Check if category allows node type
   */
  isCategoryAllowedForNodeType(
    category: NodeCategory,
    nodeType: string
  ): boolean {
    const registration = this.get(category);
    if (!registration || !registration.isEnabled) return false;

    if (!registration.allowedNodeTypes) return true; // No restrictions

    return registration.allowedNodeTypes.includes(nodeType);
  }

  /**
   * Check if category has reached node limit
   */
  isCategoryAtNodeLimit(
    category: NodeCategory,
    currentNodeCount: number
  ): boolean {
    const registration = this.get(category);
    if (!registration || !registration.maxNodes) return false;

    return currentNodeCount >= registration.maxNodes;
  }

  /**
   * Get category hierarchy
   */
  getCategoryHierarchy(): Array<{
    category: CategoryRegistration;
    children: CategoryRegistration[];
    depth: number;
  }> {
    const hierarchy: Array<{
      category: CategoryRegistration;
      children: CategoryRegistration[];
      depth: number;
    }> = [];

    const buildHierarchy = (parentCategory?: NodeCategory, depth = 0) => {
      const categories = parentCategory
        ? this.getChildCategories(parentCategory)
        : this.getRootCategories();

      for (const category of categories) {
        const children = this.getChildCategories(category.category);
        hierarchy.push({ category, children, depth });

        if (children.length > 0) {
          buildHierarchy(category.category, depth + 1);
        }
      }
    };

    buildHierarchy();
    return hierarchy;
  }

  /**
   * Validate category hierarchy (no circular dependencies)
   */
  validateHierarchy(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const visited = new Set<NodeCategory>();
    const visiting = new Set<NodeCategory>();

    const checkCircular = (category: NodeCategory): boolean => {
      if (visiting.has(category)) {
        errors.push(
          `Circular dependency detected involving category: ${category}`
        );
        return false;
      }

      if (visited.has(category)) return true;

      visiting.add(category);

      const registration = this.get(category);
      if (registration?.parentCategory) {
        if (!checkCircular(registration.parentCategory)) {
          return false;
        }
      }

      visiting.delete(category);
      visited.add(category);
      return true;
    };

    for (const category of this.keys()) {
      if (!visited.has(category)) {
        checkCircular(category);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  // ============================================================================
  // VALIDATION METHODS
  // ============================================================================

  /**
   * Validate category registration
   */
  private validateCategoryRegistration(registration: CategoryRegistration): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!registration.category) errors.push("category is required");
    if (!registration.displayName) errors.push("displayName is required");
    if (!registration.description) errors.push("description is required");
    if (!registration.folder) errors.push("folder is required");
    if (typeof registration.order !== "number")
      errors.push("order must be a number");
    if (typeof registration.isEnabled !== "boolean")
      errors.push("isEnabled must be a boolean");

    // Order validation
    if (registration.order < 0) {
      warnings.push("Order should be non-negative");
    }

    // Color validation (basic hex check)
    if (registration.color && !/^#[0-9a-fA-F]{6}$/.test(registration.color)) {
      warnings.push("Color should be a valid hex color (e.g., #FF0000)");
    }

    // Parent category validation
    if (
      registration.parentCategory &&
      registration.parentCategory === registration.category
    ) {
      errors.push("Category cannot be its own parent");
    }

    // Node limit validation
    if (registration.maxNodes !== undefined && registration.maxNodes < 0) {
      errors.push("maxNodes must be non-negative");
    }

    // Check for duplicate registration
    if (this.has(registration.category)) {
      warnings.push(`Category ${registration.category} is already registered`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate entire registry
   */
  validateRegistry(): {
    isValid: boolean;
    issues: Array<{ category: string; errors: string[]; warnings: string[] }>;
    hierarchyValidation: { isValid: boolean; errors: string[] };
  } {
    const issues: Array<{
      category: string;
      errors: string[];
      warnings: string[];
    }> = [];
    let isValid = true;

    // Validate individual registrations
    for (const [category, registration] of this.entries()) {
      const validation = this.validateCategoryRegistration(registration);
      if (!validation.isValid || validation.warnings.length > 0) {
        issues.push({
          category,
          errors: validation.errors,
          warnings: validation.warnings,
        });
        if (!validation.isValid) {
          isValid = false;
        }
      }
    }

    // Validate hierarchy
    const hierarchyValidation = this.validateHierarchy();
    if (!hierarchyValidation.isValid) {
      isValid = false;
    }

    return { isValid, issues, hierarchyValidation };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get registry statistics with domain-specific metrics
   */
  getRegistryStats() {
    const baseStats = this.getStats();
    const folderStats = this.values().reduce(
      (acc, reg) => {
        acc[reg.folder] = (acc[reg.folder] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const enabledCount = this.values().filter((reg) => reg.isEnabled).length;
    const rootCategoriesCount = this.getRootCategories().length;
    const maxDepth = Math.max(
      ...this.getCategoryHierarchy().map((h) => h.depth)
    );

    return {
      ...baseStats,
      domain: {
        folders: folderStats,
        enabled: enabledCount,
        rootCategories: rootCategoriesCount,
        maxHierarchyDepth: maxDepth,
        totalCategories: this.size(),
      },
    };
  }

  /**
   * Export registry for persistence/debugging
   */
  export(): Record<NodeCategory, CategoryRegistration> {
    const exported: Record<string, CategoryRegistration> = {};
    for (const [category, registration] of this.entries()) {
      exported[category] = registration;
    }
    return exported as Record<NodeCategory, CategoryRegistration>;
  }

  /**
   * Import categories from configuration
   */
  importFromConfig(
    config: Record<NodeCategory, Partial<CategoryRegistration>>
  ): void {
    for (const [category, partialRegistration] of Object.entries(config)) {
      const registration: CategoryRegistration = {
        category: category as NodeCategory,
        displayName: category,
        description: "",
        icon: "📁",
        color: "#666666",
        order: 0,
        folder: "main" as SidebarFolder,
        isEnabled: true,
        ...partialRegistration,
      };

      try {
        this.registerCategory(registration);
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`Failed to import category ${category}:`, error);
        }
      }
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Global category registry instance
 */
export const categoryRegistry = new CategoryRegistry();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Register category (convenience function)
 */
export function registerCategory(registration: CategoryRegistration): void {
  categoryRegistry.registerCategory(registration);
}

/**
 * Get category metadata (convenience function)
 */
export function getCategoryMetadata(
  category: NodeCategory
): CategoryRegistration | undefined {
  return categoryRegistry.getCategoryMetadata(category);
}

/**
 * Get enabled categories (convenience function)
 */
export function getEnabledCategories(): CategoryRegistration[] {
  return categoryRegistry.getEnabledCategories();
}

/**
 * Get categories by folder (convenience function)
 */
export function getCategoriesByFolder(
  folder: SidebarFolder
): CategoryRegistration[] {
  return categoryRegistry.getCategoriesByFolder(folder);
}
