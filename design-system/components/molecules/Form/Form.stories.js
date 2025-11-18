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
 * See docs/guidelines/terminology.md for Element Component Guidelines
 * See docs/guidelines/token-reference.md for Token Reference
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Form',
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
 * All Variants
 * Shows all form component types, sizes, and states
 */
export const AllVariants = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '48px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  
  // Textarea Section
  const textareaSection = document.createElement('div');
  const textareaLabel = document.createElement('h3');
  textareaLabel.textContent = 'Textarea';
  textareaLabel.style.marginBottom = '24px';
  textareaSection.appendChild(textareaLabel);
  
  const textareaContainer = document.createElement('div');
  textareaContainer.style.display = 'flex';
  textareaContainer.style.flexDirection = 'column';
  textareaContainer.style.gap = '24px';
  textareaContainer.style.maxWidth = '400px';
  
  // Textarea - Small
  const textareaSmall = PlusInterface.createTextarea({
    placeholder: 'Placeholder',
    size: 'small'
  });
  const textareaSmallLabel = document.createElement('div');
  textareaSmallLabel.className = 'body2-txt';
  textareaSmallLabel.textContent = 'Small - Placeholder';
  textareaSmallLabel.style.marginBottom = '8px';
  textareaContainer.appendChild(textareaSmallLabel);
  textareaContainer.appendChild(textareaSmall);
  
  // Textarea - Medium
  const textareaMedium = PlusInterface.createTextarea({
    placeholder: 'Placeholder',
    size: 'medium'
  });
  const textareaMediumLabel = document.createElement('div');
  textareaMediumLabel.className = 'body2-txt';
  textareaMediumLabel.textContent = 'Medium - Placeholder';
  textareaMediumLabel.style.marginBottom = '8px';
  textareaContainer.appendChild(textareaMediumLabel);
  textareaContainer.appendChild(textareaMedium);
  
  // Textarea - Large
  const textareaLarge = PlusInterface.createTextarea({
    placeholder: 'Placeholder',
    size: 'large'
  });
  const textareaLargeLabel = document.createElement('div');
  textareaLargeLabel.className = 'body2-txt';
  textareaLargeLabel.textContent = 'Large - Placeholder';
  textareaLargeLabel.style.marginBottom = '8px';
  textareaContainer.appendChild(textareaLargeLabel);
  textareaContainer.appendChild(textareaLarge);
  
  textareaSection.appendChild(textareaContainer);
  container.appendChild(textareaSection);
  
  // Select Section
  const selectSection = document.createElement('div');
  const selectLabel = document.createElement('h3');
  selectLabel.textContent = 'Select';
  selectLabel.style.marginBottom = '24px';
  selectSection.appendChild(selectLabel);
  
  const selectContainer = document.createElement('div');
  selectContainer.style.display = 'flex';
  selectContainer.style.flexDirection = 'column';
  selectContainer.style.gap = '24px';
  selectContainer.style.maxWidth = '400px';
  
  // Select - Small
  const selectSmall = PlusInterface.createSelect({
    placeholder: 'Select Form',
    size: 'small',
    options: []
  });
  const selectSmallLabel = document.createElement('div');
  selectSmallLabel.className = 'body2-txt';
  selectSmallLabel.textContent = 'Small - Placeholder';
  selectSmallLabel.style.marginBottom = '8px';
  selectContainer.appendChild(selectSmallLabel);
  selectContainer.appendChild(selectSmall);
  
  // Select - Medium
  const selectMedium = PlusInterface.createSelect({
    placeholder: 'Select Form',
    size: 'medium',
    options: []
  });
  const selectMediumLabel = document.createElement('div');
  selectMediumLabel.className = 'body2-txt';
  selectMediumLabel.textContent = 'Medium - Placeholder';
  selectMediumLabel.style.marginBottom = '8px';
  selectContainer.appendChild(selectMediumLabel);
  selectContainer.appendChild(selectMedium);
  
  // Select - Large
  const selectLarge = PlusInterface.createSelect({
    placeholder: 'Select Form',
    size: 'large',
    options: []
  });
  const selectLargeLabel = document.createElement('div');
  selectLargeLabel.className = 'body2-txt';
  selectLargeLabel.textContent = 'Large - Placeholder';
  selectLargeLabel.style.marginBottom = '8px';
  selectContainer.appendChild(selectLargeLabel);
  selectContainer.appendChild(selectLarge);
  
  selectSection.appendChild(selectContainer);
  container.appendChild(selectSection);
  
  // Range Input Section
  const rangeSection = document.createElement('div');
  const rangeLabel = document.createElement('h3');
  rangeLabel.textContent = 'Range Input';
  rangeLabel.style.marginBottom = '24px';
  rangeSection.appendChild(rangeLabel);
  
  const rangeContainer = document.createElement('div');
  rangeContainer.style.display = 'flex';
  rangeContainer.style.flexDirection = 'column';
  rangeContainer.style.gap = '24px';
  rangeContainer.style.maxWidth = '400px';
  
  // Range - Small
  const rangeSmall = PlusInterface.createRangeInput({
    size: 'small',
    value: 50
  });
  const rangeSmallLabel = document.createElement('div');
  rangeSmallLabel.className = 'body2-txt';
  rangeSmallLabel.textContent = 'Small';
  rangeSmallLabel.style.marginBottom = '8px';
  rangeContainer.appendChild(rangeSmallLabel);
  rangeContainer.appendChild(rangeSmall);
  
  // Range - Medium
  const rangeMedium = PlusInterface.createRangeInput({
    size: 'medium',
    value: 50
  });
  const rangeMediumLabel = document.createElement('div');
  rangeMediumLabel.className = 'body2-txt';
  rangeMediumLabel.textContent = 'Medium';
  rangeMediumLabel.style.marginBottom = '8px';
  rangeContainer.appendChild(rangeMediumLabel);
  rangeContainer.appendChild(rangeMedium);
  
  // Range - Large
  const rangeLarge = PlusInterface.createRangeInput({
    size: 'large',
    value: 50
  });
  const rangeLargeLabel = document.createElement('div');
  rangeLargeLabel.className = 'body2-txt';
  rangeLargeLabel.textContent = 'Large';
  rangeLargeLabel.style.marginBottom = '8px';
  rangeContainer.appendChild(rangeLargeLabel);
  rangeContainer.appendChild(rangeLarge);
  
  rangeSection.appendChild(rangeContainer);
  container.appendChild(rangeSection);
  
  // Select Multiple Section
  const selectMultipleSection = document.createElement('div');
  const selectMultipleLabel = document.createElement('h3');
  selectMultipleLabel.textContent = 'Select Multiple';
  selectMultipleLabel.style.marginBottom = '24px';
  selectMultipleSection.appendChild(selectMultipleLabel);
  
  const selectMultipleContainer = document.createElement('div');
  selectMultipleContainer.style.display = 'flex';
  selectMultipleContainer.style.flexDirection = 'column';
  selectMultipleContainer.style.gap = '24px';
  selectMultipleContainer.style.maxWidth = '400px';
  
  // Select Multiple - Small
  const selectMultipleSmall = PlusInterface.createSelectMultiple({
    size: 'small',
    options: [
      { value: 'form1', text: 'Form', selected: true },
      { value: 'form2', text: 'Form', selected: false },
      { value: 'form3', text: 'Form', selected: false }
    ]
  });
  const selectMultipleSmallLabel = document.createElement('div');
  selectMultipleSmallLabel.className = 'body2-txt';
  selectMultipleSmallLabel.textContent = 'Small';
  selectMultipleSmallLabel.style.marginBottom = '8px';
  selectMultipleContainer.appendChild(selectMultipleSmallLabel);
  selectMultipleContainer.appendChild(selectMultipleSmall);
  
  // Select Multiple - Medium
  const selectMultipleMedium = PlusInterface.createSelectMultiple({
    size: 'medium',
    options: [
      { value: 'form1', text: 'Form', selected: true },
      { value: 'form2', text: 'Form', selected: false },
      { value: 'form3', text: 'Form', selected: false }
    ]
  });
  const selectMultipleMediumLabel = document.createElement('div');
  selectMultipleMediumLabel.className = 'body2-txt';
  selectMultipleMediumLabel.textContent = 'Medium';
  selectMultipleMediumLabel.style.marginBottom = '8px';
  selectMultipleContainer.appendChild(selectMultipleMediumLabel);
  selectMultipleContainer.appendChild(selectMultipleMedium);
  
  // Select Multiple - Large
  const selectMultipleLarge = PlusInterface.createSelectMultiple({
    size: 'large',
    options: [
      { value: 'form1', text: 'Form', selected: true },
      { value: 'form2', text: 'Form', selected: false },
      { value: 'form3', text: 'Form', selected: false }
    ]
  });
  const selectMultipleLargeLabel = document.createElement('div');
  selectMultipleLargeLabel.className = 'body2-txt';
  selectMultipleLargeLabel.textContent = 'Large';
  selectMultipleLargeLabel.style.marginBottom = '8px';
  selectMultipleContainer.appendChild(selectMultipleLargeLabel);
  selectMultipleContainer.appendChild(selectMultipleLarge);
  
  selectMultipleSection.appendChild(selectMultipleContainer);
  container.appendChild(selectMultipleSection);
  
  return container;
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

