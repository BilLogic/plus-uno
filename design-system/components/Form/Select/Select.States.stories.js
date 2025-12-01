/**
 * Select State Variants Stories
 * State variants for select elements
 */

import { PlusInterface } from "../../index.js";

export default {
  title: 'Components/Form/Select/States',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Select state variants: default, focus, read-only, and disabled.',
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
    label.textContent = 'Default';
    container.appendChild(label);
    
    const select = PlusInterface.createSelect({
      placeholder: 'Select Form',
      size: 'medium',
      options: []
    });
    container.appendChild(select);
    
    return container;
  },
};

/**
 * Focus State
 */
export const Focus = {
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
    label.textContent = 'Focus';
    container.appendChild(label);
    
    const select = PlusInterface.createSelect({
      placeholder: 'Select Form',
      size: 'medium',
      options: []
    });
    // Auto-focus for demonstration
    setTimeout(() => {
      const selectElement = select.querySelector('select');
      if (selectElement) {
        selectElement.focus();
      }
    }, 100);
    container.appendChild(select);
    
    return container;
  },
};

/**
 * Read-only State
 */
export const ReadOnly = {
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
    label.textContent = 'Read-only';
    container.appendChild(label);
    
    const select = PlusInterface.createSelect({
      size: 'medium',
      readonly: true,
      options: [
        { value: 'option1', text: 'Select Form', selected: true }
      ]
    });
    container.appendChild(select);
    
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
    label.textContent = 'Disabled';
    container.appendChild(label);
    
    const select = PlusInterface.createSelect({
      placeholder: 'Select Form',
      size: 'medium',
      disabled: true,
      options: []
    });
    container.appendChild(select);
    
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
      { label: 'Default (Placeholder)', placeholder: 'Select Form', value: null, readonly: false, disabled: false },
      { label: 'With Value', placeholder: '', value: 'Select Form', readonly: false, disabled: false },
      { label: 'Read-only (with value)', placeholder: '', value: 'Select Form', readonly: true, disabled: false },
      { label: 'Disabled (Placeholder)', placeholder: 'Select Form', value: null, readonly: false, disabled: true },
      { label: 'Disabled (with value)', placeholder: '', value: 'Select Form', readonly: false, disabled: true }
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
      
      const select = PlusInterface.createSelect({
        placeholder: state.placeholder,
        size: 'medium',
        readonly: state.readonly,
        disabled: state.disabled,
        options: state.value ? [
          { value: 'option1', text: state.value, selected: true }
        ] : []
      });
      wrapper.appendChild(select);
      
      container.appendChild(wrapper);
    });
    
    return container;
  },
};

