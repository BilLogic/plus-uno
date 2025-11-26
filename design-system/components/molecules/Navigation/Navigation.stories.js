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

import { PlusInterface } from '../../index.js';

export default {
  title: 'Molecules/Navigation',
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
 * All Variants
 * Shows all navigation types and alignments
 */
export const AllVariants = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '48px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  
  const baseItems = [
    { text: 'Tab', selected: true },
    { text: 'Tab', selected: false },
    { text: 'Tab', selected: false },
    { text: 'Tab', selected: false, disabled: true }
  ];
  
  // Horizontal Navigation - Left
  const nav1 = PlusInterface.createNavigation({
    items: baseItems,
    type: 'horizontal',
    alignment: 'left'
  });
  const section1 = document.createElement('div');
  section1.style.marginBottom = '24px';
  const label1 = document.createElement('h3');
  label1.textContent = 'Horizontal - Left';
  label1.style.marginBottom = '12px';
  section1.appendChild(label1);
  section1.appendChild(nav1);
  container.appendChild(section1);
  
  // Horizontal Navigation - Center
  const nav2 = PlusInterface.createNavigation({
    items: baseItems.map((item, i) => ({ ...item, selected: i === 1 })),
    type: 'horizontal',
    alignment: 'center'
  });
  const section2 = document.createElement('div');
  section2.style.marginBottom = '24px';
  const label2 = document.createElement('h3');
  label2.textContent = 'Horizontal - Center';
  label2.style.marginBottom = '12px';
  section2.appendChild(label2);
  section2.appendChild(nav2);
  container.appendChild(section2);
  
  // Horizontal Navigation - Right
  const nav3 = PlusInterface.createNavigation({
    items: baseItems.map((item, i) => ({ ...item, selected: i === 2 })),
    type: 'horizontal',
    alignment: 'right'
  });
  const section3 = document.createElement('div');
  section3.style.marginBottom = '24px';
  const label3 = document.createElement('h3');
  label3.textContent = 'Horizontal - Right';
  label3.style.marginBottom = '12px';
  section3.appendChild(label3);
  section3.appendChild(nav3);
  container.appendChild(section3);
  
  // Vertical Navigation - Left
  const nav4 = PlusInterface.createNavigation({
    items: baseItems,
    type: 'vertical',
    alignment: 'left'
  });
  const section4 = document.createElement('div');
  section4.style.marginBottom = '24px';
  const label4 = document.createElement('h3');
  label4.textContent = 'Vertical - Left';
  label4.style.marginBottom = '12px';
  section4.appendChild(label4);
  section4.appendChild(nav4);
  container.appendChild(section4);
  
  // Tabs Navigation
  const nav5 = PlusInterface.createNavigation({
    items: baseItems,
    type: 'tabs',
    alignment: 'left'
  });
  const section5 = document.createElement('div');
  section5.style.marginBottom = '24px';
  const label5 = document.createElement('h3');
  label5.textContent = 'Tabs';
  label5.style.marginBottom = '12px';
  section5.appendChild(label5);
  section5.appendChild(nav5);
  container.appendChild(section5);
  
  // Pills Navigation
  const nav6 = PlusInterface.createNavigation({
    items: baseItems,
    type: 'pills',
    alignment: 'left'
  });
  const section6 = document.createElement('div');
  section6.style.marginBottom = '24px';
  const label6 = document.createElement('h3');
  label6.textContent = 'Pills';
  label6.style.marginBottom = '12px';
  section6.appendChild(label6);
  section6.appendChild(nav6);
  container.appendChild(section6);
  
  return container;
};

/**
 * Interactive
 * Interactive playground with Storybook controls
 * Based on Figma Properties: Type and Alignment
 */
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








