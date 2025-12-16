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
 * Shows all form component variants organized by element type in a scrollable format
 * Form components are organized by type: FormInput, Textarea, Select, and RangeInput
 * Each type has its own folder with Sizes, States, and Content (where applicable) categories
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.maxWidth = '400px';
    
    // Form Input Section
    const formInputSection = document.createElement('div');
    formInputSection.style.display = 'flex';
    formInputSection.style.flexDirection = 'column';
    formInputSection.style.gap = 'var(--size-card-gap-md)';
    
    const formInputHeading = document.createElement('div');
    formInputHeading.className = 'h5';
    formInputHeading.textContent = 'Form Input';
    formInputHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    formInputSection.appendChild(formInputHeading);
    
    const formInput = document.createElement('input');
    formInput.type = 'text';
    formInput.className = 'plus-text-field body2-txt';
    formInput.placeholder = 'Placeholder';
    formInputSection.appendChild(formInput);
    container.appendChild(formInputSection);
    
    // Textarea Section
    const textareaSection = document.createElement('div');
    textareaSection.style.display = 'flex';
    textareaSection.style.flexDirection = 'column';
    textareaSection.style.gap = 'var(--size-card-gap-md)';
    
    const textareaHeading = document.createElement('div');
    textareaHeading.className = 'h5';
    textareaHeading.textContent = 'Textarea';
    textareaHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    textareaSection.appendChild(textareaHeading);
    
    const textarea = PlusInterface.createTextarea({
      placeholder: 'Placeholder',
      size: 'medium',
      rows: 3
    });
    textareaSection.appendChild(textarea);
    container.appendChild(textareaSection);
    
    // Select Section
    const selectSection = document.createElement('div');
    selectSection.style.display = 'flex';
    selectSection.style.flexDirection = 'column';
    selectSection.style.gap = 'var(--size-card-gap-md)';
    
    const selectHeading = document.createElement('div');
    selectHeading.className = 'h5';
    selectHeading.textContent = 'Select';
    selectHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    selectSection.appendChild(selectHeading);
    
    const select = PlusInterface.createSelect({
      options: [
        { value: '', text: 'Choose...' },
        { value: '1', text: 'Option 1' },
        { value: '2', text: 'Option 2' },
        { value: '3', text: 'Option 3' }
      ],
      size: 'medium'
    });
    selectSection.appendChild(select);
    container.appendChild(selectSection);
    
    // Range Input Section
    const rangeSection = document.createElement('div');
    rangeSection.style.display = 'flex';
    rangeSection.style.flexDirection = 'column';
    rangeSection.style.gap = 'var(--size-card-gap-md)';
    
    const rangeHeading = document.createElement('div');
    rangeHeading.className = 'h5';
    rangeHeading.textContent = 'Range Input';
    rangeHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    rangeSection.appendChild(rangeHeading);
    
    const range = PlusInterface.createRangeInput({
      min: 0,
      max: 100,
      value: 50,
      size: 'medium'
    });
    rangeSection.appendChild(range);
    container.appendChild(rangeSection);
    
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

