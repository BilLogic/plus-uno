/**
 * Dropdown Molecule Stories
 * 
 * ## Usage and Implementation
 * 
 * Dropdowns are **Element** components that provide a menu of options when activated.
 * They are used for selecting from multiple options, filtering content, or providing contextual actions.
 * 
 * ### When to Use
 * - **Selection**: When users need to choose from a list of options (e.g., sorting, filtering)
 * - **Actions**: When multiple related actions are grouped together (e.g., "More options" menu)
 * - **Navigation**: For hierarchical navigation or submenu items
 * - **Forms**: As select inputs in forms when space is limited
 * - **Toolbars**: In toolbars or action bars for secondary actions
 * 
 * ### Implementation Context
 * - **Component Type**: Element (uses `element-` tokens)
 * - **Token Usage**: 
 *   - Padding: `--size-element-pad-x-sm/md/lg`, `--size-element-pad-y-sm/md/lg`
 *   - Gap: `--size-element-gap-sm/md/lg` (for icon spacing)
 *   - Radius: `--size-element-radius-sm/md/lg`
 *   - Colors: `--color-primary`, `--color-secondary`, etc.
 *   - Border: `--size-element-border` for split dropdown separator
 * - **Bootstrap Integration**: Uses Bootstrap 4 dropdown component for menu functionality
 * 
 * ### Visual Style Variants
 * - **Default**: Neutral style for standard dropdowns
 * - **Primary**: Brand primary color for primary actions
 * - **Secondary**: Brand secondary color for secondary actions
 * - **Success**: Green for positive actions
 * - **Danger**: Red for destructive actions
 * - **Warning**: Yellow/orange for cautionary actions
 * - **Info**: Blue for informational actions
 * 
 * ### Size Variants
 * - **Small**: Compact size for dense interfaces
 * - **Default**: Standard size for most use cases
 * - **Large**: Prominent size for important selections
 * 
 * ### Content Variants
 * - **With Selected Item**: Shows currently selected option
 * - **With Icons**: Includes icons in menu items
 * - **With Counters**: Displays counts or badges on items
 * - **Split Dropdown**: Separates main action from dropdown trigger
 * 
 * ### Best Practices
 * - Use semantic color styles based on action type
 * - Keep menu items concise and scannable
 * - Group related items together
 * - Use icons for clarity when appropriate
 * - Consider split dropdowns for primary + secondary actions
 * - Ensure keyboard accessibility (Bootstrap handles this)
 * - Limit menu items to avoid overwhelming users
 * 
 * See docs/guidelines/terminology.md for Element Component Guidelines
 * See docs/guidelines/token-reference.md for Token Reference
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Dropdown',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Dropdown component for selecting options or providing contextual actions. Supports multiple styles, sizes, and content variants. Uses element-level tokens and Bootstrap 4 for menu functionality.',
      },
    },
  },
};

/**
 * All Variants
 * Shows all dropdown combinations organized by visual style: each style shows all sizes
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    const styles = ['default', 'primary', 'secondary', 'success', 'danger', 'warning', 'info'];
    const sizes = ['small', 'default', 'large'];
    
    // Organize by visual style - each style shows all sizes
    styles.forEach((style) => {
      const styleSection = document.createElement('div');
      styleSection.style.display = 'flex';
      styleSection.style.flexDirection = 'column';
      styleSection.style.gap = 'var(--size-card-gap-md)';
      
      const styleLabel = document.createElement('div');
      styleLabel.className = 'h6';
      styleLabel.textContent = `${style.charAt(0).toUpperCase() + style.slice(1)} Style - All Sizes`;
      styleLabel.style.marginBottom = 'var(--size-element-gap-sm)';
      styleSection.appendChild(styleLabel);
      
      const sizesContainer = document.createElement('div');
      sizesContainer.style.display = 'flex';
      sizesContainer.style.flexDirection = 'column';
      sizesContainer.style.gap = 'var(--size-card-gap-md)';
      sizesContainer.style.alignItems = 'flex-start';
      
      sizes.forEach((size) => {
        const dropdown = PlusInterface.createDropdown({
          buttonText: `${style.charAt(0).toUpperCase() + style.slice(1)} ${size.charAt(0).toUpperCase() + size.slice(1)}`,
          size: size,
          style: style,
          items: [
            { text: 'Option 1' },
            { text: 'Option 2' },
            { text: 'Option 3' },
          ],
        });
        sizesContainer.appendChild(dropdown);
        
        if (typeof $ !== 'undefined') {
          $(dropdown).find('.dropdown-toggle').dropdown();
        }
      });
      
      styleSection.appendChild(sizesContainer);
      container.appendChild(styleSection);
    });
    
    return container;
  },
};


/**
 * Interactive Dropdown
 * Interactive playground for testing dropdown variations
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    const dropdown = PlusInterface.createDropdown({
      ...args,
      items: args.items || [
        { text: 'Option 1', onClick: () => console.log('Option 1 clicked') },
        { text: 'Option 2', onClick: () => console.log('Option 2 clicked') },
        { text: 'Option 3', onClick: () => console.log('Option 3 clicked') },
      ],
    });
    container.appendChild(dropdown);
    
    // Initialize Bootstrap dropdown
    if (typeof $ !== 'undefined') {
      $(dropdown).find('.dropdown-toggle').dropdown();
    }
    
    return container;
  },
  argTypes: {
    buttonText: {
      control: 'text',
      description: 'Dropdown button text',
    },
    size: {
      control: 'select',
      options: ['small', 'default', 'large'],
      description: 'Dropdown size (uses element padding tokens: --size-element-pad-x-sm/md/lg, --size-element-pad-y-sm/md/lg)',
    },
    style: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'success', 'danger', 'warning', 'info'],
      description: 'Dropdown style (uses color tokens: --color-primary, --color-secondary, etc.)',
    },
    split: {
      control: 'boolean',
      description: 'Split button dropdown',
    },
  },
  args: {
    buttonText: 'Dropdown',
    size: 'default',
    style: 'default',
    split: false,
  },
};
