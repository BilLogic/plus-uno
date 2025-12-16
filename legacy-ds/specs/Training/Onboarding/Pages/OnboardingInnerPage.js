/**
 * @fileoverview OnboardingInnerPage component for Training Onboarding Pages
 * Full page layout for individual onboarding module with content, alert, iframe, and reflection form
 * Matches Figma design system specifications
 * 
 * Figma: node-id 74-121860
 */

import { createTopBar } from '../../../Universal/Sections/topbar.js';
import { createContentBlurb } from '../Elements/ContentBlurb.js';
import { createOnboardingAlertCard } from '../Cards/OnboardingAlertCard.js';
import { createStrategyContentPromptModal } from '../Modals/StrategyContentPromptModal.js';
import { createModuleCompletionModal } from '../Modals/ModuleCompletionModal.js';

/**
 * Creates an Onboarding Inner Page component
 * @param {Object} options - Page configuration
 * @param {boolean} [options.showScrim=false] - Whether to show scrim with completion modal
 * @returns {HTMLElement} Page element
 */
export function createOnboardingInnerPage({ showScrim = false } = {}) {
    const page = document.createElement("div");
    page.style.position = "relative";
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
            { text: "Onboarding", href: "#" },
            { text: "PLUS APP Usage" }
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
    mainContainer.style.gap = "var(--size-surface-gap-sm)";
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
    
    // Resource Description section
    const resourceDescriptionSection = document.createElement("div");
    resourceDescriptionSection.style.display = "flex";
    resourceDescriptionSection.style.alignItems = "space-between";
    resourceDescriptionSection.style.justifyContent = "space-between";
    resourceDescriptionSection.style.width = "100%";
    
    // Content Blurb
    const contentBlurb = createContentBlurb({
        title: "Welcome to PLUS",
        description: "Description",
        duration: "Estimated Time: {xx} minutes",
        badgeType: "image"
    });
    contentBlurb.style.width = "332px";
    resourceDescriptionSection.appendChild(contentBlurb);
    
    // Illustration image - matching Figma design
    const illustrationWrapper = document.createElement("div");
    illustrationWrapper.style.display = "flex";
    illustrationWrapper.style.flexDirection = "row";
    illustrationWrapper.style.alignItems = "center";
    illustrationWrapper.style.height = "100%";
    illustrationWrapper.style.width = "275.33px";
    illustrationWrapper.style.flexShrink = "0";
    illustrationWrapper.style.position = "relative";
    
    const illustration = document.createElement("img");
    illustration.alt = "";
    illustration.style.position = "absolute";
    illustration.style.inset = "0";
    illustration.style.maxWidth = "none";
    illustration.style.objectFit = "contain";
    illustration.style.objectPosition = "50% 50%";
    illustration.style.pointerEvents = "none";
    illustration.style.width = "100%";
    illustration.style.height = "100%";
    // Use placeholder image URL from Figma
    illustration.src = "http://localhost:3845/assets/8c894e1283835ed82f057c1cabdac9c9260663f5.png";
    illustration.onerror = function() {
        // If image fails to load, keep the container but hide the image
        this.style.display = "none";
    };
    
    illustrationWrapper.appendChild(illustration);
    resourceDescriptionSection.appendChild(illustrationWrapper);
    
    contentContainer.appendChild(resourceDescriptionSection);
    
    // Alert section
    const alertSection = document.createElement("div");
    alertSection.style.display = "flex";
    alertSection.style.alignItems = "flex-start";
    alertSection.style.width = "100%";
    
    const alertCard = createOnboardingAlertCard({
        title: "Don't forget to complete this module",
        description: "Make sure to finish the quiz on the Google Site and answer the reflection question at the bottom of this page to complete this onboarding module."
    });
    alertCard.style.flex = "1";
    alertCard.style.minHeight = "0";
    alertCard.style.minWidth = "0";
    
    alertSection.appendChild(alertCard);
    contentContainer.appendChild(alertSection);
    
    // PDF/iframe section (placeholder)
    const pdfSection = document.createElement("div");
    pdfSection.style.backgroundColor = "var(--color-surface-container-low)";
    pdfSection.style.borderRadius = "12px 12px var(--size-element-gap-md) var(--size-element-gap-md)";
    pdfSection.style.display = "flex";
    pdfSection.style.flexDirection = "column";
    pdfSection.style.gap = "var(--size-element-gap-md)";
    pdfSection.style.alignItems = "flex-start";
    pdfSection.style.padding = "var(--size-section-pad-y-md) var(--size-section-pad-x-md)";
    pdfSection.style.width = "100%";
    pdfSection.style.flexShrink = "0";
    
    // Note: This section would contain an iframe for Google Sites embed
    // For now, it's a placeholder container
    
    contentContainer.appendChild(pdfSection);
    
    // Strategy Content Prompt Modal section
    const strategyContentPromptSection = createStrategyContentPromptModal({
        question: "What's one specific action you plan to take in your next session based on what you learned in this module?"
    });
    strategyContentPromptSection.style.width = "100%";
    contentContainer.appendChild(strategyContentPromptSection);
    
    mainContainer.appendChild(contentContainer);
    page.appendChild(mainContainer);
    
    // Scrim with Module Completion Modal (if showScrim is true)
    if (showScrim) {
        const scrim = document.createElement("div");
        scrim.style.position = "absolute";
        scrim.style.inset = "0";
        scrim.style.backgroundColor = "var(--color-scrim)";
        scrim.style.display = "flex";
        scrim.style.flexDirection = "column";
        scrim.style.gap = "10px";
        scrim.style.alignItems = "center";
        scrim.style.justifyContent = "center";
        
        const completionModal = createModuleCompletionModal({
            onClose: () => {
                scrim.remove();
            },
            onContinue: () => {
                scrim.remove();
            }
        });
        
        scrim.appendChild(completionModal);
        page.appendChild(scrim);
    }
    
    return page;
}

