/**
 * @fileoverview DataCardHorizontalScroll component for Admin specs
 * Horizontal scrolling section with multiple data cards
 */

import { createDataCard } from '../Cards/DataCard.js';

/**
 * Creates a DataCardHorizontalScroll section component
 * @param {Object} options - Section configuration
 * @param {Array<Object>} [options.cards] - Array of card configurations
 * @returns {HTMLElement} Section element
 */
export function createDataCardHorizontalScroll({
    cards = []
} = {}) {
    const section = document.createElement("div");
    section.style.display = "flex";
    section.style.gap = "var(--size-section-gap-md)";
    section.style.alignItems = "center";
    section.style.overflowX = "auto";
    section.style.overflowY = "hidden";
    section.style.minWidth = "920px";
    section.style.maxWidth = "1120px";
    section.style.width = "1120px";

    // Default cards if none provided
    if (cards.length === 0) {
        cards = [
            { title: "Card Title", graphType: "Bar", state: "default" },
            { title: "Card Title", graphType: "Bar", state: "default" },
            { title: "Card Title", graphType: "Pie", state: "default" },
            { title: "Card Title", graphType: "Bar", state: "default" },
            { title: "Card Title", graphType: "Bar", state: "default" }
        ];
    }

    cards.forEach(cardConfig => {
        const card = createDataCard(cardConfig);
        card.style.minWidth = "378.67px";
        card.style.maxWidth = "462px";
        card.style.width = "462px";
        card.style.flexShrink = "0";
        section.appendChild(card);
    });

    return section;
}

