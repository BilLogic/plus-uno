/**
 * Session Admin Organism - Tables
 * 
 * Table components for Session Admin.
 * 
 * ## Components in this Category
 * 
 * - **SessionsTable**: Table showing session details with columns: Day (Date), Shift (ET), School, Teacher, Attended students, Engaged student, Attended tutors, Completed Check-in
 *   - type=header: Table header row with sortable columns
 *   - type=list item, status=default: Default table row
 *   - type=list item, status=hover: Hover state table row
 *   - Color thresholds for numeric stats: ≥80% → Green/Success, 50–79% → Yellow/Warning, <50% → Red/Danger
 */

import { createSessionsTableRow, createSessionBreakdownTableRow } from './index.js';

export default {
  title: 'Specs/Admin/Session Admin/Tables',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Table components for displaying session details. These tables show session information with sortable columns and color-coded statistics.',
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
    title.textContent = 'Session Admin Tables';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Table components for displaying session details. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    
    const components = [
      {
        name: 'SessionsTable',
        description: 'Table showing session details with 8 columns: Day (Date), Shift (ET), School, Teacher, Attended students, Engaged student, Attended tutors, Completed Check-in. Includes sortable headers and color-coded percentage badges.',
        variants: [
          'type=header: Table header row with sortable columns',
          'type=list item, status=default: Default table row',
          'type=list item, status=hover: Hover state table row',
          'Color thresholds: ≥80% → Green/Success, 50–79% → Yellow/Warning, <50% → Red/Danger',
        ],
      },
      {
        name: 'SessionBreakdownTable',
        description: 'Table showing session breakdown details with 5 columns: Student Name, Student Status, Tutor Name, Tutor Type, Time Spent (Mins). Used in the Session Breakdown modal to display student details for a specific session.',
        variants: [
          'type=header: Table header row with sortable columns',
          'type=list item, status=default: Default table row with student data',
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
 * Sessions Table - Header with Default and Hover States
 * Shows the table header with both default and hover row states together
 */
export const SessionsTableHeaderWithStates = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '0';
    container.style.overflowX = 'auto';
    
    // Header
    const header = createSessionsTableRow({ type: 'header' });
    container.appendChild(header);
    
    // Default state row
    const defaultRow = createSessionsTableRow({
      type: 'item row',
      state: 'default',
      data: {
        day: 'DoW (00/00/00)',
        shift: '0:00 PM - 0:00 PM',
        school: 'School',
        teacher: 'Teacher',
        attendedStudents: '8%',
        engagedStudent: '8%',
        attendedTutors: '8%',
        completedCheckin: '8%'
      }
    });
    container.appendChild(defaultRow);
    
    // Hover state row
    const hoverRow = createSessionsTableRow({
      type: 'item row',
      state: 'hover',
      data: {
        day: 'DoW (00/00/00)',
        shift: '0:00 PM - 0:00 PM',
        school: 'School',
        teacher: 'Teacher',
        attendedStudents: '8%',
        engagedStudent: '8%',
        attendedTutors: '8%',
        completedCheckin: '8%'
      }
    });
    container.appendChild(hoverRow);
    
    return container;
  },
};

/**
 * Session Breakdown Table - Header with Default Row
 * Shows the table header with a default row state
 */
export const SessionBreakdownTableDefault = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '0';
    container.style.overflowX = 'auto';
    
    // Header
    const header = createSessionBreakdownTableRow({ type: 'header' });
    container.appendChild(header);
    
    // Default state row
    const defaultRow = createSessionBreakdownTableRow({
      type: 'list item',
      state: 'default',
      data: {
        studentName: 'Frank A.',
        studentStatus: 'Needs to set goals',
        tutorName: 'Jose D.',
        tutorType: 'Lead',
        timeSpent: '11'
      }
    });
    container.appendChild(defaultRow);
    
    return container;
  },
};
