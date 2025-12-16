/**
 * Jumbotron Content Variants Stories
 * Content variants for jumbotron elements
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Jumbotron/Content',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Jumbotron content variants: default, with subtitle, with both buttons, and fluid.',
      },
    },
  },
};

/**
 * Default
 */
export const Default = {
  render: () => {
    return PlusInterface.createJumbotron({
      title: 'Hello, world!',
      body: 'This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.',
      primaryButton: {
        text: 'Learn more',
        style: 'primary',
        fill: 'filled',
        size: 'default',
        onClick: () => alert('Learn more clicked')
      }
    });
  },
};

/**
 * With Subtitle
 */
export const WithSubtitle = {
  render: () => {
    return PlusInterface.createJumbotron({
      title: 'Hello, world!',
      subtitle: 'It uses utility classes for typography and spacing to space content out within the larger container.',
      body: 'This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.',
      primaryButton: {
        text: 'Learn more',
        style: 'primary',
        fill: 'filled',
        size: 'default',
        onClick: () => alert('Learn more clicked')
      },
      secondaryButton: {
        text: 'Get started',
        style: 'secondary',
        fill: 'outline',
        size: 'default',
        onClick: () => alert('Get started clicked')
      }
    });
  },
};

/**
 * With Both Buttons
 */
export const WithBothButtons = {
  render: () => {
    return PlusInterface.createJumbotron({
      title: 'Hello, world!',
      body: 'This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.',
      primaryButton: {
        text: 'Learn more',
        style: 'primary',
        fill: 'filled',
        size: 'default',
        onClick: () => console.log('Primary button clicked')
      },
      secondaryButton: {
        text: 'Cancel',
        style: 'secondary',
        fill: 'outline',
        size: 'default',
        onClick: () => console.log('Secondary button clicked')
      },
      paddingSize: 'md',
      gapSize: 'md',
      radiusSize: 'md'
    });
  },
};

/**
 * Fluid
 */
export const Fluid = {
  render: () => {
    return PlusInterface.createJumbotron({
      title: 'Hello, world!',
      body: 'This is a fluid jumbotron that spans the full width with no border-radius.',
      fluid: true,
      paddingSize: 'md',
      gapSize: 'md',
      radiusSize: 'md'
    });
  },
};

/**
 * All Content Variants
 */
export const AllContent = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    // Title only
    const titleOnlyLabel = document.createElement('div');
    titleOnlyLabel.className = 'h6';
    titleOnlyLabel.textContent = 'Title Only';
    titleOnlyLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(titleOnlyLabel);
    
    const titleOnly = PlusInterface.createJumbotron({
      title: 'Title Only Jumbotron',
    });
    container.appendChild(titleOnly);
    
    // Title + Body
    const titleBodyLabel = document.createElement('div');
    titleBodyLabel.className = 'h6';
    titleBodyLabel.textContent = 'Title + Body';
    titleBodyLabel.style.marginTop = 'var(--size-section-gap-md)';
    titleBodyLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(titleBodyLabel);
    
    const titleBody = PlusInterface.createJumbotron({
      title: 'Title + Body',
      body: 'This jumbotron has a title and body text.',
    });
    container.appendChild(titleBody);
    
    // Title + Subtitle + Body
    const fullLabel = document.createElement('div');
    fullLabel.className = 'h6';
    fullLabel.textContent = 'Title + Subtitle + Body';
    fullLabel.style.marginTop = 'var(--size-section-gap-md)';
    fullLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(fullLabel);
    
    const full = PlusInterface.createJumbotron({
      title: 'Full Content',
      subtitle: 'Subtitle text here',
      body: 'This jumbotron has title, subtitle, and body text.',
    });
    container.appendChild(full);
    
    // With buttons
    const withButtonsLabel = document.createElement('div');
    withButtonsLabel.className = 'h6';
    withButtonsLabel.textContent = 'With Action Buttons';
    withButtonsLabel.style.marginTop = 'var(--size-section-gap-md)';
    withButtonsLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(withButtonsLabel);
    
    const withButtons = PlusInterface.createJumbotron({
      title: 'With Buttons',
      body: 'This jumbotron includes action buttons.',
      primaryButton: {
        text: 'Primary',
        style: 'primary',
        fill: 'filled',
        size: 'default',
        onClick: () => {}
      },
      secondaryButton: {
        text: 'Secondary',
        style: 'secondary',
        fill: 'outline',
        size: 'default',
        onClick: () => {}
      }
    });
    container.appendChild(withButtons);
    
    return container;
  },
};

