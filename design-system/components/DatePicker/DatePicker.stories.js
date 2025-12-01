/**
 * Date Picker Molecule Stories
 * 
 * ## Usage and Implementation
 * 
 * Date pickers are **Element** components used for selecting dates through a calendar interface.
 * They provide a text input field with a calendar icon that opens a popup calendar for date selection.
 * 
 * ### When to Use
 * - **Date selection**: When users need to select a specific date (birthday, appointment, deadline, etc.)
 * - **Form inputs**: For date fields in forms and data entry interfaces
 * - **Scheduling**: For scheduling features, calendar bookings, and time-based selections
 * - **Date filtering**: For filtering content by date ranges
 * - **Event creation**: When creating events, sessions, or time-based activities
 * 
 * ### When NOT to Use
 * - **Time selection only**: Use time inputs for time-only selection (without date)
 * - **Date display only**: Use text or formatted date display for read-only dates
 * - **Complex date ranges**: Consider dedicated date range picker for start/end date pairs
 * - **Frequent date entry**: For high-frequency date entry, consider keyboard-optimized inputs
 * 
 * ### Implementation Context
 * - **Component Type**: Element (uses `element-*` tokens for input, `modal-*` tokens for calendar)
 * - **Token Usage**: 
 *   - Input: `--size-element-pad-*`, `--size-element-gap-*`, `--size-element-radius-*`
 *   - Calendar: `--size-modal-pad-*`, `--size-modal-gap-*`, `--size-modal-radius-*`
 *   - Colors: `--color-outline-variant` for borders, `--color-on-surface` for text
 *   - Typography: Uses Body/B1/B2/B3 based on size
 * 
 * ### Size Variants
 * - **small**: 12px text (B3), smaller padding - Use in compact interfaces or secondary forms
 * - **medium**: 14px text (B2), default padding - Standard size for most use cases
 * - **large**: 16px text (B1), larger padding - Use for prominent date selection or accessibility
 * 
 * ### State Variants
 * - **default**: Normal state ready for date selection
 * - **with value**: Date picker with a selected date displayed
 * - **disabled**: Non-interactive date picker (unavailable dates or locked fields)
 * - **read-only**: Read-only date picker showing existing value (no calendar icon)
 * 
 * ### Features
 * - **Calendar popup**: Click calendar icon to open month view calendar
 * - **Month navigation**: Previous/next month buttons for navigation
 * - **Today indicator**: Current date highlighted with border
 * - **Selected date**: Selected date highlighted with primary color
 * - **Date constraints**: Support for min/max date limits
 * - **Keyboard input**: Direct date entry via keyboard (YYYY-MM-DD format)
 * - **Accessibility**: ARIA labels and keyboard navigation support
 * 
 * ### Best Practices
 * - **Always include labels**: Use labels above date pickers with `element-gap-xs` spacing
 * - **Clear placeholders**: Provide descriptive placeholder text (e.g., "Select appointment date")
 * - **Date constraints**: Set min/max dates to prevent invalid selections when appropriate
 * - **Size selection**: Match date picker size to surrounding form elements
 * - **Disabled states**: Use disabled state for unavailable or locked date fields
 * - **Read-only display**: Use read-only state when showing dates that cannot be changed
 * - **Calendar positioning**: Calendar popup automatically positions below input
 * - **Click outside to close**: Calendar closes when clicking outside the component
 * 
 * ### Accessibility
 * - Input field supports keyboard entry and navigation
 * - Calendar icon button has ARIA label for screen readers
 * - Calendar navigation buttons have ARIA labels
 * - Selected and today dates have visual indicators
 * - Disabled dates are clearly indicated and non-interactive
 * 
 * See design-system/components/overview.md for Element Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/DatePicker',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Date picker component for selecting dates. Includes a text input with calendar icon that opens a popup calendar. Uses element tokens for input and modal tokens for calendar popup.',
      },
    },
  },
};

/**
 * Overview
 * Shows all date picker variants organized by category
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.maxWidth = '800px';
    
    // Date Item Section
    const dateItemSection = document.createElement('div');
    dateItemSection.style.display = 'flex';
    dateItemSection.style.flexDirection = 'column';
    dateItemSection.style.gap = 'var(--size-element-gap-md)';
    
    const dateItemHeading = document.createElement('div');
    dateItemHeading.className = 'h6';
    dateItemHeading.textContent = 'Date Item';
    dateItemHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    dateItemSection.appendChild(dateItemHeading);
    
    const dateItemStates = document.createElement('div');
    dateItemStates.style.display = 'flex';
    dateItemStates.style.flexWrap = 'wrap';
    dateItemStates.style.gap = 'var(--size-card-gap-md)';
    
    ['Rest', 'Hover', 'Pressed', 'Disabled'].forEach((state, index) => {
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
      
      if (state === 'Hover') {
        dateItem.style.backgroundColor = 'var(--color-primary-state-08)';
        dateItem.style.color = 'var(--color-primary)';
      } else if (state === 'Pressed') {
        dateItem.classList.add('plus-date-picker-calendar-day-selected');
      } else if (state === 'Disabled') {
        dateItem.classList.add('plus-date-picker-calendar-day-disabled');
        dateItem.disabled = true;
      }
      
      dateItemStates.appendChild(dateItem);
    });
    dateItemSection.appendChild(dateItemStates);
    container.appendChild(dateItemSection);
    
    // Calendar Item Section
    const calendarSection = document.createElement('div');
    calendarSection.style.display = 'flex';
    calendarSection.style.flexDirection = 'column';
    calendarSection.style.gap = 'var(--size-element-gap-md)';
    
    const calendarHeading = document.createElement('div');
    calendarHeading.className = 'h6';
    calendarHeading.textContent = 'Calendar Item';
    calendarHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    calendarSection.appendChild(calendarHeading);
    
    const calendarPicker = PlusInterface.createDatePicker({
      id: 'overview-calendar',
      placeholder: 'Select date',
      size: 'medium',
      value: '2025-03-19'
    });
    const calendarContainer = calendarPicker.querySelector('.plus-date-picker-calendar');
    if (calendarContainer) {
      calendarContainer.style.display = 'block';
      calendarContainer.style.position = 'relative';
      calendarContainer.style.top = 'auto';
      calendarContainer.style.left = 'auto';
      calendarContainer.style.margin = '0';
      calendarContainer.style.width = '280px';
    }
    const inputWrapper = calendarPicker.querySelector('.plus-date-picker-input-wrapper');
    if (inputWrapper) {
      inputWrapper.style.display = 'none';
    }
    calendarSection.appendChild(calendarPicker);
    container.appendChild(calendarSection);
    
    // Single Date Section
    const singleDateSection = document.createElement('div');
    singleDateSection.style.display = 'flex';
    singleDateSection.style.flexDirection = 'column';
    singleDateSection.style.gap = 'var(--size-element-gap-md)';
    
    const singleDateHeading = document.createElement('div');
    singleDateHeading.className = 'h6';
    singleDateHeading.textContent = 'Single Date';
    singleDateHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    singleDateSection.appendChild(singleDateHeading);
    
    const singleDateStates = [
      { name: 'Empty', value: null },
      { name: 'Filled', value: '2025-03-31' },
      { name: 'Selected', value: '2025-03-31' },
    ];
    
    singleDateStates.forEach((state, index) => {
      const stateWrapper = document.createElement('div');
      stateWrapper.style.display = 'flex';
      stateWrapper.style.flexDirection = 'column';
      stateWrapper.style.gap = 'var(--size-element-gap-xs)';
      
      const stateLabel = document.createElement('label');
      stateLabel.className = 'body2-txt';
      stateLabel.textContent = state.name;
      stateLabel.setAttribute('for', `overview-single-${index}`);
      stateWrapper.appendChild(stateLabel);
      
      const datePicker = PlusInterface.createDatePicker({
        id: `overview-single-${index}`,
        placeholder: 'Select Date',
        size: 'medium',
        value: state.value
      });
      stateWrapper.appendChild(datePicker);
      
      singleDateSection.appendChild(stateWrapper);
    });
    container.appendChild(singleDateSection);
    
    // Range Section
    const rangeSection = document.createElement('div');
    rangeSection.style.display = 'flex';
    rangeSection.style.flexDirection = 'column';
    rangeSection.style.gap = 'var(--size-element-gap-md)';
    
    const rangeHeading = document.createElement('div');
    rangeHeading.className = 'h6';
    rangeHeading.textContent = 'Range';
    rangeHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    rangeSection.appendChild(rangeHeading);
    
    const rangeStates = [
      { name: 'First Date', startValue: '2025-03-26', endValue: null },
      { name: 'Second Date', startValue: '2025-03-17', endValue: '2025-03-31' },
    ];
    
    rangeStates.forEach((state, index) => {
      const stateWrapper = document.createElement('div');
      stateWrapper.style.display = 'flex';
      stateWrapper.style.flexDirection = 'column';
      stateWrapper.style.gap = 'var(--size-element-gap-xs)';
      
      const stateLabel = document.createElement('div');
      stateLabel.className = 'body2-txt';
      stateLabel.textContent = state.name;
      stateWrapper.appendChild(stateLabel);
      
      const rangeContainer = document.createElement('div');
      rangeContainer.style.display = 'flex';
      rangeContainer.style.alignItems = 'center';
      rangeContainer.style.gap = 'var(--size-element-gap-sm)';
      
      const startPicker = PlusInterface.createDatePicker({
        id: `overview-range-start-${index}`,
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
        id: `overview-range-end-${index}`,
        placeholder: 'Select Date',
        size: 'medium',
        value: state.endValue
      });
      rangeContainer.appendChild(endPicker);
      
      stateWrapper.appendChild(rangeContainer);
      rangeSection.appendChild(stateWrapper);
    });
    container.appendChild(rangeSection);
    
    return container;
  },
};

/**
 * Interactive Date Picker
 * Interactive playground for testing date picker variations
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.maxWidth = '400px';
    
    const label = document.createElement('label');
    label.className = 'body2-txt';
    label.textContent = 'Date Picker';
    label.setAttribute('for', 'interactive-datepicker');
    container.appendChild(label);
    
    const datePicker = PlusInterface.createDatePicker({
      id: 'interactive-datepicker',
      ...args
    });
    container.appendChild(datePicker);
    
    return container;
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Date picker size',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    value: {
      control: 'text',
      description: 'Initial date value (YYYY-MM-DD format)',
    },
    calendarAlign: {
      control: 'select',
      options: ['left', 'center', 'right'],
      description: 'Calendar alignment relative to input',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the date picker is disabled',
    },
    readonly: {
      control: 'boolean',
      description: 'Whether the date picker is read-only',
    },
  },
  args: {
    size: 'medium',
    placeholder: 'Select date',
    value: '',
    calendarAlign: 'left',
    disabled: false,
    readonly: false,
  },
};

