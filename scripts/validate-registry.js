const { z } = require("zod");
const fs = require("fs");
const path = require("path");

// Define comprehensive Zod schemas for node validation
const HandleSchema = z.object({
  id: z.string().min(1, "Handle ID is required"),
  type: z.enum(
    ["source", "target"],
    "Handle type must be 'source' or 'target'"
  ),
  position: z.enum(
    ["left", "right", "top", "bottom"],
    "Invalid handle position"
  ),
  dataType: z.string().min(1, "Data type is required"),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
});

const NodeRegistrationSchema = z.object({
  nodeType: z.string().min(1, "Node type is required"),
  category: z.enum(
    ["create", "transform", "output", "utility", "testing"],
    "Invalid category"
  ),
  displayName: z.string().min(1, "Display name is required"),
  description: z.string().min(1, "Description is required"),
  icon: z.string().min(1, "Icon is required"),
  folder: z.enum(["main", "testing", "experimental"], "Invalid folder"),
  order: z.number().min(0, "Order must be non-negative"),

  // Dimensions
  iconWidth: z.number().positive("Icon width must be positive"),
  iconHeight: z.number().positive("Icon height must be positive"),
  expandedWidth: z.number().positive("Expanded width must be positive"),
  expandedHeight: z.number().positive("Expanded height must be positive"),

  // UI Configuration
  hasToggle: z.boolean(),
  isEnabled: z.boolean(),
  isExperimental: z.boolean().optional(),

  // Handles
  handles: z.array(HandleSchema).min(0, "Handles must be an array"),

  // Default data with V2 metadata
  defaultData: z
    .object({
      _v2RegistryVersion: z.string().optional(),
      _v2CreatedAt: z.number().optional(),
    })
    .passthrough(), // Allow additional properties
});

const V2ControlSchema = z.object({
  controlType: z.enum(
    ["v2", "legacy", "factory", "none"],
    "Invalid control type"
  ),
  v2ControlType: z.string().optional(),
  legacyControlType: z.string().optional(),
  hasControls: z.boolean(),
});

class RegistryValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.validNodes = [];
    this.invalidNodes = [];
  }

  /**
   * Validate a single node configuration
   */
  validateNode(nodeType, nodeConfig) {
    try {
      // Validate basic node structure
      const validatedConfig = NodeRegistrationSchema.parse(nodeConfig);

      // Additional V2-specific validations
      this.validateV2Features(nodeType, validatedConfig);

      this.validNodes.push({
        nodeType,
        config: validatedConfig,
        status: "valid",
      });

      return { isValid: true, errors: [], warnings: [] };
    } catch (error) {
      const nodeErrors = error.errors || [{ message: error.message }];

      this.invalidNodes.push({
        nodeType,
        config: nodeConfig,
        status: "invalid",
        errors: nodeErrors,
      });

      return {
        isValid: false,
        errors: nodeErrors.map((e) => e.message),
        warnings: [],
      };
    }
  }

  /**
   * Validate V2-specific features
   */
  validateV2Features(nodeType, config) {
    const warnings = [];

    // Check for V2 metadata
    if (!config.defaultData._v2RegistryVersion) {
      warnings.push(`${nodeType}: Missing V2 registry version in defaultData`);
    }

    if (!config.defaultData._v2CreatedAt) {
      warnings.push(
        `${nodeType}: Missing V2 creation timestamp in defaultData`
      );
    }

    // Check experimental flag for new nodes
    if (config.isExperimental === undefined) {
      warnings.push(
        `${nodeType}: Consider setting isExperimental flag for new V2 nodes`
      );
    }

    // Validate handle consistency
    this.validateHandleConsistency(nodeType, config.handles, warnings);

    this.warnings.push(...warnings);
  }

  /**
   * Validate handle consistency and naming
   */
  validateHandleConsistency(nodeType, handles, warnings) {
    if (!handles || handles.length === 0) {
      warnings.push(`${nodeType}: Node has no handles - is this intentional?`);
      return;
    }

    const handleIds = handles.map((h) => h.id);
    const duplicateIds = handleIds.filter(
      (id, index) => handleIds.indexOf(id) !== index
    );

    if (duplicateIds.length > 0) {
      warnings.push(
        `${nodeType}: Duplicate handle IDs found: ${duplicateIds.join(", ")}`
      );
    }

    // Check for common handle naming patterns
    handles.forEach((handle) => {
      if (
        handle.type === "source" &&
        !["output", "result", "data"].some((pattern) =>
          handle.id.toLowerCase().includes(pattern)
        )
      ) {
        warnings.push(
          `${nodeType}: Source handle '${handle.id}' doesn't follow common naming patterns`
        );
      }

      if (
        handle.type === "target" &&
        !["input", "data", "value"].some((pattern) =>
          handle.id.toLowerCase().includes(pattern)
        )
      ) {
        warnings.push(
          `${nodeType}: Target handle '${handle.id}' doesn't follow common naming patterns`
        );
      }
    });
  }

  /**
   * Validate control configuration
   */
  validateControlConfig(nodeType, controlConfig) {
    try {
      V2ControlSchema.parse(controlConfig);
      return { isValid: true, errors: [] };
    } catch (error) {
      return {
        isValid: false,
        errors: error.errors.map((e) => e.message),
      };
    }
  }

  /**
   * Load and validate the complete node registry
   */
  async validateRegistry(registryPath) {
    try {
      console.log(`🔍 Loading registry from: ${registryPath}`);

      // Check if file exists
      if (!fs.existsSync(registryPath)) {
        throw new Error(`Registry file not found: ${registryPath}`);
      }

      // Load the registry file
      const registryContent = fs.readFileSync(registryPath, "utf8");

      // Extract the registry object (handle different export formats)
      let nodeRegistry;
      if (registryContent.includes("export default")) {
        // ES module format
        const tempFile = path.join(__dirname, "temp-registry.mjs");
        fs.writeFileSync(tempFile, registryContent);
        nodeRegistry = await import(tempFile).then((m) => m.default);
        fs.unlinkSync(tempFile);
      } else {
        // CommonJS or object literal format
        eval(`nodeRegistry = ${registryContent.replace(/export\s+/, "")}`);
      }

      if (!nodeRegistry || typeof nodeRegistry !== "object") {
        throw new Error(
          "Invalid registry format: Could not extract node registry object"
        );
      }

      console.log(
        `📊 Found ${Object.keys(nodeRegistry).length} nodes to validate`
      );

      // Validate each node
      for (const [nodeType, config] of Object.entries(nodeRegistry)) {
        this.validateNode(nodeType, config);
      }

      return this.generateReport();
    } catch (error) {
      console.error("❌ Registry validation failed:", error.message);
      return {
        success: false,
        error: error.message,
        validNodes: 0,
        invalidNodes: 0,
        errors: [error.message],
        warnings: [],
      };
    }
  }

  /**
   * Generate validation report
   */
  generateReport() {
    const report = {
      success: this.invalidNodes.length === 0,
      validNodes: this.validNodes.length,
      invalidNodes: this.invalidNodes.length,
      totalNodes: this.validNodes.length + this.invalidNodes.length,
      errors: this.errors,
      warnings: this.warnings,
      details: {
        valid: this.validNodes,
        invalid: this.invalidNodes,
      },
    };

    return report;
  }

  /**
   * Print validation results to console
   */
  printReport(report) {
    console.log("\n📋 Registry Validation Report");
    console.log("==============================");

    if (report.success) {
      console.log(`✅ All ${report.validNodes} nodes passed validation!`);
    } else {
      console.log(
        `❌ ${report.invalidNodes} of ${report.totalNodes} nodes failed validation`
      );
      console.log(`✅ ${report.validNodes} nodes passed validation`);
    }

    if (report.warnings.length > 0) {
      console.log(`\n⚠️  ${report.warnings.length} warnings:`);
      report.warnings.forEach((warning) => console.log(`   ${warning}`));
    }

    if (report.errors.length > 0) {
      console.log(`\n🚫 Errors:`);
      report.errors.forEach((error) => console.log(`   ${error}`));
    }

    if (report.details.invalid.length > 0) {
      console.log(`\n❌ Invalid nodes:`);
      report.details.invalid.forEach((node) => {
        console.log(`   ${node.nodeType}:`);
        node.errors.forEach((error) => console.log(`     - ${error}`));
      });
    }

    console.log("\n" + "=".repeat(50));

    return report.success;
  }
}

// Main validation function
async function validateNodeRegistry() {
  const validator = new RegistryValidator();

  // Default registry path
  const registryPath = path.join(
    process.cwd(),
    "features/business-logic-modern/infrastructure/node-creation/core/registries/json-node-registry/generated/nodeRegistry.ts"
  );

  // Allow custom path from command line
  const customPath = process.argv[2];
  const finalPath = customPath || registryPath;

  console.log("🚀 V2 Node Registry Validator");
  console.log("=============================");

  const report = await validator.validateRegistry(finalPath);
  const success = validator.printReport(report);

  // Exit with appropriate code
  process.exit(success ? 0 : 1);
}

// Export for use as module
module.exports = {
  RegistryValidator,
  NodeRegistrationSchema,
  V2ControlSchema,
  HandleSchema,
  validateNodeRegistry,
};

// Run if called directly
if (require.main === module) {
  validateNodeRegistry().catch((error) => {
    console.error("❌ Validation script failed:", error);
    process.exit(1);
  });
}
