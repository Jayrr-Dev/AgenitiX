# Git Workflow Guide

## Git Naming Conventions & Standards

This project uses **Husky** with **commitlint** to enforce strict naming conventions and commit message standards. The system automatically validates all commits and branch names to maintain consistency.

### Commit Message Standards

All commit messages must follow the **Conventional Commits** specification:

#### Format
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

#### Type Categories
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `design:` - Design improvements and UI/UX changes
- `style:` - Code style changes (formatting, missing semicolons, etc.)
- `refactor:` - Code refactoring (no functional changes)
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks, dependencies, etc.
- `perf:` - Performance improvements
- `ci:` - CI/CD changes
- `build:` - Build system changes
- `revert:` - Reverting previous commits

#### Scope (Optional)
- `ui:` - User interface changes
- `api:` - API changes
- `auth:` - Authentication changes
- `flow:` - Flow engine changes
- `node:` - Node-related changes
- `theme:` - Theming changes

#### Examples
```bash
# ✅ Valid commit messages
git commit -m "feat: add email node to flow engine"
git commit -m "fix(ui): resolve piemenu positioning issue"
git commit -m "docs: update API documentation"
git commit -m "design: improve email node layout"
git commit -m "style: format code with prettier"
git commit -m "refactor(node): simplify node inspector logic"
git commit -m "chore: update dependencies"

# ❌ Invalid commit messages (will be rejected)
git commit -m "updated stuff"  # No type
git commit -m "feat: this is a very long commit message that exceeds the 100 character limit and will be rejected by commitlint"  # Too long
git commit -m "FIX: bug fix"  # Wrong case
```

#### Character Limits
- **Header**: Maximum 100 characters
- **Subject**: Maximum 100 characters
- **Body**: No limit (but should be concise)

### Branch Naming Conventions

All branches must follow the established naming pattern:

#### Format
```
<type>/<description>
```

#### Branch Types
- `feature/` - New features
- `fix/` - Bug fixes
- `hotfix/` - Critical fixes
- `refactor/` - Code refactoring
- `design/` - Design improvements
- `ui/` - User interface enhancements
- `style/` - CSS/styling changes
- `chore/` - Maintenance tasks

#### Examples
```bash
# ✅ Valid branch names
git checkout -b feature/user-authentication
git checkout -b fix/piemenu-position-issue
git checkout -b refactor/node-inspector-components
git checkout -b design/email-node-layout
git checkout -b ui/node-inspector-redesign
git checkout -b style/piemenu-animations
git checkout -b chore/update-dependencies

# ❌ Invalid branch names (avoid these)
git checkout -b new-feature  # No type prefix
git checkout -b bugfix  # No slash separator
git checkout -b feature  # No description
```

### Enforcement System

#### Husky Hooks
The project uses Husky to automatically run validation on:
- **pre-commit**: Runs linting and formatting checks
- **commit-msg**: Validates commit message format using commitlint
- **pre-push**: Runs tests before pushing

#### Commitlint Configuration
- Enforces conventional commit format
- Validates type, scope, and description
- Checks character limits
- Ensures proper formatting

#### Error Handling
When a commit fails validation:
1. **Commit is rejected** with specific error messages
2. **Fix the commit message** and try again
3. **Use `git commit --amend`** to fix the last commit
4. **Use `git reset --soft HEAD~1`** to undo and recommit

### Common Validation Errors

#### Header Too Long
```
✖   header must not be longer than 100 characters, current length is 116 [header-max-length]
```
**Solution**: Shorten your commit message to under 100 characters

#### Missing Type
```
✖   type must not be empty [type-empty]
```
**Solution**: Add a valid type (feat, fix, docs, etc.)

#### Invalid Type
```
✖   type must be in lowerCase [type-case]
```
**Solution**: Use lowercase types (feat, not FEAT)

#### Missing Description
```
✖   subject must not be empty [subject-empty]
```
**Solution**: Add a descriptive message after the type

### Best Practices

#### Writing Good Commit Messages
1. **Use imperative mood**: "add feature" not "added feature"
2. **Be specific**: "fix login validation" not "fix bug"
3. **Keep it concise**: Under 100 characters
4. **Use present tense**: "feat: add" not "feat: added"

#### Branch Management
1. **Create from main**: Always branch from the latest main
2. **Keep branches focused**: One feature/fix per branch
3. **Use descriptive names**: Clear what the branch does
4. **Delete after merge**: Clean up merged branches

#### Workflow Integration
1. **Test before committing**: Run tests locally
2. **Check formatting**: Use prettier and eslint
3. **Review your changes**: `git diff` before committing
4. **Use meaningful commits**: Each commit should be a logical unit

## Professional Feature Development Workflow

### 1. Always Work on Feature Branches

```bash
# Create and switch to a new feature branch
git checkout -b feature/your-feature-name

# Or using the newer syntax
git switch -c feature/your-feature-name
```

### 2. Branch Naming Conventions

- `feature/descriptive-name` - for new features
- `fix/bug-description` - for bug fixes
- `hotfix/urgent-fix` - for critical fixes
- `refactor/component-name` - for code refactoring
- `design/component-name` - for design improvements
- `ui/component-name` - for user interface enhancements
- `style/component-name` - for CSS/styling changes
- `chore/task-description` - for maintenance tasks

### 3. Development Workflow

```bash
# 1. Start from main (ensure it's up to date)
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/new-feature

# 3. Make your changes and commit frequently
git add .
git commit -m "feat: add new feature component"

# 4. Push your branch to remote
git push -u origin feature/new-feature
```

### 4. Before Merging

```bash
# 1. Update your feature branch with latest main
git checkout main
git pull origin main
git checkout feature/new-feature
git merge main

# 2. Resolve any conflicts if they occur
# 3. Test your changes thoroughly
```

### 5. Pull Request Process

- Create a PR from your feature branch to main
- Add proper description, screenshots, testing notes
- Request code review from team members
- Address feedback and make changes if needed
- Merge only after approval

### 6. After Merging

```bash
# Clean up local branches
git checkout main
git pull origin main
git branch -d feature/new-feature
```

## Best Practices for This Project

### Branch Strategy Examples

```bash
# Example for adding a new node type
git checkout -b feature/add-email-node

# Example for fixing a bug
git checkout -b fix/piemenu-position-issue

# Example for refactoring
git checkout -b refactor/node-inspector-components

# Example for design improvements
git checkout -b design/email-node-layout

# Example for UI enhancements
git checkout -b ui/node-inspector-redesign

# Example for styling changes
git checkout -b style/piemenu-animations
```

### Commit Message Standards

Follow the existing pattern:
```bash
git commit -m "feat: add tooltips to piemenu category icons"
git commit -m "fix: resolve addnode position on first piemenu interaction"
git commit -m "refactor: enhance Gmail OAuth callback handling"
```

## Undoing Problematic Merges

### How to Unmerge a Recent Commit

```bash
# 1. Check recent commits
git log --oneline -5

# 2. Reset to previous commit (removes the merge)
git reset --hard HEAD~1

# 3. Force push to make current state the new main
git push --force-with-lease origin main
```

### What This Accomplishes

- ✅ **Removes problematic PR**: The merge commit containing issues is completely removed
- ✅ **Makes current state the new main**: Your local state becomes the remote main branch
- ✅ **No sync conflicts**: Remote and local are now in sync
- ✅ **Clean history**: Problematic PR and merge commit are no longer in main branch history

## Important Notes

- The feature branch still exists on remote with the problematic changes
- Use `--force-with-lease` instead of `--force` for safety
- Always test thoroughly before creating new PRs
- Keep feature branches focused on single features/fixes

## Recommended Workflow for New Features

1. **Create feature branch from clean main**
2. **Make incremental commits with descriptive messages**
3. **Test thoroughly before pushing**
4. **Create PR with proper documentation**
5. **Address feedback and iterate**
6. **Merge only after approval and testing**
7. **Clean up branches after successful merge**

## Troubleshooting Common Issues

### Commit Message Validation Fails
```bash
# If your commit message is too long or invalid:
git commit --amend -m "feat: add email node component"
```

### Branch Name Issues
```bash
# If you created a branch with wrong name:
git branch -m old-name feature/correct-name
```

### Pre-commit Hook Fails
```bash
# If linting/formatting fails:
pnpm run lint:fix
pnpm run format
git add .
git commit -m "style: fix formatting issues"
```

### Force Push Safety
```bash
# Always use --force-with-lease instead of --force
git push --force-with-lease origin branch-name
```

This ensures you don't overwrite someone else's changes accidentally.
