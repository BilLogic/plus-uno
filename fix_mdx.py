import os
import re

MDX_DIRS = ['design-system/src/components', 'design-system/src/forms']
FIGMA_LINK = "https://www.figma.com/design/zAecJNRdvJzAUOcjV32tRX/Design-System---BS4-Foundation--Component-LIbrary-?node-id=13265-5813&t=3xACkFLuqckLzOnT-1"

DESCRIPTIONS = {
    'Accordion': 'Build vertically collapsing containers in combination with our Collapse JavaScript plugin.',
    'Alert': 'Provide contextual feedback messages for typical user actions with the handful of available and flexible alert messages.',
    'Badge': 'Static visual identifiers used to categorize or describe elements. They are used for displaying the status, type, or other relevant information about an element.',
    'Breadcrumb': "Use breadcrumbs to show navigational context on pages that are many levels deep in a site's hierarchy.",
    'Button': 'Buttons are interactive elements that are used to perform actions on a page.',
    'ButtonGroup': 'Buttons can be grouped together as individual segments of related actions.',
    'Card': 'A card is a flexible and extensible content container. Cards support a wide variety of content, including images, text, list groups, links, and more.',
    'Carousel': 'A slideshow component for cycling through elements—images or slides of text—like a carousel.',
    'Collapse': 'The collapse JavaScript plugin is used to show and hide content. Buttons or anchors are used as triggers that are mapped to specific elements you toggle.',
    'Dropdown': 'Toggle contextual overlays for displaying lists of links and more with the Bootstrap dropdown plugin.',
    'FormLayout': 'Flexible and responsive layout options for form inputs using the Bootstrap grid system.',
    'InputGroup': 'Easily extend form controls by adding text, buttons, or button groups on either side of textual inputs, custom selects, and custom file inputs.',
    'Checkbox': 'Checkbox and radio button controls for single and multiple selections. Use checkbox when a user needs to select more than one option from a list, and radio when they need to select only one.',
    'Radio': 'Checkbox and radio button controls for single and multiple selections. Use checkbox when a user needs to select more than one option from a list, and radio when they need to select only one.',
    'MultipleChoice': 'The multiple choice component can be used in forms where the user is required to select one or more options.',
    'FileUpload': 'The file upload component is used to select and upload files from a local device.',
    'DatePicker': 'Date and time pickers let people select a date or range of dates and/or a time from a visual calendar and time list.',
    'DateAndTimePicker': 'Date and time pickers let people select a date or range of dates and/or a time from a visual calendar and time list.'
}

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Get component name from filename
    basename = os.path.basename(filepath)
    component_name = basename.replace('.mdx', '')

    modifications = False

    # Ensure ResourcesBlock is imported
    if 'ResourcesBlock' not in content and '@/storybook-docs/ds-docs-layout.jsx' in content:
        content = re.sub(r'(import \{[^}]*)( \})( from \'@/storybook-docs/ds-docs-layout\.jsx\';)', 
                         r'\1, ResourcesBlock\2\3', content)
        modifications = True
    elif 'ResourcesBlock' not in content:
        content = re.sub(r'import \{ Meta, Title, Description, Canvas \} from \'@storybook/addon-docs/blocks\';',
                         r"import { Meta, Title, Description, Canvas } from '@storybook/addon-docs/blocks';\nimport { ResourcesBlock } from '@/storybook-docs/ds-docs-layout.jsx';", content)
        modifications = True

    # If <Description /> is present, replace it with canonical text and ResourcesBlock
    # Or if <ResourcesBlock... is missing, insert it.
    
    resource_block_str = f"""
<ResourcesBlock 
    figmaLink="{FIGMA_LINK}"
    githubLink="#"
/>
"""

    if '<Description />' in content:
        desc_text = DESCRIPTIONS.get(component_name, '')
        replacement = f"{desc_text}\n{resource_block_str}" if desc_text else resource_block_str
        content = content.replace('<Description />', replacement)
        modifications = True
    elif '<ResourcesBlock' not in content:
        # Try to find <Title /> and insert after
        content = content.replace('<Title />', f'<Title />\n{resource_block_str}')
        modifications = True

    if modifications:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

for d in MDX_DIRS:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith('.mdx'):
                process_file(os.path.join(root, file))

