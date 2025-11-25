/**
 * Card Content Variants Stories
 * Content-based variants organized under "Content Variants" subcategory
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Card/Content Variants',
  tags: ['autodocs'],
};

/**
 * Complete Card
 * Shows a card with all parts: image, title, subtitle, body, header, items, footer, links, and action button
 */
export const CompleteCard = {
  render: () => {
    // Create image placeholder
    const imagePlaceholder = document.createElement('div');
    imagePlaceholder.style.width = '100%';
    imagePlaceholder.style.height = '200px';
    imagePlaceholder.style.display = 'flex';
    imagePlaceholder.style.alignItems = 'center';
    imagePlaceholder.style.justifyContent = 'center';
    imagePlaceholder.style.backgroundColor = 'var(--color-surface-variant)';
    imagePlaceholder.style.color = 'var(--color-on-surface-variant)';
    imagePlaceholder.textContent = 'Image cap';
    
    return PlusInterface.createCard({
      image: imagePlaceholder,
      title: 'Card Title',
      subtitle: 'Card Subtitle',
      body: 'Some quick example text to build on the card title and make up the bulk of the card\'s content.',
      header: 'Header',
      items: ['Item #1', 'Item #2', 'Item #3'],
      footer: 'Footer',
      links: [
        { text: 'Link #1', href: '#', onClick: () => alert('Link #1 clicked') },
        { text: 'Link #2', href: '#', onClick: () => alert('Link #2 clicked') }
      ],
      actionButton: {
        text: 'Action',
        onClick: () => alert('Action button clicked'),
        style: 'primary',
        fill: 'filled',
        size: 'default'
      }
    });
  },
};

/**
 * Card with Image
 * Card with image/media area at the top
 */
export const WithImage = {
  render: () => {
    const imagePlaceholder = document.createElement('div');
    imagePlaceholder.style.width = '100%';
    imagePlaceholder.style.height = '200px';
    imagePlaceholder.style.display = 'flex';
    imagePlaceholder.style.alignItems = 'center';
    imagePlaceholder.style.justifyContent = 'center';
    imagePlaceholder.style.backgroundColor = 'var(--color-surface-variant)';
    imagePlaceholder.style.color = 'var(--color-on-surface-variant)';
    imagePlaceholder.textContent = 'Image cap';
    
    return PlusInterface.createCard({
      image: imagePlaceholder,
      title: 'Card Title',
      subtitle: 'Card Subtitle',
      body: 'Some quick example text to build on the card title and make up the bulk of the card\'s content.',
    });
  },
};

/**
 * Card with Subtitle
 * Card with title and subtitle
 */
export const WithSubtitle = {
  render: () => {
    return PlusInterface.createCard({
      title: 'Card Title',
      subtitle: 'Card Subtitle',
      body: 'Some quick example text to build on the card title and make up the bulk of the card\'s content.',
    });
  },
};

/**
 * Card with Items
 * Card with header and list items
 */
export const WithItems = {
  render: () => {
    return PlusInterface.createCard({
      title: 'Card Title',
      body: 'Some quick example text to build on the card title and make up the bulk of the card\'s content.',
      header: 'Header',
      items: ['Item #1', 'Item #2', 'Item #3'],
    });
  },
};

/**
 * Card with Links
 * Card with footer links
 */
export const WithLinks = {
  render: () => {
    return PlusInterface.createCard({
      title: 'Card Title',
      subtitle: 'Card Subtitle',
      body: 'Some quick example text to build on the card title and make up the bulk of the card\'s content.',
      links: [
        { text: 'Card Links', href: '#', onClick: () => alert('Link clicked') },
        { text: 'Card Links', href: '#', onClick: () => alert('Link clicked') }
      ],
    });
  },
};

/**
 * Card with Action Button
 * Card with footer action button
 */
export const WithActionButton = {
  render: () => {
    return PlusInterface.createCard({
      title: 'Card Title',
      subtitle: 'Card Subtitle',
      body: 'Some quick example text to build on the card title and make up the bulk of the card\'s content.',
      footer: 'Footer',
      links: [
        { text: 'Link #1', href: '#', onClick: () => alert('Link #1 clicked') },
        { text: 'Link #2', href: '#', onClick: () => alert('Link #2 clicked') }
      ],
      actionButton: {
        text: 'Action',
        onClick: () => alert('Action button clicked'),
        style: 'primary',
        fill: 'filled',
        size: 'default'
      }
    });
  },
};

