import { createButton, createModal, createSelect, createButtonGroup } from '../../../../design-system/components/index.js';

let currentModalSize = 'medium'; // small, medium, large

$(document).ready(function () {
    renderSizeSwitcher();
    try {
        openSelectionModal();
    } catch (e) {
        console.error("Error opening modal:", e);
    }
});

function getModalSettings() {
    switch (currentModalSize) {
        case 'small':
            return {
                width: 300,
                paddingSize: 'sm',
                gapSize: 'sm',
                radiusSize: 'sm'
            };
        case 'large':
            return {
                width: 500,
                paddingSize: 'lg',
                gapSize: 'lg',
                radiusSize: 'lg'
            };
        case 'medium':
        default:
            return {
                width: 340,
                paddingSize: 'md',
                gapSize: 'md',
                radiusSize: 'md'
            };
    }
}

function renderSizeSwitcher() {
    const switcherContainer = document.createElement('div');
    switcherContainer.style.position = 'fixed';
    switcherContainer.style.bottom = '20px';
    switcherContainer.style.left = '50%';
    switcherContainer.style.transform = 'translateX(-50%)';
    switcherContainer.style.zIndex = '10000';
    switcherContainer.style.backgroundColor = 'white';
    switcherContainer.style.padding = '10px';
    switcherContainer.style.borderRadius = '8px';
    switcherContainer.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    switcherContainer.style.display = 'flex';
    switcherContainer.style.alignItems = 'center';
    switcherContainer.style.gap = '10px';

    const label = document.createElement('span');
    label.className = 'body2-txt font-weight-bold';
    label.textContent = 'Modal Size:';
    switcherContainer.appendChild(label);

    const buttonGroup = createButtonGroup({
        buttons: [
            {
                btnText: "Small",
                buttonOnClick: () => updateModalSize('small'),
                classes: currentModalSize === 'small' ? ['active'] : []
            },
            {
                btnText: "Medium",
                buttonOnClick: () => updateModalSize('medium'),
                classes: currentModalSize === 'medium' ? ['active'] : []
            },
            {
                btnText: "Large",
                buttonOnClick: () => updateModalSize('large'),
                classes: currentModalSize === 'large' ? ['active'] : []
            }
        ]
    });

    switcherContainer.appendChild(buttonGroup);
    document.body.appendChild(switcherContainer);
}

function updateModalSize(size) {
    if (currentModalSize === size) return;
    currentModalSize = size;

    // Re-render switcher to update active state (simple way)
    const oldSwitcher = document.querySelector('div[style*="z-index: 10000"]');
    if (oldSwitcher) document.body.removeChild(oldSwitcher);
    renderSizeSwitcher();

    // Close any open modals and restart flow
    $('.modal').modal('hide');
    setTimeout(openSelectionModal, 300);
}

function showPlusModal(plusModalElement, modalId) {
    // Create Bootstrap modal structure
    const wrapper = document.createElement('div');
    wrapper.className = 'modal fade';
    wrapper.id = modalId;
    wrapper.setAttribute('tabindex', '-1');
    wrapper.setAttribute('role', 'dialog');
    wrapper.setAttribute('aria-hidden', 'true');

    const dialog = document.createElement('div');
    dialog.className = 'modal-dialog modal-dialog-centered';
    dialog.setAttribute('role', 'document');

    // Adjust max-width of dialog to fit larger modals if needed
    // Bootstrap default is 500px, so 500px width should be fine.
    // If we go larger, we might need to adjust this.
    if (currentModalSize === 'large') {
        dialog.style.maxWidth = '550px';
    }

    // Use transparent/border-0 for content since plus-modal has its own style
    const content = document.createElement('div');
    content.className = 'modal-content bg-transparent border-0 d-flex align-items-center';

    // Append plus-modal to content
    content.appendChild(plusModalElement);
    dialog.appendChild(content);
    wrapper.appendChild(dialog);

    document.body.appendChild(wrapper);

    // Show modal
    $(`#${modalId}`).modal('show');

    // Cleanup on hidden
    $(`#${modalId}`).on('hidden.bs.modal', function () {
        if (document.body.contains(wrapper)) {
            document.body.removeChild(wrapper);
        }
    });

    return wrapper;
}

function openSelectionModal() {
    const settings = getModalSettings();

    const container = document.createElement('div');
    container.className = 'd-flex flex-column align-items-center w-100';

    const description = document.createElement('p');
    description.className = 'body1-txt text-center mb-4';
    description.textContent = 'Please log in or create a new account.';
    container.appendChild(description);

    const loginBtn = createButton({
        btnText: "Log In",
        btnStyle: "primary",
        btnFill: "outline",
        classes: ["w-100", "mb-3"],
        buttonOnClick: () => {
            window.location.href = '../login-page/index.html';
        }
    });

    const registerBtn = createButton({
        btnText: "Register",
        btnStyle: "primary",
        btnFill: "filled",
        classes: ["w-100"],
        buttonOnClick: () => {
            $(`#selection-modal`).modal('hide');
            // Wait for hide to finish before opening next
            setTimeout(openRegistrationModal, 500);
        }
    });

    container.appendChild(loginBtn);
    container.appendChild(registerBtn);

    const modal = createModal({
        // id: 'selection-modal-inner', // Don't set ID here to avoid confusion
        title: "Welcome",
        body: container,
        type: "scrollable",
        showBottomButtons: false,
        width: settings.width,
        paddingSize: settings.paddingSize,
        gapSize: settings.gapSize,
        radiusSize: settings.radiusSize,
        onClose: () => {
            $(`#selection-modal`).modal('hide');
        }
    });

    showPlusModal(modal, 'selection-modal');
}

function openRegistrationModal() {
    const settings = getModalSettings();

    // Create Form Content
    const formContainer = document.createElement('div');
    formContainer.className = 'w-100';

    // First Name
    const firstNameGroup = document.createElement('div');
    firstNameGroup.className = 'form-group';
    const firstNameLabel = document.createElement('label');
    firstNameLabel.textContent = 'First Name';
    firstNameLabel.className = 'body2-txt font-weight-bold mb-1';
    const firstNameInput = document.createElement('input');
    firstNameInput.type = 'text';
    firstNameInput.className = 'plus-text-field w-100';
    firstNameInput.id = 'firstName';
    firstNameGroup.appendChild(firstNameLabel);
    firstNameGroup.appendChild(firstNameInput);
    formContainer.appendChild(firstNameGroup);

    // Last Name
    const lastNameGroup = document.createElement('div');
    lastNameGroup.className = 'form-group';
    const lastNameLabel = document.createElement('label');
    lastNameLabel.textContent = 'Last Name';
    lastNameLabel.className = 'body2-txt font-weight-bold mb-1';
    const lastNameInput = document.createElement('input');
    lastNameInput.type = 'text';
    lastNameInput.className = 'plus-text-field w-100';
    lastNameInput.id = 'lastName';
    lastNameGroup.appendChild(lastNameLabel);
    lastNameGroup.appendChild(lastNameInput);
    formContainer.appendChild(lastNameGroup);

    // Gender Select
    const genderGroup = document.createElement('div');
    genderGroup.className = 'form-group';
    const genderLabel = document.createElement('label');
    genderLabel.textContent = 'Gender';
    genderLabel.className = 'body2-txt font-weight-bold mb-1';

    const genderSelect = createSelect({
        id: 'gender',
        placeholder: 'Select Gender',
        options: [
            { value: 'male', text: 'Male' },
            { value: 'female', text: 'Female' },
            { value: 'other', text: 'Other' },
            { value: 'prefer-not-to-say', text: 'Prefer not to say' }
        ],
        classes: ['w-100']
    });

    genderGroup.appendChild(genderLabel);
    genderGroup.appendChild(genderSelect);
    formContainer.appendChild(genderGroup);

    // Create Modal
    const modal = createModal({
        // id: 'registration-modal-inner',
        title: "Create Account",
        body: formContainer,
        type: "scrollable",
        width: settings.width,
        paddingSize: settings.paddingSize,
        gapSize: settings.gapSize,
        radiusSize: settings.radiusSize,
        primaryButton: {
            text: "Create Account",
            onClick: () => {
                const firstName = firstNameInput.value;
                const lastName = lastNameInput.value;
                const genderValue = genderSelect.querySelector('select').value;

                if (firstName && lastName && genderValue) {
                    console.log('Registration Details:', { firstName, lastName, gender: genderValue });
                    alert(`Account created for ${firstName} ${lastName}!`);
                    $(`#registration-modal`).modal('hide');
                } else {
                    alert('Please fill in all fields.');
                }
            }
        },
        secondaryButton: {
            text: "Cancel",
            onClick: () => {
                $(`#registration-modal`).modal('hide');
                setTimeout(openSelectionModal, 500);
            }
        },
        onClose: () => {
            $(`#registration-modal`).modal('hide');
        }
    });

    showPlusModal(modal, 'registration-modal');
}
