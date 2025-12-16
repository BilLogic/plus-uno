/**
 * @fileoverview Super Comp Pill component for PLUS design system.
 * Universal element component for displaying competency area pills with SMART framework support.
 */

import { SMART_CONSTANTS } from '../constants.js';

/**
 * Creates a competency area pill element
 * @param {string} competencyArea - Competency area name
 * @param {boolean} [abbreviate=false] - Whether to abbreviate
 * @returns {HTMLElement} Pill element
 */
export function createSuperCompPillDiv(competencyArea, abbreviate = false) {
    const abbr = abbreviateCA(competencyArea);
    const colorClass = getColorClassForCompetencyArea(competencyArea);
    const bgClass = "bg-" + colorClass.replace("color-", "") + (abbreviate ? "-08-hex" : "-alt");
    
    const pill = document.createElement("div");
    pill.classList.add("supercomp-pill", bgClass);
    
    const text = document.createElement("span");
    text.classList.add("supercomp-pill-text");
    text.textContent = abbreviate ? abbr.toUpperCase() : competencyArea;
    pill.appendChild(text);

    return pill;
}

/**
 * Abbreviates a competency area name
 * @param {string} ca - Competency area name
 * @returns {string|null} Abbreviated name or null
 */
function abbreviateCA(ca) {
    switch(ca) {
        case SMART_CONSTANTS.CA_SE:
            return SMART_CONSTANTS.CA_SE_ABBR;
        case SMART_CONSTANTS.CA_MC:
            return SMART_CONSTANTS.CA_MC_ABBR;
        case SMART_CONSTANTS.CA_ADV:
            return SMART_CONSTANTS.CA_ADV_ABBR;
        case SMART_CONSTANTS.CA_RELN:
            return SMART_CONSTANTS.CA_RELN_ABBR;
        case SMART_CONSTANTS.CA_TT:
            return SMART_CONSTANTS.CA_TT_ABBR;
        default:
            return null;
    }
}

/**
 * Gets the color class for a competency area
 * @param {string} ca - Competency area name
 * @returns {string} Color class name
 */
function getColorClassForCompetencyArea(ca) {
    const abbr = abbreviateCA(ca);
    if (!abbr) return "";
    return "color-smartClr" + abbr.charAt(0).toUpperCase() + abbr.slice(1);
}

