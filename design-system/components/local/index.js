/**
 * @fileoverview Components - Main Index file
 * Exports all components organized by product pillar.
 */

// Universal components (available across all pillars)
export * as Universal from './universal/index.js';

// Product-specific components (placeholders for future expansion)
export * as Login from './login/index.js';
export * as Profile from './profile/index.js';
export * as Home from './home/index.js';
export * as Training from './training/index.js';
export * as Toolkit from './toolkit/index.js';
export * as Admin from './admin/index.js';

// Legacy exports for backward compatibility
import * as UniversalComponents from './universal/index.js';

// Direct exports for convenience (used in Storybook stories)
export { createTooltip, createTooltipButton, destroyAllTooltips } from './universal/index.js';
export { createPopover, createPopoverButton } from './universal/index.js';
export { createProgress, updateProgress } from './universal/index.js';
export { clearAllToasts } from './universal/index.js';

/**
 * Legacy PlusInterface class for backward compatibility
 */
export class PlusInterface {
    static createButton = UniversalComponents.createButton;
    static createButtonGroup = UniversalComponents.createButtonGroup;
    static createCheckbox = UniversalComponents.createCheckbox;
    static createCheckboxGroup = UniversalComponents.createCheckboxGroup;
    static createRadio = UniversalComponents.createRadio;
    static createRadioGroup = UniversalComponents.createRadioGroup;
    static createSwitch = UniversalComponents.createSwitch;
    static createAlert = UniversalComponents.createAlert;
    static createToast = UniversalComponents.createToast;
    static showToast = UniversalComponents.showToast;
    static hideToastElement = UniversalComponents.hideToastElement;
    static createBreadcrumb = UniversalComponents.createBreadcrumb;
    static createBadge = UniversalComponents.createBadge;
    static createChip = UniversalComponents.createChip;
    static createDivider = UniversalComponents.createDivider;
    static createDropdown = UniversalComponents.createDropdown;
    static createCard = UniversalComponents.createCard;
    static createModal = UniversalComponents.createModal;
    static createNavigation = UniversalComponents.createNavigation;
    static createTextarea = UniversalComponents.createTextarea;
    static createSelect = UniversalComponents.createSelect;
    static createRangeInput = UniversalComponents.createRangeInput;
    static createSelectMultiple = UniversalComponents.createSelectMultiple;
    static createDatePicker = UniversalComponents.createDatePicker;
    static createInputGroup = UniversalComponents.createInputGroup;
    static createCarousel = UniversalComponents.createCarousel;
    static createCollapse = UniversalComponents.createCollapse;
    static createCollapseTrigger = UniversalComponents.createCollapseTrigger;
    static createListGroup = UniversalComponents.createListGroup;
    static createListGroupItem = UniversalComponents.createListGroupItem;
    static createJumbotron = UniversalComponents.createJumbotron;
    static createMediaObject = UniversalComponents.createMediaObject;
    static createNestedMediaObject = UniversalComponents.createNestedMediaObject;
    static createPopover = UniversalComponents.createPopover;
    static createPopoverButton = UniversalComponents.createPopoverButton;
    static createPagination = UniversalComponents.createPagination;
    static createTooltip = UniversalComponents.createTooltip;
    static createTooltipButton = UniversalComponents.createTooltipButton;
    static initScrollspy = UniversalComponents.initScrollspy;
    static createScrollspy = UniversalComponents.createScrollspy;
    static createProgress = UniversalComponents.createProgress;
    static updateProgress = UniversalComponents.updateProgress;
    static createSpinner = UniversalComponents.createSpinner;
    static createLoadingGif = UniversalComponents.createLoadingGif;
    static createRichTextEditor = UniversalComponents.createRichTextEditor;
    
    // Legacy constants
    static BUTTON_FILL = UniversalComponents.BUTTON_CONSTANTS.FILL;
    static BUTTON_STYLES = UniversalComponents.BUTTON_CONSTANTS.STYLES;
    static BUTTON_FONT_SIZES = UniversalComponents.BUTTON_CONSTANTS.FONT_SIZES;
    static ICON_STYLES = UniversalComponents.BUTTON_CONSTANTS.ICON_STYLES;
}

/**
 * Legacy PlusSmartComponents class for backward compatibility
 */
export class PlusSmartComponents {
    static createStatusIcon = UniversalComponents.createStatusIcon;
    static createContentStatusTag = UniversalComponents.createContentStatusTag;
    static createSuperCompPillDiv = UniversalComponents.createSuperCompPillDiv;
    
    // Legacy constants
    static CA_SE_FULL = UniversalComponents.SMART_CONSTANTS.CA_SE_FULL;
    static CA_SE = UniversalComponents.SMART_CONSTANTS.CA_SE;
    static CA_MC = UniversalComponents.SMART_CONSTANTS.CA_MC;
    static CA_ADV = UniversalComponents.SMART_CONSTANTS.CA_ADV;
    static CA_RELN = UniversalComponents.SMART_CONSTANTS.CA_RELN;
    static CA_TT = UniversalComponents.SMART_CONSTANTS.CA_TT;
    static STATUS_STARTED = UniversalComponents.SMART_CONSTANTS.STATUS_STARTED;
    static STATUS_COMPLETE = UniversalComponents.SMART_CONSTANTS.STATUS_COMPLETE;
    static STATUS_NOSTART = UniversalComponents.SMART_CONSTANTS.STATUS_NOSTART;
    static STATUS_ASSIGNED = UniversalComponents.SMART_CONSTANTS.STATUS_ASSIGNED;
    static STATUS_ICONS = UniversalComponents.SMART_CONSTANTS.STATUS_ICONS;
    static STATUS_COLORS = UniversalComponents.SMART_CONSTANTS.STATUS_COLORS;
    static STATUS_TEXT = UniversalComponents.SMART_CONSTANTS.STATUS_TEXT;
}

