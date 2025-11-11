/**
 * @fileoverview Button component for PLUS design system.
 * Universal element component for creating buttons with various styles and fills.
 */

import { BUTTON_CONSTANTS } from '../constants.js';

/**
 * Creates a button element styled according to PLUS design system
 * @param {Object} options - Button configuration options
 * @param {string} [options.tagType] - HTML tag type, defaults to "button" or "a" if btnLink provided
 * @param {string} [options.btnId] - Button ID
 * @param {string} [options.btnText] - Button text
 * @param {string} options.btnStyle - Button style (see BUTTON_STYLES)
 * @param {string} options.btnFill - Button fill (see BUTTON_FILL)
 * @param {string} [options.btnSize] - Button size ("small", "default", "large")
 * @param {Function} [options.buttonOnClick] - Click handler function
 * @param {string} [options.icon] - Font Awesome icon name (without "fa-" prefix)
 * @param {string} [options.iconPosition] - Icon position ("left" or "right"), default "left"
 * @param {string} [options.iconStyle] - Icon style ("solid" or "regular"), default "solid"
 * @param {string|Object} [options.btnLink] - If provided, creates anchor tag instead of button
 * @param {Array} [options.classes] - Additional CSS classes
 * @param {Object} [options.styles] - Additional inline styles
 * @param {boolean} [options.enabled=true] - Whether button is enabled
 * @param {string} [options.tooltip] - Tooltip text
 * @param {boolean} [options.verticalLayout=false] - Vertical button layout
 * @param {string} [options.imageUrl] - Image URL for image button
 * @returns {HTMLElement} Button element
 */
export function createButton({
    tagType = null,
    btnId,
    btnText,
    btnStyle,
    btnFill,
    btnSize = "default",
    buttonOnClick = null,
    icon = null,
    iconPosition = "left",
    iconStyle = "solid",
    btnLink = false,
    classes = [],
    styles = null,
    enabled = true,
    tooltip = null,
    verticalLayout = false,
    imageUrl = null
}) {
    tagType = tagType || (btnLink ? "a" : "button");
    const button = document.createElement(tagType);

    button.type = "button";
    button.classList.add("pbtn", BUTTON_CONSTANTS.STYLES[btnStyle], BUTTON_CONSTANTS.FILL[btnFill]);
    if (btnFill !== "filled") {
        button.classList.add("pbtn-not-filled");
    }

    if (btnSize) {
        button.classList.add(btnSize);
    }
    
    if (btnId) {
        button.id = btnId;
    }
    
    if (btnLink) {
        button.href = (typeof btnLink === "string") ? btnLink : btnLink.href;
        button.target = btnLink.target ?? "";
    } else if (buttonOnClick) {
        button.addEventListener("click", buttonOnClick);
    }

    const stateScreen = document.createElement("div");
    stateScreen.classList.add("pbtn-state-screen", BUTTON_CONSTANTS.FILL[btnFill]);
    if (btnSize) {
        stateScreen.classList.add(btnSize);
    }

    let iconHtml = "";
    if (icon) {
        iconHtml = `<span><i class="${BUTTON_CONSTANTS.ICON_STYLES[iconStyle]} fa-${icon}"></i></span>`;
    } else if (imageUrl) {
        iconHtml = `<img class="pbtn-image" src="${imageUrl}" alt="">`;
    }
    
    let textHtml;
    if (btnText) {
        textHtml = iconPosition === 'left' 
            ? iconHtml + `<span>${btnText}</span>` 
            : `<span>${btnText}</span>` + iconHtml;
    } else {
        textHtml = iconHtml;
    }

    const buttonContent = document.createElement("div");
    buttonContent.classList.add("pbtn-content", BUTTON_CONSTANTS.FONT_SIZES[btnSize] || "body2-txt");
    buttonContent.innerHTML = textHtml;

    stateScreen.appendChild(buttonContent);
    button.appendChild(stateScreen);

    if (verticalLayout) {
        button.classList.add("pbtn-vertical");
    }
    
    if (classes && classes.length > 0) {
        button.classList.add(...classes);
    }
    
    if (styles) {
        for (let prop in styles) {
            button.style[prop] = styles[prop];
        }
    }

    if (tooltip) {
        button.setAttribute("title", tooltip);
        button.setAttribute("data-toggle", "tooltip");
    }

    if (!enabled) {
        if (btnLink) {
            button.classList.add("disabled");
        } else {
            button.disabled = true;
        }
    }

    return button;
}

