/**
 * Tutor Admin Organism - Modals
 * 
 * Modal dialogs for Tutor Admin.
 * 
 * ## Components in this Category
 * 
 * - **TutorsOverviewModal**: Modal showing tutor overview information with tabs
 *   - tab=Info: Displays tutor information
 *   - tab=Sessions: Shows tutor session details
 *   - tab=Add a new tutor: Form for adding a new tutor
 * - **DeleteTutorConfirmation**: Confirmation modal for deleting a tutor
 *   - Includes warning message and action buttons (Delete, Keep)
 */

import { createTutorsOverviewModal } from './TutorsOverviewModal.js';
import { createDeleteTutorConfirmation } from './DeleteTutorConfirmation.js';

export default {
  title: 'Specs/Admin/Tutor Admin/Modals',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Modal dialogs for Tutor Admin. These modals provide tutor management capabilities and detailed tutor information.',
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
    title.textContent = 'Tutor Admin Modals';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Modal dialogs for Tutor Admin. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    
    const components = [
      {
        name: 'TutorsOverviewModal',
        description: 'Modal showing tutor overview information with tabbed interface. Displays tutor details, session information, or form for adding new tutors.',
        variants: [
          'tab=Info: Displays tutor information and details',
          'tab=Sessions: Shows tutor session history and details',
          'tab=Add a new tutor: Form interface for adding a new tutor',
        ],
      },
      {
        name: 'DeleteTutorConfirmation',
        description: 'Confirmation modal for deleting a tutor. Includes warning message and action buttons to confirm or cancel the deletion.',
        variants: [
          'Warning message about tutor deletion',
          'Delete button: Confirms deletion',
          'Keep button: Cancels deletion',
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
 * TutorsOverviewModal - All Variants
 * Shows all three variants of the TutorsOverviewModal component
 */
export const TutorsOverviewModal = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.backgroundColor = 'var(--color-surface)';
    
    // Info Tab Variant
    const infoSection = document.createElement('div');
    infoSection.style.display = 'flex';
    infoSection.style.flexDirection = 'column';
    infoSection.style.gap = 'var(--size-element-gap-md)';
    infoSection.style.width = '100%';
    infoSection.style.maxWidth = '800px';
    
    const infoLabel = document.createElement('h3');
    infoLabel.className = 'h5';
    infoLabel.textContent = 'TutorsOverviewModal - Info Tab';
    infoLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    infoSection.appendChild(infoLabel);
    
    const infoModal = createTutorsOverviewModal({
      tab: 'Info',
      tutorName: 'Amelia Blue'
    });
    infoSection.appendChild(infoModal);
    container.appendChild(infoSection);
    
    // Sessions Tab Variant
    const sessionsSection = document.createElement('div');
    sessionsSection.style.display = 'flex';
    sessionsSection.style.flexDirection = 'column';
    sessionsSection.style.gap = 'var(--size-element-gap-md)';
    sessionsSection.style.width = '100%';
    sessionsSection.style.maxWidth = '800px';
    
    const sessionsLabel = document.createElement('h3');
    sessionsLabel.className = 'h5';
    sessionsLabel.textContent = 'TutorsOverviewModal - Sessions Tab';
    sessionsLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    sessionsSection.appendChild(sessionsLabel);
    
    const sessionsModal = createTutorsOverviewModal({
      tab: 'Sessions',
      tutorName: 'Amelia Blue'
    });
    sessionsSection.appendChild(sessionsModal);
    container.appendChild(sessionsSection);
    
    // Add a new tutor Tab Variant
    const addTutorSection = document.createElement('div');
    addTutorSection.style.display = 'flex';
    addTutorSection.style.flexDirection = 'column';
    addTutorSection.style.gap = 'var(--size-element-gap-md)';
    addTutorSection.style.width = '100%';
    addTutorSection.style.maxWidth = '800px';
    
    const addTutorLabel = document.createElement('h3');
    addTutorLabel.className = 'h5';
    addTutorLabel.textContent = 'TutorsOverviewModal - Add a new tutor Tab';
    addTutorLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    addTutorSection.appendChild(addTutorLabel);
    
    const addTutorModal = createTutorsOverviewModal({
      tab: 'Add a new tutor',
      tutorName: 'Add a new tutor:'
    });
    addTutorSection.appendChild(addTutorModal);
    container.appendChild(addTutorSection);
    
    return container;
  },
};

/**
 * DeleteTutorConfirmation
 * Confirmation modal for deleting a tutor
 */
export const DeleteTutorConfirmation = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const modal = createDeleteTutorConfirmation({
      onDelete: () => console.log('Delete clicked'),
      onKeep: () => console.log('Keep clicked')
    });
    
    container.appendChild(modal);
    return container;
  },
};
