/**
 * Radio Molecule Stories
 * 
 * ## Usage and Implementation
 * 
 * Radio buttons are **Element** components used for selecting a single option from a set of mutually exclusive options.
 * They allow users to make one selection from multiple choices and are commonly used in forms.
 * 
 * ### When to Use
 * - **Single selection**: When users can select only one option from a set of mutually exclusive options
 * - **Form inputs**: For form fields requiring single choice answers (e.g., "Select your preferred contact method")
 * - **Settings**: For selecting one option from multiple settings (e.g., "Choose notification frequency")
 * - **Preferences**: For user preference selection where only one option applies
 * - **Mutually exclusive options**: When options cannot be selected together (e.g., "Select payment method")
 * - **Small option sets**: When there are 2-5 options that are all visible and important
 * - **Required choices**: When a selection is required and all options should be visible
 * 
 * ### When NOT to Use
 * - **Multiple selections**: Use checkboxes when multiple selections are allowed
 * - **Toggle on/off**: Use switches for binary on/off states that take effect immediately
 * - **Many options**: Use dropdowns when there are many options (>5) or limited space
 * - **Optional single choice**: Consider using a dropdown if the selection is optional and space is limited
 * 
 * ### Implementation Context
 * - **Component Type**: Element
 * - **Bootstrap Framework**: Uses Bootstrap 4.6.2's `form-check` pattern
 * - **Styling**: Currently uses Bootstrap's default styling (no custom overrides)
 * - **Reference**: https://getbootstrap.com/docs/4.6/components/forms/#radios
 * 
 * ### State Variants
 * - **Checked**: Selected state (radio is selected)
 * - **Unchecked**: Unselected state (default)
 * - **Disabled**: Non-interactive state (read-only or unavailable)
 * - **Focus**: Focused state with focus ring (keyboard navigation)
 * 
 * ### Content Variants
 * - **Single radio**: Standalone radio with label
 * - **Radio group**: Multiple related radios grouped together (same name attribute)
 * - **Multiple groups**: Several radio groups for different categories
 * 
 * ### Best Practices
 * - Always include clear, descriptive labels
 * - Use radio groups for related options (same name attribute)
 * - Provide clear visual feedback for checked/unchecked states
 * - Use disabled state for unavailable options
 * - Group related radios together logically
 * - Ensure sufficient spacing between groups
 * - Use consistent sizing within a form or section
 * - Always provide a default selection when appropriate
 * 
 * See design-system/components/overview.md for Element Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Radio',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Radio button component for selecting a single option from a set. Built on Bootstrap 4.6.2 form-check pattern. Currently uses Bootstrap default styling.',
      },
    },
  },
};

/**
 * All Variants
 * Shows all radio combinations: states and content variants
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    // States
    const statesSection = document.createElement('div');
    statesSection.style.display = 'flex';
    statesSection.style.flexDirection = 'column';
    statesSection.style.gap = 'var(--size-element-gap-sm)';
    
    const statesLabel = document.createElement('div');
    statesLabel.className = 'h6';
    statesLabel.textContent = 'States';
    statesLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    statesSection.appendChild(statesLabel);
    
    const checked = PlusInterface.createRadio({
      label: 'Selected radio',
      name: 'radio-group-1',
      value: 'option1',
      id: 'radio-checked',
      checked: true,
    });
    statesSection.appendChild(checked);
    
    const unchecked = PlusInterface.createRadio({
      label: 'Unselected radio',
      name: 'radio-group-1',
      value: 'option2',
      id: 'radio-unchecked',
      checked: false,
    });
    statesSection.appendChild(unchecked);
    
    const disabled = PlusInterface.createRadio({
      label: 'Disabled radio',
      name: 'radio-group-1',
      value: 'option3',
      id: 'radio-disabled',
      disabled: true,
    });
    statesSection.appendChild(disabled);
    
    const focused = PlusInterface.createRadio({
      label: 'Focused radio',
      name: 'radio-group-1',
      value: 'option4',
      id: 'radio-focused',
      checked: false,
    });
    // Programmatically focus the input after it's added to DOM
    setTimeout(() => {
      const input = focused.querySelector('.plus-radio');
      if (input) {
        input.focus();
      }
    }, 0);
    statesSection.appendChild(focused);
    
    const focusedChecked = PlusInterface.createRadio({
      label: 'Focused selected radio',
      name: 'radio-group-1',
      value: 'option5',
      id: 'radio-focused-checked',
      checked: true,
    });
    // Programmatically focus the input after it's added to DOM
    setTimeout(() => {
      const input = focusedChecked.querySelector('.plus-radio');
      if (input) {
        input.focus();
      }
    }, 0);
    statesSection.appendChild(focusedChecked);
    
    container.appendChild(statesSection);
    
    // Radio Group
    const groupSection = document.createElement('div');
    groupSection.style.display = 'flex';
    groupSection.style.flexDirection = 'column';
    groupSection.style.gap = 'var(--size-element-gap-sm)';
    
    const groupLabel = document.createElement('div');
    groupLabel.className = 'h6';
    groupLabel.textContent = 'Radio Group';
    groupLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    groupSection.appendChild(groupLabel);
    
    const options = [
      { label: 'Option 1', value: 'opt1', id: 'radio-group-opt1', checked: true },
      { label: 'Option 2', value: 'opt2', id: 'radio-group-opt2', checked: false },
      { label: 'Option 3', value: 'opt3', id: 'radio-group-opt3', checked: false },
    ];
    
    const radioGroup = PlusInterface.createRadioGroup(options, 'radio-group-2');
    radioGroup.forEach(radio => groupSection.appendChild(radio));
    
    container.appendChild(groupSection);
    
    return container;
  },
};

/**
 * Interactive Radio
 * Interactive playground for testing radio variations
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    const radio = PlusInterface.createRadio(args);
    container.appendChild(radio);
    return container;
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Radio label',
    },
    name: {
      control: 'text',
      description: 'Input name attribute (required for radio groups)',
    },
    value: {
      control: 'text',
      description: 'Input value attribute',
    },
    checked: {
      control: 'boolean',
      description: 'Checked state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
  },
  args: {
    label: 'Interactive radio',
    name: 'interactive',
    value: 'value',
    id: 'radio-interactive',
    checked: false,
    disabled: false,
  },
};

