/**
 * Input Group Content Variants Stories
 * Content variants for input group elements
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/InputGroup/Content',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Input group content variants: text addons, checkbox addons, radio addons, and button addons.',
      },
    },
  },
};

/**
 * Text Addon
 */
export const Text = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const textGroup = PlusInterface.createInputGroup({
      prepend: 'Text',
      input: { type: 'text', placeholder: 'Placeholder', id: 'text-prepend-1' },
      size: 'default'
    });
    container.appendChild(textGroup);
    
    return container;
  },
};

/**
 * Checkbox Addon
 */
export const Checkbox = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
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
    
    return container;
  },
};

/**
 * Radio Addon
 */
export const Radio = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
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
    
    return container;
  },
};

/**
 * Button Addon
 */
export const Button = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
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
    
    return container;
  },
};

/**
 * All Content Variants
 */
export const AllContent = {
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

