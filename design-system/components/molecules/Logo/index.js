/**
 * @fileoverview Logo component for PLUS design system.
 * Universal element component for displaying PLUS brand logo.
 * Matches Figma design system specifications.
 * 
 * Figma Reference: https://www.figma.com/design/zAecJNRdvJzAUOcjV32tRX/Design-System---BS4?node-id=1133-12915
 */

import { LOGO_STYLES, LOGO_SIZES } from './constants.js';
// Import SCSS for Storybook - styles are also included in main.css for production
import './Logo.scss';

/**
 * Creates a logo element styled according to PLUS design system
 * @param {Object} options - Logo configuration options
 * @param {string} [options.style='colored'] - Logo style ('colored', 'filled', 'outlined')
 * @param {string} [options.size='XS'] - Logo size ('XS', 'S', 'M', 'L', 'XL')
 * @param {boolean} [options.text=false] - Whether to show PLUS wordmark text
 * @param {string} [options.id] - Logo ID
 * @param {Array} [options.classes=[]] - Additional CSS classes
 * @param {Object} [options.styles=null] - Additional inline styles
 * @param {Function} [options.onClick=null] - Click handler function
 * @returns {HTMLElement} Logo element
 */
export function createLogo({
    style = LOGO_STYLES.COLORED,
    size = LOGO_SIZES.XS,
    text = false,
    id = null,
    classes = [],
    styles = null,
    onClick = null
} = {}) {
    // Validate style - ensure it's a valid style value
    const validStyles = [LOGO_STYLES.COLORED, LOGO_STYLES.FILLED, LOGO_STYLES.OUTLINED];
    const logoStyle = validStyles.includes(style) ? style : LOGO_STYLES.COLORED;
    
    // Validate size - ensure it's a valid size value
    const validSizes = [LOGO_SIZES.XS, LOGO_SIZES.S, LOGO_SIZES.M, LOGO_SIZES.L, LOGO_SIZES.XL];
    const logoSize = validSizes.includes(size) ? size : LOGO_SIZES.XS;
    
    // Ensure text is boolean
    const showText = Boolean(text);
    
    // Create logo container
    const logo = document.createElement('div');
    logo.classList.add('plus-logo');
    
    // Apply style class (colored, filled, or outlined)
    logo.classList.add(`plus-logo-${logoStyle}`);
    
    // Apply size class (xs, s, m, l, xl) - convert to lowercase for CSS class
    logo.classList.add(`plus-logo-${logoSize.toLowerCase()}`);
    
    // Set data attribute for text variant styling
    if (showText) {
        logo.setAttribute('data-has-text', 'true');
    }
    
    // Apply custom ID if provided
    if (id) {
        logo.id = id;
    }
    
    // Apply additional classes
    if (classes && classes.length > 0) {
        logo.classList.add(...classes);
    }
    
    // Apply inline styles if provided
    if (styles) {
        Object.assign(logo.style, styles);
    }
    
    // Add click handler if provided
    if (onClick) {
        logo.style.cursor = 'pointer';
        logo.addEventListener('click', onClick);
    }
    
    // Construct image filename based on style, size, and text
    // Images from Figma are SVGs, so we use .svg extension
    const imageName = `logo-${logoStyle}-${logoSize.toLowerCase()}${showText ? '-text' : ''}.svg`;
    // Use /assets/ path for Storybook (staticDirs maps design-system/assets to /assets)
    const imagePath = `/assets/images/logos/${imageName}`;
    
    // Create image element
    const img = document.createElement('img');
    img.src = imagePath;
    img.alt = `PLUS Logo ${logoStyle} ${logoSize}${showText ? ' with text' : ''}`;
    img.classList.add('plus-logo-image');
    img.loading = 'lazy';
    
    // Add error handler with detailed logging
    img.onerror = function() {
        console.error(`Logo image failed to load: ${imagePath}`);
        console.error(`Expected file: design-system/assets/images/logos/${imageName}`);
        console.error(`Current location: ${window.location.href}`);
        // Show placeholder if image fails to load
        this.style.display = 'none';
        const placeholder = document.createElement('div');
        placeholder.className = 'plus-logo-placeholder';
        placeholder.style.width = '100%';
        placeholder.style.height = '100%';
        placeholder.style.minWidth = '40px';
        placeholder.style.minHeight = '40px';
        placeholder.style.backgroundColor = 'var(--color-surface-variant, #e0e0e0)';
        placeholder.style.display = 'flex';
        placeholder.style.alignItems = 'center';
        placeholder.style.justifyContent = 'center';
        placeholder.style.color = 'var(--color-on-surface-variant, #666)';
        placeholder.style.fontSize = '0.75rem';
        placeholder.style.borderRadius = '4px';
        placeholder.textContent = 'Logo';
        placeholder.title = `Missing: ${imageName}`;
        if (this.parentElement) {
            this.parentElement.appendChild(placeholder);
        }
    };
    
    // Add load handler to verify image loaded
    img.onload = function() {
        console.log(`Logo image loaded successfully: ${imagePath}`);
    };
    
    logo.appendChild(img);
    
    return logo;
}

// Export constants for convenience
export { LOGO_STYLES, LOGO_SIZES };

