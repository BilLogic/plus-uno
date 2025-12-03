/**
 * @fileoverview Static Badge SMART component for PLUS design system.
 * Universal element component for SMART competency area badges.
 * Matches Figma design system specifications.
 * 
 * Figma: node-id 956-256793
 */

import { SMART_CONSTANTS } from '../constants.js';
import { createBadge } from '../Badge/index.js';

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

    // Create base badge
    const badge = createBadge({
        text: displayText,
        size: size,
        id: id,
        classes: ['plus-static-badge-smart', `plus-static-badge-smart-${normalizedType}`, ...classes]
    });

    // Apply specific styles
    badge.style.backgroundColor = colors.bg;
    badge.style.color = colors.text;
    badge.style.display = 'inline-flex';
    badge.style.alignItems = 'center';
    badge.style.justifyContent = 'center';
    badge.style.width = 'auto';
    badge.style.maxWidth = '100%';
    badge.style.alignSelf = 'flex-start'; // Prevent stretching in flex containers
    badge.style.flex = '0 0 auto'; // Prevent growing/shrinking

    // Restore specific padding and border-radius logic
    if (['h1', 'h2', 'h3'].includes(size)) {
        badge.style.paddingLeft = 'var(--size-element-pad-x-lg)';
        badge.style.paddingRight = 'var(--size-element-pad-x-lg)';
        badge.style.borderRadius = 'var(--size-element-radius-full)'; // radius-1000
        badge.style.gap = 'var(--size-element-gap-lg)';
    } else if (['h4', 'h5'].includes(size)) {
        badge.style.paddingLeft = 'var(--size-element-pad-x-md)';
        badge.style.paddingRight = 'var(--size-element-pad-x-md)';
        badge.style.borderRadius = 'var(--size-element-radius-full)'; // radius-1000
        badge.style.gap = 'var(--size-element-gap-md)';
    } else if (size === 'h6') {
        badge.style.paddingLeft = 'var(--size-element-pad-x-md)';
        badge.style.paddingRight = 'var(--size-element-pad-x-md)';
        badge.style.borderRadius = 'var(--size-element-radius-full)';
        badge.style.gap = 'var(--size-element-gap-md)';
    } else if (['b1', 'b2'].includes(size)) {
        badge.style.paddingLeft = 'var(--size-element-pad-x-sm)';
        badge.style.paddingRight = 'var(--size-element-pad-x-sm)';
        badge.style.borderRadius = 'var(--size-element-radius-full)'; // radius-1000
        badge.style.gap = 'var(--size-element-gap-sm)';
    } else if (size === 'b3') {
        badge.style.paddingLeft = 'var(--size-element-pad-x-sm)';
        badge.style.paddingRight = 'var(--size-element-pad-x-sm)';
        badge.style.gap = 'var(--size-element-gap-sm)';
        // B3 technology-tools uses radius-400 (16px), others use radius-1000
        if (normalizedType === 'technology-tools') {
            badge.style.borderRadius = 'var(--size-border-radius-radius-400)'; // radius-400
        } else {
            badge.style.borderRadius = 'var(--size-element-radius-full)'; // radius-1000
        }
    }

    // Create icon
    const iconEl = document.createElement('i');
    iconEl.classList.add('fas', 'fa-circle-dot');
    iconEl.style.color = colors.icon;
    iconEl.style.fontFamily = '"Font Awesome 6 Free"';
    iconEl.style.fontWeight = '900';

    // Icon font size varies by badge size
    // Figma H1 Badge: Icon 28px (matches FA H2), Text 32px
    // Figma H2 Badge: Icon 28px (matches FA H2), Text 32px
    // Figma H3 Badge: Icon 24px (matches FA H3), Text 28px
    // Figma H4 Badge: Icon 20px (matches FA H4), Text 24px
    if (size === 'h1') {
        iconEl.style.fontSize = 'var(--font-size-fa-h2-solid)'; // 28px
        iconEl.style.lineHeight = 'var(--font-line-height-fa-h2-solid)';
    } else if (size === 'h2') {
        iconEl.style.fontSize = 'var(--font-size-fa-h2-solid)'; // 28px
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

    // Prepend icon to badge
    badge.prepend(iconEl);

    // Fix text alignment and font weight
    const textEl = badge.querySelector('.plus-badge-text');
    if (textEl) {
        textEl.style.display = 'flex';
        textEl.style.alignItems = 'center';
        textEl.style.height = 'auto'; // Allow height to adjust
        textEl.style.height = 'auto'; // Allow height to adjust

        // Override font family, weight, and line-height based on size
        if (['h1', 'h2', 'h3'].includes(size)) {
            textEl.style.fontFamily = 'var(--font-family-header)';
            textEl.style.fontWeight = 'var(--font-weight-bold)';
            if (size === 'h1') textEl.style.lineHeight = 'var(--font-line-height-h1)';
            if (size === 'h2') textEl.style.lineHeight = 'var(--font-line-height-h2)';
            if (size === 'h3') textEl.style.lineHeight = 'var(--font-line-height-h3)';
        } else if (['h4', 'h5', 'h6'].includes(size)) {
            textEl.style.fontFamily = 'var(--font-family-header)';
            textEl.style.fontWeight = 'var(--font-weight-semibold-2)';
            if (size === 'h4') textEl.style.lineHeight = 'var(--font-line-height-h4)';
            if (size === 'h5') textEl.style.lineHeight = 'var(--font-line-height-h5)';
            if (size === 'h6') textEl.style.lineHeight = 'var(--font-line-height-h6)';
        } else if (['b1', 'b2', 'b3'].includes(size)) {
            textEl.style.fontFamily = 'var(--font-family-body)';
            textEl.style.fontWeight = 'var(--font-weight-semibold-1)'; // Regular (400)
            if (size === 'b1') textEl.style.lineHeight = 'var(--font-line-height-body1)';
            if (size === 'b2') textEl.style.lineHeight = 'var(--font-line-height-body2)';
            if (size === 'b3') textEl.style.lineHeight = 'var(--font-line-height-body3)';
        }

        // Override font size for H2 to match Figma (32px instead of 28px)
        if (size === 'h2') {
            textEl.style.fontSize = 'var(--font-size-h2)'; // 32px
        }
    }

    return badge;
}
