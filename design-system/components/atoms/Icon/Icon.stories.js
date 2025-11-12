/**
 * Icon Atom Stories
 * 
 * ## Usage and Implementation
 * 
 * Icons are **Element** components used to provide visual context, represent actions, or convey meaning.
 * They use Font Awesome icons and can be styled with different weights and sizes.
 * 
 * ### When to Use
 * - **Actions**: Represent actions in buttons, menus, or toolbars
 * - **Status**: Indicate status or state (e.g., checkmark, warning, error)
 * - **Navigation**: Guide navigation or indicate direction
 * - **Decorative**: Add visual interest or reinforce meaning
 * - **Information**: Convey information quickly (e.g., info, help, settings)
 * 
 * ### Implementation Context
 * - **Component Type**: Element (uses `element-` tokens)
 * - **Token Usage**: 
 *   - Typography: Uses body typography scales (body1, body2, body3) for sizing
 *   - Colors: Can use semantic color tokens (`--color-primary`, `--color-success`, etc.)
 *   - Spacing: Uses `--size-element-gap-sm/md/lg` when paired with text
 * 
 * ### Visual Style Variants
 * - **Solid (fas)**: Filled icons for emphasis or primary actions
 * - **Regular (far)**: Outlined icons for secondary actions or lighter emphasis
 * 
 * ### Size Variants
 * Icons use typography scales for sizing:
 * - **Body 1**: Larger icons for prominence or accessibility
 * - **Body 2**: Default size for most use cases
 * - **Body 3**: Smaller icons for compact interfaces or secondary elements
 * 
 * ### Best Practices
 * - Use semantic icons that clearly represent their function
 * - Match icon style to action importance (solid for primary, regular for secondary)
 * - Use consistent sizing within a component or section
 * - Ensure sufficient contrast for accessibility
 * - Pair icons with text labels when meaning might be unclear
 * - Use color to reinforce meaning (e.g., green for success, red for error)
 * 
 * See docs/guidelines/terminology.md for Element Component Guidelines
 * See docs/guidelines/token-reference.md for Token Reference
 */

export default {
  title: 'Atoms/Icon',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Icon components using Font Awesome. Supports solid and regular styles with multiple sizes based on typography scales.',
      },
    },
  },
};

/**
 * All Variants
 * Shows all icon combinations organized by visual style: each style shows all sizes
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    const styles = [
      { class: 'fas', label: 'Solid' },
      { class: 'far', label: 'Regular' },
    ];
    
    const sizes = [
      { class: 'body1-txt', label: 'Body 1' },
      { class: 'body2-txt', label: 'Body 2' },
      { class: 'body3-txt', label: 'Body 3' },
    ];
    
    // Organize by visual style - each style shows all sizes
    styles.forEach((style) => {
      const styleSection = document.createElement('div');
      styleSection.style.display = 'flex';
      styleSection.style.flexDirection = 'column';
      styleSection.style.gap = 'var(--size-card-gap-md)';
      
      const styleLabel = document.createElement('div');
      styleLabel.className = 'h6';
      styleLabel.textContent = `${style.label} Style - All Sizes`;
      styleLabel.style.marginBottom = 'var(--size-element-gap-sm)';
      styleSection.appendChild(styleLabel);
      
      const sizesContainer = document.createElement('div');
      sizesContainer.style.display = 'flex';
      sizesContainer.style.alignItems = 'center';
      sizesContainer.style.gap = 'var(--size-section-gap-md)';
      
      sizes.forEach((size) => {
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = 'var(--size-element-gap-sm)';
        
        const icon = document.createElement('i');
        icon.className = `${style.class} fa-star ${size.class}`;
        wrapper.appendChild(icon);
        
        const label = document.createElement('div');
        label.className = 'body3-txt';
        label.textContent = size.label;
        wrapper.appendChild(label);
        
        sizesContainer.appendChild(wrapper);
      });
      
      styleSection.appendChild(sizesContainer);
      container.appendChild(styleSection);
    });
    
    return container;
  },
};

/**
 * Interactive Icon
 * Interactive playground for testing icon variations
 */
export const Interactive = {
  render: (args) => {
    const icon = document.createElement('i');
    icon.className = `${args.style || 'fas'} fa-${args.icon || 'star'} ${args.size || 'body2-txt'}`;
    if (args.color) {
      icon.style.color = args.color;
    }
    return icon;
  },
  argTypes: {
    icon: {
      control: 'text',
      description: 'Icon name (without fa- prefix)',
    },
    style: {
      control: 'select',
      options: ['fas', 'far'],
      description: 'Icon style (solid or regular)',
    },
    size: {
      control: 'select',
      options: ['body1-txt', 'body2-txt', 'body3-txt'],
      description: 'Icon size class',
    },
    color: {
      control: 'color',
      description: 'Icon color',
    },
  },
  args: {
    icon: 'star',
    style: 'fas',
    size: 'body2-txt',
    color: '',
  },
};

