/**
 * Competency Pill Molecule Stories
 * Competency area pill (text + styling container)
 */

import { PlusSmartComponents } from '@/js/components/index.js';

export default {
  title: 'Molecules/CompetencyPill',
  tags: ['autodocs'],
};

/**
 * All Variants
 * Shows all competency pill variants
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = 'var(--size-card-gap-md)';
    
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
 * Interactive Competency Pill
 * Interactive playground for testing competency pill variations
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    const pill = PlusSmartComponents.createSuperCompPillDiv(args.competencyArea, args.abbreviate);
    container.appendChild(pill);
    return container;
  },
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
  args: {
    competencyArea: 'Social-Emotional',
    abbreviate: false,
  },
};
