/**
 * Navigation Orientation Variants Stories
 * 
 * Shows horizontal and vertical orientations
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Navigation/Orientations',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Navigation orientations determine the layout direction. Shows horizontal and vertical orientations.',
      },
    },
  },
};

/**
 * All Orientations
 * Shows both horizontal and vertical orientations together
 */
export const AllOrientations = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const baseItems = [
      { text: 'Tab', selected: true },
      { text: 'Tab', selected: false },
      { text: 'Tab', selected: false },
    ];
    
    // Horizontal
    const horizontalSection = document.createElement('div');
    horizontalSection.style.display = 'flex';
    horizontalSection.style.flexDirection = 'column';
    horizontalSection.style.gap = 'var(--size-element-gap-sm)';
    
    const horizontalLabel = document.createElement('div');
    horizontalLabel.className = 'h6';
    horizontalLabel.textContent = 'Horizontal';
    horizontalSection.appendChild(horizontalLabel);
    
    const horizontalNav = PlusInterface.createNavigation({
      items: baseItems,
      type: 'horizontal',
      alignment: 'left'
    });
    horizontalSection.appendChild(horizontalNav);
    container.appendChild(horizontalSection);
    
    // Vertical
    const verticalSection = document.createElement('div');
    verticalSection.style.display = 'flex';
    verticalSection.style.flexDirection = 'column';
    verticalSection.style.gap = 'var(--size-element-gap-sm)';
    
    const verticalLabel = document.createElement('div');
    verticalLabel.className = 'h6';
    verticalLabel.textContent = 'Vertical';
    verticalSection.appendChild(verticalLabel);
    
    const verticalNav = PlusInterface.createNavigation({
      items: baseItems,
      type: 'vertical',
      alignment: 'left'
    });
    verticalSection.appendChild(verticalNav);
    container.appendChild(verticalSection);
    
    return container;
  },
};

/**
 * Horizontal
 * Shows horizontal navigation orientation
 */
export const Horizontal = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const nav = PlusInterface.createNavigation({
      items: [
        { text: 'Tab', selected: true },
        { text: 'Tab', selected: false },
        { text: 'Tab', selected: false },
      ],
      type: 'horizontal',
      alignment: 'left'
    });
    
    container.appendChild(nav);
    return container;
  },
};

/**
 * Vertical
 * Shows vertical navigation orientation
 */
export const Vertical = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const nav = PlusInterface.createNavigation({
      items: [
        { text: 'Tab', selected: true },
        { text: 'Tab', selected: false },
        { text: 'Tab', selected: false },
      ],
      type: 'vertical',
      alignment: 'left'
    });
    
    container.appendChild(nav);
    return container;
  },
};

