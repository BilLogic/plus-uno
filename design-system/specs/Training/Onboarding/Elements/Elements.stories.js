/**
 * Training Onboarding Organism - Elements
 * 
 * Individual form elements and UI components for Training Onboarding.
 * 
 * ## Components in this Category
 * 
 * - **StatusIndicators**: Status indicator icons showing different stages
 *   - stage=not started: Not started status icon
 *   - stage=in progress: In progress status icon
 *   - stage=completed: Completed status icon
 * - **StrategyBadge**: Badge component showing different file/strategy types
 *   - type=image: Image file badge
 *   - type=video: Video file badge
 *   - type=audio: Audio file badge
 *   - type=document: Document/PDF badge
 *   - type=book: Book badge
 *   - type=website: Website badge
 *   - type=other: Other file badge
 * - **CtaButtons**: CTA button component with different states
 *   - state=not started: Get Started button
 *   - state=in progress: Continue button
 *   - state=completed: Review button
 * - **DropdownListOptions**: Dropdown menu with sorting options
 *   - type=name: Name sorting dropdown
 *   - type=duration: Duration sorting dropdown
 *   - type=progress: Progress sorting dropdown
 * - **SortingDropdown**: Dropdown button with open/closed states
 *   - status=false: Closed dropdown button
 *   - status=true: Open dropdown with menu
 * - **ContentBlurb**: Content card with title, description, duration, and action button
 */

import { createStatusIndicators } from './StatusIndicators.js';
import { createStrategyBadge } from './StrategyBadge.js';
import { createCtaButtons } from './CtaButtons.js';
import { createDropdownListOptions } from './DropdownListOptions.js';
import { createSortingDropdown } from './SortingDropdown.js';
import { createContentBlurb } from './ContentBlurb.js';

export default {
  title: 'Specs/Training/Onboarding/Elements',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Individual form elements and UI components for Training Onboarding. These are reusable building blocks used throughout Training Onboarding pages.',
      },
    },
  },
};

/**
 * Overview
 * Shows all elements that will be available in this category
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Training Onboarding Elements';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Individual form elements and UI components for Training Onboarding. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = 'var(--size-card-gap-md)';
    
    const components = [
      {
        name: 'StatusIndicators',
        description: 'Status indicator icons showing different stages: not started, in progress, completed.',
        variants: [
          'stage=not started: Not started status icon',
          'stage=in progress: In progress status icon',
          'stage=completed: Completed status icon',
        ],
      },
      {
        name: 'StrategyBadge',
        description: 'Badge component showing different file/strategy types: image, video, audio, document, book, website, other.',
        variants: [
          'type=image: Image file badge',
          'type=video: Video file badge',
          'type=audio: Audio file badge',
          'type=document: Document/PDF badge',
          'type=book: Book badge',
          'type=website: Website badge',
          'type=other: Other file badge',
        ],
      },
      {
        name: 'CtaButtons',
        description: 'CTA button component with different states: not started (Get Started), in progress (Continue), completed (Review).',
        variants: [
          'state=not started: Get Started button',
          'state=in progress: Continue button',
          'state=completed: Review button',
        ],
      },
      {
        name: 'DropdownListOptions',
        description: 'Dropdown menu with sorting options: name, duration, progress. Each type shows different sorting criteria and order options.',
        variants: [
          'type=name: Name sorting dropdown with A-Z/Z-A order',
          'type=duration: Duration sorting dropdown with Shortest First/Longest Last order',
          'type=progress: Progress sorting dropdown with Completed First/Completed Last order',
        ],
      },
      {
        name: 'SortingDropdown',
        description: 'Dropdown button with open/closed states for sorting.',
        variants: [
          'status=false: Closed dropdown button',
          'status=true: Open dropdown with menu',
        ],
      },
      {
        name: 'ContentBlurb',
        description: 'Content card with title, description, duration, and action button. Used to display onboarding module information.',
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
 * StatusIndicators - All Variants
 * Status indicator icons showing different stages
 */
export const StatusIndicators = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'row';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.alignItems = 'center';

    const notStarted = createStatusIndicators({ stage: 'not started' });
    container.appendChild(notStarted);

    const inProgress = createStatusIndicators({ stage: 'in progress' });
    container.appendChild(inProgress);

    const completed = createStatusIndicators({ stage: 'completed' });
    container.appendChild(completed);

    return container;
  },
};

/**
 * StrategyBadge - All Variants
 * Badge component showing different file/strategy types
 */
export const StrategyBadge = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'row';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.alignItems = 'center';
    container.style.flexWrap = 'wrap';

    const image = createStrategyBadge({ type: 'image' });
    container.appendChild(image);

    const video = createStrategyBadge({ type: 'video' });
    container.appendChild(video);

    const audio = createStrategyBadge({ type: 'audio' });
    container.appendChild(audio);

    const documentBadge = createStrategyBadge({ type: 'document' });
    container.appendChild(documentBadge);

    const book = createStrategyBadge({ type: 'book' });
    container.appendChild(book);

    const website = createStrategyBadge({ type: 'website' });
    container.appendChild(website);

    const other = createStrategyBadge({ type: 'other' });
    container.appendChild(other);

    return container;
  },
};

/**
 * CtaButtons - All Variants
 * CTA button component with different states
 */
export const CtaButtons = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'row';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.alignItems = 'center';

    const notStarted = createCtaButtons({ state: 'not started' });
    container.appendChild(notStarted);

    const inProgress = createCtaButtons({ state: 'in progress' });
    container.appendChild(inProgress);

    const completed = createCtaButtons({ state: 'completed' });
    container.appendChild(completed);

    return container;
  },
};

/**
 * DropdownListOptions - All Variants
 * Dropdown menu with sorting options
 */
export const DropdownListOptions = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'row';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.alignItems = 'flex-start';
    container.style.flexWrap = 'wrap';

    const name = createDropdownListOptions({ type: 'name' });
    container.appendChild(name);

    const duration = createDropdownListOptions({ type: 'duration' });
    container.appendChild(duration);

    const progress = createDropdownListOptions({ type: 'progress' });
    container.appendChild(progress);

    return container;
  },
};

/**
 * SortingDropdown - All Variants
 * Dropdown button with open/closed states
 */
export const SortingDropdown = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'row';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.alignItems = 'flex-start';

    const closed = createSortingDropdown({ status: false });
    container.appendChild(closed);

    const open = createSortingDropdown({ status: true });
    container.appendChild(open);

    return container;
  },
};

/**
 * ContentBlurb
 * Content card with title, description, duration, and action button
 */
export const ContentBlurb = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.backgroundColor = 'var(--color-surface)';

    const contentBlurb = createContentBlurb({
      title: 'Competence-building Narratives',
      description: 'Description',
      duration: 'Estimated Time: {xx} minutes',
      badgeType: 'image'
    });
    container.appendChild(contentBlurb);

    return container;
  },
};

