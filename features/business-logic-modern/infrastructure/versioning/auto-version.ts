/**
 * AUTO-VERSIONING SYSTEM - Conventional Commits Based
 *
 * • Automatically detects changes from GitHub commit titles
 * • Uses conventional commit format for semantic versioning
 * • Integrates with GitHub API for commit history analysis
 * • Zero maintenance after initial setup
 * • Self-migrating and self-documenting
 */

interface ConventionalCommitConfig {
	// Conventional commit type mappings to semver bumps
	typeMapping: {
		major: string[]; // Commit types that trigger major bumps
		minor: string[]; // Commit types that trigger minor bumps
		patch: string[]; // Commit types that trigger patch bumps
	};
	// Breaking change indicators
	breakingChangeIndicators: string[];
	// Auto-migrate on version changes
	autoMigrate: boolean;
	// Files to track for changes
	trackFiles: string[];
	// GitHub integration
	github: {
		owner: string;
		repo: string;
		enabled: boolean;
	};
}

export const VERSION_CONFIG: ConventionalCommitConfig = {
	typeMapping: {
		// Major: Breaking changes (any type with ! or breaking change footer)
		major: [], // Determined by breaking change indicators, not type

		// Minor: New features
		minor: [
			"feat", // new feature
		],

		// Patch: Bug fixes, docs, chores, etc.
		patch: [
			"fix",      // bug fix
			"docs",     // documentation changes
			"refactor", // code restructuring
			"test",     // test additions/changes
			"chore",    // maintenance tasks
			"style",    // formatting, missing semi colons, etc.
			"perf",     // performance improvements
			"ci",       // CI configuration changes
			"build",    // build system changes
			"revert",   // reverts
		],
	},

	// Breaking change indicators for major version bumps
	breakingChangeIndicators: [
		"BREAKING CHANGE:",
		"BREAKING-CHANGE:",
		"!:", // feat!: or fix!:
	],

	autoMigrate: true,

	trackFiles: [
		"features/**/*.ts",
		"features/**/*.tsx",
		"app/**/*.ts",
		"app/**/*.tsx",
		"components/**/*.ts",
		"components/**/*.tsx",
		"lib/**/*.ts",
		"hooks/**/*.ts",
		"types/**/*.ts",
		"convex/**/*.ts",
		"scripts/**/*.ts",
		"*.json",
		"*.md"
	],

	github: {
		owner: "Jayrr-Dev", // Update with your GitHub username/org
		repo: "Agenitix-2", // Update with your repo name
		enabled: true,
	},
};

/**
 * Parse conventional commit title to determine version bump type
 * @param commitTitle - The commit title to parse
 * @returns The semver bump type or null if not a conventional commit
 */
export function parseCommitTitle(commitTitle: string): "major" | "minor" | "patch" | null {
	// Check for breaking change indicator first (! in type)
	const breakingChangeMatch = commitTitle.match(/^(\w+)(\(.+\))?!:/);
	if (breakingChangeMatch) {
		return "major";
	}

	// Parse conventional commit format: type(scope): description
	const conventionalMatch = commitTitle.match(/^(\w+)(\(.+\))?:\s*.+/);
	if (!conventionalMatch) {
		return null; // Not a conventional commit
	}

	const type = conventionalMatch[1].toLowerCase();

	// Check type mappings
	if (VERSION_CONFIG.typeMapping.minor.includes(type)) {
		return "minor";
	}
	
	if (VERSION_CONFIG.typeMapping.patch.includes(type)) {
		return "patch";
	}

	// Default to patch for unknown types
	return "patch";
}

/**
 * Check if commit contains breaking change indicators
 * @param commitMessage - Full commit message (title + body)
 * @returns true if breaking change detected
 */
export function hasBreakingChange(commitMessage: string): boolean {
	return VERSION_CONFIG.breakingChangeIndicators.some(indicator => 
		commitMessage.includes(indicator)
	);
}
