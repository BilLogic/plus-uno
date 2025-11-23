/**
 * @fileoverview Button Group component for PLUS design system.
 * Universal element component for grouping buttons together.
 * Matches Figma design system specifications.
 */

import { createButton } from './button.js';

/**
 * Creates a button group component
 * @param {Object} options - Button group configuration
 * @param {Array<Object>} options.buttons - Array of button configurations (see createButton options)
 * @param {string} [options.size='default'] - Button size (small, default, large)
 * @param {string} [options.style='primary'] - Button style
 * @param {string} [options.fill='filled'] - Button fill
 * @param {string} [options.alignment='horizontal'] - Button alignment (horizontal, vertical)
 * @param {string} [options.id] - Button group ID
 * @param {Array} [options.classes] - Additional CSS classes
 * @returns {HTMLElement} Button group element
 */
export function createButtonGroup({
    buttons = [],
    size = 'default',
    style = 'primary',
    fill = 'filled',
    alignment = 'horizontal',
    id,
    classes = []
}) {
    const group = document.createElement("div");
    group.classList.add("plus-button-group");
    
    if (alignment === 'vertical') {
        group.classList.add("vertical");
    }
    
    if (id) {
        group.id = id;
    }
    
    if (classes && classes.length > 0) {
        group.classList.add(...classes);
    }
    
    buttons.forEach((buttonConfig, index) => {
        // Button groups always use "tonal" fill style (state-layer backgrounds)
        // This matches Figma design where button groups use state-layer-08 backgrounds
        const button = createButton({
            btnSize: buttonConfig.btnSize || size,
            btnStyle: buttonConfig.btnStyle || style,
            btnFill: 'tonal', // Button groups always use tonal style
            ...buttonConfig
        });
        
        group.appendChild(button);
    });
    
    return group;
}

