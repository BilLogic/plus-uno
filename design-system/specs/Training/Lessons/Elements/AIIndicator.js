/**
 * @fileoverview AI Indicator component for Training Lessons specs
 * AI Indicator icon button
 * Matches Figma design system specifications
 */

/**
 * Creates an AI Indicator component
 * @param {Object} options - Indicator configuration
 * @param {Function} [options.onClick] - Click handler
 * @returns {HTMLElement} AI Indicator element
 */
export function createAiIndicator({
    onClick = null
} = {}) {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'flex-start';
    container.style.width = '36px';
    container.style.height = '36px';
    container.setAttribute('data-node-id', '63:177685');

    // Button wrapper - Figma: size-full (36px), padding spacer-2-5 (6px) x spacer-3-5 (10px)
    const button = document.createElement('button');
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.width = '100%';
    button.style.height = '100%';
    button.style.minWidth = '36px';
    button.style.minHeight = '36px';
    button.style.padding = '6px 10px';
    button.style.border = 'none';
    button.style.background = 'transparent';
    button.style.borderRadius = 'var(--size-element-radius-md)';
    button.style.cursor = 'pointer';
    button.setAttribute('data-node-id', 'I63:177686;979:19820');

    // AI icon - Figma: LeadingVisual, SVG icon 9x16 viewBox
    const iconWrapper = document.createElement('div');
    iconWrapper.style.position = 'relative';
    iconWrapper.style.width = '9px';
    iconWrapper.style.height = '16px';
    iconWrapper.style.flexShrink = '0';
    iconWrapper.style.display = 'flex';
    iconWrapper.style.alignItems = 'center';
    iconWrapper.style.justifyContent = 'center';
    iconWrapper.setAttribute('data-node-id', 'I63:177686;979:19820;31:648');

    // SVG AI Indicator icon - Exact replication from Figma (node-id: 1418-637)
    const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgIcon.setAttribute('width', '9');
    svgIcon.setAttribute('height', '16');
    svgIcon.setAttribute('viewBox', '0 0 9 16');
    svgIcon.setAttribute('fill', 'none');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M4.99334 6.2455C5.07584 5.9155 5.42534 5.9155 5.50784 6.2455L5.99159 8.1825C6.09807 8.6083 6.27747 8.99518 6.51557 9.31248C6.75367 9.62978 7.04393 9.86876 7.36334 10.0105L8.81534 10.6555C9.06284 10.7655 9.06284 11.2315 8.81534 11.3415L7.36259 11.9865C7.04324 12.1285 6.75308 12.3677 6.51511 12.6851C6.27714 13.0026 6.09789 13.3896 5.99159 13.8155L5.50784 15.7515C5.49005 15.8238 5.4556 15.8867 5.40941 15.9313C5.36321 15.9759 5.30763 15.9999 5.25059 15.9999C5.19355 15.9999 5.13797 15.9759 5.09177 15.9313C5.04558 15.8867 5.01113 15.8238 4.99334 15.7515L4.50959 13.8145C4.40319 13.3888 4.2239 13.002 3.98594 12.6847C3.74797 12.3674 3.45786 12.1284 3.13859 11.9865L1.68584 11.3415C1.63164 11.3178 1.58445 11.2719 1.55099 11.2103C1.51753 11.1487 1.49952 11.0746 1.49952 10.9985C1.49952 10.9224 1.51753 10.8483 1.55099 10.7867C1.58445 10.7251 1.63164 10.6792 1.68584 10.6555L3.13859 10.0105C3.45786 9.86863 3.74797 9.62958 3.98594 9.3123C4.2239 8.99501 4.40319 8.6082 4.50959 8.1825L4.99334 6.2455ZM2.09609 1.1465C2.10684 1.1032 2.12756 1.06551 2.1553 1.0388C2.18303 1.01209 2.21638 0.997716 2.25059 0.997716C2.2848 0.997716 2.31815 1.01209 2.34588 1.0388C2.37362 1.06551 2.39434 1.1032 2.40509 1.1465L2.69534 2.3085C2.82509 2.8265 3.12959 3.2325 3.51809 3.4055L4.38959 3.7925C4.42207 3.80684 4.45033 3.83447 4.47037 3.87145C4.4904 3.90843 4.50118 3.95288 4.50118 3.9985C4.50118 4.04412 4.4904 4.08858 4.47037 4.12556C4.45033 4.16254 4.42207 4.19016 4.38959 4.2045L3.51809 4.5915C3.32648 4.67662 3.15238 4.82007 3.00957 5.01048C2.86676 5.20089 2.75918 5.43303 2.69534 5.6885L2.40509 6.8505C2.39434 6.89381 2.37362 6.93149 2.34588 6.9582C2.31815 6.98491 2.2848 6.99929 2.25059 6.99929C2.21638 6.99929 2.18303 6.98491 2.1553 6.9582C2.12756 6.93149 2.10684 6.89381 2.09609 6.8505L1.80584 5.6885C1.742 5.43303 1.63442 5.20089 1.49161 5.01048C1.3488 4.82007 1.1747 4.67662 0.98309 4.5915L0.11159 4.2045C0.0791111 4.19016 0.0508473 4.16254 0.0308148 4.12556C0.0107823 4.08858 0 4.04412 0 3.9985C0 3.95288 0.0107823 3.90843 0.0308148 3.87145C0.0508473 3.83447 0.0791111 3.80684 0.11159 3.7925L0.98309 3.4055C1.1747 3.32039 1.3488 3.17694 1.49161 2.98653C1.63442 2.79612 1.742 2.56398 1.80584 2.3085L2.09609 1.1465ZM7.39784 0.0975026C7.40524 0.0690289 7.41912 0.0443386 7.43753 0.0268642C7.45595 0.00938991 7.47799 0 7.50059 0C7.52319 0 7.54523 0.00938991 7.56365 0.0268642C7.58206 0.0443386 7.59594 0.0690289 7.60334 0.0975026L7.79684 0.871503C7.88309 1.2175 8.08634 1.4885 8.34584 1.6035L8.92634 1.8615C8.94769 1.87137 8.96621 1.88987 8.97932 1.91443C8.99242 1.93898 8.99947 1.96837 8.99947 1.9985C8.99947 2.02864 8.99242 2.05803 8.97932 2.08258C8.96621 2.10713 8.94769 2.12563 8.92634 2.1355L8.34584 2.3935C8.21796 2.45023 8.10175 2.54592 8.00645 2.67299C7.91115 2.80005 7.83938 2.95499 7.79684 3.1255L7.60334 3.8995C7.59594 3.92798 7.58206 3.95267 7.56365 3.97014C7.54523 3.98762 7.52319 3.99701 7.50059 3.99701C7.47799 3.99701 7.45595 3.98762 7.43753 3.97014C7.41912 3.95267 7.40524 3.92798 7.39784 3.8995L7.20434 3.1255C7.1618 2.95499 7.09003 2.80005 6.99473 2.67299C6.89943 2.54592 6.78322 2.45023 6.65534 2.3935L6.07559 2.1355C6.05423 2.12563 6.03572 2.10713 6.02261 2.08258C6.00951 2.05803 6.00246 2.02864 6.00246 1.9985C6.00246 1.96837 6.00951 1.93898 6.02261 1.91443C6.03572 1.88987 6.05423 1.87137 6.07559 1.8615L6.65609 1.6035C6.91559 1.4885 7.11884 1.2175 7.20509 0.871503L7.39784 0.0985026V0.0975026Z');
    path.setAttribute('fill', '#0472A8');
    svgIcon.appendChild(path);
    
    iconWrapper.appendChild(svgIcon);
    button.appendChild(iconWrapper);

    if (onClick) {
        button.addEventListener('click', onClick);
    }

    container.appendChild(button);

    return container;
}
