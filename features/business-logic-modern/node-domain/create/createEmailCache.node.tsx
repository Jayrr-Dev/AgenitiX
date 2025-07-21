/**
 * CREATE EMAIL CACHE NODE - Demonstrates advanced node memory capabilities
 *
 * • Intelligent email template caching with AI-powered optimization
 * • Persistent memory across workflow executions
 * • Advanced cache strategies (LRU, TTL, tagging)
 * • Memory analytics and performance monitoring
 * • Demonstrates each node as independent programmable computer
 *
 * Keywords: email-cache, node-memory, ai-optimization, programmable, independent
 */

import type { NodeProps } from "@xyflow/react";
import { z } from "zod";
import { useState, useEffect } from "react";

import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
import {
  createNodeValidator,
  reportValidationError,
  useNodeDataValidation,
} from "@/features/business-logic-modern/infrastructure/node-core/validation";
import { withNodeScaffold } from "@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold";
import { useNodeMemory } from "@/features/business-logic-modern/infrastructure/node-core/useNodeMemory";
import { NodeMemoryMonitor } from "@/features/business-logic-modern/infrastructure/node-core/NodeMemoryMonitor";
import { CATEGORIES } from "@/features/business-logic-modern/infrastructure/theming/categories";
import {
  COLLAPSED_SIZES,
  EXPANDED_SIZES,
} from "@/features/business-logic-modern/infrastructure/theming/sizing";
import { useNodeData } from "@/hooks/useNodeData";

/**
 * Data schema for CreateEmailCache node
 */
const CreateEmailCacheDataSchema = z
  .object({
    cacheStrategy: z.enum(['LRU', 'LFU', 'TTL']).default('LRU'),
    maxCacheSize: z.number().min(1).max(100).default(50), // MB
    defaultTTL: z.number().min(60).max(86400).default(3600), // seconds
    enablePersistence: z.boolean().default(true),
    enableAnalytics: z.boolean().default(true),
    aiOptimization: z.boolean().default(true),
    isActive: z.boolean().default(false),
    isExpanded: z.boolean().default(false),
  })
  .passthrough();

type CreateEmailCacheData = z.infer<typeof CreateEmailCacheDataSchema>;

// Create enterprise validator
const validateNodeData = createNodeValidator(
  CreateEmailCacheDataSchema,
  "CreateEmailCache"
);

/**
 * Node specification with advanced memory configuration
 */
const spec: NodeSpec = {
  kind: "createEmailCache",
  displayName: "Email Cache",
  category: CATEGORIES.CREATE,
  size: {
    expanded: EXPANDED_SIZES.VE3, // Large variable height for memory monitor
    collapsed: COLLAPSED_SIZES.C1W, // Wide collapsed for cache indicator
  },
  handles: [
    { id: "template-input", code: "t", position: "left", type: "target" },
    { id: "cached-output", code: "c", position: "right", type: "source" },
    { id: "analytics", code: "a", position: "bottom", type: "source" },
  ],
  inspector: {
    key: "CreateEmailCacheInspector",
  },
  version: 1,
  runtime: {
    execute: "createEmailCache_execute_v1",
  },
  initialData: { 
    cacheStrategy: 'LRU',
    maxCacheSize: 50,
    defaultTTL: 3600,
    enablePersistence: true,
    enableAnalytics: true,
    aiOptimization: true,
    isActive: false, 
    isExpanded: false 
  },
  dataSchema: CreateEmailCacheDataSchema,
  
  // Advanced memory configuration
  memory: {
    maxSize: 50 * 1024 * 1024, // 50MB (configurable via node data)
    maxEntries: 10000,
    defaultTTL: 3600 * 1000, // 1 hour in milliseconds
    persistent: true, // Enable persistence across sessions
    evictionPolicy: 'LRU', // Configurable via node data
    analytics: true,
    serializer: 'json'
  }
};

/**
 * Email template interface for type safety
 */
interface EmailTemplate {
  id: string;
  subject: string;
  body: string;
  variables: Record<string, any>;
  metadata: {
    created: number;
    lastUsed: number;
    useCount: number;
    aiScore?: number;
  };
}

/**
 * CreateEmailCache Node Component - Demonstrates advanced memory usage
 */
const CreateEmailCacheNodeComponent = ({ data, id }: NodeProps) => {
  // Use proper React Flow data management
  const { nodeData, updateNodeData } = useNodeData(id, data);
  const isExpanded = (nodeData as CreateEmailCacheData).isExpanded || false;

  // Initialize node memory with dynamic configuration
  const memory = useNodeMemory(id, {
    maxSize: (nodeData as CreateEmailCacheData).maxCacheSize * 1024 * 1024,
    evictionPolicy: (nodeData as CreateEmailCacheData).cacheStrategy,
    defaultTTL: (nodeData as CreateEmailCacheData).defaultTTL * 1000,
    persistent: (nodeData as CreateEmailCacheData).enablePersistence,
    analytics: (nodeData as CreateEmailCacheData).enableAnalytics
  });

  // Enterprise validation with comprehensive error handling
  const validationResult = validateNodeData(nodeData);
  const validatedData = validationResult.data;

  // Report validation errors for monitoring
  if (!validationResult.success) {
    reportValidationError("CreateEmailCache", id, validationResult.errors, {
      originalData: validationResult.originalData,
      component: "CreateEmailCacheNodeComponent",
    });
  }

  // Enterprise data validation hook for real-time updates
  const { getHealthScore } = useNodeDataValidation(
    CreateEmailCacheDataSchema,
    "CreateEmailCache",
    validatedData,
    id
  );

  // Local state for demonstration
  const [cacheStats, setCacheStats] = useState({
    templates: 0,
    totalHits: 0,
    recentActivity: [] as string[]
  });

  // Update expanded state
  const handleToggleExpanded = () => {
    updateNodeData({ ...nodeData, isExpanded: !isExpanded });
  };

  // Cache management functions
  const cacheTemplate = async (template: EmailTemplate) => {
    const cacheKey = `template_${template.id}`;
    const result = memory.setWithTags(
      cacheKey, 
      template, 
      ['template', 'email', template.id],
      validatedData.defaultTTL * 1000 
    );
    
    if (result.success) {
      setCacheStats(prev => ({
        ...prev,
        templates: memory.count(),
        recentActivity: [`Cached: ${template.id}`, ...prev.recentActivity.slice(0, 4)]
      }));
    }
    
    return result;
  };

  const getTemplate = async (templateId: string) => {
    const cacheKey = `template_${templateId}`;
    const result = memory.get<EmailTemplate>(cacheKey);
    
    if (result.success) {
      // Update usage statistics
      const template = result.data;
      template.metadata.lastUsed = Date.now();
      template.metadata.useCount++;
      
      // Re-cache with updated stats
      memory.set(cacheKey, template);
      
      setCacheStats(prev => ({
        ...prev,
        totalHits: prev.totalHits + 1,
        recentActivity: [`Hit: ${templateId}`, ...prev.recentActivity.slice(0, 4)]
      }));
    } else {
      setCacheStats(prev => ({
        ...prev,
        recentActivity: [`Miss: ${templateId}`, ...prev.recentActivity.slice(0, 4)]
      }));
    }
    
    return result;
  };

  const optimizeCache = async () => {
    if (!validatedData.aiOptimization) return;
    
    // AI-powered cache optimization
    const templates = memory.getByTag('template');
    const optimizationResults = [];
    
    for (const key of templates) {
      const result = memory.get<EmailTemplate>(key);
      if (result.success) {
        const template = result.data;
        
        // Simulate AI scoring (in real implementation, this would call an AI service)
        const aiScore = Math.random() * 100;
        template.metadata.aiScore = aiScore;
        
        // Re-cache with AI score
        memory.set(key, template);
        optimizationResults.push(`${template.id}: ${aiScore.toFixed(1)}`);
      }
    }
    
    setCacheStats(prev => ({
      ...prev,
      recentActivity: [`AI Optimized: ${optimizationResults.length} templates`, ...prev.recentActivity.slice(0, 4)]
    }));
  };

  // Demonstrate computed caching
  const getPopularTemplates = async () => {
    return memory.compute('popular_templates', async () => {
      const templates = memory.getByTag('template');
      const popular = [];
      
      for (const key of templates) {
        const result = memory.get<EmailTemplate>(key);
        if (result.success && result.data.metadata.useCount > 5) {
          popular.push(result.data);
        }
      }
      
      return popular.sort((a, b) => b.metadata.useCount - a.metadata.useCount);
    }, 300000); // Cache for 5 minutes
  };

  // Update cache stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCacheStats(prev => ({
        ...prev,
        templates: memory.count()
      }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [memory]);

  // Category-specific text colors from design system
  const categoryTextColors = {
    primary: "text-[var(--node-create-text)]",
    secondary: "text-[var(--node-create-text-secondary)]",
  };

  return (
    <>
      <ExpandCollapseButton
        showUI={isExpanded}
        onToggle={handleToggleExpanded}
        size="sm"
      />

      {isExpanded ? (
        <div className="p-4 w-full h-full flex flex-col space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-semibold ${categoryTextColors.primary}`}>
              Email Cache
            </h3>
            {process.env.NODE_ENV === "development" && (
              <span className={`text-xs ${categoryTextColors.secondary}`}>
                Health: {getHealthScore()}%
              </span>
            )}
          </div>

          {/* Cache Configuration */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Cache Strategy
              </label>
              <select
                value={validatedData.cacheStrategy}
                onChange={(e) => updateNodeData({ 
                  cacheStrategy: e.target.value as 'LRU' | 'LFU' | 'TTL' 
                })}
                className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="LRU">Least Recently Used</option>
                <option value="LFU">Least Frequently Used</option>
                <option value="TTL">Time To Live</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Max Size (MB)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={validatedData.maxCacheSize}
                  onChange={(e) => updateNodeData({ 
                    maxCacheSize: parseInt(e.target.value) 
                  })}
                  className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  TTL (seconds)
                </label>
                <input
                  type="number"
                  min="60"
                  max="86400"
                  value={validatedData.defaultTTL}
                  onChange={(e) => updateNodeData({ 
                    defaultTTL: parseInt(e.target.value) 
                  })}
                  className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={validatedData.enablePersistence}
                  onChange={(e) => updateNodeData({ 
                    enablePersistence: e.target.checked 
                  })}
                  className="rounded"
                />
                <span className="text-xs">Enable Persistence</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={validatedData.aiOptimization}
                  onChange={(e) => updateNodeData({ 
                    aiOptimization: e.target.checked 
                  })}
                  className="rounded"
                />
                <span className="text-xs">AI Optimization</span>
              </label>
            </div>
          </div>

          {/* Cache Statistics */}
          <div className="bg-gray-50 p-3 rounded">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Cache Statistics</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Templates:</span>
                <span className="ml-1 font-medium">{cacheStats.templates}</span>
              </div>
              <div>
                <span className="text-gray-500">Total Hits:</span>
                <span className="ml-1 font-medium">{cacheStats.totalHits}</span>
              </div>
            </div>
            
            {/* Recent Activity */}
            {cacheStats.recentActivity.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">Recent Activity:</div>
                <div className="space-y-1">
                  {cacheStats.recentActivity.map((activity, index) => (
                    <div key={index} className="text-xs text-gray-600 truncate">
                      {activity}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Memory Monitor */}
          <NodeMemoryMonitor nodeId={id} compact={false} showControls={true} />

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={optimizeCache}
              disabled={!validatedData.aiOptimization}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              AI Optimize
            </button>
            <button
              onClick={() => memory.gc()}
              className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs hover:bg-green-200"
            >
              Garbage Collect
            </button>
            <button
              onClick={() => {
                memory.clear();
                setCacheStats({ templates: 0, totalHits: 0, recentActivity: ['Cache cleared'] });
              }}
              className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs hover:bg-red-200"
            >
              Clear Cache
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-center">
            <div className={`text-xs font-medium ${categoryTextColors.primary} uppercase tracking-wide`}>
              CACHE
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {cacheStats.templates} templates
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default withNodeScaffold(spec, CreateEmailCacheNodeComponent);

// Export spec for registry access
export { spec };