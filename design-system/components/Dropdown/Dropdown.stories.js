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
 * See design-system/components/overview.md for Element Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Dropdown',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Dropdown component for selecting options or providing contextual actions. Supports multiple styles, sizes, directions, and split variants. Uses element-level tokens and Bootstrap 4 for menu functionality.',
      },
    },
  },
};

/**
 * Overview
 * Shows all dropdown variants organized by category in a scrollable format
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    const menuItems = [
      { text: 'Form', leadingIcon: 'th', counter: 20, dropright: true },
      { text: 'Form', leadingIcon: 'th', counter: 20, dropright: true },
      { text: 'Form', leadingIcon: 'th', counter: 20, dropright: true, selected: true }
    ];
    
    // Sizes Section
    const sizesSection = document.createElement('div');
    sizesSection.style.display = 'flex';
    sizesSection.style.flexDirection = 'column';
    sizesSection.style.gap = 'var(--size-card-gap-md)';
    
    const sizesHeading = document.createElement('div');
    sizesHeading.className = 'h5';
    sizesHeading.textContent = 'Sizes';
    sizesHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    sizesSection.appendChild(sizesHeading);
    
    const sizesRow = document.createElement('div');
    sizesRow.style.display = 'flex';
    sizesRow.style.flexWrap = 'wrap';
    sizesRow.style.gap = 'var(--size-card-gap-md)';
    sizesRow.style.alignItems = 'flex-start';
    
    ['small', 'default', 'large'].forEach((size) => {
      const dropdown = PlusInterface.createDropdown({
        buttonText: size,
        size: size,
        style: 'primary',
        split: false,
        direction: 'dropdown',
        items: [],
      });
      sizesRow.appendChild(dropdown);
    });
    sizesSection.appendChild(sizesRow);
    container.appendChild(sizesSection);
    
    // Colors Section
    const colorsSection = document.createElement('div');
    colorsSection.style.display = 'flex';
    colorsSection.style.flexDirection = 'column';
    colorsSection.style.gap = 'var(--size-card-gap-md)';
    
    const colorsHeading = document.createElement('div');
    colorsHeading.className = 'h5';
    colorsHeading.textContent = 'Colors';
    colorsHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    colorsSection.appendChild(colorsHeading);
    
    const colorsRow = document.createElement('div');
    colorsRow.style.display = 'flex';
    colorsRow.style.flexWrap = 'wrap';
    colorsRow.style.gap = 'var(--size-card-gap-md)';
    colorsRow.style.alignItems = 'flex-start';
    
    ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'default'].forEach((style) => {
      const dropdown = PlusInterface.createDropdown({
        buttonText: style,
        size: 'default',
        style: style,
        split: false,
        direction: 'dropdown',
        items: [],
      });
      colorsRow.appendChild(dropdown);
    });
    colorsSection.appendChild(colorsRow);
    container.appendChild(colorsSection);
    
    // Styles Section (Standard vs Split)
    const stylesSection = document.createElement('div');
    stylesSection.style.display = 'flex';
    stylesSection.style.flexDirection = 'column';
    stylesSection.style.gap = 'var(--size-card-gap-md)';
    
    const stylesHeading = document.createElement('div');
    stylesHeading.className = 'h5';
    stylesHeading.textContent = 'Styles';
    stylesHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    stylesSection.appendChild(stylesHeading);
    
    const stylesRow = document.createElement('div');
    stylesRow.style.display = 'flex';
    stylesRow.style.flexWrap = 'wrap';
    stylesRow.style.gap = 'var(--size-card-gap-md)';
    stylesRow.style.alignItems = 'flex-start';
    
    // Standard dropdown
    const standard = PlusInterface.createDropdown({
      buttonText: 'Standard',
      size: 'default',
      style: 'primary',
      split: false,
      direction: 'dropdown',
      items: [],
    });
    stylesRow.appendChild(standard);
    
    // Split dropdown
    const split = PlusInterface.createDropdown({
      buttonText: 'Split',
      size: 'default',
      style: 'primary',
      split: true,
      direction: 'dropdown',
      items: [],
    });
    stylesRow.appendChild(split);
    
    stylesSection.appendChild(stylesRow);
    container.appendChild(stylesSection);
    
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
    statesRow.style.flexWrap = 'wrap';
    statesRow.style.gap = 'var(--size-card-gap-md)';
    statesRow.style.alignItems = 'flex-start';
    
    // Closed state
    const closed = PlusInterface.createDropdown({
      buttonText: 'Closed',
      size: 'default',
      style: 'primary',
      split: false,
      direction: 'dropdown',
      items: [],
    });
    statesRow.appendChild(closed);
    
    // Open state
    const open = PlusInterface.createDropdown({
      buttonText: 'Open',
      size: 'default',
      style: 'primary',
      split: false,
      direction: 'dropdown',
      items: menuItems,
    });
    const menu = open.querySelector('.dropdown-menu');
    if (menu) {
      menu.style.display = 'block';
      menu.style.position = 'static';
      menu.style.transform = 'none';
      menu.style.opacity = '1';
      menu.style.marginTop = '0';
      menu.classList.add('show');
    }
    statesRow.appendChild(open);
    
    statesSection.appendChild(statesRow);
    container.appendChild(statesSection);
    
    // Orientations Section
    const orientationsSection = document.createElement('div');
    orientationsSection.style.display = 'flex';
    orientationsSection.style.flexDirection = 'column';
    orientationsSection.style.gap = 'var(--size-card-gap-md)';
    
    const orientationsHeading = document.createElement('div');
    orientationsHeading.className = 'h5';
    orientationsHeading.textContent = 'Orientations';
    orientationsHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    orientationsSection.appendChild(orientationsHeading);
    
    const orientationsRow = document.createElement('div');
    orientationsRow.style.display = 'flex';
    orientationsRow.style.flexWrap = 'wrap';
    orientationsRow.style.gap = 'var(--size-card-gap-md)';
    orientationsRow.style.alignItems = 'flex-start';
    
    ['dropdown', 'dropup', 'dropleft', 'dropright'].forEach((direction) => {
      const dropdown = PlusInterface.createDropdown({
        buttonText: direction,
        size: 'default',
        style: 'primary',
        split: false,
        direction: direction,
        items: [],
      });
      orientationsRow.appendChild(dropdown);
    });
    orientationsSection.appendChild(orientationsRow);
    container.appendChild(orientationsSection);
    
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
    
    // Default items with all properties (matching Figma design)
    const defaultItems = args.items || [
      { 
        text: 'Form', 
        leadingIcon: 'th',
        counter: 20,
        dropright: true,
        onClick: () => console.log('Form clicked')
      },
      { 
        text: 'Form', 
        leadingIcon: 'th',
        counter: 20,
        dropright: true,
        onClick: () => console.log('Form clicked')
      },
      { 
        text: 'Form', 
        leadingIcon: 'th',
        counter: 20,
        dropright: true,
        selected: true,
        onClick: () => console.log('Form clicked (selected)')
      }
    ];
    
    const dropdown = PlusInterface.createDropdown({
      ...args,
      items: defaultItems,
    });
    container.appendChild(dropdown);
    
    // Initialize Bootstrap dropdown with proper direction handling
    if (typeof $ !== 'undefined') {
      const $toggle = $(dropdown).find('.dropdown-toggle');
      // Bootstrap 4 should automatically handle direction based on parent classes
      // (dropup, dropleft, dropright) which are already set on the dropdown container
      // The direction classes on the parent .pdropdown container tell Bootstrap where to position
      $toggle.dropdown({
        // Bootstrap will use Popper.js to position based on parent direction classes
        // No need to set offset or placement - Bootstrap handles this automatically
      });
      
      // When Bootstrap shows the menu, add the show class
      $toggle.on('shown.bs.dropdown', function() {
        const menu = dropdown.querySelector('.dropdown-menu');
        if (menu) {
          menu.classList.add('show');
        }
      });
      
      // Ensure Bootstrap can hide the menu by removing inline styles when hidden
      $toggle.on('hidden.bs.dropdown', function() {
        const menu = dropdown.querySelector('.dropdown-menu');
        if (menu) {
          // Remove inline display style so Bootstrap can hide it
          menu.style.display = '';
          menu.style.position = '';
          menu.style.transform = '';
          menu.style.margin = '';
          menu.style.opacity = '';
          menu.classList.remove('show');
        }
        // Also reset container flex styles if they were set
        if (dropdown.getAttribute('data-storybook-open')) {
          dropdown.style.display = '';
          dropdown.style.flexDirection = '';
          dropdown.style.gap = '';
          dropdown.removeAttribute('data-storybook-open');
        }
      });
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
    direction: {
      control: 'select',
      options: ['dropdown', 'dropup', 'dropleft', 'dropright'],
      description: 'Dropdown direction',
    },
    items: {
      control: 'object',
      description: 'Array of dropdown items. Each item can have: text, leadingIcon, counter, dropright, selected, disabled, onClick',
    },
  },
  args: {
    buttonText: 'Dropdown',
    size: 'default',
    style: 'primary',
    split: false,
    direction: 'dropdown',
    items: [
      { 
        text: 'Form', 
        leadingIcon: 'th',
        counter: 20,
        dropright: true,
        onClick: () => console.log('Form clicked')
      },
      { 
        text: 'Form', 
        leadingIcon: 'th',
        counter: 20,
        dropright: true,
        onClick: () => console.log('Form clicked')
      },
      { 
        text: 'Form', 
        leadingIcon: 'th',
        counter: 20,
        dropright: true,
        selected: true,
        onClick: () => console.log('Form clicked (selected)')
      }
    ],
  },
};
