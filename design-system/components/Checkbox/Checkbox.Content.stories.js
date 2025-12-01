/**
 * Checkbox Content Variants Stories
 * Content-based variants organized under "Content Variants" subcategory
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Checkbox/Content',
  tags: ['autodocs'],
};

/**
 * Check Type: None (Unchecked)
 * Default unchecked state
 */
export const CheckTypeNone = {
  render: () => {
    const container = document.createElement('div');
    const checkbox = PlusInterface.createCheckbox({
      label: 'Text',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-type-none',
      checked: false,
    });
    container.appendChild(checkbox);
    return container;
  },
};

/**
 * Check Type: Check (Checked)
 * Checked state with checkmark
 */
export const CheckTypeCheck = {
  render: () => {
    const container = document.createElement('div');
    const checkbox = PlusInterface.createCheckbox({
      label: 'Text',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-type-check',
      checked: true,
    });
    container.appendChild(checkbox);
    return container;
  },
};

/**
 * Check Type: Indeterminate
 * Indeterminate state with dash/minus
 */
export const CheckTypeIndeterminate = {
  render: () => {
    const container = document.createElement('div');
    const checkbox = PlusInterface.createCheckbox({
      label: 'Text',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-type-indeterminate',
      checked: false,
      indeterminate: true,
    });
    container.appendChild(checkbox);
    return container;
  },
};

/**
 * Required Checkbox
 * Checkbox with required asterisk indicator
 */
export const Required = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-sm)';
    
    const requiredChecked = PlusInterface.createCheckbox({
      label: 'Text',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-required-checked',
      checked: true,
      required: true,
    });
    container.appendChild(requiredChecked);
    
    const requiredUnchecked = PlusInterface.createCheckbox({
      label: 'Text',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-required-unchecked',
      checked: false,
      required: true,
    });
    container.appendChild(requiredUnchecked);
    
    return container;
  },
};

