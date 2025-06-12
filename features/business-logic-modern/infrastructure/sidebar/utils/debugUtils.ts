/**
 * Debugging utilities for sidebar troubleshooting
 * These functions can be called from the browser console for debugging
 */

import { modernNodeRegistry, getAllNodeMetadata } from "../../node-registry/nodespec-registry";
import { VARIANT_CONFIG, getSidebarStatistics, validateSidebarConfiguration } from "../constants";

/**
 * Clear all sidebar-related localStorage data
 * Call this if you're experiencing sidebar issues related to stale localStorage
 */
export function clearSidebarStorage(): void {
  const keysToRemove = [
    'agenitix-custom-nodes',
    'agenitix-sidebar-variant', 
    'agenitix-sidebar-tabs'
  ];

  console.log('🧹 Clearing sidebar localStorage data...');

  keysToRemove.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      console.log(`📋 Found ${key}:`, value);
      localStorage.removeItem(key);
      console.log(`✅ Cleared: ${key}`);
    } else {
      console.log(`⚪ Not found: ${key}`);
    }
  });

  console.log('🎯 Sidebar localStorage cleared. Please refresh the page.');
}

/**
 * Debug the current sidebar configuration
 * Shows detailed information about VARIANT_CONFIG and node registry
 */
export function debugSidebarConfig(): void {
  console.group('🔍 Sidebar Debug Information');
  
  console.log('📊 Node Registry Stats:');
  console.log(`  Registry size: ${modernNodeRegistry.size}`);
  console.log(`  Registered nodes: ${Array.from(modernNodeRegistry.keys()).join(', ')}`);
  
  const allMetadata = getAllNodeMetadata();
  console.log(`  Total metadata entries: ${allMetadata.length}`);
  
  console.log('\n📋 VARIANT_CONFIG Structure:');
  Object.keys(VARIANT_CONFIG).forEach(variant => {
    console.log(`\n📂 Variant ${variant}:`);
    console.log(`  tabs:`, VARIANT_CONFIG[variant]?.tabs);
    
    if (VARIANT_CONFIG[variant]?.stencils) {
      const stencils = VARIANT_CONFIG[variant].stencils;
      console.log(`  stencil keys:`, Object.keys(stencils));
      
      Object.entries(stencils).forEach(([key, stencilArray]) => {
        console.log(`    ${key}: ${Array.isArray(stencilArray) ? stencilArray.length : 'not array'} stencils`);
      });
    }
  });
  
  console.log('\n🔧 Validation Results:');
  const validation = validateSidebarConfiguration();
  console.log(validation);
  
  console.log('\n📈 Statistics:');
  const stats = getSidebarStatistics();
  console.log(stats);
  
  console.groupEnd();
}

/**
 * Test node creation with a specific node type
 * Helps debug node registry issues
 */
export function testNodeCreation(nodeType: string): void {
  console.log(`🧪 Testing node creation for: ${nodeType}`);
  
  const metadata = modernNodeRegistry.get(nodeType);
  if (!metadata) {
    console.error(`❌ Node type '${nodeType}' not found in registry`);
    console.log(`Available nodes: ${Array.from(modernNodeRegistry.keys()).join(', ')}`);
    return;
  }
  
  console.log(`✅ Node metadata found:`, metadata);
  console.log(`  Display Name: ${metadata.displayName}`);
  console.log(`  Category: ${metadata.category}`);
  console.log(`  Folder: ${metadata.sidebar?.folder || 'none'}`);
  console.log(`  Description: ${metadata.description}`);
}

// Make functions available globally for console debugging
if (typeof window !== 'undefined') {
  (window as any).debugSidebar = {
    clearStorage: clearSidebarStorage,
    debugConfig: debugSidebarConfig,
    testNode: testNodeCreation
  };
  
  console.log('🔧 Sidebar debugging utilities loaded. Access via:');
  console.log('  debugSidebar.clearStorage() - Clear localStorage');
  console.log('  debugSidebar.debugConfig() - Show config details');
  console.log('  debugSidebar.testNode("nodeType") - Test node creation');
} 