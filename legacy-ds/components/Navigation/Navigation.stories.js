/**
 * Navigation Component Stories
 * 
 * ## Usage and Implementation
 * 
 * Navigation components are used to visually guide users through various categories of information.
 * They support horizontal and vertical layouts, tabs and pills variants, and dropdown menus.
 * 
 * ### When to Use
 * - **Horizontal Navigation**: For top-level navigation or tabbed interfaces
 * - **Vertical Navigation**: For sidebar navigation or vertical menu structures
 * - **Tabs**: For switching between different views or content sections
 * - **Pills**: For filtering or categorizing content horizontally
 * 
 * ### Implementation Context
 * - **Component Type**: Section (uses `section-*` tokens for containers, `element-*` tokens for items)
 * - **Token Usage**: 
 *   - Spacing: Uses `element-*` tokens for padding and gaps
 *   - Colors: Uses semantic color tokens (`--color-primary`, `--color-secondary`, etc.)
 *   - Typography: Uses Body/B1 (Merriweather Sans) - Regular for selected, Light for unselected
 * 
 * ### Types
 * - **horizontal**: Horizontal navigation with bottom borders (tabs style)
 * - **vertical**: Vertical navigation with pill-style selected items
 * - **tabs**: Same as horizontal (tabbed interface)
 * - **pills**: Horizontal pills with border and background for selected items
 * 
 * ### Alignment
 * - **left**: Items aligned to the left (default)
 * - **center**: Items centered
 * - **right**: Items aligned to the right
 * 
 * See design-system/components/overview.md for Section Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Navigation',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Navigation components for guiding users through various categories of information. Supports horizontal/vertical layouts, tabs/pills variants, alignment options, and dropdown menus.',
      },
    },
  },
};

/**
 * Overview
 * Shows all navigation variants organized by category in a scrollable format
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const baseItems = [
      { text: 'Tab', selected: true },
      { text: 'Tab', selected: false },
      { text: 'Tab', selected: false },
    ];
    
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
    
    const horizontalNav = PlusInterface.createNavigation({
      items: baseItems,
      type: 'horizontal',
      alignment: 'left'
    });
    orientationsSection.appendChild(horizontalNav);
    
    const verticalNav = PlusInterface.createNavigation({
      items: baseItems,
      type: 'vertical',
      alignment: 'left'
    });
    orientationsSection.appendChild(verticalNav);
    container.appendChild(orientationsSection);
    
    // Items Section (shows both tabs and pills styles)
    const itemsSection = document.createElement('div');
    itemsSection.style.display = 'flex';
    itemsSection.style.flexDirection = 'column';
    itemsSection.style.gap = 'var(--size-card-gap-md)';
    
    const itemsHeading = document.createElement('div');
    itemsHeading.className = 'h5';
    itemsHeading.textContent = 'Items (with Tabs and Pills Styles)';
    itemsHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    itemsSection.appendChild(itemsHeading);
    
    const tabsNav = PlusInterface.createNavigation({
      items: baseItems,
      type: 'tabs',
      alignment: 'left'
    });
    itemsSection.appendChild(tabsNav);
    
    const pillsNav = PlusInterface.createNavigation({
      items: baseItems,
      type: 'pills',
      alignment: 'left'
    });
    itemsSection.appendChild(pillsNav);
    container.appendChild(itemsSection);
    
    // Alignments Section
    const alignmentsSection = document.createElement('div');
    alignmentsSection.style.display = 'flex';
    alignmentsSection.style.flexDirection = 'column';
    alignmentsSection.style.gap = 'var(--size-card-gap-md)';
    
    const alignmentsHeading = document.createElement('div');
    alignmentsHeading.className = 'h5';
    alignmentsHeading.textContent = 'Alignments';
    alignmentsHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    alignmentsSection.appendChild(alignmentsHeading);
    
    const leftNav = PlusInterface.createNavigation({
      items: baseItems,
      type: 'horizontal',
      alignment: 'left'
    });
    alignmentsSection.appendChild(leftNav);
    
    const centerNav = PlusInterface.createNavigation({
      items: baseItems,
      type: 'horizontal',
      alignment: 'center'
    });
    alignmentsSection.appendChild(centerNav);
    
    const rightNav = PlusInterface.createNavigation({
      items: baseItems,
      type: 'horizontal',
      alignment: 'right'
    });
    alignmentsSection.appendChild(rightNav);
    container.appendChild(alignmentsSection);
    
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
    
    const dropdownNav = PlusInterface.createNavigation({
      items: [
        { text: 'Tab', selected: true },
        { 
          text: 'Dropdown', 
          selected: false,
          dropdownItems: [
            { text: 'Option 1', href: '#' },
            { text: 'Option 2', href: '#' }
          ]
        },
        { text: 'Tab', selected: false }
      ],
      type: 'horizontal',
      alignment: 'left'
    });
    contentSection.appendChild(dropdownNav);
    container.appendChild(contentSection);
    
    return container;
  },
};

export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const items = [
      { text: 'Tab', selected: args.selectedIndex === 0 },
      { text: 'Tab', selected: args.selectedIndex === 1 },
      { text: 'Tab', selected: args.selectedIndex === 2 },
      { text: 'Tab', selected: args.selectedIndex === 3, disabled: args.showDisabled }
    ];
    
    const nav = PlusInterface.createNavigation({
      items: items,
      type: args.type,
      alignment: args.alignment
    });
    
    container.appendChild(nav);
    return container;
  },
  args: {
    type: 'horizontal',
    alignment: 'left',
    selectedIndex: 0,
    showDisabled: false
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['horizontal', 'vertical', 'tabs', 'pills'],
      description: 'Navigation type: horizontal, vertical, tabs, or pills'
    },
    alignment: {
      control: 'select',
      options: ['left', 'center', 'right'],
      description: 'Alignment of navigation items'
    },
    selectedIndex: {
      control: { type: 'number', min: 0, max: 3 },
      description: 'Index of selected item (0-3)'
    },
    showDisabled: {
      control: 'boolean',
      description: 'Show disabled state on last item'
    }
  }
};








