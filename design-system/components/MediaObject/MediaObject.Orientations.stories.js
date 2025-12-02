/**
 * Media Object Orientation Variants Stories
 * Orientation variants for media object elements
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/MediaObject/Orientations',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Media object orientation variants: left, left-center, left-bottom, right, right-center, and right-bottom.',
      },
    },
  },
};

/**
 * Left
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
 * All Orientations
 */
export const AllOrientations = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    const alignments = [
      { alignment: 'left', label: 'Left' },
      { alignment: 'left-center', label: 'Left Center' },
      { alignment: 'left-bottom', label: 'Left Bottom' },
      { alignment: 'right', label: 'Right' },
      { alignment: 'right-center', label: 'Right Center' },
      { alignment: 'right-bottom', label: 'Right Bottom' }
    ];
    
    alignments.forEach(({ alignment, label }) => {
      const labelEl = document.createElement('div');
      labelEl.className = 'h6';
      labelEl.textContent = label;
      labelEl.style.marginBottom = 'var(--size-element-gap-sm)';
      container.appendChild(labelEl);
      
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
        body: 'Will you do the same for me? It\'s time to face the music.',
        alignment: alignment,
      });
      container.appendChild(mediaObject);
    });
    
    return container;
  },
};


