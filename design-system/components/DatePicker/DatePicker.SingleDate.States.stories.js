/**
 * Date Picker Single Date States Stories
 * State variants for single date picker
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/DatePicker/Single Date/States',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'State variants for single date picker: empty, filled, and selected.',
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
    label.setAttribute('for', 'datepicker-empty-state');
    container.appendChild(label);
    
    const datePicker = PlusInterface.createDatePicker({
      id: 'datepicker-empty-state',
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
    label.setAttribute('for', 'datepicker-filled-state');
    container.appendChild(label);
    
    const datePicker = PlusInterface.createDatePicker({
      id: 'datepicker-filled-state',
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
 * Selected state with a date value and calendar visible
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
    label.setAttribute('for', 'datepicker-selected-state');
    container.appendChild(label);
    
    const datePicker = PlusInterface.createDatePicker({
      id: 'datepicker-selected-state',
      placeholder: 'Select Date',
      size: 'medium',
      value: '2025-03-31'
    });
    container.appendChild(datePicker);
    
    // Make calendar visible and positioned below the dropdown (same approach as Calendar Item)
    setTimeout(() => {
      const calendarContainer = datePicker.querySelector('.plus-date-picker-calendar');
      if (calendarContainer) {
        calendarContainer.style.display = 'block';
        calendarContainer.style.position = 'relative';
        calendarContainer.style.top = 'auto';
        calendarContainer.style.left = 'auto';
        calendarContainer.style.marginTop = 'var(--size-element-gap-xs)';
        calendarContainer.style.width = '280px';
      }
    }, 100);
    
    return container;
  },
};

/**
 * All States
 * Shows all single date picker states together for comparison
 */
export const AllStates = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.maxWidth = '600px';
    
    const states = [
      { name: 'Empty', value: null, showCalendar: false },
      { name: 'Filled', value: '2025-03-31', showCalendar: false },
      { name: 'Selected', value: '2025-03-31', showCalendar: true },
    ];
    
    states.forEach((state, index) => {
      const stateWrapper = document.createElement('div');
      stateWrapper.style.display = 'flex';
      stateWrapper.style.flexDirection = 'column';
      stateWrapper.style.gap = 'var(--size-element-gap-xs)';
      
      const stateLabel = document.createElement('label');
      stateLabel.className = 'body2-txt';
      stateLabel.textContent = `Date Picker (${state.name})`;
      stateLabel.setAttribute('for', `datepicker-states-all-${index}`);
      stateWrapper.appendChild(stateLabel);
      
      const datePicker = PlusInterface.createDatePicker({
        id: `datepicker-states-all-${index}`,
        placeholder: 'Select Date',
        size: 'medium',
        value: state.value
      });
      stateWrapper.appendChild(datePicker);
      
      // Make calendar visible for Selected state (same approach as Calendar Item)
      if (state.showCalendar) {
        setTimeout(() => {
          const calendarContainer = datePicker.querySelector('.plus-date-picker-calendar');
          if (calendarContainer) {
            calendarContainer.style.display = 'block';
            calendarContainer.style.position = 'relative';
            calendarContainer.style.top = 'auto';
            calendarContainer.style.left = 'auto';
            calendarContainer.style.marginTop = 'var(--size-element-gap-xs)';
            calendarContainer.style.width = '280px';
          }
        }, 100);
      }
      
      container.appendChild(stateWrapper);
    });
    
    return container;
  },
};

