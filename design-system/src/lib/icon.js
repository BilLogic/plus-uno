/**
 * Which Font Awesome Free 7.2 icons ship a regular weight.
 *
 * Regular is the default weight for a PLUS icon; solid is used only where Free
 * has no regular. The list is the names whose `free` styles include
 * `regular` in the Font Awesome 7.2 metadata. An alias name (such as
 * `calendar-alt`) is not listed, so it draws solid: use the current name.
 */
export const FREE_REGULAR_ICONS = new Set([
    "address-book", "address-card", "alarm-clock", "bell", "bell-slash", "bookmark", "building",
    "calendar", "calendar-check", "calendar-days", "calendar-minus", "calendar-plus",
    "calendar-xmark", "camera", "chart-bar", "chess-bishop", "chess-king", "chess-knight",
    "chess-pawn", "chess-queen", "chess-rook", "circle", "circle-check", "circle-dot",
    "circle-down", "circle-left", "circle-pause", "circle-play", "circle-question",
    "circle-right", "circle-stop", "circle-up", "circle-user", "circle-xmark", "clipboard",
    "clock", "clone", "closed-captioning", "cloud", "comment", "comment-dots", "comments",
    "compass", "copy", "copyright", "credit-card", "envelope", "envelope-open", "eye",
    "eye-slash", "face-angry", "face-dizzy", "face-flushed", "face-frown", "face-frown-open",
    "face-grimace", "face-grin", "face-grin-beam", "face-grin-beam-sweat", "face-grin-hearts",
    "face-grin-squint", "face-grin-squint-tears", "face-grin-stars", "face-grin-tears",
    "face-grin-tongue", "face-grin-tongue-squint", "face-grin-tongue-wink", "face-grin-wide",
    "face-grin-wink", "face-kiss", "face-kiss-beam", "face-kiss-wink-heart", "face-laugh",
    "face-laugh-beam", "face-laugh-squint", "face-laugh-wink", "face-meh", "face-meh-blank",
    "face-rolling-eyes", "face-sad-cry", "face-sad-tear", "face-smile", "face-smile-beam",
    "face-smile-wink", "face-surprise", "face-tired", "file", "file-audio", "file-code",
    "file-excel", "file-image", "file-lines", "file-pdf", "file-powerpoint", "file-video",
    "file-word", "file-zipper", "flag", "floppy-disk", "folder", "folder-closed", "folder-open",
    "font-awesome", "futbol", "gem", "hand", "hand-back-fist", "hand-lizard", "hand-peace",
    "hand-point-down", "hand-point-left", "hand-point-right", "hand-point-up", "hand-pointer",
    "hand-scissors", "hand-spock", "handshake", "hard-drive", "headphones", "heart", "hospital",
    "hourglass", "hourglass-half", "house", "id-badge", "id-card", "image", "images",
    "keyboard", "lemon", "life-ring", "lightbulb", "map", "message", "money-bill-1", "moon",
    "newspaper", "note-sticky", "object-group", "object-ungroup", "paper-plane", "paste",
    "pen-to-square", "rectangle-list", "rectangle-xmark", "registered", "share-from-square",
    "snowflake", "square", "square-caret-down", "square-caret-left", "square-caret-right",
    "square-caret-up", "square-check", "square-full", "square-minus", "square-plus", "star",
    "star-half", "star-half-stroke", "sun", "thumbs-down", "thumbs-up", "trash-can", "truck",
    "user", "window-maximize", "window-minimize", "window-restore",
]);

/** The icon sizes, as token names: the font size is the icon box. */
export const ICON_SIZES = Object.freeze({ sm: "--icon-sm", md: "--icon-md", lg: "--icon-lg" });

/**
 * The Font Awesome classes for a Free icon name: `fa-regular fa-<name>` where
 * Free has a regular weight, `fa-solid fa-<name>` where it does not. A string
 * that already carries a family (`fa-brands fa-figma`) is returned as given.
 */
export const iconClass = (name) => {
    if (name.includes("fa-")) return name;
    return `${FREE_REGULAR_ICONS.has(name) ? "fa-regular" : "fa-solid"} fa-${name}`;
};
