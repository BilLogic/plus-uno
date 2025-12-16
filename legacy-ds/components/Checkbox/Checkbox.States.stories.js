/**
 * Checkbox States Stories
 * State variants organized under "States" subcategory
 * Each state is shown on a separate page - regular checkboxes and indeterminate checkboxes are separated
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Checkbox/States',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Checkbox state variants: checked (includes regular checked and indeterminate), unchecked, disabled, and focus states. Indeterminate checkboxes are shown under the "Checked" state since they represent a checked state.',
      },
    },
  },
};

/**
 * All States
 * Shows all checkbox states together for comparison
 */
export const AllStates = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    
    // Checked states (includes regular checked and indeterminate)
    const checked = PlusInterface.createCheckbox({
      label: 'Checked checkbox',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-checked',
      checked: true,
    });
    container.appendChild(checked);
    
    const indeterminate = PlusInterface.createCheckbox({
      label: 'Indeterminate checkbox (dash/minus)',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-indeterminate',
      checked: false,
      indeterminate: true,
    });
    container.appendChild(indeterminate);
    
    // Unchecked state
    const unchecked = PlusInterface.createCheckbox({
      label: 'Unchecked checkbox',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-unchecked',
      checked: false,
    });
    container.appendChild(unchecked);
    
    // Disabled states
    const disabledUnchecked = PlusInterface.createCheckbox({
      label: 'Disabled checkbox (unchecked)',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-disabled-unchecked',
      checked: false,
      disabled: true,
    });
    container.appendChild(disabledUnchecked);
    
    const disabledChecked = PlusInterface.createCheckbox({
      label: 'Disabled checkbox (checked)',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-disabled-checked',
      checked: true,
      disabled: true,
    });
    container.appendChild(disabledChecked);
    
    return container;
  },
};

/**
 * Checked
 * Shows checked state variants: regular checked checkbox and indeterminate checkbox
 * Both represent a "checked" state, even though indeterminate uses a dash/minus instead of a checkmark
 */
export const Checked = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    
    // Regular checked checkbox
    const checked = PlusInterface.createCheckbox({
      label: 'Checked checkbox',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-checked',
      checked: true,
    });
    container.appendChild(checked);
    
    // Indeterminate checkbox (also a "checked" state)
    const indeterminate = PlusInterface.createCheckbox({
      label: 'Indeterminate checkbox (dash/minus)',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-indeterminate',
      checked: false,
      indeterminate: true,
    });
    container.appendChild(indeterminate);
    
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
 * Disabled
 * Shows all disabled checkbox variants: unchecked, checked, and indeterminate
 */
export const Disabled = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    
    // Disabled unchecked
    const disabledUnchecked = PlusInterface.createCheckbox({
      label: 'Disabled checkbox (unchecked)',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-disabled-unchecked',
      checked: false,
      disabled: true,
    });
    container.appendChild(disabledUnchecked);
    
    // Disabled checked
    const disabledChecked = PlusInterface.createCheckbox({
      label: 'Disabled checkbox (checked)',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-disabled-checked',
      checked: true,
      disabled: true,
    });
    container.appendChild(disabledChecked);
    
    // Disabled indeterminate
    const disabledIndeterminate = PlusInterface.createCheckbox({
      label: 'Disabled checkbox (indeterminate)',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-disabled-indeterminate',
      checked: false,
      indeterminate: true,
      disabled: true,
    });
    container.appendChild(disabledIndeterminate);
    
    return container;
  },
};

/**
 * Focus
 * Shows all focus state checkbox variants: unchecked, checked, and indeterminate
 * Checkboxes with focus ring - use Tab key or click to focus
 */
export const Focus = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    
    // Focus unchecked
    const focusUnchecked = PlusInterface.createCheckbox({
      label: 'Focus checkbox (unchecked)',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-focus-unchecked',
      checked: false,
    });
    container.appendChild(focusUnchecked);
    
    // Focus checked
    const focusChecked = PlusInterface.createCheckbox({
      label: 'Focus checkbox (checked)',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-focus-checked',
      checked: true,
    });
    container.appendChild(focusChecked);
    
    // Focus indeterminate
    const focusIndeterminate = PlusInterface.createCheckbox({
      label: 'Focus checkbox (indeterminate)',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-focus-indeterminate',
      checked: false,
      indeterminate: true,
    });
    container.appendChild(focusIndeterminate);
    
    // Auto-focus all checkbox inputs
    setTimeout(() => {
      const inputs = container.querySelectorAll('input');
      inputs.forEach((input) => {
        input.focus();
      });
    }, 100);
    
    return container;
  },
};

