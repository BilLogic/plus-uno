/**
 * Button Fill Variants Stories
 * 
 * Shows all 4 button fill types (Filled, Tonal, Outlined, Text) with their available styles.
 * This is the primary organization dimension - each fill type has different style options.
 * 
 * ## Fill Types
 * - **Filled**: Solid background with high contrast text (4 styles: primary, secondary, tertiary, default)
 * - **Tonal**: Light background with colored text (4 styles: primary, secondary, tertiary, default)
 * - **Outlined**: Transparent background with border (8 styles: primary, secondary, tertiary, default, danger, warning, success, info)
 * - **Text**: No background or border, colored text only (8 styles: primary, secondary, tertiary, default, danger, warning, success, info)
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Button/Fill',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Button fill variants are the primary visual distinction. Each fill type supports different style (color) options.',
      },
    },
  },
};

/**
 * Filled Buttons
 * Solid background buttons with 4 available styles
 */
export const Filled = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    const styles = ['primary', 'secondary', 'tertiary', 'default'];
    const sizes = ['small', 'default', 'large'];
    
    // Show all styles × all sizes
    styles.forEach((style) => {
      const styleSection = document.createElement('div');
      styleSection.style.display = 'flex';
      styleSection.style.flexDirection = 'column';
      styleSection.style.gap = 'var(--size-card-gap-md)';
      
      const styleLabel = document.createElement('div');
      styleLabel.className = 'h6';
      styleLabel.textContent = `Filled ${style.charAt(0).toUpperCase() + style.slice(1)} - All Sizes`;
      styleLabel.style.marginBottom = 'var(--size-element-gap-sm)';
      styleSection.appendChild(styleLabel);
      
      const sizesRow = document.createElement('div');
      sizesRow.style.display = 'flex';
      sizesRow.style.flexWrap = 'wrap';
      sizesRow.style.alignItems = 'center';
      sizesRow.style.gap = 'var(--size-card-gap-md)';
      
      sizes.forEach((size) => {
        const button = PlusInterface.createButton({
          btnText: `${style} ${size}`,
          btnStyle: style,
          btnFill: 'filled',
          btnSize: size,
        });
        sizesRow.appendChild(button);
      });
      
      styleSection.appendChild(sizesRow);
      container.appendChild(styleSection);
    });
    
    return container;
  },
};

/**
 * Tonal Buttons
 * Light background buttons with 4 available styles
 */
export const Tonal = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    const styles = ['primary', 'secondary', 'tertiary', 'default'];
    const sizes = ['small', 'default', 'large'];
    
    // Show all styles × all sizes
    styles.forEach((style) => {
      const styleSection = document.createElement('div');
      styleSection.style.display = 'flex';
      styleSection.style.flexDirection = 'column';
      styleSection.style.gap = 'var(--size-card-gap-md)';
      
      const styleLabel = document.createElement('div');
      styleLabel.className = 'h6';
      styleLabel.textContent = `Tonal ${style.charAt(0).toUpperCase() + style.slice(1)} - All Sizes`;
      styleLabel.style.marginBottom = 'var(--size-element-gap-sm)';
      styleSection.appendChild(styleLabel);
      
      const sizesRow = document.createElement('div');
      sizesRow.style.display = 'flex';
      sizesRow.style.flexWrap = 'wrap';
      sizesRow.style.alignItems = 'center';
      sizesRow.style.gap = 'var(--size-card-gap-md)';
      
      sizes.forEach((size) => {
        const button = PlusInterface.createButton({
          btnText: `${style} ${size}`,
          btnStyle: style,
          btnFill: 'tonal',
          btnSize: size,
        });
        sizesRow.appendChild(button);
      });
      
      styleSection.appendChild(sizesRow);
      container.appendChild(styleSection);
    });
    
    return container;
  },
};

/**
 * Outlined Buttons
 * Border-only buttons with 8 available styles
 */
export const Outlined = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    const styles = ['primary', 'secondary', 'tertiary', 'default', 'danger', 'warning', 'success', 'info'];
    const sizes = ['small', 'default', 'large'];
    
    // Show all styles × all sizes
    styles.forEach((style) => {
      const styleSection = document.createElement('div');
      styleSection.style.display = 'flex';
      styleSection.style.flexDirection = 'column';
      styleSection.style.gap = 'var(--size-card-gap-md)';
      
      const styleLabel = document.createElement('div');
      styleLabel.className = 'h6';
      styleLabel.textContent = `Outlined ${style.charAt(0).toUpperCase() + style.slice(1)} - All Sizes`;
      styleLabel.style.marginBottom = 'var(--size-element-gap-sm)';
      styleSection.appendChild(styleLabel);
      
      const sizesRow = document.createElement('div');
      sizesRow.style.display = 'flex';
      sizesRow.style.flexWrap = 'wrap';
      sizesRow.style.alignItems = 'center';
      sizesRow.style.gap = 'var(--size-card-gap-md)';
      
      sizes.forEach((size) => {
        const button = PlusInterface.createButton({
          btnText: `${style} ${size}`,
          btnStyle: style,
          btnFill: 'outline',
          btnSize: size,
        });
        sizesRow.appendChild(button);
      });
      
      styleSection.appendChild(sizesRow);
      container.appendChild(styleSection);
    });
    
    return container;
  },
};

/**
 * Text Buttons
 * Text-only buttons with 8 available styles
 */
export const Text = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    const styles = ['primary', 'secondary', 'tertiary', 'default', 'danger', 'warning', 'success', 'info'];
    const sizes = ['small', 'default', 'large'];
    
    // Show all styles × all sizes
    styles.forEach((style) => {
      const styleSection = document.createElement('div');
      styleSection.style.display = 'flex';
      styleSection.style.flexDirection = 'column';
      styleSection.style.gap = 'var(--size-card-gap-md)';
      
      const styleLabel = document.createElement('div');
      styleLabel.className = 'h6';
      styleLabel.textContent = `Text ${style.charAt(0).toUpperCase() + style.slice(1)} - All Sizes`;
      styleLabel.style.marginBottom = 'var(--size-element-gap-sm)';
      styleSection.appendChild(styleLabel);
      
      const sizesRow = document.createElement('div');
      sizesRow.style.display = 'flex';
      sizesRow.style.flexWrap = 'wrap';
      sizesRow.style.alignItems = 'center';
      sizesRow.style.gap = 'var(--size-card-gap-md)';
      
      sizes.forEach((size) => {
        const button = PlusInterface.createButton({
          btnText: `${style} ${size}`,
          btnStyle: style,
          btnFill: 'text',
          btnSize: size,
        });
        sizesRow.appendChild(button);
      });
      
      styleSection.appendChild(sizesRow);
      container.appendChild(styleSection);
    });
    
    return container;
  },
};

/**
 * All Fill Types Comparison
 * Side-by-side comparison of all 4 fill types
 */
export const AllFillTypes = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    const fills = [
      { name: 'Filled', fill: 'filled', styles: ['primary', 'secondary', 'tertiary', 'default'] },
      { name: 'Tonal', fill: 'tonal', styles: ['primary', 'secondary', 'tertiary', 'default'] },
      { name: 'Outlined', fill: 'outline', styles: ['primary', 'secondary', 'tertiary', 'default', 'danger', 'warning', 'success', 'info'] },
      { name: 'Text', fill: 'text', styles: ['primary', 'secondary', 'tertiary', 'default', 'danger', 'warning', 'success', 'info'] },
    ];
    
    fills.forEach((fillType) => {
      const fillSection = document.createElement('div');
      fillSection.style.display = 'flex';
      fillSection.style.flexDirection = 'column';
      fillSection.style.gap = 'var(--size-card-gap-md)';
      
      const fillLabel = document.createElement('div');
      fillLabel.className = 'h5';
      fillLabel.textContent = `${fillType.name} Buttons (${fillType.styles.length} styles available)`;
      fillLabel.style.marginBottom = 'var(--size-element-gap-sm)';
      fillSection.appendChild(fillLabel);
      
      const stylesRow = document.createElement('div');
      stylesRow.style.display = 'flex';
      stylesRow.style.flexWrap = 'wrap';
      stylesRow.style.alignItems = 'center';
      stylesRow.style.gap = 'var(--size-card-gap-md)';
      
      fillType.styles.forEach((style) => {
        const button = PlusInterface.createButton({
          btnText: style,
          btnStyle: style,
          btnFill: fillType.fill,
          btnSize: 'default',
        });
        stylesRow.appendChild(button);
      });
      
      fillSection.appendChild(stylesRow);
      container.appendChild(fillSection);
    });
    
    return container;
  },
};

