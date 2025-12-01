/**
 * @fileoverview OnboardingOverviewPage component for Training Onboarding Pages
 * Full page layout for Onboarding Overview with featured modules and all modules table
 * Matches Figma design system specifications
 * 
 * Figma: node-id 74-121828
 */

import { createTopBar } from '../../../Universal/Sections/topbar.js';
import { createOnboardingModuleCard } from '../Cards/OnboardingModuleCard.js';
import { createOnboardingModulesTableRow } from '../Tables/OnboardingModulesTable.js';
import { createSortingDropdown } from '../Elements/SortingDropdown.js';
import { createButton } from '../../../../components/Button/index.js';

/**
 * Creates an Onboarding Overview Page component
 * @param {Object} options - Page configuration
 * @returns {HTMLElement} Page element
 */
export function createOnboardingOverviewPage() {
    const page = document.createElement("div");
    page.style.display = "flex";
    page.style.flexDirection = "column";
    page.style.backgroundColor = "var(--color-surface-container)";
    page.style.maxWidth = "991.98px";
    page.style.minWidth = "768px";
    page.style.padding = "var(--size-surface-container-pad-y-sm) var(--size-surface-container-pad-x-sm)";
    page.style.gap = "var(--size-surface-container-gap-sm)";
    page.style.width = "var(--breakpoints-min-width, 768px)";
    
    // Top bar
    const topBar = createTopBar({
        mode: "expanded",
        breadcrumbItems: [
            { text: "Home", href: "#" },
            { text: "Onboarding" }
        ],
        userName: "John Doe",
        userFirstChar: "J",
        counterValue: 2
    });
    page.appendChild(topBar);
    
    // Main container
    const mainContainer = document.createElement("div");
    mainContainer.style.display = "flex";
    mainContainer.style.flexDirection = "column";
    mainContainer.style.gap = "var(--size-surface-container-gap-sm)";
    mainContainer.style.alignItems = "flex-start";
    mainContainer.style.width = "100%";
    
    // Content container
    const contentContainer = document.createElement("div");
    contentContainer.style.display = "flex";
    contentContainer.style.flexDirection = "column";
    contentContainer.style.backgroundColor = "var(--color-surface)";
    contentContainer.style.gap = "var(--size-surface-gap-md)";
    contentContainer.style.alignItems = "center";
    contentContainer.style.padding = "var(--size-surface-pad-y) var(--size-surface-pad-x)";
    contentContainer.style.borderRadius = "var(--size-surface-radius)";
    contentContainer.style.flex = "1";
    contentContainer.style.minHeight = "0";
    contentContainer.style.minWidth = "0";
    contentContainer.style.overflowX = "clip";
    contentContainer.style.overflowY = "auto";
    
    // Featured Modules Container
    const featuredModulesContainer = document.createElement("div");
    featuredModulesContainer.style.display = "flex";
    featuredModulesContainer.style.flexDirection = "column";
    featuredModulesContainer.style.gap = "var(--size-section-gap-lg)";
    featuredModulesContainer.style.alignItems = "flex-start";
    featuredModulesContainer.style.width = "100%";
    
    // Featured Modules List
    const featuredModulesList = document.createElement("div");
    featuredModulesList.style.display = "flex";
    featuredModulesList.style.flexDirection = "column";
    featuredModulesList.style.gap = "var(--size-section-gap-sm)";
    featuredModulesList.style.alignItems = "flex-end";
    featuredModulesList.style.justifyContent = "flex-end";
    featuredModulesList.style.width = "100%";
    
    // Container with title and controls
    const titleControlsContainer = document.createElement("div");
    titleControlsContainer.style.display = "flex";
    titleControlsContainer.style.alignItems = "center";
    titleControlsContainer.style.justifyContent = "space-between";
    titleControlsContainer.style.width = "100%";
    
    // Title
    const titleContainer = document.createElement("div");
    titleContainer.style.display = "flex";
    titleContainer.style.gap = "16px";
    titleContainer.style.alignItems = "flex-start";
    titleContainer.style.width = "196px";
    
    const title = document.createElement("h4");
    title.className = "h4";
    title.style.margin = "0";
    title.style.whiteSpace = "pre";
    title.textContent = "Featured Modules ";
    
    titleContainer.appendChild(title);
    titleControlsContainer.appendChild(titleContainer);
    
    // Controls (carousel navigation)
    const controlsContainer = document.createElement("div");
    controlsContainer.style.display = "flex";
    controlsContainer.style.gap = "var(--size-element-gap-sm)";
    controlsContainer.style.alignItems = "center";
    controlsContainer.style.justifyContent = "center";
    
    // Left arrow button (disabled/opacity)
    const leftArrowButton = createButton({
        btnText: "",
        btnStyle: "default",
        btnFill: "outline",
        btnSize: "small",
        icon: "arrow-left",
        classes: []
    });
    leftArrowButton.style.opacity = "0.38";
    controlsContainer.appendChild(leftArrowButton);
    
    // Right arrow button (active)
    const rightArrowButton = createButton({
        btnText: "",
        btnStyle: "primary",
        btnFill: "outline",
        btnSize: "small",
        icon: "arrow-right",
        classes: []
    });
    controlsContainer.appendChild(rightArrowButton);
    
    titleControlsContainer.appendChild(controlsContainer);
    featuredModulesList.appendChild(titleControlsContainer);
    
    // Assigned Resource section (carousel container)
    const assignedResourceSection = document.createElement("div");
    assignedResourceSection.style.backgroundColor = "var(--color-surface-container-low)";
    assignedResourceSection.style.borderRadius = "var(--size-section-radius-sm)";
    assignedResourceSection.style.display = "flex";
    assignedResourceSection.style.flexDirection = "column";
    assignedResourceSection.style.gap = "var(--size-section-gap-md)";
    assignedResourceSection.style.alignItems = "flex-start";
    assignedResourceSection.style.padding = "var(--size-section-pad-y-md) var(--size-section-pad-x-md)";
    assignedResourceSection.style.overflow = "clip";
    assignedResourceSection.style.width = "100%";
    
    // Inner wrap (horizontal scrollable cards)
    const innerWrap = document.createElement("div");
    innerWrap.style.display = "flex";
    innerWrap.style.flexWrap = "nowrap";
    innerWrap.style.gap = "var(--size-element-gap-md)";
    innerWrap.style.height = "348px";
    innerWrap.style.alignItems = "flex-start";
    innerWrap.style.overflowX = "auto";
    innerWrap.style.overflowY = "hidden";
    innerWrap.style.width = "100%";
    innerWrap.style.scrollBehavior = "smooth";
    innerWrap.style.webkitOverflowScrolling = "touch";
    
    // Card 1: Welcome to PLUS
    const card1 = createOnboardingModuleCard({
        moduleTitle: "Welcome to PLUS",
        duration: "9 mins",
        state: "default",
        badgeType: "other",
        stage: "not started"
    });
    innerWrap.appendChild(card1);
    
    // Card 2: Your Role at PLUS
    const card2 = createOnboardingModuleCard({
        moduleTitle: "Your Role at PLUS",
        duration: "9 mins",
        state: "default",
        badgeType: "other",
        stage: "not started"
    });
    innerWrap.appendChild(card2);
    
    // Card 3: Tutoring Session Overview
    const card3 = createOnboardingModuleCard({
        moduleTitle: "Tutoring Session Overview",
        duration: "9 mins",
        state: "default",
        badgeType: "other",
        stage: "not started"
    });
    innerWrap.appendChild(card3);
    
    assignedResourceSection.appendChild(innerWrap);
    featuredModulesList.appendChild(assignedResourceSection);
    featuredModulesContainer.appendChild(featuredModulesList);
    
    // All Modules Container
    const allModulesContainer = document.createElement("div");
    allModulesContainer.style.display = "flex";
    allModulesContainer.style.flexDirection = "column";
    allModulesContainer.style.gap = "var(--size-section-gap-sm)";
    allModulesContainer.style.alignItems = "flex-end";
    allModulesContainer.style.justifyContent = "flex-end";
    allModulesContainer.style.width = "100%";
    
    // Control Bar
    const controlBar = document.createElement("div");
    controlBar.style.display = "flex";
    controlBar.style.alignItems = "center";
    controlBar.style.justifyContent = "space-between";
    controlBar.style.width = "100%";
    
    // All Modules Title Container
    const titleContainer2 = document.createElement("div");
    titleContainer2.style.display = "flex";
    titleContainer2.style.gap = "8px";
    titleContainer2.style.alignItems = "flex-start";
    
    const title2 = document.createElement("h4");
    title2.className = "h4";
    title2.style.margin = "0";
    title2.style.whiteSpace = "pre";
    title2.textContent = "All Modules";
    
    titleContainer2.appendChild(title2);
    controlBar.appendChild(titleContainer2);
    
    // Sorting dropdown
    const sortingDropdown = createSortingDropdown({ status: false });
    controlBar.appendChild(sortingDropdown);
    
    allModulesContainer.appendChild(controlBar);
    
    // Table container (horizontal scrollable)
    const tableContainer = document.createElement("div");
    tableContainer.style.display = "flex";
    tableContainer.style.flexDirection = "column";
    tableContainer.style.alignItems = "flex-start";
    tableContainer.style.maxWidth = "896px";
    tableContainer.style.minWidth = "672px";
    tableContainer.style.width = "100%";
    tableContainer.style.overflowX = "auto";
    tableContainer.style.overflowY = "hidden";
    tableContainer.style.scrollBehavior = "smooth";
    tableContainer.style.webkitOverflowScrolling = "touch";
    
    // Header row
    const headerRow = createOnboardingModulesTableRow({
        type: "Header",
        state: "Default"
    });
    tableContainer.appendChild(headerRow);
    
    // Item rows
    const modules = [
        { moduleTitle: "Welcome to PLUS", duration: "11mins", stage: "not started", ctaState: "not started" },
        { moduleTitle: "Your role at PLUS", duration: "11mins", stage: "not started", ctaState: "not started" },
        { moduleTitle: "Tutoring Session Overview", duration: "11mins", stage: "not started", ctaState: "not started" },
        { moduleTitle: "Tutor Session Flow/Responsibilities", duration: "11mins", stage: "not started", ctaState: "not started" }
    ];
    
    modules.forEach(moduleData => {
        const itemRow = createOnboardingModulesTableRow({
            type: "Item",
            state: "Default",
            data: moduleData
        });
        tableContainer.appendChild(itemRow);
    });
    
    allModulesContainer.appendChild(tableContainer);
    featuredModulesContainer.appendChild(allModulesContainer);
    contentContainer.appendChild(featuredModulesContainer);
    mainContainer.appendChild(contentContainer);
    page.appendChild(mainContainer);
    
    return page;
}

