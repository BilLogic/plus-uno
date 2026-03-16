import shutil
import os
import sys

def copy_dir(src, dest):
    try:
        if os.path.exists(dest):
            print(f"Destination {dest} exists, merging...")
            shutil.copytree(src, dest, dirs_exist_ok=True)
        else:
            print(f"Copying {src} to {dest}...")
            shutil.copytree(src, dest)
        print(f"Successfully copied {src} to {dest}")
    except Exception as e:
        print(f"Error copying {src} to {dest}: {e}")
        sys.exit(1)

root_dir = "/Users/billguo/Library/CloudStorage/Box-Box/plus-vibe-coding-starting-kit/plus-vibe-coding-starting-kit"

# 1. Copy legacy-ds/assets to new-ds/assets
src_assets = os.path.join(root_dir, "legacy-ds/assets")
dest_assets = os.path.join(root_dir, "new-ds/assets")
copy_dir(src_assets, dest_assets)

# 2. Copy legacy-ds/components to new-ds/vanilla_components
src_components = os.path.join(root_dir, "legacy-ds/components")
dest_components = os.path.join(root_dir, "new-ds/vanilla_components")
copy_dir(src_components, dest_components)

print("Copy operations completed.")
