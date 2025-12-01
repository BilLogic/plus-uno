/**
 * Navbar Component Stories
 * 
 * ## Usage and Implementation
 * 
 * Navbar components are used to create navigation bars with different types of content (buttons, forms, input groups, nav items, text).
 * They support different background colors and contain navbar items with various states.
 * 
 * ### When to Use
 * - **Top navigation**: Use navbar for main site navigation at the top of pages
 * - **Application bars**: Use navbar for application-level navigation and actions
 * - **Content organization**: Use navbar to organize different types of interactive elements
 * 
 * ### Implementation Context
 * - **Component Type**: Section (uses `section-*` tokens for containers, `element-*` tokens for items)
 * - **Token Usage**: 
 *   - Spacing: Uses `element-*` tokens for padding and gaps
 *   - Colors: Uses semantic color tokens (`--color-primary`, `--color-surface`, etc.)
 *   - Typography: Uses Body/B1 (Merriweather Sans) - Regular for selected, Light for unselected
 * 
 * ### Types
 * - **all**: Contains all component types (nav items, buttons, forms, input groups)
 * - **buttons**: Contains only buttons
 * - **forms**: Contains only form inputs
 * - **input group**: Contains only input groups
 * - **nav**: Contains only navigation items
 * - **text**: Contains navigation items and text
 * - **type8**: Custom type (to be defined)
 * 
 * ### Background Colors
 * - **primary**: Primary color background (blue)
 * - **light**: Light surface background (default)
 * - **dark**: Dark surface background
 * 
 * See design-system/components/overview.md for Section Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Navbar',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Navbar component for creating navigation bars with different types, background colors, and navbar items. Supports various component types and item states.',
      },
    },
  },
};

/**
 * Overview
 * Shows all navbar variants organized by category in a scrollable format
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    // Types Section
    const typesSection = document.createElement('div');
    typesSection.style.display = 'flex';
    typesSection.style.flexDirection = 'column';
    typesSection.style.gap = 'var(--size-card-gap-md)';
    
    const typesHeading = document.createElement('div');
    typesHeading.className = 'h5';
    typesHeading.textContent = 'Types';
    typesHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    typesSection.appendChild(typesHeading);
    
    const navNavbar = PlusInterface.createNavbar({
      brand: 'Navbar',
      items: [
        { text: 'Home', selected: true },
        { text: 'Feature', selected: false },
        { text: 'Pricing', selected: false }
      ],
      type: 'nav',
      backgroundColor: 'light'
    });
    typesSection.appendChild(navNavbar);
    container.appendChild(typesSection);
    
    // Colors Section
    const colorsSection = document.createElement('div');
    colorsSection.style.display = 'flex';
    colorsSection.style.flexDirection = 'column';
    colorsSection.style.gap = 'var(--size-card-gap-md)';
    
    const colorsHeading = document.createElement('div');
    colorsHeading.className = 'h5';
    colorsHeading.textContent = 'Background Colors';
    colorsHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    colorsSection.appendChild(colorsHeading);
    
    const primaryNavbar = PlusInterface.createNavbar({
      brand: 'Navbar',
      items: [
        { text: 'Home', selected: false },
        { text: 'Feature', selected: false },
        { text: 'Pricing', selected: false },
        { text: 'About', selected: false }
      ],
      type: 'nav',
      backgroundColor: 'primary'
    });
    colorsSection.appendChild(primaryNavbar);
    container.appendChild(colorsSection);
    
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
    
    const navbar = PlusInterface.createNavbar({
      brand: args.brand,
      items: args.items,
      type: args.type,
      backgroundColor: args.backgroundColor
    });
    
    container.appendChild(navbar);
    return container;
  },
  args: {
    brand: 'Navbar',
    items: [
      { text: 'Home', selected: true },
      { text: 'Feature', selected: false },
      { text: 'Pricing', selected: false }
    ],
    type: 'nav',
    backgroundColor: 'light'
  },
  argTypes: {
    brand: {
      control: 'text',
      description: 'Brand text displayed in navbar'
    },
    type: {
      control: 'select',
      options: ['all', 'buttons', 'forms', 'input group', 'nav', 'text', 'type8'],
      description: 'Navbar type'
    },
    backgroundColor: {
      control: 'select',
      options: ['primary', 'light', 'dark'],
      description: 'Background color'
    }
  }
};

