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
  title: 'Specs/Universal/Elements',
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
 * User Avatar - Interactive
 * Interactive user avatar with controls
 */
export const UserAvatarInteractive = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';

    const avatar = createUserAvatar({
      firstChar: args.firstChar,
      name: args.name,
      counter: args.counter,
      counterValue: args.counterValue,
      state: args.state,
      type: args.type
    });

    container.appendChild(avatar);
    return container;
  },
  args: {
    firstChar: 'J',
    name: 'John Doe',
    counter: true,
    counterValue: 2,
    state: 'enabled',
    type: 'regular tutor'
  },
  argTypes: {
    firstChar: {
      name: 'First Char',
      control: 'text'
    },
    name: {
      name: 'Name',
      control: 'text'
    },
    counter: {
      name: 'Counter',
      control: 'boolean'
    },
    counterValue: {
      name: 'Counter Value',
      control: 'number',
      if: { arg: 'counter' }
    },
    state: {
      name: 'State',
      control: { type: 'radio' },
      options: ['enabled', 'hover'],
      description: 'Component state'
    },
    type: {
      name: 'User Type',
      control: { type: 'select' },
      options: ['regular tutor', 'lead tutor', 'admin'],
      description: 'Type of user (affects badge color)'
    }
  }
};

/**
 * Sidebar Tab - Interactive
 * Interactive sidebar tab with controls
 */
export const SidebarTabInteractive = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.backgroundColor = 'var(--color-surface)'; // Ensure visibility

    const tab = createSidebarTab({
      text: args.text,
      icon: args.icon,
      state: args.state,
      leadingVisual: args.leadingVisual,
      trailingVisual: args.trailingVisual
    });

    container.appendChild(tab);
    return container;
  },
  argTypes: {
    text: { control: 'text' },
    icon: { control: 'text' },
    state: {
      control: { type: 'select' },
      options: ['enabled', 'hover', 'selected', 'disabled', 'focus']
    },
    leadingVisual: { control: 'boolean' },
    trailingVisual: { control: 'boolean' }
  },
  args: {
    text: 'Tab Title',
    icon: 'icons',
    state: 'enabled',
    leadingVisual: true,
    trailingVisual: false
  }
};

