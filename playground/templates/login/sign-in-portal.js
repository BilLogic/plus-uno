/**
 * @fileoverview Sign-In Portal page JavaScript
 * Initializes sign-in portal components following PLUS design system
 * Following coding standards from develop/standards.md
 * Based on Figma design: node-id=115-6052
 */

// Import PLUS design system components
import { PlusInterface } from "../../design-system/components/index.js";

/**
 * Initializes the sign-in portal page components
 */
function initializeSignInPortal() {
    const signInCard = document.getElementById("sign-in-card");
    const signInButtons = document.getElementById("sign-in-buttons");
    const demoButtonContainer = document.getElementById("sign-in-demo-container");
    
    if (!signInCard || !signInButtons || !demoButtonContainer) {
        console.error("Required DOM elements not found");
        return;
    }
    
    // Create and insert alert at the top of the card
    const alert = PlusInterface.createAlert({
        id: "logout-alert",
        style: "warning",
        title: null,
        text: "You have been logged out.",
        dismissable: true,
        onDismiss: () => {
            console.log("Alert dismissed");
        }
    });
    
    // Insert alert at the beginning of the login card
    signInCard.insertBefore(alert, signInCard.firstElementChild);
    
    // Create Google authentication button (outline style with border)
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
    
    // Add Google icon placeholder to button
    if (googleButton && googleButton.classList.contains("pbtn")) {
        const googleButtonContent = googleButton.querySelector(".pbtn-content");
        if (googleButtonContent) {
            // Use Google icon from assets directory
            const googleIcon = document.createElement("img");
            googleIcon.src = "../../../design-system/assets/images/auth-providers/google-icon.png";
            googleIcon.alt = "Google";
            googleIcon.className = "google-icon";
            const textSpan = googleButtonContent.querySelector("span");
            if (textSpan) {
                googleButtonContent.insertBefore(googleIcon, textSpan);
            }
        }
    }
    
    // Create Clever authentication button (filled custom style)
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
            cleverImage.src = "../../../design-system/assets/images/auth-providers/clever-image.png";
            cleverImage.alt = "Clever";
            cleverImage.className = "clever-image";
            cleverButtonContent.appendChild(cleverImage);
        }
    }
    
    // Add buttons to container
    signInButtons.appendChild(googleButton);
    signInButtons.appendChild(cleverButton);
    
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
    
    // Add button to container
    demoButtonContainer.appendChild(demoButton);
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeSignInPortal);
} else {
    initializeSignInPortal();
}

