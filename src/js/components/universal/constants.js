/**
 * @fileoverview Constants for universal components.
 * Shared constants used across universal component types.
 */

/**
 * Button constants
 */
export const BUTTON_CONSTANTS = {
    FILL: {
        filled: "pbtn-filled",
        outline: "pbtn-outline",
        tonal: "pbtn-tonal",
        text: "pbtn-text"
    },
    STYLES: {
        primary: "pbtn-primary",
        secondary: "pbtn-secondary",
        tertiary: "pbtn-tertiary",
        success: "pbtn-success",
        info: "pbtn-info",
        warning: "pbtn-warning",
        error: "pbtn-error",
        default: "pbtn-default"
    },
    FONT_SIZES: {
        small: "body3-txt",
        "default": "body2-txt",
        large: "body1-txt"
    },
    ICON_STYLES: {
        solid: "fas",
        regular: "far"
    }
};

/**
 * SMART framework constants
 */
export const SMART_CONSTANTS = {
    CA_SE_FULL: "Social-Emotional Learning",
    CA_SE: "Social-Emotional",
    CA_MC: "Mastering Content",
    CA_ADV: "Advocacy",
    CA_RELN: "Relationships",
    CA_TT: "Technology Tools",

    CA_SE_ABBR: "se",
    CA_MC_ABBR: "mc",
    CA_ADV_ABBR: "adv",
    CA_RELN_ABBR: "reln",
    CA_TT_ABBR: "tt",

    STATUS_STARTED: "started",
    STATUS_COMPLETE: "complete",
    STATUS_NOSTART: "not started",
    STATUS_ASSIGNED: "assigned",

    STATUS_ICONS: {
        "complete": "fas fa-check-circle",
        "started": "fas fa-spinner",
        "not started": "fas fa-stop-circle",
        "assigned": "fas fa-check-circle"
    },

    STATUS_COLORS: {
        "assigned": "info",
        "started": "warn",
        "not started": "error",
        "complete": "success"
    },

    STATUS_TEXT: {
        "complete": "Complete",
        "started": "In Progress",
        "not started": "Not Started",
        "assigned": "Assigned"
    }
};

