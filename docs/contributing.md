# Contributing to Deploid

Thank you for your interest in contributing to Deploid! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and pnpm
- **Git** for version control
- **TypeScript** knowledge
- **Android Studio** (for testing)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/MadsenDev/deploid.git
cd deploid

# Install dependencies
pnpm install

# Build all packages
pnpm -r build

# Run tests (when available)
pnpm test
```

## 📁 Project Structure

```
deploid/
├── packages/
│   ├── cli/                    # Command line interface
│   ├── core/                   # Core functionality
│   └── plugins/                # Modular plugins
│       ├── assets/             # Asset generation
│       ├── packaging-capacitor/ # Capacitor integration
│       └── build-android/      # Android building
├── templates/                  # Project templates
├── examples/                   # Example projects
├── docs/                       # Documentation
└── tests/                      # Test files
```

## 🧩 Development Workflow

### 1. Making Changes

```bash
# Create a feature branch
git checkout -b feature/my-feature

# Make your changes
# ... edit files ...

# Build and test
pnpm -r build

# Test your changes
node packages/cli/dist/index.js --help
```

### 2. Testing Changes

```bash
# Test with example project
cd examples/vite-react
node ../../packages/cli/dist/index.js assets
node ../../packages/cli/dist/index.js package
```

### 3. Submitting Changes

```bash
# Commit your changes
git add .
git commit -m "feat: add new feature"

# Push to your fork
git push origin feature/my-feature

# Create a pull request
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test
pnpm test --filter @deploid/core

# Run with coverage
pnpm test --coverage
```

### Test Structure

```
tests/
├── unit/                       # Unit tests
│   ├── core/                   # Core package tests
│   ├── cli/                    # CLI tests
│   └── plugins/                # Plugin tests
├── integration/                # Integration tests
│   ├── assets/                 # Asset generation tests
│   ├── packaging/              # Packaging tests
│   └── build/                  # Build tests
└── e2e/                        # End-to-end tests
    ├── vite/                   # Vite project tests
    ├── next/                   # Next.js project tests
    └── cra/                    # CRA project tests
```

### Writing Tests

**Unit Test Example**:
```typescript
import { describe, it, expect } from 'vitest';
import { loadConfig } from '@deploid/core';

describe('Config Loader', () => {
  it('should load valid configuration', async () => {
    const config = await loadConfig('./examples/vite-react');
    expect(config.appName).toBe('ViteReactApp');
  });
});
```

**Integration Test Example**:
```typescript
import { describe, it, expect } from 'vitest';
import { execa } from 'execa';

describe('Asset Generation', () => {
  it('should generate all required icons', async () => {
    await execa('node', ['packages/cli/dist/index.js', 'assets'], {
      cwd: './examples/vite-react'
    });
    
    // Check if files exist
    expect(fs.existsSync('examples/vite-react/assets-gen/icon-192.png')).toBe(true);
  });
});
```

## 🔧 Plugin Development

### Creating a New Plugin

1. **Create plugin directory**:
```bash
mkdir packages/plugins/my-plugin
cd packages/plugins/my-plugin
```

2. **Setup package.json**:
```json
{
  "name": "@deploid/plugin-my-plugin",
  "version": "0.0.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc -b"
  },
  "dependencies": {
    "@deploid/core": "workspace:*"
  }
}
```

3. **Create TypeScript config**:
```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"]
}
```

4. **Implement plugin**:
```typescript
import { PipelineStep } from '../../../core/dist/index.js';

export const myPlugin = (): PipelineStep => async ({ logger, config, cwd }) => {
  logger.info('My plugin executing...');
  // Plugin implementation
};
```

5. **Register in plugin loader**:
```typescript
// In packages/core/src/plugin-loader.ts
case 'my-plugin':
  const myPluginPath = new URL('../../plugins/my-plugin/dist/index.js', import.meta.url).pathname;
  const { myPlugin } = await import(myPluginPath);
  return myPlugin();
```

6. **Build and test**:
```bash
pnpm build
pnpm test
```

### Plugin Guidelines

- **Single Responsibility**: Each plugin should have one clear purpose
- **Error Handling**: Always handle errors gracefully
- **Logging**: Use appropriate log levels
- **Configuration**: Support configuration options
- **Testing**: Write comprehensive tests

## 📝 Documentation

### Documentation Standards

- **Clear and concise**: Write for developers of all levels
- **Examples**: Include practical examples
- **Code samples**: Use TypeScript for code samples
- **Links**: Link to related documentation

### Documentation Structure

```
docs/
├── README.md                   # Main documentation
├── getting-started.md          # Quick start guide
├── architecture.md             # Technical architecture
├── configuration.md            # Configuration reference
├── cli-reference.md            # CLI commands
├── plugins.md                  # Plugin system
├── examples.md                 # Usage examples
└── contributing.md             # This file
```

### Writing Documentation

1. **Use Markdown**: All documentation in Markdown
2. **Code blocks**: Use TypeScript for code examples
3. **Links**: Use relative links for internal docs
4. **Images**: Place images in `docs/images/`
5. **Examples**: Include working examples

## 🐛 Bug Reports

### Reporting Bugs

When reporting bugs, please include:

1. **Environment**: OS, Node.js version, pnpm version
2. **Steps to reproduce**: Clear, numbered steps
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Error messages**: Full error output
6. **Configuration**: Relevant config files

### Bug Report Template

```markdown
## Bug Report

### Environment
- OS: [e.g., Ubuntu 22.04]
- Node.js: [e.g., 18.17.0]
- pnpm: [e.g., 8.6.0]

### Steps to Reproduce
1. Run `deploid init`
2. Add logo to `assets/logo.svg`
3. Run `deploid assets`
4. See error

### Expected Behavior
Assets should be generated successfully

### Actual Behavior
Error: Cannot find module 'sharp'

### Error Message
```
Error: Cannot find module 'sharp'
    at Object.<anonymous> (/path/to/file.js:1:1)
```

### Configuration
```typescript
export default {
  assets: {
    source: 'assets/logo.svg',
    output: 'assets-gen/',
  },
};
```
```

## 🚀 Feature Requests

### Requesting Features

When requesting features, please include:

1. **Use case**: Why is this feature needed?
2. **Proposed solution**: How should it work?
3. **Alternatives**: What alternatives have you considered?
4. **Additional context**: Any other relevant information

### Feature Request Template

```markdown
## Feature Request

### Use Case
I need to generate iOS icons for my app

### Proposed Solution
Add iOS icon generation to the assets plugin

### Alternatives
- Use external tools
- Manual icon generation

### Additional Context
This would complete the cross-platform asset generation
```

## 📋 Pull Request Process

### Before Submitting

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Write tests**
5. **Update documentation**
6. **Build and test**

### Pull Request Guidelines

- **Clear title**: Describe what the PR does
- **Description**: Explain the changes and why
- **Tests**: Include tests for new functionality
- **Documentation**: Update docs if needed
- **Breaking changes**: Clearly mark any breaking changes

### Pull Request Template

```markdown
## Pull Request

### Description
Brief description of changes

### Changes
- [ ] Added new feature
- [ ] Fixed bug
- [ ] Updated documentation
- [ ] Added tests

### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

### Breaking Changes
- [ ] No breaking changes
- [ ] Breaking changes (explain)

### Documentation
- [ ] Updated README
- [ ] Updated API docs
- [ ] Added examples
```

## 🏷️ Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Steps

1. **Update version numbers**
2. **Update CHANGELOG.md**
3. **Create release tag**
4. **Publish to npm**
5. **Update documentation**

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version numbers updated
- [ ] Release notes written
- [ ] npm packages published

## 🤝 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Expected Behavior

- **Be respectful**: Treat everyone with respect
- **Be constructive**: Provide helpful feedback
- **Be inclusive**: Welcome contributors of all backgrounds
- **Be patient**: Help newcomers learn

### Unacceptable Behavior

- **Harassment**: Any form of harassment
- **Discrimination**: Based on any protected characteristic
- **Trolling**: Deliberate disruption
- **Spam**: Unwanted promotional content

## 📞 Getting Help

### Community Support

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and discussions
- **Discord**: For real-time chat (if available)

### Developer Resources

- **Architecture Guide**: [docs/architecture.md](architecture.md)
- **Plugin Development**: [docs/plugins.md](plugins.md)
- **Examples**: [docs/examples.md](examples.md)

## 🎯 Roadmap

### Current Milestones

- **Milestone 1**: Core CLI + Capacitor ✅
- **Milestone 2**: Release + CI (in progress)
- **Milestone 3**: TWA & Tauri (planned)
- **Milestone 4**: Polish (planned)

### Contributing Areas

- **Core functionality**: Pipeline, configuration, logging
- **Plugins**: Assets, packaging, build, publish
- **Documentation**: Guides, examples, API docs
- **Testing**: Unit, integration, e2e tests
- **Examples**: Framework-specific examples

## 📄 License

By contributing to Deploid, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to Deploid! 🚀
