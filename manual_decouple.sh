#!/bin/bash
# Manual Decouple Script

echo "Copying assets and components from legacy-ds to new-ds..."

# 1. Copy Logo and Images assets
# Ensure destination directories exist
mkdir -p new-ds/assets

# Copy contents (using rsync or cp)
cp -R legacy-ds/assets/* new-ds/assets/
echo "✅ Copied assets to new-ds/assets/"

# 2. Copy vanilla components
mkdir -p new-ds/vanilla_components
cp -R legacy-ds/components/* new-ds/vanilla_components/
echo "✅ Copied legacy-ds/components to new-ds/vanilla_components/"

echo "Decoupling file operations completed."
emoji="👍"
echo "$emoji You can now ask the agent to continue!"
