/**
 * @fileoverview TutorsToolUsageDataViz component for Admin specs
 * Section showing tutor tool usage data visualizations
 */

import { createDataCard } from '../Cards/DataCard.js';

/**
 * Creates a TutorsToolUsageDataViz section component
 * @returns {HTMLElement} Section element
 */
export function createTutorsToolUsageDataViz() {
    const section = document.createElement("div");
    section.style.display = "flex";
    section.style.gap = "var(--size-section-gap-md)";
    section.style.alignItems = "flex-start";
    section.style.overflowX = "auto";
    section.style.overflowY = "hidden";

    const cards = [
        {
            title: "Recording Upload (Daily)",
            graphType: "Bar",
            state: "default"
        },
        {
            title: "Reflection Completion (Weekly)",
            graphType: "Line",
            state: "default"
        },
        {
            title: "Attendance Tracking (Weekly)",
            graphType: "Line",
            state: "default"
        },
        {
            title: "Check-in Completion (Weekly)",
            graphType: "Line",
            state: "default"
        }
    ];

    cards.forEach(cardConfig => {
        const card = createDataCard(cardConfig);
        card.style.minWidth = "275.33px";
        card.style.maxWidth = "368.66px";
        card.style.width = "462px";
        card.style.flexShrink = "0";
        section.appendChild(card);
    });

    return section;
}

