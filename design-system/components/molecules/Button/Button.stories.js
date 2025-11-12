/**
 * Button Molecule Stories
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
 * ### Visual Style Variants
 * Each style (Primary, Secondary, Tertiary, Success, Info, Warning, Error) supports all fill variants:
 * - **Filled**: Solid background with high contrast text (use for primary actions)
 * - **Outline**: Transparent background with border (use for secondary actions)
 * - **Tonal**: Light background with colored text (use for tertiary actions)
 * - **Text**: No background or border, colored text only (use for low-emphasis actions)
 * 
 * ### Size Variants
 * - **Small**: Compact size for dense interfaces or inline actions
 * - **Default**: Standard size for most use cases
 * - **Large**: Prominent size for primary CTAs or important actions
 * 
 * ### Best Practices
 * - Use semantic color styles (primary for main actions, danger for destructive actions)
 * - Match button hierarchy to action importance (filled > outline > tonal > text)
 * - Include icons for clarity when appropriate (e.g., save, download, delete)
 * - Ensure sufficient contrast for accessibility
 * - Use consistent sizing within a section or form
 * 
 * See https://github.com/CMU-PLUS/web-app/blob/dev/java/sass/_colors.scss for Production Color Tokens
 * See docs/guidelines/terminology.md for Element Component Guidelines
 * See docs/guidelines/token-reference.md for Token Reference
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Button',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Button component for triggering actions. Supports multiple styles, fills, sizes, and states. Uses element-level tokens for spacing and Material Design 3 color roles for styling.',
      },
    },
  },
};

/**
 * All Variants
 * Shows all button combinations organized by visual style: each style shows all fills × all sizes
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    const styles = ['primary', 'secondary', 'tertiary', 'success', 'info', 'warning', 'error', 'default'];
    const fills = ['filled', 'outline', 'tonal', 'text'];
    const sizes = ['small', 'default', 'large'];
    
    // Organize by visual style - each style shows all fills × all sizes
    styles.forEach((style) => {
      const styleSection = document.createElement('div');
      styleSection.style.display = 'flex';
      styleSection.style.flexDirection = 'column';
      styleSection.style.gap = 'var(--size-card-gap-md)';
      
      const styleLabel = document.createElement('div');
      styleLabel.className = 'h6';
      styleLabel.textContent = `${style.charAt(0).toUpperCase() + style.slice(1)} Style - All Fills × All Sizes`;
      styleLabel.style.marginBottom = 'var(--size-element-gap-sm)';
      styleSection.appendChild(styleLabel);
      
      // For each fill, show all sizes
      fills.forEach((fill) => {
        const fillGroup = document.createElement('div');
        fillGroup.style.display = 'flex';
        fillGroup.style.flexDirection = 'column';
        fillGroup.style.gap = 'var(--size-element-gap-sm)';
        
        const fillLabel = document.createElement('div');
        fillLabel.className = 'body2-txt';
        fillLabel.textContent = `${fill.charAt(0).toUpperCase() + fill.slice(1)} Fill:`;
        fillLabel.style.marginBottom = 'var(--size-element-gap-xs)';
        fillGroup.appendChild(fillLabel);
        
        const sizesRow = document.createElement('div');
        sizesRow.style.display = 'flex';
        sizesRow.style.flexWrap = 'wrap';
        sizesRow.style.alignItems = 'center';
        sizesRow.style.gap = 'var(--size-card-gap-md)';
        
        sizes.forEach((size) => {
          const button = PlusInterface.createButton({
            btnText: `${fill} ${size}`,
            btnStyle: style,
            btnFill: fill,
            btnSize: size,
          });
          sizesRow.appendChild(button);
        });
        
        fillGroup.appendChild(sizesRow);
        styleSection.appendChild(fillGroup);
      });
      
      container.appendChild(styleSection);
    });
    
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
  },
};

