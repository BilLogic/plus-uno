/**
 * Toolkit Organism - Tables
 */

export default {
  title: 'Organisms/Toolkit/Tables',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Table components used in toolkit contexts.',
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
    title.textContent = 'Toolkit Tables';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Table components used in toolkit contexts. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const components = [
      { name: 'MySessionsTable', description: 'Table for my sessions with types: header/item, states: default/hover/pressed/focus/disabled' },
      { name: 'CallOffsTable', description: 'Table for call-offs with user types: tutors/supervisors, call-off states: pending/past' },
      { name: 'SignUpsTable', description: 'Table for sign-ups with user types: tutors/supervisors, session types: one-time/recurring' },
      { name: 'ReflectionsTable', description: 'Table for reflections with reflection states: complete/incomplete' },
      { name: 'ScheduleRowEntry', description: 'Schedule row entries with user types and states' },
      { name: 'ScheduleRowEntryTutor', description: 'Schedule row entries for tutors with tabs: shift sign-up/session fill-in' },
      { name: 'StudentListItem', description: 'Student list items with types: header/content, states: default/hover' },
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

