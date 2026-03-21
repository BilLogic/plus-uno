import React from 'react';
import PropTypes from 'prop-types';

import Alert from '@/components/Alert';
import Button from '@/components/Button';
import Input from '@/forms/Input';

import googleIcon from '@/assets/images/auth-providers/google-icon.svg';
import cleverImage from '@/assets/images/auth-providers/clever-image.png';

export function LoginAlertBanner({ children, dismissable = true }) {
    return (
        <Alert style="primary" dismissable={dismissable}>
            {children}
        </Alert>
    );
}

LoginAlertBanner.propTypes = {
    children: PropTypes.node,
    dismissable: PropTypes.bool,
};

export function LoginOrDivider({ text = 'or' }) {
    return (
        <div className="login-or-divider" role="separator" aria-label={text}>
            <div className="login-or-divider__line" />
            <div className="login-or-divider__text body1-txt">{text}</div>
            <div className="login-or-divider__line" />
        </div>
    );
}

LoginOrDivider.propTypes = {
    text: PropTypes.string,
};

export function LoginAccessCodeField({
    id = 'login-access-code',
    required = true,
    value,
    validation = 'none',
    validationMessage,
    caption = 'Please ask your institution admin for your access code.',
}) {
    return (
        <div className="login-field">
            <div className="login-field__label body1-txt font-weight-semibold">
                Enter Your Access Code {required && <span className="login-field__required">*</span>}
            </div>

            <Input
                id={id}
                name={id}
                label="Enter Your Access Code"
                required={required}
                showLabel={false}
                placeholder="e.g., funny-walrus"
                trailingVisual="fa-solid fa-circle-info"
                value={value}
                validation={validation}
                validationMessage={validationMessage}
            />

            {caption && (
                <div className="login-field__caption body3-txt">
                    <i className="fa-solid fa-circle-info" aria-hidden="true" />
                    <span>{caption}</span>
                </div>
            )}
        </div>
    );
}

LoginAccessCodeField.propTypes = {
    id: PropTypes.string,
    required: PropTypes.bool,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    validation: PropTypes.oneOf(['none', 'invalid', 'success']),
    validationMessage: PropTypes.string,
    caption: PropTypes.string,
};

export function LoginInstitutionField({
    id = 'login-institution',
    required = true,
    placeholder = 'Select your institution from the list',
    captionPrefix = "Didn’t find your institution?",
    captionLinkText = 'Register Independently',
    onCaptionLinkClick,
}) {
    return (
        <div className="login-field">
            <div className="login-field__label body1-txt font-weight-semibold">
                Register With Your Institution {required && <span className="login-field__required">*</span>}
            </div>

            <Input
                id={id}
                name={id}
                label="Register With Your Institution"
                required={required}
                showLabel={false}
                placeholder={placeholder}
                trailingVisual="dropdown"
                readonly
            />

            <div className="login-field__caption body3-txt">
                <i className="fa-solid fa-circle-info" aria-hidden="true" />
                <span>
                    {captionPrefix}{' '}
                    <button
                        type="button"
                        className="login-field__link"
                        onClick={onCaptionLinkClick}
                    >
                        {captionLinkText}
                    </button>
                </span>
            </div>
        </div>
    );
}

LoginInstitutionField.propTypes = {
    id: PropTypes.string,
    required: PropTypes.bool,
    placeholder: PropTypes.string,
    captionPrefix: PropTypes.string,
    captionLinkText: PropTypes.string,
    onCaptionLinkClick: PropTypes.func,
};

export function LoginAuthButtons() {
    return (
        <div className="login-auth-buttons">
            <Button
                text="Continue with Google"
                style="primary"
                fill="outline"
                size="medium"
                block
                leadingVisual={<img src={googleIcon} alt="" className="login-auth-buttons__google-icon" />}
            />

            <button type="button" className="login-auth-buttons__clever" aria-label="Continue with Clever">
                <img src={cleverImage} alt="" className="login-auth-buttons__clever-image" />
            </button>
        </div>
    );
}

