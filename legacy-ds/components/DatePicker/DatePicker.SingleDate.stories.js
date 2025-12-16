/**
 * Date Picker Single Date Stories
 * Single date picker input with states and alignment options
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/DatePicker/Single Date',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Single date picker input component. Shows different states: empty, filled, and selected. Selected state includes alignment options: left, center, and right.',
      },
    },
  },
};

/**
 * Empty
 * Empty state with placeholder text
 */
export const Empty = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.maxWidth = '400px';
    
    const label = document.createElement('label');
    label.className = 'body2-txt';
    label.textContent = 'Date Picker (Empty)';
    label.setAttribute('for', 'datepicker-empty');
    container.appendChild(label);
    
    const datePicker = PlusInterface.createDatePicker({
      id: 'datepicker-empty',
      placeholder: 'Select Date',
      size: 'medium'
    });
    container.appendChild(datePicker);
    
    return container;
  },
};

/**
 * Filled
 * Filled state with a date value
 */
export const Filled = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.maxWidth = '400px';
    
    const label = document.createElement('label');
    label.className = 'body2-txt';
    label.textContent = 'Date Picker (Filled)';
    label.setAttribute('for', 'datepicker-filled');
    container.appendChild(label);
    
    const datePicker = PlusInterface.createDatePicker({
      id: 'datepicker-filled',
      placeholder: 'Select Date',
      size: 'medium',
      value: '2025-03-31'
    });
    container.appendChild(datePicker);
    
    return container;
  },
};

/**
 * Selected
 * Selected state with a date value (same as filled but with selected styling)
 */
export const Selected = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.maxWidth = '400px';
    
    const label = document.createElement('label');
    label.className = 'body2-txt';
    label.textContent = 'Date Picker (Selected)';
    label.setAttribute('for', 'datepicker-selected');
    container.appendChild(label);
    
    const datePicker = PlusInterface.createDatePicker({
      id: 'datepicker-selected',
      placeholder: 'Select Date',
      size: 'medium',
      value: '2025-03-31'
    });
    container.appendChild(datePicker);
    
    return container;
  },
};


