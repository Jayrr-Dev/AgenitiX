/**
 * COMMITLINT CONFIGURATION - Enforce conventional commits
 *
 * Ensures all commits follow the conventional commit format:
 * type(scope): description
 *
 * Types: feat, fix, docs, refactor, test, chore
 */

module.exports = {
	extends: ["@commitlint/config-conventional"],
	rules: {
		// Allowed commit types
		"type-enum": [
			2,
			"always",
			[
				"feat",     // new feature
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
		],
		// Subject case
		"subject-case": [2, "never", ["sentence-case", "start-case", "pascal-case", "upper-case"]],
		// Subject max length
		"subject-max-length": [2, "always", 100],
		// Subject min length
		"subject-min-length": [2, "always", 3],
		// No trailing dot in subject
		"subject-full-stop": [2, "never", "."],
		// Type is required
		"type-empty": [2, "never"],
		// Subject is required
		"subject-empty": [2, "never"],
	},
}; 