/**
 * Media Object Molecule Stories
 * 
 * Figma Reference: https://www.figma.com/design/zAecJNRdvJzAUOcjV32tRX/Design-System---BS4?node-id=53-20424&t=XxnevshHwphhdAOI-4
 * 
 * Matches Figma design system specifications exactly
 * 6 variants based on media position alignment
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/MediaObject',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Media Object component matching Figma design system specifications exactly.',
      },
    },
  },
};


/**
 * Overview
 * Shows all media object variants organized by category in a scrollable format
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    // Orientations Section
    const orientationsSection = document.createElement('div');
    orientationsSection.style.display = 'flex';
    orientationsSection.style.flexDirection = 'column';
    orientationsSection.style.gap = 'var(--size-card-gap-md)';
    
    const orientationsHeading = document.createElement('div');
    orientationsHeading.className = 'h5';
    orientationsHeading.textContent = 'Orientations';
    orientationsHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    orientationsSection.appendChild(orientationsHeading);
    
    const orientationsRow = document.createElement('div');
    orientationsRow.style.display = 'flex';
    orientationsRow.style.flexDirection = 'column';
    orientationsRow.style.gap = 'var(--size-section-gap-md)';
    
    // Left alignment
    const mediaLeft = document.createElement('div');
    mediaLeft.style.width = '64px';
    mediaLeft.style.height = '64px';
    mediaLeft.style.borderRadius = 'var(--size-element-radius-sm)';
    mediaLeft.style.backgroundColor = 'var(--color-surface-variant)';
    mediaLeft.style.display = 'flex';
    mediaLeft.style.alignItems = 'center';
    mediaLeft.style.justifyContent = 'center';
    mediaLeft.style.color = 'var(--color-on-surface-variant)';
    mediaLeft.textContent = '64';
    
    const leftObject = PlusInterface.createMediaObject({
      media: mediaLeft,
      heading: 'Media heading',
      body: 'Will you do the same for me? It\'s time to face the music.',
    });
    orientationsRow.appendChild(leftObject);
    
    // Right alignment
    const mediaRight = document.createElement('div');
    mediaRight.style.width = '64px';
    mediaRight.style.height = '64px';
    mediaRight.style.borderRadius = 'var(--size-element-radius-sm)';
    mediaRight.style.backgroundColor = 'var(--color-surface-variant)';
    mediaRight.style.display = 'flex';
    mediaRight.style.alignItems = 'center';
    mediaRight.style.justifyContent = 'center';
    mediaRight.style.color = 'var(--color-on-surface-variant)';
    mediaRight.textContent = '64';
    
    const rightObject = PlusInterface.createMediaObject({
      media: mediaRight,
      heading: 'Media heading',
      body: 'Will you do the same for me? It\'s time to face the music.',
      alignment: 'right',
    });
    orientationsRow.appendChild(rightObject);
    
    orientationsSection.appendChild(orientationsRow);
    container.appendChild(orientationsSection);
    
    return container;
  },
};

export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    
    const media = document.createElement('div');
    media.style.width = args.mediaSize === 'small' ? '48px' : args.mediaSize === 'large' ? '96px' : '64px';
    media.style.height = args.mediaSize === 'small' ? '48px' : args.mediaSize === 'large' ? '96px' : '64px';
    media.style.borderRadius = 'var(--size-element-radius-sm)';
    media.style.backgroundColor = 'var(--color-surface-variant)';
    media.style.display = 'flex';
    media.style.alignItems = 'center';
    media.style.justifyContent = 'center';
    media.style.color = 'var(--color-on-surface-variant)';
    media.textContent = args.mediaSize === 'small' ? '48' : args.mediaSize === 'large' ? '96' : '64';
    
    const mediaObject = PlusInterface.createMediaObject({
      media: media,
      heading: args.heading || 'Media heading',
      body: args.body || 'Will you do the same for me? It\'s time to face the music I\'m no longer your muse. Heard it\'s beautiful, be the judge and my girls gonna take a vote.',
      alignment: args.alignment || 'left',
      mediaSize: args.mediaSize || 'default',
      onClick: args.onClick ? () => console.log('Media object clicked') : null
    });
    
    container.appendChild(mediaObject);
    return container;
  },
  argTypes: {
    heading: {
      control: 'text',
      description: 'Media object heading',
    },
    body: {
      control: 'text',
      description: 'Media object body text',
    },
    alignment: {
      control: 'select',
      options: ['left', 'left-center', 'left-bottom', 'right', 'right-center', 'right-bottom'],
      description: 'Media alignment',
    },
    mediaSize: {
      control: 'select',
      options: ['small', 'default', 'large'],
      description: 'Media size',
    },
    onClick: {
      control: 'boolean',
      description: 'Make media object clickable',
    },
  },
  args: {
    heading: 'Media heading',
    body: 'Will you do the same for me? It\'s time to face the music I\'m no longer your muse. Heard it\'s beautiful, be the judge and my girls gonna take a vote.',
    alignment: 'left',
    mediaSize: 'default',
    onClick: false,
  },
};
