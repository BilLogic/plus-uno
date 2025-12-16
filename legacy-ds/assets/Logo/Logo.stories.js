/**
 * Logo Molecule Stories
 * 
 * ## Usage and Implementation
 * 
 * Logos are **Asset** components used to display the PLUS brand identity.
 * They provide consistent branding across the application with multiple styles and sizes.
 * 
 * ### When to Use
 * - **Brand identity**: Display PLUS logo for brand recognition
 * - **Navigation**: Use in headers, sidebars, or navigation bars
 * - **Marketing materials**: Include in marketing pages or promotional content
 * - **Documentation**: Show in documentation or help sections
 * 
 * ### Implementation Context
 * - **Component Type**: Asset (brand identity component)
 * - **Token Usage**: 
 *   - Uses specific pixel values for sizes (XS=40px, S=64px, M=92px, L=144px, XL=160px)
 *   - Padding and gap values match Figma specifications exactly
 *   - Border radius varies by size (4px for XS/L/XL, smaller for S/M)
 * 
 * ### Visual Style Variants
 * - **Colored**: Gradient-filled logo with colored background (default brand style)
 * - **Filled**: Solid white logo with dark plus sign (for dark backgrounds)
 * - **Outlined**: White outline logo with dark plus sign (for dark backgrounds, minimal style)
 * 
 * ### Size Variants
 * - **XS**: 40px - Smallest size for compact spaces
 * - **S**: 64px - Small size for headers or compact navigation
 * - **M**: 92px - Medium size for standard use
 * - **L**: 144px - Large size for prominent placement
 * - **XL**: 160px - Extra large size for hero sections or marketing
 * 
 * ### Text Variants
 * - **Without Text**: Icon only (square logo)
 * - **With Text**: Icon + "PLUS" wordmark (horizontal layout)
 * 
 * ### Best Practices
 * - Use colored style for light backgrounds
 * - Use filled or outlined style for dark backgrounds
 * - Match logo size to surrounding content hierarchy
 * - Use text variant when brand recognition is important
 * - Use icon-only variant when space is limited
 * - Ensure sufficient contrast for accessibility
 * 
 * See design-system/components/overview.md for Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 * 
 * Figma Reference: https://www.figma.com/design/zAecJNRdvJzAUOcjV32tRX/Design-System---BS4?node-id=1133-12915
 */

import { PlusInterface } from '../../components/index.js';

export default {
  title: 'Assets/Logo',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'PLUS brand logo component with multiple styles (colored, filled, outlined), sizes (XS, S, M, L, XL), and optional text wordmark. Matches Figma design system specifications exactly.',
      },
    },
  },
};

/**
 * All Variants
 * Shows all logo combinations: 3 styles × 5 sizes × 2 text states = 30 variants
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1400px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'All Logo Variants';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const styles = ['colored', 'filled', 'outlined'];
    const sizes = ['XS', 'S', 'M', 'L', 'XL'];
    const textStates = [false, true];
    
    styles.forEach((style) => {
      const styleSection = document.createElement('div');
      styleSection.style.marginBottom = 'var(--size-section-pad-y-lg)';
      
      const styleTitle = document.createElement('h3');
      styleTitle.className = 'h3';
      styleTitle.textContent = `${style.charAt(0).toUpperCase() + style.slice(1)} Style`;
      styleTitle.style.marginBottom = 'var(--size-card-gap-md)';
      styleSection.appendChild(styleTitle);
      
      const styleGrid = document.createElement('div');
      styleGrid.style.display = 'grid';
      // Use auto-fit grid so that each style renders in 2–3 rows at common widths
      styleGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(96px, 1fr))';
      styleGrid.style.gap = 'var(--size-card-gap-md)';
      styleGrid.style.alignItems = 'center';
      styleGrid.style.justifyItems = 'center';
      styleGrid.style.padding = 'var(--size-card-pad-y-md)';
      styleGrid.style.backgroundColor = 'var(--color-surface-container-low)';
      styleGrid.style.borderRadius = 'var(--size-card-radius-sm)';
      
      sizes.forEach((size) => {
        textStates.forEach((text) => {
          const logo = PlusInterface.createLogo({
            style: style,
            size: size,
            text: text
          });
          styleGrid.appendChild(logo);
        });
      });
      
      styleSection.appendChild(styleGrid);
      container.appendChild(styleSection);
    });
    
    return container;
  },
};

/**
 * Style Variants
 * Shows all 3 styles side-by-side for each size
 */
export const StyleVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1400px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Style Variants';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const sizes = ['XS', 'S', 'M', 'L', 'XL'];
    const textStates = [false, true];
    
    textStates.forEach((text) => {
      const textSection = document.createElement('div');
      textSection.style.marginBottom = 'var(--size-section-pad-y-lg)';
      
      const textTitle = document.createElement('h3');
      textTitle.className = 'h3';
      textTitle.textContent = text ? 'With Text' : 'Without Text';
      textTitle.style.marginBottom = 'var(--size-card-gap-md)';
      textSection.appendChild(textTitle);
      
      sizes.forEach((size) => {
        const sizeSection = document.createElement('div');
        sizeSection.style.marginBottom = 'var(--size-card-gap-lg)';
        
        const sizeTitle = document.createElement('h4');
        sizeTitle.className = 'h4';
        sizeTitle.textContent = `Size ${size}`;
        sizeTitle.style.marginBottom = 'var(--size-element-gap-md)';
        sizeSection.appendChild(sizeTitle);
        
        const styleGrid = document.createElement('div');
        styleGrid.style.display = 'flex';
        styleGrid.style.gap = 'var(--size-card-gap-lg)';
        styleGrid.style.alignItems = 'center';
        styleGrid.style.flexWrap = 'wrap';
        styleGrid.style.padding = 'var(--size-card-pad-y-md)';
        styleGrid.style.backgroundColor = 'var(--color-surface-container-low)';
        styleGrid.style.borderRadius = 'var(--size-card-radius-sm)';
        
        ['colored', 'filled', 'outlined'].forEach((style) => {
          const logo = PlusInterface.createLogo({
            style: style,
            size: size,
            text: text
          });
          styleGrid.appendChild(logo);
        });
        
        sizeSection.appendChild(styleGrid);
        textSection.appendChild(sizeSection);
      });
      
      container.appendChild(textSection);
    });
    
    return container;
  },
};

/**
 * Size Variants
 * Shows all 5 sizes for each style
 */
export const SizeVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1400px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h2');
    title.className = 'h2';
    title.textContent = 'Size Variants';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const styles = ['colored', 'filled', 'outlined'];
    const textStates = [false, true];
    
    styles.forEach((style) => {
      textStates.forEach((text) => {
        const variantSection = document.createElement('div');
        variantSection.style.marginBottom = 'var(--size-section-pad-y-lg)';
        
        const variantTitle = document.createElement('h3');
        variantTitle.className = 'h3';
        variantTitle.textContent = `${style.charAt(0).toUpperCase() + style.slice(1)} Style - ${text ? 'With Text' : 'Without Text'}`;
        variantTitle.style.marginBottom = 'var(--size-card-gap-md)';
        variantSection.appendChild(variantTitle);
        
        const sizeGrid = document.createElement('div');
        sizeGrid.style.display = 'flex';
        sizeGrid.style.gap = 'var(--size-card-gap-lg)';
        sizeGrid.style.alignItems = 'center';
        sizeGrid.style.flexWrap = 'wrap';
        sizeGrid.style.padding = 'var(--size-card-pad-y-md)';
        sizeGrid.style.backgroundColor = 'var(--color-surface-container-low)';
        sizeGrid.style.borderRadius = 'var(--size-card-radius-sm)';
        
        ['XS', 'S', 'M', 'L', 'XL'].forEach((size) => {
          const logo = PlusInterface.createLogo({
            style: style,
            size: size,
            text: text
          });
          sizeGrid.appendChild(logo);
        });
        
        variantSection.appendChild(sizeGrid);
        container.appendChild(variantSection);
      });
    });
    
    return container;
  },
};

