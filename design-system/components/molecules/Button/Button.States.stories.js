/**
 * Button States Stories
 * State variants organized under "States" subcategory
 */

import { PlusInterface } from '../../index.js';

export default {
  title: 'Molecules/Button/States',
  tags: ['autodocs'],
};

/**
 * Enabled Button
 */
export const Enabled = {
  render: () => {
    const container = document.createElement('div');
    const button = PlusInterface.createButton({
      btnText: 'Enabled Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default',
      enabled: true,
    });
    container.appendChild(button);
    return container;
  },
};

/**
 * Disabled Button
 */
export const Disabled = {
  render: () => {
    const container = document.createElement('div');
    const button = PlusInterface.createButton({
      btnText: 'Disabled Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default',
      enabled: false,
    });
    container.appendChild(button);
    return container;
  },
};

/**
 * All States Comparison
 */
export const AllStates = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = 'var(--size-card-gap-md)';
    container.style.flexDirection = 'column';
    
    const enabledButton = PlusInterface.createButton({
      btnText: 'Enabled',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default',
      enabled: true,
    });
    container.appendChild(enabledButton);
    
    const disabledButton = PlusInterface.createButton({
      btnText: 'Disabled',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default',
      enabled: false,
    });
    container.appendChild(disabledButton);
    
    return container;
  },
};

