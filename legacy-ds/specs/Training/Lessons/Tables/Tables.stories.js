/**
 * Training Organism - Tables
 */

import { createLessonListItem } from './LessonListItem.js';

export default {
  title: 'Specs/Training/Lessons/Tables',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Table components used in training contexts.',
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
    title.textContent = 'Training Tables';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Table components used in training contexts. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const components = [
      { name: 'LessonListItem', description: 'Lesson list item with types: header, item; states: default, hover, pressed, focus, disable; expand?: false, true' },
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

export const LessonListItem = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    
    const title = document.createElement('h2');
    title.className = 'h3';
    title.textContent = 'LessonListItem - Master Component';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body2-txt';
    description.textContent = 'Single master component containing all states. Use controls to switch between variants.';
    description.style.marginBottom = 'var(--size-card-gap-md)';
    container.appendChild(description);
    
    // Create component based on args
    const component = createLessonListItem({
      type: args.type,
      state: args.state,
      expand: args.expand,
      lessonTitle: args.lessonTitle,
      lessonDescription: args.lessonDescription,
      competencyArea: args.competencyArea,
      duration: args.duration,
      status: args.status,
      showAiIndicator: args.showAiIndicator
    });
    
    container.appendChild(component);
    return container;
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['header', 'item'],
      description: 'Row type',
    },
    state: {
      control: 'select',
      options: ['default', 'hover', 'pressed', 'focus', 'disable'],
      description: 'Row state (only applies to item type)',
    },
    expand: {
      control: 'boolean',
      description: 'Whether row is expanded (only applies to item type)',
    },
    lessonTitle: {
      control: 'text',
      description: 'Lesson title (only applies to item type)',
    },
    lessonDescription: {
      control: 'text',
      description: 'Lesson description (shown when expanded)',
    },
    competencyArea: {
      control: 'select',
      options: ['socio-emotional', 'mastering-content', 'advocacy', 'relationships', 'technology-tools'],
      description: 'SMART competency area',
    },
    duration: {
      control: 'text',
      description: 'Lesson duration',
    },
    status: {
      control: 'select',
      options: ['not started', 'in progress', 'started', 'complete', 'assigned'],
      description: 'Lesson status',
    },
    showAiIndicator: {
      control: 'boolean',
      description: 'Whether to show AI indicator',
    },
  },
  args: {
    type: 'item',
    state: 'default',
    expand: false,
    lessonTitle: 'Introduction to Social-Emotional Learning',
    lessonDescription: 'Learn how to build and maintain strong relationships with students.',
    competencyArea: 'socio-emotional',
    duration: '12mins',
    status: 'not started',
    showAiIndicator: true,
  },
};

/**
 * All States Showcase
 * Shows all states in one view for easy comparison
 */
export const AllStates = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    const title = document.createElement('h2');
    title.className = 'h3';
    title.textContent = 'All States Showcase';
    container.appendChild(title);
    
    // Header
    const headerSection = document.createElement('div');
    headerSection.style.display = 'flex';
    headerSection.style.flexDirection = 'column';
    headerSection.style.gap = 'var(--size-card-gap-sm)';
    
    const headerLabel = document.createElement('h3');
    headerLabel.className = 'h4';
    headerLabel.textContent = 'Header';
    headerSection.appendChild(headerLabel);
    
    const header = createLessonListItem({ type: 'header' });
    headerSection.appendChild(header);
    container.appendChild(headerSection);
    
    // Item States
    const statesSection = document.createElement('div');
    statesSection.style.display = 'flex';
    statesSection.style.flexDirection = 'column';
    statesSection.style.gap = 'var(--size-card-gap-md)';
    
    const statesLabel = document.createElement('h3');
    statesLabel.className = 'h4';
    statesLabel.textContent = 'Item States (Not Expanded)';
    statesSection.appendChild(statesLabel);
    
    const states = ['default', 'hover', 'pressed', 'focus', 'disable'];
    states.forEach(state => {
      const stateLabel = document.createElement('div');
      stateLabel.className = 'body2-txt';
      stateLabel.textContent = `State: ${state}`;
      stateLabel.style.marginTop = 'var(--size-card-gap-sm)';
      stateLabel.style.marginBottom = 'var(--size-element-gap-sm)';
      statesSection.appendChild(stateLabel);
      
      const item = createLessonListItem({
        type: 'item',
        state: state,
        expand: false,
        lessonTitle: 'Introduction to Social-Emotional Learning',
        competencyArea: 'socio-emotional',
        duration: '12mins',
        status: state === 'disable' ? 'not started' : 'in progress',
        showAiIndicator: true
      });
      statesSection.appendChild(item);
    });
    
    container.appendChild(statesSection);
    
    // Expanded States
    const expandedSection = document.createElement('div');
    expandedSection.style.display = 'flex';
    expandedSection.style.flexDirection = 'column';
    expandedSection.style.gap = 'var(--size-card-gap-md)';
    
    const expandedLabel = document.createElement('h3');
    expandedLabel.className = 'h4';
    expandedLabel.textContent = 'Item States (Expanded)';
    expandedSection.appendChild(expandedLabel);
    
    states.forEach(state => {
      const stateLabel = document.createElement('div');
      stateLabel.className = 'body2-txt';
      stateLabel.textContent = `State: ${state} (Expanded)`;
      stateLabel.style.marginTop = 'var(--size-card-gap-sm)';
      stateLabel.style.marginBottom = 'var(--size-element-gap-sm)';
      expandedSection.appendChild(stateLabel);
      
      const item = createLessonListItem({
        type: 'item',
        state: state,
        expand: true,
        lessonTitle: 'Building Strong Relationships',
        lessonDescription: 'Learn how to build and maintain strong relationships with students.',
        competencyArea: 'relationships',
        duration: '15mins',
        status: state === 'disable' ? 'not started' : 'in progress',
        showAiIndicator: true
      });
      expandedSection.appendChild(item);
    });
    
    container.appendChild(expandedSection);
    
    return container;
  },
};
