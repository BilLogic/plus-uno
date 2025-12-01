/**
 * Training Organism - Cards
 */

import { createAlertForSupervisors } from './AlertForSupervisors.js';
import { createLessonCardItem } from './LessonCardItem.js';

export default {
  title: 'Specs/Training/Lessons/Cards',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Card components for training.',
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
    title.textContent = 'Training Cards';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Card components for training. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const components = [
      { name: 'AlertForSupervisors', description: 'Alert for supervisors with AI feature: enabled, disabled' },
      { name: 'LessonCardItem', description: 'Lesson card with states: default, hover' },
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

export const AlertForSupervisors = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    
    const title = document.createElement('h2');
    title.className = 'h3';
    title.textContent = 'AlertForSupervisors';
    container.appendChild(title);
    
    const enabled = createAlertForSupervisors({
      aiFeature: true,
      studentName: 'John Doe'
    });
    container.appendChild(enabled);
    
    const disabled = createAlertForSupervisors({
      aiFeature: false,
      studentName: 'Jane Smith'
    });
    container.appendChild(disabled);
    
    return container;
  },
};

export const LessonCardItem = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    
    const title = document.createElement('h2');
    title.className = 'h3';
    title.textContent = 'LessonCardItem';
    container.appendChild(title);
    
    const defaultCard = createLessonCardItem({
      lessonTitle: 'Introduction to Social-Emotional Learning',
      lessonDescription: 'Learn the fundamentals of SEL',
      competencyArea: 'mastering-content',
      duration: '12 mins',
      status: 'not started',
      showAiIndicator: true,
      state: 'default'
    });
    container.appendChild(defaultCard);
    
    const hoverCard = createLessonCardItem({
      lessonTitle: 'Building Strong Relationships',
      lessonDescription: 'Explore relationship-building strategies',
      competencyArea: 'relationships',
      duration: '15 mins',
      status: 'in progress',
      showAiIndicator: true,
      state: 'hover'
    });
    container.appendChild(hoverCard);
    
    return container;
  },
};

