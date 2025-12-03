/**
 * Universal Organism - Sections
 * 
 * Section-level components for universal organisms.
 * 
 * ## Components in this Category
 * 
 * - **Sidebar**: Navigation sidebar with tutor and supervisor variants
 * - **TopBar**: Top navigation bar with breadcrumb and user avatar
 * - **Footer**: Page footer with copyright and version information
 */

import { createSidebar, createTopBar, createFooter } from './index.js';

export default {
  title: 'Specs/Universal/Sections',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Section-level components for universal organisms. These are larger container components used across multiple product pillars.',
      },
    },
  },
};



/**
 * Sidebar - Interactive
 * Shows sidebar with interactive controls for user type and visibility
 */
export const SidebarInteractive = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.width = args.visible ? '250px' : '0px'; // Collapse container if invisible
    container.style.backgroundColor = 'var(--color-surface-container)';
    container.style.padding = args.visible ? 'var(--size-section-pad-y-md)' : '0px'; // Remove padding if invisible
    container.style.height = '100vh'; // Ensure full height for better visualization

    const sidebar = createSidebar({
      user: args.user,
      visible: args.visible,
      onHomeClick: () => console.log('Home clicked'),
      onTabClick: (tabName) => console.log('Tab clicked:', tabName)
    });

    container.appendChild(sidebar);
    return container;
  },
  argTypes: {
    user: {
      control: { type: 'select' },
      options: ['tutor', 'supervisor'],
      description: 'User type (determines available sections)'
    },
    visible: {
      control: 'boolean',
      description: 'Toggle sidebar visibility'
    }
  },
  args: {
    user: 'supervisor',
    visible: true,
  },
};

/**
 * Top Bar - Interactive
 * Shows top bar with interactive controls
 */
export const TopBarInteractive = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.backgroundColor = 'var(--color-surface-container)';
    container.style.padding = 'var(--size-section-pad-y-sm)';

    const topBar = createTopBar({
      mode: args.mode,
      breadcrumbItems: [{ text: 'Strategies' }],
      userName: args.userName,
      userFirstChar: args.userName.charAt(0),
      counterValue: args.counterValue,
      onSidebarToggle: () => console.log('Sidebar toggle clicked'),
      onUserClick: () => console.log('User avatar clicked')
    });

    container.appendChild(topBar);
    return container;
  },
  argTypes: {
    mode: {
      control: { type: 'select' },
      options: ['expanded', 'collapsed'],
      description: 'Top Bar mode'
    },
    userName: {
      control: 'text',
      description: 'User name'
    },
    counterValue: {
      control: 'number',
      description: 'Notification counter value'
    }
  },
  args: {
    mode: 'expanded',
    userName: 'John Doe',
    counterValue: 2
  }
};

/**
 * Footer - Default
 * Shows footer with version, copyright, and terms of use
 */
export const FooterDefault = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.backgroundColor = 'var(--color-surface-container)';
    container.style.padding = 'var(--size-section-pad-y-md)';

    const footer = createFooter({
      version: 'v5.2.0',
      copyright: 'Copyright © Carnegie Mellon University 2024',
      termsText: 'Terms of Use',
      termsUrl: '#'
    });

    container.appendChild(footer);
    return container;
  },
};

