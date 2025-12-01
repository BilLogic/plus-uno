/**
 * Student Admin Organism - Modals
 * 
 * Modal dialogs for Student Admin.
 * 
 * ## Components in this Category
 * 
 * - **StudentsModal**: Modal showing student information with tabbed interface
 *   - type=Info: Displays student information fields (read-only)
 *   - type=Sessions: Shows student session history table
 *   - Includes tab navigation between Info and Sessions
 *   - Footer buttons: Delete This Student, Cancel, Save (disabled)
 */

import { createStudentsModal } from './index.js';

export default {
  title: 'Specs/Admin/Student Admin/Modals',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Modal dialogs for displaying student information and session details. These modals provide detailed information about individual students.',
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
    title.textContent = 'Student Admin Modals';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Modal dialogs for displaying student information and session details. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    
    const components = [
      {
        name: 'StudentsModal',
        description: 'Modal showing student information with tabbed interface. Displays student details in Info tab or session history in Sessions tab.',
        variants: [
          'type=Info: Displays read-only form fields (Preferred name, Email, Student status, School, Tutors)',
          'type=Sessions: Shows table with student session history (Day, Shift, Status)',
          'Tab navigation: Switch between Info and Sessions tabs',
          'Footer buttons: Delete This Student (danger text), Cancel (secondary tonal), Save (disabled filled)',
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
 * Students Modal
 * Shows both Info and Sessions modals on one page (same component, different status)
 */
export const StudentsModal = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.alignItems = 'center';
    container.style.minHeight = '100vh';
    container.style.backgroundColor = 'var(--color-surface-container)';
    
    // Info modal
    const infoLabel = document.createElement('div');
    infoLabel.style.fontFamily = 'var(--font-family-header)';
    infoLabel.style.fontSize = 'var(--font-size-h5)';
    infoLabel.style.fontWeight = 'var(--font-weight-semibold)';
    infoLabel.style.color = 'var(--color-on-surface)';
    infoLabel.style.marginBottom = 'var(--size-element-gap-md)';
    infoLabel.textContent = 'Info Modal';
    container.appendChild(infoLabel);
    
    const infoModal = createStudentsModal({
      type: 'Info',
      studentName: 'Student Name'
    });
    container.appendChild(infoModal);
    
    // Sessions modal
    const sessionsLabel = document.createElement('div');
    sessionsLabel.style.fontFamily = 'var(--font-family-header)';
    sessionsLabel.style.fontSize = 'var(--font-size-h5)';
    sessionsLabel.style.fontWeight = 'var(--font-weight-semibold)';
    sessionsLabel.style.color = 'var(--color-on-surface)';
    sessionsLabel.style.marginTop = 'var(--size-section-gap-lg)';
    sessionsLabel.style.marginBottom = 'var(--size-element-gap-md)';
    sessionsLabel.textContent = 'Sessions Modal';
    container.appendChild(sessionsLabel);
    
    const sessionsModal = createStudentsModal({
      type: 'Sessions',
      studentName: 'Student Name'
    });
    container.appendChild(sessionsModal);
    
    return container;
  },
};
