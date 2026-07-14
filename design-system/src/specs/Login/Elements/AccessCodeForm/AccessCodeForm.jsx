import React from 'react';
import PropTypes from 'prop-types';

import Input from '@/components/forms-and-inputs/Input';

import '../shared/login-field.scss';

/**
 * Access-code field with label, helper caption, and optional validation state.
 *
 * @param {object} props
 * @param {string} [props.id='login-access-code'] - Input id and name.
 * @param {boolean} [props.required=true] - Whether the field is required.
 * @param {string|number} [props.value] - Controlled input value.
 * @param {'none'|'invalid'|'success'} [props.validation='none'] - Validation state.
 * @param {string} [props.validationMessage] - Message shown when validation fails.
 * @param {string} [props.caption] - Helper caption below the field.
 * @returns {React.ReactElement}
 */
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

/**
 * Non-interactive spec strip showing default and invalid access-code states.
 *
 * @returns {React.ReactElement}
 */
export default function AccessCodeFormSpec() {
    return (
        <div
            style={{
                padding: 'var(--size-section-pad-y-lg)',
                pointerEvents: 'none',
            }}
        >
            <div style={{ marginBottom: 'var(--size-section-pad-y-md)', width: '100%' }}>
                <LoginAccessCodeField id="login-access-code-default" />
            </div>

            <div style={{ width: '100%', marginTop: 'var(--size-section-pad-y-md)' }}>
                <LoginAccessCodeField
                    id="login-access-code-invalid"
                    value="invalid-code"
                    validation="invalid"
                    validationMessage="Invalid access code for the selected institution. Please try again or contact your institution's admin for help."
                    caption=""
                />
            </div>
        </div>
    );
}
