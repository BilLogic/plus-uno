/**
 * Tutor Admin Organism - Pages
 * 
 * Complete page-level components for Tutor Admin.
 * 
 * ## Components in this Category
 * 
 * - **TutorsOverviewPage**: Full page layout for Tutors Overview (Tutor Performance tab)
 * - **TutorsStatusWarningsPage**: Full page layout for Tutors Status & Warnings tab
 * - **TutorsToolUsagePage**: Full page layout for Tutors Tool Usage tab
 * - **TutorsTrainingProgressPage**: Full page layout for Tutors Training Progress tab
 */

import { createTutorsOverviewPage } from './TutorsOverviewPage.js';
import { createTutorsStatusWarningsPage } from './TutorsStatusWarningsPage.js';
import { createTutorsToolUsagePage } from './TutorsToolUsagePage.js';
import { createTutorsTrainingProgressPage } from './TutorsTrainingProgressPage.js';

export default {
  title: 'Specs/Admin/Tutor Admin/Pages',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Complete page-level components for Tutor Admin. These are full-page experiences that combine multiple elements, cards, sections, and tables.',
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
    title.textContent = 'Tutor Admin Pages';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Complete page-level components for Tutor Admin. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    
    const components = [
      {
        name: 'TutorsOverviewPage',
        description: 'Full page layout for Tutors Overview (Tutor Performance tab). Displays tutor performance metrics and statistics.',
      },
      {
        name: 'TutorsStatusWarningsPage',
        description: 'Full page layout for Tutors Status & Warnings tab. Shows tutor status information and warning details.',
      },
      {
        name: 'TutorsToolUsagePage',
        description: 'Full page layout for Tutors Tool Usage tab. Displays tutor tool usage statistics and data visualizations.',
      },
      {
        name: 'TutorsTrainingProgressPage',
        description: 'Full page layout for Tutors Training Progress tab. Shows training completion, accuracy, badge claims, and time spent metrics.',
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
 * TutorsOverviewPage
 * Shows the page without any modal
 */
export const TutorsOverviewPage = {
  render: () => {
    return createTutorsOverviewPage({ showModal: false });
  },
};

/**
 * TutorsOverviewPage - With Modal
 * Shows the page with a tutor overview modal overlay and scrim
 */
export const TutorsOverviewPageWithModal = {
  render: () => {
    return createTutorsOverviewPage({ showModal: true, modalTab: "Info" });
  },
};

/**
 * TutorsStatusWarningsPage
 * Full page layout for Tutors Status & Warnings
 */
export const TutorsStatusWarningsPage = {
  render: () => {
    return createTutorsStatusWarningsPage();
  },
};

/**
 * TutorsToolUsagePage
 * Full page layout for Tutors Tool Usage
 */
export const TutorsToolUsagePage = {
  render: () => {
    return createTutorsToolUsagePage();
  },
};

/**
 * TutorsTrainingProgressPage
 * Full page layout for Tutors Training Progress
 */
export const TutorsTrainingProgressPage = {
  render: () => {
    return createTutorsTrainingProgressPage();
  },
};
