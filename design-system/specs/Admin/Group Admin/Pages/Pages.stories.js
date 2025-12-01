/**
 * Group Admin Organism - Pages
 * 
 * Complete page-level components for Group Admin.
 * 
 * ## Components in this Category
 * 
 * - **GroupInfoPage**: Full page layout for Group Info
 *   - Top bar with breadcrumb and user avatar
 *   - Tab navigation: Group Info (active), Training Progress
 *   - Groups table with Group Name, Group Size, Action columns
 *   - Add Group button
 *   - Pagination
 * - **GroupTrainingProgressPage**: Full page layout for Group Training Progress
 *   - Top bar with breadcrumb and user avatar
 *   - Tab navigation: Group Info, Training Progress (active)
 *   - All Groups filter dropdown
 *   - Overview cards: Tutor Need, Avg Completion Rate, Avg Accuracy Rate, Avg Time Spent
 *   - Group Training Progress table with hierarchical rows
 */

import { createGroupInfoPage } from './GroupInfoPage.js';
import { createGroupTrainingProgressPage } from './GroupTrainingProgressPage.js';

export default {
  title: 'Specs/Admin/Group Admin/Pages',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Complete page-level components for Group Admin. These are full-page experiences that combine multiple elements, cards, sections, and tables.',
      },
    },
  },
};

/**
 * Overview
 * Shows all pages that will be available in this category
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Group Admin Pages';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Complete page-level components for Group Admin. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    
    const components = [
      {
        name: 'GroupInfoPage',
        description: 'Full page layout for Group Info with groups table. Includes top bar, tab navigation, groups table with Group Name, Group Size, and Action columns, Add Group button, and pagination.',
        variants: [
          'Top bar with breadcrumb navigation and user avatar',
          'Tab navigation: Group Info (active), Training Progress',
          'Groups table: 3 columns (Group Name, Group Size, Action)',
          'Add Group button: Filled primary button with user-plus icon',
          'Pagination: Shows entries info and page navigation',
        ],
      },
      {
        name: 'GroupTrainingProgressPage',
        description: 'Full page layout for Group Training Progress with overview cards and training progress table. Includes top bar, tab navigation, All Groups filter, overview cards, and hierarchical training progress table.',
        variants: [
          'Top bar with breadcrumb navigation and user avatar',
          'Tab navigation: Group Info, Training Progress (active)',
          'All Groups filter dropdown: Filters content based on groups created',
          'Overview cards: Tutor Need (with SMART bars), Avg Completion Rate, Avg Accuracy Rate, Avg Time Spent',
          'Training Progress table: Hierarchical rows (competency area, lesson, sub-lesson) with progress indicators',
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
 * Group Info Page
 */
export const GroupInfoPage = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.overflowX = 'auto';
    container.style.backgroundColor = 'var(--color-surface-container)';
    
    const page = createGroupInfoPage();
    container.appendChild(page);
    
    return container;
  },
};

/**
 * Group Training Progress Page
 */
export const GroupTrainingProgressPage = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.overflowX = 'auto';
    container.style.backgroundColor = 'var(--color-surface-container)';
    
    const page = createGroupTrainingProgressPage();
    container.appendChild(page);
    
    return container;
  },
};
