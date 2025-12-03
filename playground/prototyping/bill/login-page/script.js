import { createButton, createModal, createSelect } from '../../../../design-system/components/index.js';

$(document).ready(function () {
    // --- Main Page Buttons ---

    // Login Button
    const loginBtn = createButton({
        btnText: "Log In",
        btnStyle: "primary",
        btnFill: "filled",
        classes: ["w-100"], // Bootstrap utility for full width
        buttonOnClick: () => {
            alert('Logged in successfully!');
        }
    });
    document.getElementById('login-container').appendChild(loginBtn);

    // Register Button
    const registerBtn = createButton({
        btnText: "Register",
        btnStyle: "primary",
        btnFill: "outline",
        classes: ["w-100"],
        buttonOnClick: () => {
            openRegistrationModal();
        }
    });
    document.getElementById('register-container').appendChild(registerBtn);

    // --- Registration Modal ---

    function openRegistrationModal() {
        // Create Form Content
        const formContainer = document.createElement('div');

        // First Name
        const firstNameGroup = document.createElement('div');
        firstNameGroup.className = 'form-group';
        const firstNameLabel = document.createElement('label');
        firstNameLabel.textContent = 'First Name';
        firstNameLabel.className = 'body2-txt font-weight-bold mb-1'; // Typography + spacing
        const firstNameInput = document.createElement('input');
        firstNameInput.type = 'text';
        firstNameInput.className = 'plus-text-field w-100'; // Design system class
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
            title: "Create Account",
            body: formContainer,
            primaryButton: {
                text: "Create Account",
                onClick: () => {
                    const firstName = firstNameInput.value;
                    const lastName = lastNameInput.value;
                    // Select value handling might depend on implementation, checking DOM
                    const genderValue = genderSelect.querySelector('select').value;

                    if (firstName && lastName && genderValue) {
                        console.log('Registration Details:', { firstName, lastName, gender: genderValue });
                        alert(`Account created for ${firstName} ${lastName}!`);
                        $(modal).modal('hide');
                    } else {
                        alert('Please fill in all fields.');
                    }
                }
            },
            secondaryButton: {
                text: "Cancel",
                onClick: () => {
                    $(modal).modal('hide');
                }
            },
            onClose: () => {
                $(modal).modal('hide');
            }
        });

        // Append to body and show
        document.body.appendChild(modal);
        $(modal).modal('show');

        // Cleanup on hidden
        $(modal).on('hidden.bs.modal', function () {
            document.body.removeChild(modal);
        });
    }
});
