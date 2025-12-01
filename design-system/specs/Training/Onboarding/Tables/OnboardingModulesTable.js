/**
 * @fileoverview OnboardingModulesTable component for Training Onboarding Tables
 * Table showing onboarding modules with columns: Module, Duration, Progress, Actions
 * Matches Figma design system specifications
 */

import { createStatusIndicators } from '../Elements/StatusIndicators.js';
import { createCtaButtons } from '../Elements/CtaButtons.js';

/**
 * Creates an OnboardingModulesTable row component
 * @param {Object} options - Table row configuration
 * @param {string} [options.type="Header"] - Row type: "Header" or "Item"
 * @param {string} [options.state="Default"] - Row state: "Default", "hover", "pressed", "focus", "disabled"
 * @param {Object} [options.data] - Row data (only for Item type)
 * @returns {HTMLElement} Table row element
 */
export function createOnboardingModulesTableRow({
    type = "Header",
    state = "Default",
    data = null
} = {}) {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "repeat(6, minmax(0, 1fr))";
    row.style.height = "59.167px";
    row.style.borderRadius = "var(--size-table-radius-md)";
    row.style.width = "994px";
    row.style.minWidth = "994px";
    row.style.overflow = "hidden";
    row.style.flexShrink = "0";
    
    // Apply state styling for Item rows
    if (type === "Item") {
        if (state === "hover") {
            row.style.backgroundColor = "var(--color-on-surface-state-08)";
        } else if (state === "pressed") {
            row.style.backgroundColor = "var(--color-on-surface-state-16)";
        } else if (state === "focus") {
            row.style.backgroundColor = "var(--color-on-surface-state-12)";
            row.style.border = "2px solid var(--color-inverse-primary)";
            row.style.boxSizing = "border-box";
            // Adjust height to account for border
            row.style.height = "calc(59.167px - 4px)";
        } else if (state === "disabled") {
            row.style.backgroundColor = "var(--color-on-surface-state-08)";
            row.style.opacity = "0.38";
        }
    }
    
    if (type === "Header") {
        // Header row
        const headers = [
            { text: "Module", span: 3 },
            { text: "Duration" },
            { text: "Progress" },
            { text: "Actions" }
        ];
        
        headers.forEach((header, index) => {
            const cell = document.createElement("div");
            cell.style.display = "flex";
            cell.style.alignItems = "center";
            cell.style.justifyContent = index === 0 ? "flex-start" : index === headers.length - 1 ? "center" : "center";
            cell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
            cell.style.gap = "var(--size-table-cell-gap)";
            
            if (header.span) {
                cell.style.gridColumn = `span ${header.span}`;
            }
            
            const text = document.createElement("div");
            text.style.fontFamily = "var(--font-family-body)";
            text.style.fontSize = "var(--font-size-body3)";
            text.style.fontWeight = "var(--font-weight-normal)";
            text.style.lineHeight = "1.667";
            text.style.color = "var(--color-on-surface)";
            text.style.textAlign = "center";
            text.style.whiteSpace = "nowrap";
            text.textContent = header.text;
            
            cell.appendChild(text);
            row.appendChild(cell);
        });
    } else {
        // Item row
        const rowData = data || {
            moduleTitle: "Module Title",
            duration: "11mins",
            stage: "not started",
            ctaState: "not started"
        };
        
        // Module column (spans 3 columns) - with image thumbnail and title
        const moduleCell = document.createElement("div");
        moduleCell.style.display = "flex";
        moduleCell.style.gap = "var(--size-table-cell-gap)";
        moduleCell.style.alignItems = "center";
        moduleCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
        moduleCell.style.gridColumn = "span 3";
        moduleCell.style.overflow = "hidden";
        
        // Image thumbnail - matching Figma design
        const thumbnailWrapper = document.createElement("div");
        thumbnailWrapper.style.display = "flex";
        thumbnailWrapper.style.flexDirection = "column";
        thumbnailWrapper.style.gap = "var(--size-element-gap-md)";
        thumbnailWrapper.style.height = "48px";
        thumbnailWrapper.style.width = "80px";
        thumbnailWrapper.style.alignItems = "center";
        thumbnailWrapper.style.justifyContent = "center";
        thumbnailWrapper.style.padding = "var(--size-element-pad-y-lg)";
        thumbnailWrapper.style.borderRadius = "var(--size-element-radius-sm)";
        thumbnailWrapper.style.opacity = "0.38";
        thumbnailWrapper.style.flexShrink = "0";
        thumbnailWrapper.style.position = "relative";
        
        // Background layer with tertiary state color - matching Figma structure
        const backgroundLayer = document.createElement("div");
        backgroundLayer.setAttribute("aria-hidden", "true");
        backgroundLayer.style.position = "absolute";
        backgroundLayer.style.inset = "0";
        backgroundLayer.style.pointerEvents = "none";
        backgroundLayer.style.borderRadius = "var(--size-element-radius-sm)";
        
        // Background color layer
        const bgColor = document.createElement("div");
        bgColor.style.position = "absolute";
        bgColor.style.inset = "0";
        bgColor.style.backgroundColor = "var(--color-tertiary-state-08)";
        bgColor.style.borderRadius = "var(--size-element-radius-sm)";
        backgroundLayer.appendChild(bgColor);
        
        // Image element - try to load from Figma URL, fallback to placeholder
        const image = document.createElement("img");
        image.alt = "";
        image.style.position = "absolute";
        image.style.maxWidth = "none";
        image.style.objectFit = "contain";
        image.style.objectPosition = "50% 50%";
        image.style.borderRadius = "var(--size-element-radius-sm)";
        image.style.width = "100%";
        image.style.height = "100%";
        
        // Try to load image from Figma URL (for development/Storybook)
        // In production, this should be replaced with actual asset path
        const imageUrl = rowData.imageUrl || "http://localhost:3845/assets/3ef5cd4b77f31db19ef8abe1fbd33a5ce6388e97.png";
        image.src = imageUrl;
        image.onerror = function() {
            // If image fails to load, keep the background color as placeholder
            this.style.display = "none";
        };
        
        backgroundLayer.appendChild(image);
        thumbnailWrapper.appendChild(backgroundLayer);
        
        moduleCell.appendChild(thumbnailWrapper);
        
        // Module title
        const titleText = document.createElement("p");
        titleText.style.fontFamily = "var(--font-family-body)";
        titleText.style.fontSize = "var(--font-size-body3)";
        titleText.style.fontWeight = "var(--font-weight-normal)";
        titleText.style.lineHeight = "1.667";
        titleText.style.color = "#2e333d";
        titleText.style.whiteSpace = "nowrap";
        titleText.style.overflow = "hidden";
        titleText.style.textOverflow = "ellipsis";
        titleText.style.flex = "1";
        titleText.style.minWidth = "0";
        titleText.textContent = rowData.moduleTitle;
        
        moduleCell.appendChild(titleText);
        row.appendChild(moduleCell);
        
        // Duration column
        const durationCell = document.createElement("div");
        durationCell.style.display = "flex";
        durationCell.style.alignItems = "center";
        durationCell.style.justifyContent = "center";
        durationCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
        
        const durationText = document.createElement("p");
        durationText.style.fontFamily = "var(--font-family-body)";
        durationText.style.fontSize = "var(--font-size-body3)";
        durationText.style.fontWeight = "var(--font-weight-normal)";
        durationText.style.lineHeight = "1.667";
        durationText.style.color = "var(--color-on-surface-variant)";
        durationText.style.whiteSpace = "nowrap";
        durationText.textContent = rowData.duration;
        
        durationCell.appendChild(durationText);
        row.appendChild(durationCell);
        
        // Progress column - Status indicator
        const progressCell = document.createElement("div");
        progressCell.style.display = "flex";
        progressCell.style.alignItems = "center";
        progressCell.style.justifyContent = "center";
        progressCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
        
        const statusIndicator = createStatusIndicators({ stage: rowData.stage });
        // Adjust icon size for table (10px instead of 14px)
        const icon = statusIndicator.querySelector("i");
        if (icon) {
            icon.style.fontSize = "10px";
            icon.style.lineHeight = "2";
            icon.style.color = "var(--color-danger)";
        }
        const iconWrapper = statusIndicator.querySelector("div[style*='width']");
        if (iconWrapper) {
            iconWrapper.style.width = "9px";
        }
        
        progressCell.appendChild(statusIndicator);
        row.appendChild(progressCell);
        
        // Actions column - CTA button
        const actionsCell = document.createElement("div");
        actionsCell.style.display = "flex";
        actionsCell.style.alignItems = "center";
        actionsCell.style.justifyContent = "center";
        actionsCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
        
        const ctaButton = createCtaButtons({ state: rowData.ctaState });
        actionsCell.appendChild(ctaButton);
        row.appendChild(actionsCell);
    }
    
    return row;
}

