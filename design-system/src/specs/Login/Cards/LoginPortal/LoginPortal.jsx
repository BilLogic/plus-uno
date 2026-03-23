import React from 'react';
import PropTypes from 'prop-types';

import Button from '@/components/Button';
import Input from '@/forms/Input';

import {
    LoginAlertBanner,
    LoginAuthButtons,
    LoginInstitutionField,
    LoginAccessCodeField,
    LoginOrDivider,
} from '@/specs/Login/Elements/components';

import './LoginPortal.scss';

export default function LoginPortal({
    type = 'official',
    step = '1',
    showAlert = false,
}) {
    // Demo / Step 1 (Role selection)
    if (type === 'demo' && step === '1') {
        return (
            <div className="login-portal-card">
                {showAlert && <LoginAlertBanner>You have been logged out.</LoginAlertBanner>}

                <div className="login-portal-header">
                    <p className="login-portal-header__title h1">Demo</p>
                    <p className="login-portal-header__subtitle body1-txt">
                        Are you joining as an admin, tutor or student?
                    </p>
                </div>

                <div className="login-portal-demo-role-buttons">
                    <Button
                        className="login-portal-demo-role-buttons__btn"
                        text="Admin"
                        style="primary"
                        fill="outline"
                        size="large"
                        block
                        vertical
                        leadingVisual={
                            <i
                                className="fa-solid fa-user-gear login-portal-demo-role-icon"
                                aria-hidden="true"
                            />
                        }
                    />
                    <Button
                        className="login-portal-demo-role-buttons__btn"
                        text="Tutor"
                        style="primary"
                        fill="outline"
                        size="large"
                        block
                        vertical
                        leadingVisual={
                            <i
                                className="fa-solid fa-chalkboard-user login-portal-demo-role-icon"
                                aria-hidden="true"
                            />
                        }
                    />
                </div>
                <div className="login-portal-disabled-button">
                    <Button
                        text="Log in"
                        style="secondary"
                        fill="text"
                        size="medium"
                        block
                        disabled
                    />
                </div>

                <LoginOrDivider text="or" />

                <Button text="Back to log in portal" style="primary" fill="tonal" size="medium" block />
            </div>
        );
    }

    // Official / Step 2 ("New to PLUS?")
    if (type === 'official' && step === '2') {
        return (
            <div className="login-portal-card">
                <div className="login-portal-header">
                    <p className="login-portal-header__title h1">New to PLUS?</p>
                </div>

                <LoginInstitutionField />
                <LoginAccessCodeField />

                <div className="login-portal-disabled-button">
                    <Button
                        text="Continue"
                        style="default"
                        fill="text"
                        size="medium"
                        block
                        disabled
                    />
                </div>
            </div>
        );
    }

    // Official / Step 3a ("Add Your Details" - basic)
    if (type === 'official' && step === '3a') {
        return (
            <div className="login-portal-card">
                <div className="login-portal-header">
                    <p className="login-portal-header__title h1">Add Your Details</p>
                </div>

                <div style={{ display: 'flex', gap: 'var(--size-element-gap-lg)' }}>
                    <div style={{ flex: 1 }}>
                        <div className="login-field">
                            <div className="login-field__label body1-txt font-weight-semibold">
                                First Name <span className="login-field__required">*</span>
                            </div>
                            <Input
                                label="First Name"
                                required
                                placeholder="First name..."
                                showLabel={false}
                            />
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div className="login-field">
                            <div className="login-field__label body1-txt font-weight-semibold">
                                Preferred Name
                            </div>
                            <Input
                                label="Preferred Name"
                                placeholder="Preferred name..."
                                showLabel={false}
                            />
                        </div>
                    </div>
                </div>

                <div className="login-field">
                    <div className="login-field__label body1-txt font-weight-semibold">
                        Last Name <span className="login-field__required">*</span>
                    </div>
                    <Input label="Last Name" required placeholder="Last name..." showLabel={false} />
                </div>

                <div className="login-portal-terms">
                    <span className="login-portal-terms__checkbox" aria-hidden="true" />
                    <span className="login-portal-terms__text body2-txt">
                        I agree to the{' '}
                        <button type="button" className="login-portal-terms__link">
                            terms of use
                        </button>
                        .
                    </span>
                    <span className="login-portal-terms__required" aria-hidden="true">
                        *
                    </span>
                </div>

                <div className="login-portal-disabled-button">
                    <Button
                        text="Continue"
                        style="default"
                        fill="text"
                        size="medium"
                        block
                        disabled
                    />
                </div>
            </div>
        );
    }

    // Official / Step 3b ("Add Your Details" - includes Institution Name field)
    if (type === 'official' && step === '3b') {
        return (
            <div className="login-portal-card">
                <div className="login-portal-header">
                    <p className="login-portal-header__title h1">Add Your Details</p>
                </div>

                <div style={{ display: 'flex', gap: 'var(--size-element-gap-lg)' }}>
                    <div style={{ flex: 1 }}>
                        <div className="login-field">
                            <div className="login-field__label body1-txt font-weight-semibold">
                                First Name <span className="login-field__required">*</span>
                            </div>
                            <Input label="First Name" required placeholder="First name..." showLabel={false} />
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div className="login-field">
                            <div className="login-field__label body1-txt font-weight-semibold">
                                Preferred Name
                            </div>
                            <Input label="Preferred Name" placeholder="Preferred name..." showLabel={false} />
                        </div>
                    </div>
                </div>

                <div className="login-field">
                    <div className="login-field__label body1-txt font-weight-semibold">
                        Last Name <span className="login-field__required">*</span>
                    </div>
                    <Input label="Last Name" required placeholder="Last name..." showLabel={false} />
                </div>

                <div className="login-field">
                    <div className="login-field__label body1-txt font-weight-semibold">
                        Institution Name <span className="login-field__required">*</span>
                    </div>
                    <Input
                        label="Institution Name"
                        required
                        showLabel={false}
                        placeholder="Add your institution name..."
                    />
                    <div className="login-field__caption body3-txt">
                        <i className="fa-solid fa-circle-info" aria-hidden="true" />
                        <span>
                            Are you a new tutor?{' '}
                            <button type="button" className="login-field__link">
                                Register With Institution
                            </button>
                            .
                        </span>
                    </div>
                </div>

                <div className="login-portal-terms">
                    <span className="login-portal-terms__checkbox" aria-hidden="true" />
                    <span className="login-portal-terms__text body2-txt">
                        I agree to the{' '}
                        <button type="button" className="login-portal-terms__link">
                            terms of use
                        </button>
                        .
                    </span>
                    <span className="login-portal-terms__required" aria-hidden="true">
                        *
                    </span>
                </div>

                <div className="login-portal-disabled-button">
                    <Button
                        text="Continue"
                        style="default"
                        fill="text"
                        size="medium"
                        block
                        disabled
                    />
                </div>
            </div>
        );
    }

    // Official / Step 1 ("Login")
    return (
        <div className="login-portal-card">
            {showAlert && <LoginAlertBanner>You have been logged out.</LoginAlertBanner>}

            <div className="login-portal-header">
                <p className="login-portal-header__title h1">Login</p>
                <p className="login-portal-header__subtitle body1-txt">
                    Double Math Learning with PLUS.
                </p>
            </div>

            <LoginAuthButtons />

            <LoginOrDivider text="or" />

            <Button text="Try a demo" style="primary" fill="tonal" size="medium" block />
        </div>
    );
}

LoginPortal.propTypes = {
    type: PropTypes.oneOf(['official', 'demo']),
    step: PropTypes.oneOf(['1', '2', '3a', '3b']),
    showAlert: PropTypes.bool,
};

