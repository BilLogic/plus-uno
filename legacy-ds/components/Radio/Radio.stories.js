/**
 * Radio Molecule Stories
 * 
 * ## Usage and Implementation
 * 
 * Radio buttons are **Element** components used for selecting a single option from a set of mutually exclusive options.
 * They allow users to make one selection from multiple choices and are commonly used in forms.
 * 
 * ### When to Use
 * - **Single selection**: When users can select only one option from a set of mutually exclusive options
 * - **Form inputs**: For form fields requiring single choice answers (e.g., "Select your preferred contact method")
 * - **Settings**: For selecting one option from multiple settings (e.g., "Choose notification frequency")
 * - **Preferences**: For user preference selection where only one option applies
 * - **Mutually exclusive options**: When options cannot be selected together (e.g., "Select payment method")
 * - **Small option sets**: When there are 2-5 options that are all visible and important
 * - **Required choices**: When a selection is required and all options should be visible
 * 
 * ### When NOT to Use
 * - **Multiple selections**: Use checkboxes when multiple selections are allowed
 * - **Toggle on/off**: Use switches for binary on/off states that take effect immediately
 * - **Many options**: Use dropdowns when there are many options (>5) or limited space
 * - **Optional single choice**: Consider using a dropdown if the selection is optional and space is limited
 * 
 * ### Implementation Context
 * - **Component Type**: Element
 * - **Bootstrap Framework**: Uses Bootstrap 4.6.2's `form-check` pattern
 * - **Styling**: Currently uses Bootstrap's default styling (no custom overrides)
 * - **Reference**: https://getbootstrap.com/docs/4.6/components/forms/#radios
 * 
 * ### State Variants
 * - **Checked**: Selected state (radio is selected)
 * - **Unchecked**: Unselected state (default)
 * - **Disabled**: Non-interactive state (read-only or unavailable)
 * - **Focus**: Focused state with focus ring (keyboard navigation)
 * 
 * ### Content Variants
 * - **Single radio**: Standalone radio with label
 * - **Radio group**: Multiple related radios grouped together (same name attribute)
 * - **Multiple groups**: Several radio groups for different categories
 * 
 * ### Best Practices
 * - Always include clear, descriptive labels
 * - Use radio groups for related options (same name attribute)
 * - Provide clear visual feedback for checked/unchecked states
 * - Use disabled state for unavailable options
 * - Group related radios together logically
 * - Ensure sufficient spacing between groups
 * - Use consistent sizing within a form or section
 * - Always provide a default selection when appropriate
 * 
 * See design-system/components/overview.md for Element Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 */

import { PlusInterface } from "../index.js";
import { AllStates as RadioAllStates } from "./Radio.States.stories.js";
import { AllContent as RadioAllContent } from "./Radio.Content.stories.js";

export default {
  title: 'Components/Radio',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Radio button component for selecting a single option from a set. Built on Bootstrap 4.6.2 form-check pattern. Currently uses Bootstrap default styling.',
      },
    },
  },
};

/**
 * Overview
 * Shows all radio variants organized by category in a scrollable format
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    
    const createSection = (title, contentRender) => {
      const section = document.createElement('div');
      section.style.display = 'flex';
      section.style.flexDirection = 'column';
      section.style.gap = 'var(--size-card-gap-md)';
      
      const heading = document.createElement('div');
      heading.className = 'h5';
      heading.textContent = title;
      heading.style.marginBottom = 'var(--size-element-gap-sm)';
      section.appendChild(heading);
      
      const content = contentRender();
      section.appendChild(content);
      return section;
    };
    
    // States Section
    container.appendChild(createSection('States', RadioAllStates.render));
    
    // Content Section
    container.appendChild(createSection('Content', RadioAllContent.render));
    
    return container;
  },
};

export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    const radio = PlusInterface.createRadio(args);
    container.appendChild(radio);
    return container;
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Radio label',
    },
    name: {
      control: 'text',
      description: 'Input name attribute (required for radio groups)',
    },
    value: {
      control: 'text',
      description: 'Input value attribute',
    },
    checked: {
      control: 'boolean',
      description: 'Checked state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
  },
  args: {
    label: 'Interactive radio',
    name: 'interactive',
    value: 'value',
    id: 'radio-interactive',
    checked: false,
    disabled: false,
  },
};

