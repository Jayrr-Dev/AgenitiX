# Contributing to AgenitiX

Thank you for your interest in contributing to AgenitiX! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues

- Use the [GitHub Issues](https://github.com/Jayrr-Dev/AgenitiX/issues) page
- Search existing issues before creating new ones
- Provide clear descriptions and reproduction steps
- Include relevant environment information

### Suggesting Features

- Use [GitHub Discussions](https://github.com/Jayrr-Dev/AgenitiX/discussions) for feature requests
- Describe the problem you're trying to solve
- Explain how the feature would benefit users
- Consider implementation complexity

### Code Contributions

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Test your changes**
5. **Submit a pull request**

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- pnpm (recommended)
- Git
- Convex account

### Local Development

1. **Fork and clone**

   ```bash
   git clone https://github.com/your-username/agenitix.git
   cd agenitix
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment**

   ```bash
   cp .env.example .env.local
   # Configure your environment variables
   ```

4. **Start development**
   ```bash
   pnpm dev
   ```

## 📝 Code Standards

### Commit Messages

We use [Conventional Commits](https://conventionalcommits.org/):

```
type(scope): description

feat(auth): add magic link authentication
fix(ui): resolve button alignment issue
docs(readme): update installation instructions
```

**Types:**

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `design`: UI/UX improvements
- `refactor`: Code restructuring
- `test`: Test additions/changes
- `chore`: Maintenance tasks
- `style`: Formatting changes
- `perf`: Performance improvements
- `ci`: CI configuration changes
- `build`: Build system changes
- `revert`: Reverts

### Code Style

- **Formatting**: Use Biome for formatting and linting
- **TypeScript**: Strict mode enabled, avoid `any` types
- **Naming**: Follow project conventions
  - Files: `verbObject` pattern (e.g., `testingHandlesSuite.ts`)
  - Components: PascalCase
  - Functions: camelCase
  - Constants: UPPER_SNAKE_CASE

### File Organization

- **Components**: Place in appropriate directories under `components/`
- **Business Logic**: Feature-specific code in `features/`
- **Utilities**: Shared utilities in `lib/` or `utils/`
- **Types**: TypeScript definitions in `types/`

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run Convex function tests
pnpm test:convex

# Run tests in watch mode
pnpm test:watch
```

### Writing Tests

- Write tests for new features
- Ensure existing tests pass
- Use descriptive test names
- Test edge cases and error conditions

## 📋 Pull Request Process

### Before Submitting

1. **Ensure tests pass**

   ```bash
   pnpm test
   pnpm lint
   ```

2. **Update documentation** if needed
3. **Add tests** for new functionality
4. **Update changelog** if applicable

### PR Description

Include:

- **Summary** of changes
- **Motivation** for the change
- **Testing** performed
- **Screenshots** for UI changes
- **Breaking changes** if any

### Review Process

- Maintainers will review your PR
- Address feedback promptly
- Keep PRs focused and small
- Respond to review comments

## 🏗️ Architecture Guidelines

### Component Structure

```typescript
// Component file structure
interface ComponentProps {
  // Props interface
}

const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Component logic
  return (
    // JSX
  );
};

export default Component;
```

### Convex Functions

```typescript
// Convex function structure
import { mutation, query } from "./_generated/server";

export const myQuery = query({
  args: { param: v.string() },
  handler: async (ctx, args) => {
    // Function logic
  },
});
```

### Error Handling

- Use proper error boundaries
- Provide meaningful error messages
- Log errors appropriately
- Handle edge cases gracefully

## 🔍 Code Review Guidelines

### For Reviewers

- Be constructive and respectful
- Focus on code quality and functionality
- Suggest improvements
- Approve when ready

### For Authors

- Respond to feedback promptly
- Make requested changes
- Ask questions if unclear
- Keep discussions focused

## 🚀 Release Process

- Releases are managed by maintainers
- Follow semantic versioning
- Update changelog
- Tag releases appropriately

## 📞 Getting Help

- **Discussions**: [GitHub Discussions](https://github.com/Jayrr-Dev/AgenitiX/discussions)
- **Issues**: [GitHub Issues](https://github.com/Jayrr-Dev/AgenitiX/issues)
- **Documentation**: Check existing docs first

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to AgenitiX! 🎉
