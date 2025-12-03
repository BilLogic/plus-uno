/**
 * Button Component Stories
 * 
 * ## Usage and Implementation
 * 
 * Buttons are **Element** components (fundamental building blocks) used to trigger actions in the interface.
 * They are the primary interactive elements for user actions like submitting forms, navigating, or confirming operations.
 * 
 * ### When to Use
 * - **Primary actions**: Use filled primary buttons for the main action on a page or section
 * - **Secondary actions**: Use outline or text buttons for less prominent actions
 * - **Destructive actions**: Use danger style for delete, remove, or destructive operations
 * - **Success actions**: Use success style for positive confirmations or completed actions
 * - **Navigation**: Use text buttons or link-styled buttons for navigation
 * 
 * ### Implementation Context
 * - **Component Type**: Element (uses `element-` tokens)
 * - **Token Usage**: 
 *   - Padding: `--size-element-pad-x-sm/md/lg`, `--size-element-pad-y-sm/md/lg`
 *   - Gap: `--size-element-gap-sm/md/lg` (for icon spacing)
 *   - Radius: `--size-element-radius-sm/md/lg`
 *   - Colors: `--color-primary`, `--color-secondary`, `--color-success`, `--color-danger`, etc.
 *   - State layers: `color-mix()` with 8%/12%/16% opacity for hover/active/focus states
 * 
 * ### Button Organization
 * Buttons are organized by **Fill Types** (primary dimension):
 * - **Filled**: Solid background with high contrast text (4 styles: primary, secondary, tertiary, default)
 * - **Tonal**: Light background with colored text (4 styles: primary, secondary, tertiary, default)
 * - **Outlined**: Transparent background with border (8 styles: primary, secondary, tertiary, default, danger, warning, success, info)
 * - **Text**: No background or border, colored text only (8 styles: primary, secondary, tertiary, default, danger, warning, success, info)
 * 
 * ### Size Variants
 * - **Small**: Compact size for dense interfaces or inline actions
 * - **Default**: Standard size for most use cases
 * - **Large**: Prominent size for primary CTAs or important actions
 * 
 * ### Content Options
 * - **Leading Visual**: Icon on the left side
 * - **Trailing Visual**: Icon on the right side
 * - **Text Toggle**: Buttons can have text or be icon-only
 * - **Vertical Layout**: Outlined buttons can display vertically (icon top, text middle, trailing icon bottom)
 * 
 * ### Best Practices
 * - Use semantic color styles (primary for main actions, danger for destructive actions)
 * - Match button hierarchy to action importance (filled > outline > tonal > text)
 * - Include icons for clarity when appropriate (e.g., save, download, delete)
 * - Ensure sufficient contrast for accessibility
 * - Use consistent sizing within a section or form
 * 
 * See https://github.com/CMU-PLUS/web-app/blob/dev/java/sass/_colors.scss for Production Color Tokens
 * See design-system/components/overview.md for Element Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Button',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Button component for triggering actions. Supports multiple fill types, styles, sizes, states, and content variants. Uses element-level tokens for spacing and Material Design 3 color roles for styling.',
      },
    },
  },
};

/**
 * Button Overview
 * Shows a basic filled button example
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.alignItems = 'center';
    container.style.gap = 'var(--size-card-gap-md)';
    
    // Basic filled button
    const button = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default',
      icon: 'square-plus',
      trailingIcon: 'square-plus',
    });
    container.appendChild(button);
    
    return container;
  },
};


/**
 * Interactive Button
 * Interactive playground for testing button variations
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    const button = PlusInterface.createButton({
      ...args,
      buttonOnClick: () => {
        console.log('Button clicked!', args);
      },
    });
    container.appendChild(button);
    return container;
  },
  argTypes: {
    btnText: {
      control: 'text',
      description: 'Button text',
    },
    btnStyle: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'success', 'info', 'warning', 'error', 'default'],
      description: 'Button style (uses color tokens: --color-primary, --color-secondary, etc.)',
    },
    btnFill: {
      control: 'select',
      options: ['filled', 'outline', 'tonal', 'text'],
      description: 'Button fill variant (uses color and state layer tokens)',
    },
    btnSize: {
      control: 'select',
      options: ['small', 'default', 'large'],
      description: 'Button size (uses element padding tokens: --size-element-pad-x-sm/md/lg, --size-element-pad-y-sm/md/lg)',
    },
    icon: {
      control: 'text',
      description: 'Icon name (without fa- prefix)',
    },
    iconPosition: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Icon position',
    },
    enabled: {
      control: 'boolean',
      description: 'Enabled state',
    },
    tooltip: {
      control: 'text',
      description: 'Tooltip text',
    },
    verticalLayout: {
      control: 'boolean',
      description: 'Vertical layout (for outlined buttons)',
    },
  },
  args: {
    btnText: 'Click Me',
    btnStyle: 'primary',
    btnFill: 'filled',
    btnSize: 'default',
    icon: '',
    iconPosition: 'left',
    enabled: true,
    tooltip: '',
    verticalLayout: false,
  },
};

