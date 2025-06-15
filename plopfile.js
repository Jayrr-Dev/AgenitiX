const fs = require("fs");
const path = require("path");

module.exports = function (plop) {
  // Helpers to resolve size constants for templates
  plop.setHelper("collapsedSizeConstant", (key) => `COLLAPSED_SIZES.${key}`);
  plop.setHelper("expandedSizeConstant", (key) =>
    key.startsWith("V")
      ? `EXPANDED_VARIABLE_SIZES.${key}`
      : `EXPANDED_SIZES.${key}`
  );

  plop.setGenerator("node", {
    description: "Create a new node using the NodeSpec architecture",
    prompts: [
      {
        type: "input",
        name: "kind",
        message: "What is the kind of the node? (e.g., createText, viewCsv)",
      },
      {
        type: "list",
        name: "domain",
        message: "What is the domain of the node?",
        choices: ["create", "view", "trigger", "test", "cycle", "custom"],
      },
      {
        type: "list",
        name: "category",
        message: "What is the functional category of the node?",
        choices: ["CREATE", "VIEW", "TRIGGER", "TEST", "CYCLE"],
      },
      {
        type: "list",
        name: "collapsedSize",
        message: "Select collapsed size",
        choices: ["C1", "C1W", "C2", "C3"],
      },
      {
        type: "list",
        name: "expandedSize",
        message: "Select expanded size",
        choices: [
          "FE0",
          "FE1",
          "FE1H",
          "FE2",
          "FE3",
          "VE0",
          "VE1",
          "VE2",
          "VE3",
        ],
      },
      {
        type: "input",
        name: "tsSymbol",
        message:
          "Optional: TypeScript symbol for primary output handle (leave blank for none)",
      },
    ],
    actions: [
      {
        type: "add",
        path: "features/business-logic-modern/node-domain/{{domain}}/{{kind}}.node.tsx",
        templateFile: "tooling/dev-scripts/plop-templates/node.tsx.hbs",
      },
      {
        type: "modify",
        path: "features/business-logic-modern/infrastructure/flow-engine/hooks/useDynamicNodeTypes.ts",
        pattern:
          /\/\/ Add new node imports here \(Plop can auto-inject these\)/g,
        template:
          "// Add new node imports here (Plop can auto-inject these)\nimport {{kind}} from '../../../node-domain/{{domain}}/{{kind}}.node';",
      },
      {
        type: "modify",
        path: "features/business-logic-modern/infrastructure/flow-engine/hooks/useDynamicNodeTypes.ts",
        pattern: /\/\/ Add new node types here/g,
        template: "// Add new node types here\n    {{kind}},",
      },
      {
        type: "modify",
        path: "features/business-logic-modern/infrastructure/node-registry/nodespec-registry.ts",
        pattern:
          /\/\/ Import node specs directly - this will be auto-updated by Plop[\s\S]*?\n/,
        template: (match) =>
          `${match}import {{kind}}, { spec as {{kind}}Spec } from '../../node-domain/{{domain}}/{{kind}}.node';\n`,
      },
      {
        type: "modify",
        path: "features/business-logic-modern/infrastructure/node-registry/nodespec-registry.ts",
        pattern:
          /\{\s*\/\/ Add new node specs here \(auto-updated by Plop\)([\s\S]*?)\}/,
        template: (match, inner) =>
          `{\n  // Add new node specs here (auto-updated by Plop)\n  {{kind}}: {{kind}}Spec,${inner}}`,
      },
      {
        type: "modify",
        path: "features/business-logic-modern/node-domain/index.ts",
        pattern: /\/\/ Node exports will be added here automatically by Plop/g,
        template:
          "// Node exports will be added here automatically by Plop\nexport { default as {{kind}} } from './{{domain}}/{{kind}}.node';",
      },
      {
        type: "add",
        path: "stories/{{pascalCase kind}}Preview.stories.tsx",
        templateFile:
          "tooling/dev-scripts/plop-templates/node-preview.stories.tsx.hbs",
      },
    ],
  });

  plop.setGenerator("delete-node", {
    description: "Delete an existing node and clean up registry files",
    prompts: [
      {
        type: "list",
        name: "nodeToDelete",
        message: "Which node would you like to delete?",
        choices: () => {
          const nodeBasePath = path.join(
            __dirname,
            "features/business-logic-modern/node-domain"
          );
          const domains = [
            "create",
            "view",
            "trigger",
            "test",
            "cycle",
            "custom",
          ];
          let nodes = [];
          domains.forEach((domain) => {
            const domainPath = path.join(nodeBasePath, domain);
            if (fs.existsSync(domainPath)) {
              const files = fs
                .readdirSync(domainPath)
                .filter((file) => file.endsWith(".node.tsx"))
                .map((file) => ({
                  name: file.replace(".node.tsx", ""),
                  value: {
                    kind: file.replace(".node.tsx", ""),
                    domain: domain,
                    filePath: path.join(domainPath, file),
                  },
                }));
              nodes = nodes.concat(files);
            }
          });
          if (nodes.length === 0) {
            return [{ name: "No nodes found to delete.", disabled: true }];
          }
          return nodes;
        },
        filter: (data) => {
          return data;
        },
      },
    ],
    actions: (data) => {
      const { kind, domain, filePath } = data.nodeToDelete;

      if (!kind) {
        console.log("No node selected. Aborting.");
        return [];
      }

      console.log(`Preparing to delete node: ${kind} from domain: ${domain}`);

      return [
        // Custom action: delete the node file (Plop doesn't have a built-in "remove" action)
        () => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return `Deleted file ${filePath}`;
          }
          return `File already deleted: ${filePath}`;
        },
        {
          type: "modify",
          path: "features/business-logic-modern/infrastructure/flow-engine/hooks/useDynamicNodeTypes.ts",
          pattern: new RegExp(
            `import ${kind} from '..*?/node-domain/${domain}/${kind}.node';\\r?\\n`,
            "g"
          ),
          template: "",
        },
        {
          type: "modify",
          path: "features/business-logic-modern/infrastructure/flow-engine/hooks/useDynamicNodeTypes.ts",
          pattern: new RegExp(`    ${kind},\\r?\\n`, "g"),
          template: "",
        },
        {
          type: "modify",
          path: "features/business-logic-modern/infrastructure/node-registry/nodespec-registry.ts",
          pattern: new RegExp(
            `import ${kind}, { spec as ${kind}Spec } from '..*?/node-domain/${domain}/${kind}.node';\\r?\\n`,
            "g"
          ),
          template: "",
        },
        {
          type: "modify",
          path: "features/business-logic-modern/infrastructure/node-registry/nodespec-registry.ts",
          pattern: new RegExp(`  ${kind}: ${kind}Spec,\\r?\\n`, "g"),
          template: "",
        },
        {
          type: "modify",
          path: "features/business-logic-modern/node-domain/index.ts",
          pattern: new RegExp(
            `export { default as ${kind} } from './${domain}/${kind}.node';\\r?\\n`,
            "g"
          ),
          template: "",
        },
        () =>
          `Successfully deleted node '${kind}' and all associated registry entries.`,
      ];
    },
  });
};
