/**
 * Tutor Admin Organism - Tables
 * 
 * Table components for Tutor Admin.
 * 
 * ## Components in this Category
 * 
 * - **TutorsToolUsageTable**: Table showing tutor tool usage statistics
 *   - States: default, hovered, pressed, focus, disabled
 *   - Columns: Tutor Name, Recording, Reflection, Attendance, Goal Checking
 * - **TutorsPerformanceTable**: Table showing tutor performance metrics
 *   - States: loading, default, hover
 *   - Columns: Tutor Name, Signed Up, Attendance, Sessions, Students
 * - **TutorsStatusWarningsTable**: Table showing tutor status and warnings
 *   - Columns: Tutor Name, Status, Total Warnings, Mic Off, Cam Off, Absence, Late Calloff
 * - **TutorsTrainingProgressTable**: Table showing tutor training progress
 *   - States: default, hover
 *   - Columns: Tutor Name (with avatar), Completion, Accuracy, Badge Claimed, Time Spent, Action button
 */

import { createTutorsToolUsageTableRow } from './TutorsToolUsageTable.js';
import { createTutorsPerformanceTableRow } from './TutorsPerformanceTable.js';
import { createTutorsStatusWarningsTableRow } from './TutorsStatusWarningsTable.js';
import { createTutorsTrainingProgressTableRow } from './TutorsTrainingProgressTable.js';

export default {
  title: 'Specs/Admin/Tutor Admin/Tables',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Table components for Tutor Admin. These tables display tutor information, performance metrics, tool usage, status, and training progress.',
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
    title.textContent = 'Tutor Admin Tables';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Table components for Tutor Admin. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    
    const components = [
      {
        name: 'TutorsToolUsageTable',
        description: 'Table showing tutor tool usage statistics. Displays recording, reflection, attendance, and goal checking metrics for each tutor.',
        variants: [
          'States: default, hovered, pressed, focus, disabled',
          'Columns: Tutor Name, Recording, Reflection, Attendance, Goal Checking',
        ],
      },
      {
        name: 'TutorsPerformanceTable',
        description: 'Table showing tutor performance metrics. Displays sign-up status, attendance, sessions, and student counts.',
        variants: [
          'States: loading, default, hover',
          'Columns: Tutor Name, Signed Up, Attendance, Sessions, Students',
        ],
      },
      {
        name: 'TutorsStatusWarningsTable',
        description: 'Table showing tutor status and warnings. Displays overall status and breakdown of warnings by type (mic off, cam off, absence, late calloff).',
        variants: [
          'Columns: Tutor Name, Status, Total Warnings, Mic Off, Cam Off, Absence, Late Calloff',
        ],
      },
      {
        name: 'TutorsTrainingProgressTable',
        description: 'Table showing tutor training progress. Displays completion rates, accuracy percentages, badge claims, time spent, and includes action buttons.',
        variants: [
          'States: default, hover',
          'Columns: Tutor Name (with avatar and email), Completion, Accuracy, Badge Claimed (Yes/No/N/A), Time Spent, Action button',
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
 * TutorsToolUsageTable - All States
 * Shows all states of the TutorsToolUsageTable component
 */
export const TutorsToolUsageTable = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.backgroundColor = 'var(--color-surface)';

    // Header
    const header = createTutorsToolUsageTableRow({ type: 'header' });
    container.appendChild(header);

    // Default state
    const defaultRow = createTutorsToolUsageTableRow({
      type: 'item',
      state: 'default',
      data: { tutorName: 'Floyd Miles', recording: null, reflection: null, attendance: '20%', goalChecking: null }
    });
    container.appendChild(defaultRow);

    // Hovered state
    const hoveredRow = createTutorsToolUsageTableRow({
      type: 'item',
      state: 'hovered',
      data: { tutorName: 'Floyd Miles', recording: null, reflection: null, attendance: '20%', goalChecking: null }
    });
    container.appendChild(hoveredRow);

    // Pressed state
    const pressedRow = createTutorsToolUsageTableRow({
      type: 'item',
      state: 'pressed',
      data: { tutorName: 'Floyd Miles', recording: null, reflection: null, attendance: '20%', goalChecking: null }
    });
    container.appendChild(pressedRow);

    // Focus state
    const focusRow = createTutorsToolUsageTableRow({
      type: 'item',
      state: 'focus',
      data: { tutorName: 'Floyd Miles', recording: null, reflection: null, attendance: '20%', goalChecking: null }
    });
    container.appendChild(focusRow);

    // Disabled state
    const disabledRow = createTutorsToolUsageTableRow({
      type: 'item',
      state: 'disabled',
      data: { tutorName: 'Floyd Miles', recording: null, reflection: null, attendance: '20%', goalChecking: null }
    });
    container.appendChild(disabledRow);

    return container;
  },
};

/**
 * TutorsPerformanceTable - All States
 * Shows all states of the TutorsPerformanceTable component
 */
export const TutorsPerformanceTable = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.backgroundColor = 'var(--color-surface)';

    // Header
    const header = createTutorsPerformanceTableRow({ type: 'header' });
    container.appendChild(header);

    // Loading state
    const loadingRow = createTutorsPerformanceTableRow({ type: 'list item', state: 'loading' });
    container.appendChild(loadingRow);

    // Default state
    const defaultRow = createTutorsPerformanceTableRow({
      type: 'list item',
      state: 'default',
      data: { tutorName: 'Floyd Miles', signedUp: 'No', attendance: null, sessions: null, students: null }
    });
    container.appendChild(defaultRow);

    // Hover state
    const hoverRow = createTutorsPerformanceTableRow({
      type: 'list item',
      state: 'hover',
      data: { tutorName: 'Floyd Miles', signedUp: 'No', attendance: null, sessions: null, students: null }
    });
    container.appendChild(hoverRow);

    return container;
  },
};

/**
 * TutorsStatusWarningsTable
 * Shows the TutorsStatusWarningsTable component
 */
export const TutorsStatusWarningsTable = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.backgroundColor = 'var(--color-surface)';

    // Header
    const header = createTutorsStatusWarningsTableRow({ type: 'header' });
    container.appendChild(header);

    // Data row
    const dataRow = createTutorsStatusWarningsTableRow({
      type: 'list item',
      data: {
        tutorName: 'Floyd Miles',
        status: 'Check-In Needed',
        totalWarnings: 16,
        micOff: 4,
        camOff: 4,
        absence: 4,
        lateCalloff: 4
      }
    });
    container.appendChild(dataRow);

    return container;
  },
};

/**
 * TutorsTrainingProgressTable - All States
 * Shows all states of the TutorsTrainingProgressTable component
 */
export const TutorsTrainingProgressTable = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.backgroundColor = 'var(--color-surface)';

    // Header
    const header = createTutorsTrainingProgressTableRow({ type: 'header' });
    container.appendChild(header);

    // Default state
    const defaultRow = createTutorsTrainingProgressTableRow({
      type: 'item row',
      state: 'default',
      data: {
        tutorName: 'Ben Green',
        email: 'dummy@gmail.com',
        completion: '8/18',
        accuracy: '30%',
        badgeClaimed: true,
        timeSpent: '328'
      }
    });
    container.appendChild(defaultRow);

    // Hover state
    const hoverRow = createTutorsTrainingProgressTableRow({
      type: 'item row',
      state: 'hover',
      data: {
        tutorName: 'Ben Green',
        email: 'dummy@gmail.com',
        completion: '8/18',
        accuracy: '30%',
        badgeClaimed: true,
        timeSpent: '328'
      }
    });
    container.appendChild(hoverRow);

    return container;
  },
};
