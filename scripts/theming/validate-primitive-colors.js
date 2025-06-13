/**
 * PRIMITIVE COLOR VALIDATION SCRIPT - Enforce semantic token usage
 *
 * • Scans business-logic components for hardcoded Tailwind colors
 * • Enforces semantic token usage (bg-node-create vs bg-blue-500)
 * • Fails CI if primitive colors found in business-logic scope
 * • Provides clear guidance on token replacements
 *
 * Keywords: primitive-colors, token-enforcement, ci-validation, semantic-tokens
 */

const fs = require('fs');
const path = require('path');
const glob = require('fast-glob');

// ============================================================================
// CONSTANTS - Top-level constants for better maintainability
// ============================================================================

/** Business-logic scope for validation */
const BUSINESS_LOGIC_PATHS = [
  'features/business-logic-modern/**/*.{ts,tsx}',
  'components/nodes/**/*.{ts,tsx}'
];

/** Files to exclude from validation */
const EXCLUDED_PATHS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/*.d.ts',
  '**/stories/**',
  '**/*.stories.*'
];

/** Primitive color patterns to detect */
const PRIMITIVE_COLOR_PATTERNS = [
  // Background colors
  /\bbg-(blue|red|green|yellow|purple|indigo|pink|gray|zinc|slate|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-[0-9]+\b/g,
  // Text colors  
  /\btext-(blue|red|green|yellow|purple|indigo|pink|gray|zinc|slate|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-[0-9]+\b/g,
  // Border colors
  /\bborder-(blue|red|green|yellow|purple|indigo|pink|gray|zinc|slate|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-[0-9]+\b/g,
  // Ring colors
  /\bring-(blue|red|green|yellow|purple|indigo|pink|gray|zinc|slate|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-[0-9]+\b/g
];

/** Semantic token replacements */
const TOKEN_REPLACEMENTS = {
  // Node category replacements
  'bg-blue-50': 'bg-node-create',
  'bg-blue-100': 'bg-node-create-hover',
  'border-blue-300': 'border-node-create',
  'text-blue-900': 'text-node-create',
  
  'bg-gray-50': 'bg-node-view',
  'bg-gray-100': 'bg-node-view-hover',
  'border-gray-300': 'border-node-view',
  'text-gray-900': 'text-node-view',
  
  'bg-purple-50': 'bg-node-trigger',
  'bg-purple-100': 'bg-node-trigger-hover',
  'border-purple-300': 'border-node-trigger',
  'text-purple-900': 'text-node-trigger',
  
  'bg-yellow-50': 'bg-node-test',
  'bg-yellow-100': 'bg-node-test-hover',
  'border-yellow-300': 'border-node-test',
  'text-yellow-900': 'text-node-test',
  
  // Action status replacements
  'bg-green-500': 'bg-status-node-add',
  'bg-red-500': 'bg-status-node-delete',
  'bg-blue-500': 'bg-status-node-update',
  'bg-yellow-500': 'bg-status-edge-add',
  'bg-purple-500': 'bg-status-special',
  
  // Infrastructure replacements
  'bg-card': 'bg-infra-inspector',
  'bg-muted': 'bg-infra-sidebar',
  'border-border': 'border-infra-inspector'
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Find all primitive color usages in a file
 */
function findPrimitiveColors(filePath, content) {
  const violations = [];
  
  for (const pattern of PRIMITIVE_COLOR_PATTERNS) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      const column = match.index - content.lastIndexOf('\n', match.index - 1);
      const colorClass = match[0];
      
      violations.push({
        file: filePath,
        line,
        column,
        colorClass,
        suggestion: TOKEN_REPLACEMENTS[colorClass] || 'Use semantic token instead'
      });
    }
    // Reset regex lastIndex for next iteration
    pattern.lastIndex = 0;
  }
  
  return violations;
}

/**
 * Validate all files in business-logic scope
 */
async function validatePrimitiveColors() {
  console.log('🔍 Scanning for primitive color usage in business-logic components...');
  
  try {
    // Find all files to validate
    const files = await glob(BUSINESS_LOGIC_PATHS, {
      ignore: EXCLUDED_PATHS,
      absolute: true
    });
    
    console.log(`📋 Found ${files.length} files to validate`);
    
    const allViolations = [];
    let filesScanned = 0;
    
    // Scan each file
    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const violations = findPrimitiveColors(filePath, content);
        
        if (violations.length > 0) {
          allViolations.push(...violations);
        }
        
        filesScanned++;
        
        if (filesScanned % 50 === 0) {
          console.log(`📋 Scanned ${filesScanned}/${files.length} files...`);
        }
      } catch (error) {
        console.warn(`⚠️  Could not read file ${filePath}: ${error.message}`);
      }
    }
    
    // Report results
    console.log('\n📊 PRIMITIVE COLOR VALIDATION RESULTS');
    console.log('========================================');
    console.log(`Files scanned: ${filesScanned}`);
    console.log(`Violations found: ${allViolations.length}`);
    console.log('========================================');
    
    if (allViolations.length === 0) {
      console.log('🎉 No primitive color violations found!');
      return { isValid: true, violations: [] };
    }
    
    // Group violations by file
    const violationsByFile = {};
    for (const violation of allViolations) {
      const relativePath = path.relative(process.cwd(), violation.file);
      if (!violationsByFile[relativePath]) {
        violationsByFile[relativePath] = [];
      }
      violationsByFile[relativePath].push(violation);
    }
    
    // Print violations
    console.log('\n❌ PRIMITIVE COLOR VIOLATIONS:');
    for (const [filePath, violations] of Object.entries(violationsByFile)) {
      console.log(`\n📄 ${filePath}:`);
      for (const violation of violations) {
        console.log(`  Line ${violation.line}: ${violation.colorClass}`);
        console.log(`    💡 Suggestion: ${violation.suggestion}`);
      }
    }
    
    console.log('\n💡 MIGRATION GUIDE:');
    console.log('Replace primitive colors with semantic tokens:');
    console.log('• Node backgrounds: bg-blue-50 → bg-node-create');
    console.log('• Action statuses: bg-green-500 → bg-status-node-add');
    console.log('• Infrastructure: bg-card → bg-infra-inspector');
    console.log('\nSee documentation/theming/migrateThemeSystem.md for complete guide');
    
    return { isValid: false, violations: allViolations };
    
  } catch (error) {
    console.error('💥 Primitive color validation failed:', error);
    return { isValid: false, violations: [], error: error.message };
  }
}

// ============================================================================
// CLI EXECUTION
// ============================================================================

if (require.main === module) {
  validatePrimitiveColors()
    .then(result => {
      process.exit(result.isValid ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Validation script failed:', error);
      process.exit(1);
    });
}

module.exports = { validatePrimitiveColors, findPrimitiveColors }; 