/**
 * Badge Molecule Stories
 * 
 * ## Usage and Implementation
 * 
 * Badges are **Element** components used to display labels, tags, or status indicators.
 * They provide visual context and categorization for content, often appearing inline with text or attached to other components.
 * 
 * ### When to Use
 * - **Labels**: Display category labels, tags, or metadata
 * - **Status indicators**: Show status or state information (e.g., "New", "Active", "Pending")
 * - **Counts**: Display numeric counts or quantities (e.g., notification counts, item counts)
 * - **Categorization**: Tag content with categories or classifications
 * - **SMART competency areas**: Use extended colors for SMART competency area badges
 * 
 * ### When NOT to Use
 * - **Removable tags**: Use chips for tags that can be removed by the user
 * - **User selections**: Use chips for selected items that can be deselected
 * - **Input values**: Use chips for entered values that can be removed
 * 
 * ### Implementation Context
 * - **Component Type**: Element (uses `element-` tokens)
 * - **Token Usage**: 
 *   - Padding: `--size-element-pad-x-sm/md/lg`, `--size-element-pad-y-sm/md/lg`
 *   - Radius: `--size-border-radius-radius-1000` (pill shape)
 *   - Colors: `--color-primary`, `--color-secondary`, `--color-success`, `--color-danger`, etc.
 *   - Typography: Uses headline (h1-h6) or body (b1-b3) typography scales
 * 
 * ### Visual Style Variants
 * - **Primary**: Default brand color for general labels
 * - **Secondary**: Secondary brand color for alternative labels
 * - **Tertiary**: Tertiary brand color for additional labels
 * - **Success**: Green for positive states or confirmations
 * - **Danger**: Red for warnings, errors, or critical states
 * - **Warning**: Yellow/orange for cautionary states
 * 
 * ### Size Variants
 * Badges use typography scales for sizing:
 * - **Headline sizes** (h1-h6): For prominent badges or when matching headline text
 * - **Body sizes** (b1-b3): For standard badges, with b2 as the default
 * 
 * ### Best Practices
 * - Use semantic color styles (success for positive, danger for negative)
 * - Match badge size to surrounding text hierarchy
 * - Keep badge text concise (1-3 words typically)
 * - Use pill shape (border-radius-1000) for rounded appearance
 * - Ensure sufficient contrast for accessibility
 * - Use badges for static labels, chips for removable content
 * 
 * See design-system/components/overview.md for Element Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Badge',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Badge component for labels, tags, and status indicators. Supports multiple styles and typography-based sizes. Uses element-level tokens and pill-shaped border radius. For removable tags and selections, use the Chip component instead.',
      },
    },
  },
};

/**
 * All Variants
 * Shows all badge combinations organized by visual style: each style shows all sizes
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    const styles = ['primary', 'secondary', 'tertiary', 'success', 'danger', 'warning'];
    const sizes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b1', 'b2', 'b3'];
    
    // Organize by visual style - each style shows all sizes
    styles.forEach((style) => {
      const styleSection = document.createElement('div');
      styleSection.style.display = 'flex';
      styleSection.style.flexDirection = 'column';
      styleSection.style.gap = 'var(--size-card-gap-md)';
      
      const styleLabel = document.createElement('div');
      styleLabel.className = 'h6';
      styleLabel.textContent = `${style.charAt(0).toUpperCase() + style.slice(1)} Style - All Sizes`;
      styleLabel.style.marginBottom = 'var(--size-element-gap-sm)';
      styleSection.appendChild(styleLabel);
      
      const sizesContainer = document.createElement('div');
      sizesContainer.style.display = 'flex';
      sizesContainer.style.flexDirection = 'column';
      sizesContainer.style.alignItems = 'flex-start'; // Prevent badges from stretching full width
      sizesContainer.style.gap = 'var(--size-element-gap-sm)';
      
      sizes.forEach((size) => {
        const badge = PlusInterface.createBadge({
          text: `${style.charAt(0).toUpperCase() + style.slice(1)} ${size.toUpperCase()}`,
          style: style,
          size: size
        });
        sizesContainer.appendChild(badge);
      });
      
      styleSection.appendChild(sizesContainer);
      container.appendChild(styleSection);
    });
    
    return container;
  },
};


/**
 * Interactive Badge
 * Interactive playground for testing badge variations
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    const badge = PlusInterface.createBadge(args);
    container.appendChild(badge);
    return container;
  },
  argTypes: {
    text: {
      control: 'text',
      description: 'Badge text',
    },
    style: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'success', 'danger', 'warning'],
      description: 'Badge style',
    },
    size: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b1', 'b2', 'b3'],
      description: 'Badge size',
    },
  },
  args: {
    text: 'Badge',
    style: 'primary',
    size: 'b2',
  },
};

