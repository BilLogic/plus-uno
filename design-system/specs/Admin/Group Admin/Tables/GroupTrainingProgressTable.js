/**
 * @fileoverview GroupTrainingProgressTable component for Group Admin specs
 * Table showing group training progress by lesson with columns: Competency, Completion, Accuracy, Rating, Time Spent, Action
 */

import { createButton } from '../../../../components/Button/index.js';
import { createStaticBadgeSmart } from '../../../../components/StaticBadgeSmart/index.js';

/**
 * Creates a GroupTrainingProgressTable row component
 * @param {Object} options - Table row configuration
 * @param {string} [options.type="header"] - Row type: "header", "content-l1", "content-l2", "content-l3", "content-l1-hover", "content-l2-hover"
 * @param {Object} [options.data] - Row data (only for content types)
 * @returns {HTMLElement} Table row element
 */
export function createGroupTrainingProgressTableRow({
    type = "header",
    data = null
} = {}) {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "repeat(7, minmax(0, 1fr))";
    row.style.height = type === "header" ? "70px" : "70px";
    row.style.borderRadius = type === "header" ? "var(--size-element-radius-sm)" : "var(--size-table-radius-md)";
    row.style.width = "100%";
    row.setAttribute("data-node-id", "1107:269190");

    // Apply hover state styling
    if (type === "content-l1-hover" || type === "content-l2-hover") {
        row.style.backgroundColor = "var(--color-on-surface-state-08)";
    }

    if (type === "header") {
        // Competency column (spans 2 columns)
        const competencyCell = document.createElement("div");
        competencyCell.style.gridColumn = "span 2";
        competencyCell.style.display = "flex";
        competencyCell.style.alignItems = "center";
        competencyCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";

        const competencyText = document.createElement("div");
        competencyText.className = "body3-txt";
        competencyText.style.fontWeight = "400";
        competencyText.style.color = "var(--color-on-surface)";
        competencyText.textContent = "Competency";
        competencyCell.appendChild(competencyText);
        row.appendChild(competencyCell);

        // Completion column
        const completionCell = createColumnHeader("Completion");
        row.appendChild(completionCell);

        // Accuracy column
        const accuracyCell = createColumnHeader("Accuracy");
        row.appendChild(accuracyCell);

        // Rating column
        const ratingCell = createColumnHeader("Rating");
        row.appendChild(ratingCell);

        // Time Spent column
        const timeSpentCell = createColumnHeader("Time Spent");
        row.appendChild(timeSpentCell);

        // Action column
        const actionCell = createColumnHeader("Action");
        row.appendChild(actionCell);
    } else {
        const rowData = data || {
            competency: "Social-Emotional Learning",
            competencyArea: "socio-emotional",
            completion: "8/16",
            accuracy: "10%",
            rating: "5.0/5",
            timeSpent: "328 mins",
            level: type.includes("l1") ? 1 : type.includes("l2") ? 2 : 3,
            lessonName: type.includes("l2") ? "Motivation to Learn" : type.includes("l3") ? "Reacting to Errors" : null
        };

        // Competency column (spans 2 columns)
        const competencyCell = document.createElement("div");
        competencyCell.style.gridColumn = "span 2";
        competencyCell.style.display = "flex";
        competencyCell.style.alignItems = "center";
        competencyCell.style.overflow = "hidden";
        
        if (rowData.level === 1) {
            competencyCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
            
            const competencyButton = document.createElement("button");
            competencyButton.style.display = "flex";
            competencyButton.style.gap = "var(--size-element-gap-md)";
            competencyButton.style.alignItems = "center";
            competencyButton.style.justifyContent = "center";
            competencyButton.style.minWidth = "28px";
            competencyButton.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
            competencyButton.style.border = "none";
            competencyButton.style.background = "transparent";
            competencyButton.style.cursor = "pointer";
            competencyButton.style.borderRadius = "var(--size-element-radius-sm)";

            // Caret icon
            const caretIcon = document.createElement("i");
            caretIcon.className = "fas fa-caret-right";
            caretIcon.style.fontSize = "var(--font-size-body3)";
            caretIcon.style.color = "var(--color-on-surface)";
            competencyButton.appendChild(caretIcon);

            // Competency badge
            const competencyBadge = createStaticBadgeSmart({
                type: rowData.competencyArea || "socio-emotional",
                size: "b3"
            });
            competencyBadge.style.padding = "0 var(--size-element-pad-x-sm)";
            competencyButton.appendChild(competencyBadge);

            competencyCell.appendChild(competencyButton);
        } else if (rowData.level === 2) {
            competencyCell.style.paddingLeft = "24px";
            competencyCell.style.paddingRight = "0";
            competencyCell.style.paddingTop = "0";
            competencyCell.style.paddingBottom = "0";
            competencyCell.style.borderRadius = "var(--size-element-radius-sm)";

            const lessonButton = document.createElement("button");
            lessonButton.style.display = "flex";
            lessonButton.style.gap = "var(--size-element-gap-md)";
            lessonButton.style.alignItems = "center";
            lessonButton.style.justifyContent = "center";
            lessonButton.style.minWidth = "28px";
            lessonButton.style.padding = "var(--size-element-pad-y-lg) var(--size-element-pad-x-lg)";
            lessonButton.style.border = "none";
            lessonButton.style.background = "transparent";
            lessonButton.style.cursor = "pointer";
            lessonButton.style.flex = "1";

            // Caret icon
            const caretIcon = document.createElement("i");
            caretIcon.className = "fas fa-caret-right";
            caretIcon.style.fontSize = "var(--font-size-body3)";
            caretIcon.style.color = "var(--color-on-surface-variant)";
            lessonButton.appendChild(caretIcon);

            // Lesson name text
            const lessonText = document.createElement("div");
            lessonText.className = "body3-txt";
            lessonText.style.fontWeight = "400";
            lessonText.style.color = "var(--color-secondary-text)";
            lessonText.textContent = rowData.lessonName || "Motivation to Learn";
            lessonButton.appendChild(lessonText);

            competencyCell.appendChild(lessonButton);
        } else {
            // Level 3 - just text
            competencyCell.style.paddingLeft = "60px";
            competencyCell.style.paddingRight = "0";
            competencyCell.style.paddingTop = "0";
            competencyCell.style.paddingBottom = "0";

            const lessonText = document.createElement("p");
            lessonText.className = "body3-txt";
            lessonText.style.fontWeight = "300";
            lessonText.style.color = "var(--color-on-surface-variant)";
            lessonText.style.overflow = "ellipsis";
            lessonText.style.whiteSpace = "nowrap";
            lessonText.textContent = rowData.lessonName || "Reacting to Errors";
            competencyCell.appendChild(lessonText);
        }

        row.appendChild(competencyCell);

        // Completion column
        const completionCell = createProgressCell(rowData.completion, "completion");
        row.appendChild(completionCell);

        // Accuracy column
        const accuracyCell = createProgressCell(rowData.accuracy, "accuracy");
        row.appendChild(accuracyCell);

        // Rating column
        const ratingCell = createProgressCell(rowData.rating, "rating");
        row.appendChild(ratingCell);

        // Time Spent column
        const timeSpentCell = document.createElement("div");
        timeSpentCell.style.display = "flex";
        timeSpentCell.style.alignItems = "center";
        timeSpentCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
        timeSpentCell.style.overflow = "hidden";

        const timeText = document.createElement("div");
        timeText.className = "body3-txt";
        timeText.style.fontWeight = "300";
        timeText.style.color = "var(--color-on-surface-variant)";
        timeText.style.overflow = "ellipsis";
        timeText.style.whiteSpace = "nowrap";
        timeText.textContent = rowData.timeSpent;
        timeSpentCell.appendChild(timeText);
        row.appendChild(timeSpentCell);

        // Action column
        const actionCell = document.createElement("div");
        actionCell.style.display = "flex";
        actionCell.style.alignItems = "center";
        actionCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";

        const assignButton = createButton({
            btnText: "Assign",
            btnStyle: "default",
            btnFill: "text",
            btnSize: "small"
        });
        assignButton.style.borderRadius = "var(--size-element-radius-sm)";
        actionCell.appendChild(assignButton);
        row.appendChild(actionCell);
    }

    return row;
}

/**
 * Creates a column header cell
 * @param {string} text - Header text
 * @returns {HTMLElement} Header cell element
 */
function createColumnHeader(text) {
    const cell = document.createElement("div");
    cell.style.display = "flex";
    cell.style.gap = "var(--size-table-cell-gap)";
    cell.style.alignItems = "center";
    cell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";

    const headerText = document.createElement("div");
    headerText.className = "body3-txt";
    headerText.style.fontWeight = "400";
    headerText.style.color = "var(--color-on-surface)";
    headerText.textContent = text;
    cell.appendChild(headerText);

    const sortIcon = document.createElement("i");
    sortIcon.className = "fas fa-arrow-up";
    sortIcon.style.fontSize = "var(--font-size-body3)";
    sortIcon.style.color = "var(--color-outline-variant)";
    cell.appendChild(sortIcon);

    return cell;
}

/**
 * Helper function to resolve CSS variable to actual color value for SVG
 * @param {string} cssVar - CSS variable name (e.g., "var(--color-primary)")
 * @returns {string} Resolved color value
 */
function resolveCSSVariable(cssVar) {
    if (!cssVar || !cssVar.startsWith('var(')) {
        return cssVar;
    }
    // Extract variable name
    const varName = cssVar.replace('var(', '').replace(')', '').trim();
    // Get computed value from document root
    const computedValue = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return computedValue || cssVar;
}

/**
 * Creates a progress indicator cell with circular progress chart
 * @param {string} value - Value to display (e.g., "8/16" or "10%" or "5.0/5")
 * @param {string} [type="completion"] - Type of progress indicator: "completion", "accuracy", or "rating"
 */
function createProgressCell(value, type = "completion") {
    const cell = document.createElement("div");
    cell.style.display = "flex";
    cell.style.flexDirection = "column";
    cell.style.alignItems = "center";
    cell.style.justifyContent = "flex-end";
    cell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
    cell.style.position = "relative";

    // Progress indicators container
    const progressContainer = document.createElement("div");
    progressContainer.style.display = "flex";
    progressContainer.style.flexDirection = "column";
    progressContainer.style.alignItems = "center";
    progressContainer.style.justifyContent = "flex-end";
    progressContainer.style.padding = "0 var(--size-element-pad-x-md)";
    progressContainer.style.position = "relative";
    progressContainer.style.width = "48px";
    progressContainer.style.height = "40px";

    // Calculate percentage from value
    let percentage = 0;
    if (value.includes("/")) {
        // Handle fraction format like "8/16" or "5.0/5"
        const parts = value.split("/");
        const numerator = parseFloat(parts[0]);
        const denominator = parseFloat(parts[1]);
        percentage = denominator > 0 ? (numerator / denominator) * 100 : 0;
    } else if (value.includes("%")) {
        // Handle percentage format like "10%"
        percentage = parseFloat(value.replace("%", ""));
    } else {
        percentage = parseFloat(value) || 0;
    }

    // Determine color based on type and percentage
    let progressColor;
    if (type === "completion") {
        // Completion: Green for 100%, Yellow for partial completion
        if (percentage >= 99.9 || percentage === 100) {
            progressColor = "var(--color-success-container)"; // Light green for 100% completion
            // For 100% completion, show nearly full circle (95%) to leave small gap at bottom
            // This matches Figma design where completion shows almost complete circle
            percentage = 95;
        } else {
            progressColor = "var(--color-warning-container)"; // Yellow for partial completion
        }
    } else if (type === "accuracy") {
        progressColor = "var(--color-relationship-container)"; // Pink for accuracy
    } else {
        // Rating uses light green
        progressColor = "var(--color-success-container)"; // Light green for rating
    }
    
    // For rating, show nearly full circle (leaving small gap at bottom) if percentage is 100%
    // This matches Figma design where rating shows almost complete circle (95%) for perfect scores
    // The gap at the bottom is intentional design choice
    if (type === "rating") {
        if (percentage >= 99.9 || percentage === 100) {
            percentage = 95; // Show 95% to leave small gap at bottom (matching Figma design)
        }
        // For non-perfect ratings, scale normally but cap at 95% max
        if (percentage > 95) {
            percentage = 95;
        }
    }

    // Create SVG circular progress chart
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "48");
    svg.setAttribute("height", "40");
    svg.setAttribute("viewBox", "0 0 48 40");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";

    // Circle parameters - matching Figma design
    const centerX = 24;
    const centerY = 20;
    const radius = 18; // Outer radius for the circle
    const strokeWidth = 4; // Stroke width for the outline and progress arc

    // Background circle (outline) - light gray
    const backgroundCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    backgroundCircle.setAttribute("cx", centerX);
    backgroundCircle.setAttribute("cy", centerY);
    backgroundCircle.setAttribute("r", radius);
    backgroundCircle.setAttribute("fill", "none");
    // Resolve CSS variable to actual color value for SVG
    backgroundCircle.setAttribute("stroke", resolveCSSVariable("var(--color-outline-variant)"));
    backgroundCircle.setAttribute("stroke-width", strokeWidth);
    svg.appendChild(backgroundCircle);

        // Progress arc - arc stroke matching Figma design
        if (percentage > 0) {
            const startAngle = -90; // Start from top (12 o'clock)
            const endAngle = -90 + (percentage / 100) * 360;
            
            const startAngleRad = (startAngle * Math.PI) / 180;
            const endAngleRad = (endAngle * Math.PI) / 180;
            
            // Calculate points on the circle
            const x1 = centerX + radius * Math.cos(startAngleRad);
            const y1 = centerY + radius * Math.sin(startAngleRad);
            const x2 = centerX + radius * Math.cos(endAngleRad);
            const y2 = centerY + radius * Math.sin(endAngleRad);
            
            const largeArc = percentage > 50 ? 1 : 0;
            
            // Create arc stroke path
            const arcPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            const arcData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
            arcPath.setAttribute("d", arcData);
            arcPath.setAttribute("fill", "none");
            // Resolve CSS variable to actual color value for SVG
            arcPath.setAttribute("stroke", resolveCSSVariable(progressColor));
            arcPath.setAttribute("stroke-width", strokeWidth);
            arcPath.setAttribute("stroke-linecap", "round");
            svg.appendChild(arcPath);
        }

    progressContainer.appendChild(svg);

    // Value text overlay - positioned absolutely in center
    const valueText = document.createElement("div");
    valueText.style.position = "absolute";
    valueText.style.top = "calc(50% + 2.5px)";
    valueText.style.left = "50%";
    valueText.style.transform = "translate(-50%, -50%)";
    valueText.style.fontFamily = "var(--font-family-body)";
    valueText.style.fontSize = "var(--font-size-body3)";
    valueText.style.fontWeight = "var(--font-weight-normal)";
    valueText.style.lineHeight = "1.4";
    valueText.style.color = "var(--color-on-surface-variant)";
    valueText.style.textAlign = "center";
    valueText.style.width = "48px";
    valueText.style.zIndex = "1";
    valueText.textContent = value;
    progressContainer.appendChild(valueText);

    cell.appendChild(progressContainer);
    return cell;
}

