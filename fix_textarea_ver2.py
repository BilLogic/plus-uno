import os
import glob

def replace_in_files():
    base_dir = '/Users/victorwang/plus-vibe-coding-starting-kit-1'
    patterns = ['design-system/**/*.jsx', 'design-system/**/*.js', 'playground/**/*.jsx']
    files = []
    
    for pattern in patterns:
        files.extend(glob.glob(os.path.join(base_dir, pattern), recursive=True))

    for filepath in files:
        if not os.path.isfile(filepath): continue
        with open(filepath, 'r') as f:
            content = f.read()
            
        if 'TextareaVer2' in content:
            new_content = content.replace('TextareaVer2', 'Textarea')
            new_content = new_content.replace('TextareaVer2.jsx', 'Textarea.jsx')
            with open(filepath, 'w') as f:
                f.write(new_content)
            print(f"Updated {filepath}")

replace_in_files()
