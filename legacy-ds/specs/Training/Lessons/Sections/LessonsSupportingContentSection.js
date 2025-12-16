/**
 * @fileoverview LessonsSupportingContentSection component for Training Lessons specs
 * Welcome section with tabs and jumbotron content
 * Matches Figma design system specifications exactly (node-id=63-178182)
 */

import { PlusInterface } from '../../../../components/index.js';

/**
 * Creates a LessonsSupportingContentSection component
 * @param {Object} options - Section configuration
 * @param {string} [options.userName='Charmaine'] - User name for greeting
 * @param {Function} [options.onSignUp] - Sign up button click handler
 * @param {Function} [options.onViewSchedule] - View schedule button click handler
 * @returns {HTMLElement} Section element
 */
export function createLessonsSupportingContentSection({
    userName = 'Charmaine',
    onSignUp = null,
    onViewSchedule = null
} = {}) {
    // Section container - Figma: w-[1112px], px-[var(--section/pad-x-sm,16px)] py-[var(--section/pad-y-sm,16px)], gap-[var(--section/gap-sm,8px)]
    const section = document.createElement('div');
    section.style.boxSizing = 'border-box';
    section.style.display = 'flex';
    section.style.gap = 'var(--size-section-gap-sm)';
    section.style.alignItems = 'flex-start';
    section.style.justifyContent = 'center';
    section.style.padding = 'var(--size-section-pad-y-sm) var(--size-section-pad-x-sm)';
    section.style.position = 'relative';
    section.style.width = '1112px';

    // Homepage Jumbotron container
    const jumbotronContainer = document.createElement('div');
    jumbotronContainer.style.display = 'flex';
    jumbotronContainer.style.flexDirection = 'column';
    jumbotronContainer.style.gap = 'var(--size-section-gap-sm)';
    jumbotronContainer.style.alignItems = 'flex-start';
    jumbotronContainer.style.flexGrow = '1';
    jumbotronContainer.style.position = 'relative';
    jumbotronContainer.style.flexShrink = '0';

    // Nav Horizontal - Figma: flex items-end
    const navHorizontal = document.createElement('div');
    navHorizontal.style.display = 'flex';
    navHorizontal.style.alignItems = 'flex-end';
    navHorizontal.style.position = 'relative';
    navHorizontal.style.flexShrink = '0';
    navHorizontal.style.width = '100%';

    // Nav Tabs
    const navTabs = document.createElement('div');
    navTabs.style.display = 'flex';
    navTabs.style.alignItems = 'center';
    navTabs.style.position = 'relative';
    navTabs.style.flexShrink = '0';

    // Selected tab - Figma: border-[0px_0px_2px] border-[var(--_secondary/secondary,#445c6a)]
    const selectedTab = createTabItem('Sign Up / Edit', true);
    navTabs.appendChild(selectedTab);

    // Unselected tabs
    const tab2 = createTabItem('Tab', false);
    navTabs.appendChild(tab2);

    const tab3 = createTabItem('Tab', false);
    navTabs.appendChild(tab3);

    navHorizontal.appendChild(navTabs);

    // Divider - Figma: flex-grow divider
    const divider = document.createElement('div');
    divider.style.flexGrow = '1';
    divider.style.height = '1px';
    divider.style.backgroundColor = 'var(--color-outline-variant)';
    divider.style.position = 'relative';
    divider.style.flexShrink = '0';
    navHorizontal.appendChild(divider);

    jumbotronContainer.appendChild(navHorizontal);

    // Jumbotron content - Figma: gap-[var(--element/pad-y-lg,8px)]
    const jumbotron = document.createElement('div');
    jumbotron.style.display = 'flex';
    jumbotron.style.flexDirection = 'column';
    jumbotron.style.gap = 'var(--size-element-pad-y-lg)';
    jumbotron.style.alignItems = 'center';
    jumbotron.style.justifyContent = 'center';
    jumbotron.style.position = 'relative';
    jumbotron.style.flexShrink = '0';
    jumbotron.style.width = '100%';

    // Header - Figma: gap-[var(--spacing/small/space-100,8px)]
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.flexDirection = 'column';
    header.style.gap = '8px';
    header.style.alignItems = 'flex-start';
    header.style.position = 'relative';
    header.style.flexShrink = '0';
    header.style.width = '100%';

    // Header text - Figma: font-['Lato:Bold'], text-[28px], leading-[1.4]
    const headerText = document.createElement('p');
    headerText.style.fontFamily = 'var(--font-family-header)';
    headerText.style.fontSize = '28px';
    headerText.style.fontWeight = 'var(--font-weight-bold)';
    headerText.style.lineHeight = '1.4';
    headerText.style.fontStyle = 'normal';
    headerText.style.position = 'relative';
    headerText.style.flexShrink = '0';
    headerText.style.color = 'var(--color-on-surface-variant)';
    headerText.style.width = '100%';
    headerText.textContent = `Sign up for your next session, ${userName}!`;
    header.appendChild(headerText);
    jumbotron.appendChild(header);

    // Body - Figma: gap-[var(--element/gap-sm,8px)]
    const body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    body.style.gap = 'var(--size-element-gap-sm)';
    body.style.alignItems = 'flex-start';
    body.style.position = 'relative';
    body.style.flexShrink = '0';
    body.style.width = '100%';

    // Body text - Figma: font-['Merriweather_Sans:Light'], text-[16px], leading-[28px]
    const bodyText = document.createElement('p');
    bodyText.style.fontFamily = 'var(--font-family-body)';
    bodyText.style.fontSize = 'var(--font-size-body1)';
    bodyText.style.fontWeight = 'var(--font-weight-normal)';
    bodyText.style.lineHeight = '28px';
    bodyText.style.position = 'relative';
    bodyText.style.flexShrink = '0';
    bodyText.style.color = 'var(--color-on-surface-variant)';
    bodyText.style.width = '100%';
    bodyText.textContent = 'Your students are counting on you! Click below to sign up for your next session and edit if needed.';
    body.appendChild(bodyText);

    // Button container - Figma: gap-[var(--element/gap-lg,12px)]
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = 'var(--size-element-gap-lg)';
    buttonContainer.style.alignItems = 'center';
    buttonContainer.style.position = 'relative';
    buttonContainer.style.flexShrink = '0';
    buttonContainer.style.width = '100%';

    // Sign up button - Figma: Filled button with icon
    const signUpButton = PlusInterface.createButton({
        btnText: 'Sign up now',
        btnStyle: 'primary',
        btnFill: 'filled',
        btnSize: 'default',
        buttonOnClick: onSignUp,
        icon: 'plus',
        iconPosition: 'left',
        iconStyle: 'solid'
    });
    signUpButton.style.flexShrink = '0';
    buttonContainer.appendChild(signUpButton);

    // View schedule button - Figma: Tonal button
    const viewScheduleButton = PlusInterface.createButton({
        btnText: 'View schedule',
        btnStyle: 'secondary',
        btnFill: 'tonal',
        btnSize: 'default',
        buttonOnClick: onViewSchedule
    });
    viewScheduleButton.style.flexShrink = '0';
    buttonContainer.appendChild(viewScheduleButton);

    body.appendChild(buttonContainer);
    jumbotron.appendChild(body);
    jumbotronContainer.appendChild(jumbotron);
    section.appendChild(jumbotronContainer);

    return section;
}

/**
 * Creates a tab item
 * @param {string} text - Tab text
 * @param {boolean} selected - Whether tab is selected
 * @returns {HTMLElement} Tab item element
 */
function createTabItem(text, selected = false) {
    const tab = document.createElement('div');
    
    if (selected) {
        // Selected tab - Figma: border-[0px_0px_2px] border-[var(--_secondary/secondary,#445c6a)]
        tab.style.borderBottom = '2px solid var(--color-secondary)';
        tab.style.borderTop = 'none';
        tab.style.borderLeft = 'none';
        tab.style.borderRight = 'none';
        tab.style.borderStyle = 'solid';
        tab.style.borderRadius = 'var(--size-element-radius-md) var(--size-element-radius-md) 0 0';
    } else {
        // Unselected tab - Figma: border-[0px_0px_1px] border-[var(--neutral-colors/outline-variant,#bec8ca)]
        tab.style.borderBottom = '1px solid var(--color-outline-variant)';
        tab.style.borderTop = 'none';
        tab.style.borderLeft = 'none';
        tab.style.borderRight = 'none';
        tab.style.borderStyle = 'solid';
        tab.style.borderRadius = 'var(--size-element-radius-md) var(--size-element-radius-md) 0 0';
        tab.style.cursor = 'pointer';
    }

    tab.style.position = 'relative';
    tab.style.flexShrink = '0';

    const tabInner = document.createElement('div');
    tabInner.style.display = 'flex';
    tabInner.style.alignItems = 'center';
    tabInner.style.justifyContent = 'center';
    tabInner.style.overflow = 'hidden';
    tabInner.style.position = 'relative';
    tabInner.style.borderRadius = 'inherit';

    const tabItem = document.createElement('div');
    tabItem.style.boxSizing = 'border-box';
    tabItem.style.display = 'flex';
    tabItem.style.gap = 'var(--size-element-gap-lg)';
    tabItem.style.alignItems = 'center';
    tabItem.style.justifyContent = 'center';
    tabItem.style.overflow = 'hidden';
    tabItem.style.padding = 'var(--size-element-pad-y-lg) var(--size-element-pad-x-lg)';
    tabItem.style.position = 'relative';
    tabItem.style.flexShrink = '0';
    tabItem.style.minWidth = '36px';

    const tabText = document.createElement('div');
    tabText.style.fontFamily = 'var(--font-family-body)';
    tabText.style.fontSize = 'var(--font-size-body1)';
    tabText.style.fontWeight = selected ? 'var(--font-weight-semibold-1)' : 'var(--font-weight-normal)';
    tabText.style.lineHeight = '1.5';
    tabText.style.color = selected ? 'var(--color-secondary-text)' : 'var(--color-on-surface)';
    tabText.style.whiteSpace = 'nowrap';
    tabText.style.flexShrink = '0';
    tabText.textContent = text;
    tabItem.appendChild(tabText);

    tabInner.appendChild(tabItem);
    tab.appendChild(tabInner);

    return tab;
}

