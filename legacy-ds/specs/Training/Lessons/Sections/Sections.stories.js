/**
 * Training Organism - Sections
 */

import { createLessonsStudentOverviewSection } from './LessonsStudentOverviewSection.js';
import { createLessonsCompetencyHeaderSection } from './LessonsCompetencyHeaderSection.js';
import { createLessonsWelcomeRow } from './LessonsWelcomeRow.js';

export default {
  title: 'Specs/Training/Lessons/Sections',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Section-level components for training lessons pages.',
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
    title.textContent = 'Training Lessons Sections';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Section-level components for training lessons pages. These components match the Figma design system specifications exactly.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const components = [
      { name: 'LessonsStudentOverviewSection', description: 'Section with "My Students" title, "View All" button, and student table' },
      { name: 'LessonsCompetencyHeaderSection', description: 'Section with "Students Overview" title and horizontal scrollable cards' },
      { name: 'LessonsWelcomeRow', description: 'Welcome section with tabs and jumbotron content' },
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

export const LessonsStudentOverviewSection = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.padding = 'var(--size-section-pad-y-md)';
    wrapper.style.width = '100%';
    wrapper.style.display = 'flex';
    wrapper.style.justifyContent = 'center';
    const component = createLessonsStudentOverviewSection();
    wrapper.appendChild(component);
    return wrapper;
  },
};

export const LessonsCompetencyHeaderSection = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.padding = 'var(--size-section-pad-y-md)';
    wrapper.style.width = '100%';
    wrapper.style.display = 'flex';
    wrapper.style.justifyContent = 'center';
    const component = createLessonsCompetencyHeaderSection();
    wrapper.appendChild(component);
    return wrapper;
  },
};

export const LessonsWelcomeRow = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.padding = 'var(--size-section-pad-y-md)';
    wrapper.style.width = '100%';
    wrapper.style.display = 'flex';
    wrapper.style.justifyContent = 'center';
    const component = createLessonsWelcomeRow();
    wrapper.appendChild(component);
    return wrapper;
  },
};
