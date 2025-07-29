---
inclusion: manual
---

# Versioning System & Semantic Release

## Overview

AgenitiX uses a sophisticated **Git-integrated versioning system** that combines conventional commits with automatic semantic versioning. The system tracks file changes, analyzes commit history, and automatically bumps versions based on conventional commit patterns.

## Core Components

### 1. Version Detection System
- **Primary Script**: `scripts/version-from-commits.ts` - Analyzes GitHub commits for semantic versioning
- **Git Integration**: `scripts/git-version.js` - Enhanced version system with git history integration
- **Version Detector**: `features/business-logic-modern/infrastructure/versioning/version-detector.ts` - Core detection logic
- **Auto-Version Config**: `features/business-logic-modern/infrastructure/versioning/auto-version.ts` - Conventional commit configuration

### 2. Version Storage
- **Version Cache**: `.version-cache.json` - Tracks current version and last processed commit
- **Generated Version**: `features/business-logic-modern/infrastructure/versioning/version.ts` - Auto-generated version constants
- **Package.json**: Automatically synced with detected version

## Conventional Commit Format

The system uses **conventional commits** for automatic version detection:

```
type(scope): description

[optional body]

[optional footer(s)]
```

### Commit Type Mappings

**Major Version (Breaking Changes):**
- Any commit with `!` in type: `feat!:`, `fix!:`
- Commits with `BREAKING CHANGE:` or `BREAKING-CHANGE:` in body
- Commits with `!:` indicator

**Minor Version (New Features):**
- `feat`: New feature additions

**Patch Version (Bug Fixes & Maintenance):**
- `fix`: Bug fixes
- `docs`: Documentation changes
- `refactor`: Code restructuring
- `test`: Test additions/changes
- `chore`: Maintenance tasks
- `style`: Formatting changes
- `perf`: Performance improvements
- `ci`: CI configuration changes
- `build`: Build system changes
- `revert`: Reverts

### Examples
```bash
# Patch version bump
fix: resolve login timeout issue
docs: update API documentation
chore: update dependencies

# Minor version bump
feat: add email template system
feat(auth): implement magic link authentication

# Major version bump
feat!: redesign node architecture
fix: user authentication BREAKING CHANGE: removes legacy auth system
```

## Available Commands

### Automatic Version Detection
```bash
# Analyze commits and update version automatically
pnpm version:analyze
pnpm version:bump

# Check for changes without updating
pnpm git-version check

# Show current version status
pnpm git-version status
```

### Manual Version Bumping
```bash
# Manual semantic version bumps
pnpm git-version major    # Breaking changes
pnpm git-version minor    # New features
pnpm git-version patch    # Bug fixes

# Pre-release versions
pnpm git-version alpha    # Alpha pre-release
pnpm git-version beta     # Beta pre-release
pnpm git-version rc       # Release candidate

# Release management
pnpm git-version release  # Convert pre-release to stable
pnpm git-version reset    # Reset to 0.0.0-alpha.1
```

## Version Information Structure

The system generates comprehensive version information:

```typescript
export const VERSION = {
  major: 0,
  minor: 11,
  patch: 0,
  full: "0.11.0",
  generated: "2025-07-26T05:35:53.260Z",
  git: {
    hash: "83fb5bfc938d9e5c3c228e27a866a86814baa469",
    shortHash: "83fb5bf",
    branch: "main",
    author: "Jayrr-Dev",
    date: "Fri Jul 25 23:17:59 2025 -0600",
    available: true
  },
  changelog: {
    bumpType: "minor",
    reason: "18 new feature(s) added",
    commits: 256
  }
} as const;
```

## File Tracking

The system monitors these file patterns for changes:
- `app/**/*.{ts,tsx}` - Next.js app directory
- `components/**/*.{ts,tsx}` - React components
- `features/**/*.{ts,tsx}` - Feature modules
- `lib/**/*.{ts,tsx}` - Utility libraries
- `hooks/**/*.{ts,tsx}` - Custom hooks
- `types/**/*.{ts,tsx}` - TypeScript types
- `convex/**/*.{ts,tsx}` - Convex backend
- `scripts/**/*.{js,ts}` - Build scripts
- Configuration files: `middleware.ts`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `package.json`

## Integration Points

### Package.json Sync
- Version automatically synced between cache and `package.json`
- Current version: `0.12.0` (package.json) vs `0.11.0` (cache) - indicates pending sync

### Git Integration
- Tracks git commit hashes and metadata
- Analyzes commit history since last processed commit
- Stores git author, branch, and commit date information

### Build Integration
- Version detection runs during build process
- Can be integrated into CI/CD pipelines
- Supports both manual and automatic version bumping

## Best Practices

### For Developers
1. **Use conventional commits** for all changes
2. **Be specific with scopes** when applicable: `feat(auth):`, `fix(email):`
3. **Mark breaking changes** with `!` or `BREAKING CHANGE:` footer
4. **Run version check** before major releases: `pnpm git-version status`

### For Releases
1. **Check version status** before deploying
2. **Use pre-release versions** for testing: alpha → beta → rc → release
3. **Manual bumps** only when automatic detection fails
4. **Reset to alpha** when starting new major development cycles

## Current Status

- **Current Version**: 0.11.0 (from version.ts)
- **Package Version**: 0.12.0 (needs sync)
- **Last Update**: July 26, 2025
- **Git Branch**: main
- **Last Bump**: Minor (18 new features added)
- **Commits Analyzed**: 256

## Troubleshooting

### Version Mismatch
If package.json and version cache are out of sync:
```bash
pnpm git-version check  # Will sync versions
```

### Missing Git Info
If git information shows as unavailable:
- Ensure you're in a git repository
- Check git is installed and accessible
- Verify repository has commits

### Cache Issues
If version detection seems stuck:
```bash
pnpm git-version reset  # Reset to fresh state
```

## Configuration

The system is configured in `features/business-logic-modern/infrastructure/versioning/auto-version.ts`:
- **GitHub Integration**: Enabled for Jayrr-Dev/Agenitix-2
- **Auto-migrate**: Enabled for seamless updates
- **Breaking Change Detection**: Multiple indicators supported
- **File Tracking**: Comprehensive pattern matching