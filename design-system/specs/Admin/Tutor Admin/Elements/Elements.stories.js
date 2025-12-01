/**
 * Tutor Admin Organism - Elements
 * 
 * Individual form elements and UI components for Tutor Admin.
 * 
 * ## Components in this Category
 * 
 * - **Filters**: Filter component with dropdowns for Schools, Tutors, and date range
 * - **TrainingAdminFilter**: Filter component for Training Admin with Export CSV, search, and filter dropdowns
 *   - breakpoint=medium: Medium/XL/XXL breakpoint variant
 *   - breakpoint=large: Large breakpoint variant
 * - **DataCardHeaderAndIcon**: Card header with title and info icon
 * - **Graphs**: Standalone graph visualization component
 *   - graphType=Pie: Pie chart
 *   - graphType=Bar: Bar chart
 *   - graphType=Line: Line chart
 */

import { createFilters } from './Filters.js';
import { createTrainingAdminFilter } from './TrainingAdminFilter.js';
import { createDataCardHeaderAndIcon } from './DataCardHeaderAndIcon.js';
import { createGraphs } from './Graphs.js';

export default {
  title: 'Specs/Admin/Tutor Admin/Elements',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Individual form elements and UI components for Tutor Admin. These are reusable building blocks used throughout Tutor Admin pages.',
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
    title.textContent = 'Tutor Admin Elements';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Individual form elements and UI components for Tutor Admin. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    
    const components = [
      {
        name: 'Filters',
        description: 'Filter component with dropdowns for Schools, Tutors, and date range. Used for filtering tutor data across different pages.',
      },
      {
        name: 'TrainingAdminFilter',
        description: 'Filter component for Training Admin with Export CSV button, search input, and filter dropdowns. Responsive design with different layouts for different breakpoints.',
        variants: [
          'breakpoint=medium: Medium/XL/XXL breakpoint variant with wider search field',
          'breakpoint=large: Large breakpoint variant with narrower search field',
        ],
      },
      {
        name: 'DataCardHeaderAndIcon',
        description: 'Card header with title and info icon. Used as a header component for data cards throughout Tutor Admin.',
      },
      {
        name: 'Graphs',
        description: 'Standalone graph visualization component. Displays various chart types for data visualization.',
        variants: [
          'graphType=Pie: Pie chart visualization',
          'graphType=Bar: Bar chart visualization',
          'graphType=Line: Line chart visualization',
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
 * Filters
 * Filter component with dropdowns for Schools, Tutors, and date range
 */
export const Filters = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.backgroundColor = 'var(--color-surface)';

    const filters = createFilters({
      schoolFilter: 'All Schools',
      tutorFilter: 'All Tutors',
      startDate: '01/10/25',
      endDate: '02/10/25'
    });
    container.appendChild(filters);

    return container;
  },
};

/**
 * TrainingAdminFilter - All Variants
 * Filter component for Training Admin with Export CSV, search, and filter dropdowns
 * Shows both medium and large breakpoint variants
 */
export const TrainingAdminFilter = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.backgroundColor = 'var(--color-surface)';

    // Medium/XL/XXL Breakpoint variant
    const mediumLabel = document.createElement('div');
    mediumLabel.style.fontFamily = 'var(--font-family-body)';
    mediumLabel.style.fontSize = 'var(--font-size-body2)';
    mediumLabel.style.fontWeight = 'var(--font-weight-semibold)';
    mediumLabel.style.color = 'var(--color-on-surface)';
    mediumLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    mediumLabel.textContent = 'Medium/XL/XXL Breakpoint';
    container.appendChild(mediumLabel);

    const filterMedium = createTrainingAdminFilter({ breakpoint: 'medium' });
    filterMedium.style.width = '1116px';
    container.appendChild(filterMedium);

    // Large Breakpoint variant
    const largeLabel = document.createElement('div');
    largeLabel.style.fontFamily = 'var(--font-family-body)';
    largeLabel.style.fontSize = 'var(--font-size-body2)';
    largeLabel.style.fontWeight = 'var(--font-weight-semibold)';
    largeLabel.style.color = 'var(--color-on-surface)';
    largeLabel.style.marginTop = 'var(--size-section-gap-lg)';
    largeLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    largeLabel.textContent = 'Large Breakpoint';
    container.appendChild(largeLabel);

    const filterLarge = createTrainingAdminFilter({ breakpoint: 'large' });
    filterLarge.style.width = '1116px';
    container.appendChild(filterLarge);

    return container;
  },
};

/**
 * DataCardHeaderAndIcon
 * Card header with title and info icon
 */
export const DataCardHeaderAndIcon = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.backgroundColor = 'var(--color-surface)';

    const header = createDataCardHeaderAndIcon({
      title: 'Card Title'
    });
    container.appendChild(header);

    return container;
  },
};

/**
 * Graphs - All Variants
 * Standalone graph visualization component with Pie, Bar, and Line variants
 */
export const Graphs = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.alignItems = 'center';

    // Pie Chart
    const pieGraph = createGraphs({
      graphType: 'Pie'
    });
    container.appendChild(pieGraph);

    // Bar Chart
    const barGraph = createGraphs({
      graphType: 'Bar'
    });
    container.appendChild(barGraph);

    // Line Chart
    const lineGraph = createGraphs({
      graphType: 'Line'
    });
    container.appendChild(lineGraph);

    return container;
  },
};
