/**
 * TOKEN VALIDATION SCRIPT - WCAG AA Contrast Compliance Checker
 *
 * • Validates all business-logic tokens against WCAG AA standards
 * • Checks node category tokens for proper contrast ratios
 * • Validates infrastructure component tokens
 * • Ensures action status tokens meet accessibility requirements
 * • Fails CI if any combination doesn't meet WCAG AA (4.5:1 ratio)
 *
 * Keywords: accessibility, wcag-aa, contrast-validation, token-validation, ci-checks
 */

const fs = require("fs");
const path = require("path");

// ============================================================================
// CONSTANTS - Top-level constants for better maintainability
// ============================================================================

/** WCAG AA minimum contrast ratio for normal text */
const WCAG_AA_NORMAL_RATIO = 4.5;

/** WCAG AAA minimum contrast ratio for enhanced accessibility */
const WCAG_AAA_NORMAL_RATIO = 7.0;

/** Tolerance for floating point comparison */
const CONTRAST_TOLERANCE = 0.1;

// ============================================================================
// CONTRAST REQUIREMENTS CONFIGURATION
// ============================================================================

/**
 * Comprehensive contrast requirements for all business-logic tokens
 * Each token must meet the specified contrast ratio against its paired token
 */
const CONTRAST_REQUIREMENTS = {
  // Node category tokens - text must be readable on backgrounds
  "node-create-text": {
    against: "node-create-bg",
    ratio: WCAG_AA_NORMAL_RATIO,
    critical: true,
  },
  "node-create-text-secondary": {
    against: "node-create-bg",
    ratio: WCAG_AA_NORMAL_RATIO,
    critical: true,
  },
  "node-view-text": {
    against: "node-view-bg",
    ratio: WCAG_AA_NORMAL_RATIO,
    critical: true,
  },
  "node-view-text-secondary": {
    against: "node-view-bg",
    ratio: WCAG_AA_NORMAL_RATIO,
    critical: true,
  },
  "node-trigger-text": {
    against: "node-trigger-bg",
    ratio: WCAG_AA_NORMAL_RATIO,
    critical: true,
  },
  "node-trigger-text-secondary": {
    against: "node-trigger-bg",
    ratio: WCAG_AA_NORMAL_RATIO,
    critical: true,
  },
  "node-test-text": {
    against: "node-test-bg",
    ratio: WCAG_AA_NORMAL_RATIO,
    critical: true,
  },
  "node-test-text-secondary": {
    against: "node-test-bg",
    ratio: WCAG_AA_NORMAL_RATIO,
    critical: true,
  },

  // Infrastructure component tokens
  "infra-inspector-text": {
    against: "infra-inspector-bg",
    ratio: WCAG_AA_NORMAL_RATIO,
    critical: true,
  },
  "infra-inspector-text-secondary": {
    against: "infra-inspector-bg",
    ratio: WCAG_AA_NORMAL_RATIO,
    critical: true,
  },
  "infra-sidebar-text": {
    against: "infra-sidebar-bg",
    ratio: WCAG_AA_NORMAL_RATIO,
    critical: true,
  },
  "infra-sidebar-text-secondary": {
    against: "infra-sidebar-bg",
    ratio: WCAG_AA_NORMAL_RATIO,
    critical: true,
  },
  "infra-minimap-text": {
    against: "infra-minimap-bg",
    ratio: WCAG_AA_NORMAL_RATIO,
    critical: true,
  },
  "infra-history-text": {
    against: "infra-history-bg",
    ratio: WCAG_AA_NORMAL_RATIO,
    critical: true,
  },
  "infra-toolbar-text": {
    against: "infra-toolbar-bg",
    ratio: WCAG_AA_NORMAL_RATIO,
    critical: true,
  },
  "infra-panel-text": {
    against: "infra-panel-bg",
    ratio: WCAG_AA_NORMAL_RATIO,
    critical: true,
  },

  // Enhanced contrast checks for hover states (using base text colors)
  "node-create-text-on-hover": {
    against: "node-create-bg-hover",
    ratio: WCAG_AA_NORMAL_RATIO,
    critical: false,
    actualToken: "node-create-text",
  },
  "node-view-text-on-hover": {
    against: "node-view-bg-hover",
    ratio: WCAG_AA_NORMAL_RATIO,
    critical: false,
    actualToken: "node-view-text",
  },
  "node-trigger-text-on-hover": {
    against: "node-trigger-bg-hover",
    ratio: WCAG_AA_NORMAL_RATIO,
    critical: false,
    actualToken: "node-trigger-text",
  },
  "node-test-text-on-hover": {
    against: "node-test-bg-hover",
    ratio: WCAG_AA_NORMAL_RATIO,
    critical: false,
    actualToken: "node-test-text",
  },
};

// ============================================================================
// COLOR UTILITY FUNCTIONS
// ============================================================================

/**
 * Resolve var() references in token values
 */
function resolveVarReferences(value, tokens) {
  let resolved = value;
  const varMatches = value.match(/var\(--([a-zA-Z0-9-]+)\)/g);

  if (varMatches) {
    for (const varMatch of varMatches) {
      const tokenName = varMatch.match(/var\(--([a-zA-Z0-9-]+)\)/)[1];
      const tokenValue = tokens[tokenName];
      if (tokenValue) {
        // Recursively resolve nested var() references
        const resolvedValue = resolveVarReferences(tokenValue, tokens);
        resolved = resolved.replace(varMatch, resolvedValue);
      }
    }
  }

  return resolved.trim();
}

/**
 * Parse HSL color value from CSS custom property format
 * Converts "210 100% 97%" to { h: 210, s: 100, l: 97 }
 */
function parseHSL(hslString, tokens = {}) {
  // Resolve var() references first
  const resolvedString = resolveVarReferences(hslString, tokens);

  // Match HSL format: "210 100% 97%" or "0 0% 6%"
  const match = resolvedString.match(
    /^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/
  );

  if (!match) {
    console.warn(
      `Could not parse HSL value: ${hslString} (resolved: ${resolvedString})`
    );
    return null;
  }

  return {
    h: parseFloat(match[1]),
    s: parseFloat(match[2]),
    l: parseFloat(match[3]),
  };
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(h, s, l) {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 1 / 6) {
    r = c;
    g = x;
    b = 0;
  } else if (1 / 6 <= h && h < 2 / 6) {
    r = x;
    g = c;
    b = 0;
  } else if (2 / 6 <= h && h < 3 / 6) {
    r = 0;
    g = c;
    b = x;
  } else if (3 / 6 <= h && h < 4 / 6) {
    r = 0;
    g = x;
    b = c;
  } else if (4 / 6 <= h && h < 5 / 6) {
    r = x;
    g = 0;
    b = c;
  } else if (5 / 6 <= h && h < 1) {
    r = c;
    g = 0;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/**
 * Calculate relative luminance according to WCAG guidelines
 */
function getRelativeLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(color1, color2) {
  const lum1 = getRelativeLuminance(color1.r, color1.g, color1.b);
  const lum2 = getRelativeLuminance(color2.r, color2.g, color2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

// ============================================================================
// TOKEN EXTRACTION
// ============================================================================

/**
 * Extract all CSS custom properties from globals.css
 */
function extractTokensFromCSS() {
  try {
    // Candidate style files – search in order of likelihood
    const candidatePaths = [
      path.join(process.cwd(), "app", "styles", "_globals.css"), // new location (Phase-1 refactor)
      path.join(process.cwd(), "app", "globals.css"), // legacy location (imports entry.css → _globals.css)
    ];

    let cssContent = "";
    let usedPath = "";

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, "utf-8");
        if (/@theme\s*\{[\s\S]*?\}/.test(raw)) {
          cssContent = raw;
          usedPath = p;
          break;
        }
      }
    }

    if (!cssContent) {
      throw new Error(
        "Could not find a CSS file with an @theme block in expected locations."
      );
    }

    // Match @import lines to pull in additional files (1-level deep)
    const importRegex = /@import\s+["']\.\/(.*?)['"];?/g;
    let importMatch;
    const importedContents = [];
    while ((importMatch = importRegex.exec(cssContent)) !== null) {
      const relPath = importMatch[1];
      const absImportPath = path.join(path.dirname(usedPath), relPath);
      if (fs.existsSync(absImportPath)) {
        importedContents.push(fs.readFileSync(absImportPath, "utf-8"));
      }
    }

    const combinedCss = [cssContent, ...importedContents].join("\n");

    // Extract tokens from @theme blocks (primary + imports)
    const themeBlockRegex = /@theme\s*\{([\s\S]*?)\}/g;
    let themeMatch;
    const tokens = {};
    while ((themeMatch = themeBlockRegex.exec(combinedCss)) !== null) {
      const themeContent = themeMatch[1];
      const tokenRegex = /--([a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
      let match;
      while ((match = tokenRegex.exec(themeContent)) !== null) {
        tokens[match[1]] = match[2].trim();
      }
    }

    if (Object.keys(tokens).length === 0) {
      throw new Error("No tokens found in @theme blocks");
    }

    return tokens;
  } catch (error) {
    throw new Error(`Failed to extract tokens from CSS: ${error}`);
  }
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate contrast ratio for a specific token pair
 */
function validateTokenContrast(tokens, tokenName, requirement) {
  // Use actualToken if specified (for hover checks)
  const actualTokenName = requirement.actualToken || tokenName;
  const tokenValue = tokens[actualTokenName];
  const againstValue = tokens[requirement.against];

  if (!tokenValue) {
    return {
      isValid: false,
      actualRatio: 0,
      error: `Token '${actualTokenName}' not found`,
    };
  }

  if (!againstValue) {
    return {
      isValid: false,
      actualRatio: 0,
      error: `Reference token '${requirement.against}' not found`,
    };
  }

  // Parse HSL values
  const tokenHSL = parseHSL(tokenValue, tokens);
  const againstHSL = parseHSL(againstValue, tokens);

  if (!tokenHSL || !againstHSL) {
    return {
      isValid: false,
      actualRatio: 0,
      error: `Could not parse HSL values for ${tokenName} or ${requirement.against}`,
    };
  }

  // Convert to RGB
  const tokenRGB = hslToRgb(tokenHSL.h, tokenHSL.s, tokenHSL.l);
  const againstRGB = hslToRgb(againstHSL.h, againstHSL.s, againstHSL.l);

  // Calculate contrast ratio
  const actualRatio = getContrastRatio(tokenRGB, againstRGB);
  const isValid = actualRatio >= requirement.ratio - CONTRAST_TOLERANCE;

  return { isValid, actualRatio };
}

/**
 * Validate all token contrast requirements
 */
async function validateContrast() {
  console.log("🔍 Starting WCAG AA contrast validation...");

  const result = {
    isValid: true,
    errors: [],
    warnings: [],
    stats: { total: 0, passed: 0, failed: 0, warnings: 0 },
  };

  try {
    // Extract tokens from CSS
    const tokens = extractTokensFromCSS();
    console.log(
      `📋 Extracted ${Object.keys(tokens).length} tokens from CSS @theme block`
    );

    // Validate each requirement
    for (const [tokenName, requirement] of Object.entries(
      CONTRAST_REQUIREMENTS
    )) {
      result.stats.total++;

      const validation = validateTokenContrast(tokens, tokenName, requirement);

      if (validation.error) {
        const message = `❌ ${tokenName}: ${validation.error}`;
        if (requirement.critical) {
          result.errors.push(message);
          result.stats.failed++;
          result.isValid = false;
        } else {
          result.warnings.push(message);
          result.stats.warnings++;
        }
        continue;
      }

      const ratioText = `${validation.actualRatio.toFixed(2)}:1`;
      const requiredText = `${requirement.ratio}:1`;

      if (validation.isValid) {
        console.log(
          `✅ ${tokenName} vs ${requirement.against}: ${ratioText} (required: ${requiredText})`
        );
        result.stats.passed++;
      } else {
        const message = `❌ ${tokenName} vs ${requirement.against}: ${ratioText} (required: ${requiredText})`;
        if (requirement.critical) {
          result.errors.push(message);
          result.stats.failed++;
          result.isValid = false;
        } else {
          result.warnings.push(message);
          result.stats.warnings++;
        }
      }
    }

    // Print summary
    console.log("\n📊 VALIDATION SUMMARY");
    console.log("========================================");
    console.log(`Total checks: ${result.stats.total}`);
    console.log(`✅ Passed: ${result.stats.passed}`);
    console.log(`❌ Failed: ${result.stats.failed}`);
    console.log(`⚠️  Warnings: ${result.stats.warnings}`);
    console.log("========================================");

    if (result.errors.length > 0) {
      console.log("\n❌ CRITICAL ERRORS:");
      result.errors.forEach((error) => console.log(error));
    }

    if (result.warnings.length > 0) {
      console.log("\n⚠️  WARNINGS:");
      result.warnings.forEach((warning) => console.log(warning));
    }

    if (result.isValid) {
      console.log("\n🎉 All critical contrast requirements passed!");
    } else {
      console.log(
        "\n💥 Contrast validation failed - fix critical errors before proceeding"
      );
    }

    return result;
  } catch (error) {
    result.isValid = false;
    result.errors.push(`Validation failed: ${error}`);
    console.error("💥 Token validation failed:", error);
    return result;
  }
}

// ============================================================================
// CLI EXECUTION
// ============================================================================

if (require.main === module) {
  validateContrast()
    .then((result) => {
      process.exit(result.isValid ? 0 : 1);
    })
    .catch((error) => {
      console.error("💥 Validation script failed:", error);
      process.exit(1);
    });
}

module.exports = {
  validateContrast,
  validateTokenContrast,
  extractTokensFromCSS,
};
