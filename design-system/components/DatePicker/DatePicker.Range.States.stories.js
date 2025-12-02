/**
 * Date Picker Range States Stories
 * State variants for date range picker
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/DatePicker/Range/States',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'State variants for date range picker: First Date (start date selected), Second Date (end date selected), and closed (both dates selected).',
      },
    },
  },
};

/**
 * First Date
 * Range picker with only the start date selected
 */
export const FirstDate = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.maxWidth = '600px';
    
    const label = document.createElement('div');
    label.className = 'body2-txt';
    label.textContent = 'Date Range Picker (First Date Selected)';
    label.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(label);
    
    // Create range picker with two date pickers
    const rangeContainer = document.createElement('div');
    rangeContainer.style.display = 'flex';
    rangeContainer.style.alignItems = 'center';
    rangeContainer.style.gap = 'var(--size-element-gap-sm)';
    
    const startPicker = PlusInterface.createDatePicker({
      id: 'range-states-start-first',
      placeholder: 'Select Date',
      size: 'medium',
      value: '2025-03-26'
    });
    rangeContainer.appendChild(startPicker);
    
    const toLabel = document.createElement('div');
    toLabel.className = 'body2-txt';
    toLabel.textContent = 'to';
    toLabel.style.color = 'var(--color-on-surface)';
    rangeContainer.appendChild(toLabel);
    
    const endPicker = PlusInterface.createDatePicker({
      id: 'range-states-end-first',
      placeholder: 'Select Date',
      size: 'medium'
    });
    rangeContainer.appendChild(endPicker);
    
    container.appendChild(rangeContainer);
    
    return container;
  },
};

/**
 * Second Date
 * Range picker with both start and end dates selected
 */
export const SecondDate = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.maxWidth = '600px';
    
    const label = document.createElement('div');
    label.className = 'body2-txt';
    label.textContent = 'Date Range Picker (Second Date Selected)';
    label.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(label);
    
    // Create range picker with two date pickers
    const rangeContainer = document.createElement('div');
    rangeContainer.style.display = 'flex';
    rangeContainer.style.alignItems = 'center';
    rangeContainer.style.gap = 'var(--size-element-gap-sm)';
    
    const startPicker = PlusInterface.createDatePicker({
      id: 'range-states-start-second',
      placeholder: 'Select Date',
      size: 'medium',
      value: '2025-03-17'
    });
    rangeContainer.appendChild(startPicker);
    
    const toLabel = document.createElement('div');
    toLabel.className = 'body2-txt';
    toLabel.textContent = 'to';
    toLabel.style.color = 'var(--color-on-surface)';
    rangeContainer.appendChild(toLabel);
    
    const endPicker = PlusInterface.createDatePicker({
      id: 'range-states-end-second',
      placeholder: 'Select Date',
      size: 'medium',
      value: '2025-03-31'
    });
    rangeContainer.appendChild(endPicker);
    
    container.appendChild(rangeContainer);
    
    return container;
  },
};

/**
 * Closed
 * Range picker with both dates selected (range is complete)
 */
export const Closed = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.maxWidth = '600px';
    
    const label = document.createElement('div');
    label.className = 'body2-txt';
    label.textContent = 'Date Range Picker (Closed - Both Dates Selected)';
    label.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(label);
    
    // Create range picker with two date pickers
    const rangeContainer = document.createElement('div');
    rangeContainer.style.display = 'flex';
    rangeContainer.style.alignItems = 'center';
    rangeContainer.style.gap = 'var(--size-element-gap-sm)';
    
    const startPicker = PlusInterface.createDatePicker({
      id: 'range-states-start-closed',
      placeholder: 'Select Date',
      size: 'medium',
      value: '2025-03-17'
    });
    rangeContainer.appendChild(startPicker);
    
    const toLabel = document.createElement('div');
    toLabel.className = 'body2-txt';
    toLabel.textContent = 'to';
    toLabel.style.color = 'var(--color-on-surface)';
    rangeContainer.appendChild(toLabel);
    
    const endPicker = PlusInterface.createDatePicker({
      id: 'range-states-end-closed',
      placeholder: 'Select Date',
      size: 'medium',
      value: '2025-03-31'
    });
    rangeContainer.appendChild(endPicker);
    
    container.appendChild(rangeContainer);
    
    return container;
  },
};

/**
 * All States
 * Shows all range picker states together for comparison
 */
export const AllStates = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.maxWidth = '800px';
    
    const states = [
      { name: 'First Date', startValue: '2025-03-26', endValue: null },
      { name: 'Second Date', startValue: '2025-03-17', endValue: '2025-03-31' },
      { name: 'Closed', startValue: '2025-03-17', endValue: '2025-03-31' },
    ];
    
    states.forEach((state, index) => {
      const stateWrapper = document.createElement('div');
      stateWrapper.style.display = 'flex';
      stateWrapper.style.flexDirection = 'column';
      stateWrapper.style.gap = 'var(--size-element-gap-xs)';
      
      const stateLabel = document.createElement('div');
      stateLabel.className = 'body2-txt';
      stateLabel.textContent = `Date Range Picker (${state.name})`;
      stateLabel.style.marginBottom = 'var(--size-element-gap-sm)';
      stateWrapper.appendChild(stateLabel);
      
      const rangeContainer = document.createElement('div');
      rangeContainer.style.display = 'flex';
      rangeContainer.style.alignItems = 'center';
      rangeContainer.style.gap = 'var(--size-element-gap-sm)';
      
      const startPicker = PlusInterface.createDatePicker({
        id: `range-states-all-start-${index}`,
        placeholder: 'Select Date',
        size: 'medium',
        value: state.startValue
      });
      rangeContainer.appendChild(startPicker);
      
      const toLabel = document.createElement('div');
      toLabel.className = 'body2-txt';
      toLabel.textContent = 'to';
      toLabel.style.color = 'var(--color-on-surface)';
      rangeContainer.appendChild(toLabel);
      
      const endPicker = PlusInterface.createDatePicker({
        id: `range-states-all-end-${index}`,
        placeholder: 'Select Date',
        size: 'medium',
        value: state.endValue
      });
      rangeContainer.appendChild(endPicker);
      
      stateWrapper.appendChild(rangeContainer);
      container.appendChild(stateWrapper);
    });
    
    return container;
  },
};


