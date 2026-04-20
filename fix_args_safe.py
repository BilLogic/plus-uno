import os
import re

STORY_DIRS = ['design-system/src/components', 'design-system/src/forms']

def remove_prop(content, prop_name):
    prop_str = f"{prop_name}:"
    # Find pattern like `children: {` inside the string
    import re
    # To avoid matching string literals, we just do a simple search
    # This is safe enough for config files
    idx = 0
    while True:
        # We look for \s+prop_name:\s*{
        match = re.search(r'\s+' + prop_name + r'\s*:\s*\{', content[idx:])
        if not match:
            break
        actual_start = idx + match.start()
        brace_start = idx + match.end() - 1
        
        # Verify it's inside argTypes: {
        # Just safely remove the property block
        brace_count = 1
        curr_idx = brace_start + 1
        while brace_count > 0 and curr_idx < len(content):
            if content[curr_idx] == '{': brace_count += 1
            elif content[curr_idx] == '}': brace_count -= 1
            curr_idx += 1
        
        # Remove trailing comma if exists
        end_idx = curr_idx
        while end_idx < len(content) and content[end_idx] in [' ', '\n', '\r']:
            end_idx += 1
        if end_idx < len(content) and content[end_idx] == ',':
            end_idx += 1
            
        content = content[:actual_start] + content[end_idx:]
        idx = actual_start
    return content

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    basename = os.path.basename(filepath)
    is_button = ('Button.stories.jsx' == basename)
    
    # Remove existing properties so we can safely inject them
    content = remove_prop(content, 'children')
    content = remove_prop(content, 'onClick')
    content = remove_prop(content, 'onclick')
    if not is_button:
        content = remove_prop(content, 'style')

    # Now inject them back into argTypes with disable: true
    if 'argTypes: {' in content:
        props_to_inject = [
            "\n        children: { table: { disable: true } },",
            "\n        onClick: { table: { disable: true } },"
        ]
        if not is_button:
            props_to_inject.append("\n        style: { table: { disable: true } },")
            
        content = content.replace("argTypes: {", "argTypes: {" + "".join(props_to_inject), 1)

    with open(filepath, 'w') as f:
        f.write(content)

for d in STORY_DIRS:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith('.stories.jsx'):
                process_file(os.path.join(root, file))

print("Completed argTypes safely")
