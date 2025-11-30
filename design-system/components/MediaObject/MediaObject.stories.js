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
 * Left
 * Media object with media on left, content on right, top-aligned
 */
export const Left = {
  render: () => {
    const media = document.createElement('div');
    media.style.width = '64px';
    media.style.height = '64px';
    media.style.borderRadius = 'var(--size-element-radius-sm)';
    media.style.backgroundColor = 'var(--color-surface-variant)';
    media.style.display = 'flex';
    media.style.alignItems = 'center';
    media.style.justifyContent = 'center';
    media.style.color = 'var(--color-on-surface-variant)';
    media.textContent = '64';
    
    return PlusInterface.createMediaObject({
      media: media,
      heading: 'Media heading',
      body: 'Will you do the same for me? It\'s time to face the music I\'m no longer your muse. Heard it\'s beautiful, be the judge and my girls gonna take a vote. I can feel a phoenix inside of me. Heaven is jealous of our love, angels are crying from up above. Yeah, you take me to utopia.',
    });
  },
};

/**
 * Left Center
 * Media object with media on left, content on right, vertically centered
 */
export const LeftCenter = {
  render: () => {
    const media = document.createElement('div');
    media.style.width = '64px';
    media.style.height = '64px';
    media.style.borderRadius = 'var(--size-element-radius-sm)';
    media.style.backgroundColor = 'var(--color-surface-variant)';
    media.style.display = 'flex';
    media.style.alignItems = 'center';
    media.style.justifyContent = 'center';
    media.style.color = 'var(--color-on-surface-variant)';
    media.textContent = '64';
    
    return PlusInterface.createMediaObject({
      media: media,
      heading: 'Media heading',
      body: 'Will you do the same for me? It\'s time to face the music I\'m no longer your muse. Heard it\'s beautiful, be the judge and my girls gonna take a vote. I can feel a phoenix inside of me. Heaven is jealous of our love, angels are crying from up above. Yeah, you take me to utopia.',
      alignment: 'left-center',
    });
  },
};

/**
 * Left Bottom
 * Media object with media on left, content on right, bottom-aligned
 */
export const LeftBottom = {
  render: () => {
    const media = document.createElement('div');
    media.style.width = '64px';
    media.style.height = '64px';
    media.style.borderRadius = 'var(--size-element-radius-sm)';
    media.style.backgroundColor = 'var(--color-surface-variant)';
    media.style.display = 'flex';
    media.style.alignItems = 'center';
    media.style.justifyContent = 'center';
    media.style.color = 'var(--color-on-surface-variant)';
    media.textContent = '64';
    
    return PlusInterface.createMediaObject({
      media: media,
      heading: 'Media heading',
      body: 'Will you do the same for me? It\'s time to face the music I\'m no longer your muse. Heard it\'s beautiful, be the judge and my girls gonna take a vote. I can feel a phoenix inside of me. Heaven is jealous of our love, angels are crying from up above. Yeah, you take me to utopia.',
      alignment: 'left-bottom',
    });
  },
};

/**
 * Right
 * Media object with media on right, content on left, top-aligned
 */
export const Right = {
  render: () => {
    const media = document.createElement('div');
    media.style.width = '64px';
    media.style.height = '64px';
    media.style.borderRadius = 'var(--size-element-radius-sm)';
    media.style.backgroundColor = 'var(--color-surface-variant)';
    media.style.display = 'flex';
    media.style.alignItems = 'center';
    media.style.justifyContent = 'center';
    media.style.color = 'var(--color-on-surface-variant)';
    media.textContent = '64';
    
    return PlusInterface.createMediaObject({
      media: media,
      heading: 'Media heading',
      body: 'Will you do the same for me? It\'s time to face the music I\'m no longer your muse. Heard it\'s beautiful, be the judge and my girls gonna take a vote. I can feel a phoenix inside of me. Heaven is jealous of our love, angels are crying from up above. Yeah, you take me to utopia.',
      alignment: 'right',
    });
  },
};

/**
 * Right Center
 * Media object with media on right, content on left, vertically centered
 */
export const RightCenter = {
  render: () => {
    const media = document.createElement('div');
    media.style.width = '64px';
    media.style.height = '64px';
    media.style.borderRadius = 'var(--size-element-radius-sm)';
    media.style.backgroundColor = 'var(--color-surface-variant)';
    media.style.display = 'flex';
    media.style.alignItems = 'center';
    media.style.justifyContent = 'center';
    media.style.color = 'var(--color-on-surface-variant)';
    media.textContent = '64';
    
    return PlusInterface.createMediaObject({
      media: media,
      heading: 'Media heading',
      body: 'Will you do the same for me? It\'s time to face the music I\'m no longer your muse. Heard it\'s beautiful, be the judge and my girls gonna take a vote. I can feel a phoenix inside of me. Heaven is jealous of our love, angels are crying from up above. Yeah, you take me to utopia.',
      alignment: 'right-center',
    });
  },
};

/**
 * Right Bottom
 * Media object with media on right, content on left, bottom-aligned
 */
export const RightBottom = {
  render: () => {
    const media = document.createElement('div');
    media.style.width = '64px';
    media.style.height = '64px';
    media.style.borderRadius = 'var(--size-element-radius-sm)';
    media.style.backgroundColor = 'var(--color-surface-variant)';
    media.style.display = 'flex';
    media.style.alignItems = 'center';
    media.style.justifyContent = 'center';
    media.style.color = 'var(--color-on-surface-variant)';
    media.textContent = '64';
    
    return PlusInterface.createMediaObject({
      media: media,
      heading: 'Media heading',
      body: 'Will you do the same for me? It\'s time to face the music I\'m no longer your muse. Heard it\'s beautiful, be the judge and my girls gonna take a vote. I can feel a phoenix inside of me. Heaven is jealous of our love, angels are crying from up above. Yeah, you take me to utopia.',
      alignment: 'right-bottom',
    });
  },
};

/**
 * All Variants
 * Shows all media object alignment variants
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    const alignments = [
      { alignment: 'left', label: 'Left (Top-aligned)' },
      { alignment: 'left-center', label: 'Left Center (Vertically centered)' },
      { alignment: 'left-bottom', label: 'Left Bottom (Bottom-aligned)' },
      { alignment: 'right', label: 'Right (Top-aligned)' },
      { alignment: 'right-center', label: 'Right Center (Vertically centered)' },
      { alignment: 'right-bottom', label: 'Right Bottom (Bottom-aligned)' }
    ];
    
    alignments.forEach(({ alignment, label }) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.gap = 'var(--size-element-gap-sm)';
      
      const labelEl = document.createElement('div');
      labelEl.className = 'h6';
      labelEl.textContent = label;
      wrapper.appendChild(labelEl);
      
      const media = document.createElement('div');
      media.style.width = '64px';
      media.style.height = '64px';
      media.style.borderRadius = 'var(--size-element-radius-sm)';
      media.style.backgroundColor = 'var(--color-surface-variant)';
      media.style.display = 'flex';
      media.style.alignItems = 'center';
      media.style.justifyContent = 'center';
      media.style.color = 'var(--color-on-surface-variant)';
      media.textContent = '64';
      
      const mediaObject = PlusInterface.createMediaObject({
        media: media,
        heading: 'Media heading',
        body: 'Will you do the same for me? It\'s time to face the music I\'m no longer your muse.',
        alignment: alignment
      });
      
      wrapper.appendChild(mediaObject);
      container.appendChild(wrapper);
    });
    
    return container;
  },
};

/**
 * Interactive Media Object
 * Interactive playground for testing media object variations
 */
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
