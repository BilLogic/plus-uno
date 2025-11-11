/**
 * Breadcrumb Molecule Stories
 * Breadcrumb navigation component
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Breadcrumb',
  tags: ['autodocs'],
};

/**
 * Single Item Breadcrumb
 */
export const SingleItem = {
  render: () => {
    const container = document.createElement('div');
    const breadcrumb = PlusInterface.createBreadcrumb({
      items: [
        { text: 'Page Now' }
      ]
    });
    container.appendChild(breadcrumb);
    return container;
  },
};

/**
 * Two Items Breadcrumb
 */
export const TwoItems = {
  render: () => {
    const container = document.createElement('div');
    const breadcrumb = PlusInterface.createBreadcrumb({
      items: [
        { text: 'Page Links', href: '#' },
        { text: 'Page Now' }
      ]
    });
    container.appendChild(breadcrumb);
    return container;
  },
};

/**
 * Three Items Breadcrumb
 */
export const ThreeItems = {
  render: () => {
    const container = document.createElement('div');
    const breadcrumb = PlusInterface.createBreadcrumb({
      items: [
        { text: 'Page Links', href: '#' },
        { text: 'Page Links', href: '#' },
        { text: 'Page Now' }
      ]
    });
    container.appendChild(breadcrumb);
    return container;
  },
};

/**
 * Four Items Breadcrumb
 */
export const FourItems = {
  render: () => {
    const container = document.createElement('div');
    const breadcrumb = PlusInterface.createBreadcrumb({
      items: [
        { text: 'Page Links', href: '#' },
        { text: 'Page Links', href: '#' },
        { text: 'Page Links', href: '#' },
        { text: 'Page Now' }
      ]
    });
    container.appendChild(breadcrumb);
    return container;
  },
};

/**
 * Five Items Breadcrumb
 */
export const FiveItems = {
  render: () => {
    const container = document.createElement('div');
    const breadcrumb = PlusInterface.createBreadcrumb({
      items: [
        { text: 'Page Links', href: '#' },
        { text: 'Page Links', href: '#' },
        { text: 'Page Links', href: '#' },
        { text: 'Page Links', href: '#' },
        { text: 'Page Now' }
      ]
    });
    container.appendChild(breadcrumb);
    return container;
  },
};

/**
 * Six Items Breadcrumb
 */
export const SixItems = {
  render: () => {
    const container = document.createElement('div');
    const breadcrumb = PlusInterface.createBreadcrumb({
      items: [
        { text: 'Page Links', href: '#' },
        { text: 'Page Links', href: '#' },
        { text: 'Page Links', href: '#' },
        { text: 'Page Links', href: '#' },
        { text: 'Page Links', href: '#' },
        { text: 'Page Now' }
      ]
    });
    container.appendChild(breadcrumb);
    return container;
  },
};

/**
 * Interactive Breadcrumb
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    const breadcrumb = PlusInterface.createBreadcrumb({
      items: args.items || [
        { text: 'Home', href: '#', onClick: () => console.log('Home clicked') },
        { text: 'Category', href: '#', onClick: () => console.log('Category clicked') },
        { text: 'Current Page' }
      ],
      separator: args.separator || '/'
    });
    container.appendChild(breadcrumb);
    return container;
  },
  argTypes: {
    items: {
      control: 'object',
      description: 'Array of breadcrumb items',
    },
    separator: {
      control: 'text',
      description: 'Separator character',
    },
  },
  args: {
    items: [
      { text: 'Home', href: '#' },
      { text: 'Category', href: '#' },
      { text: 'Current Page' }
    ],
    separator: '/',
  },
};

