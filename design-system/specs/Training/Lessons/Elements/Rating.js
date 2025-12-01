/**
 * @fileoverview Rating component for Training Lessons specs
 * Rating component with 5 rating singles (1-5) showing different selected states
 * Matches Figma design system specifications
 */

import { createRatingSingle } from './RatingSingle.js';

/**
 * Creates a Rating component
 * @param {Object} options - Rating configuration
 * @param {string|number} [options.rating="rest"] - Selected rating: "rest", 1, 2, 3, 4, or 5
 * @param {Function} [options.onRatingChange] - Rating change handler (receives rating number)
 * @returns {HTMLElement} Rating element
 */
export function createRating({
    rating = "rest",
    onRatingChange = null
} = {}) {
    // Container - Figma: flex, gap spacing/large/space-600 (32px), padding spacing/medium/space-300 (16px), py-0
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.alignItems = 'flex-start';
    container.style.padding = '0 var(--size-element-pad-x-md)';
    container.setAttribute('data-node-id', `63:177${rating === "rest" ? "637" : rating === 1 ? "643" : rating === 2 ? "649" : rating === 3 ? "655" : rating === 4 ? "661" : "667"}`);

    // Create 5 rating singles
    for (let i = 1; i <= 5; i++) {
        const isSelected = rating !== "rest" && parseInt(rating) === i;
        const ratingSingle = createRatingSingle({
            value: i,
            status: isSelected ? "selected" : "rest",
            onClick: onRatingChange ? () => onRatingChange(i) : null
        });
        container.appendChild(ratingSingle);
    }

    return container;
}

