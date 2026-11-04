import React from 'react';
import PropTypes from 'prop-types';

import TextField from '@/components/forms-and-inputs/TextField/TextField';

import '../shared/login-field.scss';

/**
 * Institution selection field with caption link for independent registration.
 *
 * @param {object} props
 * @param {string} [props.id='login-institution'] - Input id and name.
 * @param {boolean} [props.required=true] - Whether the field is required.
 * @param {string} [props.placeholder] - Input placeholder text.
 * @param {string} [props.captionPrefix] - Caption text before the link.
 * @param {string} [props.captionLinkText] - Caption link label.
 * @param {Function} [props.onCaptionLinkClick] - Caption link click handler.
 * @returns {React.ReactElement}
 */
export function LoginInstitutionField({
    id = 'login-institution',
    required = true,
    placeholder = 'Select your institution from the list',
    captionPrefix = "Didn't find your institution?",
    captionLinkText = 'Register Independently',
    onCaptionLinkClick,
}) {
    return (
        <div className="login-field">
            <div className="login-field__label body1-txt font-weight-semibold">
                Register With Your Institution {required && <span className="login-field__required">*</span>}
            </div>

            <TextField
                id={id}
                name={id}
                label="Register With Your Institution"
                isRequired={required}
                isLabelHidden
                placeholder={placeholder}
                elemAfterInput={<i className="fa-solid fa-caret-down" aria-hidden="true" />}
                isReadOnly
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

/**
 * Non-interactive spec strip for official vs independent institution form variants.
 *
 * @returns {React.ReactElement}
 */
export default function InstitutionFormSpec() {
    return (
        <div
            style={{
                padding: 'var(--size-section-pad-y-lg)',
                maxWidth: '560px',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-section-gap-lg)',
                pointerEvents: 'none',
            }}
        >
            <div>
                <div className="body3-txt font-weight-semibold" style={{ marginBottom: 'var(--stack-sm)', color: 'var(--ds-text)' }}>
                    Register With Your Institution
                </div>
                <TextField
                    id="institution-form-official"
                    name="institution-form-official"
                    label="Register With Your Institution"
                    isLabelHidden
                    placeholder="Select your institution from the list"
                    elemAfterInput={<i className="fa-solid fa-caret-down" aria-hidden="true" />}
                />
                <div
                    className="body3-txt"
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 'var(--stack-md)',
                        marginTop: 'var(--stack-md)',
                        color: 'var(--ds-text-subtle)',
                    }}
                >
                    <i className="fa-solid fa-circle-info" aria-hidden="true" />
                    <span>
                        Are you a new tutor?{' '}
                        <span style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
                            Register With Institution
                        </span>
                        .
                    </span>
                </div>
            </div>

            <div>
                <div className="body3-txt font-weight-semibold" style={{ marginBottom: 'var(--stack-sm)', color: 'var(--ds-text)' }}>
                    Institution Name
                </div>
                <TextField
                    id="institution-form-independent"
                    name="institution-form-independent"
                    label="Institution Name"
                    isLabelHidden
                    placeholder="Add your institution name..."
                    elemAfterInput={<i className="fa-solid fa-caret-down" aria-hidden="true" />}
                />
                <div
                    className="body3-txt"
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 'var(--stack-md)',
                        marginTop: 'var(--stack-md)',
                        color: 'var(--ds-text-subtle)',
                    }}
                >
                    <i className="fa-solid fa-circle-info" aria-hidden="true" />
                    <span>
                        Are you a new tutor?{' '}
                        <span style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
                            Register With Institution
                        </span>
                        .
                    </span>
                </div>
            </div>
        </div>
    );
}
