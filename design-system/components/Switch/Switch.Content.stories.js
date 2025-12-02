/**
 * Switch Content Variants Stories
 * Content variants for switch elements
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Switch/Content',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Switch content variants: single switch and switch groups.',
      },
    },
  },
};

/**
 * Single Switch
 */
export const SingleSwitch = {
  render: () => {
    const container = document.createElement('div');
    const switchEl = PlusInterface.createSwitch({
      label: 'Enable notifications',
      name: 'switch-single',
      id: 'switch-single',
      checked: false,
    });
    container.appendChild(switchEl);
    return container;
  },
};

/**
 * Switch Group
 */
export const SwitchGroup = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    
    const switch1 = PlusInterface.createSwitch({
      label: 'Email notifications',
      name: 'switch-group',
      id: 'switch-group-1',
      checked: true,
    });
    container.appendChild(switch1);
    
    const switch2 = PlusInterface.createSwitch({
      label: 'Push notifications',
      name: 'switch-group',
      id: 'switch-group-2',
      checked: false,
    });
    container.appendChild(switch2);
    
    const switch3 = PlusInterface.createSwitch({
      label: 'SMS notifications',
      name: 'switch-group',
      id: 'switch-group-3',
      checked: false,
    });
    container.appendChild(switch3);
    
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
    container.style.gap = 'var(--size-section-gap-md)';
    
    // Single Switch
    const singleLabel = document.createElement('div');
    singleLabel.className = 'h6';
    singleLabel.textContent = 'Single Switch';
    singleLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(singleLabel);
    
    const singleSwitch = PlusInterface.createSwitch({
      label: 'Enable notifications',
      name: 'all-switch-single',
      id: 'all-switch-single',
      checked: false,
    });
    container.appendChild(singleSwitch);
    
    // Switch Group
    const groupLabel = document.createElement('div');
    groupLabel.className = 'h6';
    groupLabel.textContent = 'Switch Group';
    groupLabel.style.marginTop = 'var(--size-section-gap-md)';
    groupLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(groupLabel);
    
    const groupContainer = document.createElement('div');
    groupContainer.style.display = 'flex';
    groupContainer.style.flexDirection = 'column';
    groupContainer.style.gap = 'var(--size-element-gap-md)';
    
    const switch1 = PlusInterface.createSwitch({
      label: 'Email notifications',
      name: 'all-switch-group',
      id: 'all-switch-group-1',
      checked: true,
    });
    groupContainer.appendChild(switch1);
    
    const switch2 = PlusInterface.createSwitch({
      label: 'Push notifications',
      name: 'all-switch-group',
      id: 'all-switch-group-2',
      checked: false,
    });
    groupContainer.appendChild(switch2);
    
    container.appendChild(groupContainer);
    
    return container;
  },
};


