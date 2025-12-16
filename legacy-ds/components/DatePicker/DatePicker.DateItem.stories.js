/**
 * Date Picker Date Item Stories
 * Individual date cells in the calendar with different states
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/DatePicker/Date Item',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Individual date cells within the calendar. Shows different interactive states: rest (default), hover, pressed, and disabled.',
      },
    },
  },
};

/**
 * Rest (Default)
 * Default state of a date item
 */
export const Rest = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.maxWidth = '400px';
    
    const label = document.createElement('div');
    label.className = 'body2-txt';
    label.textContent = 'Date Item (Rest/Default)';
    label.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(label);
    
    // Create a calendar day element in rest state
    const dateItem = document.createElement('button');
    dateItem.type = 'button';
    dateItem.classList.add('plus-date-picker-calendar-day');
    dateItem.classList.add('body2-txt');
    dateItem.textContent = '1';
    dateItem.style.width = '40px';
    dateItem.style.height = '40px';
    dateItem.style.display = 'inline-flex';
    dateItem.style.alignItems = 'center';
    dateItem.style.justifyContent = 'center';
    
    container.appendChild(dateItem);
    
    return container;
  },
};

/**
 * Hover
 * Hover state of a date item
 */
export const Hover = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.maxWidth = '400px';
    
    const label = document.createElement('div');
    label.className = 'body2-txt';
    label.textContent = 'Date Item (Hover)';
    label.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(label);
    
    // Create a calendar day element in hover state
    const dateItem = document.createElement('button');
    dateItem.type = 'button';
    dateItem.classList.add('plus-date-picker-calendar-day');
    dateItem.classList.add('body2-txt');
    dateItem.textContent = '1';
    dateItem.style.width = '40px';
    dateItem.style.height = '40px';
    dateItem.style.display = 'inline-flex';
    dateItem.style.alignItems = 'center';
    dateItem.style.justifyContent = 'center';
    dateItem.style.backgroundColor = 'var(--color-primary-state-08)';
    dateItem.style.color = 'var(--color-primary)';
    
    container.appendChild(dateItem);
    
    return container;
  },
};

/**
 * Pressed
 * Pressed state of a date item
 */
export const Pressed = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.maxWidth = '400px';
    
    const label = document.createElement('div');
    label.className = 'body2-txt';
    label.textContent = 'Date Item (Pressed)';
    label.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(label);
    
    // Create a calendar day element in pressed state (selected state represents pressed)
    const dateItem = document.createElement('button');
    dateItem.type = 'button';
    dateItem.classList.add('plus-date-picker-calendar-day');
    dateItem.classList.add('plus-date-picker-calendar-day-selected');
    dateItem.classList.add('body2-txt');
    dateItem.textContent = '1';
    dateItem.style.width = '40px';
    dateItem.style.height = '40px';
    dateItem.style.display = 'inline-flex';
    dateItem.style.alignItems = 'center';
    dateItem.style.justifyContent = 'center';
    
    container.appendChild(dateItem);
    
    return container;
  },
};

/**
 * Disabled
 * Disabled state of a date item
 */
export const Disabled = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.maxWidth = '400px';
    
    const label = document.createElement('div');
    label.className = 'body2-txt';
    label.textContent = 'Date Item (Disabled)';
    label.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(label);
    
    // Create a calendar day element in disabled state
    const dateItem = document.createElement('button');
    dateItem.type = 'button';
    dateItem.classList.add('plus-date-picker-calendar-day');
    dateItem.classList.add('plus-date-picker-calendar-day-disabled');
    dateItem.classList.add('body2-txt');
    dateItem.textContent = '1';
    dateItem.disabled = true;
    dateItem.style.width = '40px';
    dateItem.style.height = '40px';
    dateItem.style.display = 'inline-flex';
    dateItem.style.alignItems = 'center';
    dateItem.style.justifyContent = 'center';
    
    container.appendChild(dateItem);
    
    return container;
  },
};


