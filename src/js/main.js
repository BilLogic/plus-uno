/**
 * @fileoverview Main JavaScript file for PLUS design system starter template
 */

// Import PLUS design system components
import { PlusInterface, PlusSmartComponents } from "../design-system/components/local/index.js";

// Network utilities
import { PlusNetworkUtil } from "./utils/plus_util.js";

/**
 * Shows a connection error alert
 * @param {string} message - Error message to display
 */
function showConnectionError(message = null) {
    const errorMessage = message || "Connection failed. If the problem persists, please check your internet connection or VPN.";
    
    // Remove any existing connection error alerts
    const existingAlerts = document.querySelectorAll('.plus-connection-error');
    existingAlerts.forEach(alert => alert.remove());
    
    // Create error alert
    const alert = PlusInterface.createAlert({
        id: 'connection-error-alert',
        style: 'danger',
        title: 'Connection Error',
        text: errorMessage,
        dismissable: true,
        onDismiss: () => {
            // Remove the error class when dismissed
            document.body.classList.remove('connection-error-active');
        }
    });
    
    // Add a class to identify this as a connection error
    alert.classList.add('plus-connection-error');
    
    // Insert at the top of the body
    const container = document.querySelector('.container-fluid') || document.body;
    if (container === document.body) {
        container.insertBefore(alert, container.firstChild);
    } else {
        container.insertBefore(alert, container.firstElementChild);
    }
    
    // Add class to body for styling purposes
    document.body.classList.add('connection-error-active');
}

/**
 * Shows a connection restored success message
 */
function showConnectionRestored() {
    // Remove any existing connection error alerts
    const existingAlerts = document.querySelectorAll('.plus-connection-error');
    existingAlerts.forEach(alert => alert.remove());
    
    // Create success alert
    const alert = PlusInterface.createAlert({
        id: 'connection-restored-alert',
        style: 'success',
        title: 'Connection Restored',
        text: 'Your internet connection has been restored.',
        dismissable: true
    });
    
    // Insert at the top of the body
    const container = document.querySelector('.container-fluid') || document.body;
    if (container === document.body) {
        container.insertBefore(alert, container.firstChild);
    } else {
        container.insertBefore(alert, container.firstElementChild);
    }
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

/**
 * Initialize network monitoring
 */
function initNetworkMonitoring() {
    let connectionErrorShown = false;
    
    // Monitor online/offline status
    PlusNetworkUtil.monitorConnection(
        () => {
            // Connection failed
            if (!connectionErrorShown) {
                showConnectionError();
                connectionErrorShown = true;
            }
        },
        () => {
            // Connection restored
            connectionErrorShown = false;
            showConnectionRestored();
        }
    );
    
    // Listen for script and stylesheet load errors
    window.addEventListener('error', (event) => {
        // Check if it's a script or stylesheet that failed to load
        const target = event.target;
        if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
            const src = target.src || target.href;
            // Only show error for external resources (CDN)
            if (src && (src.includes('cdn.jsdelivr.net') || 
                       src.includes('cdnjs.cloudflare.com') || 
                       src.includes('code.jquery.com') ||
                       src.includes('bootstrap'))) {
                if (!connectionErrorShown) {
                    showConnectionError("Some resources failed to load. Please check your internet connection or VPN settings.");
                    connectionErrorShown = true;
                }
            }
        }
    }, true); // Use capture phase to catch errors early
    
    // Also check network status after page load
    setTimeout(() => {
        if (!PlusNetworkUtil.isOnline() && !connectionErrorShown) {
            showConnectionError();
            connectionErrorShown = true;
        }
    }, 1000);
}

/**
 * Initialize the page with example components
 */
function init() {
    // Button examples
    const buttonContainer = document.getElementById("button-examples");
    if (buttonContainer) {
        const filledBtn = PlusInterface.createButton({
            btnText: "Primary Button",
            btnStyle: "primary",
            btnFill: "filled",
            buttonOnClick: () => console.log("Primary button clicked")
        });
        
        const outlineBtn = PlusInterface.createButton({
            btnText: "Outline Button",
            btnStyle: "primary",
            btnFill: "outline",
            buttonOnClick: () => console.log("Outline button clicked")
        });
        
        const tonalBtn = PlusInterface.createButton({
            btnText: "Tonal Button",
            btnStyle: "primary",
            btnFill: "tonal",
            buttonOnClick: () => console.log("Tonal button clicked")
        });
        
        const textBtn = PlusInterface.createButton({
            btnText: "Text Button",
            btnStyle: "primary",
            btnFill: "text",
            buttonOnClick: () => console.log("Text button clicked")
        });

        buttonContainer.appendChild(filledBtn);
        buttonContainer.appendChild(outlineBtn);
        buttonContainer.appendChild(tonalBtn);
        buttonContainer.appendChild(textBtn);
    }

    // Form examples
    const formContainer = document.getElementById("form-examples");
    if (formContainer) {
        const checkbox1 = PlusInterface.createCheckbox({
            label: "Option 1",
            name: "options",
            value: "option1",
            id: "option1",
            checked: false
        });
        
        const checkbox2 = PlusInterface.createCheckbox({
            label: "Option 2",
            name: "options",
            value: "option2",
            id: "option2",
            checked: true
        });

        formContainer.appendChild(checkbox1);
        formContainer.appendChild(checkbox2);
    }

    // SMART component examples
    const smartContainer = document.getElementById("smart-examples");
    if (smartContainer) {
        const statusTag = PlusSmartComponents.createContentStatusTag("complete");
        const pill = PlusSmartComponents.createSuperCompPillDiv("Social-Emotional", false);
        
        smartContainer.appendChild(statusTag);
        smartContainer.appendChild(pill);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        init();
        initNetworkMonitoring();
    });
} else {
    init();
    initNetworkMonitoring();
}

