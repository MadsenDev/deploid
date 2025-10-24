# Development Guide

This guide explains how to set up Shipwright for development and get the clean `shipwright` command working.

## 🚀 Quick Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/MadsenDev/shipwright.git
cd shipwright

# Install dependencies
pnpm install

# Setup for development
./install-global.sh
```

### 2. Use the Command

Now you can use the clean `shipwright` command:

```bash
# Check if it works
./shipwright --help

# Initialize a project
./shipwright init

# Generate assets
./shipwright assets

# Package for Android
./shipwright package

# Build APK/AAB
./shipwright build

# Publish to stores
./shipwright publish
```

## 🔧 How It Works

### The `shipwright` Executable

The root `shipwright` file is a simple Node.js script:

```bash
#!/usr/bin/env node
require('./packages/cli/dist/index.js');
```

This file:
1. Has executable permissions (`chmod +x`)
2. Points to the compiled CLI package
3. Allows you to run `./shipwright` instead of `node packages/cli/dist/index.js`

### Global Access (Automatic)

The setup script automatically creates a symlink for global access:

```bash
# Setup script does this automatically:
# 1. Creates ~/.local/bin/shipwright symlink
# 2. Adds ~/.local/bin to your PATH
# 3. You can use 'shipwright' anywhere!

shipwright --help
shipwright init
```

### Manual PATH Setup (Alternative)

If you prefer manual setup:

```bash
# Add to your PATH
export PATH=$PATH:$(pwd)

# Now you can use
shipwright --help
shipwright init
```

### Alternative: Direct Execution

You can still run the CLI directly:

```bash
# Direct execution
node packages/cli/dist/index.js --help
node packages/cli/dist/index.js init
```

## 🛠️ Development Workflow

### 1. Make Changes

```bash
# Edit source files
vim packages/cli/src/index.ts
vim packages/core/src/logger.ts
```

### 2. Build Changes

```bash
# Build all packages
pnpm -r build

# Or build specific package
cd packages/cli && pnpm build
```

### 3. Test Changes

```bash
# Test the command
./shipwright --help

# Test with example
cd examples/vite-react
../../shipwright assets
```

## 📦 Package Structure

```
shipwright/
├── shipwright                 # Executable script (root)
├── install-global.sh          # Setup script
├── packages/
│   ├── cli/                   # CLI package
│   │   ├── src/index.ts       # CLI source
│   │   ├── dist/index.js      # Compiled CLI
│   │   └── bin/shipwright     # Alternative executable
│   ├── core/                  # Core package
│   └── plugins/               # Plugin packages
└── examples/                  # Example projects
```

## 🎯 Future: NPM Package

When Shipwright is published to npm, users will install it globally:

```bash
# Future installation
npm install -g shipwright

# Then use anywhere
shipwright init
shipwright assets
```

## 🔍 Troubleshooting

### Command Not Found

```bash
# Make sure the script is executable
chmod +x shipwright

# Check if it works
./shipwright --help
```

### Build Errors

```bash
# Clean and rebuild
rm -rf packages/*/dist
pnpm -r build
```

### Permission Issues

```bash
# Fix permissions
chmod +x shipwright
chmod +x install-global.sh
```

## 📚 Next Steps

1. **Development**: Use `./shipwright` for local development
2. **Testing**: Test with example projects
3. **Publishing**: Prepare for npm publication
4. **Global Install**: Set up proper global installation

The clean `shipwright` command is now ready for development! 🚀
