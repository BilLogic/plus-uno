/**
 * @fileoverview LikertScale component for Training Lessons specs
 * Likert scale with left label, rating component, and right label
 * Matches Figma design system specifications
 */

import { createRating } from './Rating.js';

/**
 * Creates a LikertScale component
 * @param {Object} options - Likert scale configuration
 * @param {string} [options.leftLabel="Not at all confident"] - Left label text
 * @param {string} [options.rightLabel="Extremely confident"] - Right label text
 * @param {string|number} [options.rating="rest"] - Selected rating: "rest", 1, 2, 3, 4, or 5
 * @param {Function} [options.onRatingChange] - Rating change handler
 * @returns {HTMLElement} Likert scale element
 */
export function createLikertScale({
    leftLabel = "Not at all confident",
    rightLabel = "Extremely confident",
    rating = "rest",
    onRatingChange = null
} = {}) {
    // Container - Figma: flex, gap element/gap-lg (12px), padding element/pad-x-lg, py-0
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = 'var(--size-element-gap-lg)';
    container.style.alignItems = 'flex-start';
    container.style.padding = '0 var(--size-element-pad-x-lg)';
    container.setAttribute('data-node-id', '63:177681');

    // Left label - Figma: Merriweather Sans Light, size 20px, color primary-text, width 198px, height 52px, justify-end
    const leftLabelEl = document.createElement('div');
    leftLabelEl.style.display = 'flex';
    leftLabelEl.style.gap = 'var(--size-element-gap-md)';
    leftLabelEl.style.minHeight = '52px';
    leftLabelEl.style.height = 'auto';
    leftLabelEl.style.alignItems = 'flex-start';
    leftLabelEl.style.justifyContent = 'flex-end';
    leftLabelEl.style.minWidth = '198px';
    leftLabelEl.style.maxWidth = '198px';
    leftLabelEl.style.width = '100%';
    leftLabelEl.style.flexShrink = '0';
    leftLabelEl.setAttribute('data-node-id', '63:177682');

    const leftLabelText = document.createElement('p');
    leftLabelText.style.fontFamily = 'var(--font-family-body)';
    leftLabelText.style.fontSize = 'var(--font-size-lead)';
    leftLabelText.style.fontWeight = 'var(--font-weight-normal)';
    leftLabelText.style.lineHeight = '1.6';
    leftLabelText.style.color = 'var(--color-primary-text)';
    leftLabelText.style.textAlign = 'right';
    leftLabelText.style.whiteSpace = 'nowrap';
    leftLabelText.style.overflow = 'hidden';
    leftLabelText.style.textOverflow = 'ellipsis';
    leftLabelText.textContent = leftLabel;
    leftLabelEl.appendChild(leftLabelText);
    container.appendChild(leftLabelEl);

    // Rating component
    const ratingComponent = createRating({
        rating: rating,
        onRatingChange: onRatingChange
    });
    ratingComponent.style.flexShrink = '0';
    container.appendChild(ratingComponent);

    // Right label - Figma: Merriweather Sans Light, size 20px, color primary-text, width 198px, height 52px
    const rightLabelEl = document.createElement('div');
    rightLabelEl.style.display = 'flex';
    rightLabelEl.style.gap = 'var(--size-element-gap-md)';
    rightLabelEl.style.minHeight = '52px';
    rightLabelEl.style.height = 'auto';
    rightLabelEl.style.alignItems = 'flex-start';
    rightLabelEl.style.minWidth = '198px';
    rightLabelEl.style.maxWidth = '198px';
    rightLabelEl.style.width = '100%';
    rightLabelEl.style.flexShrink = '0';
    rightLabelEl.setAttribute('data-node-id', '63:177684');

    const rightLabelText = document.createElement('p');
    rightLabelText.style.fontFamily = 'var(--font-family-body)';
    rightLabelText.style.fontSize = 'var(--font-size-lead)';
    rightLabelText.style.fontWeight = 'var(--font-weight-normal)';
    rightLabelText.style.lineHeight = '1.6';
    rightLabelText.style.color = 'var(--color-primary-text)';
    rightLabelText.style.textAlign = 'left';
    rightLabelText.style.whiteSpace = 'nowrap';
    rightLabelText.style.overflow = 'hidden';
    rightLabelText.style.textOverflow = 'ellipsis';
    rightLabelText.textContent = rightLabel;
    rightLabelEl.appendChild(rightLabelText);
    container.appendChild(rightLabelEl);

    return container;
}

