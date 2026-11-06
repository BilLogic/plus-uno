import React from 'react';
import PropTypes from 'prop-types';

import Button from '@/components/forms-and-inputs/Button';
import VerticalButton from '@/components/forms-and-inputs/VerticalButton';
import TextField from '@/components/forms-and-inputs/TextField/TextField';

import {
    LoginAlertBanner,
    LoginAuthButtons,
    LoginInstitutionField,
    LoginAccessCodeField,
    LoginOrDivider,
} from '@/specs/Login/Elements';

import './LoginPortal.scss';
import { iconClass } from '../../../../lib/icon';

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
                    <h1 className="login-portal-header__title h1">Demo</h1>
                    <p className="login-portal-header__subtitle body1-txt">
                        Are you joining as an admin, tutor or student?
                    </p>
                </div>

                <div className="login-portal-demo-role-buttons">
                    <VerticalButton icon="user-gear" label="Admin" />
                    <VerticalButton icon="chalkboard-user" label="Tutor" />
                </div>
                <div className="login-portal-disabled-button">
                    <Button
                        text="Log in"
                        appearance="subtle"
                        shouldFitContainer
                        isDisabled
                    />
                </div>

                <LoginOrDivider text="or" />

                <Button text="Back to log in portal" shouldFitContainer />
            </div>
        );
    }

    // Official / Step 2 ("New to PLUS?")
    if (type === 'official' && step === '2') {
        return (
            <div className="login-portal-card">
                <div className="login-portal-header">
                    <h1 className="login-portal-header__title h1">New to PLUS?</h1>
                </div>

                <LoginInstitutionField />
                <LoginAccessCodeField />

                <div className="login-portal-disabled-button">
                    <Button
                        text="Continue"
                        appearance="subtle"
                        shouldFitContainer
                        isDisabled
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
                    <h1 className="login-portal-header__title h1">Add Your Details</h1>
                </div>

                <div style={{ display: 'flex', gap: 'var(--stack-lg)' }}>
                    <div style={{ flex: 1 }}>
                        <div className="login-field">
                            <div className="login-field__label body1-txt font-weight-semibold">
                                First Name <span className="login-field__required">*</span>
                            </div>
                            <TextField
                                label="First Name"
                                isRequired
                                placeholder="First name..."
                                isLabelHidden
                            />
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div className="login-field">
                            <div className="login-field__label body1-txt font-weight-semibold">
                                Preferred Name
                            </div>
                            <TextField
                                label="Preferred Name"
                                placeholder="Preferred name..."
                                isLabelHidden
                            />
                        </div>
                    </div>
                </div>

                <div className="login-field">
                    <div className="login-field__label body1-txt font-weight-semibold">
                        Last Name <span className="login-field__required">*</span>
                    </div>
                    <TextField label="Last Name" isRequired placeholder="Last name..." isLabelHidden />
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
                        appearance="subtle"
                        shouldFitContainer
                        isDisabled
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
                    <h1 className="login-portal-header__title h1">Add Your Details</h1>
                </div>

                <div style={{ display: 'flex', gap: 'var(--stack-lg)' }}>
                    <div style={{ flex: 1 }}>
                        <div className="login-field">
                            <div className="login-field__label body1-txt font-weight-semibold">
                                First Name <span className="login-field__required">*</span>
                            </div>
                            <TextField label="First Name" isRequired placeholder="First name..." isLabelHidden />
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div className="login-field">
                            <div className="login-field__label body1-txt font-weight-semibold">
                                Preferred Name
                            </div>
                            <TextField label="Preferred Name" placeholder="Preferred name..." isLabelHidden />
                        </div>
                    </div>
                </div>

                <div className="login-field">
                    <div className="login-field__label body1-txt font-weight-semibold">
                        Last Name <span className="login-field__required">*</span>
                    </div>
                    <TextField label="Last Name" isRequired placeholder="Last name..." isLabelHidden />
                </div>

                <div className="login-field">
                    <div className="login-field__label body1-txt font-weight-semibold">
                        Institution Name <span className="login-field__required">*</span>
                    </div>
                    <TextField
                        label="Institution Name"
                        isRequired
                        isLabelHidden
                        placeholder="Add your institution name..."
                    />
                    <div className="login-field__caption body3-txt">
                        <i className={iconClass('circle-info')} aria-hidden="true" />
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
                        appearance="subtle"
                        shouldFitContainer
                        isDisabled
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
                <h1 className="login-portal-header__title h1">Login</h1>
                <p className="login-portal-header__subtitle body1-txt">
                    Double Math Learning with PLUS.
                </p>
            </div>

            <LoginAuthButtons />

            <LoginOrDivider text="or" />

            <Button text="Try a demo" shouldFitContainer />
        </div>
    );
}

LoginPortal.propTypes = {
    type: PropTypes.oneOf(['official', 'demo']),
    step: PropTypes.oneOf(['1', '2', '3a', '3b']),
    showAlert: PropTypes.bool,
};

