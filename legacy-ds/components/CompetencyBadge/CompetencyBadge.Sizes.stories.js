/**
 * Competency Badge Size Variants Stories
 * Size variants organized under "Size Variants" subcategory
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/CompetencyBadge/Sizes',
  tags: ['autodocs'],
};

/**
 * Headline Sizes (H1-H6)
 */
export const HeadlineSizes = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.alignItems = 'center';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const sizes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    
    sizes.forEach((size) => {
      const badge = PlusInterface.createCompetencyBadge({
        competencyArea: 'socio-emotional',
        size: size
      });
      container.appendChild(badge);
    });
    
    return container;
  },
};

/**
 * Body Sizes (B1-B3)
 */
export const BodySizes = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.alignItems = 'center';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const sizes = ['b1', 'b2', 'b3'];
    
    sizes.forEach((size) => {
      const badge = PlusInterface.createCompetencyBadge({
        competencyArea: 'socio-emotional',
        size: size
      });
      container.appendChild(badge);
    });
    
    return container;
  },
};

/**
 * All Sizes
 */
export const AllSizes = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.alignItems = 'center';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const sizes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b1', 'b2', 'b3'];
    
    sizes.forEach((size) => {
      const badge = PlusInterface.createCompetencyBadge({
        competencyArea: 'socio-emotional',
        size: size
      });
      container.appendChild(badge);
    });
    
    return container;
  },
};

