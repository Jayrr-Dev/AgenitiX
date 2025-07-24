# Auto-Versioning System 🏷️

**Conventional Commits Based Semantic Versioning**

This system automatically analyzes your GitHub commit history to determine semantic version bumps based on conventional commit format.

## 🚀 Quick Start

### Making Commits

Use conventional commit format for your commit messages:

```bash
feat: add new user authentication system
fix: resolve login redirect issue
docs: update API documentation
refactor: optimize database queries
test: add unit tests for payment processing
chore: update dependencies
```

### Version Bumps

| Commit Type | Version Bump | Example |
|-------------|--------------|---------|
| `feat:` | **Minor** (0.1.0 → 0.2.0) | New features |
| `fix:`, `docs:`, `refactor:`, `test:`, `chore:` | **Patch** (0.1.0 → 0.1.1) | Bug fixes, improvements |
| `feat!:` or `BREAKING CHANGE:` | **Major** (0.1.0 → 1.0.0) | Breaking changes |

### Breaking Changes

Indicate breaking changes in two ways:

**Method 1: Exclamation mark**
```bash
feat!: redesign user API endpoints
fix!: change authentication flow
```

**Method 2: Footer**
```bash
feat: add new payment gateway

BREAKING CHANGE: This changes the payment API structure
```

## 🛠️ Usage

### Manual Version Check
```bash
# Analyze commits and update version
pnpm version:analyze

# Same as above (alias)
pnpm version:bump
```

### Automatic Versioning

The system automatically runs on:
- **Push to main branch** - GitHub Actions analyzes commits and creates releases
- **Husky commit hook** - Validates commit message format

## 📋 Commit Types

| Type | Description | Version Bump |
|------|-------------|--------------|
| `feat` | New feature | Minor |
| `fix` | Bug fix | Patch |
| `docs` | Documentation only changes | Patch |
| `refactor` | Code change that neither fixes a bug nor adds a feature | Patch |
| `test` | Adding missing tests or correcting existing tests | Patch |
| `chore` | Maintenance tasks | Patch |
| `style` | Formatting, missing semi colons, etc. | Patch |
| `perf` | Performance improvements | Patch |
| `ci` | CI configuration changes | Patch |
| `build` | Build system changes | Patch |
| `revert` | Reverts a previous commit | Patch |

## 🔧 Configuration

### GitHub Repository Settings

Update repository info in `auto-version.ts`:

```typescript
github: {
  owner: "your-username",     // Your GitHub username/org
  repo: "your-repo-name",     // Your repository name
  enabled: true,
}
```

### Custom Type Mappings

Modify version bump rules in `auto-version.ts`:

```typescript
typeMapping: {
  minor: ["feat"],                           // Add new types for minor bumps
  patch: ["fix", "docs", "refactor", ...]   // Add new types for patch bumps
}
```

## 📊 Version File Structure

The system generates `version.ts` with:

```typescript
export const VERSION = {
  major: 1,
  minor: 2,
  patch: 3,
  full: "1.2.3",
  generated: "2025-01-15T10:30:00.000Z",
  git: {
    hash: "abc1234...",
    shortHash: "abc1234",
    branch: "main",
    author: "Your Name",
    date: "2025-01-15 10:30:00 -0600",
    available: true,
  },
  changelog: {
    bumpType: "minor",
    reason: "1 new feature(s) added",
    commits: 3,
  },
} as const;
```

## 🤖 GitHub Actions Integration

The system includes:

1. **Commit Analysis** - Scans commit history for conventional commits
2. **Version Calculation** - Determines semantic version bump
3. **File Updates** - Updates `version.ts` and cache files
4. **GitHub Release** - Creates tagged releases automatically
5. **Build & Test** - Runs full CI/CD pipeline

## 🔍 Troubleshooting

### No Version Bump

If no version is generated:
- Check commit messages follow conventional format
- Ensure commits contain recognized types
- Verify commits exist since last processed commit

### Invalid Commit Format

Commitlint will reject commits that don't follow conventional format:
```bash
# ❌ Invalid
git commit -m "updated some files"

# ✅ Valid  
git commit -m "chore: update configuration files"
```

### Manual Override

To reset or manually update version:

1. Edit `.version-cache.json` to change `lastProcessedCommit`
2. Run `pnpm version:analyze`
3. Or manually edit `version.ts` (not recommended)

## 📈 Benefits

- **Automated** - No manual version management
- **Semantic** - Clear versioning based on change impact
- **Traceable** - Links versions to specific commits
- **Consistent** - Enforces conventional commit standards
- **Integrated** - Works with CI/CD and GitHub releases

## 🔄 Migration from File-Based System

The old file-hash based system has been replaced. Old `.version-cache.json` files will be migrated automatically on first run.

## 📚 External Resources

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Commitlint Documentation](https://commitlint.js.org/) 