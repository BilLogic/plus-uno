/**
 * @fileoverview Logo component for PLUS design system.
 * Asset component for displaying PLUS brand logo using inline SVG.
 * Matches Figma design system specifications exactly.
 * 
 * Figma Reference: https://www.figma.com/design/zAecJNRdvJzAUOcjV32tRX/Design-System---BS4?node-id=1133-12915
 */

import { LOGO_STYLES, LOGO_SIZES } from './constants.js';
import { getColoredIconSVG, getFilledIconSVG, getOutlinedIconSVG, getTextWordmarkSVG } from './svg-templates.js';
// Import SCSS for Storybook - styles are also included in main.css for production
import './Logo.scss';

/**
 * Creates a logo element styled according to PLUS design system
 * Uses inline SVG based on Figma specifications
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
    
    // Create logo container for the icon
    const logoContainer = document.createElement('div');
    logoContainer.classList.add('plus-logo-container');
    logoContainer.setAttribute('data-name', 'Logo Container');
    
    // Get the appropriate icon SVG based on style
    let iconSVG;
    if (logoStyle === LOGO_STYLES.COLORED) {
        iconSVG = getColoredIconSVG(logoSize);
    } else if (logoStyle === LOGO_STYLES.FILLED) {
        iconSVG = getFilledIconSVG(logoSize);
    } else if (logoStyle === LOGO_STYLES.OUTLINED) {
        iconSVG = getOutlinedIconSVG(logoSize);
    } else {
        // Fallback to colored
        iconSVG = getColoredIconSVG(logoSize);
    }
    
    const iconContainer = document.createElement('div');
    iconContainer.classList.add('plus-logo-icon');
    iconContainer.innerHTML = iconSVG;
    logoContainer.appendChild(iconContainer);
    
    logo.appendChild(logoContainer);
    
    // For text variants, add text wordmark
    if (showText) {
        const textContainer = document.createElement('div');
        textContainer.classList.add('plus-logo-text');
        textContainer.setAttribute('data-name', 'Text');
        
        const textSVG = getTextWordmarkSVG(logoSize, logoStyle);
        textContainer.innerHTML = textSVG;
        
        logo.appendChild(textContainer);
    }
    
    return logo;
}

// Export constants for convenience
export { LOGO_STYLES, LOGO_SIZES };
