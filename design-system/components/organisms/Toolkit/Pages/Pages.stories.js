/**
 * Toolkit Organism - Pages
 */

export default {
  title: 'Organisms/Toolkit/Pages',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Complete page-level components for toolkit.',
      },
    },
  },
};

export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Toolkit Pages';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Complete page-level components for toolkit. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const components = [
      { name: 'SessionInfo', description: 'Session info pages (page=1-6)' },
      { name: 'FormFeedback', description: 'Form feedback pages (Form Feedback - 1, Form Feedback - 2)' },
      { name: 'Steps', description: 'Steps pages (Steps, Steps detailed)' },
      { name: 'CallOffsPage', description: 'Full page for call-offs (view: pending/past, user type: tutor/supervisors, pop-up?: false/true)' },
      { name: 'SignUpsPage', description: 'Full page for sign-ups (view: recurring/one-time, user type: tutor/supervisors, pop-up?: false/true)' },
      { name: 'ReflectionsPage', description: 'Full page for reflections (type: Default)' },
      { name: 'MySessionsPage', description: 'Full page for my sessions (pop-up?: off/on, has alert?: no, user: both)' },
      { name: 'SessionSignUpPage', description: 'Session sign-up page' },
      { name: 'StudentsDashboard', description: 'Students dashboard (view: Default/loading/toast)' },
      { name: 'SessionReflection', description: 'Session reflection pages (part=1-4)' },
      { name: 'StudentReflection', description: 'Student reflection pages (part=1-3)' },
    ];
    
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    
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

