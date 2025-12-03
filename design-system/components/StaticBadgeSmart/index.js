/**
 * @fileoverview Static Badge SMART component for PLUS design system.
 * Universal element component for SMART competency area badges.
 * Matches Figma design system specifications.
 * 
 * Figma: node-id 956-256793
 */

import { SMART_CONSTANTS } from '../constants.js';

/**
 * Creates a static badge SMART component
 * @param {Object} options - Badge configuration
 * @param {string} options.type - SMART competency area type (socio-emotional, mastering-content, advocacy, relationships, technology-tools)
 * @param {string} [options.size='h1'] - Badge size (h1, h2, h3, h4, h5, h6, b1, b2, b3)
 * @param {string} [options.id] - Badge ID
 * @param {Array} [options.classes] - Additional CSS classes
 * @returns {HTMLElement} Static badge SMART element
 */
export function createStaticBadgeSmart({
    type,
    size = 'h1',
    id = null,
    classes = []
}) {
    // Normalize type name (handle spaces and dashes)
    const normalizedType = type.replace(/\s+/g, '-').toLowerCase();
    
    // Map type to display text
    const textMap = {
        'socio-emotional': SMART_CONSTANTS.CA_SE_FULL,
        'mastering-content': SMART_CONSTANTS.CA_MC,
        'advocacy': SMART_CONSTANTS.CA_ADV,
        'relationships': SMART_CONSTANTS.CA_RELN,
        'technology-tools': SMART_CONSTANTS.CA_TT
    };
    
    const displayText = textMap[normalizedType] || SMART_CONSTANTS.CA_SE_FULL;
    
    // Map type to color tokens
    const colorMap = {
        'socio-emotional': {
            bg: 'var(--color-social-emotional-state-08)',
            icon: 'var(--color-social-emotional)',
            text: 'var(--color-social-emotional-text)'
        },
        'mastering-content': {
            bg: 'var(--color-mastering-content-state-08)',
            icon: 'var(--color-mastering-content)',
            text: 'var(--color-mastering-content-text)'
        },
        'advocacy': {
            bg: 'var(--color-advocacy-state-08)',
            icon: 'var(--color-advocacy)',
            text: 'var(--color-advocacy-text)'
        },
        'relationships': {
            bg: 'var(--color-relationship-state-08)',
            icon: 'var(--color-relationship)',
            text: 'var(--color-relationship-text)'
        },
        'technology-tools': {
            bg: 'var(--color-technology-tools-state-08)',
            icon: 'var(--color-technology-tools)',
            text: 'var(--color-technology-tools-text)'
        }
    };
    
    const colors = colorMap[normalizedType] || colorMap['socio-emotional'];
    
    // Outer container - Figma: content-stretch flex items-center justify-center relative
    const badge = document.createElement('div');
    badge.classList.add('plus-static-badge-smart', `plus-static-badge-smart-${normalizedType}`, `plus-static-badge-smart-${size}`);
    badge.style.display = 'flex';
    badge.style.alignItems = 'center';
    badge.style.justifyContent = 'center';
    badge.style.position = 'relative';
    
    if (id) {
        badge.id = id;
    }
    
    if (classes && classes.length > 0) {
        badge.classList.add(...classes);
    }
    
    // Badge container - Figma: box-border content-stretch flex items-center py-0 relative shrink-0
    const badgeContainer = document.createElement('div');
    badgeContainer.style.display = 'flex';
    badgeContainer.style.alignItems = 'center';
    badgeContainer.style.paddingTop = '0';
    badgeContainer.style.paddingBottom = '0';
    badgeContainer.style.position = 'relative';
    badgeContainer.style.flexShrink = '0';
    badgeContainer.style.boxSizing = 'border-box';
    
    // Background color
    badgeContainer.style.backgroundColor = colors.bg;
    
    // Padding and border radius vary by size - Figma shows different padding for different sizes
    if (['h1', 'h2', 'h3'].includes(size)) {
        badgeContainer.style.paddingLeft = 'var(--size-element-pad-x-lg)';
        badgeContainer.style.paddingRight = 'var(--size-element-pad-x-lg)';
        badgeContainer.style.borderRadius = '999px'; // radius-1000
    } else if (['h4', 'h5'].includes(size)) {
        badgeContainer.style.paddingLeft = 'var(--size-element-pad-x-md)';
        badgeContainer.style.paddingRight = 'var(--size-element-pad-x-md)';
        badgeContainer.style.borderRadius = '999px'; // radius-1000
    } else if (size === 'h6') {
        badgeContainer.style.paddingLeft = 'var(--size-element-pad-x-md)';
        badgeContainer.style.paddingRight = 'var(--size-element-pad-x-md)';
        badgeContainer.style.borderRadius = '50px';
    } else if (['b1', 'b2'].includes(size)) {
        badgeContainer.style.paddingLeft = 'var(--size-element-pad-x-sm)';
        badgeContainer.style.paddingRight = 'var(--size-element-pad-x-sm)';
        badgeContainer.style.borderRadius = '999px'; // radius-1000
    } else if (size === 'b3') {
        badgeContainer.style.paddingLeft = 'var(--size-element-pad-x-sm)';
        badgeContainer.style.paddingRight = 'var(--size-element-pad-x-sm)';
        // B3 technology-tools uses radius-400 (16px), others use radius-1000
        if (normalizedType === 'technology-tools') {
            badgeContainer.style.borderRadius = '16px'; // radius-400
        } else {
            badgeContainer.style.borderRadius = '999px'; // radius-1000
        }
    }
    
    // Badge content - Figma: content-stretch flex items-center justify-center relative shrink-0
    const badgeContent = document.createElement('div');
    badgeContent.style.display = 'flex';
    badgeContent.style.alignItems = 'center';
    badgeContent.style.justifyContent = 'center';
    badgeContent.style.position = 'relative';
    badgeContent.style.flexShrink = '0';
    
    // Gap varies by size - Figma shows gap-lg for H1-H3, gap-md for H4-H6, gap-sm for B1-B3
    if (['h1', 'h2', 'h3'].includes(size)) {
        badgeContent.style.gap = 'var(--size-element-gap-lg)';
    } else if (['h4', 'h5', 'h6'].includes(size)) {
        badgeContent.style.gap = 'var(--size-element-gap-md)';
    } else if (['b1', 'b2', 'b3'].includes(size)) {
        badgeContent.style.gap = 'var(--size-element-gap-sm)';
        // Min-width varies for body sizes
        if (size === 'b1') {
            badgeContent.style.minWidth = '20px';
        } else if (size === 'b2') {
            badgeContent.style.minWidth = '16px';
        } else if (size === 'b3') {
            badgeContent.style.minWidth = '12px';
        }
    }
    
    // Leading visual (icon) - Font Awesome icon, NOT text content
    const leadingVisual = document.createElement('div');
    leadingVisual.style.display = 'flex';
    leadingVisual.style.alignItems = 'center';
    leadingVisual.style.justifyContent = 'center';
    leadingVisual.style.position = 'relative';
    leadingVisual.style.flexShrink = '0';
    
    const iconEl = document.createElement('i');
    iconEl.classList.add('fas', 'fa-circle-dot');
    iconEl.style.fontStyle = 'normal';
    iconEl.style.textAlign = 'center';
    iconEl.style.whiteSpace = 'nowrap';
    iconEl.style.color = colors.icon;
    
    // Icon font size varies by badge size - Figma shows different icon sizes
    if (size === 'h1') {
        iconEl.style.fontSize = 'var(--font-size-fa-h1-solid)';
        iconEl.style.lineHeight = 'var(--font-line-height-fa-h1-solid)';
    } else if (size === 'h2') {
        iconEl.style.fontSize = 'var(--font-size-fa-h2-solid)';
        iconEl.style.lineHeight = 'var(--font-line-height-fa-h2-solid)';
    } else if (size === 'h3') {
        iconEl.style.fontSize = 'var(--font-size-fa-h3-solid)';
        iconEl.style.lineHeight = 'var(--font-line-height-fa-h3-solid)';
    } else if (size === 'h4') {
        iconEl.style.fontSize = 'var(--font-size-fa-h4-solid)';
        iconEl.style.lineHeight = 'var(--font-line-height-fa-h4-solid)';
    } else if (size === 'h5') {
        iconEl.style.fontSize = 'var(--font-size-fa-h5-solid)';
        iconEl.style.lineHeight = 'var(--font-line-height-fa-h5-solid)';
    } else if (size === 'h6' || size === 'b1') {
        iconEl.style.fontSize = 'var(--font-size-fa-h6-solid)';
        iconEl.style.lineHeight = 'var(--font-line-height-fa-h6-solid)';
    } else if (size === 'b2') {
        iconEl.style.fontSize = 'var(--font-size-fa-body2-solid)';
        iconEl.style.lineHeight = 'var(--font-line-height-fa-body2-solid)';
    } else if (size === 'b3') {
        iconEl.style.fontSize = 'var(--font-size-fa-body3-solid)';
        iconEl.style.lineHeight = 'var(--font-line-height-fa-body3-solid)';
    }
    
    leadingVisual.appendChild(iconEl);
    badgeContent.appendChild(leadingVisual);
    
    // Text - Typography varies by size
    const textEl = document.createElement('div');
    textEl.style.display = 'flex';
    textEl.style.flexDirection = 'column';
    textEl.style.justifyContent = 'center';
    textEl.style.lineHeight = '0';
    textEl.style.position = 'relative';
    textEl.style.flexShrink = '0';
    textEl.style.textAlign = 'center';
    textEl.style.color = colors.text;
    
    // Typography varies by size - Figma shows H1-H3 use Lato Bold, H4-H6 use Lato SemiBold, B1-B3 use Merriweather Sans Regular
    if (['h1', 'h2', 'h3'].includes(size)) {
        textEl.style.fontFamily = 'var(--font-family-header)';
        textEl.style.fontWeight = 'var(--font-weight-bold)';
        textEl.style.fontStyle = 'normal';
        textEl.style.whiteSpace = 'nowrap';
        if (size === 'h1') {
            textEl.style.fontSize = 'var(--font-size-h1)';
            textEl.style.lineHeight = 'var(--font-line-height-h1)';
        } else if (size === 'h2') {
            textEl.style.fontSize = 'var(--font-size-h2)';
            textEl.style.lineHeight = 'var(--font-line-height-h2)';
        } else if (size === 'h3') {
            textEl.style.fontSize = 'var(--font-size-h3)';
            textEl.style.lineHeight = 'var(--font-line-height-h3)';
        }
    } else if (['h4', 'h5', 'h6'].includes(size)) {
        textEl.style.fontFamily = 'var(--font-family-header)';
        textEl.style.fontWeight = 'var(--font-weight-semibold-2)';
        textEl.style.fontStyle = 'normal';
        textEl.style.whiteSpace = 'nowrap';
        if (size === 'h4') {
            textEl.style.fontSize = 'var(--font-size-h4)';
            textEl.style.lineHeight = 'var(--font-line-height-h4)';
        } else if (size === 'h5') {
            textEl.style.fontSize = 'var(--font-size-h5)';
            textEl.style.lineHeight = 'var(--font-line-height-h5)';
        } else if (size === 'h6') {
            textEl.style.fontSize = 'var(--font-size-h6)';
            textEl.style.lineHeight = 'var(--font-line-height-h6)';
        }
    } else if (['b1', 'b2', 'b3'].includes(size)) {
        textEl.style.flex = '1 0 0';
        textEl.style.fontFamily = 'var(--font-family-body)';
        // Figma: Body/B1-B3/Semibold uses Regular (400), not Light (300)
        // font-normal in Tailwind = Regular (400) = --font-weight-semibold-1
        textEl.style.fontWeight = 'var(--font-weight-semibold-1)'; // Regular (400)
        textEl.style.minHeight = '1px';
        textEl.style.minWidth = '1px';
        if (size === 'b1') {
            textEl.style.fontSize = 'var(--font-size-body1)';
            textEl.style.lineHeight = 'var(--font-line-height-body1)';
        } else if (size === 'b2') {
            textEl.style.fontSize = 'var(--font-size-body2)';
            textEl.style.lineHeight = 'var(--font-line-height-body2)';
        } else if (size === 'b3') {
            textEl.style.fontSize = 'var(--font-size-body3)';
            textEl.style.lineHeight = 'var(--font-line-height-body3)';
        }
    }
    
    const textP = document.createElement('p');
    // Line height for paragraph varies by size
    if (size === 'h1') {
        textP.style.lineHeight = '1.6';
    } else if (['h2', 'h6'].includes(size)) {
        textP.style.lineHeight = '1.5';
    } else if (size === 'h3') {
        textP.style.lineHeight = '1.429';
    } else if (size === 'h4') {
        textP.style.lineHeight = '1.333';
    } else if (size === 'h5') {
        textP.style.lineHeight = '1.4';
    } else if (size === 'b1') {
        textP.style.lineHeight = '1.5';
        textP.style.whiteSpace = 'pre-wrap';
    } else if (size === 'b2') {
        textP.style.lineHeight = '1.571';
        textP.style.whiteSpace = 'pre-wrap';
    } else if (size === 'b3') {
        textP.style.lineHeight = '1.667';
        textP.style.whiteSpace = 'pre-wrap';
    }
    textP.textContent = displayText;
    textEl.appendChild(textP);
    badgeContent.appendChild(textEl);
    
    badgeContainer.appendChild(badgeContent);
    badge.appendChild(badgeContainer);
    
    return badge;
}
