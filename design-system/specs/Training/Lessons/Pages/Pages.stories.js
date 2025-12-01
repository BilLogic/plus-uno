/**
 * Training Organism - Pages
 */

import { createLessonsOverviewPage } from './LessonsOverviewPage.js';
import { createLessonInnerPage } from './LessonInnerPage.js';

export default {
  title: 'Specs/Training/Lessons/Pages',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Complete page-level components for training lessons.',
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
    title.textContent = 'Training Lessons Pages';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Complete page-level components for training lessons. These components match the Figma design system specifications exactly.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const components = [
      { name: 'LessonsOverviewPage', description: 'Lessons overview page with filter bar, lesson list table, and navigation (node-id=63-178237)' },
      { name: 'LessonInnerPage', description: 'Lesson detail page with multiple variants: page-one, page-two, page-three, page-four, page-five (node-id=63-178289)' },
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

export const LessonsOverviewPageDefault = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.padding = '20px';
    wrapper.style.backgroundColor = 'var(--color-surface-container)';
    wrapper.style.minHeight = '100vh';
    const page = createLessonsOverviewPage();
    wrapper.appendChild(page);
    return wrapper;
  },
  name: 'Lessons Overview Page (Default)',
  parameters: {
    layout: 'fullscreen',
  },
};

export const LessonsOverviewPageCustom = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.padding = '20px';
    wrapper.style.backgroundColor = 'var(--color-surface-container)';
    wrapper.style.minHeight = '100vh';
    const page = createLessonsOverviewPage({
      lessons: [
        { title: 'Introduction to AI', competencyArea: 'mastering-content', status: 'in progress', duration: '12mins', showAiIndicator: true },
        { title: 'Advanced Machine Learning', competencyArea: 'social-emotional', status: 'assigned', duration: '15mins', showAiIndicator: false },
        { title: 'Data Structures', competencyArea: 'advocacy', status: 'completed', duration: '10mins', showAiIndicator: true },
        { title: 'Algorithms', competencyArea: 'relationships', status: 'not started', duration: '8mins', showAiIndicator: false },
        { title: 'Web Development Basics', competencyArea: 'technology-tools', status: 'in progress', duration: '20mins', showAiIndicator: false }
      ],
      onSidebarToggle: () => alert('Sidebar toggled'),
      onExpandAll: () => alert('Expand all clicked'),
      onViewToggle: (view) => alert(`View changed to: ${view}`)
    });
    wrapper.appendChild(page);
    return wrapper;
  },
  name: 'Lessons Overview Page (Custom)',
  parameters: {
    layout: 'fullscreen',
  },
};

export const LessonInnerPageOne = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.padding = '20px';
    wrapper.style.backgroundColor = 'var(--color-surface-container)';
    wrapper.style.minHeight = '100vh';
    const page = createLessonInnerPage({
      variant: 'page-one',
      lessonTitle: 'Giving Effective Praise',
      estimatedTime: '15 Minutes',
      onSidebarToggle: () => alert('Sidebar toggled'),
      onNext: () => alert('Next clicked')
    });
    wrapper.appendChild(page);
    return wrapper;
  },
  name: 'Lesson Inner Page (page-one)',
  parameters: {
    layout: 'fullscreen',
  },
};

export const LessonInnerPageTwo = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.padding = '20px';
    wrapper.style.backgroundColor = 'var(--color-surface-container)';
    wrapper.style.minHeight = '100vh';
    const page = createLessonInnerPage({
      variant: 'page-two',
      lessonTitle: 'Giving Effective Praise',
      onSidebarToggle: () => alert('Sidebar toggled'),
      onPrevious: () => alert('Previous clicked'),
      onNext: () => alert('Next clicked')
    });
    wrapper.appendChild(page);
    return wrapper;
  },
  name: 'Lesson Inner Page (page-two)',
  parameters: {
    layout: 'fullscreen',
  },
};

export const LessonInnerPageThree = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.padding = '20px';
    wrapper.style.backgroundColor = 'var(--color-surface-container)';
    wrapper.style.minHeight = '100vh';
    const page = createLessonInnerPage({
      variant: 'page-three',
      lessonTitle: 'Giving Effective Praise',
      onSidebarToggle: () => alert('Sidebar toggled'),
      onPrevious: () => alert('Previous clicked'),
      onNext: () => alert('Next clicked')
    });
    wrapper.appendChild(page);
    return wrapper;
  },
  name: 'Lesson Inner Page (page-three)',
  parameters: {
    layout: 'fullscreen',
  },
};

export const LessonInnerPageFour = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.padding = '20px';
    wrapper.style.backgroundColor = 'var(--color-surface-container)';
    wrapper.style.minHeight = '100vh';
    const page = createLessonInnerPage({
      variant: 'page-four',
      lessonTitle: 'Giving Effective Praise',
      onSidebarToggle: () => alert('Sidebar toggled'),
      onPrevious: () => alert('Previous clicked'),
      onNext: () => alert('Next clicked')
    });
    wrapper.appendChild(page);
    return wrapper;
  },
  name: 'Lesson Inner Page (page-four)',
  parameters: {
    layout: 'fullscreen',
  },
};

export const LessonInnerPageFive = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.padding = '20px';
    wrapper.style.backgroundColor = 'var(--color-surface-container)';
    wrapper.style.minHeight = '100vh';
    const page = createLessonInnerPage({
      variant: 'page-five',
      lessonTitle: 'Giving Effective Praise',
      onSidebarToggle: () => alert('Sidebar toggled'),
      onPrevious: () => alert('Previous clicked'),
      onNext: () => alert('Next clicked')
    });
    wrapper.appendChild(page);
    return wrapper;
  },
  name: 'Lesson Inner Page (page-five)',
  parameters: {
    layout: 'fullscreen',
  },
};
