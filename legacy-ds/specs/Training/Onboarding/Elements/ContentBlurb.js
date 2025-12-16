/**
 * @fileoverview ContentBlurb component for Training Onboarding Elements
 * Content card with title, description, duration, and action button
 * Matches Figma design system specifications
 */

import { createStrategyBadge } from './StrategyBadge.js';

/**
 * Creates a ContentBlurb component
 * @param {Object} options - Component configuration
 * @param {string} [options.title="Competence-building Narratives"] - Content title
 * @param {string} [options.description="Description"] - Content description
 * @param {string} [options.duration="Estimated Time: {xx} minutes"] - Duration text
 * @param {string} [options.badgeType="image"] - Badge type for strategy badge
 * @returns {HTMLElement} ContentBlurb element
 */
export function createContentBlurb({
    title = "Competence-building Narratives",
    description = "Description",
    duration = "Estimated Time: {xx} minutes",
    badgeType = "image"
} = {}) {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "var(--size-element-gap-lg)";
    container.style.alignItems = "flex-start";
    container.style.width = "332px";
    
    // Tags section
    const tagsSection = document.createElement("div");
    tagsSection.style.display = "flex";
    tagsSection.style.alignItems = "center";
    tagsSection.style.padding = "var(--size-element-pad-y-sm) 0";
    tagsSection.style.gap = "var(--size-element-gap-sm)";
    
    const badge = createStrategyBadge({ type: badgeType });
    tagsSection.appendChild(badge);
    
    // Bullet separator
    const bullet = document.createElement("span");
    bullet.style.fontFamily = "var(--font-family-body)";
    bullet.style.fontSize = "var(--font-size-body3)";
    bullet.style.fontWeight = "var(--font-weight-normal)";
    bullet.style.lineHeight = "1.667";
    bullet.style.color = "var(--color-on-surface-variant)";
    bullet.style.marginLeft = "18px";
    bullet.textContent = "•";
    tagsSection.appendChild(bullet);
    
    // Duration text
    const durationText = document.createElement("span");
    durationText.style.fontFamily = "var(--font-family-body)";
    durationText.style.fontSize = "var(--font-size-body3)";
    durationText.style.fontWeight = "var(--font-weight-normal)";
    durationText.style.lineHeight = "1.667";
    durationText.style.color = "var(--color-on-surface-variant)";
    durationText.style.whiteSpace = "nowrap";
    durationText.textContent = "9 mins";
    tagsSection.appendChild(durationText);
    
    container.appendChild(tagsSection);
    
    // Title
    const titleElement = document.createElement("h4");
    titleElement.className = "h4";
    titleElement.style.margin = "0";
    titleElement.style.flex = "1";
    titleElement.textContent = title;
    container.appendChild(titleElement);
    
    // Description
    const descriptionElement = document.createElement("p");
    descriptionElement.style.fontFamily = "var(--font-family-body)";
    descriptionElement.style.fontSize = "var(--font-size-body1)";
    descriptionElement.style.fontWeight = "var(--font-weight-normal)";
    descriptionElement.style.lineHeight = "1.5";
    descriptionElement.style.color = "var(--color-on-surface)";
    descriptionElement.style.margin = "0";
    descriptionElement.style.flex = "1";
    descriptionElement.textContent = description;
    container.appendChild(descriptionElement);
    
    // Time
    const timeElement = document.createElement("p");
    timeElement.style.fontFamily = "var(--font-family-body)";
    timeElement.style.fontSize = "var(--font-size-body1)";
    timeElement.style.fontWeight = "var(--font-weight-normal)";
    timeElement.style.lineHeight = "1.5";
    timeElement.style.color = "var(--color-on-surface)";
    timeElement.style.margin = "0";
    timeElement.style.flex = "1";
    timeElement.textContent = duration;
    container.appendChild(timeElement);
    
    // Button - matching Figma design
    const buttonWrapper = document.createElement("div");
    buttonWrapper.style.border = "1px solid var(--color-primary)";
    buttonWrapper.style.borderRadius = "var(--size-element-radius-md)";
    buttonWrapper.style.overflow = "hidden";
    
    const button = document.createElement("button");
    button.type = "button";
    button.style.display = "flex";
    button.style.alignItems = "center";
    button.style.justifyContent = "center";
    button.style.gap = "var(--size-element-gap-md)";
    button.style.minWidth = "36px";
    button.style.padding = "var(--size-element-pad-y-md) var(--size-element-pad-x-md)";
    button.style.backgroundColor = "transparent";
    button.style.border = "none";
    button.style.cursor = "pointer";
    
    const buttonText = document.createElement("span");
    buttonText.style.fontFamily = "var(--font-family-header)";
    buttonText.style.fontSize = "var(--font-size-h5)";
    buttonText.style.fontWeight = "var(--font-weight-semibold-2)";
    buttonText.style.lineHeight = "1.4";
    buttonText.style.color = "var(--color-primary-text)";
    buttonText.style.whiteSpace = "nowrap";
    buttonText.textContent = "Open onboarding module in a new tab";
    
    const buttonIconWrapper = document.createElement("div");
    buttonIconWrapper.style.display = "flex";
    buttonIconWrapper.style.height = "28px";
    buttonIconWrapper.style.alignItems = "center";
    buttonIconWrapper.style.justifyContent = "center";
    buttonIconWrapper.style.width = "14px";
    buttonIconWrapper.style.flexShrink = "0";
    
    const buttonIcon = document.createElement("i");
    buttonIcon.className = "fas fa-up-right-from-square";
    buttonIcon.style.fontSize = "var(--font-size-fa-h5-solid)";
    buttonIcon.style.color = "var(--color-primary)";
    buttonIcon.style.lineHeight = "1.75";
    
    buttonIconWrapper.appendChild(buttonIcon);
    button.appendChild(buttonText);
    button.appendChild(buttonIconWrapper);
    buttonWrapper.appendChild(button);
    container.appendChild(buttonWrapper);
    
    return container;
}

