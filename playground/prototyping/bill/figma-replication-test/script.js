/**
 * @fileoverview Sign-in Portal page JavaScript
 * Initializes sign-in portal components following PLUS design system
 * Following coding standards from develop/standards.md
 * Based on Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=115-5206
 */

// Import PLUS design system components
// From playground/prototyping/{designer}/{prototype}/: 4 levels up to root
import { PlusInterface } from "../../../../design-system/components/index.js";
import { createLogo } from "../../../../design-system/assets/Logo/index.js";

/**
 * Initializes the sign-in portal page components
 */
function initializeSignInPortal() {
    const mainContainer = document.getElementById("sign-in-main-container");
    const authButtonsContainer = document.getElementById("sign-in-auth-buttons");
    const demoButtonContainer = document.getElementById("sign-in-demo-btn");
    
    if (!mainContainer || !authButtonsContainer || !demoButtonContainer) {
        console.error("Required DOM elements not found");
        return;
    }
    
    // Create and insert Logo (colored style, size S, with text)
    // Figma: Logo with colored icon and PLUS wordmark
    const logo = createLogo({
        style: "colored",
        size: "S",
        text: true,
        classes: []
    });
    
    // Insert logo at the beginning of main container
    mainContainer.insertBefore(logo, mainContainer.firstElementChild);
    
    // Create Google authentication button (outline style with border)
    // Figma: Button with Google icon and "Continue with Google" text
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
        classes: ["sign-in-google-btn"]
    });
    
    // Add Google icon to button
    if (googleButton && googleButton.classList.contains("pbtn")) {
        const googleButtonContent = googleButton.querySelector(".pbtn-content");
        if (googleButtonContent) {
            // Use Google icon from assets directory
            const googleIcon = document.createElement("img");
            googleIcon.src = "../../../../design-system/assets/images/auth-providers/google-icon.svg";
            googleIcon.alt = "Google";
            googleIcon.className = "google-icon";
            const textSpan = googleButtonContent.querySelector("span");
            if (textSpan) {
                googleButtonContent.insertBefore(googleIcon, textSpan);
            }
        }
    }
    
    // Create Clever authentication button (filled custom style #2e76ff)
    // Figma: Button with Clever image
    const cleverButton = PlusInterface.createButton({
        btnId: "clever-auth-btn",
        btnText: "",
        btnStyle: "primary",
        btnFill: "filled",
        btnSize: "default",
        buttonOnClick: () => {
            console.log("Clever login clicked");
            // Add your Clever OAuth logic here
        },
        classes: ["sign-in-clever-btn"]
    });
    
    // Add Clever image to button
    if (cleverButton && cleverButton.classList.contains("pbtn")) {
        const cleverButtonContent = cleverButton.querySelector(".pbtn-content");
        if (cleverButtonContent) {
            // Clear any existing content
            cleverButtonContent.innerHTML = "";
            // Use Clever image from assets directory
            const cleverImage = document.createElement("img");
            cleverImage.src = "../../../../design-system/assets/images/auth-providers/clever-image.png";
            cleverImage.alt = "Clever";
            cleverImage.className = "clever-image";
            cleverButtonContent.appendChild(cleverImage);
        }
    }
    
    // Add buttons to container
    authButtonsContainer.appendChild(googleButton);
    authButtonsContainer.appendChild(cleverButton);
    
    // Create "Try a demo" button (secondary/tonal style)
    // Figma: Secondary button with "Try a demo" text
    const demoButton = PlusInterface.createButton({
        btnId: "demo-btn",
        btnText: "Try a demo",
        btnStyle: "primary",
        btnFill: "tonal",
        btnSize: "default",
        buttonOnClick: () => {
            console.log("Try a demo clicked");
            // Add your demo logic here
        },
        classes: ["sign-in-demo-btn"]
    });
    
    // Add demo button to container
    demoButtonContainer.appendChild(demoButton);
    
    console.log("Sign-in portal initialized successfully");
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSignInPortal);
} else {
    initializeSignInPortal();
}

