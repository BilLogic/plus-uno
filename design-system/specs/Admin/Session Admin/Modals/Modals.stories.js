/**
 * Session Admin Organism - Modals
 * 
 * Modal dialogs for Session Admin.
 * 
 * ## Components in this Category
 * 
 * - **SessionBreakdownModal**: Modal showing detailed session breakdown with student information
 *   - Displays session date in title
 *   - Shows table with student details: Student Name, Student Status, Tutor Name, Tutor Type, Time Spent (Mins)
 *   - Scrollable content area (456px height)
 *   - Includes close button in header
 */

import { createSessionBreakdownModal } from './index.js';

export default {
  title: 'Specs/Admin/Session Admin/Modals',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Modal dialogs for displaying session breakdown details. These modals provide detailed information about individual sessions.',
      },
    },
  },
};

/**
 * Overview
 * Shows all modals that will be available in this category
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Session Admin Modals';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Modal dialogs for displaying session breakdown details. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    
    const components = [
      {
        name: 'SessionBreakdownModal',
        description: 'Modal showing detailed session breakdown with student information. Displays session date in title and includes a scrollable table with student details.',
        variants: [
          'Shows session date in title (e.g., "11/02/12 Session Breakdown")',
          'Table columns: Student Name, Student Status, Tutor Name, Tutor Type, Time Spent (Mins)',
          'Scrollable content area (456px height)',
          'Includes close button in header',
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
 * Session Breakdown Modal
 */
export const SessionBreakdownModal = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'flex-start';
    container.style.minHeight = '100vh';
    container.style.backgroundColor = 'var(--color-surface-container-lowest)';
    container.style.width = '100%';
    
    const modal = createSessionBreakdownModal({
      sessionDate: '11/02/12',
      // Use default students (all 9 rows) to match Figma design
      students: []
    });
    
    // Ensure modal is visible and positioned correctly
    modal.style.position = 'relative';
    modal.style.margin = '0 auto';
    
    container.appendChild(modal);
    
    return container;
  },
};
