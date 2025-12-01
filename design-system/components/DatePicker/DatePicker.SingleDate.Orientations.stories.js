/**
 * Date Picker Single Date Orientations Stories
 * Calendar alignment options for selected single date picker
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/DatePicker/Single Date/Orientations',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Calendar alignment options for selected single date picker. Shows how the calendar popup aligns relative to the input: left, center, or right.',
      },
    },
  },
};

/**
 * Left
 * Calendar aligned to the left of the input
 */
export const Left = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.maxWidth = '400px';
    
    const label = document.createElement('label');
    label.className = 'body2-txt';
    label.textContent = 'Date Picker (Left Aligned)';
    label.setAttribute('for', 'datepicker-left');
    container.appendChild(label);
    
    const datePicker = PlusInterface.createDatePicker({
      id: 'datepicker-left',
      placeholder: 'Select Date',
      size: 'medium',
      value: '2025-03-26',
      calendarAlign: 'left'
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
 * Center
 * Calendar aligned to the center of the input
 */
export const Center = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.maxWidth = '400px';
    
    const label = document.createElement('label');
    label.className = 'body2-txt';
    label.textContent = 'Date Picker (Center Aligned)';
    label.setAttribute('for', 'datepicker-center');
    container.appendChild(label);
    
    const datePicker = PlusInterface.createDatePicker({
      id: 'datepicker-center',
      placeholder: 'Select Date',
      size: 'medium',
      value: '2025-03-31',
      calendarAlign: 'center'
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
 * Right
 * Calendar aligned to the right of the input
 */
export const Right = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.maxWidth = '400px';
    
    const label = document.createElement('label');
    label.className = 'body2-txt';
    label.textContent = 'Date Picker (Right Aligned)';
    label.setAttribute('for', 'datepicker-right');
    container.appendChild(label);
    
    const datePicker = PlusInterface.createDatePicker({
      id: 'datepicker-right',
      placeholder: 'Select Date',
      size: 'medium',
      value: '2025-03-31',
      calendarAlign: 'right'
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
 * All Orientations
 * Shows all calendar alignment options together for comparison
 */
export const AllOrientations = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.maxWidth = '600px';
    
    const orientations = [
      { name: 'Left', align: 'left', value: '2025-03-26' },
      { name: 'Center', align: 'center', value: '2025-03-31' },
      { name: 'Right', align: 'right', value: '2025-03-31' },
    ];
    
    orientations.forEach((orientation, index) => {
      const orientationWrapper = document.createElement('div');
      orientationWrapper.style.display = 'flex';
      orientationWrapper.style.flexDirection = 'column';
      orientationWrapper.style.gap = 'var(--size-element-gap-xs)';
      
      const orientationLabel = document.createElement('label');
      orientationLabel.className = 'body2-txt';
      orientationLabel.textContent = `Date Picker (${orientation.name} Aligned)`;
      orientationLabel.setAttribute('for', `datepicker-orientation-${index}`);
      orientationWrapper.appendChild(orientationLabel);
      
      const datePicker = PlusInterface.createDatePicker({
        id: `datepicker-orientation-${index}`,
        placeholder: 'Select Date',
        size: 'medium',
        value: orientation.value,
        calendarAlign: orientation.align
      });
      orientationWrapper.appendChild(datePicker);
      
      // Make calendar visible and positioned below the dropdown
      setTimeout(() => {
        const calendarContainer = datePicker.querySelector('.plus-date-picker-calendar');
        if (calendarContainer) {
          // Remove Bootstrap dropdown positioning
          calendarContainer.classList.remove('dropdown-menu');
          calendarContainer.style.display = 'block';
          calendarContainer.style.position = 'relative';
          calendarContainer.style.top = 'auto';
          calendarContainer.style.left = 'auto';
          calendarContainer.style.right = 'auto';
          calendarContainer.style.transform = 'none';
          calendarContainer.style.marginTop = 'var(--size-element-gap-xs)';
          calendarContainer.style.width = '280px';
          calendarContainer.style.zIndex = 'auto';
        }
      }, 100);
      
      container.appendChild(orientationWrapper);
    });
    
    return container;
  },
};

