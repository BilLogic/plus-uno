/**
 * Universal Organism - Elements
 * 
 * Element-level components for universal organisms.
 * 
 * ## Components in this Category
 * 
 * - **SidebarTab**: Sidebar navigation tab with states
 * - **UserAvatar**: User avatar with name and notification counter
 * - **StaticBadgeSmart**: SMART competency area badge
 */

import { createSidebarTab, createUserAvatar, createStaticBadgeSmart } from './index.js';

export default {
  title: 'Organisms/Universal/Elements',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Element-level components for universal organisms. These are reusable building blocks used in universal navigation and UI patterns.',
      },
    },
  },
};

/**
 * Sidebar Tab - All States
 * Shows all sidebar tab states: enabled, hover, selected, disabled, focus
 */
export const SidebarTabStates = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.maxWidth = '300px';
    
    const states = [
      { state: 'enabled', text: 'Tab Title' },
      { state: 'hover', text: 'Tab Title' },
      { state: 'selected', text: 'Tab Title' },
      { state: 'disabled', text: 'Tab Title' },
      { state: 'focus', text: 'Tab Title' }
    ];
    
    states.forEach(({ state, text }) => {
      const tab = createSidebarTab({
        text: text,
        icon: 'icons',
        state: state,
        leadingVisual: true
      });
      container.appendChild(tab);
    });
    
    return container;
  },
};

/**
 * User Avatar - Variants
 * Shows user avatar with different configurations
 */
export const UserAvatarVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.maxWidth = '300px';
    
    const variants = [
      { name: 'John Doe', firstChar: 'J', counter: true, counterValue: 2 },
      { name: 'Jane Smith', firstChar: 'J', counter: true, counterValue: 5 },
      { name: 'Bob Wilson', firstChar: 'B', counter: false }
    ];
    
    variants.forEach((variant) => {
      const avatar = createUserAvatar({
        firstChar: variant.firstChar,
        name: variant.name,
        showName: true,
        counter: variant.counter,
        counterValue: variant.counterValue
      });
      container.appendChild(avatar);
    });
    
    return container;
  },
};

/**
 * Static Badge SMART
 * Interactive SMART competency area badge with type and size properties
 */
export const StaticBadgeSmart = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.maxWidth = '400px';
    
    const badge = createStaticBadgeSmart({
      type: args.type,
      size: args.size
    });
    container.appendChild(badge);
    
    return container;
  },
  argTypes: {
    type: {
      control: 'select',
      options: [
        'socio-emotional',
        'mastering-content',
        'advocacy',
        'relationships',
        'technology-tools'
      ],
      description: 'SMART competency area type',
    },
    size: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b1', 'b2', 'b3'],
      description: 'Badge size',
    },
  },
  args: {
    type: 'socio-emotional',
    size: 'h1',
  },
};

