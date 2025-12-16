/**
 * @fileoverview ToastTextButton component for Training Lessons specs
 * Toast notification with header, divider, body, and text button
 * Matches Figma design system specifications
 */

import { createButton } from '../../../../components/Button/index.js';

/**
 * Creates a ToastTextButton component
 * @param {Object} options - Toast configuration
 * @param {string} [options.title="Congratulations!"] - Toast title text
 * @param {string} [options.message="You've unlocked a new badge for completing all training lessons."] - Toast message text
 * @param {string} [options.buttonText="Claim My Badge"] - Text button label
 * @param {string} [options.icon="circle"] - Header icon name (Font Awesome)
 * @param {Function} [options.onClose] - Close button click handler
 * @param {Function} [options.onButtonClick] - Text button click handler
 * @returns {HTMLElement} Toast element
 */
export function createToastTextButton({
    title = "Congratulations!",
    message = "You've unlocked a new badge for completing all training lessons.",
    buttonText = "Claim My Badge",
    icon = "circle",
    onClose = null,
    onButtonClick = null
} = {}) {
    // Main toast container - Figma: bg-neutral-colors/surface, rounded element/radius-sm, shadow elevation
    const toast = document.createElement('div');
    toast.style.backgroundColor = 'var(--color-surface)';
    toast.style.borderRadius = 'var(--size-element-radius-sm)';
    toast.style.boxShadow = 'var(--elevation-light-3)';
    toast.style.display = 'flex';
    toast.style.flexDirection = 'column';
    toast.style.overflow = 'hidden';
    toast.style.maxWidth = '912px'; // Toast max width from design
    toast.style.width = '100%';
    toast.setAttribute('data-node-id', '63:178085');

    // Header - Figma: bg-neutral-colors/alternative/inverse-surface, padding element/pad-x-lg element/pad-y-lg
    const header = document.createElement('div');
    header.style.backgroundColor = 'var(--color-inverse-surface)';
    header.style.display = 'flex';
    header.style.gap = 'var(--size-element-gap-sm)';
    header.style.alignItems = 'center';
    header.style.padding = 'var(--size-element-pad-y-lg) var(--size-element-pad-x-lg)';
    header.style.width = '100%';
    header.setAttribute('data-node-id', '63:178086');

    // Icon - Figma: Font Awesome Solid, size 14px, color inverse-primary
    const iconEl = document.createElement('div');
    iconEl.style.display = 'flex';
    iconEl.style.alignItems = 'center';
    iconEl.style.justifyContent = 'center';
    iconEl.style.flexShrink = '0';
    iconEl.setAttribute('data-node-id', '63:178087');

    const iconInner = document.createElement('i');
    iconInner.className = `fas fa-${icon}`;
    iconInner.style.fontSize = 'var(--font-size-body2)';
    iconInner.style.color = 'var(--color-inverse-primary)';
    iconInner.style.lineHeight = '1.714';
    iconInner.style.textAlign = 'center';
    iconEl.appendChild(iconInner);
    header.appendChild(iconEl);

    // Title - Figma: Merriweather Sans Bold, size 16px, color inverse-on-surface
    const titleEl = document.createElement('div');
    titleEl.style.fontFamily = 'var(--font-family-body)';
    titleEl.style.fontSize = 'var(--font-size-body1)';
    titleEl.style.fontWeight = 'var(--font-weight-bold)';
    titleEl.style.lineHeight = '1.5';
    titleEl.style.color = 'var(--color-inverse-on-surface)';
    titleEl.style.flex = '1';
    titleEl.style.minWidth = '0';
    titleEl.textContent = title;
    header.appendChild(titleEl);

    // Close icon - Figma: Font Awesome Solid, size 14px, color inverse-on-surface
    const closeIcon = document.createElement('div');
    closeIcon.style.display = 'flex';
    closeIcon.style.alignItems = 'center';
    closeIcon.style.justifyContent = 'center';
    closeIcon.style.flexShrink = '0';
    closeIcon.style.cursor = 'pointer';
    closeIcon.setAttribute('data-node-id', '63:178090');

    const closeIconInner = document.createElement('i');
    closeIconInner.className = 'fas fa-xmark';
    closeIconInner.style.fontSize = 'var(--font-size-body2)';
    closeIconInner.style.color = 'var(--color-inverse-on-surface)';
    closeIconInner.style.lineHeight = '1.714';
    closeIconInner.style.textAlign = 'center';
    closeIcon.appendChild(closeIconInner);

    if (onClose) {
        closeIcon.addEventListener('click', onClose);
    }
    header.appendChild(closeIcon);

    toast.appendChild(header);

    // Divider - Figma: height 1px, bg surface-container-highest
    const divider = document.createElement('div');
    divider.style.height = 'var(--size-element-stroke-sm)'; // 1px
    divider.style.width = '100%';
    divider.style.position = 'relative';
    divider.setAttribute('data-node-id', '63:178091');

    const dividerLine = document.createElement('div');
    dividerLine.style.position = 'absolute';
    dividerLine.style.inset = '0';
    dividerLine.style.backgroundColor = 'var(--color-surface-container-highest)';
    dividerLine.style.borderRadius = 'var(--size-element-stroke-sm)'; // 1px
    divider.appendChild(dividerLine);
    toast.appendChild(divider);

    // Body - Figma: padding element/pad-x-lg element/pad-y-lg
    const body = document.createElement('div');
    body.style.display = 'flex';
    body.style.alignItems = 'center';
    body.style.padding = 'var(--size-element-pad-y-lg) var(--size-element-pad-x-lg)';
    body.style.width = '100%';
    body.setAttribute('data-node-id', '63:178092');

    // Message text - Figma: Merriweather Sans Light, size 12px, color on-surface
    const messageEl = document.createElement('div');
    messageEl.style.fontFamily = 'var(--font-family-body)';
    messageEl.style.fontSize = 'var(--font-size-body3)';
    messageEl.style.fontWeight = 'var(--font-weight-normal)';
    messageEl.style.lineHeight = '1.667';
    messageEl.style.color = 'var(--color-on-surface)';
    messageEl.style.flex = '1';
    messageEl.style.minWidth = '0';
    messageEl.textContent = message;
    body.appendChild(messageEl);

    // Text button - Figma: text button style
    const textButton = createButton({
        btnText: buttonText,
        btnStyle: 'primary',
        btnFill: 'text',
        btnSize: 'small'
    });
    textButton.style.flexShrink = '0';
    textButton.style.borderRadius = 'var(--size-element-radius-sm)';
    textButton.setAttribute('data-node-id', '63:178094');

    if (onButtonClick) {
        textButton.addEventListener('click', onButtonClick);
    }
    body.appendChild(textButton);

    toast.appendChild(body);

    return toast;
}

