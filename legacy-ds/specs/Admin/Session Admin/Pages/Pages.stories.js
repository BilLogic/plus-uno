/**
 * Session Admin Organism - Pages
 * 
 * Complete page-level components for Session Admin.
 * 
 * ## Components in this Category
 * 
 * - **SessionAdminPage**: Full page layout for Session Admin
 *   - Top bar with breadcrumb and user avatar
 *   - Tab navigation (Warnings, Current Tutors, Incoming Tutors, Details)
 *   - Filters section (School dropdown, Tutor dropdown, Date range)
 *   - Session Overview section with 5 data cards
 *   - Session Details table with pagination
 */

import { createSessionAdminPage } from './index.js';
import { createPageWidthWrapper, pageWidthArgTypes, pageWidthArgs } from '../../../utils/pageWidthControl.js';

export default {
  title: 'Specs/Admin/Session Admin/Pages',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Complete page-level components for Session Admin. These are full-page experiences that combine multiple elements, cards, sections, and tables.',
      },
    },
  },
};

/**
 * Overview
 * Shows all pages that will be available in this category
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Session Admin Pages';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Complete page-level components for Session Admin. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    
    const components = [
      {
        name: 'SessionAdminPage',
        description: 'Full page layout for Session Admin with overview statistics and session details table. Includes top bar, tab navigation, filters, overview cards, and session details table with pagination.',
        variants: [
          'Top bar with breadcrumb navigation and user avatar',
          'Tab navigation: Warnings (selected), Current Tutors, Incoming Tutors, Details (disabled)',
          'Filters: School dropdown, Tutor dropdown, Date range (start and end dates)',
          'Session Overview section: 5 data cards with statistics',
          'Session Details table: 8 columns with sortable headers and color-coded statistics',
          'Pagination footer: Shows entry count and page navigation',
        ],
      },
    ];
    
    components.forEach((component) => {
      const componentCard = document.createElement('div');
      componentCard.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
      componentCard.style.border = '1px solid var(--color-outline-variant)';
      componentCard.style.borderRadius = 'var(--size-card-radius-sm)';
      componentCard.style.backgroundColor = 'var(--color-surface-container)';
      
      const componentName = document.createElement('h3');
      componentName.className = 'h4';
      componentName.textContent = component.name;
      componentName.style.marginBottom = 'var(--size-element-gap-sm)';
      componentCard.appendChild(componentName);
      
      const componentDesc = document.createElement('p');
      componentDesc.className = 'body2-txt';
      componentDesc.textContent = component.description;
      componentDesc.style.marginBottom = 'var(--size-element-gap-sm)';
      componentCard.appendChild(componentDesc);
      
      if (component.variants) {
        const variantsList = document.createElement('ul');
        variantsList.className = 'body2-txt';
        variantsList.style.paddingLeft = 'var(--size-section-pad-y-md)';
        variantsList.style.marginTop = 'var(--size-element-gap-xs)';
        
        component.variants.forEach((variant) => {
          const li = document.createElement('li');
          li.textContent = variant;
          li.style.marginBottom = 'var(--size-element-gap-xs)';
          variantsList.appendChild(li);
        });
        
        componentCard.appendChild(variantsList);
      }
      
      componentsList.appendChild(componentCard);
    });
    
    container.appendChild(componentsList);
    
    return container;
  },
};

/**
 * Session Admin Page
 * Shows the page without any modal
 */
export const SessionAdminPage = {
  render: (args) => {
    const page = createSessionAdminPage({ showModal: false });
    return createPageWidthWrapper(page, args.pageWidth);
  },
  argTypes: {
    ...pageWidthArgTypes,
  },
  args: {
    ...pageWidthArgs,
  },
};

/**
 * Session Admin Page - With Modal
 * Shows the page with a session breakdown modal overlay and scrim
 */
export const SessionAdminPageWithModal = {
  render: (args) => {
    const page = createSessionAdminPage({ showModal: true });
    return createPageWidthWrapper(page, args.pageWidth);
  },
  argTypes: {
    ...pageWidthArgTypes,
  },
  args: {
    ...pageWidthArgs,
  },
};
