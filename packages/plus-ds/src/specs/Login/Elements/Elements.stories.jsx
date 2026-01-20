/**
 * Login Specs - Elements
 * 
 * Individual form elements and UI components used in login flows.
 * 
 * Components:
 * - InstitutionSelection: Dropdown for selecting institution
 * - AccessCodeForm: Form for entering access code
 * - LoginButtons: Action buttons (try demo, back, continue, log in)
 * - AuthButtons: Authentication provider buttons (Google, Clever)
 * - LoginFooter: Footer component for login pages
 * - LoginAlert: Alert component for login error messages
 */

import React, { useState } from 'react';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import Select from '@/forms/Select';
import Input from '@/forms/Input';
import OptionList from '@/forms/OptionList';
import Footer from '@/components/Footer';

import googleIcon from '@/assets/images/auth-providers/google-icon.svg';
import cleverImage from '@/assets/images/auth-providers/clever-image.png';

export default {
    title: 'Specs/Login/Elements',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Individual form elements and UI components used in login/authentication flows. These are the building blocks that make up the login cards and pages.',
            },
        },
    },
};

/**
 * Overview
 * All login elements and their purposes.
 */
export const Overview = () => (
    <div style={{
        padding: 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)',
        maxWidth: '800px'
    }}>
        <h2 className="h2" style={{ marginBottom: 'var(--size-section-pad-y-md)' }}>
            Login Elements
        </h2>

        <p className="body1-txt" style={{ marginBottom: 'var(--size-card-gap-lg)' }}>
            Individual form elements and UI components used in login flows.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-card-gap-md)' }}>
            {[
                { name: 'InstitutionSelection', desc: 'Dropdown for selecting institution with states: empty, filled, open, typing' },
                { name: 'AccessCodeForm', desc: 'Form for entering access code with default and invalid states' },
                { name: 'LoginButtons', desc: 'Action buttons: try demo, back, continue, log in (enabled/disabled)' },
                { name: 'AuthButtons', desc: 'Authentication provider buttons for Google and Clever' },
                { name: 'LoginFooter', desc: 'Footer component for login pages' },
                { name: 'LoginAlert', desc: 'Alert for login error messages and notifications' }
            ].map(item => (
                <div key={item.name} style={{
                    padding: 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)',
                    border: '1px solid var(--color-outline-variant)',
                    borderRadius: 'var(--size-card-radius-sm)',
                    backgroundColor: 'var(--color-surface-container)'
                }}>
                    <h4 className="h4" style={{ marginBottom: 'var(--size-element-gap-sm)' }}>{item.name}</h4>
                    <p className="body2-txt">{item.desc}</p>
                </div>
            ))}
        </div>
    </div>
);

/**
 * InstitutionSelection
 * Dropdown for selecting an institution.
 *
 * Matches the Figma spec for the institution selection input with four states:
 * - Empty (closed)
 * - Open (full list)
 * - Typing (filtered list)
 * - Filled (closed with selected value)
 *
 * This story is rendered as a non-interactive spec preview so that each state
 * is always visible. Runtime implementations should use the `Select` or
 * `Input` + `OptionList` patterns shown here.
 */
export const InstitutionSelection = () => {
    return (
        <div
            style={{
                padding: 'var(--size-section-pad-y-lg)',
                maxWidth: '420px'
            }}
        >
            <h6 className="h6" style={{ marginBottom: 'var(--size-section-pad-y-md)' }}>
                Institution Selection
            </h6>

            {/* Spec frame background to match Figma */}
            <div
                style={{
                    backgroundColor: 'var(--color-surface-container-high)',
                    padding: 'var(--size-section-pad-y-lg)',
                    borderRadius: 'var(--size-card-radius-sm)',
                    border: '1px dashed var(--color-outline-variant)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-section-gap-md)'
                }}
            >
                {/* Empty / closed state */}
                <div style={{ pointerEvents: 'none' }}>
                    <Input
                        id="institution-empty"
                        name="institution-empty"
                        label="Select your institution"
                        showLabel={false}
                        placeholder="Type or select your institution"
                        trailingVisual="dropdown"
                        size="medium"
                        style={{
                            // Match neutral surface + outline-variant border from tokens
                            backgroundColor: 'var(--color-surface)',
                        }}
                    />
                </div>

                {/* Open state with full list */}
                <div style={{ pointerEvents: 'none' }}>
                    <Input
                        id="institution-open"
                        name="institution-open"
                        label="Select your institution"
                        showLabel={false}
                        placeholder="Type or select your institution"
                        trailingVisual={<i className="fa-solid fa-caret-up" aria-hidden="true" />}
                        size="medium"
                        style={{
                            backgroundColor: 'var(--color-surface)',
                        }}
                    />
                    <div
                        style={{
                            marginTop: 'var(--size-element-gap-xs)',
                            backgroundColor: 'var(--color-surface-container)',
                            borderRadius: 'var(--size-modal-radius-sm)',
                            border: '1px solid var(--color-outline-variant)',
                            boxShadow: 'var(--elevation-light-2)',
                            maxHeight: '200px',
                            overflowY: 'auto'
                        }}
                    >
                        <OptionList
                            id="institution-open-options"
                            flush
                            options={[
                                'Aspen Heights Middle School',
                                'Aspen Heights High School',
                                'Bright Futures Academy',
                                'Brookfield Middle School',
                                'Cedar Valley Middle School',
                                'Clearwater Middle School',
                                'Eagle Ridge Intermediate School'
                            ]}
                            defaultValue={null}
                        />
                    </div>
                </div>

                {/* Typing state with filtered list */}
                <div style={{ pointerEvents: 'none' }}>
                    <Input
                        id="institution-typing"
                        name="institution-typing"
                        label="Select your institution"
                        showLabel={false}
                        value="Aspen"
                        placeholder="Type or select your institution"
                        trailingVisual={<i className="fa-solid fa-caret-up" aria-hidden="true" />}
                        size="medium"
                        style={{
                            backgroundColor: 'var(--color-surface)',
                        }}
                        readOnly
                    />
                    <div
                        style={{
                            marginTop: 'var(--size-element-gap-xs)',
                            backgroundColor: 'var(--color-surface-container)',
                            borderRadius: 'var(--size-modal-radius-sm)',
                            border: '1px solid var(--color-outline-variant)',
                            boxShadow: 'var(--elevation-light-2)',
                            maxHeight: '120px',
                            overflowY: 'auto'
                        }}
                    >
                        <OptionList
                            id="institution-typing-options"
                            flush
                            options={[
                                'Aspen Heights Middle School',
                                'Aspen Heights High School'
                            ]}
                            defaultValue={null}
                        />
                    </div>
                </div>

                {/* Filled / closed state */}
                <div style={{ pointerEvents: 'none' }}>
                    <Input
                        id="institution-filled"
                        name="institution-filled"
                        label="Select your institution"
                        showLabel={false}
                        value="Aspen Heights Middle School"
                        placeholder="Type or select your institution"
                        trailingVisual="dropdown"
                        size="medium"
                        style={{
                            backgroundColor: 'var(--color-surface)',
                        }}
                        readOnly
                    />
                </div>
            </div>
        </div>
    );
};

/**
 * AccessCodeForm
 * Form for entering access code (default + invalid states).
 *
 * Matches the Figma spec for:
 * - Label: "Enter Your Access Code" with required asterisk
 * - Placeholder: "e.g., funny-walrus"
 * - Default caption with info icon
 * - Invalid state with red border and validation message
 */
export const AccessCodeForm = () => {
    return (
        <div
            style={{
                padding: 'var(--size-section-pad-y-lg)',
                // Spec rendering: keep states non-interactive (no hover/focus changes)
                pointerEvents: 'none'
            }}
        >
            <div style={{ marginBottom: 'var(--size-section-pad-y-md)', width: '100%' }}>
                <div className="body1-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    Enter Your Access Code{' '}
                    <span style={{ color: 'var(--color-danger)' }}>*</span>
                </div>

                <Input
                    id="login-access-code-default"
                    name="login-access-code-default"
                    label="Enter Your Access Code"
                    required
                    showLabel={false}
                    placeholder="e.g., funny-walrus"
                    trailingVisual={
                        <i
                            className="fa-solid fa-circle-info"
                            aria-hidden="true"
                            style={{ color: 'var(--color-primary)' }}
                        />
                    }
                />

                <div
                    className="body3-txt"
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 'var(--size-element-gap-sm)',
                        marginTop: 'var(--size-element-gap-sm)',
                        color: 'var(--color-on-surface-variant)'
                    }}
                >
                    <i className="fa-solid fa-circle-info" aria-hidden="true" />
                    <span>Please ask your institution admin for your access code.</span>
                </div>
            </div>

            <div style={{ width: '100%', marginTop: 'var(--size-section-pad-y-md)' }}>
                <div className="body1-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    Enter Your Access Code{' '}
                    <span style={{ color: 'var(--color-danger)' }}>*</span>
                </div>

                <Input
                    id="login-access-code-invalid"
                    name="login-access-code-invalid"
                    label="Enter Your Access Code"
                    required
                    showLabel={false}
                    placeholder="e.g., funny-walrus"
                    value="invalid-code"
                    trailingVisual="fa-solid fa-circle-info"
                    validation="invalid"
                    validationMessage="Invalid access code for the selected institution. Please try again or contact your institution's admin for help."
                    style={{
                        borderColor: 'var(--color-danger)',
                        borderWidth: '2px',
                    }}
                />
            </div>
        </div>
    );
};

/**
 * LoginButtons
 * Various action buttons used in login flows.
 */
export const LoginButtons = () => (
    <div
        style={{
            padding: 'var(--size-section-pad-y-lg)',
            maxWidth: '560px'
        }}
    >
        <h6 className="h6" style={{ marginBottom: '16px' }}>Login Action Buttons</h6>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Try a demo - primary tonal (state-08) with primary text */}
            <Button
                text="Try a demo"
                style="primary"
                fill="tonal"
                block
            />

            {/* Back to log in portal - primary tonal */}
            <Button
                text="Back to log in portal"
                style="primary"
                fill="tonal"
                block
            />

            {/* Continue - enabled state */}
            <Button
                text="Continue"
                style="primary"
                fill="tonal"
                block
            />

            {/* Continue - disabled state
                Figma: bg = state-layers/on-surface/opacity-0_12,
                text = on-surface-variant @ 38% */}
            <div
                style={{
                    backgroundColor: 'var(--color-on-surface-state-12)',
                    borderRadius: 'var(--size-element-radius-md)',
                    opacity: 'var(--color-disabled-opacity)',
                }}
            >
                <Button
                    text="Continue"
                    style="default"
                    fill="text"
                    block
                    disabled
                />
            </div>

            {/* Log in - primary filled */}
            <Button
                text="Log in"
                style="primary"
                fill="filled"
                block
            />

            {/* Log in - disabled state
                Figma: bg = state-layers/on-surface/opacity-0_12,
                text = secondary text @ 38% */}
            <div
                style={{
                    backgroundColor: 'var(--color-on-surface-state-12)',
                    borderRadius: 'var(--size-element-radius-md)',
                    opacity: 'var(--color-disabled-opacity)',
                }}
            >
                <Button
                    text="Log in"
                    style="secondary"
                    fill="text"
                    block
                    disabled
                />
            </div>
        </div>
    </div>
);

/**
 * AuthButtons
 * Authentication provider buttons (Google, Clever).
 *
 * Uses dedicated auth provider images from `/assets/images/auth-providers`
 * to closely match the Figma spec.
 */
export const AuthButtons = () => (
    <div
        style={{
            padding: 'var(--size-section-pad-y-lg)',
        }}
    >
        <h6 className="h6" style={{ marginBottom: 'var(--size-section-pad-y-md)' }}>
            Authentication Provider Buttons
        </h6>

        {/* Spec frame to mirror Figma auth section */}
        <div
            style={{
                backgroundColor: 'var(--color-surface-container-high)',
                padding: 'var(--size-section-pad-y-md)',
                borderRadius: 'var(--size-card-radius-sm)',
                border: '1px dashed var(--color-outline-variant)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-element-gap-md)',
                maxWidth: '420px',
            }}
        >
            {/* Google - outline primary with Google SVG icon */}
            <Button
                text="Continue with Google"
                style="primary"
                fill="outline"
                size="medium"
                block
                leadingVisual={
                    <img
                        src={googleIcon}
                        alt="Google"
                        style={{ width: 24, height: 24 }}
                    />
                }
            />

            {/* Clever - custom filled button where the image sits in the middle
                and the rest of the button is the same Clever blue */}
            <div
                style={{
                    width: '100%',
                    backgroundColor: '#2e76ff',
                    borderRadius: 'var(--size-element-radius-md)',
                    border: 'var(--size-element-border) solid #2e76ff',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '40px',
                }}
            >
                <img
                    src={cleverImage}
                    alt="Log in with Clever"
                    style={{
                        display: 'block',
                        height: '100%',
                        width: 'auto',
                    }}
                />
            </div>
        </div>
    </div>
);

/**
 * LoginAlert
 * Alert component for login messages.
 */
export const LoginAlert = () => (
    <div
        style={{
            padding: 'var(--size-section-pad-y-lg)',
            maxWidth: '546px',
        }}
    >
        <h6
            className="h6"
            style={{ marginBottom: 'var(--size-section-pad-y-md)' }}
        >
            Login Alert
        </h6>
        <Alert style="primary" dismissable>
            You have been logged out.
        </Alert>
    </div>
);

/**
 * LoginFooter
 * Footer component for login pages.
 */
export const LoginFooterComponent = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Login Footer</h6>
        <div style={{
            backgroundColor: 'var(--color-surface-container)',
            padding: 'var(--size-section-pad-y-md)'
        }}>
            <Footer
                version="v5.2.0"
                copyright="Copyright © Carnegie Mellon University 2024"
                termsText="Terms of Use"
                termsUrl="#"
            />
        </div>
    </div>
);
