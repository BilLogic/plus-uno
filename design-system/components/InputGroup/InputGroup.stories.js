/**
 * Input Group Molecule Stories
 * 
 * ## Usage and Implementation
 * 
 * Input groups are **Element** components that extend form controls by adding text, buttons, checkboxes, radios, or icons
 * on either side of textual inputs. They allow you to add context, actions, or visual indicators to input fields.
 * 
 * ### When to Use
 * - **Text addons**: When you need to show prefixes or suffixes (e.g., currency symbols, units)
 * - **Checkbox addons**: When you need checkbox selection next to inputs
 * - **Radio addons**: When you need radio button selection next to inputs
 * - **Button addons**: When you need action buttons next to inputs (e.g., search, clear, submit)
 * - **Icon addons**: When you need visual indicators (e.g., search icon, calendar icon)
 * 
 * ### Implementation Context
 * - **Component Type**: Element (uses `element-*` tokens)
 * - **Bootstrap Framework**: Uses Bootstrap 4.6.2's `input-group` pattern
 * - **Token Usage**: 
 *   - Border: `--size-element-stroke-md` (1.5px)
 *   - Radius: `--size-element-radius-sm` (4px)
 *   - Padding: `--size-element-pad-x-md`, `--size-element-pad-y-md`
 *   - Colors: `--color-outline-variant` for borders, `--color-on-surface` for text
 *   - Typography: body1/body2/body3 classes based on size
 * 
 * See design-system/components/overview.md for Element Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/InputGroup',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Input groups extend form controls by adding text, checkboxes, radios, buttons, or icons on either side of inputs. Built on Bootstrap 4.6.2 input-group pattern with PLUS design token customizations.',
      },
    },
  },
};

/**
 * Overview
 * Shows all input group variants organized by category in a scrollable format
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    // Content Section
    const contentSection = document.createElement('div');
    contentSection.style.display = 'flex';
    contentSection.style.flexDirection = 'column';
    contentSection.style.gap = 'var(--size-card-gap-md)';
    
    const contentHeading = document.createElement('div');
    contentHeading.className = 'h5';
    contentHeading.textContent = 'Content';
    contentHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    contentSection.appendChild(contentHeading);
    
    const contentRow = document.createElement('div');
    contentRow.style.display = 'flex';
    contentRow.style.flexDirection = 'column';
    contentRow.style.gap = 'var(--size-element-gap-md)';
    
    // Text addon
    const textGroup = PlusInterface.createInputGroup({
      prepend: 'Text',
      input: { type: 'text', placeholder: 'Placeholder', id: 'overview-text' },
      size: 'default'
    });
    contentRow.appendChild(textGroup);
    
    // Button addon
    const button1 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default'
    });
    const buttonGroup = PlusInterface.createInputGroup({
      prepend: { type: 'button', button: button1 },
      input: { type: 'text', placeholder: 'Placeholder', id: 'overview-button' },
      size: 'default'
    });
    contentRow.appendChild(buttonGroup);
    
    contentSection.appendChild(contentRow);
    container.appendChild(contentSection);
    
    return container;
  },
};


/**
 * Interactive Input Group
 * Interactive playground for testing input group variations
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    let prependAddon = null;
    let appendAddon = null;
    
    // Create prepend addon based on type
    if (args.prependType === 'text') {
      prependAddon = args.prependText || 'Text';
    } else if (args.prependType === 'button') {
      const button = PlusInterface.createButton({
        btnText: args.prependButtonText || 'Button',
        btnStyle: args.prependButtonStyle || 'primary',
        btnFill: args.prependButtonFill || 'outline',
        btnSize: args.size || 'default'
      });
      prependAddon = { type: 'button', button: button };
    } else if (args.prependType === 'checkbox') {
      const checkbox = PlusInterface.createCheckbox({
        label: '',
        name: 'interactive-checkbox',
        value: '1',
        id: 'interactive-checkbox',
        checked: args.prependCheckboxChecked || false
      });
      prependAddon = { type: 'checkbox', checkbox: checkbox };
    } else if (args.prependType === 'radio') {
      const radio = PlusInterface.createRadio({
        label: '',
        name: 'interactive-radio',
        value: '1',
        id: 'interactive-radio',
        checked: args.prependRadioChecked || false
      });
      prependAddon = { type: 'radio', radio: radio };
    }
    
    // Create append addon based on type
    if (args.appendType === 'text') {
      appendAddon = args.appendText || 'Text';
    } else if (args.appendType === 'button') {
      const button = PlusInterface.createButton({
        btnText: args.appendButtonText || 'Button',
        btnStyle: args.appendButtonStyle || 'primary',
        btnFill: args.appendButtonFill || 'outline',
        btnSize: args.size || 'default'
      });
      appendAddon = { type: 'button', button: button };
    }
    
    const inputGroup = PlusInterface.createInputGroup({
      input: {
        type: args.inputType || 'text',
        placeholder: args.placeholder || 'Placeholder',
        id: args.inputId || 'interactive-input',
        value: args.inputValue || ''
      },
      prepend: prependAddon,
      append: appendAddon,
      size: args.size || 'default',
      id: args.id
    });
    
    container.appendChild(inputGroup);
    return container;
  },
  argTypes: {
    id: {
      control: 'text',
      description: 'Input group ID',
    },
    inputType: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
      description: 'Input type',
    },
    placeholder: {
      control: 'text',
      description: 'Input placeholder',
    },
    inputValue: {
      control: 'text',
      description: 'Input value',
    },
    inputId: {
      control: 'text',
      description: 'Input ID',
    },
    size: {
      control: 'select',
      options: ['small', 'default', 'large'],
      description: 'Input group size',
    },
    prependType: {
      control: 'select',
      options: ['none', 'text', 'button', 'checkbox', 'radio'],
      description: 'Prepend addon type',
    },
    prependText: {
      control: 'text',
      description: 'Prepend text',
      if: { arg: 'prependType', eq: 'text' },
    },
    prependButtonText: {
      control: 'text',
      description: 'Prepend button text',
      if: { arg: 'prependType', eq: 'button' },
    },
    prependButtonStyle: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'success', 'info', 'warning', 'error', 'default'],
      description: 'Prepend button style',
      if: { arg: 'prependType', eq: 'button' },
    },
    prependButtonFill: {
      control: 'select',
      options: ['filled', 'outline', 'tonal', 'text'],
      description: 'Prepend button fill',
      if: { arg: 'prependType', eq: 'button' },
    },
    prependCheckboxChecked: {
      control: 'boolean',
      description: 'Prepend checkbox checked',
      if: { arg: 'prependType', eq: 'checkbox' },
    },
    prependRadioChecked: {
      control: 'boolean',
      description: 'Prepend radio checked',
      if: { arg: 'prependType', eq: 'radio' },
    },
    appendType: {
      control: 'select',
      options: ['none', 'text', 'button'],
      description: 'Append addon type',
    },
    appendText: {
      control: 'text',
      description: 'Append text',
      if: { arg: 'appendType', eq: 'text' },
    },
    appendButtonText: {
      control: 'text',
      description: 'Append button text',
      if: { arg: 'appendType', eq: 'button' },
    },
    appendButtonStyle: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'success', 'info', 'warning', 'error', 'default'],
      description: 'Append button style',
      if: { arg: 'appendType', eq: 'button' },
    },
    appendButtonFill: {
      control: 'select',
      options: ['filled', 'outline', 'tonal', 'text'],
      description: 'Append button fill',
      if: { arg: 'appendType', eq: 'button' },
    },
  },
  args: {
    id: 'interactive-input-group',
    inputType: 'text',
    placeholder: 'Placeholder',
    inputValue: '',
    inputId: 'interactive-input',
    size: 'default',
    prependType: 'text',
    prependText: 'Text',
    prependButtonText: 'Button',
    prependButtonStyle: 'primary',
    prependButtonFill: 'outline',
    prependCheckboxChecked: false,
    prependRadioChecked: false,
    appendType: 'none',
    appendText: 'Text',
    appendButtonText: 'Button',
    appendButtonStyle: 'primary',
    appendButtonFill: 'outline',
  },
};
