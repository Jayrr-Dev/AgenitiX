import { Project, IndentationText, QuoteKind } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs/promises';

async function runMigration() {
  const project = new Project({
    tsConfigFilePath: 'tsconfig.node.json',
    manipulationSettings: {
      indentationText: IndentationText.TwoSpaces,
      quoteKind: QuoteKind.Single,
    },
  });

  const nodeDomainDir = 'features/business-logic-modern/node-domain';
  const domains = ['test', 'trigger', 'view']; // 'create' is already done

  for (const domain of domains) {
    const domainPath = path.join(nodeDomainDir, domain);
    
    try {
      const files = await fs.readdir(domainPath);

      for (const file of files) {
        if (file.endsWith('.tsx') && !file.includes('.node.')) {
          const componentName = path.basename(file, '.tsx');
          const metaJsonPath = path.join(domainPath, componentName, 'meta.json');
          
          try {
            const metaJsonContent = await fs.readFile(metaJsonPath, 'utf-8');
            const meta = JSON.parse(metaJsonContent);

            // Create the new node file
            const newFilePath = path.join(domainPath, `${meta.nodeType}.node.tsx`);
            
            const nodeContent = `import type { NodeProps } from '@xyflow/react';
import { useState } from 'react';

import { withNodeScaffold } from '@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold';
import type { NodeSpec } from '@/features/business-logic-modern/infrastructure/node-core/NodeSpec';
import { CATEGORIES } from '@/features/business-logic-modern/infrastructure/theming/categories';
import { EXPANDED_FIXED_SIZES, COLLAPSED_SIZES } from '@/features/business-logic-modern/infrastructure/theming/sizing';

const spec: NodeSpec = {
  kind: '${meta.nodeType}',
  displayName: '${meta.displayName}',
  category: CATEGORIES.${meta.category.toUpperCase()},
  size: {
    expanded: EXPANDED_FIXED_SIZES.FE1,
    collapsed: COLLAPSED_SIZES.C1,
  },
  handles: ${JSON.stringify(meta.handles, null, 4)},
  inspector: {
    key: '${componentName}Inspector',
  },
  initialData: ${JSON.stringify(Object.fromEntries(Object.entries(meta.data).map(([key, value]: [string, any]) => [key, value.default])), null, 4)},
};

type ${componentName}Data = ${JSON.stringify(Object.fromEntries(Object.entries(meta.data).map(([key, value]: [string, any]) => [key, value.default])), null, 2)};

const ${componentName}Component = ({ data, id }: NodeProps<${componentName}Data>) => {
  const [isExpanded, setExpanded] = useState(true);

  // In a real implementation, this would come from a hook like useNodeData(id)
  const updateData = (newData: Partial<${componentName}Data>) => console.log(\`Updating data for \${id}:\`, newData);

  const onToggle = () => setExpanded(!isExpanded);

  return (
    <>
      <button onClick={onToggle} style={{position: 'absolute', top: 2, left: 2, zIndex: 10}}>
        {isExpanded ? '⦾' : '⦿'}
      </button>

      {isExpanded ? (
        <div className="p-4 pt-6">
          <h3 className="text-sm font-semibold mb-2">${meta.displayName}</h3>
          <p className="text-xs text-gray-600">${meta.description}</p>
          {/* Add your expanded UI here */}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-2xl">${meta.icon === 'text' ? '✍️' : '📄'}</p>
        </div>
      )}
    </>
  );
};

export default withNodeScaffold(spec, ${componentName}Component);
`;

            await fs.writeFile(newFilePath, nodeContent);

            // Append to index
            const indexPath = path.join(nodeDomainDir, 'index.ts');
            await fs.appendFile(indexPath, `\nexport { default as ${componentName}Node } from './${domain}/${meta.nodeType}.node';`);
            
            // Delete old files
            await fs.unlink(path.join(domainPath, file));
            await fs.rm(path.join(domainPath, componentName), { recursive: true, force: true });

            console.log(`✅ Migrated ${componentName} -> ${meta.nodeType}.node.tsx`);

          } catch (error) {
            console.log(`⚠️  Could not find meta.json for ${componentName}, skipping.`);
          }
        }
      }
    } catch (error) {
      console.log(`⚠️  Could not read domain directory ${domain}, skipping.`);
    }
  }

  console.log('\n🎉 Migration completed!');
}

runMigration().catch(console.error);
 