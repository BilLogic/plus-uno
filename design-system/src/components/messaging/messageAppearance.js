/**
 * The leading glyph of each message role (Font Awesome Free names), shared
 * by Flag, Section message, Banner and Inline message so one role never draws
 * two icons.
 */
export const MESSAGE_APPEARANCE_ICONS = {
    normal: 'circle-info',
    information: 'circle-info',
    warning: 'triangle-exclamation',
    error: 'circle-exclamation',
    success: 'circle-check',
};

/** Where a component's own appearance names land on the shared roles. */
const ROLE_OF = {
    primary: 'normal',
    secondary: 'normal',
    info: 'information',
    danger: 'error',
};

/** The glyph for an appearance, in any of the messaging components' vocabularies. */
export const messageIcon = (appearance) => (
    MESSAGE_APPEARANCE_ICONS[ROLE_OF[appearance] ?? appearance] ?? MESSAGE_APPEARANCE_ICONS.normal
);
