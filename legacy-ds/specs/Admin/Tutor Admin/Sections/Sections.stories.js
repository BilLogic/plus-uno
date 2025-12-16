/**
 * Tutor Admin Organism - Sections
 * 
 * Section-level components for Tutor Admin.
 * 
 * ## Components in this Category
 * 
 * - **DataCardHorizontalScroll**: Horizontal scrolling section with multiple data cards
 *   - Displays multiple data cards in a scrollable horizontal layout
 *   - Used for displaying overview statistics and metrics
 * - **TutorsToolUsageDataViz**: Section showing tutor tool usage data visualizations
 *   - Displays data visualization charts for tutor tool usage
 *   - Includes multiple chart types and statistics
 */

import { createDataCardHorizontalScroll } from './DataCardHorizontalScroll.js';
import { createTutorsToolUsageDataViz } from './TutorsToolUsageDataViz.js';

export default {
  title: 'Specs/Admin/Tutor Admin/Sections',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Section-level components for Tutor Admin. These sections combine multiple elements and cards to display comprehensive tutor information and statistics.',
      },
    },
  },
};

/**
 * Overview
 * Shows all sections that will be available in this category
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Tutor Admin Sections';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Section-level components for Tutor Admin. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    
    const components = [
      {
        name: 'DataCardHorizontalScroll',
        description: 'Horizontal scrolling section with multiple data cards. Displays overview statistics and metrics in a scrollable horizontal layout.',
      },
      {
        name: 'TutorsToolUsageDataViz',
        description: 'Section showing tutor tool usage data visualizations. Displays multiple chart types and statistics for tutor tool usage analysis.',
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
 * DataCardHorizontalScroll
 * Horizontal scrolling section with multiple data cards
 */
export const DataCardHorizontalScroll = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.backgroundColor = 'var(--color-surface)';

    const section = createDataCardHorizontalScroll();
    container.appendChild(section);

    return container;
  },
};

/**
 * TutorsToolUsageDataViz
 * Section showing tutor tool usage data visualizations
 */
export const TutorsToolUsageDataViz = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.backgroundColor = 'var(--color-surface)';

    const section = createTutorsToolUsageDataViz();
    container.appendChild(section);

    return container;
  },
};
