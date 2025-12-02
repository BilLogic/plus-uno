/**
 * Radio States Stories
 * State variants: checked, unchecked, disabled, focus
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Radio/States',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Radio button state variants: checked (selected), unchecked (default), disabled (non-interactive), and focus (keyboard navigation with focus ring).',
      },
    },
  },
};

/**
 * Checked
 * Selected radio button
 */
export const Checked = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const radio = PlusInterface.createRadio({
      label: 'Selected',
      name: 'radio-states',
      value: 'option1',
      id: 'radio-checked',
      checked: true,
    });
    
    container.appendChild(radio);
    return container;
  },
};

/**
 * Unchecked
 * Unselected radio button (default state)
 */
export const Unchecked = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const radio = PlusInterface.createRadio({
      label: 'Unselected',
      name: 'radio-states',
      value: 'option2',
      id: 'radio-unchecked',
      checked: false,
    });
    
    container.appendChild(radio);
    return container;
  },
};

/**
 * Disabled
 * Non-interactive radio button
 */
export const Disabled = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    
    // Disabled unchecked
    const disabledUnchecked = PlusInterface.createRadio({
      label: 'Disabled (unchecked)',
      name: 'radio-disabled',
      value: 'option1',
      id: 'radio-disabled-unchecked',
      checked: false,
      disabled: true,
    });
    container.appendChild(disabledUnchecked);
    
    // Disabled checked
    const disabledChecked = PlusInterface.createRadio({
      label: 'Disabled (checked)',
      name: 'radio-disabled',
      value: 'option2',
      id: 'radio-disabled-checked',
      checked: true,
      disabled: true,
    });
    container.appendChild(disabledChecked);
    
    return container;
  },
};

/**
 * Focus
 * Focused radio button with focus ring (keyboard navigation)
 */
export const Focus = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    
    // Focus unchecked
    const focusUnchecked = PlusInterface.createRadio({
      label: 'Focus (unchecked)',
      name: 'radio-focus',
      value: 'option1',
      id: 'radio-focus-unchecked',
      checked: false,
    });
    container.appendChild(focusUnchecked);
    
    // Focus checked
    const focusChecked = PlusInterface.createRadio({
      label: 'Focus (checked)',
      name: 'radio-focus',
      value: 'option2',
      id: 'radio-focus-checked',
      checked: true,
    });
    container.appendChild(focusChecked);
    
    // Auto-focus all radio inputs
    setTimeout(() => {
      const inputs = container.querySelectorAll('input');
      inputs.forEach((input) => {
        input.focus();
      });
    }, 100);
    
    return container;
  },
};

/**
 * All States
 * Shows all state variants together
 */
export const AllStates = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-sm)';
    
    const checked = PlusInterface.createRadio({
      label: 'Selected',
      name: 'radio-all-states',
      value: 'option1',
      id: 'radio-all-checked',
      checked: true,
    });
    container.appendChild(checked);
    
    const unchecked = PlusInterface.createRadio({
      label: 'Unselected',
      name: 'radio-all-states',
      value: 'option2',
      id: 'radio-all-unchecked',
      checked: false,
    });
    container.appendChild(unchecked);
    
    const disabled = PlusInterface.createRadio({
      label: 'Disabled',
      name: 'radio-all-states',
      value: 'option3',
      id: 'radio-all-disabled',
      checked: false,
      disabled: true,
    });
    container.appendChild(disabled);
    
    return container;
  },
};


