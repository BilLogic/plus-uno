/**
 * @fileoverview OnboardingModuleCard component for Training Onboarding Cards
 * Card component showing onboarding module with image thumbnail or description area
 * Matches Figma design system specifications
 */

import { createStrategyBadge } from '../Elements/StrategyBadge.js';
import { createStatusIndicators } from '../Elements/StatusIndicators.js';

/**
 * Creates an OnboardingModuleCard component
 * @param {Object} options - Card configuration
 * @param {string} [options.moduleTitle="Module Title"] - Module title text
 * @param {string} [options.duration="9 mins"] - Duration text
 * @param {string} [options.state="default"] - Card state: "default" or "state3" (with description area)
 * @param {string} [options.badgeType="other"] - Strategy badge type
 * @param {string} [options.stage="not started"] - Status indicator stage
 * @returns {HTMLElement} Card element
 */
export function createOnboardingModuleCard({
    moduleTitle = "Module Title",
    duration = "9 mins",
    state = "default",
    badgeType = "other",
    stage = "not started"
} = {}) {
    const card = document.createElement("div");
    card.style.backgroundColor = "var(--color-surface)";
    card.style.border = "1px solid var(--color-outline-variant)";
    card.style.borderRadius = "var(--size-card-radius-sm)";
    card.style.width = "275.33px";
    card.style.overflow = "hidden";
    
    if (state === "state3") {
        card.style.height = "auto";
    } else {
        card.style.height = "348px";
    }
    
    const cardInner = document.createElement("div");
    cardInner.style.display = "flex";
    cardInner.style.flexDirection = "column";
    cardInner.style.height = state === "state3" ? "auto" : "348px";
    cardInner.style.width = "275.33px";
    cardInner.style.overflow = "hidden";
    cardInner.style.borderRadius = "inherit";
    
    // Header area (image thumbnail or description)
    const headerArea = document.createElement("div");
    headerArea.style.display = "flex";
    headerArea.style.gap = "var(--size-card-gap-sm)";
    headerArea.style.height = "200px";
    headerArea.style.alignItems = "center";
    headerArea.style.padding = "var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)";
    headerArea.style.width = "100%";
    headerArea.style.flexShrink = "0";
    
    if (state === "state3") {
        // Description area variant
        headerArea.style.backgroundColor = "var(--color-info-container)";
        headerArea.style.flex = "1";
        headerArea.style.minHeight = "200px";
        
        const descriptionText = document.createElement("div");
        descriptionText.style.fontFamily = "var(--font-family-body)";
        descriptionText.style.fontSize = "var(--font-size-body2)";
        descriptionText.style.fontWeight = "var(--font-weight-normal)";
        descriptionText.style.lineHeight = "1.571";
        descriptionText.style.color = "var(--color-on-surface-variant)";
        descriptionText.style.textAlign = "center";
        descriptionText.style.flex = "1";
        descriptionText.textContent = "Add description here";
        
        headerArea.appendChild(descriptionText);
    } else {
        // Image thumbnail variant - matching Figma design
        headerArea.style.position = "relative";
        
        // Background layer with tertiary state color
        const thumbnailLayer = document.createElement("div");
        thumbnailLayer.setAttribute("aria-hidden", "true");
        thumbnailLayer.style.position = "absolute";
        thumbnailLayer.style.inset = "0";
        thumbnailLayer.style.pointerEvents = "none";
        thumbnailLayer.style.opacity = "0.38";
        
        // Background color
        const bgColor = document.createElement("div");
        bgColor.style.position = "absolute";
        bgColor.style.inset = "0";
        bgColor.style.backgroundColor = "var(--color-tertiary-state-08)";
        thumbnailLayer.appendChild(bgColor);
        
        // Image element
        const image = document.createElement("img");
        image.alt = "";
        image.style.position = "absolute";
        image.style.maxWidth = "none";
        image.style.objectFit = "contain";
        image.style.objectPosition = "50% 50%";
        image.style.width = "100%";
        image.style.height = "100%";
        
        // Try to load image from Figma URL (for development/Storybook)
        // In production, this should be replaced with actual asset path
        const imageUrl = "http://localhost:3845/assets/3ef5cd4b77f31db19ef8abe1fbd33a5ce6388e97.png";
        image.src = imageUrl;
        image.onerror = function() {
            // If image fails to load, keep the background color as placeholder
            this.style.display = "none";
        };
        
        thumbnailLayer.appendChild(image);
        headerArea.appendChild(thumbnailLayer);
    }
    
    cardInner.appendChild(headerArea);
    
    // Content area
    const contentArea = document.createElement("div");
    contentArea.style.display = "flex";
    contentArea.style.flexDirection = "column";
    contentArea.style.gap = "var(--size-card-gap-sm)";
    contentArea.style.height = state === "state3" ? "auto" : "148px";
    contentArea.style.padding = "var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)";
    contentArea.style.width = "100%";
    
    // Container #1 - Duration and Title
    const container1 = document.createElement("div");
    container1.style.display = "flex";
    container1.style.flexDirection = "column";
    container1.style.gap = "var(--size-element-pad-x-sm)";
    container1.style.padding = "0 var(--size-element-pad-y-sm)";
    container1.style.width = "100%";
    
    // Tags (Duration)
    const tags = document.createElement("div");
    tags.style.display = "flex";
    tags.style.alignItems = "center";
    tags.style.padding = "var(--size-element-pad-y-sm) 0";
    tags.style.width = "100%";
    
    const durationText = document.createElement("div");
    durationText.style.fontFamily = "var(--font-family-body)";
    durationText.style.fontSize = "var(--font-size-body3)";
    durationText.style.fontWeight = "var(--font-weight-normal)";
    durationText.style.lineHeight = "1.667";
    durationText.style.color = "var(--color-on-surface-variant)";
    durationText.style.whiteSpace = "nowrap";
    durationText.textContent = duration;
    
    tags.appendChild(durationText);
    container1.appendChild(tags);
    
    // Title
    const titleContainer = document.createElement("div");
    titleContainer.style.display = "flex";
    titleContainer.style.gap = "8px";
    titleContainer.style.alignItems = "flex-start";
    titleContainer.style.width = "100%";
    
    const title = document.createElement("div");
    title.style.fontFamily = "var(--font-family-header)";
    title.style.fontSize = "var(--font-size-h5)";
    title.style.fontWeight = "var(--font-weight-semibold-2)";
    title.style.lineHeight = "1.4";
    title.style.color = "var(--color-on-surface)";
    title.style.whiteSpace = "nowrap";
    title.style.overflow = "hidden";
    title.style.textOverflow = "ellipsis";
    title.style.flexShrink = "0";
    title.textContent = moduleTitle;
    
    titleContainer.appendChild(title);
    container1.appendChild(titleContainer);
    
    contentArea.appendChild(container1);
    
    // Container #2 - Badge and Status Indicator
    const container2 = document.createElement("div");
    container2.style.borderTop = "1px solid var(--color-outline-variant)";
    container2.style.display = "flex";
    container2.style.gap = "var(--size-element-gap-sm)";
    container2.style.alignItems = "center";
    container2.style.padding = "var(--size-element-gap-sm) 0";
    container2.style.width = "100%";
    
    const badge = createStrategyBadge({ type: badgeType });
    badge.style.padding = "0 var(--size-element-pad-y-sm)";
    badge.style.borderRadius = "2px";
    container2.appendChild(badge);
    
    const statusIndicator = createStatusIndicators({ stage: stage });
    container2.appendChild(statusIndicator);
    
    contentArea.appendChild(container2);
    
    cardInner.appendChild(contentArea);
    card.appendChild(cardInner);
    
    return card;
}

