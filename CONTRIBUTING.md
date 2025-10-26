# Contributing to Whalli

Thank you for your interest in contributing to Whalli! This guide will help you get started.

## 📋 Code of Conduct

- Be respectful and inclusive
- Write clean, maintainable code
- Follow the existing code style
- Write meaningful commit messages

## 🏗️ Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd whalli
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment**
   ```bash
   ./setup.sh
   # Or manually copy .env.example files
   ```

4. **Start development**
   ```bash
   pnpm dev
   ```

## 🌳 Branch Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

## 📝 Commit Messages

Follow conventional commits format:

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```
feat(backend): add user authentication
fix(web): resolve navigation issue on mobile
docs(readme): update installation instructions
```

## 🧪 Testing

Before submitting a PR, ensure:

```bash
# All code is properly formatted
pnpm format

# No linting errors
pnpm lint

# Type checking passes
pnpm type-check

# All apps build successfully
pnpm build
```

## 📦 Adding Dependencies

### Root Dependencies
```bash
pnpm add -w <package>
```

### App/Package Dependencies
```bash
pnpm add <package> --filter @whalli/<app-or-package>
```

### Dev Dependencies
```bash
pnpm add -D <package> --filter @whalli/<app-or-package>
```

## 🏛️ Architecture Guidelines

### Backend (`apps/backend`)
- Use NestJS patterns (modules, controllers, services)
- Keep business logic in services
- Use DTOs for validation
- **ONLY** place that imports `@whalli/prisma`

### Frontend (`apps/web`, `apps/admin`)
- Use Next.js App Router conventions
- Create reusable components in `packages/ui`
- Use server components by default
- Client components when needed (interactivity, hooks)

### Packages
- **`packages/ui`**: React components only
- **`packages/utils`**: Framework-agnostic utilities
- **`packages/prisma`**: Database schema and client

## 🎨 Code Style

### TypeScript
- Use strict mode
- Prefer `interface` over `type` for objects
- Use `const` over `let` when possible
- Avoid `any`, use `unknown` if needed

### React/Next.js
- Use functional components
- Prefer composition over inheritance
- Keep components small and focused
- Use TypeScript for props

### Naming Conventions
- **Files**: `kebab-case.ts`, `PascalCase.tsx` (components)
- **Components**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`

## 🔍 Code Review Process

1. Create a feature branch
2. Make your changes
3. Write/update tests if applicable
4. Run linting and type checking
5. Commit with meaningful messages
6. Push and create a PR
7. Wait for review and address feedback

## 📚 Documentation

When adding new features:

- Update relevant README files
- Add JSDoc comments for public APIs
- Update SETUP.md if setup process changes
- Add examples when helpful

## 🐛 Bug Reports

When reporting bugs, include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Screenshots/logs if applicable

## 💡 Feature Requests

When proposing features:

- Explain the use case
- Describe the expected behavior
- Consider backward compatibility
- Discuss implementation approach

## 🔐 Security

If you discover a security vulnerability:

- **DO NOT** open a public issue
- Email the maintainers directly
- Provide details about the vulnerability
- Wait for acknowledgment before public disclosure

## 📞 Getting Help

- Check existing documentation
- Search closed issues
- Ask in discussions
- Reach out to maintainers

## ✅ Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Documentation is updated
- [ ] Commit messages are clear
- [ ] Branch is up to date with main/develop
- [ ] PR description explains changes

## 🙏 Thank You!

Your contributions make this project better. Thank you for taking the time to contribute!
