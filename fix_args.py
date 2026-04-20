import os
import re

STORY_DIRS = ['design-system/src/components', 'design-system/src/forms']

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # We want to find argTypes: { ... } block and inject/replace children, onClick, style.
    # To do this safely with regex, we can just replace default exported objects?
    # Actually, a simpler way is to find argTypes: { and append these properties immediately after it.
    
    basename = os.path.basename(filepath)
    is_button_or_group = 'Button' in basename
    is_badge = 'Badge' in basename # Badge also has style prop? Let's check.
    
    # We will just inject these properties into the argTypes object if they are missing
    # But wait, what if they are already defined?
    # It's better to just do a regex replace to ensure table: { disable: true } is there.
    
    # A safer approach for a regex is to append it to argTypes if it exists.
    # Let's see if argTypes: { is in the file.
    if 'argTypes: {' in content:
        # We can append at the top of argTypes
        # Find the first occurrence of argTypes: {
        
        insert_str = ""
        missing_props = []
        if 'children:' not in content:
            missing_props.append("\n        children: { table: { disable: true, category: 'Development' } },")
        if 'onClick:' not in content and 'onclick:' not in content:
            missing_props.append("\n        onClick: { table: { disable: true, category: 'Development' } },")
        
        # Disable style for everything EXCEPT Button, ButtonGroup, Badge, etc.
        # Let's see if 'style' is used as a control. If it is, it typically has "options: ['primary', ...]"
        # If the file defines `style: { control:` we assume it's intentionally interactive.
        if "style: {" not in content:
            missing_props.append("\n        style: { table: { disable: true, category: 'Development' } },")
        
        if missing_props:
            content = content.replace("argTypes: {", "argTypes: {" + "".join(missing_props), 1)

    # For existing properties that might be defined without table: { disable: true },
    # Let's replace 'children: {' if it exists but doesn't have table: disable
    # It's tricky to do with regex. I will just rely on the above logic, AND replace existing bad ones.
    
    # Let's just find and replace exact strings if they exist but don't have disable: true
    content = re.sub(r'children:\s*\{[^}]*\}', r"children: { table: { disable: true, category: 'Development' } }", content)
    content = re.sub(r'onClick:\s*\{[^}]*\}', r"onClick: { table: { disable: true, category: 'Development' } }", content)
    
    if "style: { control:" not in content and "style: {\n            control:" not in content:
         content = re.sub(r'style:\s*\{[^}]*\}', r"style: { table: { disable: true, category: 'Development' } }", content)

    with open(filepath, 'w') as f:
        f.write(content)

for d in STORY_DIRS:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith('.stories.jsx'):
                process_file(os.path.join(root, file))

print("Completed updating argTypes")
