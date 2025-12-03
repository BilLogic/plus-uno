/**
 * Training Onboarding Organism - Tables
 * 
 * Table components for Training Onboarding.
 * 
 * ## Components in this Category
 * 
 * - **OnboardingModulesTable**: Table showing onboarding modules with columns: Module, Duration, Progress, Actions
 *   - type=Header: Table header row
 *   - type=Item, state=Default: Default table row
 *   - type=Item, state=hover: Hover state table row
 *   - type=Item, state=pressed: Pressed state table row
 *   - type=Item, state=focus: Focus state table row with border
 *   - type=Item, state=disabled: Disabled state table row
 */

import { createOnboardingModulesTableRow } from './OnboardingModulesTable.js';

export default {
  title: 'Specs/Training/Onboarding/Tables',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Table components for Training Onboarding. These tables display onboarding module information with status indicators and action buttons.',
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
    title.textContent = 'Training Onboarding Tables';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Table components for Training Onboarding. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    
    const components = [
      {
        name: 'OnboardingModulesTable',
        description: 'Table showing onboarding modules with columns: Module (with image thumbnail), Duration, Progress (status indicator), Actions (CTA button).',
        variants: [
          'type=Header: Table header row with column labels',
          'type=Item, state=Default: Default table row',
          'type=Item, state=hover: Hover state with background color',
          'type=Item, state=pressed: Pressed state with darker background',
          'type=Item, state=focus: Focus state with border highlight',
          'type=Item, state=disabled: Disabled state with reduced opacity',
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
 * OnboardingModulesTable - All Variants
 * Table showing onboarding modules with all row types and states
 */
export const OnboardingModulesTable = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.alignItems = 'flex-start';

    // Header row
    const headerRow = createOnboardingModulesTableRow({ type: 'Header' });
    container.appendChild(headerRow);

    // Item rows with different states
    const defaultRow = createOnboardingModulesTableRow({
      type: 'Item',
      state: 'Default',
      data: {
        moduleTitle: 'Module Title',
        duration: '11mins',
        stage: 'not started',
        ctaState: 'not started'
      }
    });
    container.appendChild(defaultRow);

    const hoverRow = createOnboardingModulesTableRow({
      type: 'Item',
      state: 'hover',
      data: {
        moduleTitle: 'Module Title',
        duration: '11mins',
        stage: 'not started',
        ctaState: 'not started'
      }
    });
    container.appendChild(hoverRow);

    const pressedRow = createOnboardingModulesTableRow({
      type: 'Item',
      state: 'pressed',
      data: {
        moduleTitle: 'Module Title',
        duration: '11mins',
        stage: 'not started',
        ctaState: 'not started'
      }
    });
    container.appendChild(pressedRow);

    const focusRow = createOnboardingModulesTableRow({
      type: 'Item',
      state: 'focus',
      data: {
        moduleTitle: 'Module Title',
        duration: '11mins',
        stage: 'not started',
        ctaState: 'not started'
      }
    });
    container.appendChild(focusRow);

    const disabledRow = createOnboardingModulesTableRow({
      type: 'Item',
      state: 'disabled',
      data: {
        moduleTitle: 'Module Title',
        duration: '11mins',
        stage: 'not started',
        ctaState: 'not started'
      }
    });
    container.appendChild(disabledRow);

    return container;
  },
};

