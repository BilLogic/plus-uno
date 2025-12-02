/**
 * Date Picker Date Item States Stories
 * State variants for individual date cells in the calendar
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/DatePicker/Date Item/States',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'State variants for individual date cells within the calendar: rest (default), hover, pressed, and disabled.',
      },
    },
  },
};

/**
 * Rest
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

/**
 * All States
 * Shows all date item states together for comparison
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
      { name: 'Rest (Default)', classes: [], styles: {} },
      { name: 'Hover', classes: [], styles: { backgroundColor: 'var(--color-primary-state-08)', color: 'var(--color-primary)' } },
      { name: 'Pressed', classes: ['plus-date-picker-calendar-day-selected'], styles: {} },
      { name: 'Disabled', classes: ['plus-date-picker-calendar-day-disabled'], styles: {}, disabled: true },
    ];
    
    const statesContainer = document.createElement('div');
    statesContainer.style.display = 'flex';
    statesContainer.style.flexWrap = 'wrap';
    statesContainer.style.gap = 'var(--size-card-gap-md)';
    statesContainer.style.alignItems = 'flex-start';
    
    states.forEach((state) => {
      const stateWrapper = document.createElement('div');
      stateWrapper.style.display = 'flex';
      stateWrapper.style.flexDirection = 'column';
      stateWrapper.style.gap = 'var(--size-element-gap-xs)';
      stateWrapper.style.alignItems = 'center';
      
      const stateLabel = document.createElement('div');
      stateLabel.className = 'body3-txt';
      stateLabel.textContent = state.name;
      stateLabel.style.color = 'var(--color-on-surface-variant)';
      stateWrapper.appendChild(stateLabel);
      
      const dateItem = document.createElement('button');
      dateItem.type = 'button';
      dateItem.classList.add('plus-date-picker-calendar-day');
      dateItem.classList.add('body2-txt');
      if (state.classes.length > 0) {
        dateItem.classList.add(...state.classes);
      }
      dateItem.textContent = '1';
      dateItem.style.width = '40px';
      dateItem.style.height = '40px';
      dateItem.style.display = 'inline-flex';
      dateItem.style.alignItems = 'center';
      dateItem.style.justifyContent = 'center';
      Object.assign(dateItem.style, state.styles);
      if (state.disabled) {
        dateItem.disabled = true;
      }
      
      stateWrapper.appendChild(dateItem);
      statesContainer.appendChild(stateWrapper);
    });
    
    container.appendChild(statesContainer);
    
    return container;
  },
};


