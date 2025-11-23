/**
 * Media Object Molecule Stories
 * 
 * Figma Reference: https://www.figma.com/design/zAecJNRdvJzAUOcjV32tRX/Design-System---BS4?node-id=53-20424&t=XxnevshHwphhdAOI-4
 * 
 * Matches Figma design system specifications exactly
 * 6 variants based on media position alignment
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/MediaObject',
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
