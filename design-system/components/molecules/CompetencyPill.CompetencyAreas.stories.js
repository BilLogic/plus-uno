/**
 * Competency Pill Competency Areas Stories
 * Competency area variants organized under "Competency Areas" subcategory
 */

import { PlusSmartComponents } from '../index.js';

export default {
  title: 'Molecules/CompetencyPill/Competency Areas',
  tags: ['autodocs'],
};

/**
 * Social-Emotional
 */
export const SocialEmotional = {
  render: () => {
    const container = document.createElement('div');
    const pill = PlusSmartComponents.createSuperCompPillDiv('Social-Emotional', false);
    container.appendChild(pill);
    return container;
  },
};

/**
 * Mastering Content
 */
export const MasteringContent = {
  render: () => {
    const container = document.createElement('div');
    const pill = PlusSmartComponents.createSuperCompPillDiv('Mastering Content', false);
    container.appendChild(pill);
    return container;
  },
};

/**
 * Advocacy
 */
export const Advocacy = {
  render: () => {
    const container = document.createElement('div');
    const pill = PlusSmartComponents.createSuperCompPillDiv('Advocacy', false);
    container.appendChild(pill);
    return container;
  },
};

/**
 * Relationships
 */
export const Relationships = {
  render: () => {
    const container = document.createElement('div');
    const pill = PlusSmartComponents.createSuperCompPillDiv('Relationships', false);
    container.appendChild(pill);
    return container;
  },
};

/**
 * Technology Tools
 */
export const TechnologyTools = {
  render: () => {
    const container = document.createElement('div');
    const pill = PlusSmartComponents.createSuperCompPillDiv('Technology Tools', false);
    container.appendChild(pill);
    return container;
  },
};

