/**
 * Form Component Stories
 * 
 * ## Usage and Implementation
 * 
 * Form components are used to collect user input through various input types.
 * They support textarea, select, and range input elements with different sizes and states.
 * 
 * ### When to Use
 * - **Textarea**: For multi-line text input
 * - **Select**: For single selection from a list of options
 * - **Range Input**: For selecting a value from a range (slider)
 * 
 * ### Implementation Context
 * - **Component Type**: Element (uses `element-*` tokens)
 * - **Token Usage**: 
 *   - Spacing: Uses `element-*` tokens for padding and gaps
 *   - Colors: Uses semantic color tokens
 *   - Typography: Uses Body/B1/B2/B3 based on size
 * 
 * ### Sizes
 * - **small**: 12px text (B3), smaller padding
 * - **medium**: 14px text (B2), default padding
 * - **large**: 16px text (B1), larger padding
 * 
 * ### States
 * - **default**: Normal state with placeholder or value
 * - **focus**: Focused state with primary border
 * - **read-only**: Read-only state with surface-variant background
 * - **disabled**: Disabled state with reduced opacity
 * 
 * See design-system/components/overview.md for Element Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Form',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Form components for collecting user input. Includes textarea, select, and range input elements with various sizes and states.',
      },
    },
  },
};

/**
 * Overview
 * Overview of all form components
 * See Size Variants, States, and Content Variants for detailed examples
 */
export const Overview = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '48px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  
  const info = document.createElement('div');
  info.className = 'body2-txt';
  info.textContent = 'Form components include textarea, select, range input, and select multiple. See the subcategories for detailed variants:';
  info.style.marginBottom = '24px';
  container.appendChild(info);
  
  const list = document.createElement('ul');
  list.style.paddingLeft = '24px';
  list.style.marginBottom = '24px';
  
  const items = [
    'Size Variants - All sizes (small, medium, large)',
    'States - Default, with value, read-only, disabled',
    'Content Variants - Options, multiple rows, custom ranges',
    'Textarea Variants - All textarea-specific variations'
  ];
  
  items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'body2-txt';
    li.textContent = item;
    list.appendChild(li);
  });
  
  container.appendChild(list);
  
  return container;
};

/**
 * All Variants
 * Shows all form component types: textarea, select, range input, and select multiple
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.maxWidth = '400px';
    
    // Textarea section
    const textareaLabel = document.createElement('div');
    textareaLabel.className = 'h6';
    textareaLabel.textContent = 'Textarea';
    textareaLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(textareaLabel);
    
    const textarea = PlusInterface.createTextarea({
      placeholder: 'Placeholder',
      size: 'medium',
      rows: 3
    });
    container.appendChild(textarea);
    
    // Select section
    const selectLabel = document.createElement('div');
    selectLabel.className = 'h6';
    selectLabel.textContent = 'Select';
    selectLabel.style.marginTop = 'var(--size-section-gap-md)';
    selectLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(selectLabel);
    
    const select = PlusInterface.createSelect({
      options: [
        { value: '', text: 'Choose...' },
        { value: '1', text: 'Option 1' },
        { value: '2', text: 'Option 2' },
        { value: '3', text: 'Option 3' }
      ],
      size: 'medium'
    });
    container.appendChild(select);
    
    // Range Input section
    const rangeLabel = document.createElement('div');
    rangeLabel.className = 'h6';
    rangeLabel.textContent = 'Range Input';
    rangeLabel.style.marginTop = 'var(--size-section-gap-md)';
    rangeLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(rangeLabel);
    
    const range = PlusInterface.createRangeInput({
      min: 0,
      max: 100,
      value: 50,
      size: 'medium'
    });
    container.appendChild(range);
    
    // Select Multiple section
    const selectMultipleLabel = document.createElement('div');
    selectMultipleLabel.className = 'h6';
    selectMultipleLabel.textContent = 'Select Multiple';
    selectMultipleLabel.style.marginTop = 'var(--size-section-gap-md)';
    selectMultipleLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(selectMultipleLabel);
    
    const selectMultiple = PlusInterface.createSelectMultiple({
      options: [
        { value: '1', text: 'Option 1' },
        { value: '2', text: 'Option 2' },
        { value: '3', text: 'Option 3' }
      ],
      size: 'medium'
    });
    container.appendChild(selectMultiple);
    
    return container;
  },
};

/**
 * Interactive
 * Interactive playground with Storybook controls
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.maxWidth = '400px';
    
    let component;
    if (args.type === 'textarea') {
      component = PlusInterface.createTextarea({
        placeholder: args.placeholder,
        value: args.value,
        size: args.size,
        readonly: args.readonly,
        disabled: args.disabled
      });
    } else if (args.type === 'select') {
      component = PlusInterface.createSelect({
        placeholder: args.placeholder,
        size: args.size,
        readonly: args.readonly,
        disabled: args.disabled,
        options: args.options || []
      });
    } else if (args.type === 'range') {
      component = PlusInterface.createRangeInput({
        size: args.size,
        value: args.value,
        min: args.min,
        max: args.max,
        disabled: args.disabled
      });
    } else if (args.type === 'selectMultiple') {
      component = PlusInterface.createSelectMultiple({
        size: args.size,
        disabled: args.disabled,
        options: args.options || [
          { value: 'option1', text: 'Form', selected: true },
          { value: 'option2', text: 'Form', selected: false },
          { value: 'option3', text: 'Form', selected: false }
        ]
      });
    }
    
    container.appendChild(component);
    return container;
  },
  args: {
    type: 'textarea',
    size: 'medium',
    placeholder: 'Placeholder',
    value: '',
    readonly: false,
    disabled: false,
    min: 0,
    max: 100
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['textarea', 'select', 'range', 'selectMultiple'],
      description: 'Form component type'
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Component size'
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text'
    },
    value: {
      control: 'text',
      description: 'Initial value (for textarea/select)'
    },
    readonly: {
      control: 'boolean',
      description: 'Read-only state'
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state'
    },
    min: {
      control: 'number',
      description: 'Minimum value (for range)'
    },
    max: {
      control: 'number',
      description: 'Maximum value (for range)'
    }
  }
};

