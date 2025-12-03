/**
 * Date Picker Calendar Stories
 * Standalone calendar widget component
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/DatePicker/Calendar Item',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Standalone calendar widget component. Shows month view with navigation, weekday headers, and selectable dates. Used within the date picker popup.',
      },
    },
  },
};

/**
 * Calendar Item
 * Shows the standalone calendar widget
 */
export const CalendarItem = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.alignItems = 'center';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.minHeight = '500px';
    
    const label = document.createElement('div');
    label.className = 'h6';
    label.textContent = 'Calendar Item';
    label.style.marginBottom = 'var(--size-element-gap-md)';
    label.style.color = 'var(--color-on-surface-variant)';
    container.appendChild(label);
    
    // Create a date picker and programmatically open its calendar
    const datePicker = PlusInterface.createDatePicker({
      id: 'calendar-demo',
      placeholder: 'Select date',
      size: 'medium',
      value: '2025-11-19'
    });
    
    // Find the calendar container and make it visible and positioned
    const calendarContainer = datePicker.querySelector('.plus-date-picker-calendar');
    if (calendarContainer) {
      calendarContainer.style.display = 'block';
      calendarContainer.style.position = 'relative';
      calendarContainer.style.top = 'auto';
      calendarContainer.style.left = 'auto';
      calendarContainer.style.margin = '0 auto';
      calendarContainer.style.width = '280px';
    }
    
    // Also show the input for context
    const inputWrapper = datePicker.querySelector('.plus-date-picker-input-wrapper');
    if (inputWrapper) {
      inputWrapper.style.maxWidth = '300px';
      inputWrapper.style.marginBottom = 'var(--size-section-gap-md)';
    }
    
    container.appendChild(datePicker);
    
    // Programmatically open the calendar after a short delay to ensure DOM is ready
    setTimeout(() => {
      const iconButton = datePicker.querySelector('.plus-date-picker-icon-button');
      if (iconButton && calendarContainer) {
        calendarContainer.style.display = 'block';
        calendarContainer.style.position = 'relative';
        calendarContainer.style.top = 'auto';
        calendarContainer.style.left = 'auto';
        calendarContainer.style.margin = '0 auto';
      }
    }, 100);
    
    return container;
  },
};


