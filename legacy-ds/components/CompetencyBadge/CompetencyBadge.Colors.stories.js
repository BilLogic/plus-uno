import { PlusInterface } from "../index.js";

export default {
  title: 'Components/CompetencyBadge/Colors',
  tags: ['autodocs'],
};

/**
 * Individual competency area variant pages - keep size constant (h2)
 */

export const SocialEmotional = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const badge = PlusInterface.createCompetencyBadge({
      competencyArea: 'socio-emotional',
      size: 'h2',
    });
    
    container.appendChild(badge);
    return container;
  },
};

export const MasteringContent = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const badge = PlusInterface.createCompetencyBadge({
      competencyArea: 'mastering-content',
      size: 'h2',
    });
    
    container.appendChild(badge);
    return container;
  },
};

export const Advocacy = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const badge = PlusInterface.createCompetencyBadge({
      competencyArea: 'advocacy',
      size: 'h2',
    });
    
    container.appendChild(badge);
    return container;
  },
};

export const Relationships = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const badge = PlusInterface.createCompetencyBadge({
      competencyArea: 'relationships',
      size: 'h2',
    });
    
    container.appendChild(badge);
    return container;
  },
};

export const TechnologyTools = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const badge = PlusInterface.createCompetencyBadge({
      competencyArea: 'technology-tools',
      size: 'h2',
    });
    
    container.appendChild(badge);
    return container;
  },
};

/**
 * All Colors
 * Shows all competency area variants together for comparison
 */
export const AllColors = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.flexWrap = 'wrap';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const competencyAreas = [
      'socio-emotional',
      'mastering-content',
      'advocacy',
      'relationships',
      'technology-tools'
    ];
    
    competencyAreas.forEach((area) => {
      const badge = PlusInterface.createCompetencyBadge({
        competencyArea: area,
        size: 'h2',
      });
      container.appendChild(badge);
    });
    
    return container;
  },
};

