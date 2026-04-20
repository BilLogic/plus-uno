import os
import re

MDX_DIRS = ['design-system/src/forms', 'design-system/src/components']
FIGMA_LINK = "https://www.figma.com/design/zAecJNRdvJzAUOcjV32tRX/Design-System---BS4-Foundation--Component-LIbrary-?node-id=13265-5813&t=3xACkFLuqckLzOnT-1"

NEW_DESCRIPTIONS = {
    'Radio': 'Use radio when a user needs to select one option from a list.',
    'RadioButtonGroup': 'Use radio when a user needs to select one option from a list.',
    'Textarea': 'Use text area for multi-line text input form fields.',
    'TextareaVer2': 'Use text area for multi-line text input form fields.',
    'Select': 'Use a select input when a user needs to select one or multiple options from a long list.',
    'InputGroup': 'Easily extend form controls by adding text, check box, radio, or button on either side of textual inputs.',
    'Checkbox': 'Use checkbox when a user needs to select more than one option from a list.',
    'Switch': 'Use switch when a user needs to toggle between two states: on and off, true and false, enabled and disabled, etc.',
    'DatePicker': 'Use a date picker when a user needs to select a date or a date range.',
    'DateAndTimePicker': 'Date and time pickers let people select a date or range of dates and/or a time from a visual calendar and time list.',
    'Input': 'The labeled text input box allows users to enter textual inputs and receive validation feedback with messages.',
    'Modal': 'Add dialogs to your site for lightboxes, user notifications, or completely custom content.'
}

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    basename = os.path.basename(filepath)
    component_name = basename.replace('.mdx', '')
    
    if component_name not in NEW_DESCRIPTIONS:
        return

    desc_text = NEW_DESCRIPTIONS[component_name]

    # Find the title and the resources block to replace the text between them, OR replace <Description />
    if '<Description />' in content:
        content = content.replace('<Description />', f"{desc_text}")
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath} (replaced <Description />)")
    else:
        # It might already have ResourcesBlock and another text
        # Let's match from <Title /> to <ResourcesBlock
        match = re.search(r'<Title />\s*(.*?)\s*<ResourcesBlock', content, re.DOTALL)
        if match:
            existing_text = match.group(1).strip()
            if existing_text != desc_text:
                content = content.replace(f'<Title />\n{existing_text}\n', f'<Title />\n{desc_text}\n\n')
                with open(filepath, 'w') as f:
                    f.write(content)
                print(f"Updated {filepath} (replaced existing text)")

for d in MDX_DIRS:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith('.mdx'):
                process_file(os.path.join(root, file))
