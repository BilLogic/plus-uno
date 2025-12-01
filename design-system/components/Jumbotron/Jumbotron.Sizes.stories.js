/**
 * Jumbotron Size Variants Stories
 * Size variants for jumbotron elements
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Jumbotron/Sizes',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Jumbotron size variants: small, medium (default), and large. Sizes affect padding and gap.',
      },
    },
  },
};

/**
 * Small
 */
export const Small = {
  render: () => {
    return PlusInterface.createJumbotron({
      title: 'Small',
      body: 'Small size jumbotron.',
      paddingSize: 'sm',
      gapSize: 'sm',
      radiusSize: 'sm'
    });
  },
};

/**
 * Default
 */
export const Default = {
  render: () => {
    return PlusInterface.createJumbotron({
      title: 'Hello, world!',
      body: 'This is a simple hero unit.',
      paddingSize: 'md',
      gapSize: 'md',
      radiusSize: 'md'
    });
  },
};

/**
 * Large
 */
export const Large = {
  render: () => {
    return PlusInterface.createJumbotron({
      title: 'Large',
      body: 'Large size jumbotron.',
      paddingSize: 'lg',
      gapSize: 'lg',
      radiusSize: 'lg'
    });
  },
};

/**
 * All Sizes
 */
export const AllSizes = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    const sizes = ['sm', 'md', 'lg'];
    sizes.forEach((size) => {
      const label = document.createElement('div');
      label.className = 'h6';
      label.textContent = `Size: ${size.toUpperCase()}`;
      label.style.marginBottom = 'var(--size-element-gap-sm)';
      container.appendChild(label);
      
      const jumbotron = PlusInterface.createJumbotron({
        title: `Jumbotron ${size.toUpperCase()}`,
        body: `This is a ${size} size jumbotron with ${size} padding and gap.`,
        paddingSize: size,
        gapSize: size,
        primaryButton: {
          text: 'Action',
          style: 'primary',
          fill: 'filled',
          size: 'default',
          onClick: () => {}
        }
      });
      container.appendChild(jumbotron);
    });
    
    return container;
  },
};

