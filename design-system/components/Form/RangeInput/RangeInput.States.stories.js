/**
 * Range Input State Variants Stories
 * State variants for range input elements
 */

import { PlusInterface } from "../../index.js";

export default {
  title: 'Components/Form/RangeInput/States',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Range input state variants: default and disabled. Also includes different value ranges.',
      },
    },
  },
};

/**
 * Default State
 */
export const Default = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.maxWidth = '400px';
    
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = 'Default (Value: 50)';
    container.appendChild(label);
    
    const rangeInput = PlusInterface.createRangeInput({
      size: 'medium',
      value: 50
    });
    container.appendChild(rangeInput);
    
    return container;
  },
};

/**
 * Disabled State
 */
export const Disabled = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.maxWidth = '400px';
    
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = 'Disabled (Value: 50)';
    container.appendChild(label);
    
    const rangeInput = PlusInterface.createRangeInput({
      size: 'medium',
      value: 50,
      disabled: true
    });
    container.appendChild(rangeInput);
    
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
    container.style.gap = '24px';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.maxWidth = '400px';
    
    const states = [
      { label: 'Default (Value: 50)', value: 50, disabled: false },
      { label: 'Value: 0', value: 0, disabled: false },
      { label: 'Value: 100', value: 100, disabled: false },
      { label: 'Disabled (Value: 50)', value: 50, disabled: true }
    ];
    
    states.forEach((state) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.gap = 'var(--size-element-gap-xs)';
      
      const label = document.createElement('label');
      label.className = 'body3-txt';
      label.textContent = state.label;
      wrapper.appendChild(label);
      
      const rangeInput = PlusInterface.createRangeInput({
        size: 'medium',
        value: state.value,
        disabled: state.disabled
      });
      wrapper.appendChild(rangeInput);
      
      container.appendChild(wrapper);
    });
    
    return container;
  },
};


