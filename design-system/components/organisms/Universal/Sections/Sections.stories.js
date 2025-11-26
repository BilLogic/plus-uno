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
  title: 'Organisms/Universal/Sections',
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
 * Sidebar - Tutor Variant
 * Shows sidebar for tutor user type
 */
export const SidebarTutor = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '250px';
    container.style.backgroundColor = 'var(--color-surface-container)';
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    const sidebar = createSidebar({
      user: 'tutor',
      onHomeClick: () => console.log('Home clicked'),
      onTabClick: (tabName) => console.log('Tab clicked:', tabName)
    });
    
    container.appendChild(sidebar);
    return container;
  },
};

/**
 * Sidebar - Supervisor Variant
 * Shows sidebar for supervisor user type (includes Admin section)
 */
export const SidebarSupervisor = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '250px';
    container.style.backgroundColor = 'var(--color-surface-container)';
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    const sidebar = createSidebar({
      user: 'supervisor',
      onHomeClick: () => console.log('Home clicked'),
      onTabClick: (tabName) => console.log('Tab clicked:', tabName)
    });
    
    container.appendChild(sidebar);
    return container;
  },
};

/**
 * Top Bar - Expanded Mode
 * Shows top bar in expanded mode with sidebar toggle, breadcrumb, and user avatar
 */
export const TopBarExpanded = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.backgroundColor = 'var(--color-surface-container)';
    container.style.padding = 'var(--size-section-pad-y-sm)';
    
    const topBar = createTopBar({
      mode: 'expanded',
      breadcrumbItems: [{ text: 'Strategies' }],
      userName: 'John Doe',
      userFirstChar: 'J',
      counterValue: 2,
      onSidebarToggle: () => console.log('Sidebar toggle clicked'),
      onUserClick: () => console.log('User avatar clicked')
    });
    
    container.appendChild(topBar);
    return container;
  },
};

/**
 * Top Bar - Collapsed Mode
 * Shows top bar in collapsed mode
 */
export const TopBarCollapsed = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.backgroundColor = 'var(--color-surface-container)';
    container.style.padding = 'var(--size-section-pad-y-sm)';
    
    const topBar = createTopBar({
      mode: 'collapsed',
      breadcrumbItems: [{ text: 'Strategies' }],
      userName: 'John Doe',
      userFirstChar: 'J',
      counterValue: 2,
      onSidebarToggle: () => console.log('Sidebar toggle clicked'),
      onUserClick: () => console.log('User avatar clicked')
    });
    
    container.appendChild(topBar);
    return container;
  },
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

