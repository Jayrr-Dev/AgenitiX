const path = require("path");
const fs = require("fs");

export default function (plop) {
  // Helper functions
  plop.setHelper("ifeq", function (a, b, opts) {
    if (a === b) {
      return opts.fn(this);
    } else {
      return opts.inverse(this);
    }
  });

  plop.setHelper("ifnot", function (a, opts) {
    if (!a) {
      return opts.fn(this);
    } else {
      return opts.inverse(this);
    }
  });

  plop.setHelper("unless", function (a, opts) {
    if (!a) {
      return opts.fn(this);
    } else {
      return opts.inverse(this);
    }
  });

  // V2 Node Generator
  plop.setGenerator("node", {
    description: "Create a new V2 node with full scaffolding",
    prompts: [
      {
        type: "input",
        name: "name",
        message: 'Node name (e.g., "MyAwesome" - will become "MyAwesomeV2"):',
        validate: (input) => {
          if (!input) return "Node name is required";
          if (!/^[A-Z][a-zA-Z0-9]*$/.test(input)) {
            return "Node name must start with uppercase letter and contain only letters and numbers";
          }
          return true;
        },
      },
      {
        type: "list",
        name: "category",
        message: "Node category:",
        choices: [
          { name: "Create - Generate or create new data", value: "create" },
          { name: "Transform - Process or modify data", value: "transform" },
          { name: "Output - Display or export data", value: "output" },
          { name: "Utility - Helper or system functions", value: "utility" },
          { name: "Testing - Development and debugging", value: "testing" },
        ],
      },
      {
        type: "list",
        name: "controlType",
        message: "Inspector control type:",
        choices: [
          { name: "Text Input - Simple text field", value: "text" },
          { name: "Toggle - Boolean on/off switch", value: "toggle" },
          { name: "Custom - Custom control component", value: "custom" },
          { name: "None - No inspector controls", value: "none" },
        ],
      },
      {
        type: "confirm",
        name: "hasInput",
        message: "Does this node accept input data?",
        default: true,
      },
      {
        type: "confirm",
        name: "hasOutput",
        message: "Does this node produce output data?",
        default: true,
      },
      {
        type: "list",
        name: "folder",
        message: "Sidebar folder:",
        choices: [
          { name: "Main - Primary nodes", value: "main" },
          { name: "Testing - Development nodes", value: "testing" },
          { name: "Experimental - Beta features", value: "experimental" },
        ],
      },
      {
        type: "input",
        name: "description",
        message: "Brief description (optional):",
        default: function (data) {
          return `V2 ${data.category} node with enhanced features`;
        },
      },
    ],
    actions: function (data) {
      const actions = [];

      // Enhance data with computed values
      data.nodeType = `${data.name.toLowerCase()}V2`;
      data.componentName = `${data.name}V2`;
      data.interfaceName = `${data.name}V2Data`;
      data.displayName = data.name.replace(/([A-Z])/g, " $1").trim() + " V2";

      // Determine output data type based on category
      data.outputType =
        data.category === "create"
          ? "string"
          : data.category === "transform"
            ? "any"
            : data.category === "output"
              ? "void"
              : "any";

      // 1. Create the main node component in its own folder
      actions.push({
        type: "add",
        path: "features/business-logic-modern/node-domain/{{category}}/{{componentName}}/{{componentName}}.tsx",
        templateFile: "templates/v2-node-component.hbs",
      });

      // 2. Create the meta.json file for the new node
      actions.push({
        type: "add",
        path: "features/business-logic-modern/node-domain/{{category}}/{{componentName}}/meta.json",
        templateFile: "templates/v2-meta-json.hbs",
      });

      // 3. Create custom control component if needed
      if (data.controlType === "custom") {
        actions.push({
          type: "add",
          path: "features/business-logic-modern/infrastructure/node-inspector/controls/{{componentName}}Control.tsx",
          templateFile: "templates/v2-custom-control.hbs",
        });
      }

      // 4. Update type system
      actions.push({
        type: "append",
        path: "features/business-logic-modern/infrastructure/flow-engine/types/nodeData.ts",
        pattern: "// V2U_INTERFACE_INSERTION_POINT",
        template: `
export interface {{interfaceName}} extends BaseNodeData {
  {{#ifeq controlType "text"}}
  text: string;
  {{/ifeq}}
  {{#ifeq controlType "toggle"}}
  enabled: boolean;
  {{/ifeq}}
  {{#ifeq controlType "custom"}}
  config: Record<string, any>;
  {{/ifeq}}
  // V2 metadata
  _v2RegistryVersion?: string;
  _v2CreatedAt?: number;
}`,
      });

      actions.push({
        type: "append",
        path: "features/business-logic-modern/infrastructure/flow-engine/types/nodeData.ts",
        pattern: "// V2U_UNION_INSERTION_POINT",
        template: "  | {{interfaceName}}",
      });

      actions.push({
        type: "append",
        path: "features/business-logic-modern/infrastructure/flow-engine/types/nodeData.ts",
        pattern: "// V2U_TYPE_INSERTION_POINT",
        template: '  | "{{nodeType}}"',
      });

      // 5. Instructions for manual updates (until we have full automation)
      actions.push({
        type: "add",
        path: "features/business-logic-modern/node-domain/{{category}}/{{componentName}}_SETUP_INSTRUCTIONS.md",
        templateFile: "templates/v2-setup-instructions.hbs",
      });

      return actions;
    },
  });

  // Additional generators for specific components
  plop.setGenerator("control", {
    description: "Create a custom inspector control component",
    prompts: [
      {
        type: "input",
        name: "name",
        message: 'Control name (e.g., "Database"):',
        validate: (input) => (input ? true : "Control name is required"),
      },
    ],
    actions: [
      {
        type: "add",
        path: "features/business-logic-modern/infrastructure/node-inspector/controls/{{pascalCase name}}Control.tsx",
        templateFile: "templates/v2-custom-control.hbs",
      },
    ],
  });
}
