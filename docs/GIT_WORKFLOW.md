# Git Workflow Guide

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
