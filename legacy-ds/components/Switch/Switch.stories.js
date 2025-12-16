/**
 * Switch Molecule Stories
 * 
 * ## Usage and Implementation
 * 
 * Switches are **Element** components used for toggling between two states (on/off, enabled/disabled).
 * They provide immediate visual feedback and are commonly used for settings and preferences.
 * 
 * ### When to Use
 * - **Binary states**: When toggling between two states (on/off, enabled/disabled, yes/no)
 * - **Settings**: For enabling/disabling features or options that take effect immediately (e.g., "Enable notifications", "Dark mode")
 * - **Preferences**: For user preference toggles that apply instantly (e.g., "Auto-save", "Email notifications")
 * - **Immediate action**: When the action takes effect immediately without requiring form submission
 * - **Simple on/off**: For simple binary choices where the state is clear (enabled/disabled, active/inactive)
 * - **Settings panels**: In settings or configuration screens where multiple toggles are grouped
 * - **Feature flags**: For enabling/disabling features that users can toggle on and off
 * 
 * ### When NOT to Use
 * - **Multiple options**: Use radio buttons for multiple mutually exclusive options
 * - **Multiple selections**: Use checkboxes when multiple selections are allowed
 * - **Form submission**: Use checkboxes or radio buttons when selection requires form submission
 * - **Complex states**: Use dropdowns or other controls for complex state management
 * - **Single choice from many**: Use radio buttons or dropdowns when selecting one option from many
 * - **Delayed actions**: If the action requires confirmation or doesn't take effect immediately, consider checkboxes
 * 
 * ### Implementation Context
 * - **Component Type**: Element (uses `element-*` tokens)
 * - **Token Usage**: 
 *   - Gap: `--size-element-gap-sm` (between switch and label)
 *   - Border: `--size-element-stroke-md`
 *   - Radius: `--size-border-radius-radius-1000` (pill shape)
 *   - Colors: `--color-primary` for checked, `--color-outline-variant` for unchecked
 *   - Typography: Uses body typography scales for labels
 * 
 * ### State Variants
 * - **Checked**: On state (switch is enabled)
 * - **Unchecked**: Off state (switch is disabled)
 * - **Disabled**: Non-interactive state (read-only or unavailable)
 * 
 * ### Content Variants
 * - **Single switch**: Standalone switch with label
 * - **Switch group**: Multiple related switches grouped together
 * - **Settings panel**: Multiple switches in a settings interface
 * 
 * ### Best Practices
 * - Always include clear, descriptive labels
 * - Use switches for immediate actions that take effect right away
 * - Provide clear visual feedback for on/off states
 * - Use disabled state for unavailable options
 * - Group related switches together logically
 * - Ensure sufficient spacing between switches
 * - Use consistent sizing within a form or section
 * - Label should clearly indicate what the switch controls
 * 
 * See design-system/components/overview.md for Element Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Switch',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Switch component for toggling between two states. Includes input and label combination with on/off states. Uses element-level tokens for spacing.',
      },
    },
  },
};

/**
 * Overview
 * Shows all switch variants organized by category in a scrollable format
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    // States Section
    const statesSection = document.createElement('div');
    statesSection.style.display = 'flex';
    statesSection.style.flexDirection = 'column';
    statesSection.style.gap = 'var(--size-card-gap-md)';
    
    const statesHeading = document.createElement('div');
    statesHeading.className = 'h5';
    statesHeading.textContent = 'States';
    statesHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    statesSection.appendChild(statesHeading);
    
    const statesRow = document.createElement('div');
    statesRow.style.display = 'flex';
    statesRow.style.flexDirection = 'column';
    statesRow.style.gap = 'var(--size-element-gap-sm)';
    
    const checked = PlusInterface.createSwitch({
      label: 'Checked',
      name: 'overview-switch',
      id: 'overview-checked',
      checked: true,
    });
    statesRow.appendChild(checked);
    
    const unchecked = PlusInterface.createSwitch({
      label: 'Unchecked',
      name: 'overview-switch',
      id: 'overview-unchecked',
      checked: false,
    });
    statesRow.appendChild(unchecked);
    
    const disabled = PlusInterface.createSwitch({
      label: 'Disabled',
      name: 'overview-switch',
      id: 'overview-disabled',
      checked: false,
      disabled: true,
    });
    statesRow.appendChild(disabled);
    
    statesSection.appendChild(statesRow);
    container.appendChild(statesSection);
    
    // Content Section
    const contentSection = document.createElement('div');
    contentSection.style.display = 'flex';
    contentSection.style.flexDirection = 'column';
    contentSection.style.gap = 'var(--size-card-gap-md)';
    
    const contentHeading = document.createElement('div');
    contentHeading.className = 'h5';
    contentHeading.textContent = 'Content';
    contentHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    contentSection.appendChild(contentHeading);
    
    const contentRow = document.createElement('div');
    contentRow.style.display = 'flex';
    contentRow.style.flexDirection = 'column';
    contentRow.style.gap = 'var(--size-element-gap-md)';
    
    const switch1 = PlusInterface.createSwitch({
      label: 'Email notifications',
      name: 'overview-content',
      id: 'overview-content-1',
      checked: true,
    });
    contentRow.appendChild(switch1);
    
    const switch2 = PlusInterface.createSwitch({
      label: 'Push notifications',
      name: 'overview-content',
      id: 'overview-content-2',
      checked: false,
    });
    contentRow.appendChild(switch2);
    
    contentSection.appendChild(contentRow);
    container.appendChild(contentSection);
    
    return container;
  },
};

export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    const switchEl = PlusInterface.createSwitch(args);
    container.appendChild(switchEl);
    return container;
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Switch label',
    },
    name: {
      control: 'text',
      description: 'Input name attribute',
    },
    checked: {
      control: 'boolean',
      description: 'Checked (on) state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
  },
  args: {
    label: 'Interactive switch',
    name: 'interactive',
    id: 'switch-interactive',
    checked: false,
    disabled: false,
  },
};

