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
 * All Variants
 * Shows all input group types: Text, Checkbox, Radio, and Button addons
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    // Text Section
    const textLabel = document.createElement('div');
    textLabel.className = 'h6';
    textLabel.textContent = 'Input Group Text';
    textLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(textLabel);
    
    const textRow = document.createElement('div');
    textRow.style.display = 'flex';
    textRow.style.flexWrap = 'wrap';
    textRow.style.gap = 'var(--size-element-gap-md)';
    textRow.style.alignItems = 'center';
    
    const textPrepend = PlusInterface.createInputGroup({
      prepend: 'Text',
      input: { type: 'text', placeholder: 'Placeholder', id: 'all-text-1' },
      size: 'default'
    });
    textRow.appendChild(textPrepend);
    container.appendChild(textRow);
    
    // Checkbox Section
    const checkboxLabel = document.createElement('div');
    checkboxLabel.className = 'h6';
    checkboxLabel.textContent = 'Input Group Checkbox';
    checkboxLabel.style.marginTop = 'var(--size-section-gap-md)';
    checkboxLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(checkboxLabel);
    
    const checkboxRow = document.createElement('div');
    checkboxRow.style.display = 'flex';
    checkboxRow.style.flexWrap = 'wrap';
    checkboxRow.style.gap = 'var(--size-element-gap-md)';
    checkboxRow.style.alignItems = 'center';
    
    const checkedCheckbox = PlusInterface.createCheckbox({
      label: '',
      name: 'all-checkbox-1',
      value: '1',
      id: 'all-checkbox-checked',
      checked: true
    });
    const checkedGroup = PlusInterface.createInputGroup({
      prepend: { type: 'checkbox', checkbox: checkedCheckbox },
      input: { type: 'text', placeholder: 'Placeholder', id: 'all-input-checked' },
      size: 'default'
    });
    checkboxRow.appendChild(checkedGroup);
    container.appendChild(checkboxRow);
    
    // Radio Section
    const radioLabel = document.createElement('div');
    radioLabel.className = 'h6';
    radioLabel.textContent = 'Input Group Radio';
    radioLabel.style.marginTop = 'var(--size-section-gap-md)';
    radioLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(radioLabel);
    
    const radioRow = document.createElement('div');
    radioRow.style.display = 'flex';
    radioRow.style.flexWrap = 'wrap';
    radioRow.style.gap = 'var(--size-element-gap-md)';
    radioRow.style.alignItems = 'center';
    
    const selectedRadio = PlusInterface.createRadio({
      label: '',
      name: 'all-radio-group',
      value: '1',
      id: 'all-radio-selected',
      checked: true
    });
    const selectedGroup = PlusInterface.createInputGroup({
      prepend: { type: 'radio', radio: selectedRadio },
      input: { type: 'text', placeholder: 'Placeholder', id: 'all-input-selected' },
      size: 'default'
    });
    radioRow.appendChild(selectedGroup);
    container.appendChild(radioRow);
    
    // Button Section
    const buttonLabel = document.createElement('div');
    buttonLabel.className = 'h6';
    buttonLabel.textContent = 'Input Group Button';
    buttonLabel.style.marginTop = 'var(--size-section-gap-md)';
    buttonLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(buttonLabel);
    
    const buttonRow = document.createElement('div');
    buttonRow.style.display = 'flex';
    buttonRow.style.flexWrap = 'wrap';
    buttonRow.style.gap = 'var(--size-element-gap-md)';
    buttonRow.style.alignItems = 'center';
    
    const button1 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default'
    });
    const buttonGroup = PlusInterface.createInputGroup({
      prepend: { type: 'button', button: button1 },
      input: { type: 'text', placeholder: 'Placeholder', id: 'all-input-button' },
      size: 'default'
    });
    buttonRow.appendChild(buttonGroup);
    container.appendChild(buttonRow);
    
    return container;
  },
};

/**
 * Input Group Text
 * Text addons (prefixes and suffixes) for input fields
 * Based on Figma Design System specifications - exact layout match
 */
export const InputGroupText = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    // Row 1: Single text prepend + input
    const row1 = PlusInterface.createInputGroup({
      prepend: 'Text',
      input: { type: 'text', placeholder: 'Placeholder', id: 'text-prepend-1' },
      size: 'default'
    });
    container.appendChild(row1);
    
    // Row 2: Two text prepends + input
    const row2 = PlusInterface.createInputGroup({
      prepend: ['Text', 'Text'],
      input: { type: 'text', placeholder: 'Placeholder', id: 'text-prepend-2' },
      size: 'default'
    });
    container.appendChild(row2);
    
    // Row 3: Input + single text append
    const row3 = PlusInterface.createInputGroup({
      append: 'Text',
      input: { type: 'text', placeholder: 'Placeholder', id: 'text-append-1' },
      size: 'default'
    });
    container.appendChild(row3);
    
    // Row 4: Input + two text appends (two text to the right)
    const row4 = PlusInterface.createInputGroup({
      append: ['Text', 'Text'],
      input: { type: 'text', placeholder: 'Placeholder', id: 'text-append-2' },
      size: 'default'
    });
    container.appendChild(row4);
    
    // Row 5: One text prepend + input + one text append (one on each side)
    const row5 = PlusInterface.createInputGroup({
      prepend: 'Text',
      append: 'Text',
      input: { type: 'text', placeholder: 'Placeholder', id: 'text-both-1' },
      size: 'default'
    });
    container.appendChild(row5);
    
    // Row 6: Two text prepends + input + two text appends (two on each side)
    const row6 = PlusInterface.createInputGroup({
      prepend: ['Text', 'Text'],
      append: ['Text', 'Text'],
      input: { type: 'text', placeholder: 'Placeholder', id: 'text-both-2' },
      size: 'default'
    });
    container.appendChild(row6);
    
    return container;
  },
};

/**
 * Input Group Checkbox
 * Checkbox addons for input fields
 * Based on Figma Design System specifications - exact layout match
 */
export const InputGroupCheckbox = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    // Row 1: Checked checkbox + input
    const checkedCheckbox = PlusInterface.createCheckbox({
      label: '',
      name: 'checkbox-1',
      value: '1',
      id: 'checkbox-checked-1',
      checked: true
    });
    const checkedGroup = PlusInterface.createInputGroup({
      prepend: { type: 'checkbox', checkbox: checkedCheckbox },
      input: { type: 'text', placeholder: 'Placeholder', id: 'input-checked' },
      size: 'default'
    });
    container.appendChild(checkedGroup);
    
    // Row 2: Indeterminate checkbox + input
    const indeterminateCheckbox = PlusInterface.createCheckbox({
      label: '',
      name: 'checkbox-2',
      value: '2',
      id: 'checkbox-indeterminate-1',
      indeterminate: true
    });
    const indeterminateGroup = PlusInterface.createInputGroup({
      prepend: { type: 'checkbox', checkbox: indeterminateCheckbox },
      input: { type: 'text', placeholder: 'Placeholder', id: 'input-indeterminate' },
      size: 'default'
    });
    container.appendChild(indeterminateGroup);
    
    // Row 3: Unchecked checkbox + input
    const uncheckedCheckbox = PlusInterface.createCheckbox({
      label: '',
      name: 'checkbox-3',
      value: '3',
      id: 'checkbox-unchecked-1',
      checked: false
    });
    const uncheckedGroup = PlusInterface.createInputGroup({
      prepend: { type: 'checkbox', checkbox: uncheckedCheckbox },
      input: { type: 'text', placeholder: 'Placeholder', id: 'input-unchecked' },
      size: 'default'
    });
    container.appendChild(uncheckedGroup);
    
    // Row 4: Disabled checkbox (checkbox disabled, input enabled)
    const disabledCheckbox = PlusInterface.createCheckbox({
      label: '',
      name: 'checkbox-4',
      value: '4',
      id: 'checkbox-disabled-1',
      checked: false,
      disabled: true
    });
    const disabledGroup = PlusInterface.createInputGroup({
      prepend: { type: 'checkbox', checkbox: disabledCheckbox },
      input: { type: 'text', placeholder: 'Placeholder', id: 'input-enabled' },
      size: 'default'
    });
    container.appendChild(disabledGroup);
    
    return container;
  },
};

/**
 * Input Group Radio
 * Radio button addons for input fields
 * Based on Figma Design System specifications - exact layout match
 */
export const InputGroupRadio = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    // Row 1: Selected radio + input
    const selectedRadio = PlusInterface.createRadio({
      label: '',
      name: 'radio-group-1',
      value: '1',
      id: 'radio-selected-1',
      checked: true
    });
    const selectedGroup = PlusInterface.createInputGroup({
      prepend: { type: 'radio', radio: selectedRadio },
      input: { type: 'text', placeholder: 'Placeholder', id: 'input-selected' },
      size: 'default'
    });
    container.appendChild(selectedGroup);
    
    // Row 2: Unselected radio + input
    const unselectedRadio1 = PlusInterface.createRadio({
      label: '',
      name: 'radio-group-1',
      value: '2',
      id: 'radio-unselected-1',
      checked: false
    });
    const unselectedGroup1 = PlusInterface.createInputGroup({
      prepend: { type: 'radio', radio: unselectedRadio1 },
      input: { type: 'text', placeholder: 'Placeholder', id: 'input-unselected-1' },
      size: 'default'
    });
    container.appendChild(unselectedGroup1);
    
    // Row 3: Disabled radio (radio disabled, input enabled)
    const disabledRadio = PlusInterface.createRadio({
      label: '',
      name: 'radio-group-2',
      value: '1',
      id: 'radio-disabled-1',
      checked: false,
      disabled: true
    });
    const disabledRadioGroup = PlusInterface.createInputGroup({
      prepend: { type: 'radio', radio: disabledRadio },
      input: { type: 'text', placeholder: 'Placeholder', id: 'input-enabled-radio' },
      size: 'default'
    });
    container.appendChild(disabledRadioGroup);
    
    return container;
  },
};

/**
 * Input Group Button
 * Button addons for input fields
 * Based on Figma Design System specifications - exact layout match
 * Uses outline buttons (text and border use primary color, no background fill)
 */
export const InputGroupButton = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    // Row 1: Single button prepend + input
    const button1 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default'
    });
    const row1 = PlusInterface.createInputGroup({
      prepend: { type: 'button', button: button1 },
      input: { type: 'text', placeholder: 'Placeholder', id: 'button-prepend-1' },
      size: 'default'
    });
    container.appendChild(row1);
    
    // Row 2: Two button prepends + input
    const button2 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default'
    });
    const button3 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default'
    });
    const row2 = PlusInterface.createInputGroup({
      prepend: [
        { type: 'button', button: button2 },
        { type: 'button', button: button3 }
      ],
      input: { type: 'text', placeholder: 'Placeholder', id: 'button-prepend-2' },
      size: 'default'
    });
    container.appendChild(row2);
    
    // Row 3: Input + single button append
    const button4 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default'
    });
    const row3 = PlusInterface.createInputGroup({
      append: { type: 'button', button: button4 },
      input: { type: 'text', placeholder: 'Placeholder', id: 'button-append-1' },
      size: 'default'
    });
    container.appendChild(row3);
    
    // Row 4: Input + two button appends (two buttons to the right)
    const button5 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default'
    });
    const button6 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default'
    });
    const row4 = PlusInterface.createInputGroup({
      append: [
        { type: 'button', button: button5 },
        { type: 'button', button: button6 }
      ],
      input: { type: 'text', placeholder: 'Placeholder', id: 'button-append-2' },
      size: 'default'
    });
    container.appendChild(row4);
    
    // Row 5: One button prepend + input + one button append (one on each side)
    const button7 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default'
    });
    const button8 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default'
    });
    const row5 = PlusInterface.createInputGroup({
      prepend: { type: 'button', button: button7 },
      append: { type: 'button', button: button8 },
      input: { type: 'text', placeholder: 'Placeholder', id: 'button-both-1' },
      size: 'default'
    });
    container.appendChild(row5);
    
    // Row 6: Two button prepends + input + two button appends (two on each side)
    const button9 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default'
    });
    const button10 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default'
    });
    const button11 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default'
    });
    const button12 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default'
    });
    const row6 = PlusInterface.createInputGroup({
      prepend: [
        { type: 'button', button: button9 },
        { type: 'button', button: button10 }
      ],
      append: [
        { type: 'button', button: button11 },
        { type: 'button', button: button12 }
      ],
      input: { type: 'text', placeholder: 'Placeholder', id: 'button-both-2' },
      size: 'default'
    });
    container.appendChild(row6);
    
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
