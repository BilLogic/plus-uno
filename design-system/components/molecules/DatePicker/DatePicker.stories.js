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
 * See docs/guidelines/terminology.md for Element Component Guidelines
 * See docs/guidelines/token-reference.md for Token Reference
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/DatePicker',
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
 * All Variants
 * Shows all date picker sizes and states
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.maxWidth = '600px';
    
    const sizes = [
      { value: 'small', label: 'Small' },
      { value: 'medium', label: 'Medium' },
      { value: 'large', label: 'Large' },
    ];
    
    sizes.forEach((size) => {
      const sizeSection = document.createElement('div');
      sizeSection.style.display = 'flex';
      sizeSection.style.flexDirection = 'column';
      sizeSection.style.gap = 'var(--size-element-gap-md)';
      
      const sizeLabel = document.createElement('div');
      sizeLabel.className = 'h6';
      sizeLabel.textContent = `${size.label} Size`;
      sizeLabel.style.marginBottom = 'var(--size-element-gap-sm)';
      sizeSection.appendChild(sizeLabel);
      
      // Default state
      const defaultWrapper = document.createElement('div');
      defaultWrapper.style.display = 'flex';
      defaultWrapper.style.flexDirection = 'column';
      defaultWrapper.style.gap = 'var(--size-element-gap-xs)';
      
      const defaultLabel = document.createElement('label');
      defaultLabel.className = 'body2-txt';
      defaultLabel.textContent = 'Default';
      defaultLabel.setAttribute('for', `datepicker-${size.value}-default`);
      defaultWrapper.appendChild(defaultLabel);
      
      const defaultPicker = PlusInterface.createDatePicker({
        id: `datepicker-${size.value}-default`,
        placeholder: 'Select date',
        size: size.value
      });
      defaultWrapper.appendChild(defaultPicker);
      sizeSection.appendChild(defaultWrapper);
      
      // With value state
      const valueWrapper = document.createElement('div');
      valueWrapper.style.display = 'flex';
      valueWrapper.style.flexDirection = 'column';
      valueWrapper.style.gap = 'var(--size-element-gap-xs)';
      
      const valueLabel = document.createElement('label');
      valueLabel.className = 'body2-txt';
      valueLabel.textContent = 'With Value';
      valueLabel.setAttribute('for', `datepicker-${size.value}-value`);
      valueWrapper.appendChild(valueLabel);
      
      const valuePicker = PlusInterface.createDatePicker({
        id: `datepicker-${size.value}-value`,
        placeholder: 'Select date',
        size: size.value,
        value: '2024-01-15'
      });
      valueWrapper.appendChild(valuePicker);
      sizeSection.appendChild(valueWrapper);
      
      container.appendChild(sizeSection);
    });
    
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

