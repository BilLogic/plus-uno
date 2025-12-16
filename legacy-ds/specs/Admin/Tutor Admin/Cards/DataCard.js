/**
 * @fileoverview DataCard component for Admin specs
 * Card wrapper component that contains a graph visualization
 */

import { createGraphs } from '../Elements/index.js';

/**
 * Creates a DataCard component
 * @param {Object} options - Card configuration
 * @param {string} [options.title="Card Title"] - Card title
 * @param {string} [options.graphType="Pie"] - Graph type: "Pie", "Bar", or "Line"
 * @param {string} [options.state="default"] - Card state: "default" or "loading"
 * @returns {HTMLElement} Card element
 */
export function createDataCard({
    title = "Card Title",
    graphType = "Pie",
    state = "default"
} = {}) {
    const card = document.createElement("div");
    card.style.backgroundColor = "var(--color-surface-container-lowest)";
    card.style.borderRadius = "var(--size-card-radius-sm)";
    card.style.padding = "var(--size-card-pad-y-lg) var(--size-card-pad-x-lg)";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.gap = "var(--size-card-gap-md)";
    card.style.width = "556px";
    card.style.height = "376px";
    card.style.overflow = "hidden";

    // Header
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.gap = "var(--size-element-gap-lg)";
    header.style.alignItems = "center";
    header.style.width = "100%";

    const titleEl = document.createElement("div");
    titleEl.style.fontFamily = "var(--font-family-header)";
    titleEl.style.fontSize = "var(--font-size-h4)";
    titleEl.style.fontWeight = "var(--font-weight-semibold)";
    titleEl.style.lineHeight = "1.333";
    titleEl.style.color = "var(--color-on-surface)";
    titleEl.style.whiteSpace = "nowrap";
    titleEl.textContent = title;
    header.appendChild(titleEl);

    const infoIcon = document.createElement("i");
    infoIcon.className = "fas fa-circle-info";
    infoIcon.style.fontSize = "14px";
    infoIcon.style.color = "var(--color-on-surface-variant)";
    infoIcon.style.flexShrink = "0";
    header.appendChild(infoIcon);

    card.appendChild(header);

    // Graph container
    const graphContainer = document.createElement("div");
    graphContainer.style.display = "flex";
    graphContainer.style.gap = "var(--size-card-gap-md)";
    graphContainer.style.alignItems = "center";
    graphContainer.style.justifyContent = "center";
    graphContainer.style.flex = "1";
    graphContainer.style.width = "100%";
    graphContainer.style.height = "266px";

    if (state === "loading") {
        // Loading animation placeholder
        const loadingContainer = document.createElement("div");
        loadingContainer.style.display = "flex";
        loadingContainer.style.gap = "var(--size-card-gap-md)"; // 16px
        loadingContainer.style.alignItems = "center";
        loadingContainer.style.justifyContent = "center";
        loadingContainer.style.width = "100%";
        loadingContainer.style.height = "266px";

        // Rotating loading animation (simplified)
        const loadingSpinner = document.createElement("div");
        loadingSpinner.style.width = "52px";
        loadingSpinner.style.height = "52px";
        loadingSpinner.style.border = "3px solid var(--color-on-surface-variant)";
        loadingSpinner.style.borderTopColor = "transparent";
        loadingSpinner.style.borderRadius = "50%";
        loadingSpinner.style.animation = "spin 1s linear infinite";
        
        // Add keyframes if not already in stylesheet
        if (!document.getElementById('loading-spinner-styles')) {
            const style = document.createElement('style');
            style.id = 'loading-spinner-styles';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        loadingContainer.appendChild(loadingSpinner);
        graphContainer.appendChild(loadingContainer);
    } else {
        // Use Graphs component
        const graph = createGraphs({ graphType });
        graph.style.width = "100%";
        graph.style.height = "100%";
        graphContainer.appendChild(graph);
    }

    card.appendChild(graphContainer);

    return card;
}


