/**
 * Input Atom Stories
 * 
 * ## Usage and Implementation
 * 
 * Inputs are **Element** components used for collecting user text input in forms and interfaces.
 * They include text fields for single-line input and textareas for multi-line input.
 * 
 * ### When to Use
 * - **Text fields**: For single-line text input (names, emails, search queries, etc.)
 * - **Textareas**: For multi-line text input (comments, descriptions, notes, etc.)
 * - **Forms**: As primary form input elements
 * - **Search**: For search input fields
 * - **Data entry**: For any text-based data collection
 * 
 * ### Implementation Context
 * - **Component Type**: Element (uses `element-` tokens)
 * - **Token Usage**: 
 *   - Padding: `--size-element-pad-x-sm/md/lg`, `--size-element-pad-y-sm/md/lg`
 *   - Gap: `--size-element-gap-xs` (reserved for label-to-input spacing only)
 *   - Radius: `--size-border-radius-radius-50` (small rounded corners)
 *   - Border: `--size-element-border` (1px border)
 *   - Colors: `--color-outline-variant` for borders, `--color-on-surface` for text
 *   - Typography: Uses body typography scales (body1, body2, body3)
 * 
 * ### Type Variants
 * - **Text Input**: Single-line text field for standard input
 * - **Textarea**: Multi-line text area for longer content
 * 
 * ### Size Variants
 * Inputs use typography scales for sizing:
 * - **Body 1**: Larger text for prominent inputs or accessibility
 * - **Body 2**: Default size for most use cases
 * - **Body 3**: Smaller text for compact interfaces or secondary inputs
 * 
 * ### State Variants
 * - **Default**: Empty input ready for user entry
 * - **With Value**: Input containing user-entered text
 * - **Disabled**: Non-interactive input (read-only or unavailable)
 * - **Disabled with Value**: Read-only input showing existing value
 * 
 * ### Best Practices
 * - Always include labels above inputs (use `element-gap-xs` for spacing)
 * - Use appropriate typography size based on context
 * - Provide clear placeholder text when helpful
 * - Use disabled state for read-only or unavailable inputs
 * - Ensure sufficient contrast for accessibility
 * - Match input size to surrounding text hierarchy
 * - Use textareas for content longer than one line
 * 
 * See docs/guidelines/terminology.md for Element Component Guidelines
 * See docs/guidelines/token-reference.md for Token Reference
 */

export default {
  title: 'Components/Input',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Input components for collecting user text input. Includes text fields and textareas with multiple sizes and states. Uses element-level tokens and body typography scales.',
      },
    },
  },
};

/**
 * All Variants
 * Shows all input combinations organized by type: each type shows all sizes and states
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.width = 'var(--size-card-pad-x-lg)';
    
    const sizes = [
      { class: 'body1-txt', label: 'Body 1' },
      { class: 'body2-txt', label: 'Body 2 (Default)' },
      { class: 'body3-txt', label: 'Body 3' },
    ];
    
    // Text Input - All Sizes
    const textInputSection = document.createElement('div');
    textInputSection.style.display = 'flex';
    textInputSection.style.flexDirection = 'column';
    textInputSection.style.gap = 'var(--size-card-gap-md)';
    
    const textInputLabel = document.createElement('div');
    textInputLabel.className = 'h6';
    textInputLabel.textContent = 'Text Input - All Sizes';
    textInputLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    textInputSection.appendChild(textInputLabel);
    
    sizes.forEach((size) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.gap = 'var(--size-element-gap-xs)';
      
      const label = document.createElement('label');
      label.className = 'body3-txt';
      label.textContent = size.label;
      wrapper.appendChild(label);
      
      const input = document.createElement('input');
      input.type = 'text';
      input.className = `plus-text-field ${size.class}`;
      input.placeholder = `Input with ${size.label} size`;
      wrapper.appendChild(input);
      
      textInputSection.appendChild(wrapper);
    });
    container.appendChild(textInputSection);
    
    // Textarea - All Sizes
    const textareaSection = document.createElement('div');
    textareaSection.style.display = 'flex';
    textareaSection.style.flexDirection = 'column';
    textareaSection.style.gap = 'var(--size-card-gap-md)';
    
    const textareaLabel = document.createElement('div');
    textareaLabel.className = 'h6';
    textareaLabel.textContent = 'Textarea - All Sizes';
    textareaLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    textareaSection.appendChild(textareaLabel);
    
    sizes.forEach((size) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.gap = 'var(--size-element-gap-xs)';
      
      const label = document.createElement('label');
      label.className = 'body3-txt';
      label.textContent = size.label;
      wrapper.appendChild(label);
      
      const textarea = document.createElement('textarea');
      textarea.className = `plus-textarea ${size.class}`;
      textarea.placeholder = `Textarea with ${size.label} size`;
      textarea.rows = 4;
      wrapper.appendChild(textarea);
      
      textareaSection.appendChild(wrapper);
    });
    container.appendChild(textareaSection);
    
    return container;
  },
};

/**
 * Interactive Input
 * Interactive playground for testing input variations
 */
export const Interactive = {
  render: (args) => {
    if (args.type === 'textarea') {
      const textarea = document.createElement('textarea');
      textarea.className = `plus-textarea ${args.size || 'body2-txt'}`;
      textarea.placeholder = args.placeholder || 'Enter text...';
      textarea.value = args.value || '';
      textarea.disabled = args.disabled || false;
      textarea.rows = 4;
      return textarea;
    } else {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = `plus-text-field ${args.size || 'body2-txt'}`;
      input.placeholder = args.placeholder || 'Enter text...';
      input.value = args.value || '';
      input.disabled = args.disabled || false;
      return input;
    }
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'textarea'],
      description: 'Input type',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    value: {
      control: 'text',
      description: 'Input value',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    size: {
      control: 'select',
      options: ['body1-txt', 'body2-txt', 'body3-txt'],
      description: 'Input size class',
    },
  },
  args: {
    type: 'text',
    placeholder: 'Enter text...',
    value: '',
    disabled: false,
    size: 'body2-txt',
  },
};
