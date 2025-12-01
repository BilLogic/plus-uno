/**
 * Student Admin Organism - Pages
 * 
 * Complete page-level components for Student Admin.
 * 
 * ## Components in this Category
 * 
 * - **StudentAdminPage**: Full page layout for Student Admin
 *   - Top bar with breadcrumb and user avatar
 *   - Student Overview section with filters and 3 data cards
 *   - Student Details section with table and pagination
 *   - Add Student button
 */

import { createStudentAdminPage } from './index.js';

export default {
  title: 'Specs/Admin/Student Admin/Pages',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Complete page-level components for Student Admin. These are full-page experiences that combine multiple elements, cards, sections, and tables.',
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
    title.textContent = 'Student Admin Pages';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Complete page-level components for Student Admin. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    
    const components = [
      {
        name: 'StudentAdminPage',
        description: 'Full page layout for Student Admin with overview statistics and student details table. Includes top bar, filters, overview cards, and student details table with pagination.',
        variants: [
          'Top bar with breadcrumb navigation and user avatar',
          'Student Overview section: Title, filters (School dropdown, Date range), and 3 data cards',
          'Student Details section: Title, Add Student button, table with 5 columns, and pagination',
          'Table columns: Student, School, Teacher, Latest Status, Action',
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
 * Student Admin Page
 * Shows the page without any modal
 */
export const StudentAdminPage = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'flex-start';
    container.style.minHeight = '100vh';
    container.style.backgroundColor = 'var(--color-surface-container)';
    container.style.overflowX = 'auto';
    
    const page = createStudentAdminPage({ showModal: false });
    container.appendChild(page);
    
    return container;
  },
};

/**
 * Student Admin Page - With Modal
 * Shows the page with a modal overlay and scrim
 */
export const StudentAdminPageWithModal = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'flex-start';
    container.style.minHeight = '100vh';
    container.style.backgroundColor = 'var(--color-surface-container)';
    container.style.overflowX = 'auto';
    
    const page = createStudentAdminPage({ showModal: true, modalType: 'Info' });
    container.appendChild(page);
    
    return container;
  },
};

