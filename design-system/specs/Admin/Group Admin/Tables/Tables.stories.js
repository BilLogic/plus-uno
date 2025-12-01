/**
 * Group Admin Organism - Tables
 * 
 * Table components for Group Admin.
 * 
 * ## Components in this Category
 * 
 * - **GroupsTable**: Table showing group details with 3 columns: Group Name, Group Size, Action
 *   - type=header: Table header row with sortable columns
 *   - type=list item: Default table row with accordion button, group size badge, and action buttons
 *   - Group Name column shows accordion button with caret icon
 *   - Group Size column shows info badge with number
 *   - Action column shows "Edit" and "View Progress" text buttons
 * - **GroupTrainingProgressTable**: Table showing group training progress by lesson with 7 columns: Competency (spans 2), Completion, Accuracy, Rating, Time Spent, Action
 *   - type=header: Table header row with sortable columns
 *   - type=content-l1: Level 1 row (competency area) with badge
 *   - type=content-l2: Level 2 row (lesson) with indented text
 *   - type=content-l3: Level 3 row (sub-lesson) with more indented text
 *   - type=content-l1-hover, content-l2-hover: Hover states for level 1 and 2 rows
 *   - Progress indicators show circular charts with values (Completion, Accuracy, Rating)
 *   - Action column shows "Assign" text button
 */

import { createGroupsTableRow } from './GroupsTable.js';
import { createGroupTrainingProgressTableRow } from './GroupTrainingProgressTable.js';

export default {
  title: 'Specs/Admin/Group Admin/Tables',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Table components for displaying group details and training progress. These tables show group information with sortable columns, badges, progress indicators, and action buttons.',
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
    title.textContent = 'Group Admin Tables';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Table components for displaying group details and training progress. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    
    const components = [
      {
        name: 'GroupsTable',
        description: 'Table showing group details with 3 columns: Group Name, Group Size, Action. Includes sortable headers, accordion buttons, group size badges, and action buttons.',
        variants: [
          'type=header: Table header row with sortable columns',
          'type=list item: Default table row with accordion button, group size badge, and action buttons',
          'Group Name column: Shows accordion button with caret icon and group name',
          'Group Size column: Shows info badge with number',
          'Action column: Shows "Edit" and "View Progress" text buttons',
        ],
      },
      {
        name: 'GroupTrainingProgressTable',
        description: 'Table showing group training progress by lesson with 7 columns: Competency (spans 2), Completion, Accuracy, Rating, Time Spent, Action. Includes hierarchical rows (competency area, lesson, sub-lesson) with progress indicators.',
        variants: [
          'type=header: Table header row with sortable columns',
          'type=content-l1: Level 1 row (competency area) with badge and caret icon',
          'type=content-l2: Level 2 row (lesson) with indented text and caret icon',
          'type=content-l3: Level 3 row (sub-lesson) with more indented text',
          'type=content-l1-hover, content-l2-hover: Hover states for level 1 and 2 rows',
          'Progress indicators: Show circular charts with values (Completion, Accuracy, Rating)',
          'Action column: Shows "Assign" text button',
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
 * Groups Table - All States
 * Shows the header and list item on one page.
 */
export const GroupsTable = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.overflowX = 'auto';

    // Table container
    const tableContainer = document.createElement('div');
    tableContainer.style.display = 'flex';
    tableContainer.style.flexDirection = 'column';
    tableContainer.style.gap = '8px';
    tableContainer.style.minWidth = '1120px';
    tableContainer.style.width = '1120px';

    // Header
    const header = createGroupsTableRow({ type: 'header' });
    tableContainer.appendChild(header);

    // List item
    const row = createGroupsTableRow({
      type: 'list item',
      state: 'default',
      data: {
        groupName: 'Math Masters',
        groupSize: 4
      }
    });
    tableContainer.appendChild(row);

    container.appendChild(tableContainer);
    return container;
  },
};

/**
 * Group Training Progress Table - All States
 * Shows the header, level 1, level 1 hover, level 2, level 2 hover, and level 3 on one page.
 */
export const GroupTrainingProgressTable = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.overflowX = 'auto';

    // Table container
    const tableContainer = document.createElement('div');
    tableContainer.style.display = 'flex';
    tableContainer.style.flexDirection = 'column';
    tableContainer.style.gap = '0';
    tableContainer.style.minWidth = '1160px';
    tableContainer.style.width = '1160px';

    // Header
    const header = createGroupTrainingProgressTableRow({ type: 'header' });
    tableContainer.appendChild(header);

    // Level 1
    const l1Row = createGroupTrainingProgressTableRow({
      type: 'content-l1',
      data: {
        competency: 'Social-Emotional Learning',
        competencyArea: 'socio-emotional',
        completion: '8/16',
        accuracy: '10%',
        rating: '5.0/5',
        timeSpent: '328 mins'
      }
    });
    tableContainer.appendChild(l1Row);

    // Level 1 Hover
    const l1RowHover = createGroupTrainingProgressTableRow({
      type: 'content-l1-hover',
      data: {
        competency: 'Social-Emotional Learning',
        competencyArea: 'socio-emotional',
        completion: '8/16',
        accuracy: '10%',
        rating: '5.0/5',
        timeSpent: '328 mins'
      }
    });
    tableContainer.appendChild(l1RowHover);

    // Level 2
    const l2Row = createGroupTrainingProgressTableRow({
      type: 'content-l2',
      data: {
        lessonName: 'Motivation to Learn',
        completion: '4/4',
        accuracy: '10%',
        rating: '5.0/5',
        timeSpent: '328 mins'
      }
    });
    tableContainer.appendChild(l2Row);

    // Level 2 Hover
    const l2RowHover = createGroupTrainingProgressTableRow({
      type: 'content-l2-hover',
      data: {
        lessonName: 'Motivation to Learn',
        completion: '4/4',
        accuracy: '10%',
        rating: '5.0/5',
        timeSpent: '328 mins'
      }
    });
    tableContainer.appendChild(l2RowHover);

    // Level 3
    const l3Row = createGroupTrainingProgressTableRow({
      type: 'content-l3',
      data: {
        lessonName: 'Reacting to Errors',
        completion: '1/4',
        accuracy: '10%',
        rating: '5.0/5',
        timeSpent: '328 mins'
      }
    });
    tableContainer.appendChild(l3Row);

    container.appendChild(tableContainer);
    return container;
  },
};
