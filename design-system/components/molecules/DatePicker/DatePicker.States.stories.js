/**
 * Date Picker States Stories
 * State variants organized under "States" subcategory
 */

import { PlusInterface } from '../../index.js';

export default {
  title: 'Molecules/DatePicker/States',
  tags: ['autodocs'],
};

/**
 * Default
 * Shows default state with placeholder
 */
export const Default = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.maxWidth = '400px';
    
    const label = document.createElement('label');
    label.className = 'body2-txt';
    label.textContent = 'Date Picker (Default)';
    label.setAttribute('for', 'datepicker-default');
    container.appendChild(label);
    
    const datePicker = PlusInterface.createDatePicker({
      id: 'datepicker-default',
      placeholder: 'Select date',
      size: 'medium'
    });
    container.appendChild(datePicker);
    
    return container;
  },
};

/**
 * With Value
 * Shows date picker with a selected date
 */
export const WithValue = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.maxWidth = '400px';
    
    const label = document.createElement('label');
    label.className = 'body2-txt';
    label.textContent = 'Date Picker (With Value)';
    label.setAttribute('for', 'datepicker-value');
    container.appendChild(label);
    
    const datePicker = PlusInterface.createDatePicker({
      id: 'datepicker-value',
      placeholder: 'Select date',
      size: 'medium',
      value: '2024-03-15'
    });
    container.appendChild(datePicker);
    
    return container;
  },
};

/**
 * Disabled
 * Shows disabled date picker
 */
export const Disabled = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.maxWidth = '400px';
    
    const label = document.createElement('label');
    label.className = 'body2-txt';
    label.textContent = 'Date Picker (Disabled)';
    label.setAttribute('for', 'datepicker-disabled');
    container.appendChild(label);
    
    const datePicker = PlusInterface.createDatePicker({
      id: 'datepicker-disabled',
      placeholder: 'Select date',
      size: 'medium',
      disabled: true
    });
    container.appendChild(datePicker);
    
    return container;
  },
};

/**
 * Read Only
 * Shows read-only date picker with value
 */
export const ReadOnly = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.maxWidth = '400px';
    
    const label = document.createElement('label');
    label.className = 'body2-txt';
    label.textContent = 'Date Picker (Read Only)';
    label.setAttribute('for', 'datepicker-readonly');
    container.appendChild(label);
    
    const datePicker = PlusInterface.createDatePicker({
      id: 'datepicker-readonly',
      placeholder: 'Select date',
      size: 'medium',
      value: '2024-06-20',
      readonly: true
    });
    container.appendChild(datePicker);
    
    return container;
  },
};







