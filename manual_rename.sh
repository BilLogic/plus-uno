#!/bin/bash
# Manual Directory Rename Script

echo "Renaming directories..."

# 1. Rename design-system to legacy-ds
if [ -d "design-system" ]; then
    mv design-system legacy-ds
    echo "✅ Renamed design-system to legacy-ds"
else
    echo "⚠️  design-system directory not found (maybe already renamed?)"
fi

# 2. Rename src to new-ds
if [ -d "src" ]; then
    mv src new-ds
    echo "✅ Renamed src to new-ds"
else
    echo "⚠️  src directory not found (maybe already renamed?)"
fi

echo "Directory rename operations completed."
emoji="👍"
echo "$emoji You can now ask the agent to continue!"
