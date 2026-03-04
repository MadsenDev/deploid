#!/bin/bash
# Publish Shipwright to npm

set -e

echo "🚀 Publishing Shipwright to npm..."

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
if npm view deploid@$CURRENT_VERSION version > /dev/null 2>&1; then
    echo "❌ Version $CURRENT_VERSION already published. Please bump version."
    exit 1
fi

# Publish to npm
echo "📤 Publishing to npm..."
npm publish

echo "✅ Shipwright published successfully!"
echo ""
echo "Users can now install with:"
echo "  npm install -g deploid"
echo "  deploid --help"
