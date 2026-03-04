#!/bin/bash
# Publish Deploid CLI to npm

set -e

echo "🚀 Publishing Deploid CLI to npm..."

# Check if logged in to npm
if ! npm whoami > /dev/null 2>&1; then
    echo "❌ Not logged in to npm. Please run 'npm login' first."
    exit 1
fi

# Build all packages
echo "📦 Building packages..."
pnpm -r build

# Check if version is already published
CURRENT_VERSION=$(node -p "require('./package.json').version")
if npm view @deploid/cli@$CURRENT_VERSION version > /dev/null 2>&1; then
    echo "❌ Version $CURRENT_VERSION already published. Please bump version."
    exit 1
fi

# Publish to npm
echo "📤 Publishing to npm..."
npm publish

echo "✅ Deploid CLI published successfully!"
echo ""
echo "Users can now install with:"
echo "  npm install -g @deploid/cli"
echo "  deploid --help"
