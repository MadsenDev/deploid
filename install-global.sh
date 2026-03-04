#!/bin/bash
# Setup Deploid for development

set -e

echo "🚀 Setting up Deploid for development..."

# Build all packages
echo "📦 Building packages..."
pnpm -r build

# Create symlink for global access
echo "🔗 Creating global symlink..."
mkdir -p ~/.local/bin
ln -sf "$(pwd)/packages/cli/bin/deploid" ~/.local/bin/deploid

# Add to PATH if not already there
if ! echo "$PATH" | grep -q "$HOME/.local/bin"; then
    echo "📝 Adding ~/.local/bin to PATH..."
    echo 'export PATH=$PATH:~/.local/bin' >> ~/.bashrc
    echo "⚠️  Please run 'source ~/.bashrc' or restart your terminal"
fi

echo "✅ Deploid setup complete!"
echo ""
echo "You can now use:"
echo "  deploid --help"
echo "  deploid init"
echo "  deploid assets"
echo "  deploid package"
echo "  deploid build"
echo "  deploid publish"
echo ""
echo "If 'deploid' command not found, run:"
echo "  source ~/.bashrc"
echo "  # or restart your terminal"
