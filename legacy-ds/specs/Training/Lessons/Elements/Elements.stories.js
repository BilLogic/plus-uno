/**
 * Training Organism - Elements
 * 
 * Individual form elements and UI components used in training flows.
 */

import { createToastTextButton } from './ToastTextButton.js';
import { createAiIndicator } from './AIIndicator.js';
import { createRatingSingle } from './RatingSingle.js';
import { createRating } from './Rating.js';
import { createLikertScale } from './LikertScale.js';
import { createSortControl } from './SortControl.js';
import { createTrainingLessonStatusSelect } from './TrainingLessonStatusSelect.js';

export default {
  title: 'Specs/Training/Lessons/Elements',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Individual form elements and UI components used in training flows.',
      },
    },
  },
};

export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Training Elements';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Individual form elements and UI components used in training flows. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const components = [
      { name: 'Rating', description: 'Rating component with values: rest (default), 1, 2, 3, 4, 5' },
      { name: 'RatingSingle', description: 'Single rating component with states: rest (Default), selected' },
      { name: 'LikertScale', description: 'Likert scale component' },
      { name: 'AI Indicator', description: 'AI Indicator icon' },
      { name: 'SortControl', description: 'Sort control with options: name, Dropdown, Status, Competency Areas' },
      { name: 'TrainingLessonStatusSelect', description: 'Training lesson status select with states: Open?=true, Open?=false' },
      { name: 'ToastTextButton', description: 'Toast with text button' },
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
      componentCard.appendChild(componentDesc);
      
      componentsList.appendChild(componentCard);
    });
    
    container.appendChild(componentsList);
    return container;
  },
};

export const ToastTextButton = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.backgroundColor = 'var(--color-surface-container)';
    container.style.minHeight = '100vh';

    const toast = createToastTextButton({
      title: "Congratulations!",
      message: "You've unlocked a new badge for completing all training lessons.",
      buttonText: "Claim My Badge",
      icon: "circle",
      onClose: () => console.log("Toast closed"),
      onButtonClick: () => console.log("Button clicked")
    });

    container.appendChild(toast);
    return container;
  },
};

/**
 * AI Indicator Component
 * AI Indicator icon button
 */
export const AIIndicator = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.backgroundColor = 'var(--color-surface-container)';
    container.style.minHeight = '100vh';

    const aiIndicator = createAiIndicator({
      onClick: () => console.log("AI Indicator clicked")
    });

    container.appendChild(aiIndicator);
    return container;
  },
};

export const RatingSingle = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.backgroundColor = 'var(--color-surface-container)';
    container.style.minHeight = '100vh';
    container.style.alignItems = 'center';

    const restState = createRatingSingle({
      value: 1,
      status: "rest",
      onClick: () => console.log("Rating clicked")
    });

    const selectedState = createRatingSingle({
      value: 1,
      status: "selected",
      onClick: () => console.log("Rating clicked")
    });

    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.gap = 'var(--size-section-gap-lg)';
    wrapper.style.alignItems = 'center';
    wrapper.appendChild(restState);
    wrapper.appendChild(selectedState);

    container.appendChild(wrapper);
    return container;
  },
};

export const Rating = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.backgroundColor = 'var(--color-surface-container)';
    container.style.minHeight = '100vh';

    const ratings = [
      { rating: "rest", label: "Rest (default)" },
      { rating: 1, label: "Rating = 1" },
      { rating: 2, label: "Rating = 2" },
      { rating: 3, label: "Rating = 3" },
      { rating: 4, label: "Rating = 4" },
      { rating: 5, label: "Rating = 5" }
    ];

    ratings.forEach(({ rating, label }) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.gap = 'var(--size-element-gap-md)';

      const labelEl = document.createElement('h3');
      labelEl.className = 'h5';
      labelEl.textContent = label;
      wrapper.appendChild(labelEl);

      const ratingComponent = createRating({
        rating: rating,
        onRatingChange: (value) => console.log(`Rating changed to ${value}`)
      });
      wrapper.appendChild(ratingComponent);

      container.appendChild(wrapper);
    });

    return container;
  },
};

export const LikertScale = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.backgroundColor = 'var(--color-surface-container)';
    container.style.minHeight = '100vh';

    const likertScale = createLikertScale({
      leftLabel: "Not at all confident",
      rightLabel: "Extremely confident",
      rating: "rest",
      onRatingChange: (value) => console.log(`Likert scale rating changed to ${value}`)
    });

    container.appendChild(likertScale);
    return container;
  },
};

export const SortControl = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.backgroundColor = 'var(--color-surface-container)';
    container.style.minHeight = '100vh';

    const variants = [
      { variant: "Dropdown", label: "Dropdown (default)" },
      { variant: "name", label: "Name" },
      { variant: "Status", label: "Status" },
      { variant: "Competency Areas", label: "Competency Areas" }
    ];

    variants.forEach(({ variant, label }) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.gap = 'var(--size-element-gap-md)';

      const labelEl = document.createElement('h3');
      labelEl.className = 'h5';
      labelEl.textContent = label;
      wrapper.appendChild(labelEl);

      const sortControl = createSortControl({
        variant: variant,
        selectedValue: null,
        onChange: (value) => console.log(`Sort changed to ${value}`)
      });
      wrapper.appendChild(sortControl);

      container.appendChild(wrapper);
    });

    return container;
  },
};

export const TrainingLessonStatusSelect = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.backgroundColor = 'var(--color-surface-container)';
    container.style.minHeight = '100vh';

    const closedState = createTrainingLessonStatusSelect({
      open: false,
      selectedStatus: "All",
      counts: {
        all: 20,
        assigned: 0,
        inProgress: 0,
        completed: 5,
        notStarted: 15
      },
      onStatusChange: (status) => console.log(`Status changed to ${status}`)
    });

    const openState = createTrainingLessonStatusSelect({
      open: true,
      selectedStatus: "All",
      counts: {
        all: 20,
        assigned: 0,
        inProgress: 0,
        completed: 5,
        notStarted: 15
      },
      onStatusChange: (status) => console.log(`Status changed to ${status}`)
    });

    const closedWrapper = document.createElement('div');
    closedWrapper.style.display = 'flex';
    closedWrapper.style.flexDirection = 'column';
    closedWrapper.style.gap = 'var(--size-element-gap-md)';

    const closedLabel = document.createElement('h3');
    closedLabel.className = 'h5';
    closedLabel.textContent = 'Open?=false';
    closedWrapper.appendChild(closedLabel);
    closedWrapper.appendChild(closedState);

    const openWrapper = document.createElement('div');
    openWrapper.style.display = 'flex';
    openWrapper.style.flexDirection = 'column';
    openWrapper.style.gap = 'var(--size-element-gap-md)';

    const openLabel = document.createElement('h3');
    openLabel.className = 'h5';
    openLabel.textContent = 'Open?=true';
    openWrapper.appendChild(openLabel);
    openWrapper.appendChild(openState);

    container.appendChild(closedWrapper);
    container.appendChild(openWrapper);

    return container;
  },
};
