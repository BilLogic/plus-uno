/**
 * @fileoverview Main JavaScript file for PLUS design system starter template
 */

// New modular import (preferred)
import { Universal } from "./components/index.js";

// Legacy import (backward compatibility)
import { PlusInterface, PlusSmartComponents } from "./components/index.js";

/**
 * Initialize the page with example components
 */
function init() {
    // Button examples
    const buttonContainer = document.getElementById("button-examples");
    if (buttonContainer) {
        // Using new modular import
        const filledBtn = Universal.createButton({
            btnText: "Primary Button",
            btnStyle: "primary",
            btnFill: "filled",
            buttonOnClick: () => console.log("Primary button clicked")
        });
        
        const outlineBtn = Universal.createButton({
            btnText: "Outline Button",
            btnStyle: "primary",
            btnFill: "outline",
            buttonOnClick: () => console.log("Outline button clicked")
        });
        
        const tonalBtn = Universal.createButton({
            btnText: "Tonal Button",
            btnStyle: "primary",
            btnFill: "tonal",
            buttonOnClick: () => console.log("Tonal button clicked")
        });
        
        const textBtn = Universal.createButton({
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
        // Using new modular import
        const checkbox1 = Universal.createCheckbox({
            label: "Option 1",
            name: "options",
            value: "option1",
            id: "option1",
            checked: false
        });
        
        const checkbox2 = Universal.createCheckbox({
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
        // Using new modular import
        const statusTag = Universal.createContentStatusTag("complete");
        const pill = Universal.createSuperCompPillDiv("Social-Emotional", false);
        
        smartContainer.appendChild(statusTag);
        smartContainer.appendChild(pill);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

