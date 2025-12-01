/**
 * Tutor Admin Organism - Cards
 * 
 * Card components for Tutor Admin.
 * 
 * ## Components in this Category
 * 
 * - **DataCard**: Data visualization card with multiple chart types
 *   - graphType=Pie: Pie chart visualization
 *   - graphType=Bar: Bar chart visualization
 *   - graphType=Line: Line chart visualization
 *   - state=default: Default card state
 *   - state=loading: Loading state with skeleton
 */

import { createDataCard } from './DataCard.js';

export default {
  title: 'Specs/Admin/Tutor Admin/Cards',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Card components for Tutor Admin. These cards display key metrics and statistics in a visual format with various chart types.',
      },
    },
  },
};

/**
 * Overview
 * Shows all cards that will be available in this category
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Tutor Admin Cards';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Card components for Tutor Admin. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    
    const components = [
      {
        name: 'DataCard',
        description: 'Data visualization card with multiple chart types. Displays statistics and metrics with visual charts.',
        variants: [
          'graphType=Pie: Pie chart visualization',
          'graphType=Bar: Bar chart visualization',
          'graphType=Line: Line chart visualization',
          'state=default: Default card state',
          'state=loading: Loading state with skeleton',
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
 * DataCard - All Variants
 * Shows all variants of the DataCard component
 */
export const DataCard = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.backgroundColor = 'var(--color-surface)';

    // Pie Chart Card
    const pieCard = createDataCard({
      title: 'Card Title',
      graphType: 'Pie',
      state: 'default'
    });
    container.appendChild(pieCard);

    // Bar Chart Card
    const barCard = createDataCard({
      title: 'Card Title',
      graphType: 'Bar',
      state: 'default'
    });
    container.appendChild(barCard);

    // Line Chart Card
    const lineCard = createDataCard({
      title: 'Card Title',
      graphType: 'Line',
      state: 'default'
    });
    container.appendChild(lineCard);

    // Loading Card
    const loadingCard = createDataCard({
      title: 'Card Title',
      graphType: 'Pie',
      state: 'loading'
    });
    container.appendChild(loadingCard);

    return container;
  },
};
