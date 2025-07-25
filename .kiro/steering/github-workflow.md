# GitHub Best Practices & Team Workflow

## Quick Start Workflow

1. **Pull latest from main**: `git pull origin main`
2. **Create feature branch**: `git checkout -b feature/your-feature-name`
3. **Make changes and commit regularly**
4. **Push branch**: `git push origin feature/your-feature-name`
5. **Create Pull Request on GitHub**
6. **Request review from teammate**
7. **Address feedback if needed**
8. **Squash and merge when approved**

## Branch Strategy

We use **GitHub Flow** - simple and effective:

- **main branch** = always deployable
- **All work happens in feature branches**
- **Branch naming convention**:
  - Features: `feature/user-authentication`
  - Bugs: `fix/login-error`
  - Refactoring: `refactor/api-client`

## Pull Request Rules

1. **Every change needs a PR** - no exceptions
2. **At least 1 review required** before merging
3. **Keep PRs small** - aim for under 400 lines
4. **Link to issues** - use "Closes #123" in PR description
5. **Use draft PRs** for early feedback on work-in-progress

## Code Review Guidelines

**When reviewing:**
- Check logic and potential bugs
- Ensure code follows our conventions
- Verify tests are included (if applicable)
- Use GitHub's suggestion feature for quick fixes
- Be helpful, not harsh - we're all learning

**Review response time:** Within 24 hours on weekdays

## Commit Messages

Use this format for consistency:

```
type: brief description
```

**Types:**
- `feat`: new feature
- `fix`: bug fix
- `docs`: documentation changes
- `refactor`: code restructuring
- `test`: test additions/changes
- `chore`: maintenance tasks

**Examples:**
```
feat: add password reset functionality
fix: resolve timeout issue in API calls
docs: update setup instructions in README
```

## Repository Protection

These are already configured:
- Branch protection on main
- Required reviews before merge
- Squash and merge enabled
- Direct commits to main blocked

## Organization Tips

- **Issues**: Create an issue before starting major work
- **Labels**: Use labels to categorize (bug, feature, enhancement)
- **Projects**: Track sprint progress in GitHub Projects
- **Documentation**: Keep README current

## Pro Tips

1. **Sync regularly** - Pull from main daily to avoid conflicts
2. **Commit often** - Small, logical commits are easier to review
3. **Write tests** - Include tests with new features
4. **Clean up** - Delete merged branches to keep repo tidy

## Important Reminders

- ❌ **NEVER** force push to main
- ❌ **NEVER** commit secrets or API keys
- ✅ **ALWAYS** test locally before creating PR
- ✅ **ALWAYS** update documentation with code changes