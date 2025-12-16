/**
 * Login Organism - Elements
 * 
 * Individual form elements and UI components used in login flows.
 * 
 * ## Components in this Category
 * 
 * - **InstitutionSelection**: Dropdown for selecting institution (states: empty, filled, open, typing)
 * - **AccessCodeForm**: Form for entering access code (states: default, invalid)
 * - **LoginButtons**: Miscellaneous action buttons (try demo, back, continue, log in - enabled/disabled states)
 * - **AuthButtons**: Authentication provider buttons (Google, Clever)
 * - **LoginFooter**: Footer component for login pages
 * - **LoginAlert**: Alert component for login error messages
 * 
 * Each component will have its own story file with all variants and states.
 */

export default {
  title: 'Specs/Login/Elements',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Individual form elements and UI components used in login/authentication flows. These are the building blocks that make up the login cards and pages.',
      },
    },
  },
};

/**
 * Overview
 * Shows all elements that will be available in this category
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Login Elements';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Individual form elements and UI components used in login flows. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    
    const components = [
      {
        name: 'InstitutionSelection',
        description: 'Dropdown for selecting institution with states: empty, filled, open, typing. Supports official and independent types.',
      },
      {
        name: 'AccessCodeForm',
        description: 'Form for entering access code with default and invalid states.',
      },
      {
        name: 'LoginButtons',
        description: 'Miscellaneous action buttons including: try a demo, back to log in portal, continue, and log in. Supports enabled and disabled states.',
      },
      {
        name: 'AuthButtons',
        description: 'Authentication provider buttons for Google and Clever.',
      },
      {
        name: 'LoginFooter',
        description: 'Footer component for login pages.',
      },
      {
        name: 'LoginAlert',
        description: 'Alert component for displaying login error messages and notifications.',
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
      componentCard.appendChild(componentDesc);
      
      componentsList.appendChild(componentCard);
    });
    
    container.appendChild(componentsList);
    
    return container;
  },
};

