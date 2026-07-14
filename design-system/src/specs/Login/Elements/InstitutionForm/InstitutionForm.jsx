import React from 'react';
import PropTypes from 'prop-types';

import Input from '@/components/forms-and-inputs/Input';

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
                <div className="body3-txt font-weight-semibold" style={{ marginBottom: 'var(--size-element-gap-xs)', color: 'var(--color-on-surface)' }}>
                    Register With Your Institution
                </div>
                <Input
                    id="institution-form-official"
                    name="institution-form-official"
                    label="Register With Your Institution"
                    showLabel={false}
                    placeholder="Select your institution from the list"
                    trailingVisual="dropdown"
                    size="medium"
                />
                <div
                    className="body3-txt"
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 'var(--size-element-gap-sm)',
                        marginTop: 'var(--size-element-gap-sm)',
                        color: 'var(--color-on-surface-variant)',
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
                <div className="body3-txt font-weight-semibold" style={{ marginBottom: 'var(--size-element-gap-xs)', color: 'var(--color-on-surface)' }}>
                    Institution Name
                </div>
                <Input
                    id="institution-form-independent"
                    name="institution-form-independent"
                    label="Institution Name"
                    showLabel={false}
                    placeholder="Add your institution name..."
                    trailingVisual="dropdown"
                    size="medium"
                />
                <div
                    className="body3-txt"
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 'var(--size-element-gap-sm)',
                        marginTop: 'var(--size-element-gap-sm)',
                        color: 'var(--color-on-surface-variant)',
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
