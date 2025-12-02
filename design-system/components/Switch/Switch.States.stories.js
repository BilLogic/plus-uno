/**
 * Switch State Variants Stories
 * State variants for switch elements
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Switch/States',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Switch state variants: checked, unchecked, and disabled.',
      },
    },
  },
};

/**
 * Checked
 */
export const Checked = {
  render: () => {
    const container = document.createElement('div');
    const switchEl = PlusInterface.createSwitch({
      label: 'Checked',
      name: 'switch-checked',
      id: 'switch-checked',
      checked: true,
    });
    container.appendChild(switchEl);
    return container;
  },
};

/**
 * Unchecked
 */
export const Unchecked = {
  render: () => {
    const container = document.createElement('div');
    const switchEl = PlusInterface.createSwitch({
      label: 'Unchecked',
      name: 'switch-unchecked',
      id: 'switch-unchecked',
      checked: false,
    });
    container.appendChild(switchEl);
    return container;
  },
};

/**
 * Disabled
 */
export const Disabled = {
  render: () => {
    const container = document.createElement('div');
    const switchEl = PlusInterface.createSwitch({
      label: 'Disabled',
      name: 'switch-disabled',
      id: 'switch-disabled',
      checked: false,
      disabled: true,
    });
    container.appendChild(switchEl);
    return container;
  },
};

/**
 * All States
 */
export const AllStates = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-sm)';
    
    const checked = PlusInterface.createSwitch({
      label: 'Checked',
      name: 'all-switch',
      id: 'all-checked',
      checked: true,
    });
    container.appendChild(checked);
    
    const unchecked = PlusInterface.createSwitch({
      label: 'Unchecked',
      name: 'all-switch',
      id: 'all-unchecked',
      checked: false,
    });
    container.appendChild(unchecked);
    
    const disabled = PlusInterface.createSwitch({
      label: 'Disabled',
      name: 'all-switch',
      id: 'all-disabled',
      checked: false,
      disabled: true,
    });
    container.appendChild(disabled);
    
    return container;
  },
};


