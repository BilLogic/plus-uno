/**
 * Training Organism - Pages
 * 
 * Complete page-level components for Training Onboarding.
 * 
 * ## Components in this Category
 * 
 * - **OnboardingOverviewPage**: Full page layout for Onboarding Overview
 *   - Top bar with breadcrumb and user avatar
 *   - Featured Modules section with carousel cards
 *   - All Modules section with table and sorting dropdown
 * - **OnboardingInnerPage**: Full page layout for individual onboarding module
 *   - Top bar with breadcrumb navigation
 *   - Content blurb with illustration
 *   - Alert card
 *   - PDF/iframe section (placeholder)
 *   - Strategy Content Prompt Modal section
 *   - Optional scrim with Module Completion Modal
 */

import { createOnboardingOverviewPage } from './OnboardingOverviewPage.js';
import { createOnboardingInnerPage } from './OnboardingInnerPage.js';
import { createPageWidthWrapper, pageWidthArgTypes, pageWidthArgs } from '../../../utils/pageWidthControl.js';

export default {
  title: 'Specs/Training/Onboarding/Pages',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Complete page-level components for Training Onboarding. These are full-page experiences that combine multiple elements, cards, sections, and tables.',
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
    title.textContent = 'Training Onboarding Pages';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Complete page-level components for Training Onboarding. These components combine multiple elements, cards, sections, and tables.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const components = [
      {
        name: 'OnboardingOverviewPage',
        description: 'Full page layout for Onboarding Overview with featured modules carousel and all modules table. Includes top bar, featured modules section with navigation controls, and all modules table with sorting dropdown.',
        variants: [
          'Top bar with breadcrumb navigation and user avatar',
          'Featured Modules section: Title with carousel navigation controls (left/right arrows)',
          'Featured Modules carousel: Horizontal scrollable cards (Welcome to PLUS, Your Role at PLUS, Tutoring Session Overview)',
          'All Modules section: Title with sorting dropdown',
          'All Modules table: Header row and item rows with module info, duration, progress, and actions',
        ],
      },
      {
        name: 'OnboardingInnerPage',
        description: 'Full page layout for individual onboarding module with content, alert, iframe, and reflection form. Includes top bar, content blurb with illustration, alert card, PDF/iframe section, and strategy content prompt modal.',
        variants: [
          'Top bar with breadcrumb navigation (Home / Onboarding / Module Name)',
          'Resource Description section: Content blurb with title, description, duration, and action button, plus illustration image',
          'Alert card: Reminder about completing module requirements',
          'PDF/iframe section: Placeholder for Google Sites embed',
          'Strategy Content Prompt Modal section: Instructions, reflection question, textarea, and submit button',
          'Optional scrim with Module Completion Modal: Shows completion popup when module is finished',
        ],
      },
    ];
    
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    
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
 * Onboarding Overview Page
 */
export const OnboardingOverviewPage = {
  render: (args) => {
    const page = createOnboardingOverviewPage();
    return createPageWidthWrapper(page, args.pageWidth);
  },
  argTypes: {
    ...pageWidthArgTypes,
  },
  args: {
    ...pageWidthArgs,
  },
};

/**
 * Onboarding Inner Page
 */
export const OnboardingInnerPage = {
  render: (args) => {
    const page = createOnboardingInnerPage({ showScrim: false });
    return createPageWidthWrapper(page, args.pageWidth);
  },
  argTypes: {
    ...pageWidthArgTypes,
  },
  args: {
    ...pageWidthArgs,
  },
};

/**
 * Onboarding Inner Page with Completion Modal
 */
export const OnboardingInnerPageWithModal = {
  render: (args) => {
    const page = createOnboardingInnerPage({ showScrim: true });
    return createPageWidthWrapper(page, args.pageWidth);
  },
  argTypes: {
    ...pageWidthArgTypes,
  },
  args: {
    ...pageWidthArgs,
  },
};

