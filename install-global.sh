#!/bin/bash
# Setup Shipwright for development

set -e

echo "🚀 Setting up Shipwright for development..."

# Build all packages
echo "📦 Building packages..."
pnpm -r build

# Create symlink for global access
echo "🔗 Creating global symlink..."
mkdir -p ~/.local/bin
ln -sf $(pwd)/shipwright ~/.local/bin/shipwright

# Add to PATH if not already there
if ! echo "$PATH" | grep -q "$HOME/.local/bin"; then
    echo "📝 Adding ~/.local/bin to PATH..."
    echo 'export PATH=$PATH:~/.local/bin' >> ~/.bashrc
    echo "⚠️  Please run 'source ~/.bashrc' or restart your terminal"
fi

echo "✅ Shipwright setup complete!"
echo ""
echo "You can now use:"
echo "  shipwright --help"
echo "  shipwright init"
echo "  shipwright assets"
echo "  shipwright package"
echo "  shipwright build"
echo "  shipwright publish"
echo ""
echo "If 'shipwright' command not found, run:"
echo "  source ~/.bashrc"
echo "  # or restart your terminal"
