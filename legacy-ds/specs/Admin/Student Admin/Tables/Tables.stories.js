/**
 * Student Admin Organism - Tables
 * 
 * Table components for Student Admin.
 * 
 * ## Components in this Category
 * 
 * - **StudentsTable**: Table showing student details with 5 columns: Student, School, Teacher, Latest Status, Action
 *   - type=header: Table header row with sortable columns
 *   - type=list item, status=default: Default table row
 *   - type=list item, status=hover: Hover state table row
 *   - Latest Status column shows info badge with status text
 *   - Action column shows "View goals" text button
 */

import { createStudentsTableRow } from './index.js';

export default {
  title: 'Specs/Admin/Student Admin/Tables',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Table components for displaying student details. These tables show student information with sortable columns and action buttons.',
      },
    },
  },
};

/**
 * Overview
 * Shows all tables that will be available in this category
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Student Admin Tables';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Table components for displaying student details. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    
    const components = [
      {
        name: 'StudentsTable',
        description: 'Table showing student details with 5 columns: Student, School, Teacher, Latest Status, Action. Includes sortable headers, status badges, and action buttons.',
        variants: [
          'type=header: Table header row with sortable columns',
          'type=list item, status=default: Default table row',
          'type=list item, status=hover: Hover state table row',
          'Latest Status column: Shows info badge with status text (e.g., "Needs to set goals")',
          'Action column: Shows "View goals" text button',
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
 * Students Table - All States
 * Shows all three states of the same component: Header, Default Row, and Hover Row
 */
export const StudentsTable = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.overflowX = 'auto';
    container.style.backgroundColor = 'var(--color-surface)';

    // Table wrapper with scrolling
    const tableWrapper = document.createElement('div');
    tableWrapper.style.width = '100%';
    tableWrapper.style.overflowX = 'auto';
    tableWrapper.style.overflowY = 'hidden';

    // Table container
    const tableContainer = document.createElement('div');
    tableContainer.style.display = 'flex';
    tableContainer.style.flexDirection = 'column';
    tableContainer.style.gap = '8px';
    tableContainer.style.minWidth = '1000px';
    tableContainer.style.width = '1500px';

    // Header state
    const header = createStudentsTableRow({ type: 'header' });
    tableContainer.appendChild(header);

    // Default state
    const defaultRow = createStudentsTableRow({
      type: 'list item',
      state: 'default',
      data: {
        student: 'Jose D.',
        school: 'Langley',
        teacher: 'Jose D.',
        latestStatus: 'Needs to set goals',
        action: 'View goals'
      }
    });
    tableContainer.appendChild(defaultRow);

    // Hover state
    const hoverRow = createStudentsTableRow({
      type: 'list item',
      state: 'hover',
      data: {
        student: 'Jose D.',
        school: 'Langley',
        teacher: 'Jose D.',
        latestStatus: 'Needs to set goals',
        action: 'View goals'
      }
    });
    tableContainer.appendChild(hoverRow);

    tableWrapper.appendChild(tableContainer);
    container.appendChild(tableWrapper);
    
    return container;
  },
};
