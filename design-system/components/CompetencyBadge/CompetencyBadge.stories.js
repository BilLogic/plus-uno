/**
 * Competency Badge Stories
 * 
 * ## Usage and Implementation
 * 
 * Competency badges are **Element** components used to display SMART competency area labels.
 * They provide visual context for competency categorization with a circular icon and text label.
 * 
 * ### When to Use
 * - **SMART competency areas**: Display competency area labels (Social-Emotional Learning, Mastering Content, Advocacy, Relationships, Technology Tools)
 * - **Competency categorization**: Tag content with competency areas
 * - **Visual hierarchy**: Use different sizes to match typography hierarchy
 * 
 * ### Implementation Context
 * - **Component Type**: Element (uses `element-` tokens)
 * - **Token Usage**: 
 *   - Padding: `--size-element-pad-x-sm/md/lg`
 *   - Gap: `--size-element-gap-sm/md/lg`
 *   - Radius: `--size-border-radius-radius-1000` (pill shape) or `--size-border-radius-radius-400` (for B3 technology-tools)
 *   - Colors: SMART competency area color tokens (state-layer-08 for background, main color for icon, text color for text)
 *   - Typography: Uses headline (h1-h6) or body (b1-b3) typography scales
 * 
 * ### Competency Area Variants
 * - **Social-Emotional Learning**: Brown/gold theme
 * - **Mastering Content**: Purple theme
 * - **Advocacy**: Green theme
 * - **Relationships**: Pink/magenta theme
 * - **Technology Tools**: Blue theme
 * 
 * ### Size Variants
 * Competency badges use typography scales for sizing:
 * - **Headline sizes** (h1-h6): For prominent badges or when matching headline text
 * - **Body sizes** (b1-b3): For standard badges
 * 
 * ### Best Practices
 * - Use appropriate size to match surrounding text hierarchy
 * - Each competency area has distinct colors for easy recognition
 * - Icon and text colors match the competency area theme
 * - Background uses state-layer-08 for subtle appearance
 * 
 * See design-system/components/overview.md for Element Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/CompetencyBadge',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Competency badge component for displaying SMART competency area labels. Supports all five competency areas with distinct color themes and typography-based sizes. Uses element-level tokens and pill-shaped border radius.',
      },
    },
  },
};

/**
 * Overview
 * Shows all competency badge combinations organized by competency area: each area shows all sizes
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    const competencyAreas = [
      { key: 'socio-emotional', label: 'Social-Emotional Learning' },
      { key: 'mastering-content', label: 'Mastering Content' },
      { key: 'advocacy', label: 'Advocacy' },
      { key: 'relationships', label: 'Relationships' },
      { key: 'technology-tools', label: 'Technology Tools' }
    ];
    const sizes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b1', 'b2', 'b3'];
    
    // Organize by competency area - each area shows all sizes
    competencyAreas.forEach((area) => {
      const areaSection = document.createElement('div');
      areaSection.style.display = 'flex';
      areaSection.style.flexDirection = 'column';
      areaSection.style.gap = 'var(--size-card-gap-md)';
      
      const areaLabel = document.createElement('div');
      areaLabel.className = 'h6';
      areaLabel.textContent = `${area.label} - All Sizes`;
      areaLabel.style.marginBottom = 'var(--size-element-gap-sm)';
      areaSection.appendChild(areaLabel);
      
      const sizesContainer = document.createElement('div');
      sizesContainer.style.display = 'flex';
      sizesContainer.style.flexDirection = 'column';
      sizesContainer.style.alignItems = 'flex-start'; // Prevent badges from stretching full width
      sizesContainer.style.gap = 'var(--size-element-gap-sm)';
      
      sizes.forEach((size) => {
        const badge = PlusInterface.createCompetencyBadge({
          competencyArea: area.key,
          size: size
        });
        sizesContainer.appendChild(badge);
      });
      
      areaSection.appendChild(sizesContainer);
      container.appendChild(areaSection);
    });
    
    return container;
  },
};

/**
 * Interactive Competency Badge
 * Interactive playground for testing competency badge variations
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    const badge = PlusInterface.createCompetencyBadge(args);
    container.appendChild(badge);
    return container;
  },
  argTypes: {
    competencyArea: {
      control: 'select',
      options: ['socio-emotional', 'mastering-content', 'advocacy', 'relationships', 'technology-tools'],
      description: 'SMART competency area',
    },
    size: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b1', 'b2', 'b3'],
      description: 'Badge size',
    },
  },
  args: {
    competencyArea: 'socio-emotional',
    size: 'h2',
  },
};


