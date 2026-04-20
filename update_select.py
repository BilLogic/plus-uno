import re

filepath = 'design-system/src/forms/Select.stories.jsx'
with open(filepath, 'r') as f:
    content = f.read()

# Replace: <div className="body2-txt" style={{ marginBottom: 8, color: 'var(--color-on-surface-variant)' }}>TEXT</div>
# With:    <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">TEXT</span>

pattern = r'<div className="body2-txt" style={{ marginBottom: 8, color: \'var\(--color-on-surface-variant\)\' }}>(.*?)</div>'
replacement = r'<span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">\1</span>'

new_content = re.sub(pattern, replacement, content)

with open(filepath, 'w') as f:
    f.write(new_content)

print("Updated Select.stories.jsx")
