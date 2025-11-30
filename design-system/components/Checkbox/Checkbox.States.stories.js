/**
 * Checkbox States Stories
 * State variants organized under "States" subcategory
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Checkbox/States',
  tags: ['autodocs'],
};

/**
 * Checked Checkbox
 */
export const Checked = {
  render: () => {
    const container = document.createElement('div');
    const checkbox = PlusInterface.createCheckbox({
      label: 'Checked checkbox',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-checked',
      checked: true,
    });
    container.appendChild(checkbox);
    return container;
  },
};

/**
 * Unchecked Checkbox
 */
export const Unchecked = {
  render: () => {
    const container = document.createElement('div');
    const checkbox = PlusInterface.createCheckbox({
      label: 'Unchecked checkbox',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-unchecked',
      checked: false,
    });
    container.appendChild(checkbox);
    return container;
  },
};

/**
 * Indeterminate Checkbox
 * Shows a dash/minus instead of a checkmark, used when some items in a group are selected
 */
export const Indeterminate = {
  render: () => {
    const container = document.createElement('div');
    const checkbox = PlusInterface.createCheckbox({
      label: 'Indeterminate checkbox (dash/minus)',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-indeterminate',
      checked: false,
      indeterminate: true,
    });
    container.appendChild(checkbox);
    return container;
  },
};

/**
 * Disabled Checkbox (Unchecked)
 */
export const DisabledUnchecked = {
  render: () => {
    const container = document.createElement('div');
    const checkbox = PlusInterface.createCheckbox({
      label: 'Disabled checkbox (unchecked)',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-disabled-unchecked',
      checked: false,
      disabled: true,
    });
    container.appendChild(checkbox);
    return container;
  },
};

/**
 * Disabled Checkbox (Checked)
 */
export const DisabledChecked = {
  render: () => {
    const container = document.createElement('div');
    const checkbox = PlusInterface.createCheckbox({
      label: 'Disabled checkbox (checked)',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-disabled-checked',
      checked: true,
      disabled: true,
    });
    container.appendChild(checkbox);
    return container;
  },
};

/**
 * Disabled Checkbox (Indeterminate)
 */
export const DisabledIndeterminate = {
  render: () => {
    const container = document.createElement('div');
    const checkbox = PlusInterface.createCheckbox({
      label: 'Disabled checkbox (indeterminate)',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-disabled-indeterminate',
      checked: false,
      indeterminate: true,
      disabled: true,
    });
    container.appendChild(checkbox);
    return container;
  },
};

/**
 * Focus State (Unchecked)
 * Checkbox with focus ring - use Tab key or click to focus
 */
export const FocusUnchecked = {
  render: () => {
    const container = document.createElement('div');
    const checkbox = PlusInterface.createCheckbox({
      label: 'Focus checkbox (unchecked)',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-focus-unchecked',
      checked: false,
    });
    container.appendChild(checkbox);
    // Auto-focus the checkbox input
    setTimeout(() => {
      const input = checkbox.querySelector('input');
      if (input) {
        input.focus();
      }
    }, 100);
    return container;
  },
};

/**
 * Focus State (Checked)
 * Checkbox with focus ring - use Tab key or click to focus
 */
export const FocusChecked = {
  render: () => {
    const container = document.createElement('div');
    const checkbox = PlusInterface.createCheckbox({
      label: 'Focus checkbox (checked)',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-focus-checked',
      checked: true,
    });
    container.appendChild(checkbox);
    // Auto-focus the checkbox input
    setTimeout(() => {
      const input = checkbox.querySelector('input');
      if (input) {
        input.focus();
      }
    }, 100);
    return container;
  },
};

/**
 * Focus State (Indeterminate)
 * Checkbox with focus ring - use Tab key or click to focus
 */
export const FocusIndeterminate = {
  render: () => {
    const container = document.createElement('div');
    const checkbox = PlusInterface.createCheckbox({
      label: 'Focus checkbox (indeterminate)',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-focus-indeterminate',
      checked: false,
      indeterminate: true,
    });
    container.appendChild(checkbox);
    // Auto-focus the checkbox input
    setTimeout(() => {
      const input = checkbox.querySelector('input');
      if (input) {
        input.focus();
      }
    }, 100);
    return container;
  },
};

