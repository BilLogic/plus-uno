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
 * All Variants
 * Shows all dropdown combinations: open/closed states × split/non-split × directions
 * Organized exactly as shown in Figma design system
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-xl)';
    
    const directions = ['dropdown', 'dropup', 'dropleft', 'dropright'];
    const splitOptions = [false, true];
    const openStates = [false, true];
    
    // Standard dropdown items for menu (matching Figma - 3 items with icon, counter, dropright)
    const menuItems = [
      { 
        text: 'Form', 
        leadingIcon: 'th',
        counter: 20,
        dropright: true
      },
      { 
        text: 'Form', 
        leadingIcon: 'th',
        counter: 20,
        dropright: true
      },
      { 
        text: 'Form', 
        leadingIcon: 'th',
        counter: 20,
        dropright: true,
        selected: true
      }
    ];
    
    // Create sections for each split option
    splitOptions.forEach((split) => {
      const splitSection = document.createElement('div');
      splitSection.style.display = 'flex';
      splitSection.style.flexDirection = 'column';
      splitSection.style.gap = 'var(--size-card-gap-lg)';
      
      const splitLabel = document.createElement('div');
      splitLabel.className = 'h5';
      splitLabel.textContent = split ? 'Split Dropdown' : 'Standard Dropdown';
      splitLabel.style.marginBottom = 'var(--size-element-gap-md)';
      splitSection.appendChild(splitLabel);
      
      // Create grid for each direction
      directions.forEach((direction) => {
        const directionGroup = document.createElement('div');
        directionGroup.style.display = 'flex';
        directionGroup.style.flexDirection = 'row';
        directionGroup.style.flexWrap = 'wrap';
        directionGroup.style.gap = 'var(--size-section-gap-lg)';
        directionGroup.style.alignItems = 'flex-start';
        directionGroup.style.marginBottom = 'var(--size-card-gap-md)';
        
        const directionLabel = document.createElement('div');
        directionLabel.className = 'body2-txt';
        directionLabel.textContent = `Direction: ${direction}`;
        directionLabel.style.width = '100%';
        directionLabel.style.marginBottom = 'var(--size-element-gap-xs)';
        directionGroup.appendChild(directionLabel);
        
        // Create closed and open states side by side
        openStates.forEach((open) => {
          const stateWrapper = document.createElement('div');
          stateWrapper.style.display = 'flex';
          stateWrapper.style.flexDirection = 'column';
          stateWrapper.style.gap = 'var(--size-element-gap-xs)';
          stateWrapper.style.alignItems = 'flex-start';
          stateWrapper.style.minWidth = '250px'; // Ensure enough space for split dropdowns
          stateWrapper.style.flexShrink = '0'; // Prevent shrinking
          stateWrapper.style.minWidth = '200px'; // Ensure enough space for split dropdowns
          stateWrapper.style.marginRight = 'var(--size-section-gap-md)'; // Add spacing between closed/open columns
          
          const stateLabel = document.createElement('div');
          stateLabel.className = 'caption-txt';
          stateLabel.textContent = open ? 'Open' : 'Closed';
          stateLabel.style.opacity = '0.7';
          stateWrapper.appendChild(stateLabel);
          
        const dropdown = PlusInterface.createDropdown({
            buttonText: split ? 'Split Dropdown' : 'Dropdown',
            size: 'default',
            style: 'primary',
            split: split,
            direction: direction,
            items: open ? menuItems : [],
          });
          
          // If open, show the menu with proper positioning based on direction
          if (open) {
            const menu = dropdown.querySelector('.dropdown-menu');
            const toggle = dropdown.querySelector('.dropdown-toggle') || dropdown.querySelector('.pdropdown-split-toggle-btn');
            
            if (menu && toggle) {
              menu.style.display = 'block';
              menu.style.opacity = '1';
              menu.style.position = 'static'; // Static positioning for Storybook display
              menu.style.transform = 'none';
              menu.style.margin = '0';
              // Add show class for Bootstrap compatibility
              menu.classList.add('show');
              
              // For split dropdowns, buttons are direct children. For standard, toggle is direct child.
              // Find the first button element to insert menu before/after
              const firstButton = split 
                ? dropdown.querySelector('.pdropdown-split-text-btn')
                : toggle;
              
              // Position menu relative to button based on direction using flexbox on dropdown container
              // Use a data attribute to mark this as a Storybook static display, so we can remove styles later
              dropdown.setAttribute('data-storybook-open', 'true');
              
              if (direction === 'dropup') {
                // Menu should appear ABOVE the button
                // Move menu before first button, then use flexbox column-reverse
                if (firstButton && menu.parentElement === dropdown) {
                  dropdown.insertBefore(menu, firstButton);
                }
                dropdown.style.display = 'flex';
                dropdown.style.flexDirection = 'column-reverse';
                dropdown.style.gap = 'var(--size-element-gap-sm)';
                dropdown.style.alignItems = 'flex-start';
              } else if (direction === 'dropleft') {
                // Menu should appear to the LEFT of the button
                // Move menu before first button, then use flexbox row-reverse
                if (firstButton && menu.parentElement === dropdown) {
                  dropdown.insertBefore(menu, firstButton);
                }
                dropdown.style.display = 'flex';
                dropdown.style.flexDirection = 'row-reverse';
                dropdown.style.gap = 'var(--size-element-gap-sm)';
                dropdown.style.alignItems = 'flex-start';
              } else if (direction === 'dropright') {
                // Menu should appear to the RIGHT of the button
                // Menu is already after buttons, use flexbox row
                dropdown.style.display = 'flex';
                dropdown.style.flexDirection = 'row';
                dropdown.style.gap = 'var(--size-element-gap-sm)';
                dropdown.style.alignItems = 'flex-start';
              } else {
                // dropdown (default) - menu should appear BELOW the button
                // Menu is already after buttons, use flexbox column
                dropdown.style.display = 'flex';
                dropdown.style.flexDirection = 'column';
                dropdown.style.gap = 'var(--size-element-gap-sm)';
                dropdown.style.alignItems = 'flex-start';
              }
            }
            
            if (toggle) {
              toggle.setAttribute('aria-expanded', 'true');
            }
          } else {
            // For closed state, initialize Bootstrap dropdown so it works when clicked
            // Use setTimeout to ensure DOM is ready
            setTimeout(() => {
              if (typeof $ !== 'undefined' && $.fn.dropdown) {
                const $toggle = $(dropdown).find('.dropdown-toggle');
                if ($toggle.length && !$toggle.data('bs.dropdown')) {
                  $toggle.dropdown();
                  
                  // When Bootstrap shows the menu, add the show class
                  $toggle.on('shown.bs.dropdown', function() {
                    const menu = dropdown.querySelector('.dropdown-menu');
                    if (menu) {
                      menu.classList.add('show');
                    }
                  });
                  
                  // When Bootstrap hides the menu, ensure it can override our inline styles
                  $toggle.on('hidden.bs.dropdown', function() {
                    const menu = dropdown.querySelector('.dropdown-menu');
                    if (menu) {
                      // Remove inline display style so Bootstrap can hide it
                      menu.style.display = '';
                      menu.classList.remove('show');
                      // Also reset container flex styles if they were set
                      if (dropdown.getAttribute('data-storybook-open')) {
                        dropdown.style.display = '';
                        dropdown.style.flexDirection = '';
                        dropdown.style.gap = '';
                        dropdown.removeAttribute('data-storybook-open');
                      }
                    }
                  });
                }
              }
            }, 0);
          }
          
          stateWrapper.appendChild(dropdown);
          directionGroup.appendChild(stateWrapper);
        });
        
        splitSection.appendChild(directionGroup);
      });
      
      container.appendChild(splitSection);
    });
    
    return container;
  },
};

/**
 * Open Property
 * Toggle the open? switch to open the dropdown list.
 * Do NOT edit the spacing between the dropdown button and dropdown list.
 */
export const OpenProperty = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'row';
    container.style.gap = 'var(--size-card-gap-lg)';
    container.style.alignItems = 'flex-start';
    
    const menuItems = [
      { 
        text: 'Form', 
        leadingIcon: 'th',
        counter: 20,
        dropright: true
      },
      { 
        text: 'Form', 
        leadingIcon: 'th',
        counter: 20,
        dropright: true
      },
      { 
        text: 'Form', 
        leadingIcon: 'th',
        counter: 20,
        dropright: true,
        selected: true
      }
    ];
    
    // Closed state
    const closedWrapper = document.createElement('div');
    closedWrapper.style.display = 'flex';
    closedWrapper.style.flexDirection = 'column';
    closedWrapper.style.gap = 'var(--size-element-gap-sm)';
    
    const closedLabel = document.createElement('div');
    closedLabel.className = 'body2-txt';
    closedLabel.textContent = 'Closed (open?=false)';
    closedWrapper.appendChild(closedLabel);
    
    const closedDropdown = PlusInterface.createDropdown({
      buttonText: 'Dropdown',
      size: 'default',
      style: 'primary',
      split: false,
      direction: 'dropdown',
      items: [],
    });
    
    // Initialize Bootstrap dropdown for closed state
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.dropdown) {
        const $toggle = $(closedDropdown).find('.dropdown-toggle');
        if ($toggle.length && !$toggle.data('bs.dropdown')) {
          $toggle.dropdown();
        }
      }
    }, 0);
    
    closedWrapper.appendChild(closedDropdown);
    container.appendChild(closedWrapper);
    
    // Open state
    const openWrapper = document.createElement('div');
    openWrapper.style.display = 'flex';
    openWrapper.style.flexDirection = 'column';
    openWrapper.style.gap = 'var(--size-element-gap-sm)';
    
    const openLabel = document.createElement('div');
    openLabel.className = 'body2-txt';
    openLabel.textContent = 'Open (open?=true)';
    openWrapper.appendChild(openLabel);
    
    const openDropdown = PlusInterface.createDropdown({
      buttonText: 'Dropdown',
      size: 'default',
      style: 'primary',
      split: false,
      direction: 'dropdown',
      items: menuItems,
    });
    
    // Show the menu in open state
    const menu = openDropdown.querySelector('.dropdown-menu');
    if (menu) {
      menu.style.display = 'block';
      menu.style.position = 'static';
      menu.style.transform = 'none';
      menu.style.opacity = '1';
      menu.style.marginTop = '0';
      menu.classList.add('show');
    }
    const toggle = openDropdown.querySelector('.dropdown-toggle');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'true');
    }
    
    openWrapper.appendChild(openDropdown);
    container.appendChild(openWrapper);
    
    return container;
  },
};

/**
 * Split Property
 * Toggle the split? switch to change between a normal dropdown and a split dropdown.
 * Single button dropdown: users can toggle the dropdown by clicking anywhere on the dropdown button.
 * Split button dropdown: users can toggle the dropdown only by clicking the arrow icon.
 */
export const SplitProperty = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-lg)';
    
    const menuItems = [
      { 
        text: 'Form', 
        leadingIcon: 'th',
        counter: 20,
        dropright: true
      },
      { 
        text: 'Form', 
        leadingIcon: 'th',
        counter: 20,
        dropright: true
      },
      { 
        text: 'Form', 
        leadingIcon: 'th',
        counter: 20,
        dropright: true,
        selected: true
      }
    ];
    
    // Standard dropdown (split?=false)
    const standardGroup = document.createElement('div');
    standardGroup.style.display = 'flex';
    standardGroup.style.flexDirection = 'column';
    standardGroup.style.gap = 'var(--size-card-gap-md)';
    
    const standardLabel = document.createElement('div');
    standardLabel.className = 'body1-txt';
    standardLabel.textContent = 'Standard Dropdown (split?=false)';
    standardLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    standardGroup.appendChild(standardLabel);
    
    const standardDescription = document.createElement('div');
    standardDescription.className = 'body2-txt';
    standardDescription.textContent = 'Single button dropdown: users can toggle the dropdown by clicking anywhere on the dropdown button.';
    standardDescription.style.marginBottom = 'var(--size-element-gap-md)';
    standardDescription.style.opacity = '0.8';
    standardGroup.appendChild(standardDescription);
    
    const standardRow = document.createElement('div');
    standardRow.style.display = 'flex';
    standardRow.style.flexDirection = 'row';
    standardRow.style.gap = 'var(--size-element-gap-md)';
    standardRow.style.alignItems = 'flex-start';
    
    // Closed standard
    const standardClosed = PlusInterface.createDropdown({
      buttonText: 'Dropdown',
      size: 'default',
      style: 'primary',
      split: false,
      direction: 'dropdown',
      items: [],
    });
    
    // Initialize Bootstrap dropdown for closed state
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.dropdown) {
        const $toggle = $(standardClosed).find('.dropdown-toggle');
        if ($toggle.length && !$toggle.data('bs.dropdown')) {
          $toggle.dropdown();
        }
      }
    }, 0);
    
    standardRow.appendChild(standardClosed);
    
    // Open standard (dropdown direction - opens downward)
    const standardOpen = PlusInterface.createDropdown({
      buttonText: 'Dropdown',
      size: 'default',
      style: 'primary',
      split: false,
      direction: 'dropdown',
      items: menuItems,
    });
    const menu1 = standardOpen.querySelector('.dropdown-menu');
    if (menu1) {
      menu1.style.display = 'block';
      menu1.style.position = 'static';
      menu1.style.transform = 'none';
      menu1.style.opacity = '1';
      menu1.style.marginTop = 'var(--size-element-gap-sm)';
      menu1.style.marginBottom = '0';
      menu1.classList.add('show');
    }
    const toggle1 = standardOpen.querySelector('.dropdown-toggle');
    if (toggle1) {
      toggle1.setAttribute('aria-expanded', 'true');
    }
    standardRow.appendChild(standardOpen);
    
    standardGroup.appendChild(standardRow);
    container.appendChild(standardGroup);
    
    // Split dropdown (split?=true)
    const splitGroup = document.createElement('div');
    splitGroup.style.display = 'flex';
    splitGroup.style.flexDirection = 'column';
    splitGroup.style.gap = 'var(--size-card-gap-md)';
    
    const splitLabel = document.createElement('div');
    splitLabel.className = 'body1-txt';
    splitLabel.textContent = 'Split Dropdown (split?=true)';
    splitLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    splitGroup.appendChild(splitLabel);
    
    const splitDescription = document.createElement('div');
    splitDescription.className = 'body2-txt';
    splitDescription.textContent = 'Split button dropdown: users can toggle the dropdown only by clicking the arrow icon.';
    splitDescription.style.marginBottom = 'var(--size-element-gap-md)';
    splitDescription.style.opacity = '0.8';
    splitGroup.appendChild(splitDescription);
    
    const splitRow = document.createElement('div');
    splitRow.style.display = 'flex';
    splitRow.style.flexDirection = 'row';
    splitRow.style.gap = 'var(--size-element-gap-md)';
    splitRow.style.alignItems = 'flex-start';
    
    // Closed split
    const splitClosed = PlusInterface.createDropdown({
      buttonText: 'Split Dropdown',
      size: 'default',
      style: 'primary',
      split: true,
      direction: 'dropdown',
      items: [],
    });
    
    // Initialize Bootstrap dropdown for closed state
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.dropdown) {
        const $toggle = $(splitClosed).find('.dropdown-toggle');
        if ($toggle.length && !$toggle.data('bs.dropdown')) {
          $toggle.dropdown();
        }
      }
    }, 0);
    
    splitRow.appendChild(splitClosed);
    
    // Open split (dropdown direction - opens downward)
    const splitOpen = PlusInterface.createDropdown({
      buttonText: 'Split Dropdown',
      size: 'default',
      style: 'primary',
      split: true,
      direction: 'dropdown',
      items: menuItems,
    });
    const menu2 = splitOpen.querySelector('.dropdown-menu');
    if (menu2) {
      menu2.style.display = 'block';
      menu2.style.position = 'static';
      menu2.style.transform = 'none';
      menu2.style.opacity = '1';
      menu2.style.marginTop = 'var(--size-element-gap-sm)';
      menu2.style.marginBottom = '0';
      menu2.classList.add('show');
    }
    const toggle2 = splitOpen.querySelector('.dropdown-toggle');
    if (toggle2) {
      toggle2.setAttribute('aria-expanded', 'true');
    }
    splitRow.appendChild(splitOpen);
    
    splitGroup.appendChild(splitRow);
    container.appendChild(splitGroup);
    
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
