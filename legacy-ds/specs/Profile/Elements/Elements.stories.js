/**
 * Profile Organism - Elements
 * 
 * Individual form elements and UI components used in profile management flows.
 * 
 * ## Components in this Category
 * 
 * - **TutorProfileSelect**: Dropdown for selecting tutor profile type with multiple states and selection options
 * 
 * Each component will have its own story file with all variants and states.
 */

export default {
  title: 'Specs/Profile/Elements',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Individual form elements and UI components used in profile management flows. These are the building blocks that make up the profile pages.',
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
    title.textContent = 'Profile Elements';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Individual form elements and UI components used in profile management flows. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    
    const components = [
      {
        name: 'TutorProfileSelect',
        description: 'Dropdown for selecting tutor profile type with states: Closed (Selection=None), Open (Selection=None), and various selection options:',
        options: [
          'Current Teacher',
          'Current Undergraduate Student',
          'Graduate Student',
          'Retired Teacher',
          'Retired Professional',
          'Americorps',
          'Other',
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
      
      if (component.options) {
        const optionsList = document.createElement('ul');
        optionsList.className = 'body2-txt';
        optionsList.style.paddingLeft = 'var(--size-section-pad-y-md)';
        optionsList.style.marginTop = 'var(--size-element-gap-xs)';
        
        component.options.forEach((option) => {
          const li = document.createElement('li');
          li.textContent = option;
          li.style.marginBottom = 'var(--size-element-gap-xs)';
          optionsList.appendChild(li);
        });
        
        componentCard.appendChild(optionsList);
      }
      
      componentsList.appendChild(componentCard);
    });
    
    container.appendChild(componentsList);
    
    return container;
  },
};

