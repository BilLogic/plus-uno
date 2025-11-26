/**
 * Date Picker Content Variants Stories
 * Content-based variants organized under "Content Variants" subcategory
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/DatePicker/Content Variants',
  tags: ['autodocs'],
};

/**
 * With Min/Max Date Constraints
 * Shows date picker with minimum and maximum date constraints
 */
export const WithDateConstraints = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.maxWidth = '600px';
    
    // Min date example
    const minWrapper = document.createElement('div');
    minWrapper.style.display = 'flex';
    minWrapper.style.flexDirection = 'column';
    minWrapper.style.gap = 'var(--size-element-gap-xs)';
    
    const minLabel = document.createElement('label');
    minLabel.className = 'body2-txt';
    minLabel.textContent = 'With Minimum Date (Today)';
    minLabel.setAttribute('for', 'datepicker-min');
    minWrapper.appendChild(minLabel);
    
    const minPicker = PlusInterface.createDatePicker({
      id: 'datepicker-min',
      placeholder: 'Select date',
      size: 'medium',
      minDate: new Date()
    });
    minWrapper.appendChild(minPicker);
    container.appendChild(minWrapper);
    
    // Max date example
    const maxWrapper = document.createElement('div');
    maxWrapper.style.display = 'flex';
    maxWrapper.style.flexDirection = 'column';
    maxWrapper.style.gap = 'var(--size-element-gap-xs)';
    
    const maxLabel = document.createElement('label');
    maxLabel.className = 'body2-txt';
    maxLabel.textContent = 'With Maximum Date (30 days from today)';
    maxLabel.setAttribute('for', 'datepicker-max');
    maxWrapper.appendChild(maxLabel);
    
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    const maxPicker = PlusInterface.createDatePicker({
      id: 'datepicker-max',
      placeholder: 'Select date',
      size: 'medium',
      maxDate: maxDate
    });
    maxWrapper.appendChild(maxPicker);
    container.appendChild(maxWrapper);
    
    // Min and max date example
    const rangeWrapper = document.createElement('div');
    rangeWrapper.style.display = 'flex';
    rangeWrapper.style.flexDirection = 'column';
    rangeWrapper.style.gap = 'var(--size-element-gap-xs)';
    
    const rangeLabel = document.createElement('label');
    rangeLabel.className = 'body2-txt';
    rangeLabel.textContent = 'With Date Range (Next 7 days)';
    rangeLabel.setAttribute('for', 'datepicker-range');
    rangeWrapper.appendChild(rangeLabel);
    
    const rangeMin = new Date();
    const rangeMax = new Date();
    rangeMax.setDate(rangeMax.getDate() + 7);
    const rangePicker = PlusInterface.createDatePicker({
      id: 'datepicker-range',
      placeholder: 'Select date',
      size: 'medium',
      minDate: rangeMin,
      maxDate: rangeMax
    });
    rangeWrapper.appendChild(rangePicker);
    container.appendChild(rangeWrapper);
    
    return container;
  },
};

/**
 * Calendar Alignment
 * Shows date picker with different calendar alignment options
 */
export const CalendarAlignment = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.maxWidth = '600px';
    
    const alignments = [
      { value: 'left', label: 'Left Aligned' },
      { value: 'center', label: 'Center Aligned' },
      { value: 'right', label: 'Right Aligned' },
    ];
    
    alignments.forEach((alignment, index) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.gap = 'var(--size-element-gap-xs)';
      
      const label = document.createElement('label');
      label.className = 'body2-txt';
      label.textContent = alignment.label;
      label.setAttribute('for', `datepicker-align-${index}`);
      wrapper.appendChild(label);
      
      const picker = PlusInterface.createDatePicker({
        id: `datepicker-align-${index}`,
        placeholder: 'Select date',
        size: 'medium',
        calendarAlign: alignment.value
      });
      wrapper.appendChild(picker);
      container.appendChild(wrapper);
    });
    
    return container;
  },
};

/**
 * With Custom Placeholder
 * Shows date picker with custom placeholder text
 */
export const WithCustomPlaceholder = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.maxWidth = '600px';
    
    const examples = [
      { placeholder: 'Select date', label: 'Default placeholder' },
      { placeholder: 'Choose appointment date', label: 'Custom placeholder' },
      { placeholder: 'MM/DD/YYYY', label: 'Format hint placeholder' },
    ];
    
    examples.forEach((example, index) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.gap = 'var(--size-element-gap-xs)';
      
      const label = document.createElement('label');
      label.className = 'body2-txt';
      label.textContent = example.label;
      label.setAttribute('for', `datepicker-placeholder-${index}`);
      wrapper.appendChild(label);
      
      const picker = PlusInterface.createDatePicker({
        id: `datepicker-placeholder-${index}`,
        placeholder: example.placeholder,
        size: 'medium'
      });
      wrapper.appendChild(picker);
      container.appendChild(wrapper);
    });
    
    return container;
  },
};

