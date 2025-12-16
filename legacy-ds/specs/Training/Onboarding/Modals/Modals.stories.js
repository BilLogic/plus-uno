/**
 * Training Onboarding Organism - Modals
 * 
 * Modal dialogs for Training Onboarding.
 * 
 * ## Components in this Category
 * 
 * - **ModuleCompletionModal**: Modal showing module completion popup
 *     - Includes title "Module Completed!", message, and "Back to Onboarding Overview" button
 *     - Has close icon in header
 * - **StrategyContentPromptModal**: Modal showing reflection question form
 *     - Includes instructions, question label with required indicator, textarea, and submit button
 *     - Used for tutors to answer reflection questions to complete modules
 */

import { createModuleCompletionModal } from './ModuleCompletionModal.js';
import { createStrategyContentPromptModal } from './StrategyContentPromptModal.js';

export default {
  title: 'Specs/Training/Onboarding/Modals',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Modal dialogs for Training Onboarding. These modals display completion notifications and reflection question forms.',
      },
    },
  },
};

/**
 * Overview
 * Shows all modals that will be available in this category
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';

    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Training Onboarding Modals';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);

    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Modal dialogs for Training Onboarding. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);

    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';

    const components = [
      {
        name: 'ModuleCompletionModal',
        description: 'Modal showing module completion popup with title, message, and action button. Displays when a tutor completes an onboarding module.',
      },
      {
        name: 'StrategyContentPromptModal',
        description: 'Modal showing reflection question form with instructions, question label, textarea input, and submit button. Tutors must answer reflection questions to complete modules.',
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
      componentCard.appendChild(componentDesc);

      componentsList.appendChild(componentCard);
    });

    container.appendChild(componentsList);

    return container;
  },
};

/**
 * ModuleCompletionModal
 * Modal showing module completion popup
 */
export const ModuleCompletionModal = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.alignItems = 'center';

    const modal = createModuleCompletionModal({
      onClose: () => console.log('Modal closed'),
      onContinue: () => console.log('Continue clicked')
    });
    container.appendChild(modal);

    return container;
  },
};

/**
 * StrategyContentPromptModal
 * Modal showing reflection question form
 */
export const StrategyContentPromptModal = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.alignItems = 'center';

    const modal = createStrategyContentPromptModal({
      question: "What's one specific action you plan to take in your next session based on what you learned in this module?",
      onSubmit: (value) => console.log('Submitted:', value)
    });
    container.appendChild(modal);

    return container;
  },
};

