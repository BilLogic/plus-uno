/**
 * Training Onboarding Organism - Cards
 * 
 * Card components for Training Onboarding.
 * 
 * ## Components in this Category
 * 
 * - **OnboardingModuleCard**: Card component showing onboarding module with image thumbnail or description area
 *     - state=default: Card with image thumbnail area
 *     - state=state3: Card with description area instead of image
 * - **OnboardingAlertCard**: Alert card component with title, description, and close icon
 */

import { createOnboardingModuleCard } from './OnboardingModuleCard.js';
import { createOnboardingAlertCard } from './OnboardingAlertCard.js';

export default {
  title: 'Specs/Training/Onboarding/Cards',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Card components for Training Onboarding. These cards display module information and alerts.',
      },
    },
  },
};

/**
 * Overview
 * Shows all cards that will be available in this category
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';

    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Training Onboarding Cards';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);

    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Card components for Training Onboarding. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);

    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';

    const components = [
      {
        name: 'OnboardingModuleCard',
        description: 'Card component showing onboarding module with image thumbnail or description area, duration, title, strategy badge, and status indicator.',
        variants: [
          'state=default: Card with image thumbnail area at top',
          'state=state3: Card with description area instead of image',
        ],
      },
      {
        name: 'OnboardingAlertCard',
        description: 'Alert card component with title, description text, and close icon. Used to display important reminders or notifications.',
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
 * OnboardingModuleCard - All Variants
 * Card component showing onboarding module
 */
export const OnboardingModuleCard = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'row';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.alignItems = 'flex-start';
    container.style.flexWrap = 'wrap';

    const defaultCard = createOnboardingModuleCard({
      moduleTitle: 'Module Title',
      duration: '9 mins',
      state: 'default',
      badgeType: 'other',
      stage: 'not started'
    });
    container.appendChild(defaultCard);

    const state3Card = createOnboardingModuleCard({
      moduleTitle: 'Module Title',
      duration: '9 mins',
      state: 'state3',
      badgeType: 'other',
      stage: 'not started'
    });
    container.appendChild(state3Card);

    return container;
  },
};

/**
 * OnboardingAlertCard
 * Alert card component with title, description, and close icon
 */
export const OnboardingAlertCard = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.backgroundColor = 'var(--color-surface)';

    const alertCard = createOnboardingAlertCard({
      title: "Don't forget to complete this module",
      description: "Make sure to finish the quiz on the Google Site and answer the reflection question at the bottom of this page to complete this onboarding module."
    });
    container.appendChild(alertCard);

    return container;
  },
};

