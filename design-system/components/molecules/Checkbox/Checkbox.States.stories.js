/**
 * Checkbox States Stories
 * State variants organized under "States" subcategory
 */

import { PlusInterface } from '../../index.js';

export default {
  title: 'Molecules/Checkbox/States',
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

