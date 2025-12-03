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
 * Overview
 * Shows all input variants organized by category in a scrollable format
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.width = 'var(--size-card-pad-x-lg)';
    
    // Sizes Section
    const sizesSection = document.createElement('div');
    sizesSection.style.display = 'flex';
    sizesSection.style.flexDirection = 'column';
    sizesSection.style.gap = 'var(--size-card-gap-md)';
    
    const sizesHeading = document.createElement('div');
    sizesHeading.className = 'h5';
    sizesHeading.textContent = 'Sizes';
    sizesHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    sizesSection.appendChild(sizesHeading);
    
    const sizesRow = document.createElement('div');
    sizesRow.style.display = 'flex';
    sizesRow.style.flexDirection = 'column';
    sizesRow.style.gap = 'var(--size-card-gap-md)';
    
    ['body1-txt', 'body2-txt', 'body3-txt'].forEach((sizeClass) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.gap = 'var(--size-element-gap-xs)';
      
      const label = document.createElement('label');
      label.className = 'body3-txt';
      label.textContent = sizeClass === 'body1-txt' ? 'Body 1' : sizeClass === 'body2-txt' ? 'Body 2 (Default)' : 'Body 3';
      wrapper.appendChild(label);
      
      const input = document.createElement('input');
      input.type = 'text';
      input.className = `plus-text-field ${sizeClass}`;
      input.placeholder = `Input with ${sizeClass}`;
      wrapper.appendChild(input);
      
      sizesRow.appendChild(wrapper);
    });
    sizesSection.appendChild(sizesRow);
    container.appendChild(sizesSection);
    
    // Types Section
    const typesSection = document.createElement('div');
    typesSection.style.display = 'flex';
    typesSection.style.flexDirection = 'column';
    typesSection.style.gap = 'var(--size-card-gap-md)';
    
    const typesHeading = document.createElement('div');
    typesHeading.className = 'h5';
    typesHeading.textContent = 'Types';
    typesHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    typesSection.appendChild(typesHeading);
    
    const typesRow = document.createElement('div');
    typesRow.style.display = 'flex';
    typesRow.style.flexDirection = 'column';
    typesRow.style.gap = 'var(--size-card-gap-md)';
    
    // Text Input
    const textWrapper = document.createElement('div');
    textWrapper.style.display = 'flex';
    textWrapper.style.flexDirection = 'column';
    textWrapper.style.gap = 'var(--size-element-gap-xs)';
    const textLabel = document.createElement('label');
    textLabel.className = 'body3-txt';
    textLabel.textContent = 'Text Input';
    textWrapper.appendChild(textLabel);
    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.className = 'plus-text-field body2-txt';
    textInput.placeholder = 'Enter text...';
    textWrapper.appendChild(textInput);
    typesRow.appendChild(textWrapper);
    
    // Textarea
    const textareaWrapper = document.createElement('div');
    textareaWrapper.style.display = 'flex';
    textareaWrapper.style.flexDirection = 'column';
    textareaWrapper.style.gap = 'var(--size-element-gap-xs)';
    const textareaLabel = document.createElement('label');
    textareaLabel.className = 'body3-txt';
    textareaLabel.textContent = 'Textarea';
    textareaWrapper.appendChild(textareaLabel);
    const textarea = document.createElement('textarea');
    textarea.className = 'plus-textarea body2-txt';
    textarea.placeholder = 'Enter text...';
    textarea.rows = 4;
    textareaWrapper.appendChild(textarea);
    typesRow.appendChild(textareaWrapper);
    
    typesSection.appendChild(typesRow);
    container.appendChild(typesSection);
    
    // States Section
    const statesSection = document.createElement('div');
    statesSection.style.display = 'flex';
    statesSection.style.flexDirection = 'column';
    statesSection.style.gap = 'var(--size-card-gap-md)';
    
    const statesHeading = document.createElement('div');
    statesHeading.className = 'h5';
    statesHeading.textContent = 'States';
    statesHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    statesSection.appendChild(statesHeading);
    
    const statesRow = document.createElement('div');
    statesRow.style.display = 'flex';
    statesRow.style.flexDirection = 'column';
    statesRow.style.gap = 'var(--size-card-gap-md)';
    
    // Default
    const defaultWrapper = document.createElement('div');
    defaultWrapper.style.display = 'flex';
    defaultWrapper.style.flexDirection = 'column';
    defaultWrapper.style.gap = 'var(--size-element-gap-xs)';
    const defaultLabel = document.createElement('label');
    defaultLabel.className = 'body3-txt';
    defaultLabel.textContent = 'Default';
    defaultWrapper.appendChild(defaultLabel);
    const defaultInput = document.createElement('input');
    defaultInput.type = 'text';
    defaultInput.className = 'plus-text-field body2-txt';
    defaultInput.placeholder = 'Enter text...';
    defaultWrapper.appendChild(defaultInput);
    statesRow.appendChild(defaultWrapper);
    
    // With Value
    const valueWrapper = document.createElement('div');
    valueWrapper.style.display = 'flex';
    valueWrapper.style.flexDirection = 'column';
    valueWrapper.style.gap = 'var(--size-element-gap-xs)';
    const valueLabel = document.createElement('label');
    valueLabel.className = 'body3-txt';
    valueLabel.textContent = 'With Value';
    valueWrapper.appendChild(valueLabel);
    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.className = 'plus-text-field body2-txt';
    valueInput.value = 'Sample text';
    valueWrapper.appendChild(valueInput);
    statesRow.appendChild(valueWrapper);
    
    // Disabled
    const disabledWrapper = document.createElement('div');
    disabledWrapper.style.display = 'flex';
    disabledWrapper.style.flexDirection = 'column';
    disabledWrapper.style.gap = 'var(--size-element-gap-xs)';
    const disabledLabel = document.createElement('label');
    disabledLabel.className = 'body3-txt';
    disabledLabel.textContent = 'Disabled';
    disabledWrapper.appendChild(disabledLabel);
    const disabledInput = document.createElement('input');
    disabledInput.type = 'text';
    disabledInput.className = 'plus-text-field body2-txt';
    disabledInput.placeholder = 'Enter text...';
    disabledInput.disabled = true;
    disabledWrapper.appendChild(disabledInput);
    statesRow.appendChild(disabledWrapper);
    
    statesSection.appendChild(statesRow);
    container.appendChild(statesSection);
    
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
