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
 * See docs/guidelines/terminology.md for Element Component Guidelines
 * See docs/guidelines/token-reference.md for Token Reference
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/InputGroup',
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
 */
export const InputGroupText = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    // Row 1
    const row1 = document.createElement('div');
    row1.style.display = 'flex';
    row1.style.flexWrap = 'wrap';
    row1.style.gap = 'var(--size-element-gap-md)';
    row1.style.alignItems = 'center';
    
    // Text prepend
    const textPrepend1 = PlusInterface.createInputGroup({
      prepend: 'Text',
      input: { type: 'text', placeholder: 'Placeholder', id: 'text-prepend-1' },
      size: 'default'
    });
    row1.appendChild(textPrepend1);
    
    // Two text prepends
    const textPrepend2 = PlusInterface.createInputGroup({
      prepend: ['Text', 'Text'],
      input: { type: 'text', placeholder: 'Placeholder', id: 'text-prepend-2' },
      size: 'default'
    });
    row1.appendChild(textPrepend2);
    
    // Text append
    const textAppend1 = PlusInterface.createInputGroup({
      append: 'Text',
      input: { type: 'text', placeholder: 'Placeholder', id: 'text-append-1' },
      size: 'default'
    });
    row1.appendChild(textAppend1);
    
    container.appendChild(row1);
    
    // Row 2
    const row2 = document.createElement('div');
    row2.style.display = 'flex';
    row2.style.flexWrap = 'wrap';
    row2.style.gap = 'var(--size-element-gap-md)';
    row2.style.alignItems = 'center';
    
    // Standalone input
    const standaloneInput = document.createElement('input');
    standaloneInput.type = 'text';
    standaloneInput.className = 'form-control plus-text-field body2-txt';
    standaloneInput.placeholder = 'Placeholder';
    standaloneInput.id = 'standalone-input';
    row2.appendChild(standaloneInput);
    
    // Three text prepends
    const textPrepend3 = PlusInterface.createInputGroup({
      prepend: ['Text', 'Text', 'Text'],
      input: { type: 'text', placeholder: 'Placeholder', id: 'text-prepend-3' },
      size: 'default'
    });
    row2.appendChild(textPrepend3);
    
    // Standalone text
    const standaloneText = document.createElement('span');
    standaloneText.className = 'input-group-text plus-input-group-text body2-txt';
    standaloneText.textContent = 'Text';
    row2.appendChild(standaloneText);
    
    container.appendChild(row2);
    
    // Row 3
    const row3 = document.createElement('div');
    row3.style.display = 'flex';
    row3.style.flexWrap = 'wrap';
    row3.style.gap = 'var(--size-element-gap-md)';
    row3.style.alignItems = 'center';
    
    // Two text prepends
    const textPrepend4 = PlusInterface.createInputGroup({
      prepend: ['Text', 'Text'],
      input: { type: 'text', placeholder: 'Placeholder', id: 'text-prepend-4' },
      size: 'default'
    });
    row3.appendChild(textPrepend4);
    
    // Two standalone texts
    const standaloneText1 = document.createElement('span');
    standaloneText1.className = 'input-group-text plus-input-group-text body2-txt';
    standaloneText1.textContent = 'Text';
    const standaloneText2 = document.createElement('span');
    standaloneText2.className = 'input-group-text plus-input-group-text body2-txt';
    standaloneText2.textContent = 'Text';
    row3.appendChild(standaloneText1);
    row3.appendChild(standaloneText2);
    
    container.appendChild(row3);
    
    return container;
  },
};

/**
 * Input Group Checkbox
 * Checkbox addons for input fields
 */
export const InputGroupCheckbox = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    // Row 1
    const row1 = document.createElement('div');
    row1.style.display = 'flex';
    row1.style.flexWrap = 'wrap';
    row1.style.gap = 'var(--size-element-gap-md)';
    row1.style.alignItems = 'center';
    
    // Checked checkbox prepend
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
    row1.appendChild(checkedGroup);
    
    // Indeterminate checkbox prepend
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
    row1.appendChild(indeterminateGroup);
    
    // Unchecked checkbox prepend
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
    row1.appendChild(uncheckedGroup);
    
    container.appendChild(row1);
    
    // Row 2
    const row2 = document.createElement('div');
    row2.style.display = 'flex';
    row2.style.flexWrap = 'wrap';
    row2.style.gap = 'var(--size-element-gap-md)';
    row2.style.alignItems = 'center';
    
    // Another unchecked checkbox prepend
    const uncheckedCheckbox2 = PlusInterface.createCheckbox({
      label: '',
      name: 'checkbox-4',
      value: '4',
      id: 'checkbox-unchecked-2',
      checked: false
    });
    const uncheckedGroup2 = PlusInterface.createInputGroup({
      prepend: { type: 'checkbox', checkbox: uncheckedCheckbox2 },
      input: { type: 'text', placeholder: 'Placeholder', id: 'input-unchecked-2' },
      size: 'default'
    });
    row2.appendChild(uncheckedGroup2);
    
    container.appendChild(row2);
    
    return container;
  },
};

/**
 * Input Group Radio
 * Radio button addons for input fields
 */
export const InputGroupRadio = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    // Row 1
    const row1 = document.createElement('div');
    row1.style.display = 'flex';
    row1.style.flexWrap = 'wrap';
    row1.style.gap = 'var(--size-element-gap-md)';
    row1.style.alignItems = 'center';
    
    // Selected radio prepend
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
    row1.appendChild(selectedGroup);
    
    // Unselected radio prepend
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
    row1.appendChild(unselectedGroup1);
    
    // Another unselected radio prepend
    const unselectedRadio2 = PlusInterface.createRadio({
      label: '',
      name: 'radio-group-1',
      value: '3',
      id: 'radio-unselected-2',
      checked: false
    });
    const unselectedGroup2 = PlusInterface.createInputGroup({
      prepend: { type: 'radio', radio: unselectedRadio2 },
      input: { type: 'text', placeholder: 'Placeholder', id: 'input-unselected-2' },
      size: 'default'
    });
    row1.appendChild(unselectedGroup2);
    
    container.appendChild(row1);
    
    return container;
  },
};

/**
 * Input Group Button
 * Button addons for input fields
 */
export const InputGroupButton = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    // Row 1
    const row1 = document.createElement('div');
    row1.style.display = 'flex';
    row1.style.flexWrap = 'wrap';
    row1.style.gap = 'var(--size-element-gap-md)';
    row1.style.alignItems = 'center';
    
    // Button prepend
    const button1 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default'
    });
    const buttonPrepend1 = PlusInterface.createInputGroup({
      prepend: { type: 'button', button: button1 },
      input: { type: 'text', placeholder: 'Placeholder', id: 'input-button-prepend-1' },
      size: 'default'
    });
    row1.appendChild(buttonPrepend1);
    
    // Button append
    const button2 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default'
    });
    const buttonAppend1 = PlusInterface.createInputGroup({
      append: { type: 'button', button: button2 },
      input: { type: 'text', placeholder: 'Placeholder', id: 'input-button-append-1' },
      size: 'default'
    });
    row1.appendChild(buttonAppend1);
    
    // Button prepend and append
    const button3 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default'
    });
    const button4 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default'
    });
    const buttonBoth = PlusInterface.createInputGroup({
      prepend: { type: 'button', button: button3 },
      append: { type: 'button', button: button4 },
      input: { type: 'text', placeholder: 'Placeholder', id: 'input-button-both-1' },
      size: 'default'
    });
    row1.appendChild(buttonBoth);
    
    container.appendChild(row1);
    
    // Row 2
    const row2 = document.createElement('div');
    row2.style.display = 'flex';
    row2.style.flexWrap = 'wrap';
    row2.style.gap = 'var(--size-element-gap-md)';
    row2.style.alignItems = 'center';
    
    // Two buttons prepend
    const button5 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default'
    });
    const button6 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default'
    });
    const twoButtonsPrepend = PlusInterface.createInputGroup({
      prepend: [
        { type: 'button', button: button5 },
        { type: 'button', button: button6 }
      ],
      input: { type: 'text', placeholder: 'Placeholder', id: 'input-two-buttons-prepend' },
      size: 'default'
    });
    row2.appendChild(twoButtonsPrepend);
    
    // Two buttons append
    const button7 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default'
    });
    const button8 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default'
    });
    const twoButtonsAppend = PlusInterface.createInputGroup({
      append: [
        { type: 'button', button: button7 },
        { type: 'button', button: button8 }
      ],
      input: { type: 'text', placeholder: 'Placeholder', id: 'input-two-buttons-append' },
      size: 'default'
    });
    row2.appendChild(twoButtonsAppend);
    
    container.appendChild(row2);
    
    // Row 3
    const row3 = document.createElement('div');
    row3.style.display = 'flex';
    row3.style.flexWrap = 'wrap';
    row3.style.gap = 'var(--size-element-gap-md)';
    row3.style.alignItems = 'center';
    
    // Two buttons prepend (again)
    const button9 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default'
    });
    const button10 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default'
    });
    const twoButtonsPrepend2 = PlusInterface.createInputGroup({
      prepend: [
        { type: 'button', button: button9 },
        { type: 'button', button: button10 }
      ],
      input: { type: 'text', placeholder: 'Placeholder', id: 'input-two-buttons-prepend-2' },
      size: 'default'
    });
    row3.appendChild(twoButtonsPrepend2);
    
    // Two standalone buttons
    const button11 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default'
    });
    const button12 = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default'
    });
    row3.appendChild(button11);
    row3.appendChild(button12);
    
    container.appendChild(row3);
    
    return container;
  },
};
