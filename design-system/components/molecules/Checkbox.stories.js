/**
 * Checkbox Molecule Stories
 * 
 * ## Usage and Implementation
 * 
 * Checkboxes are **Element** components used for selecting one or more options from a set.
 * They allow users to make multiple selections and are commonly used in forms and filters.
 * 
 * ### When to Use
 * - **Multiple selections**: When users can select multiple options
 * - **Form inputs**: For form fields requiring yes/no or multiple choice answers
 * - **Filters**: For filtering content by multiple criteria
 * - **Settings**: For enabling/disabling multiple features or options
 * - **Agreements**: For terms of service, privacy policy acceptance
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
 * - **Checked**: Selected state (checkbox is marked)
 * - **Unchecked**: Unselected state (default)
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
 * See docs/guidelines/terminology.md for Element Component Guidelines
 * See docs/guidelines/token-reference.md for Token Reference
 */

import { PlusInterface } from '@/js/components/index.js';

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
  },
  args: {
    label: 'Interactive checkbox',
    name: 'interactive',
    value: 'value',
    id: 'checkbox-interactive',
    checked: false,
  },
};
