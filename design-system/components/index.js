/**
 * @fileoverview Components - Main Index file
 * Exports all components organized by product pillar.
 */

// Universal components (available across all pillars)
// Import assets (logos, etc.)
import * as AssetComponents from '../assets/index.js';

// Export all components from their respective folders
export { createButton } from './Button/index.js';
export { createButtonGroup } from './ButtonGroup/index.js';
export { createAlert } from './Alert/index.js';
export { createToast, showToast, hideToastElement, clearAllToasts, createStaticToast } from './Toast/index.js';
export { createBreadcrumb } from './Breadcrumb/index.js';
export { createBadge, createChip } from './Badge/index.js';
export { createDivider } from './Divider/index.js';
export { createSuperCompPillDiv } from './SuperCompPill/index.js';
export { createDropdown } from './Dropdown/index.js';
export { createCard } from './Card/index.js';
export { createModal } from './Modal/index.js';
export { createNavigation } from './Navigation/index.js';
export { createNavbar } from './Navbar/index.js';
export { createTextarea, createSelect, createRangeInput, createSelectMultiple } from './Form/index.js';
export { createDatePicker } from './DatePicker/index.js';
export { createInputGroup } from './InputGroup/index.js';
export { createCollapse, createCollapseTrigger } from './Collapse/index.js';
export { createCarousel } from './Carousel/index.js';
export { createListGroup, createListGroupItem } from './ListGroup/index.js';
export { createJumbotron } from './Jumbotron/index.js';
export { createMediaObject, createNestedMediaObject } from './MediaObject/index.js';
export { createProgress, updateProgress } from './Progress/index.js';
export { createSpinner } from './Spinner/index.js';
export { createLoadingGif } from './LoadingGif/index.js';
export { createPopover, createPopoverButton, createStaticPopover } from './Popover/index.js';
export { createPagination } from './Pagination/index.js';
export { createTooltip, createTooltipButton, destroyAllTooltips, createStaticTooltip } from './Tooltip/index.js';
export { createScrollspy, createScrollspyContent } from './Scrollspy/index.js';
export { createRichTextEditor } from './RichTextEditor/index.js';
export { createSidebarTab } from './SidebarTab/index.js';
export { createUserAvatar } from './UserAvatar/index.js';
export { createStaticBadgeSmart } from './StaticBadgeSmart/index.js';
export { createCompetencyBadge } from './CompetencyBadge/index.js';
export { createCheckbox, createCheckboxGroup } from './Checkbox/index.js';
export { createRadio, createRadioGroup } from './Radio/index.js';
export { createSwitch } from './Switch/index.js';

// Export constants
export { BUTTON_CONSTANTS, SMART_CONSTANTS } from './constants.js';

// Product-specific components (specs)
// These are in specs/{Pillar}/ when implemented
export * as Login from '../specs/Login/index.js';
export * as Profile from '../specs/Profile/index.js';
export * as Home from '../specs/Home/index.js';
export * as Training from '../specs/Training/index.js';
export * as Toolkit from '../specs/Toolkit/index.js';
export * as Admin from '../specs/Admin/index.js';

// Note: Universal namespace removed to avoid circular dependency
// Import components directly or use individual exports instead

// Note: Direct exports removed - they're already exported above
// These were causing duplicate export errors

// Import functions directly from their source files to avoid circular dependency
import { createButton } from './Button/index.js';
import { createButtonGroup } from './ButtonGroup/index.js';
import { createCheckbox, createCheckboxGroup } from './Checkbox/index.js';
import { createRadio, createRadioGroup } from './Radio/index.js';
import { createSwitch } from './Switch/index.js';
import { createAlert } from './Alert/index.js';
import { createToast, showToast, hideToastElement } from './Toast/index.js';
import { createBreadcrumb } from './Breadcrumb/index.js';
import { createBadge, createChip } from './Badge/index.js';
import { createDivider } from './Divider/index.js';
import { createDropdown } from './Dropdown/index.js';
import { createCard } from './Card/index.js';
import { createModal } from './Modal/index.js';
import { createNavigation } from './Navigation/index.js';
import { createNavbar } from './Navbar/index.js';
import { createTextarea, createSelect, createRangeInput, createSelectMultiple } from './Form/index.js';
import { createDatePicker } from './DatePicker/index.js';
import { createInputGroup } from './InputGroup/index.js';
import { createCarousel } from './Carousel/index.js';
import { createCollapse, createCollapseTrigger } from './Collapse/index.js';
import { createListGroup, createListGroupItem } from './ListGroup/index.js';
import { createJumbotron } from './Jumbotron/index.js';
import { createMediaObject, createNestedMediaObject } from './MediaObject/index.js';
import { createProgress, updateProgress } from './Progress/index.js';
import { createSpinner } from './Spinner/index.js';
import { createLoadingGif } from './LoadingGif/index.js';
import { createPopover, createPopoverButton, createStaticPopover } from './Popover/index.js';
import { createPagination } from './Pagination/index.js';
import { createTooltip, createTooltipButton, destroyAllTooltips, createStaticTooltip } from './Tooltip/index.js';
import { createScrollspy, createScrollspyContent } from './Scrollspy/index.js';
import { createRichTextEditor } from './RichTextEditor/index.js';
import { createSuperCompPillDiv } from './SuperCompPill/index.js';
import { createCompetencyBadge } from './CompetencyBadge/index.js';
import { BUTTON_CONSTANTS, SMART_CONSTANTS } from './constants.js';

/**
 * Legacy PlusInterface class for backward compatibility
 */
export class PlusInterface {
    static createButton = createButton;
    static createButtonGroup = createButtonGroup;
    static createCheckbox = createCheckbox;
    static createCheckboxGroup = createCheckboxGroup;
    static createRadio = createRadio;
    static createRadioGroup = createRadioGroup;
    static createSwitch = createSwitch;
    static createAlert = createAlert;
    static createToast = createToast;
    static showToast = showToast;
    static hideToastElement = hideToastElement;
    static createBreadcrumb = createBreadcrumb;
    static createBadge = createBadge;
    static createChip = createChip;
    static createDivider = createDivider;
    static createDropdown = createDropdown;
    static createCard = createCard;
    static createModal = createModal;
    static createNavigation = createNavigation;
    static createNavbar = createNavbar;
    static createTextarea = createTextarea;
    static createSelect = createSelect;
    static createRangeInput = createRangeInput;
    static createSelectMultiple = createSelectMultiple;
    static createDatePicker = createDatePicker;
    static createInputGroup = createInputGroup;
    static createCarousel = createCarousel;
    static createCollapse = createCollapse;
    static createCollapseTrigger = createCollapseTrigger;
    static createListGroup = createListGroup;
    static createListGroupItem = createListGroupItem;
    static createJumbotron = createJumbotron;
    static createMediaObject = createMediaObject;
    static createNestedMediaObject = createNestedMediaObject;
    static createPopover = createPopover;
    static createPopoverButton = createPopoverButton;
    static createStaticPopover = createStaticPopover;
    static createPagination = createPagination;
    static createTooltip = createTooltip;
    static createTooltipButton = createTooltipButton;
    static createScrollspy = createScrollspy;
    static createScrollspyContent = createScrollspyContent;
    static createProgress = createProgress;
    static updateProgress = updateProgress;
    static createSpinner = createSpinner;
    static createLoadingGif = createLoadingGif;
    static createRichTextEditor = createRichTextEditor;
    static createLogo = AssetComponents.createLogo;
    static createCompetencyBadge = createCompetencyBadge;
    
    // Legacy constants
    static BUTTON_FILL = BUTTON_CONSTANTS.FILL;
    static BUTTON_STYLES = BUTTON_CONSTANTS.STYLES;
    static BUTTON_FONT_SIZES = BUTTON_CONSTANTS.FONT_SIZES;
    static ICON_STYLES = BUTTON_CONSTANTS.ICON_STYLES;
}

/**
 * Legacy PlusSmartComponents class for backward compatibility
 */
export class PlusSmartComponents {
    static createSuperCompPillDiv = createSuperCompPillDiv;
    
    // Legacy constants
    static CA_SE_FULL = SMART_CONSTANTS.CA_SE_FULL;
    static CA_SE = SMART_CONSTANTS.CA_SE;
    static CA_MC = SMART_CONSTANTS.CA_MC;
    static CA_ADV = SMART_CONSTANTS.CA_ADV;
    static CA_RELN = SMART_CONSTANTS.CA_RELN;
    static CA_TT = SMART_CONSTANTS.CA_TT;
    static STATUS_STARTED = SMART_CONSTANTS.STATUS_STARTED;
    static STATUS_COMPLETE = SMART_CONSTANTS.STATUS_COMPLETE;
    static STATUS_NOSTART = SMART_CONSTANTS.STATUS_NOSTART;
    static STATUS_ASSIGNED = SMART_CONSTANTS.STATUS_ASSIGNED;
    static STATUS_ICONS = SMART_CONSTANTS.STATUS_ICONS;
    static STATUS_COLORS = SMART_CONSTANTS.STATUS_COLORS;
    static STATUS_TEXT = SMART_CONSTANTS.STATUS_TEXT;
}
