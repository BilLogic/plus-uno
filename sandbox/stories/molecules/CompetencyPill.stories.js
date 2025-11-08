/**
 * Competency Pill Molecule Stories
 * Competency area pill (text + styling container)
 */

import { PlusSmartComponents } from '@/js/components/index.js';

export default {
  title: 'Molecules/CompetencyPill',
  tags: ['autodocs'],
  argTypes: {
    competencyArea: {
      control: 'select',
      options: [
        'Social-Emotional',
        'Mastering Content',
        'Advocacy',
        'Relationships',
        'Technology Tools',
      ],
      description: 'Competency area',
    },
    abbreviate: {
      control: 'boolean',
      description: 'Abbreviate text',
    },
  },
};

/**
 * Competency Pill - Social-Emotional
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
 * Competency Pill - Mastering Content
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
 * Competency Pill - Advocacy
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
 * Competency Pill - Relationships
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
 * Competency Pill - Technology Tools
 */
export const TechnologyTools = {
  render: () => {
    const container = document.createElement('div');
    const pill = PlusSmartComponents.createSuperCompPillDiv('Technology Tools', false);
    container.appendChild(pill);
    return container;
  },
};

/**
 * All Competency Pills - Full Text
 */
export const AllPillsFullText = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = '1rem';
    
    const competencyAreas = [
      'Social-Emotional',
      'Mastering Content',
      'Advocacy',
      'Relationships',
      'Technology Tools',
    ];
    
    competencyAreas.forEach((area) => {
      const pill = PlusSmartComponents.createSuperCompPillDiv(area, false);
      container.appendChild(pill);
    });
    
    return container;
  },
};

/**
 * All Competency Pills - Abbreviated
 */
export const AllPillsAbbreviated = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = '1rem';
    
    const competencyAreas = [
      'Social-Emotional',
      'Mastering Content',
      'Advocacy',
      'Relationships',
      'Technology Tools',
    ];
    
    competencyAreas.forEach((area) => {
      const pill = PlusSmartComponents.createSuperCompPillDiv(area, true);
      container.appendChild(pill);
    });
    
    return container;
  },
};

/**
 * Interactive Competency Pill
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    const pill = PlusSmartComponents.createSuperCompPillDiv(args.competencyArea, args.abbreviate);
    container.appendChild(pill);
    return container;
  },
  args: {
    competencyArea: 'Social-Emotional',
    abbreviate: false,
  },
};

