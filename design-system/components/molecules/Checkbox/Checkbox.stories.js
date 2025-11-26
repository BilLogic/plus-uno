/**
 * Checkbox Molecule Stories
 * 
 * ## Usage and Implementation
 * 
 * Checkboxes are **Element** components used for selecting one or more options from a set.
 * They allow users to make multiple selections and are commonly used in forms and filters.
 * 
 * ### When to Use
 * - **Multiple selections**: When users can select multiple options from a set
 * - **Form inputs**: For form fields requiring yes/no or multiple choice answers
 * - **Filters**: For filtering content by multiple criteria (e.g., filter by multiple categories)
 * - **Settings**: For enabling/disabling multiple features or options simultaneously
 * - **Agreements**: For terms of service, privacy policy acceptance, or consent checkboxes
 * - **Lists with multiple items**: When users need to select several items from a list
 * - **Bulk actions**: For selecting multiple items to perform actions on
 * 
 * ### When NOT to Use
 * - **Single selection**: Use radio buttons when only one option can be selected
 * - **Binary toggle**: Use switches for simple on/off states that take effect immediately
 * - **Many options**: Consider using a multi-select dropdown when there are many options (>10)
 * 
 * ### Implementation Context
 * - **Component Type**: Element (uses `element-` tokens)
 * - **Token Usage**: 
 *   - Gap: `--size-element-gap-sm/md/lg` (between checkbox and label)
 *   - Spacing: `--size-element-gap-md` (between checkbox groups)
 *   - Colors: `--color-primary` for checked state, `--color-outline-variant` for unchecked
 *   - Typography: Uses body typography scales for labels
 * 
 * ### State Variants
 * - **Checked**: Selected state (checkbox is marked with checkmark)
 * - **Unchecked**: Unselected state (default)
 * - **Indeterminate**: Partially selected state (shows dash/minus, used when some items in a group are selected)
 * - **Disabled**: Non-interactive state (read-only or unavailable)
 * 
 * ### Content Variants
 * - **Single checkbox**: Standalone checkbox with label
 * - **Checkbox group**: Multiple related checkboxes grouped together
 * - **Multiple groups**: Several checkbox groups for different categories
 * 
 * ### Best Practices
 * - Always include clear, descriptive labels
 * - Use checkbox groups for related options
 * - Provide clear visual feedback for checked/unchecked states
 * - Use disabled state for unavailable options
 * - Group related checkboxes together logically
 * - Ensure sufficient spacing between groups
 * - Use consistent sizing within a form or section
 * 
 * See design-system/components/overview.md for Element Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 */

import { PlusInterface } from '../../index.js';

export default {
  title: 'Molecules/Checkbox',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Checkbox component for selecting multiple options. Includes input and label combination with checked/unchecked states. Uses element-level tokens for spacing.',
      },
    },
  },
};

/**
 * All Variants
 * Shows all checkbox combinations: states and content variants
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    // States
    const statesSection = document.createElement('div');
    statesSection.style.display = 'flex';
    statesSection.style.flexDirection = 'column';
    statesSection.style.gap = 'var(--size-element-gap-sm)';
    
    const statesLabel = document.createElement('div');
    statesLabel.className = 'h6';
    statesLabel.textContent = 'States';
    statesLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    statesSection.appendChild(statesLabel);
    
    const checked = PlusInterface.createCheckbox({
      label: 'Checked checkbox',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-checked',
      checked: true,
    });
    statesSection.appendChild(checked);
    
    const unchecked = PlusInterface.createCheckbox({
      label: 'Unchecked checkbox',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-unchecked',
      checked: false,
    });
    statesSection.appendChild(unchecked);
    
    const indeterminate = PlusInterface.createCheckbox({
      label: 'Indeterminate checkbox (dash/minus)',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-indeterminate',
      checked: false,
      indeterminate: true,
    });
    statesSection.appendChild(indeterminate);
    
    container.appendChild(statesSection);
    
    return container;
  },
};

/**
 * Interactive Checkbox
 * Interactive playground for testing checkbox variations
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    const checkbox = PlusInterface.createCheckbox(args);
    container.appendChild(checkbox);
    return container;
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Checkbox label',
    },
    name: {
      control: 'text',
      description: 'Input name attribute',
    },
    value: {
      control: 'text',
      description: 'Input value attribute',
    },
    checked: {
      control: 'boolean',
      description: 'Checked state',
    },
    indeterminate: {
      control: 'boolean',
      description: 'Indeterminate state (shows dash/minus instead of checkmark)',
    },
  },
  args: {
    label: 'Interactive checkbox',
    name: 'interactive',
    value: 'value',
    id: 'checkbox-interactive',
    checked: false,
  },
};
