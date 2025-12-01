/**
 * Training Organisms
 * Training-specific organisms for training interfaces
 */

export default {
  title: 'Specs/Training',
  tags: ['autodocs'],
};

/**
 * Overview
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Training Organisms';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Training organisms are specific to training interfaces and functionality. These components are organized by type: Onboarding and Lessons. Each type contains Elements, Tables, Cards, Modals, Sections, and Pages.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    return container;
  },
};

