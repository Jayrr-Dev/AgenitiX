/**
 * NODE INSPECTOR SERVICE - Enhanced with Schema-Driven Control Generation
 *
 * • Automatically generates control fields from Zod schemas in NodeSpec
 * • Supports 400+ node types with zero maintenance overhead
 * • Provides type-safe control rendering with built-in validation
 * • Enables custom field overrides and advanced control configurations
 * • Integrates seamlessly with the enhanced NodeSpec architecture
 *
 * Keywords: schema-driven-controls, automatic-generation, scalable-architecture, type-safety, zero-maintenance
 */

import type { AgenNode } from "../../flow-engine/types/nodeData";
import type { ControlsConfig } from "../../node-core/NodeSpec";
import {
  SchemaIntrospector,
  type SchemaFieldInfo,
} from "../../node-core/schema-helpers";
import {
  getNodeSpecMetadata,
  hasNodeSpec,
  nodeSpecs,
} from "../../node-registry/nodespec-registry";
import type { NodeType } from "../types";

// ============================================================================
// ENHANCED CONTROL FIELD INTERFACE
// ============================================================================

/**
 * Enhanced control field definition for dynamic rendering
 * Now supports all modern control types and advanced configurations
 */
export interface ControlField {
  key: string;
  type:
    | "text"
    | "number"
    | "boolean"
    | "select"
    | "textarea"
    | "url"
    | "email"
    | "color"
    | "date"
    | "json";
  label: string;
  defaultValue: unknown;
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: Array<{ value: unknown; label: string }>;
  };
  description?: string;
  placeholder?: string;
  ui?: {
    rows?: number; // For textarea
    step?: number; // For number inputs
    multiline?: boolean;
    showPreview?: boolean;
  };
}

/**
 * Field group for organizing related controls
 */
export interface ControlFieldGroup {
  title: string;
  fields: ControlField[];
  collapsible?: boolean;
}

/**
 * Complete control configuration for a node
 */
export interface NodeControlConfig {
  fields: ControlField[];
  groups?: ControlFieldGroup[];
  hasCustomComponent?: boolean;
  customComponentName?: string;
}

// ============================================================================
// ENHANCED NODE INSPECTOR SERVICE
// ============================================================================

class NodeInspectorServiceImpl {
  // ============================================================================
  // SCHEMA-DRIVEN CONTROL GENERATION
  // ============================================================================

  /**
   * Generate control fields from a node's Zod schema with advanced customization
   * This is the core method that enables scalable control generation for 400+ nodes
   */
  generateControlFields(nodeType: NodeType): ControlField[] {
    try {
      // Type guard for nodeType
      if (!nodeType) {
        console.warn("Node type is undefined");
        return [];
      }

      console.log(`[NodeInspectorService] Generating control fields for: ${nodeType}`);

      // Get the node spec metadata
      const metadata = getNodeSpecMetadata(nodeType);
      if (!metadata) {
        console.warn(`No metadata found for node type: ${nodeType}`);
        return [];
      }

      console.log(`[NodeInspectorService] Found metadata for ${nodeType}:`, metadata);

      // Get the actual NodeSpec to access schema and controls config
      const nodeSpec = this.getNodeSpec(nodeType);
      if (!nodeSpec) {
        console.warn(`No nodeSpec found for node type: ${nodeType}`);
        return [];
      }

      console.log(`[NodeInspectorService] Found nodeSpec for ${nodeType}:`, {
        hasDataSchema: !!nodeSpec.dataSchema,
        hasControls: !!nodeSpec.controls,
        controls: nodeSpec.controls
      });

      if (!nodeSpec.dataSchema) {
        console.warn(`No schema found for node type: ${nodeType}`);
        return [];
      }

      // Use schema introspection to analyze the Zod schema
      const schemaFields = SchemaIntrospector.analyzeSchema(
        nodeSpec.dataSchema
      );

      console.log(`[NodeInspectorService] Schema analysis for ${nodeType} found ${schemaFields.length} fields:`, schemaFields);

      // Convert schema field info to control fields
      let controlFields = schemaFields.map(this.convertSchemaFieldToControl);

      console.log(`[NodeInspectorService] Converted to ${controlFields.length} control fields:`, controlFields);

      // Apply control configuration customizations
      if (nodeSpec.controls) {
        console.log(`[NodeInspectorService] Applying control customizations for ${nodeType}`);
        controlFields = this.applyControlCustomizations(
          controlFields,
          nodeSpec.controls
        );
        console.log(`[NodeInspectorService] After customizations: ${controlFields.length} fields:`, controlFields);
      }

      // Filter out excluded fields and system fields
      controlFields = this.filterControlFields(
        controlFields,
        nodeSpec.controls
      );

      console.log(`[NodeInspectorService] Final control fields for ${nodeType}: ${controlFields.length} fields:`, controlFields);

      return controlFields;
    } catch (error) {
      console.error(
        `Failed to generate control fields for ${nodeType}:`,
        error
      );
      return [];
    }
  }

  /**
   * Get complete control configuration including groups and custom components
   */
  getNodeControlConfig(nodeType: NodeType): NodeControlConfig {
    const fields = this.generateControlFields(nodeType);
    const nodeSpec = this.getNodeSpec(nodeType);
    const controlsConfig = nodeSpec?.controls;

    const config: NodeControlConfig = {
      fields,
      hasCustomComponent: !!controlsConfig?.customComponent,
      customComponentName: controlsConfig?.customComponent,
    };

    // Create field groups if configured
    if (controlsConfig?.fieldGroups) {
      config.groups = controlsConfig.fieldGroups.map((groupConfig: any) => ({
        title: groupConfig.title,
        collapsible: groupConfig.collapsible,
        fields: fields.filter((field) =>
          groupConfig.fields.includes(field.key)
        ),
      }));
    }

    return config;
  }

  /**
   * Check if a node has schema-driven controls available
   */
  hasSchemaControls(nodeType: NodeType): boolean {
    const nodeSpec = this.getNodeSpec(nodeType);
    return !!(
      nodeSpec?.dataSchema && nodeSpec?.controls?.autoGenerate !== false
    );
  }

  /**
   * Check if a node has custom control component
   */
  hasCustomControlComponent(nodeType: NodeType): boolean {
    const nodeSpec = this.getNodeSpec(nodeType);
    return !!nodeSpec?.controls?.customComponent;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Get NodeSpec from registry (with proper typing)
   */
  private getNodeSpec(nodeType: NodeType): any {
    try {
      if (!nodeType) return null;

      // Access the actual NodeSpec from the registry
      const nodeSpec = nodeSpecs[nodeType as keyof typeof nodeSpecs];
      if (!nodeSpec) {
        console.warn(`NodeSpec not found for type: ${nodeType}`);
        return null;
      }

      return nodeSpec;
    } catch (error) {
      console.warn(`Could not retrieve NodeSpec for ${nodeType}:`, error);
      return null;
    }
  }

  /**
   * Convert schema field info to control field
   */
  private convertSchemaFieldToControl = (
    schemaField: SchemaFieldInfo
  ): ControlField => {
    return {
      key: schemaField.key,
      type: schemaField.controlType,
      label: schemaField.label,
      defaultValue: schemaField.defaultValue,
      required: schemaField.required,
      validation: schemaField.validation,
      description: schemaField.description,
      placeholder: schemaField.placeholder,
      ui: schemaField.ui,
    };
  };

  /**
   * Apply control customizations from NodeSpec controls config
   */
  private applyControlCustomizations(
    fields: ControlField[],
    controlsConfig: ControlsConfig
  ): ControlField[] {
    if (!controlsConfig.customFields) return fields;

    return fields.map((field) => {
      const customField = controlsConfig.customFields?.find(
        (cf) => cf.key === field.key
      );
      if (!customField) return field;

      // Merge custom configuration with generated field
      return {
        ...field,
        ...customField,
        validation: { ...field.validation, ...customField.validation },
        ui: { ...field.ui, ...customField.ui },
      };
    });
  }

  /**
   * Filter out excluded fields and system fields
   */
  private filterControlFields(
    fields: ControlField[],
    controlsConfig?: ControlsConfig
  ): ControlField[] {
    // System fields that should not have controls
    const systemFields = ["isActive", "id", "type"];

    // User-excluded fields
    const excludedFields = controlsConfig?.excludeFields || [];

    const allExcludedFields = [...systemFields, ...excludedFields];

    return fields.filter((field) => !allExcludedFields.includes(field.key));
  }

  // ============================================================================
  // LEGACY METHODS (Maintained for backward compatibility)
  // ============================================================================

  /**
   * Get node metadata from the registry
   */
  getNodeMetadata(nodeType: NodeType) {
    if (!nodeType) return null;
    return getNodeSpecMetadata(nodeType);
  }

  /**
   * Check if a node type exists in the registry
   */
  nodeExists(nodeType: NodeType): boolean {
    if (!nodeType) return false;
    return hasNodeSpec(nodeType);
  }

  /**
   * Update node data with validation
   */
  updateNodeData(
    node: AgenNode,
    updates: Record<string, unknown>
  ): { success: boolean; errors: string[] } {
    try {
      // Basic validation - in a real implementation, this would use the node's schema
      const errors: string[] = [];

      // Validate each update
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          errors.push(`${key}: Value cannot be null or undefined`);
        }
      });

      return {
        success: errors.length === 0,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Update failed: ${error}`],
      };
    }
  }

  /**
   * Get node data with defaults applied
   */
  getNodeDataWithDefaults(node: AgenNode): Record<string, unknown> {
    const nodeSpec = this.getNodeSpec(node.type as any);
    const defaults = nodeSpec?.initialData || {};

    return { ...defaults, ...node.data };
  }

  // ============================================================================
  // UTILITY METHODS (NodeSpec-Based)
  // ============================================================================

  /**
   * Check if a node has custom controls based on NodeSpec metadata
   */
  hasCustomControls(nodeType: NodeType): boolean {
    // Check for schema-driven controls first
    if (this.hasSchemaControls(nodeType)) {
      return true;
    }

    // Check for custom control component
    if (this.hasCustomControlComponent(nodeType)) {
      return true;
    }

    // Fallback to legacy detection based on category
    const metadata = this.getNodeMetadata(nodeType);
    return this.determineHasControls(metadata);
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Determine if a node has controls based on NodeSpec metadata
   */
  private determineHasControls(metadata: any): boolean {
    // Use NodeSpec metadata to determine control availability
    // Categories like CREATE and TRIGGER typically have controls
    return (
      metadata.category === "CREATE" ||
      metadata.category === "TRIGGER" ||
      metadata.inspector?.key !== undefined
    );
  }
}

// Export singleton instance
export const NodeInspectorService = new NodeInspectorServiceImpl();
