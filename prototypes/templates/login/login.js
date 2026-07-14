/**
 * @fileoverview Login page JavaScript
 * Initializes login portal components following PLUS design system
 * Following coding standards from develop/standards.md
 */

// Import PLUS design system components
import { PlusInterface, PlusSmartComponents } from "../../design-system/components/index.js";

/**
 * Initializes the login page components
 */
function initializeLoginPage() {
    const loginCard = document.getElementById("login-card");
    const loginButtons = document.getElementById("login-buttons");
    const demoButtonContainer = document.getElementById("demo-button-container");
    
    if (!loginCard || !loginButtons || !demoButtonContainer) {
        console.error("Required DOM elements not found");
        return;
    }
    
    // Create and insert alert at the top of the card
    const alert = PlusInterface.createAlert({
        id: "logout-alert",
        style: "primary",
        title: null,
        text: "You have been logged out.",
        dismissable: true,
        onDismiss: () => {
            console.log("Alert dismissed");
        }
    });
    
    // Insert alert at the beginning of the login card
    loginCard.insertBefore(alert, loginCard.firstElementChild);
    
    // Create Google button (outline style)
    const googleButton = PlusInterface.createButton({
        btnId: "google-auth-btn",
        btnText: "Continue with Google",
        btnStyle: "primary",
        btnFill: "outline",
        btnSize: "default",
        buttonOnClick: () => {
            console.log("Google login clicked");
            // Add your Google OAuth logic here
        },
        classes: ["login-google-btn"]
    });
    
    // Add empty block for Google icon placeholder (after button is created)
    // Replace with actual Google icon image when source is available
    if (googleButton && googleButton.classList.contains("pbtn")) {
        const googleButtonContent = googleButton.querySelector(".pbtn-content");
        if (googleButtonContent) {
            const iconPlaceholder = document.createElement("span");
            iconPlaceholder.className = "google-icon-placeholder";
            const textSpan = googleButtonContent.querySelector("span");
            if (textSpan) {
                googleButtonContent.insertBefore(iconPlaceholder, textSpan);
            }
        }
    }
    
    // Create Clever button (filled custom style)
    const cleverButton = PlusInterface.createButton({
        btnId: "clever-auth-btn",
        btnText: "Log in with Clever",
        btnStyle: "primary",
        btnFill: "filled",
        btnSize: "default",
        buttonOnClick: () => {
            console.log("Clever login clicked");
            // Add your Clever OAuth logic here
        },
        classes: ["pbtn-clever"]
    });
    
    // Add Clever image to button
    if (cleverButton && cleverButton.classList.contains("pbtn")) {
        const cleverButtonContent = cleverButton.querySelector(".pbtn-content");
        if (cleverButtonContent) {
            // Use Clever image from assets directory
            const cleverImage = document.createElement("img");
            cleverImage.src = "../../../design-system/assets/images/auth-providers/clever-image.png";
            cleverImage.alt = "Clever";
            cleverImage.className = "clever-icon";
            const textSpan = cleverButtonContent.querySelector("span");
            if (textSpan) {
                cleverButtonContent.insertBefore(cleverImage, textSpan);
            }
        }
    }
    
    // Add buttons to container - append the FULL button element
    // Following pattern from design-system/components/molecules/Button/Button.stories.js line 117
    loginButtons.appendChild(googleButton);
    loginButtons.appendChild(cleverButton);
    
    // Create "Try a demo" button (tonal/secondary style)
    const demoButton = PlusInterface.createButton({
        btnId: "demo-btn",
        btnText: "Try a demo",
        btnStyle: "primary",
        btnFill: "tonal",
        btnSize: "default",
        buttonOnClick: () => {
            console.log("Try demo clicked");
            // Add your demo logic here
        }
    });
    
    // Add demo button to container - append the FULL button element
    demoButtonContainer.appendChild(demoButton);
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeLoginPage);
} else {
    initializeLoginPage();
}

