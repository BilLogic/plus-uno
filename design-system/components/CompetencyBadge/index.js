/**
 * @fileoverview Competency Badge component for PLUS design system.
 * Universal element component for displaying SMART competency area badges.
 * Matches Figma design system specifications exactly.
 * 
 * Figma: node-id 1044-31786
 */

import { SMART_CONSTANTS } from '../constants.js';

/**
 * Creates a competency badge component
 * @param {Object} options - Badge configuration
 * @param {string} options.competencyArea - SMART competency area (socio-emotional, mastering-content, advocacy, relationships, technology-tools)
 * @param {string} [options.size='h2'] - Badge size (h1, h2, h3, h4, h5, h6, b1, b2, b3)
 * @param {string} [options.id] - Badge ID
 * @param {Array} [options.classes] - Additional CSS classes
 * @returns {HTMLElement} Competency badge element
 */
export function createCompetencyBadge({
    competencyArea,
    size = 'h2',
    id = null,
    classes = []
}) {
    // Normalize competency area name (handle spaces and dashes)
    const normalizedArea = competencyArea.replace(/\s+/g, '-').toLowerCase();
    
    // Map competency area to display text
    const textMap = {
        'socio-emotional': SMART_CONSTANTS.CA_SE_FULL,
        'mastering-content': SMART_CONSTANTS.CA_MC,
        'advocacy': SMART_CONSTANTS.CA_ADV,
        'relationships': SMART_CONSTANTS.CA_RELN,
        'technology-tools': SMART_CONSTANTS.CA_TT
    };
    
    const displayText = textMap[normalizedArea] || SMART_CONSTANTS.CA_SE_FULL;
    
    // Create outer container
    const badge = document.createElement('div');
    badge.classList.add('plus-competency-badge', `plus-competency-badge-${normalizedArea}`, `plus-competency-badge-${size}`);
    
    if (id) {
        badge.id = id;
    }
    
    if (classes && classes.length > 0) {
        badge.classList.add(...classes);
    }
    
    // Create badge container (the actual badge with background)
    const badgeContainer = document.createElement('div');
    badgeContainer.classList.add('plus-competency-badge-container');
    
    // Create badge content (icon + text)
    const badgeContent = document.createElement('div');
    badgeContent.classList.add('plus-competency-badge-content');
    
    // Create leading visual (icon)
    const leadingVisual = document.createElement('div');
    leadingVisual.classList.add('plus-competency-badge-icon');
    
    const iconEl = document.createElement('i');
    iconEl.classList.add('fas', 'fa-circle-dot');
    leadingVisual.appendChild(iconEl);
    badgeContent.appendChild(leadingVisual);
    
    // Create text element
    const textEl = document.createElement('div');
    textEl.classList.add('plus-competency-badge-text');
    
    // Create paragraph element inside text container (for proper line-height handling)
    const textP = document.createElement('p');
    textP.textContent = displayText;
    textEl.appendChild(textP);
    
    badgeContent.appendChild(textEl);
    
    badgeContainer.appendChild(badgeContent);
    badge.appendChild(badgeContainer);
    
    return badge;
}

