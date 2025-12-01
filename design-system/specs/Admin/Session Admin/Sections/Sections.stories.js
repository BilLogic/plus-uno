/**
 * Session Admin Organism - Sections
 * 
 * Section-level components for Session Admin.
 * 
 * ## Components in this Category
 * 
 * - **SessionOverviewSection**: Section containing 5 data cards with statistics and donut charts
 *   - Time Allocation by Student Needs (60% value)
 *   - Student Attendance (99% value)
 *   - Student Engagement (99% value)
 *   - Tutor Attendance (99% value)
 *   - Check-in Completion (99% value)
 *   - Each card includes title with info icon, donut chart placeholder, value display, and tag legend
 */

import { createSessionOverviewSection } from './index.js';

export default {
  title: 'Specs/Admin/Session Admin/Sections',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Section-level components for displaying session overview statistics. These sections combine multiple data cards to show comprehensive session metrics.',
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
    title.textContent = 'Session Admin Sections';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Section-level components for displaying session overview statistics. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    
    const components = [
      {
        name: 'SessionOverviewSection',
        description: 'Section containing 5 data cards with statistics and donut charts. Each card displays a key metric with visual representation and tag legend.',
        variants: [
          'Time Allocation by Student Needs: Shows percentage of time spent on motivation, content help, or other needs',
          'Student Attendance: Shows distribution of student attendance statuses (Joined, Did not join, N/A)',
          'Student Engagement: Shows engagement levels (Fully Engaged, Partially Engaged, Not Engaged, N/A)',
          'Tutor Attendance: Shows distribution of tutor attendance statuses',
          'Check-in Completion: Shows completion status for check-in activities',
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
 * Session Overview Section
 */
export const SessionOverviewSection = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.overflowX = 'auto';
    
    const section = createSessionOverviewSection();
    container.appendChild(section);
    
    return container;
  },
};
