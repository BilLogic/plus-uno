/**
 * Date Picker Calendar Stories
 * Calendar widget component shown as standalone for design reference
 */

import { PlusInterface } from '../../index.js';

export default {
  title: 'Molecules/DatePicker/Calendar',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Calendar widget component used within the date picker. Shows month view with navigation, weekday headers, and selectable dates. Can be used standalone for reference.',
      },
    },
  },
};

/**
 * Calendar Widget
 * Shows the calendar widget as it appears in the date picker popup
 */
export const CalendarWidget = {
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
    label.textContent = 'Calendar Widget (Standalone View)';
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

/**
 * Calendar with Selected Date
 * Shows calendar with a date selected (November 19, 2025)
 */
export const CalendarWithSelectedDate = {
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
    label.textContent = 'Calendar with Selected Date (Nov 19, 2025)';
    label.style.marginBottom = 'var(--size-element-gap-md)';
    label.style.color = 'var(--color-on-surface-variant)';
    container.appendChild(label);
    
    const datePicker = PlusInterface.createDatePicker({
      id: 'calendar-selected-demo',
      placeholder: 'Select date',
      size: 'medium',
      value: '2025-11-19'
    });
    
    const calendarContainer = datePicker.querySelector('.plus-date-picker-calendar');
    if (calendarContainer) {
      calendarContainer.style.display = 'block';
      calendarContainer.style.position = 'relative';
      calendarContainer.style.top = 'auto';
      calendarContainer.style.left = 'auto';
      calendarContainer.style.margin = '0 auto';
      calendarContainer.style.width = '280px';
    }
    
    const inputWrapper = datePicker.querySelector('.plus-date-picker-input-wrapper');
    if (inputWrapper) {
      inputWrapper.style.maxWidth = '300px';
      inputWrapper.style.marginBottom = 'var(--size-section-gap-md)';
    }
    
    container.appendChild(datePicker);
    
    // Open calendar after DOM is ready
    setTimeout(() => {
      if (calendarContainer) {
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

/**
 * Calendar with Date Range
 * Shows calendar with min/max date constraints
 */
export const CalendarWithDateRange = {
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
    label.textContent = 'Calendar with Date Range (Next 7 days)';
    label.style.marginBottom = 'var(--size-element-gap-md)';
    label.style.color = 'var(--color-on-surface-variant)';
    container.appendChild(label);
    
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    
    const datePicker = PlusInterface.createDatePicker({
      id: 'calendar-range-demo',
      placeholder: 'Select date',
      size: 'medium',
      minDate: today,
      maxDate: maxDate
    });
    
    const calendarContainer = datePicker.querySelector('.plus-date-picker-calendar');
    if (calendarContainer) {
      calendarContainer.style.display = 'block';
      calendarContainer.style.position = 'relative';
      calendarContainer.style.top = 'auto';
      calendarContainer.style.left = 'auto';
      calendarContainer.style.margin = '0 auto';
      calendarContainer.style.width = '280px';
    }
    
    const inputWrapper = datePicker.querySelector('.plus-date-picker-input-wrapper');
    if (inputWrapper) {
      inputWrapper.style.maxWidth = '300px';
      inputWrapper.style.marginBottom = 'var(--size-section-gap-md)';
    }
    
    container.appendChild(datePicker);
    
    // Open calendar after DOM is ready
    setTimeout(() => {
      if (calendarContainer) {
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

