/**
 * Badge and Chip Molecule Stories
 * Badge and chip components for labels and tags
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Badge',
  tags: ['autodocs'],
  argTypes: {
    text: {
      control: 'text',
      description: 'Badge text',
    },
    style: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'success', 'danger', 'warning'],
      description: 'Badge style',
    },
    size: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b1', 'b2', 'b3'],
      description: 'Badge size',
    },
  },
};

/**
 * Badge Styles
 */
export const Styles = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = '1rem';
    
    const styles = ['primary', 'secondary', 'tertiary', 'success', 'danger', 'warning'];
    
    styles.forEach((style) => {
      const badge = PlusInterface.createBadge({
        text: style.charAt(0).toUpperCase() + style.slice(1),
        style: style,
        size: 'b2'
      });
      container.appendChild(badge);
    });
    
    return container;
  },
};

/**
 * Badge Sizes
 */
export const Sizes = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.alignItems = 'center';
    container.style.gap = '1rem';
    
    const sizes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b1', 'b2', 'b3'];
    
    sizes.forEach((size) => {
      const badge = PlusInterface.createBadge({
        text: size.toUpperCase(),
        style: 'primary',
        size: size
      });
      container.appendChild(badge);
    });
    
    return container;
  },
};

/**
 * All Style and Size Combinations (H4)
 */
export const AllStylesH4 = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = '1rem';
    
    const styles = ['primary', 'secondary', 'tertiary', 'success', 'danger', 'warning'];
    
    styles.forEach((style) => {
      const badge = PlusInterface.createBadge({
        text: 'Badge',
        style: style,
        size: 'h4'
      });
      container.appendChild(badge);
    });
    
    return container;
  },
};

/**
 * All Style and Size Combinations (B2)
 */
export const AllStylesB2 = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = '1rem';
    
    const styles = ['primary', 'secondary', 'tertiary', 'success', 'danger', 'warning'];
    
    styles.forEach((style) => {
      const badge = PlusInterface.createBadge({
        text: 'Badge',
        style: style,
        size: 'b2'
      });
      container.appendChild(badge);
    });
    
    return container;
  },
};

/**
 * Interactive Badge
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    const badge = PlusInterface.createBadge(args);
    container.appendChild(badge);
    return container;
  },
  args: {
    text: 'Badge',
    style: 'primary',
    size: 'b2',
  },
};

/**
 * Chips with Remove
 */
export const Chips = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = '1rem';
    
    const chips = [
      { text: 'Chip 1', style: 'primary', removable: true },
      { text: 'Chip 2', style: 'success', removable: true },
      { text: 'Chip 3', style: 'danger', removable: true },
      { text: 'Chip 4', style: 'warning', removable: false },
    ];
    
    chips.forEach((chip) => {
      const chipEl = PlusInterface.createChip({
        text: chip.text,
        style: chip.style,
        size: 'b2',
        removable: chip.removable,
        onRemove: () => console.log(`${chip.text} removed`)
      });
      container.appendChild(chipEl);
    });
    
    return container;
  },
};

