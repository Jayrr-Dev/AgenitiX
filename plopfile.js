module.exports = function (plop) {
  plop.setGenerator('node', {
    description: 'Create a new node using the NodeSpec architecture',
    prompts: [
      {
        type: 'input',
        name: 'kind',
        message: 'What is the kind of the node? (e.g., createText, viewCsv)',
      },
      {
        type: 'list',
        name: 'domain',
        message: 'What is the domain of the node?',
        choices: ['create', 'view', 'trigger', 'test', 'cycle', 'custom'],
      },
      {
        type: 'list',
        name: 'category',
        message: 'What is the functional category of the node?',
        choices: ['CREATE', 'VIEW', 'TRIGGER', 'TEST', 'CYCLE'],
      },
    ],
    actions: [
      {
        type: 'add',
        path: 'features/business-logic-modern/node-domain/{{domain}}/{{camelCase kind}}.node.tsx',
        templateFile: 'tooling/dev-scripts/plop-templates/node.tsx.hbs',
      },
      {
        type: 'append',
        path: 'features/business-logic-modern/node-domain/index.ts',
        template: `export { default as {{pascalCase kind}}Node } from './{{domain}}/{{camelCase kind}}.node';`,
      },
    ],
  });
}; 