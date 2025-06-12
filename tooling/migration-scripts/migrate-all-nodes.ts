import { promises as fs } from 'fs';
import * as path from 'path';
import { Project, SyntaxKind, Node } from 'ts-morph';

const project = new Project();

interface NodeMeta {
  kind: string;
  displayName: string;
  category: string;
  size: {
    expanded: string;
    collapsed: string;
  };
  handles: Array<{
    id: string;
    dataType: string;
    position: string;
    type: string;
  }>;
  inspector: {
    key: string;
  };
  initialData?: Record<string, any>;
}

interface MigrationResult {
  nodeType: string;
  success: boolean;
  error?: string;
  files: {
    created: string[];
    deleted: string[];
  };
}

/**
 * Generate enterprise-grade Zod schema from initial data
 */
function generateZodSchema(initialData: Record<string, any> = {}, nodeType: string): string {
  const schemaFields: string[] = [];
  
  for (const [key, value] of Object.entries(initialData)) {
    const fieldType = inferZodType(value);
    schemaFields.push(`  ${key}: ${fieldType},`);
  }
  
  if (schemaFields.length === 0) {
    return `const ${nodeType}DataSchema = z.object({
  // Add your data fields here using CommonSchemas
  // Example: text: CommonSchemas.text.default('Default value'),
}).strict();`;
  }
  
  return `const ${nodeType}DataSchema = z.object({
${schemaFields.join('\n')}
}).strict();`;
}

/**
 * Infer Zod type from JavaScript value with enterprise validations
 */
function inferZodType(value: any): string {
  if (typeof value === 'string') {
    if (value.length > 0) {
      return `CommonSchemas.text.default('${value.replace(/'/g, "\\'")}')`;
    }
    return `CommonSchemas.optionalText`;
  }
  
  if (typeof value === 'number') {
    if (Number.isInteger(value) && value > 0) {
      return `CommonSchemas.positiveInt.default(${value})`;
    }
    return `CommonSchemas.number.default(${value})`;
  }
  
  if (typeof value === 'boolean') {
    return `CommonSchemas.boolean.default(${value})`;
  }
  
  if (Array.isArray(value)) {
    return `CommonSchemas.stringArray.default(${JSON.stringify(value)})`;
  }
  
  if (typeof value === 'object' && value !== null) {
    return `CommonSchemas.jsonObject.default(${JSON.stringify(value)})`;
  }
  
  return `z.unknown().default(${JSON.stringify(value)})`;
}

/**
 * Generate enterprise node component with validation
 */
function generateNodeComponent(meta: NodeMeta): string {
  const nodeType = meta.kind.charAt(0).toUpperCase() + meta.kind.slice(1);
  const zodSchema = generateZodSchema(meta.initialData, nodeType);
  
  const handlesArray = meta.handles.map(handle => 
    `    { id: '${handle.id}', dataType: '${handle.dataType}', position: '${handle.position}', type: '${handle.type}' },`
  ).join('\n');

  return `import type { NodeProps } from '@xyflow/react';
import { useState } from 'react';
import { z } from 'zod';

import { withNodeScaffold } from '@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold';
import type { NodeSpec } from '@/features/business-logic-modern/infrastructure/node-core/NodeSpec';
import { 
  createNodeValidator, 
  CommonSchemas, 
  reportValidationError,
  useNodeDataValidation 
} from '@/features/business-logic-modern/infrastructure/node-core/validation';
import { CATEGORIES } from '@/features/business-logic-modern/infrastructure/theming/categories';
import { EXPANDED_SIZES, COLLAPSED_SIZES } from '@/features/business-logic-modern/infrastructure/theming/sizing';

/**
 * Enterprise-grade data schema for ${nodeType} node
 */
${zodSchema}

type ${nodeType}Data = z.infer<typeof ${nodeType}DataSchema>;

// Create enterprise validator
const validateNodeData = createNodeValidator(${nodeType}DataSchema, '${nodeType}');

/**
 * Node specification with enterprise configuration
 */
const spec: NodeSpec = {
  kind: '${meta.kind}',
  displayName: '${meta.displayName}',
  category: CATEGORIES.${meta.category.toUpperCase()},
  size: {
    expanded: ${meta.size.expanded},
    collapsed: ${meta.size.collapsed},
  },
  handles: [
${handlesArray}
  ],
  inspector: {
    key: '${meta.inspector.key}',
  },
  initialData: ${nodeType}DataSchema.parse({}),
};

/**
 * ${meta.displayName} Node Component
 * 
 * Enterprise standards:
 * - Type-safe data validation with Zod
 * - Comprehensive error handling and reporting
 * - Real-time validation metrics
 * - Audit trail for data updates
 */
const ${nodeType}NodeComponent = ({ data, id }: NodeProps) => {
  const [isExpanded, setExpanded] = useState(true);
  
  // Enterprise validation with comprehensive error handling
  const validationResult = validateNodeData(data);
  const nodeData = validationResult.data;
  
  // Report validation errors for monitoring
  if (!validationResult.success) {
    reportValidationError('${nodeType}', id, validationResult.errors, {
      originalData: validationResult.originalData,
      component: '${nodeType}NodeComponent',
    });
  }

  // Enterprise data validation hook for real-time updates
  const { updateData, getHealthScore } = useNodeDataValidation(
    ${nodeType}DataSchema,
    '${nodeType}',
    nodeData,
    id
  );

  const onToggle = () => setExpanded(!isExpanded);

  // Handle data updates with validation
  const handleDataUpdate = (updates: Partial<${nodeType}Data>) => {
    try {
      const updatedData = updateData(updates);
      console.log(\`${nodeType} node \${id} updated:\`, updatedData);
      // TODO: Implement actual data persistence via React Flow store
    } catch (error) {
      console.error('Failed to update ${nodeType} node data:', error);
    }
  };

  return (
    <>
      <button
        onClick={onToggle}
        className="absolute top-1 left-1 z-10 w-6 h-6 flex items-center justify-center rounded bg-white/80 hover:bg-white border border-gray-300 text-sm"
      >
        {isExpanded ? '⦾' : '⦿'}
      </button>

      {isExpanded ? (
        <div className="p-4 pt-8">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">${meta.displayName}</h3>
              {process.env.NODE_ENV === 'development' && (
                <span className="text-xs text-gray-500">
                  Health: {getHealthScore()}%
                </span>
              )}
            </div>
            
            <div className="text-xs text-gray-600">
              ${meta.displayName} node ready for configuration
            </div>
            
            {/* TODO: Add specific UI controls based on data schema */}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-2xl">⚙️</div>
        </div>
      )}
    </>
  );
};

export default withNodeScaffold(spec, ${nodeType}NodeComponent);
`;
}

/**
 * Migrate a single node to enterprise validation system
 */
async function migrateNode(nodeDir: string): Promise<MigrationResult> {
  const nodeName = path.basename(nodeDir);
  console.log(`\nMigrating node: ${nodeName}`);
  
  try {
    // Read meta.json
    const metaPath = path.join(nodeDir, 'meta.json');
    let meta: NodeMeta;
    
    try {
      const metaContent = await fs.readFile(metaPath, 'utf-8');
      meta = JSON.parse(metaContent);
    } catch (error) {
      throw new Error(`Failed to read meta.json: ${error}`);
    }

    // Generate enterprise node component
    const nodeContent = generateNodeComponent(meta);
    const newNodePath = path.join(nodeDir, `${nodeName}.node.tsx`);
    
    await fs.writeFile(newNodePath, nodeContent);
    console.log(`✅ Created: ${newNodePath}`);

    // Clean up legacy files
    const filesToDelete = [
      path.join(nodeDir, 'meta.json'),
    ];
    
    // Find and delete old component files
    const files = await fs.readdir(nodeDir);
    for (const file of files) {
      if (file.endsWith('.tsx') && !file.endsWith('.node.tsx')) {
        filesToDelete.push(path.join(nodeDir, file));
      }
    }

    const deletedFiles: string[] = [];
    for (const filePath of filesToDelete) {
      try {
        await fs.unlink(filePath);
        console.log(`🗑️  Deleted: ${filePath}`);
        deletedFiles.push(filePath);
      } catch (error) {
        console.warn(`⚠️  Could not delete ${filePath}: ${error}`);
      }
    }

    return {
      nodeType: meta.kind,
      success: true,
      files: {
        created: [newNodePath],
        deleted: deletedFiles,
      },
    };

  } catch (error) {
    console.error(`❌ Failed to migrate ${nodeName}:`, error);
    return {
      nodeType: nodeName,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      files: { created: [], deleted: [] },
    };
  }
}

/**
 * Update the node index file with new exports
 */
async function updateNodeIndex(migrations: MigrationResult[]): Promise<void> {
  const indexPath = 'features/business-logic-modern/node-domain/index.ts';
  console.log('\n📝 Updating node index exports...');
  
  try {
    const sourceFile = project.addSourceFileAtPath(indexPath);
    
    // Remove old exports
    sourceFile.getExportDeclarations().forEach(exportDecl => {
      exportDecl.remove();
    });
    
    // Add new exports for migrated nodes
    const newExports: string[] = [];
    for (const migration of migrations) {
      if (migration.success) {
        const pascalCaseType = migration.nodeType.charAt(0).toUpperCase() + migration.nodeType.slice(1);
        const exportPath = migration.files.created[0]?.replace('features/business-logic-modern/node-domain/', './').replace('.tsx', '') || '';
        if (exportPath) {
          newExports.push(`export { default as ${pascalCaseType}Node } from '${exportPath}';`);
        }
      }
    }
    
    // Add exports to file
    sourceFile.addExportDeclarations(
      newExports.map(exportStr => ({
        moduleSpecifier: exportStr.match(/'([^']+)'/)?.[1] || '',
        defaultExport: exportStr.match(/as (\w+)/)?.[1] || '',
      }))
    );
    
    await sourceFile.save();
    console.log(`✅ Updated: ${indexPath}`);
    
  } catch (error) {
    console.error(`❌ Failed to update index: ${error}`);
  }
}

/**
 * Main migration function with enterprise reporting
 */
async function migrateAllNodes(): Promise<void> {
  console.log('🚀 Starting enterprise node migration...\n');
  
  const nodeDomainsPath = 'features/business-logic-modern/node-domain';
  const domainDirs = ['create', 'view', 'trigger', 'test'];
  
  const allMigrations: MigrationResult[] = [];
  
  for (const domain of domainDirs) {
    const domainPath = path.join(nodeDomainsPath, domain);
    
    try {
      const entries = await fs.readdir(domainPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const nodeDir = path.join(domainPath, entry.name);
          const migration = await migrateNode(nodeDir);
          allMigrations.push(migration);
        }
      }
    } catch (error) {
      console.error(`❌ Could not read domain ${domain}:`, error);
    }
  }
  
  // Update index exports
  await updateNodeIndex(allMigrations);
  
  // Generate migration report
  console.log('\n📊 Enterprise Migration Report');
  console.log('=====================================');
  
  const successful = allMigrations.filter(m => m.success);
  const failed = allMigrations.filter(m => !m.success);
  
  console.log(`✅ Successfully migrated: ${successful.length} nodes`);
  console.log(`❌ Failed migrations: ${failed.length} nodes`);
  
  if (successful.length > 0) {
    console.log('\n✅ Successful migrations:');
    successful.forEach(m => {
      console.log(`  - ${m.nodeType}: ${m.files.created.length} files created, ${m.files.deleted.length} files deleted`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed migrations:');
    failed.forEach(m => {
      console.log(`  - ${m.nodeType}: ${m.error}`);
    });
  }
  
  console.log('\n🎉 Enterprise migration complete!');
  console.log('\nNext steps:');
  console.log('1. Review generated validation schemas');
  console.log('2. Customize UI components as needed');
  console.log('3. Set up error tracking service (Sentry, LogRocket)');
  console.log('4. Configure monitoring dashboard for validation metrics');
  console.log('5. Run tests to ensure everything works correctly');
}

// Run migration
migrateAllNodes().catch(console.error);
 